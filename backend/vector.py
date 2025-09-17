import os
import pickle
import logging
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
import openai
from docx import Document as DocxDocument
import PyPDF2

logger = logging.getLogger(__name__)

class VectorDatabase:
    def __init__(self):
        """Initialize the Vector Database with embedding model and text splitter"""
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        self.base_storage_path = Path("storage")
        self.base_storage_path.mkdir(exist_ok=True)
        
        # Set OpenAI API key from environment
        openai.api_key = os.getenv("OPENAI_API_KEY")

    def _get_user_storage_path(self, user_id: int, role: str) -> Path:
        """Get storage path for specific user based on role"""
        storage_path = self.base_storage_path / f"{role}_{user_id}"
        storage_path.mkdir(exist_ok=True)
        return storage_path

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

    def create_embeddings(self, chunks: List[str]) -> np.ndarray:
        """Create embeddings for text chunks using sentence-transformers"""
        try:
            embeddings = self.embedding_model.encode(chunks, show_progress_bar=True)
            return embeddings
        except Exception as e:
            logger.error(f"Error creating embeddings: {str(e)}")
            raise

    def save_vector_database(self, embeddings: np.ndarray, chunks: List[str], 
                           storage_path: Path, document_id: str) -> tuple:
        """Save FAISS index and chunks to user-specific folder"""
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
            
            # Save metadata
            metadata = {
                'document_id': document_id,
                'chunk_count': len(chunks),
                'embedding_dimension': dimension,
                'created_at': datetime.now().isoformat(),
                'faiss_path': str(faiss_path),
                'chunks_path': str(chunks_path)
            }
            
            metadata_path = storage_path / f"metadata_{document_id}.pkl"
            with open(metadata_path, 'wb') as f:
                pickle.dump(metadata, f)
                
            logger.info(f"Vector database saved to {storage_path}")
            return str(faiss_path), str(chunks_path), str(metadata_path)
            
        except Exception as e:
            logger.error(f"Error saving vector database: {str(e)}")
            raise

    def process_document(self, file_path: str, user_id: int, role: str, 
                        filename: str, title: str) -> Dict[str, Any]:
        """Process uploaded document and create vector database"""
        try:
            document_id = str(uuid.uuid4())
            storage_path = self._get_user_storage_path(user_id, role)
            
            # Copy file to user storage
            user_file_path = storage_path / f"{document_id}_{filename}"
            import shutil
            shutil.copy2(file_path, user_file_path)
            
            # Extract text from document
            full_text = self.extract_text_from_document(str(user_file_path))
            
            if not full_text.strip():
                raise ValueError("No text content found in the document")
            
            # Split into chunks
            chunks = self.text_splitter.split_text(full_text)
            
            if not chunks:
                raise ValueError("No chunks created from the document")
            
            # Create embeddings
            embeddings = self.create_embeddings(chunks)
            
            # Save vector database
            faiss_path, chunks_path, metadata_path = self.save_vector_database(
                embeddings, chunks, storage_path, document_id
            )
            
            return {
                "document_id": document_id,
                "chunk_count": len(chunks),
                "faiss_path": faiss_path,
                "chunks_path": chunks_path,
                "metadata_path": metadata_path,
                "user_file_path": str(user_file_path),
                "text_length": len(full_text),
                "message": "Document processed successfully"
            }
            
        except Exception as e:
            logger.error(f"Error processing document: {str(e)}")
            raise

    def query_documents(self, query: str, user_id: int, role: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Query vector database and return relevant chunks"""
        try:
            storage_path = self._get_user_storage_path(user_id, role)
            
            # Create query embedding
            query_embedding = self.embedding_model.encode([query])
            
            all_results = []
            
            # Search through all documents for this user
            for faiss_file in storage_path.glob("faiss_index_*.pkl"):
                document_id = faiss_file.stem.replace("faiss_index_", "")
                chunks_file = storage_path / f"chunks_{document_id}.pkl"
                metadata_file = storage_path / f"metadata_{document_id}.pkl"
                
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
                        distances, indices = index.search(
                            query_embedding.astype('float32'), k
                        )
                        
                        # Collect results with scores
                        for i, idx in enumerate(indices[0]):
                            if idx < len(chunks) and distances[0][i] < 2.0:  # Similarity threshold
                                all_results.append({
                                    'text': chunks[idx],
                                    'score': float(distances[0][i]),
                                    'document_id': document_id,
                                    'chunk_index': int(idx),
                                    'metadata': metadata
                                })
                    except Exception as e:
                        logger.warning(f"Error processing document {document_id}: {str(e)}")
                        continue
            
            # Sort by similarity score (lower is better) and return top results
            all_results.sort(key=lambda x: x['score'])
            return all_results[:top_k]
            
        except Exception as e:
            logger.error(f"Error querying documents: {str(e)}")
            return []

    def generate_response(self, query: str, context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate response using OpenAI with retrieved context"""
        try:
            if not context_chunks:
                return {
                    "response": "I couldn't find any relevant information in the uploaded documents to answer your question. Please make sure you have uploaded some documents or try rephrasing your question.",
                    "sources_count": 0,
                    "source_documents": []
                }
            
            # Format context from chunks
            context_texts = [chunk['text'] for chunk in context_chunks[:3]]  # Use top 3 chunks
            context = "\n\n".join(context_texts)
            
            prompt = f"""
Based on the following context from uploaded college documents, please answer the question accurately and concisely.

Context:
{context}

Question: {query}

Instructions:
- Provide a helpful and accurate response based on the context
- If the context doesn't contain enough information to fully answer the question, mention what information is available and what might be missing
- Keep the response clear and informative
- Use information only from the provided context

Answer:"""
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",  # Cheapest OpenAI model
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a helpful college assistant that answers questions based on provided documents. Always base your responses on the given context and be clear about what information is available."
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
                "source_documents": [
                    {
                        "document_id": chunk["document_id"],
                        "score": chunk["score"],
                        "chunk_index": chunk["chunk_index"]
                    }
                    for chunk in context_chunks
                ]
            }
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return {
                "response": "I'm sorry, I encountered an error while processing your question. Please try again or contact support if the issue persists.",
                "sources_count": 0,
                "source_documents": []
            }

    def get_user_documents(self, user_id: int, role: str) -> List[Dict[str, Any]]:
        """Get list of all documents for a user"""
        try:
            storage_path = self._get_user_storage_path(user_id, role)
            documents = []
            
            for metadata_file in storage_path.glob("metadata_*.pkl"):
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

    def delete_document(self, document_id: str, user_id: int, role: str) -> bool:
        """Delete a document and all its associated files"""
        try:
            storage_path = self._get_user_storage_path(user_id, role)
            
            # Files to delete
            files_to_delete = [
                storage_path / f"faiss_index_{document_id}.pkl",
                storage_path / f"chunks_{document_id}.pkl",
                storage_path / f"metadata_{document_id}.pkl"
            ]
            
            # Also delete the original file
            for file_path in storage_path.glob(f"{document_id}_*"):
                files_to_delete.append(file_path)
            
            deleted_count = 0
            for file_path in files_to_delete:
                if file_path.exists():
                    file_path.unlink()
                    deleted_count += 1
            
            logger.info(f"Deleted {deleted_count} files for document {document_id}")
            return deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting document {document_id}: {str(e)}")
            return False

# Create singleton instance
vector_db = VectorDatabase()
