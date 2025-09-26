import os
import pickle
import logging
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

import faiss
import numpy as np
from openai import OpenAI
from docx import Document as DocxDocument
import PyPDF2

logger = logging.getLogger(__name__)

class VectorDatabase:
    def __init__(self):
        """Initialize the Vector Database with OpenAI embedding and simple text splitter"""
        # Initialize OpenAI client
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        self.openai_client = OpenAI(api_key=api_key)
        
        self.base_storage_path = Path("storage")
        self.base_storage_path.mkdir(exist_ok=True)
        
        # Simple text splitter parameters
        self.chunk_size = 1000
        self.chunk_overlap = 200

    def _get_user_storage_path(self, user_id: str, role: str, department: str) -> Path:
        """Get storage path for department - all users in same department share the same folder"""
        # Create folder structure: storage/department/
        # For admin: storage/admin/
        # For others: storage/ComputerScience/
        safe_department = department.replace(" ", "").replace("/", "_").replace("\\", "_")
        storage_path = self.base_storage_path / safe_department
        storage_path.mkdir(parents=True, exist_ok=True)
        return storage_path

    def _get_college_event_storage_path(self) -> Path:
        """Get storage path for college events - organized structure"""
        # Create organized folder structure
        uploads_path = self.base_storage_path / "uploads" / "college_events"
        uploads_path.mkdir(parents=True, exist_ok=True)
        
        vector_db_path = self.base_storage_path / "vector_db" / "college_events"
        vector_db_path.mkdir(parents=True, exist_ok=True)
        
        indexes_path = self.base_storage_path / "indexes"
        indexes_path.mkdir(parents=True, exist_ok=True)
        
        return {
            'uploads': uploads_path,
            'vector_db': vector_db_path, 
            'indexes': indexes_path
        }

    def _extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF {file_path}: {str(e)}")
            raise

    def _extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = DocxDocument(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            logger.error(f"Error extracting text from DOCX {file_path}: {str(e)}")
            raise

    def _extract_text_from_txt(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except Exception as e:
            logger.error(f"Error extracting text from TXT {file_path}: {str(e)}")
            raise

    def extract_text_from_document(self, file_path: str) -> str:
        """Extract text from different document types"""
        file_extension = Path(file_path).suffix.lower()
        
        try:
            if file_extension == '.pdf':
                return self._extract_text_from_pdf(file_path)
            elif file_extension in ['.docx', '.doc']:
                return self._extract_text_from_docx(file_path)
            elif file_extension == '.txt':
                return self._extract_text_from_txt(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_extension}")
        except Exception as e:
            logger.error(f"Error extracting text from document {file_path}: {str(e)}")
            raise

    def _split_text(self, text: str) -> List[str]:
        """Simple text splitter that splits text into chunks"""
        if not text.strip():
            return []
        
        # Split by sentences and combine into chunks
        sentences = text.replace('\n', ' ').split('. ')
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
                
            # If adding this sentence would exceed chunk size, save current chunk
            if len(current_chunk) + len(sentence) + 2 > self.chunk_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence
            else:
                if current_chunk:
                    current_chunk += ". " + sentence
                else:
                    current_chunk = sentence
        
        # Add the last chunk
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        # Handle overlap by duplicating some content at chunk boundaries
        if len(chunks) > 1:
            overlapped_chunks = []
            for i, chunk in enumerate(chunks):
                if i > 0:
                    # Add some content from previous chunk for overlap
                    prev_chunk = chunks[i-1]
                    overlap_text = prev_chunk[-self.chunk_overlap:] if len(prev_chunk) > self.chunk_overlap else prev_chunk
                    chunk = overlap_text + " " + chunk
                overlapped_chunks.append(chunk)
            chunks = overlapped_chunks
        
        return [chunk for chunk in chunks if len(chunk.strip()) > 50]  # Filter out very short chunks

    def create_embeddings(self, chunks: List[str]) -> np.ndarray:
        """Create embeddings for text chunks using OpenAI's cheapest embedding model"""
        try:
            if not chunks:
                return np.array([])
            
            # Use OpenAI's text-embedding-ada-002 model (cheapest embedding model)
            response = self.openai_client.embeddings.create(
                model="text-embedding-ada-002",
                input=chunks
            )
            
            # Extract embeddings from response
            embeddings = []
            for item in response.data:
                embeddings.append(item.embedding)
            
            return np.array(embeddings)
        except Exception as e:
            logger.error(f"Error creating embeddings with OpenAI: {str(e)}")
            raise

    def save_vector_database(self, embeddings: np.ndarray, chunks: List[str], 
                           storage_path: Path, document_id: str, document_metadata: Dict[str, Any] = None) -> tuple:
        """Save FAISS index and chunks to user-specific folder with enhanced metadata"""
        try:
            # Create FAISS index
            dimension = embeddings.shape[1]
            index = faiss.IndexFlatL2(dimension)
            index.add(embeddings.astype('float32'))
            
            # Save FAISS index
            faiss_path = storage_path / f"faiss_index_{document_id}.pkl"
            with open(faiss_path, 'wb') as f:
                pickle.dump(index, f)
            
            # Save chunks
            chunks_path = storage_path / f"chunks_{document_id}.pkl"
            with open(chunks_path, 'wb') as f:
                pickle.dump(chunks, f)
            
            # Enhanced metadata combining basic info with document metadata
            metadata = {
                'document_id': document_id,
                'chunk_count': len(chunks),
                'embedding_dimension': dimension,
                'created_at': datetime.now().isoformat(),
                'faiss_path': str(faiss_path),
                'chunks_path': str(chunks_path)
            }
            
            # Add document-specific metadata if provided
            if document_metadata:
                metadata.update(document_metadata)
            
            metadata_path = storage_path / f"metadata_{document_id}.pkl"
            with open(metadata_path, 'wb') as f:
                pickle.dump(metadata, f)
                
            logger.info(f"Vector database saved to {storage_path}")
            return str(faiss_path), str(chunks_path), str(metadata_path)
            
        except Exception as e:
            logger.error(f"Error saving vector database: {str(e)}")
            raise

    def _update_document_index(self, department: str, subject: str, document_metadata: Dict[str, Any]):
        """Update a master index of all documents for easy retrieval"""
        try:
            index_path = self.base_storage_path / "document_index.pkl"
            
            # Load existing index or create new one
            if index_path.exists():
                with open(index_path, 'rb') as f:
                    doc_index = pickle.load(f)
            else:
                doc_index = {"departments": {}}
            
            # Ensure department exists
            if department not in doc_index["departments"]:
                doc_index["departments"][department] = {"general": [], "subjects": {}}
            
            # Add document to appropriate category
            if subject:
                if subject not in doc_index["departments"][department]["subjects"]:
                    doc_index["departments"][department]["subjects"][subject] = []
                doc_index["departments"][department]["subjects"][subject].append(document_metadata)
            else:
                doc_index["departments"][department]["general"].append(document_metadata)
            
            # Save updated index
            with open(index_path, 'wb') as f:
                pickle.dump(doc_index, f)
                
            logger.info(f"Document index updated for {department}/{subject or 'general'}")
            
        except Exception as e:
            logger.error(f"Error updating document index: {str(e)}")

    def _update_college_events_index(self, document_metadata: Dict[str, Any]):
        """Update college events index for easy retrieval"""
        try:
            storage_paths = self._get_college_event_storage_path()
            index_path = storage_paths['indexes'] / "college_events_index.pkl"
            
            # Load existing index or create new one
            if index_path.exists():
                with open(index_path, 'rb') as f:
                    events_index = pickle.load(f)
            else:
                events_index = {"events": [], "event_types": {}}
            
            # Add document to events list
            events_index["events"].append(document_metadata)
            
            # Organize by event type
            event_type = document_metadata.get("event_type", "general")
            if event_type not in events_index["event_types"]:
                events_index["event_types"][event_type] = []
            events_index["event_types"][event_type].append(document_metadata)
            
            # Save updated index
            with open(index_path, 'wb') as f:
                pickle.dump(events_index, f)
                
            logger.info(f"College events index updated for {event_type}")
            
        except Exception as e:
            logger.error(f"Error updating college events index: {str(e)}")

    def get_document_index(self, department: str = None, subject: str = None) -> Dict[str, Any]:
        """Get document index for browsing available documents"""
        try:
            index_path = self.base_storage_path / "document_index.pkl"
            
            if not index_path.exists():
                return {"departments": {}}
            
            with open(index_path, 'rb') as f:
                doc_index = pickle.load(f)
            
            # Filter by department if specified
            if department:
                if department in doc_index["departments"]:
                    dept_data = doc_index["departments"][department]
                    if subject and subject in dept_data["subjects"]:
                        return {"subjects": {subject: dept_data["subjects"][subject]}}
                    else:
                        return {"department": department, "data": dept_data}
                else:
                    return {"departments": {}}
            
            return doc_index
            
        except Exception as e:
            logger.error(f"Error getting document index: {str(e)}")
            return {"departments": {}}

    def process_college_event_document(self, file_path: str, user_id: str, role: str,
                                      filename: str, title: str, event_type: str = "general") -> Dict[str, Any]:
        """Process uploaded college event document and create vector database"""
        try:
            document_id = str(uuid.uuid4())
            storage_paths = self._get_college_event_storage_path()
            
            # Create enhanced metadata for college events
            document_metadata = {
                "document_id": document_id,
                "filename": filename,
                "title": title,
                "user_id": user_id,
                "role": role,
                "event_type": event_type,
                "upload_date": datetime.now().isoformat(),
                "file_type": Path(filename).suffix.lower(),
                "storage_type": "college_event",
                "accessible_to": "all_users"
            }
            
            # Copy file to college events upload storage location
            user_file_path = storage_paths['uploads'] / f"{document_id}_{filename}"
            import shutil
            shutil.copy2(file_path, user_file_path)
            
            # Store the correct relative path for frontend access
            document_metadata["file_path"] = f"storage/uploads/college_events/{document_id}_{filename}"
            
            # Extract text from document
            full_text = self.extract_text_from_document(str(user_file_path))
            
            if not full_text.strip():
                raise ValueError("No text content found in the document")
            
            # Split into chunks using our simple text splitter
            chunks = self._split_text(full_text)
            
            if not chunks:
                raise ValueError("No chunks created from the document")
            
            # Create embeddings
            embeddings = self.create_embeddings(chunks)
            
            # Save vector database in the vector_database subfolder
            faiss_path, chunks_path, metadata_path = self.save_vector_database(
                embeddings, chunks, storage_paths['vector_db'], document_id, document_metadata
            )
            
            # Update college events index
            self._update_college_events_index(document_metadata)
            
            return {
                "document_id": document_id,
                "chunk_count": len(chunks),
                "faiss_path": faiss_path,
                "chunks_path": chunks_path,
                "metadata_path": metadata_path,
                "user_file_path": str(user_file_path),
                "text_length": len(full_text),
                "event_type": event_type,
                "storage_type": "college_event",
                "message": "College event document processed successfully"
            }
            
        except Exception as e:
            logger.error(f"Error processing college event document: {str(e)}")
            raise

    def process_document(self, file_path: str, user_id: str, role: str, department: str,
                        filename: str, title: str, subject: str = None) -> Dict[str, Any]:
        """Process uploaded document and create vector database with enhanced organization"""
        try:
            document_id = str(uuid.uuid4())
            storage_path = self._get_user_storage_path(user_id, role, department)
            
            # Create enhanced metadata
            document_metadata = {
                "document_id": document_id,
                "filename": filename,
                "title": title,
                "user_id": user_id,
                "role": role,
                "department": department,
                "subject": subject,
                "upload_date": datetime.now().isoformat(),
                "file_type": Path(filename).suffix.lower()
            }
            
            # If subject is provided, use subject-specific storage
            if subject:
                storage_path = storage_path / subject.replace(" ", "_").replace("/", "_")
                storage_path.mkdir(parents=True, exist_ok=True)
                document_metadata["storage_type"] = "subject_specific"
                document_metadata["subject_path"] = str(storage_path)
            else:
                document_metadata["storage_type"] = "general"
            
            # Copy file to appropriate storage location
            user_file_path = storage_path / f"{document_id}_{filename}"
            import shutil
            shutil.copy2(file_path, user_file_path)
            
            # Extract text from document
            full_text = self.extract_text_from_document(str(user_file_path))
            
            if not full_text.strip():
                raise ValueError("No text content found in the document")
            
            # Split into chunks using our simple text splitter
            chunks = self._split_text(full_text)
            
            if not chunks:
                raise ValueError("No chunks created from the document")
            
            # Create embeddings
            embeddings = self.create_embeddings(chunks)
            
            # Save vector database with enhanced metadata
            faiss_path, chunks_path, metadata_path = self.save_vector_database(
                embeddings, chunks, storage_path, document_id, document_metadata
            )
            
            # Update document index for easy retrieval
            self._update_document_index(department, subject, document_metadata)
            
            return {
                "document_id": document_id,
                "chunk_count": len(chunks),
                "faiss_path": faiss_path,
                "chunks_path": chunks_path,
                "metadata_path": metadata_path,
                "user_file_path": str(user_file_path),
                "text_length": len(full_text),
                "department": department,
                "subject": subject,
                "storage_type": document_metadata["storage_type"],
                "message": "Document processed successfully"
            }
            
        except Exception as e:
            logger.error(f"Error processing document: {str(e)}")
            raise

    def query_documents(self, query: str, user_id: str, role: str, department: str, 
                       subject: str = None, top_k: int = 5, search_scope: str = "all") -> List[Dict[str, Any]]:
        """Enhanced query with context-aware searching"""
        try:
            # Create query embedding using OpenAI
            query_response = self.openai_client.embeddings.create(
                model="text-embedding-ada-002",
                input=[query]
            )
            query_embedding = np.array([query_response.data[0].embedding])
            
            all_results = []
            search_paths = []
            
            # Determine search paths based on scope and context
            base_storage_path = self._get_user_storage_path(user_id, role, department)
            
            if search_scope == "subject" and subject:
                # Search only in specific subject
                subject_path = base_storage_path / subject.replace(" ", "_").replace("/", "_")
                if subject_path.exists():
                    search_paths.append(subject_path)
            elif search_scope == "department":
                # Search in all department documents (general + all subjects)
                search_paths.append(base_storage_path)
                # Add all subject subdirectories
                for item in base_storage_path.iterdir():
                    if item.is_dir():
                        search_paths.append(item)
            elif search_scope == "general":
                # Search only in general department documents (no subjects)
                search_paths.append(base_storage_path)
            else:
                # Default: search all accessible documents
                search_paths.append(base_storage_path)
                for item in base_storage_path.iterdir():
                    if item.is_dir():
                        search_paths.append(item)
            
            # Search through all determined paths
            for search_path in search_paths:
                if not search_path.exists():
                    continue
                    
                for faiss_file in search_path.glob("faiss_index_*.pkl"):
                    document_id = faiss_file.stem.replace("faiss_index_", "")
                    chunks_file = search_path / f"chunks_{document_id}.pkl"
                    metadata_file = search_path / f"metadata_{document_id}.pkl"
                    
                    if chunks_file.exists() and metadata_file.exists():
                        try:
                            # Load FAISS index
                            with open(faiss_file, 'rb') as f:
                                index = pickle.load(f)
                            
                            # Load chunks
                            with open(chunks_file, 'rb') as f:
                                chunks = pickle.load(f)
                            
                            # Load metadata
                            with open(metadata_file, 'rb') as f:
                                metadata = pickle.load(f)
                            
                            # Skip if subject filter doesn't match
                            if search_scope == "subject" and subject:
                                if metadata.get("subject") != subject:
                                    continue
                            
                            # Search for similar chunks
                            k = min(top_k, len(chunks))
                            if k > 0:
                                distances, indices = index.search(
                                    query_embedding.astype('float32'), k
                                )
                                
                                # Collect results with scores and enhanced metadata
                                for i, idx in enumerate(indices[0]):
                                    if idx < len(chunks) and distances[0][i] < 2.0:  # Similarity threshold
                                        result = {
                                            'text': chunks[idx],
                                            'score': float(distances[0][i]),
                                            'document_id': document_id,
                                            'chunk_index': int(idx),
                                            'metadata': metadata,
                                            'department': metadata.get('department', department),
                                            'subject': metadata.get('subject'),
                                            'title': metadata.get('title', 'Unknown'),
                                            'filename': metadata.get('filename', 'Unknown'),
                                            'storage_type': metadata.get('storage_type', 'general'),
                                            'context_path': str(search_path.relative_to(self.base_storage_path))
                                        }
                                        all_results.append(result)
                        except Exception as e:
                            logger.warning(f"Error processing document {document_id}: {str(e)}")
                            continue
            
            # Sort by similarity score (lower is better) and return top results
            all_results.sort(key=lambda x: x['score'])
            return all_results[:top_k]
            
        except Exception as e:
            logger.error(f"Error querying documents: {str(e)}")
            return []

    def query_college_events(self, query: str, top_k: int = 5, department_filter: str = None) -> List[Dict[str, Any]]:
        """Query college event documents - accessible to all users"""
        try:
            # Create query embedding using OpenAI
            query_response = self.openai_client.embeddings.create(
                model="text-embedding-ada-002",
                input=[query]
            )
            query_embedding = np.array([query_response.data[0].embedding])
            
            all_results = []
            storage_path = self._get_college_event_storage_path()
            vector_db_path = storage_path / "vector_database"
            
            # Search through all college event documents
            if vector_db_path.exists():
                for faiss_file in vector_db_path.glob("faiss_index_*.pkl"):
                    document_id = faiss_file.stem.replace("faiss_index_", "")
                    chunks_file = vector_db_path / f"chunks_{document_id}.pkl"
                    metadata_file = vector_db_path / f"metadata_{document_id}.pkl"
                    
                    if chunks_file.exists() and metadata_file.exists():
                        try:
                            # Load FAISS index
                            with open(faiss_file, 'rb') as f:
                                index = pickle.load(f)
                            
                            # Load chunks
                            with open(chunks_file, 'rb') as f:
                                chunks = pickle.load(f)
                            
                            # Load metadata
                            with open(metadata_file, 'rb') as f:
                                metadata = pickle.load(f)
                            
                            # Search for similar chunks
                            k = min(top_k, len(chunks))
                            if k > 0:
                                distances, indices = index.search(
                                    query_embedding.astype('float32'), k
                                )
                                
                                # Collect results with scores and metadata
                                for i, idx in enumerate(indices[0]):
                                    if idx < len(chunks) and distances[0][i] < 2.0:  # Similarity threshold
                                        result = {
                                            'text': chunks[idx],
                                            'score': float(distances[0][i]),
                                            'document_id': document_id,
                                            'chunk_index': int(idx),
                                            'metadata': metadata,
                                            'title': metadata.get('title', 'Unknown'),
                                            'filename': metadata.get('filename', 'Unknown'),
                                            'event_type': metadata.get('event_type', 'general'),
                                            'upload_date': metadata.get('upload_date'),
                                            'storage_type': 'college_event'
                                        }
                                        
                                        # Apply department filter if specified
                                        if department_filter:
                                            # Check if the event/document is related to the specified department
                                            # Look in metadata, title, event_type, or text content
                                            dept_keywords = [department_filter.lower()]
                                            if department_filter.lower() == "computer science":
                                                dept_keywords.extend(["cse", "cs", "computing", "software", "programming"])
                                            elif department_filter.lower() == "mechanical engineering":
                                                dept_keywords.extend(["mech", "mechanical", "engineering"])
                                            elif department_filter.lower() == "electrical engineering":  
                                                dept_keywords.extend(["eee", "electrical", "electronics"])
                                            
                                            content_to_check = (
                                                result['title'].lower() + " " + 
                                                result['event_type'].lower() + " " + 
                                                result['text'].lower() + " " +
                                                str(metadata.get('department', '')).lower()
                                            )
                                            
                                            if not any(keyword in content_to_check for keyword in dept_keywords):
                                                continue  # Skip this result if it doesn't match the department filter
                                        
                                        all_results.append(result)
                        except Exception as e:
                            logger.warning(f"Error processing college event document {document_id}: {str(e)}")
                            continue
            
            # Sort by similarity score (lower is better) and return top results
            all_results.sort(key=lambda x: x['score'])
            return all_results[:top_k]
            
        except Exception as e:
            logger.error(f"Error querying college events: {str(e)}")
            return []

    def generate_response(self, query: str, context_chunks: List[Dict[str, Any]], 
                         search_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate response using OpenAI with retrieved context and search information"""
        try:
            if not context_chunks:
                return {
                    "response": "I couldn't find any relevant information in the uploaded documents to answer your question. Please make sure you have uploaded some documents or try rephrasing your question.",
                    "sources_count": 0,
                    "source_documents": [],
                    "search_context": search_context or {}
                }
            
            # Group chunks by source for better context
            sources_info = []
            context_parts = []
            
            for chunk in context_chunks[:3]:  # Use top 3 chunks
                source_info = {
                    "title": chunk.get('title', 'Unknown Document'),
                    "filename": chunk.get('filename', 'Unknown'),
                    "department": chunk.get('department', 'Unknown'),
                    "subject": chunk.get('subject', 'General'),
                    "storage_type": chunk.get('storage_type', 'general'),
                    "score": chunk.get('score', 0)
                }
                sources_info.append(source_info)
                
                # Format context with source information
                source_label = f"[{source_info['title']} - {source_info['subject'] or 'General'}]"
                context_parts.append(f"{source_label}\n{chunk['text']}")
            
            context = "\n\n---\n\n".join(context_parts)
            
            # Enhanced prompt with context information
            search_info = ""
            if search_context:
                scope = search_context.get('scope', 'all documents')
                dept = search_context.get('department', 'Unknown')
                subj = search_context.get('subject')
                if subj:
                    search_info = f"\n\nSearch Context: Looking in {dept} department, {subj} subject documents."
                else:
                    search_info = f"\n\nSearch Context: Looking in {dept} department documents."
            
            prompt = f"""Based on the following context from uploaded college documents, please answer the question accurately and concisely.

Context from Documents:
{context}{search_info}

Question: {query}

Instructions:
- Provide a helpful and accurate response based on the context
- Mention which document(s) or subject area the information comes from when relevant
- If the context doesn't contain enough information to fully answer the question, mention what information is available and what might be missing
- Keep the response clear and informative
- Use information only from the provided context

Answer:"""
            
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a helpful college assistant that answers questions based on provided documents. Always base your responses on the given context, mention source documents when relevant, and be clear about what information is available."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=500,
                temperature=0.3,
                top_p=1.0
            )
            
            return {
                "response": response.choices[0].message.content.strip(),
                "sources_count": len(context_chunks),
                "source_documents": sources_info,
                "search_context": search_context or {},
                "context_breakdown": {
                    "departments_searched": list(set(chunk.get('department') for chunk in context_chunks if chunk.get('department'))),
                    "subjects_searched": list(set(chunk.get('subject') for chunk in context_chunks if chunk.get('subject'))),
                    "storage_types": list(set(chunk.get('storage_type') for chunk in context_chunks if chunk.get('storage_type')))
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return {
                "response": "I'm sorry, I encountered an error while processing your question. Please try again or contact support if the issue persists.",
                "sources_count": 0,
                "source_documents": []
            }

    def get_user_documents(self, user_id: str, role: str, department: str = "Computer Science") -> List[Dict[str, Any]]:
        """Get list of all documents for a user"""
        try:
            storage_path = self._get_user_storage_path(user_id, role, department)
            documents = []
            
            # Search in main department folder and all subject subfolders
            search_paths = [storage_path]
            for item in storage_path.iterdir():
                if item.is_dir():
                    search_paths.append(item)
            
            for search_path in search_paths:
                for metadata_file in search_path.glob("metadata_*.pkl"):
                    try:
                        with open(metadata_file, 'rb') as f:
                            metadata = pickle.load(f)
                        documents.append(metadata)
                    except Exception as e:
                        logger.warning(f"Error loading metadata from {metadata_file}: {str(e)}")
                        continue
            
            # Sort by creation date (newest first)
            documents.sort(key=lambda x: x.get('created_at', ''), reverse=True)
            return documents
            
        except Exception as e:
            logger.error(f"Error getting user documents: {str(e)}")
            return []

    def delete_document(self, document_id: str, user_id: str, role: str, department: str = "Computer Science") -> bool:
        """Delete a document and all its associated files"""
        try:
            storage_path = self._get_user_storage_path(user_id, role, department)
            
            # Search in main folder and subfolders for the document
            search_paths = [storage_path]
            for item in storage_path.iterdir():
                if item.is_dir():
                    search_paths.append(item)
            
            deleted_count = 0
            for search_path in search_paths:
                # Files to delete in this path
                files_to_delete = [
                    search_path / f"faiss_index_{document_id}.pkl",
                    search_path / f"chunks_{document_id}.pkl",
                    search_path / f"metadata_{document_id}.pkl"
                ]
                
                # Also delete the original file
                for file_path in search_path.glob(f"{document_id}_*"):
                    files_to_delete.append(file_path)
                
                for file_path in files_to_delete:
                    if file_path.exists():
                        file_path.unlink()
                        deleted_count += 1
            
            logger.info(f"Deleted {deleted_count} files for document {document_id}")
            return deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting document {document_id}: {str(e)}")
            return False

    # Department Events Methods
    def _get_department_event_storage_path(self, department: str) -> Dict[str, Path]:
        """Get organized storage paths for department events"""
        safe_department = department.replace(" ", "").replace("/", "_").replace("\\", "_")
        
        # Create organized folder structure
        uploads_path = self.base_storage_path / "uploads" / "department_events" / safe_department
        uploads_path.mkdir(parents=True, exist_ok=True)
        
        vector_db_path = self.base_storage_path / "vector_db" / "department_events" / safe_department
        vector_db_path.mkdir(parents=True, exist_ok=True)
        
        indexes_path = self.base_storage_path / "indexes"
        indexes_path.mkdir(parents=True, exist_ok=True)
        
        return {
            'uploads': uploads_path,
            'vector_db': vector_db_path,
            'indexes': indexes_path
        }

    def _update_department_events_index(self, document_metadata: Dict[str, Any], department: str):
        """Update the department events master index with new document metadata"""
        try:
            storage_paths = self._get_department_event_storage_path(department)
            safe_department = department.replace(" ", "").replace("/", "_").replace("\\", "_")
            index_file = storage_paths['indexes'] / f"{safe_department}_events_index.pkl"
            
            # Load existing index or create new one
            if index_file.exists():
                with open(index_file, 'rb') as f:
                    index = pickle.load(f)
            else:
                index = []
            
            # Add new document to index
            index.append(document_metadata)
            
            # Save updated index
            with open(index_file, 'wb') as f:
                pickle.dump(index, f)
                
            logger.info(f"Updated department events index for {department} with document {document_metadata['id']}")
            
        except Exception as e:
            logger.error(f"Error updating department events index for {department}: {str(e)}")
            raise

    def process_department_event_document(self, file_path: str, user_id: str, role: str,
                                         title: str, event_type: str, department: str) -> Dict[str, Any]:
        """Process a department event document and store it with vector embeddings"""
        try:
            logger.info(f"Processing department event document: {file_path} for department: {department}")
            
            # Extract text from document
            text = self.extract_text_from_document(file_path)
            
            if not text.strip():
                raise ValueError("No text content found in the document")
            
            # Split text into chunks
            chunks = self._split_text(text)
            
            if not chunks:
                raise ValueError("No meaningful chunks could be created from the document")
            
            # Create embeddings
            embeddings = self.create_embeddings(chunks)
            
            # Create FAISS index
            faiss_index = faiss.IndexFlatIP(embeddings.shape[1])
            faiss_index.add(embeddings.astype('float32'))
            
            # Generate unique document ID
            document_id = str(uuid.uuid4())
            
            # Get department events storage paths
            storage_paths = self._get_department_event_storage_path(department)
            
            # Save the uploaded file to department events uploads folder
            file_extension = Path(file_path).suffix
            saved_file_path = storage_paths['uploads'] / f"{document_id}_{Path(file_path).stem}{file_extension}"
            
            import shutil
            shutil.copy2(file_path, saved_file_path)
            
            # Save chunks, embeddings, and metadata in vector_db folder
            chunks_file = storage_paths['vector_db'] / f"chunks_{document_id}.pkl"
            with open(chunks_file, 'wb') as f:
                pickle.dump(chunks, f)
            
            faiss_file = storage_paths['vector_db'] / f"faiss_index_{document_id}.pkl"
            with open(faiss_file, 'wb') as f:
                pickle.dump(faiss_index, f)
            
            # Create document metadata with correct file path
            document_metadata = {
                'id': document_id,
                'title': title,
                'filename': Path(file_path).name,
                'event_type': event_type,
                'department': department,
                'uploaded_by': user_id,
                'uploader_role': role,
                'upload_date': datetime.now().isoformat(),
                'file_path': f"storage/uploads/department_events/{department.replace(' ', '').replace('/', '_').replace('\\', '_')}/{document_id}_{Path(file_path).stem}{Path(file_path).suffix}",
                'chunks_count': len(chunks),
                'file_size': os.path.getsize(file_path)
            }
            
            metadata_file = storage_paths['vector_db'] / f"metadata_{document_id}.pkl"
            with open(metadata_file, 'wb') as f:
                pickle.dump(document_metadata, f)
            
            # Update master index
            self._update_department_events_index(document_metadata, department)
            
            logger.info(f"Successfully processed department event document {document_id} for {department}")
            
            return {
                'success': True,
                'document_id': document_id,
                'chunks_count': len(chunks),
                'message': f'Department event document processed successfully for {department}'
            }
            
        except Exception as e:
            logger.error(f"Error processing department event document: {str(e)}")
            raise

    def query_department_events(self, query: str, department: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Query department-specific events using semantic search"""
        try:
            logger.info(f"Querying department events for {department}: {query}")
            
            storage_paths = self._get_department_event_storage_path(department)
            vector_db_path = storage_paths['vector_db']
            
            # Check if department has any documents
            if not vector_db_path.exists():
                logger.info(f"No department events found for {department}")
                return []
            
            # Get all document files in the vector database folder
            faiss_files = list(vector_db_path.glob("faiss_index_*.pkl"))
            chunks_files = list(vector_db_path.glob("chunks_*.pkl"))
            metadata_files = list(vector_db_path.glob("metadata_*.pkl"))
            
            if not faiss_files:
                logger.info(f"No indexed documents found for department {department}")
                return []
            
            # Create query embedding
            query_embedding = self.create_embeddings([query])
            
            all_results = []
            
            for faiss_file in faiss_files:
                try:
                    # Extract document ID from filename
                    document_id = faiss_file.stem.replace("faiss_index_", "")
                    
                    # Load corresponding files
                    chunks_file = vector_db_path / f"chunks_{document_id}.pkl"
                    metadata_file = vector_db_path / f"metadata_{document_id}.pkl"
                    
                    if not chunks_file.exists() or not metadata_file.exists():
                        logger.warning(f"Missing files for document {document_id} in department {department}")
                        continue
                    
                    # Load FAISS index
                    with open(faiss_file, 'rb') as f:
                        faiss_index = pickle.load(f)
                    
                    # Load chunks
                    with open(chunks_file, 'rb') as f:
                        chunks = pickle.load(f)
                    
                    # Load metadata
                    with open(metadata_file, 'rb') as f:
                        document_metadata = pickle.load(f)
                    
                    # Search in this document
                    scores, indices = faiss_index.search(query_embedding.astype('float32'), min(top_k, len(chunks)))
                    
                    # Add results from this document
                    for score, idx in zip(scores[0], indices[0]):
                        if idx < len(chunks) and score > 0.1:  # Minimum similarity threshold
                            result = {
                                'content': chunks[idx],
                                'score': float(score),
                                'document_id': document_id,
                                'title': document_metadata.get('title', 'Unknown'),
                                'event_type': document_metadata.get('event_type', 'general'),
                                'department': document_metadata.get('department', department),
                                'upload_date': document_metadata.get('upload_date', ''),
                                'filename': document_metadata.get('filename', ''),
                                'uploaded_by': document_metadata.get('uploaded_by', 'Unknown')
                            }
                            all_results.append(result)
                            
                except Exception as e:
                    logger.error(f"Error processing document {faiss_file} for department {department}: {str(e)}")
                    continue
            
            # Sort by score and return top results
            all_results.sort(key=lambda x: x['score'], reverse=True)
            top_results = all_results[:top_k]
            
            logger.info(f"Found {len(top_results)} relevant results for department {department}")
            return top_results
            
        except Exception as e:
            logger.error(f"Error querying department events for {department}: {str(e)}")
            return []

    def list_department_events(self, department: str) -> List[Dict[str, Any]]:
        """List all department event documents"""
        try:
            storage_paths = self._get_department_event_storage_path(department)
            safe_department = department.replace(" ", "").replace("/", "_").replace("\\", "_")
            index_file = storage_paths['indexes'] / f"{safe_department}_events_index.pkl"
            
            if not index_file.exists():
                return []
            
            with open(index_file, 'rb') as f:
                documents = pickle.load(f)
            
            # Sort by upload date (newest first)
            documents.sort(key=lambda x: x.get('upload_date', ''), reverse=True)
            
            return documents
            
        except Exception as e:
            logger.error(f"Error listing department events for {department}: {str(e)}")
            return []

# Create singleton instance
vector_db = VectorDatabase()
