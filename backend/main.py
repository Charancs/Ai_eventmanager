import os
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from datetime import datetime, date, timedelta
import uvicorn
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import our vector database
from vector import vector_db

app = FastAPI(
    title="AI Event Manager API",
    description="Backend API for AI-powered event management system",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Constants
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Pydantic models
class ChatQuery(BaseModel):
    query: str
    user_id: int
    role: str

class ContextChatQuery(BaseModel):
    query: str
    user_id: str
    role: str
    department: str
    subject: Optional[str] = None
    search_scope: Optional[str] = "all"  # "all", "department", "subject", "general"

class ChatResponse(BaseModel):
    response: str
    sources_count: int
    source_documents: List[dict] = []
    search_context: Optional[dict] = {}
    context_breakdown: Optional[dict] = {}

class DocumentInfo(BaseModel):
    document_id: str
    chunk_count: int
    text_length: int
    created_at: str

class DepartmentEventQuery(BaseModel):
    query: str
    user_id: str
    role: str
    department: str

# Event extraction models for AI processing
class ExtractedEvent(BaseModel):
    """Model for a single extracted event"""
    document_title: str = Field(description="Title of the event")
    event_date: Optional[str] = Field(None, description="Event date in YYYY-MM-DD format, or None if not found")
    event_time: Optional[str] = Field(None, description="Event time in HH:MM format, or None if not found")
    location: Optional[str] = Field(None, description="Event location or venue, or None if not found")
    related_information: str = Field(description="Main content/description of the event")

class ExtractedEvents(BaseModel):
    """Model for multiple extracted events from a document"""
    events: List[ExtractedEvent] = Field(description="List of all events found in the document")

# Import event database
from event_database import event_db

# AI Event Extraction Function
async def extract_events_from_text(text: str, document_title: str) -> List[dict]:
    """Extract structured event data from text using OpenAI with structured output"""
    from openai import OpenAI
    
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    prompt = f"""
    Analyze the following document text and extract all event information. 
    Document title: {document_title}
    
    For each event found, extract:
    - document_title: Use the provided document title
    - event_date: Date in YYYY-MM-DD format (if found)
    - event_time: Time in HH:MM format (if found) 
    - location: Event venue/location (if mentioned)
    - related_information: Main description/content of the event
    
    If no events are found, return an empty events list.
    If multiple events are in the document, extract each one separately.
    
    Document text:
    {text[:4000]}  # Limit text to avoid token limits
    """
    
    try:
        response = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert at extracting event information from documents. Extract all events with their dates, times, locations, and descriptions."},
                {"role": "user", "content": prompt}
            ],
            response_format=ExtractedEvents,
            temperature=0.1
        )
        
        parsed_events = response.choices[0].message.parsed
        return [event.dict() for event in parsed_events.events] if parsed_events else []
        
    except Exception as e:
        print(f"Error extracting events with AI: {e}")
        # Fallback: create a basic event from the document
        return [{
            "document_title": document_title,
            "event_date": None,
            "event_time": None, 
            "location": None,
            "related_information": text[:500]  # First 500 chars as description
        }]

@app.get("/")
async def root():
    return {"message": "AI Event Manager API is running!"}

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    user_id: str = Form(...),  # Changed to str to match frontend
    role: str = Form(...),
    department: str = Form(None),  # Optional parameter
    subject: str = Form(None)      # Optional parameter
):
    """Upload and process document for vector database creation"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file selected")
        
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file_extension} not allowed. Allowed types: {list(ALLOWED_EXTENSIONS)}"
            )
        
        # Check file size
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
        
        # Save uploaded file temporarily
        temp_file_path = UPLOAD_DIR / f"temp_{user_id}_{role}_{file.filename}"
        with open(temp_file_path, "wb") as f:
            f.write(contents)
        
        try:
            # Process document using our vector database
            result = vector_db.process_document(
                file_path=str(temp_file_path),
                user_id=user_id,  # Already string now
                role=role,
                department=department or "General",
                filename=file.filename,
                title=title,
                subject=subject
            )
            
            return {
                "success": True,
                "message": "Document uploaded and processed successfully",
                "data": result
            }
            
        finally:
            # Clean up temporary file
            if temp_file_path.exists():
                temp_file_path.unlink()
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up temporary file on error
        if 'temp_file_path' in locals() and temp_file_path.exists():
            temp_file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@app.post("/api/college-events/upload")
async def upload_college_event_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    user_id: str = Form(...),
    role: str = Form(...),
    event_type: str = Form("college"),  # Always 'college' for college events uploaded by admins
    event_date: str = Form(None),  # Optional event date
    event_time: str = Form(None),  # Optional event time
    location: str = Form(None),    # Optional location
    description: str = Form(None)  # Optional description
):
    """Upload and process college event document - only for admin, teacher, department roles"""
    try:
        # Debug logging
        print(f"Upload attempt - Role: '{role}', User ID: '{user_id}', Title: '{title}'")
        
        # Check if user can upload college event documents (case-insensitive)
        allowed_roles = ["admin", "teacher", "department", "department_admin"]
        if role.lower().strip() not in allowed_roles:
            print(f"Role check failed: '{role}' not in {allowed_roles}")
            raise HTTPException(
                status_code=403, 
                detail=f"Only admin, teacher, and department users can upload college event documents. Your role: '{role}'"
            )
        
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file selected")
        
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file_extension} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Check file size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
        # Save temporary file
        temp_file_path = UPLOAD_DIR / f"temp_{file.filename}"
        with open(temp_file_path, "wb") as temp_file:
            temp_file.write(content)
        
        try:
            # Process college event document
            result = vector_db.process_college_event_document(
                file_path=str(temp_file_path),
                user_id=user_id,
                role=role,
                filename=file.filename,
                title=title,
                event_type=event_type
            )
            
            # Extract text content for AI processing
            text_content = vector_db.extract_text_from_document(str(temp_file_path))
            
            # Create event data from form inputs or AI extraction
            if event_date or event_time or location:
                # Use form data when provided
                event_data = {
                    'document_title': title,
                    'related_information': description or title,
                    'event_date': event_date,
                    'event_time': event_time,
                    'location': location,
                    'document_id': result["document_id"],
                    'document_path': str(temp_file_path.name)
                }
                
                # Store in admin events table (college events)
                event_id = event_db.store_admin_event(event_data)
                stored_events = []
                if event_id:
                    stored_events.append({
                        'event_id': event_id,
                        'document_title': event_data.get('document_title'),
                        'event_date': event_data.get('event_date'),
                        'event_time': event_data.get('event_time'),
                        'location': event_data.get('location')
                    })
            else:
                # Fall back to AI extraction for events from document content
                extracted_events = await extract_events_from_text(text_content, title)
                
                # Store extracted events in database
                stored_events = []
                for event_data in extracted_events:
                    # Add document metadata
                    event_data.update({
                        'document_id': result["document_id"],
                        'document_path': str(temp_file_path.name)  # Store relative path
                    })
                    
                    # Store in admin events table (college events)
                    event_id = event_db.store_admin_event(event_data)
                    if event_id:
                        stored_events.append({
                            'event_id': event_id,
                            'document_title': event_data.get('document_title'),
                            'event_date': event_data.get('event_date'),
                            'event_time': event_data.get('event_time'),
                            'location': event_data.get('location')
                        })
            
            
            return {
                "message": "College event document uploaded and processed successfully",
                "document_id": result["document_id"],
                "chunk_count": result["chunk_count"],
                "text_length": result["text_length"],
                "event_type": event_type,
                "storage_location": "college_events/vector_database",
                "extracted_events": len(stored_events),
                "events": stored_events
            }
            
        finally:
            # Clean up temporary file
            if temp_file_path.exists():
                temp_file_path.unlink()
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up temporary file on error
        if 'temp_file_path' in locals() and temp_file_path.exists():
            temp_file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@app.post("/api/documents/chat", response_model=ChatResponse)
async def chat_with_documents(query_data: ChatQuery):
    """Chat with documents using vector similarity search (legacy endpoint)"""
    try:
        # Convert to string user_id and provide default department
        user_id_str = str(query_data.user_id)
        default_department = "Computer Science" if query_data.role != "admin" else "admin"
        
        # Get relevant chunks from vector database
        relevant_chunks = vector_db.query_documents(
            query=query_data.query,
            user_id=user_id_str,
            role=query_data.role,
            department=default_department,
            top_k=5
        )
        
        # Generate response using OpenAI
        result = vector_db.generate_response(
            query=query_data.query,
            context_chunks=relevant_chunks
        )
        
        return ChatResponse(
            response=result["response"],
            sources_count=result["sources_count"],
            source_documents=result["source_documents"],
            search_context=result.get("search_context", {}),
            context_breakdown=result.get("context_breakdown", {})
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.post("/api/documents/chat-context", response_model=ChatResponse)
async def chat_with_context(query_data: ContextChatQuery):
    """Enhanced chat with documents using context-aware similarity search"""
    try:
        # Get relevant chunks from vector database with context
        relevant_chunks = vector_db.query_documents(
            query=query_data.query,
            user_id=query_data.user_id,
            role=query_data.role,
            department=query_data.department,
            subject=query_data.subject,
            search_scope=query_data.search_scope,
            top_k=5
        )
        
        # Prepare search context for response generation
        search_context = {
            "scope": query_data.search_scope,
            "department": query_data.department,
            "subject": query_data.subject
        }
        
        # Generate response using OpenAI with context
        result = vector_db.generate_response(
            query=query_data.query,
            context_chunks=relevant_chunks,
            search_context=search_context
        )
        
        return ChatResponse(
            response=result["response"],
            sources_count=result["sources_count"],
            source_documents=result["source_documents"],
            search_context=result.get("search_context", {}),
            context_breakdown=result.get("context_breakdown", {})
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Context chat error: {str(e)}")

class CollegeEventQuery(BaseModel):
    query: str
    user_id: str = "anonymous"
    role: str = "student"
    filter_department: Optional[str] = None

@app.post("/api/college-events/chat", response_model=ChatResponse)
async def chat_with_college_events(query_data: CollegeEventQuery):
    """Chat with college event documents - accessible to all users"""
    
    # Extract data from the properly typed request
    query = query_data.query
    user_id = query_data.user_id
    role = query_data.role
    filter_department = query_data.filter_department
    
    try:
        # Get relevant chunks from college events vector database
        relevant_chunks = vector_db.query_college_events(
            query=query,
            top_k=5,
            department_filter=filter_department
        )
        
        # Prepare search context for college events
        search_context = {
            "scope": "college_events",
            "accessible_to": "all_users",
            "storage_type": "college_event",
            "department_filter": filter_department
        }
        
        # Generate response using OpenAI with context
        result = vector_db.generate_response(
            query=query,
            context_chunks=relevant_chunks,
            search_context=search_context
        )
        
        return ChatResponse(
            response=result["response"],
            sources_count=result["sources_count"],
            source_documents=result["source_documents"],
            search_context=result.get("search_context", {}),
            context_breakdown=result.get("context_breakdown", {})
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"College events chat error: {str(e)}")

@app.get("/api/documents/index")
async def get_document_index(department: str = None, subject: str = None):
    """Get document index for browsing available documents"""
    try:
        index = vector_db.get_document_index(department=department, subject=subject)
        return {
            "success": True,
            "data": index
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting document index: {str(e)}")

@app.get("/api/documents/contexts")
async def get_available_contexts(user_id: str, role: str, department: str):
    """Get available contexts (subjects) for a department"""
    try:
        # Get the document index for the department
        index = vector_db.get_document_index(department=department)
        
        contexts = {
            "department": department,
            "general_documents": 0,
            "subjects": {}
        }
        
        if "data" in index:
            dept_data = index["data"]
            contexts["general_documents"] = len(dept_data.get("general", []))
            
            for subject, documents in dept_data.get("subjects", {}).items():
                contexts["subjects"][subject] = len(documents)
        
        return {
            "success": True,
            "data": contexts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting contexts: {str(e)}")

@app.get("/api/documents/list")
async def get_user_documents(user_id: str, role: str, department: str = "Computer Science"):
    """Get all documents for a specific user"""
    try:
        documents = vector_db.get_user_documents(user_id, role, department)
        return {
            "success": True,
            "data": documents,
            "count": len(documents)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching documents: {str(e)}")

@app.delete("/api/documents/delete/{document_id}")
async def delete_document(document_id: str, user_id: str, role: str, department: str = "Computer Science"):
    """Delete a document and its vector database files"""
    try:
        success = vector_db.delete_document(document_id, user_id, role, department)
        
        if success:
            return {
                "success": True,
                "message": "Document deleted successfully"
            }
        else:
            raise HTTPException(status_code=404, detail="Document not found or already deleted")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "API is running normally",
        "vector_db": "initialized"
    }

# Simplified stats endpoint
@app.get("/api/stats")
async def get_stats():
    """Get basic system statistics"""
    return {
        "users": {
            "students": 150,
            "teachers": 12,
            "admins": 2
        },
        "departments": 3,
        "events": 5,
        "notifications": {
            "pending": 2,
            "total": 8
        }
    }

# College events endpoints
@app.get("/api/college-events/list")
async def get_college_events():
    """Get list of available college event documents"""
    try:
        storage_paths = vector_db._get_college_event_storage_path()
        index_path = storage_paths['indexes'] / "college_events_index.pkl"
        
        if index_path.exists():
            import pickle
            with open(index_path, 'rb') as f:
                events_index = pickle.load(f)
            
            # Transform event_type to eventType for frontend compatibility
            transformed_events = []
            for event in events_index.get("events", []):
                # Get the stored filename (with UUID prefix)
                original_filename = event.get('filename', '')
                document_id = event.get('document_id', '')
                stored_filename = f"{document_id}_{original_filename}" if document_id else original_filename
                
                transformed_event = {
                    "id": event.get("document_id", ""),
                    "title": event.get("title", ""),
                    "description": event.get("title", ""),  # Using title as description if not available
                    "eventType": event.get("event_type", "general"),  # Transform snake_case to camelCase
                    "uploadDate": event.get("upload_date", ""),
                    "filename": original_filename,  # Display original filename to user
                    "fileUrl": f"/uploads/college_events/{stored_filename}"  # Use actual stored filename
                }
                transformed_events.append(transformed_event)
                
            return {
                "success": True,
                "events": transformed_events,
                "event_types": list(events_index.get("event_types", {}).keys()),
                "total_documents": len(transformed_events)
            }
        else:
            return {
                "success": True,
                "events": [],
                "event_types": [],
                "total_documents": 0
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching college events: {str(e)}")

# Minimal notifications endpoint
@app.get("/api/notifications/{user_id}")
async def get_user_notifications(user_id: int, limit: int = 5):
    """Get basic notifications for a user"""
    return []  # Empty for now, can be implemented later

@app.patch("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: int, user_id: int):
    """Mark a notification as read"""
    return {"success": True, "message": "Notification marked as read"}

@app.patch("/api/notifications/users/{user_id}/read-all")
async def mark_all_notifications_read(user_id: int):
    """Mark all notifications as read for a user"""
    return {"success": True, "message": "All notifications marked as read"}

@app.get("/api/notifications/{user_id}/stats")
async def get_notification_stats(user_id: int):
    """Get notification statistics for a user"""
    return {
        "total": 3,
        "unread": 2,
        "read": 1
    }

# Subject-related endpoints for document categorization
@app.get("/api/subjects/{department}")
async def get_subjects(department: str):
    """Get all subjects for a department"""
    # Mock subjects data - in real implementation this would come from database
    subjects_by_department = {
        "admin": [
            {"name": "Administrative Documents", "file_count": 15, "path": "admin/administrative"},
            {"name": "Policy Documents", "file_count": 8, "path": "admin/policies"},
            {"name": "Meeting Minutes", "file_count": 12, "path": "admin/meetings"}
        ],
        "Computer Science": [
            {"name": "Data Structures", "file_count": 5, "path": "cs/data_structures"},
            {"name": "Algorithms", "file_count": 8, "path": "cs/algorithms"},
            {"name": "Database Systems", "file_count": 6, "path": "cs/database"},
            {"name": "Machine Learning", "file_count": 10, "path": "cs/ml"},
            {"name": "Software Engineering", "file_count": 7, "path": "cs/software_eng"}
        ],
        "Information Technology": [
            {"name": "Network Security", "file_count": 4, "path": "it/network_security"},
            {"name": "Web Development", "file_count": 9, "path": "it/web_dev"},
            {"name": "System Administration", "file_count": 3, "path": "it/sys_admin"}
        ]
    }
    
    department_subjects = subjects_by_department.get(department, [])
    
    return {
        "success": True,
        "department": department,
        "subjects": department_subjects
    }

@app.post("/api/subjects/create")
async def create_subject(
    subject_name: str = Form(...),
    department: str = Form(...)
):
    """Create a new subject for a department"""
    try:
        # In real implementation, this would create a database entry and file system folder
        new_subject = {
            "name": subject_name,
            "file_count": 0,
            "path": f"{department.lower().replace(' ', '_')}/{subject_name.lower().replace(' ', '_')}"
        }
        
        return {
            "success": True,
            "message": f"Subject '{subject_name}' created successfully",
            "subject": new_subject
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating subject: {str(e)}")

@app.post("/api/documents/upload-subject")
async def upload_document_subject(
    file: UploadFile = File(...),
    title: str = Form(...),
    user_id: str = Form(...),  # Changed to str to match frontend
    role: str = Form(...),
    department: str = Form(...),
    subject: str = Form(...)
):
    """Upload and process document for a specific subject"""
    try:
        # Validate user role - teachers, admins, and department users can upload subject documents
        allowed_roles = ["admin", "teacher", "department", "department_admin"]
        if role.lower().strip() not in allowed_roles:
            raise HTTPException(
                status_code=403, 
                detail=f"Only admin, teacher, and department users can upload subject documents. Your role: '{role}'"
            )

        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file selected")
        
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file_extension} not allowed. Allowed types: {list(ALLOWED_EXTENSIONS)}"
            )
        
        # Check file size
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
        
        # Create subject-specific path for storage
        subject_path = f"{department}_{subject}".replace(" ", "_").lower()
        temp_file_path = UPLOAD_DIR / f"temp_{user_id}_{role}_{subject_path}_{file.filename}"
        
        with open(temp_file_path, "wb") as f:
            f.write(contents)
        
        try:
            # Process document using our vector database with subject metadata
            result = vector_db.process_document(
                file_path=str(temp_file_path),
                user_id=user_id,  # Already string now
                role=role,
                department=department,
                filename=file.filename,
                title=title,
                subject=subject
            )
            
            return {
                "success": True,
                "message": f"Document uploaded and processed successfully for {subject}",
                "data": result
            }
            
        finally:
            # Clean up temporary file
            if temp_file_path.exists():
                temp_file_path.unlink()
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up temporary file on error
        if 'temp_file_path' in locals() and temp_file_path.exists():
            temp_file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

# Subject Documents Chat Endpoint
@app.post("/api/subject-documents/chat", response_model=ChatResponse)
async def chat_with_subject_documents(query_data: ContextChatQuery):
    """Chat with subject-specific documents - accessible to teachers, students, and department admins"""
    try:
        # Validate user has access to subject documents
        allowed_roles = ["admin", "teacher", "student", "department_admin", "department"]
        if query_data.role.lower().strip() not in allowed_roles:
            raise HTTPException(
                status_code=403, 
                detail=f"Access denied. Your role: '{query_data.role}'. Only admin, teacher, student, and department users can query subject documents."
            )
        
        query = query_data.query
        user_id = query_data.user_id
        role = query_data.role
        department = query_data.department
        subject = query_data.subject
        
        if not subject:
            raise HTTPException(status_code=400, detail="Subject is required for subject document queries")
        
        print(f"Subject documents chat request: {query} for subject: {subject} in department: {department}")
        
        # Get relevant chunks from subject documents vector database
        relevant_chunks = vector_db.query_documents(
            query=query,
            user_id=user_id,
            role=role,
            department=department,
            subject=subject,
            search_scope="subject",
            top_k=5
        )
        
        # Prepare search context for subject documents
        search_context = {
            "scope": "subject_documents",
            "department": department,
            "subject": subject,
            "chunks_found": len(relevant_chunks),
            "query": query,
            "user_role": role
        }
        
        if not relevant_chunks:
            response_text = f"I don't have any specific information about '{query}' in the {subject} subject documents for {department} department. Please contact your department or upload relevant course materials for this subject."
        else:
            # Generate response using OpenAI with context
            result = vector_db.generate_response(
                query=query,
                context_chunks=relevant_chunks,
                search_context=search_context
            )
            response_text = result["response"]
            search_context["source_documents"] = result.get("source_documents", [])
        
        return ChatResponse(
            response=response_text,
            sources_count=len(relevant_chunks),
            source_documents=relevant_chunks,
            search_context=search_context
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Subject documents chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Subject documents chat error: {str(e)}")

@app.get("/api/subject-documents/list/{department}/{subject}")
async def get_subject_documents(department: str, subject: str):
    """Get list of documents for a specific subject"""
    try:
        # Get documents from vector database for the specific subject
        documents = vector_db.get_user_documents(
            user_id="all",  # Get all documents for the subject
            role="teacher", 
            department=department
        )
        
        # Filter documents by subject
        subject_documents = [doc for doc in documents if doc.get("subject") == subject]
        
        # Transform for frontend compatibility
        transformed_docs = []
        for doc in subject_documents:
            transformed_doc = {
                "id": doc.get("document_id", ""),
                "title": doc.get("title", ""),
                "filename": doc.get("filename", ""),
                "department": doc.get("department", department),
                "subject": doc.get("subject", subject),
                "uploadDate": doc.get("upload_date", ""),
                "uploadedBy": doc.get("uploaded_by", ""),
                "fileSize": doc.get("file_size", 0),
                "fileUrl": f"/uploads/subject_documents/{department.replace(' ', '')}/{subject.replace(' ', '_')}/{doc.get('filename', '')}"
            }
            transformed_docs.append(transformed_doc)
        
        return {
            "success": True,
            "department": department,
            "subject": subject,
            "documents": transformed_docs,
            "total_documents": len(transformed_docs)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching subject documents: {str(e)}")

@app.get("/api/subjects/list/{department}")
async def get_department_subjects_with_counts(department: str):
    """Get subjects for a department with document counts"""
    try:
        # Get all documents for the department
        all_docs = vector_db.get_user_documents(
            user_id="all",
            role="teacher",
            department=department
        )
        
        # Group by subject and count
        subject_counts = {}
        for doc in all_docs:
            subject = doc.get("subject")
            if subject:
                if subject not in subject_counts:
                    subject_counts[subject] = {
                        "name": subject,
                        "file_count": 0,
                        "path": f"{department.lower().replace(' ', '_')}/{subject.lower().replace(' ', '_')}"
                    }
                subject_counts[subject]["file_count"] += 1
        
        subjects_list = list(subject_counts.values())
        
        return {
            "success": True,
            "department": department,
            "subjects": subjects_list,
            "total_subjects": len(subjects_list)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching subjects: {str(e)}")

# Department Events endpoints
@app.post("/api/department-events/upload")
async def upload_department_event(
    file: UploadFile = File(...),
    title: str = Form(...),
    user_id: str = Form(...),
    role: str = Form(...),
    department: str = Form(...),
    event_type: str = Form("department"),  # Always 'department' for department events
    event_date: str = Form(None),  # Optional event date
    event_time: str = Form(None),  # Optional event time
    location: str = Form(None),    # Optional location
    description: str = Form(None)  # Optional description
):
    """Upload and process department event document"""
    try:
        # Validate user role - only department users can upload to their department
        if role not in ["admin", "teacher", "department", "DEPARTMENT_ADMIN"]:
            raise HTTPException(status_code=403, detail="Only admin, teacher, and department users can upload department event documents")
        
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file selected")
        
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file_extension} not allowed. Allowed types: {list(ALLOWED_EXTENSIONS)}"
            )
        
        # Check file size
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
        
        # Save uploaded file temporarily
        temp_file_path = UPLOAD_DIR / f"temp_dept_{user_id}_{role}_{file.filename}"
        
        with open(temp_file_path, "wb") as f:
            f.write(contents)
        
        try:
            # Process document using our vector database
            result = vector_db.process_department_event_document(
                file_path=str(temp_file_path),
                user_id=user_id,
                role=role,
                title=title,
                event_type=event_type,
                department=department
            )
            
            # Extract text content for AI processing
            text_content = vector_db.extract_text_from_document(str(temp_file_path))
            
            # Create event data from form inputs or AI extraction
            if event_date or event_time or location:
                # Use form data when provided
                event_data = {
                    'document_title': title,
                    'related_information': description or title,
                    'event_date': event_date,
                    'event_time': event_time,
                    'location': location,
                    'document_id': result["document_id"],
                    'document_path': str(temp_file_path.name)
                }
                
                # Store in department events table
                event_id = event_db.store_department_event(department, event_data)
                stored_events = []
                if event_id:
                    stored_events.append({
                        'event_id': event_id,
                        'document_title': event_data.get('document_title'),
                        'event_date': event_data.get('event_date'),
                        'event_time': event_data.get('event_time'),
                        'location': event_data.get('location')
                    })
            else:
                # Fall back to AI extraction for events from document content
                extracted_events = await extract_events_from_text(text_content, title)
                
                # Store extracted events in database
                stored_events = []
                for event_data in extracted_events:
                    # Add document metadata
                    event_data.update({
                        'document_id': result["document_id"],
                        'document_path': str(temp_file_path.name)  # Store relative path
                    })
                    
                    # Store in department events table
                    event_id = event_db.store_department_event(department, event_data)
                    if event_id:
                        stored_events.append({
                            'event_id': event_id,
                            'document_title': event_data.get('document_title'),
                            'event_date': event_data.get('event_date'),
                            'event_time': event_data.get('event_time'),
                            'location': event_data.get('location')
                        })
            
            return {
                "success": True,
                "document_id": result["document_id"],
                "message": result["message"],
                "chunks_created": result["chunks_count"],
                "department": department,
                "event_type": event_type,
                "storage_location": f"{department}_events/vector_database",
                "extracted_events": len(stored_events),
                "events": stored_events
            }
            
        finally:
            # Clean up temporary file
            if temp_file_path.exists():
                temp_file_path.unlink()
                
    except HTTPException:
        raise
    except Exception as e:
        # Clean up temporary file in case of error
        if 'temp_file_path' in locals() and temp_file_path.exists():
            temp_file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Upload processing failed: {str(e)}")

@app.post("/api/department-events/chat", response_model=ChatResponse)
async def chat_with_department_events(query_data: DepartmentEventQuery):
    """Chat with AI using department-specific events as context"""
    try:
        query = query_data.query
        user_id = query_data.user_id
        role = query_data.role
        department = query_data.department
        
        print(f"Department events chat request: {query} for department: {department}")
        
        # Get relevant chunks from department events vector database
        relevant_chunks = vector_db.query_department_events(
            query=query,
            department=department,
            top_k=5
        )
        
        # Prepare search context for department events
        search_context = {
            "scope": "department_events",
            "department": department,
            "chunks_found": len(relevant_chunks),
            "query": query,
            "user_role": role
        }
        
        if not relevant_chunks:
            response_text = f"I don't have any specific information about '{query}' in {department} department events. Please contact your department administration for more details about {department} department activities and events."
        else:
            # Build context from relevant chunks
            context_parts = []
            source_docs = []
            
            for chunk in relevant_chunks:
                context_parts.append(f"From {chunk['title']} ({chunk['event_type']}): {chunk['content']}")
                source_docs.append({
                    "title": chunk['title'],
                    "event_type": chunk['event_type'],
                    "score": chunk['score'],
                    "document_id": chunk['document_id'],
                    "department": chunk['department']
                })
            
            # Create prompt for OpenAI
            context = "\n\n".join(context_parts)
            prompt = f"""You are an AI assistant for {department} department events. Based on the following department event documents, answer the user's question about {department} department activities, events, announcements, or schedules.

Department Event Documents:
{context}

User Question: {query}

Please provide a helpful and informative response based on the {department} department event information above. If the information doesn't fully answer the question, acknowledge what you can provide and suggest contacting the {department} department administration for additional details."""

            # Get response from OpenAI
            from openai import OpenAI
            openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            
            response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7
            )
            
            response_text = response.choices[0].message.content
            search_context["source_documents"] = source_docs
        
        return ChatResponse(
            response=response_text,
            sources_count=len(relevant_chunks),
            source_documents=relevant_chunks,
            search_context=search_context
        )
        
    except Exception as e:
        print(f"Department events chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Department events chat error: {str(e)}")

@app.get("/api/department-events/list/{department}")
async def get_department_events(department: str):
    """Get list of available department event documents"""
    try:
        documents = vector_db.list_department_events(department)
        
        # Transform event_type to eventType for frontend compatibility
        transformed_events = []
        for doc in documents:
            # Get the stored filename (with UUID prefix) for department events
            original_filename = doc.get("filename", "")
            document_id = doc.get("document_id", "")
            stored_filename = f"{document_id}_{original_filename}" if document_id else original_filename
            
            transformed_event = {
                "id": doc.get("document_id", ""),
                "title": doc.get("title", ""),
                "description": doc.get("title", ""),  # Using title as description if not available
                "eventType": doc.get("event_type", "general"),  # Transform snake_case to camelCase
                "department": doc.get("department", department),
                "uploadDate": doc.get("upload_date", ""),
                "filename": original_filename,  # Display original filename to user
                "fileUrl": f"/uploads/department_events/{department.replace(' ', '')}/{stored_filename}"  # Correct department path structure
            }
            transformed_events.append(transformed_event)
        
        return {
            "success": True,
            "department": department,
            "events": transformed_events,
            "total_documents": len(transformed_events)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching department events: {str(e)}")

# Departments endpoints
@app.get("/api/departments")
async def list_departments(active_only: bool = True):
    """List all departments"""
    departments = [
        {
            "id": 1,
            "name": "Computer Science",
            "code": "CSE",
            "description": "Department of Computer Science and Engineering",
            "head_name": "Dr. John Smith",
            "active": True
        },
        {
            "id": 2,
            "name": "Information Technology",
            "code": "IT",
            "description": "Department of Information Technology",
            "head_name": "Dr. Jane Doe",
            "active": True
        },
        {
            "id": 3,
            "name": "Electronics",
            "code": "ECE",
            "description": "Department of Electronics and Communication",
            "head_name": "Dr. Bob Wilson",
            "active": True
        },
        {
            "id": 4,
            "name": "Mechanical",
            "code": "MECH",
            "description": "Department of Mechanical Engineering",
            "head_name": "Dr. Alice Brown",
            "active": True
        },
        {
            "id": 5,
            "name": "Civil",
            "code": "CIVIL",
            "description": "Department of Civil Engineering",
            "head_name": "Dr. Charlie Davis",
            "active": True
        }
    ]
    
    if active_only:
        departments = [d for d in departments if d["active"]]
    
    return {
        "success": True,
        "departments": departments
    }

@app.get("/api/departments/{department_id}")
async def get_department(department_id: int):
    """Get department details"""
    departments = {
        1: {"id": 1, "name": "Computer Science", "students": 150, "faculty": 12},
        2: {"id": 2, "name": "Information Technology", "students": 120, "faculty": 10},
        3: {"id": 3, "name": "Electronics", "students": 100, "faculty": 8}
    }
    
    if department_id not in departments:
        raise HTTPException(status_code=404, detail="Department not found")
    
    return departments[department_id]

# Event Notifications Endpoints
@app.get("/api/notifications/events/upcoming")
async def get_upcoming_events_notifications(days_ahead: int = 2, department: str = None):
    """Get upcoming events (today + 2 days) as notifications with department filtering for admins"""
    try:
        upcoming_events = event_db.get_upcoming_events(days_ahead=days_ahead)
        
        # Format notifications
        notifications = []
        
        # Add college events notifications
        college_events = upcoming_events.get('college_events', [])
        if not department or department == 'all' or department == 'college':
            for event in college_events:
                notifications.append({
                    'id': f"college_event_{event['id']}",
                    'type': 'college_event',
                    'title': event['document_title'] or 'College Event',
                    'message': event['related_information'][:200] + '...' if len(event.get('related_information', '')) > 200 else event.get('related_information', 'Event notification'),
                    'event_date': event['event_date'],
                    'event_time': event['event_time'],
                    'location': event['location'],
                    'document_path': event.get('document_path'),
                    'document_id': event['document_id'],
                    'created_at': event['created_at'],
                    'priority': 'high' if event['event_date'] == str(datetime.now().date()) else 'medium'
                })
        
        # Add department events notifications
        department_events = upcoming_events.get('department_events', {})
        
        for dept_name, events in department_events.items():
            # Apply department filter if specified
            if department and department != 'all' and department != 'college' and department != dept_name:
                continue
                
            for event in events:
                notifications.append({
                    'id': f"dept_event_{event['id']}",
                    'type': 'department_event',
                    'department': dept_name,
                    'title': event['document_title'] or f'{dept_name} Event',
                    'message': event['related_information'][:200] + '...' if len(event.get('related_information', '')) > 200 else event.get('related_information', 'Event notification'),
                    'event_date': event['event_date'],
                    'event_time': event['event_time'],
                    'location': event['location'],
                    'document_path': event.get('document_path'),
                    'document_id': event['document_id'],
                    'created_at': event['created_at'],
                    'priority': 'high' if event['event_date'] == str(datetime.now().date()) else 'medium'
                })
        
        # Sort by date and time
        notifications.sort(key=lambda x: (x['event_date'] or '9999-12-31', x['event_time'] or '23:59'))
        
        return {
            'success': True,
            'total_notifications': len(notifications),
            'today_events': len([n for n in notifications if n['event_date'] == str(datetime.now().date())]),
            'upcoming_events': len([n for n in notifications if n['event_date'] > str(datetime.now().date())]),
            'notifications': notifications,
            'filtered_by_department': department if department and department != 'all' else None
        }
        
    except Exception as e:
        print(f"Error getting upcoming events notifications: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching notifications: {str(e)}")

@app.get("/api/notifications/events/today")
async def get_today_events_notifications():
    """Get today's events as notifications"""
    try:
        upcoming_events = event_db.get_upcoming_events(days_ahead=0)  # Only today
        
        notifications = []
        today_str = str(datetime.now().date())
        
        # Filter only today's events
        for event in upcoming_events.get('college_events', []):
            if event['event_date'] == today_str:
                notifications.append({
                    'id': f"college_event_{event['id']}",
                    'type': 'college_event',
                    'title': event['document_title'] or 'College Event Today',
                    'message': f"Event today: {event['related_information'][:150]}..." if len(event.get('related_information', '')) > 150 else event.get('related_information', 'Event happening today'),
                    'event_date': event['event_date'],
                    'event_time': event['event_time'],
                    'location': event['location'],
                    'document_path': event.get('document_path'),
                    'document_id': event['document_id'],
                    'priority': 'urgent'
                })
        
        for department, events in upcoming_events.get('department_events', {}).items():
            for event in events:
                if event['event_date'] == today_str:
                    notifications.append({
                        'id': f"dept_event_{event['id']}",
                        'type': 'department_event',
                        'department': department,
                        'title': event['document_title'] or f'{department} Event Today',
                        'message': f"Event today: {event['related_information'][:150]}..." if len(event.get('related_information', '')) > 150 else event.get('related_information', 'Event happening today'),
                        'event_date': event['event_date'],
                        'event_time': event['event_time'],
                        'location': event['location'],
                        'document_path': event.get('document_path'),
                        'document_id': event['document_id'],
                        'priority': 'urgent'
                    })
        
        # Sort by time
        notifications.sort(key=lambda x: x['event_time'] or '23:59')
        
        return {
            'success': True,
            'date': today_str,
            'total_events_today': len(notifications),
            'notifications': notifications
        }
        
    except Exception as e:
        print(f"Error getting today's events notifications: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching today's notifications: {str(e)}")

# File serving endpoints
@app.get("/uploads/{path:path}")
async def serve_uploaded_file(path: str):
    """Serve uploaded files from the storage directory"""
    try:
        # Handle different path patterns:
        # - college_events/filename.pdf
        # - department_events/DepartmentName/filename.pdf
        # - subject_documents/DepartmentName/SubjectName/filename.pdf
        
        if "/" in path:
            parts = path.split("/")
            
            if parts[0] == "subject_documents" and len(parts) >= 4:
                # For subject documents: subject_documents/DepartmentName/SubjectName/filename.pdf
                folder = parts[0]  # subject_documents
                department = parts[1]  # DepartmentName
                subject = parts[2]  # SubjectName
                filename = "/".join(parts[3:])  # Handle nested paths in filename
                
                # Check in storage/uploads/subject_documents/DepartmentName/SubjectName/ directory
                storage_path = Path("storage") / "uploads" / folder / department / subject
                
            elif parts[0] == "department_events" and len(parts) >= 3:
                # For department events: department_events/DepartmentName/filename.pdf
                folder = parts[0]  # department_events
                department = parts[1]  # DepartmentName
                filename = "/".join(parts[2:])  # Handle nested paths in filename
                
                # Check in storage/uploads/department_events/DepartmentName/ directory
                storage_path = Path("storage") / "uploads" / folder / department
                
            elif len(parts) >= 2:
                # For college events: college_events/filename.pdf
                folder = parts[0]  # college_events
                filename = "/".join(parts[1:])  # Handle nested paths in filename
                
                # Check in storage/uploads/folder/ directory
                storage_path = Path("storage") / "uploads" / folder
            else:
                # Fallback for single part paths
                storage_path = Path("storage") / "uploads"
                filename = path
                
            if storage_path.exists():
                # Look for files that end with the requested filename (to handle UUID prefixes)
                for file in storage_path.glob(f"*{filename}"):
                    if file.is_file():
                        return FileResponse(
                            path=str(file),
                            filename=filename,  # Use original filename without UUID
                            media_type='application/octet-stream'
                        )
                
                # Also try exact filename match
                exact_file = storage_path / filename
                if exact_file.exists() and exact_file.is_file():
                    return FileResponse(
                        path=str(exact_file),
                        filename=filename,
                        media_type='application/octet-stream'
                    )
        
        # Fallback: try direct path in storage
        fallback_path = Path("storage") / path
        if fallback_path.exists() and fallback_path.is_file():
            print(f"Found file via fallback path: {fallback_path}")
            return FileResponse(
                path=str(fallback_path),
                filename=fallback_path.name,
                media_type='application/octet-stream'
            )
        
        print(f"File not found for path: {path}")
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error serving file {path}: {e}")
        raise HTTPException(status_code=500, detail=f"Error serving file: {str(e)}")

if __name__ == "__main__":
    # Check if required environment variables are set
    required_vars = ["OPENAI_API_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"Warning: Missing environment variables: {missing_vars}")
        print("Please set these in your .env file")
    
    uvicorn.run(
        "main:app", 
        host=os.getenv("HOST", "0.0.0.0"), 
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
