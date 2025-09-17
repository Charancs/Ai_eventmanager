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

if __name__ == "__main__":
    # Check if required environment variables are set
    required_vars = ["OPENAI_API_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"Warning: Missing environment variables: {missing_vars}")
        print("Please set these in your .env file")
    
    uvicorn.run(
        app, 
        host=os.getenv("HOST", "0.0.0.0"), 
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
