import os
import sqlite3
import hashlib
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime

class UserDatabase:
    def __init__(self, db_path: str = "users.db"):
        self.db_path = Path(db_path)
        self.init_database()
    
    def init_database(self):
        """Initialize the SQLite database with users table"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                department TEXT,
                employee_id TEXT,
                year TEXT,
                roll_no TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create default admin user if it doesn't exist
        admin_email = "admin@college.edu"
        admin_password = self.hash_password("admin123")
        
        cursor.execute('''
            INSERT OR IGNORE INTO users (email, password_hash, name, role, department)
            VALUES (?, ?, ?, ?, ?)
        ''', (admin_email, admin_password, "System Administrator", "admin", "Administration"))
        
        conn.commit()
        conn.close()
    
    def hash_password(self, password: str) -> str:
        """Hash password using SHA256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        return self.hash_password(password) == password_hash
    
    def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user with email and password"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, email, password_hash, name, role, department, employee_id, year, roll_no
            FROM users WHERE email = ?
        ''', (email,))
        
        user = cursor.fetchone()
        conn.close()
        
        if user and self.verify_password(password, user[2]):
            return {
                "id": user[0],
                "email": user[1],
                "name": user[3],
                "role": user[4],
                "department": user[5],
                "employee_id": user[6],
                "year": user[7],
                "roll_no": user[8]
            }
        
        return None
    
    def create_user(self, email: str, password: str, name: str, role: str, 
                   department: str = None, employee_id: str = None, 
                   year: str = None, roll_no: str = None) -> Optional[Dict[str, Any]]:
        """Create a new user"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            password_hash = self.hash_password(password)
            cursor.execute('''
                INSERT INTO users (email, password_hash, name, role, department, employee_id, year, roll_no)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (email, password_hash, name, role, department, employee_id, year, roll_no))
            
            user_id = cursor.lastrowid
            conn.commit()
            
            return {
                "id": user_id,
                "email": email,
                "name": name,
                "role": role,
                "department": department,
                "employee_id": employee_id,
                "year": year,
                "roll_no": roll_no
            }
        except sqlite3.IntegrityError:
            return None  # Email already exists
        finally:
            conn.close()
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, email, name, role, department, employee_id, year, roll_no
            FROM users WHERE id = ?
        ''', (user_id,))
        
        user = cursor.fetchone()
        conn.close()
        
        if user:
            return {
                "id": user[0],
                "email": user[1],
                "name": user[2],
                "role": user[3],
                "department": user[4],
                "employee_id": user[5],
                "year": user[6],
                "roll_no": user[7]
            }
        
        return None

# Create singleton instance
user_db = UserDatabase()
