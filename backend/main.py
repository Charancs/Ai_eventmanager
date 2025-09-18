import os
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
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

class ChatResponse(BaseModel):
    response: str
    sources_count: int
    source_documents: List[dict] = []

class DocumentInfo(BaseModel):
    document_id: str
    chunk_count: int
    text_length: int
    created_at: str

@app.get("/")
async def root():
    return {"message": "AI Event Manager API is running!"}

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    user_id: int = Form(...),
    role: str = Form(...)
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
                user_id=user_id,
                role=role,
                filename=file.filename,
                title=title
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

@app.post("/api/documents/chat", response_model=ChatResponse)
async def chat_with_documents(query_data: ChatQuery):
    """Chat with documents using vector similarity search"""
    try:
        # Get relevant chunks from vector database
        relevant_chunks = vector_db.query_documents(
            query=query_data.query,
            user_id=query_data.user_id,
            role=query_data.role,
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
            source_documents=result["source_documents"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.get("/api/documents/list")
async def get_user_documents(user_id: int, role: str):
    """Get all documents for a specific user"""
    try:
        documents = vector_db.get_user_documents(user_id, role)
        return {
            "success": True,
            "data": documents,
            "count": len(documents)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching documents: {str(e)}")

@app.delete("/api/documents/delete/{document_id}")
async def delete_document(document_id: str, user_id: int, role: str):
    """Delete a document and its vector database files"""
    try:
        success = vector_db.delete_document(document_id, user_id, role)
        
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

# For testing purposes - mock endpoints
@app.get("/api/stats")
async def get_stats():
    """Mock stats endpoint"""
    return {
        "users": {
            "students": 245,
            "teachers": 18,
            "admins": 3
        },
        "departments": 5,
        "events": 8,
        "notifications": {
            "pending": 3,
            "total": 15
        }
    }

@app.get("/api/documents/documents")
async def get_documents_mock(limit: int = 5):
    """Mock documents endpoint for compatibility"""
    return {
        "documents": []
    }

# Notifications endpoints
@app.get("/api/notifications/{user_id}")
async def get_user_notifications(user_id: int, unread_only: bool = False, limit: int = 10, offset: int = 0):
    """Get notifications for a user"""
    # Mock notifications data for now
    notifications = [
        {
            "id": 1,
            "title": "New Event Created",
            "message": "A new department event has been scheduled for next week",
            "type": "event",
            "read": False,
            "created_at": "2025-09-18T10:00:00Z",
            "user_id": user_id
        },
        {
            "id": 2,
            "title": "Document Uploaded",
            "message": "New course material has been uploaded to the system",
            "type": "document",
            "read": True,
            "created_at": "2025-09-17T15:30:00Z",
            "user_id": user_id
        },
        {
            "id": 3,
            "title": "Meeting Reminder",
            "message": "Faculty meeting scheduled for tomorrow at 2 PM",
            "type": "reminder",
            "read": False,
            "created_at": "2025-09-16T09:00:00Z",
            "user_id": user_id
        }
    ]
    
    if unread_only:
        notifications = [n for n in notifications if not n["read"]]
    
    return notifications[offset:offset + limit]

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
    
    return departments

@app.get("/api/departments/{department_id}")
async def get_department(department_id: int):
    """Get department details"""
    departments = {
        1: {
            "id": 1,
            "name": "Computer Science",
            "code": "CSE",
            "description": "Department of Computer Science and Engineering",
            "head_name": "Dr. John Smith",
            "active": True,
            "students": 245,
            "faculty": 18
        }
    }
    
    if department_id not in departments:
        raise HTTPException(status_code=404, detail="Department not found")
    
    return departments[department_id]

@app.get("/api/departments/{department_id}/users")
async def get_department_users(department_id: int, role: str = None, active_only: bool = True, limit: int = 10, offset: int = 0):
    """Get users in a department"""
    # Mock user data
    users = [
        {"id": 1, "name": "John Doe", "role": "student", "email": "john@example.com", "active": True},
        {"id": 2, "name": "Jane Smith", "role": "teacher", "email": "jane@example.com", "active": True},
    ]
    
    if role:
        users = [u for u in users if u["role"] == role]
    
    if active_only:
        users = [u for u in users if u["active"]]
    
    return users[offset:offset + limit]

@app.get("/api/departments/{department_id}/events")
async def get_department_events_api(department_id: int, upcoming_only: bool = True, limit: int = 10, offset: int = 0):
    """Get events for a department"""
    # Mock event data
    events = [
        {
            "id": 1,
            "title": "Faculty Meeting",
            "description": "Monthly faculty meeting",
            "date": "2025-09-25T14:00:00Z",
            "location": "Conference Room A",
            "type": "meeting"
        },
        {
            "id": 2,
            "title": "Student Orientation",
            "description": "New student orientation program",
            "date": "2025-09-30T09:00:00Z",
            "location": "Main Auditorium",
            "type": "orientation"
        }
    ]
    
    return events[offset:offset + limit]

@app.get("/api/departments/{department_id}/documents")
async def get_department_documents_api(department_id: int, limit: int = 10, offset: int = 0):
    """Get documents for a department"""
    # Mock document data
    documents = [
        {
            "id": 1,
            "title": "Course Syllabus",
            "filename": "syllabus.pdf",
            "upload_date": "2025-09-15T10:00:00Z",
            "size": 1024000
        }
    ]
    
    return documents[offset:offset + limit]

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
