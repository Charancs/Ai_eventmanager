"""
Event Database Management System
Handles storage of extracted event data in role and department-specific tables using MySQL
"""

import mysql.connector
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class EventDatabase:
    def __init__(self):
        """Initialize MySQL connection"""
        self.connection_config = {
            'host': os.getenv('MYSQL_HOST', 'localhost'),
            'port': int(os.getenv('MYSQL_PORT', 3306)),
            'user': os.getenv('MYSQL_USER', 'root'),
            'password': os.getenv('MYSQL_PASSWORD', ''),
            'database': os.getenv('MYSQL_DATABASE', 'ai_eventmanager_events'),
            'charset': 'utf8mb4',
            'collation': 'utf8mb4_unicode_ci'
        }
        self.init_database()
    
    def get_connection(self):
        """Get MySQL database connection"""
        return mysql.connector.connect(**self.connection_config)
    
    def init_database(self):
        """Initialize database and required tables"""
        try:
            # First, connect without specifying database to create it if needed
            temp_config = self.connection_config.copy()
            database_name = temp_config.pop('database')
            
            conn = mysql.connector.connect(**temp_config)
            cursor = conn.cursor()
            
            # Create database if it doesn't exist
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            cursor.execute(f"USE {database_name}")
            
            # Create admin events table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS admin_events (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    document_id VARCHAR(255) NOT NULL,
                    document_title VARCHAR(500),
                    event_date DATE,
                    related_information TEXT,
                    event_time TIME NULL,
                    location VARCHAR(500) NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_document_id (document_id),
                    INDEX idx_event_date (event_date)
                ) ENGINE=InnoDB
            ''')
            
            # Create department tables metadata
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS department_tables (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    department VARCHAR(255) NOT NULL UNIQUE,
                    table_name VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_department (department)
                ) ENGINE=InnoDB
            ''')
            
            conn.commit()
            conn.close()
            
        except mysql.connector.Error as e:
            print(f"Error initializing database: {e}")
    
    def create_department_table(self, department: str) -> str:
        """Create a department-specific events table"""
        # Sanitize department name for table name
        safe_dept_name = department.replace(" ", "_").replace("-", "_").lower()
        table_name = f"events_{safe_dept_name}"
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # Check if table already exists
            cursor.execute('SELECT table_name FROM department_tables WHERE department = %s', (department,))
            result = cursor.fetchone()
            
            if result:
                conn.close()
                return result[0]
            
            # Create the department-specific table
            cursor.execute(f'''
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    document_id VARCHAR(255) NOT NULL,
                    document_title VARCHAR(500),
                    event_date DATE,
                    related_information TEXT,
                    event_time TIME NULL,
                    location VARCHAR(500) NULL,
                    user_role ENUM('department_admin', 'teacher', 'student') NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_document_id (document_id),
                    INDEX idx_event_date (event_date),
                    INDEX idx_user_role (user_role)
                ) ENGINE=InnoDB
            ''')
            
            # Record the table creation
            cursor.execute('''
                INSERT INTO department_tables (department, table_name)
                VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE table_name = VALUES(table_name)
            ''', (department, table_name))
            
            conn.commit()
            return table_name
            
        except mysql.connector.Error as e:
            print(f"Error creating department table: {e}")
            return table_name
        finally:
            conn.close()
    
    def store_admin_event(self, event_data: Dict[str, Any]) -> int:
        """Store event in admin table"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO admin_events (
                    document_id, document_title, event_date, related_information, event_time, location
                ) VALUES (%s, %s, %s, %s, %s, %s)
            ''', (
                event_data.get('document_id'),
                event_data.get('document_title'),
                event_data.get('event_date'),
                event_data.get('related_information'),
                event_data.get('event_time'),
                event_data.get('location')
            ))
            
            event_id = cursor.lastrowid
            conn.commit()
            return event_id
            
        except mysql.connector.Error as e:
            print(f"Error storing admin event: {e}")
            return 0
        finally:
            conn.close()
    
    def store_department_event(self, department: str, event_data: Dict[str, Any]) -> int:
        """Store event in department-specific table"""
        table_name = self.create_department_table(department)
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(f'''
                INSERT INTO {table_name} (
                    document_id, document_title, event_date, related_information, event_time, location, user_role
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            ''', (
                event_data.get('document_id'),
                event_data.get('document_title'),
                event_data.get('event_date'),
                event_data.get('related_information'),
                event_data.get('event_time'),
                event_data.get('location'),
                event_data.get('user_role')
            ))
            
            event_id = cursor.lastrowid
            conn.commit()
            return event_id
            
        except mysql.connector.Error as e:
            print(f"Error storing department event: {e}")
            return 0
        finally:
            conn.close()
    
    def get_admin_events(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all admin events"""
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            cursor.execute('''
                SELECT * FROM admin_events 
                ORDER BY event_date DESC, created_at DESC 
                LIMIT %s
            ''', (limit,))
            
            events = cursor.fetchall()
            
            # Convert datetime objects to strings for JSON serialization
            for event in events:
                if event.get('event_date'):
                    event['event_date'] = event['event_date'].strftime('%Y-%m-%d')
                if event.get('event_time'):
                    event['event_time'] = str(event['event_time'])
                if event.get('created_at'):
                    event['created_at'] = event['created_at'].strftime('%Y-%m-%d %H:%M:%S')
                if event.get('updated_at'):
                    event['updated_at'] = event['updated_at'].strftime('%Y-%m-%d %H:%M:%S')
            
            return events
            
        except mysql.connector.Error as e:
            print(f"Error getting admin events: {e}")
            return []
        finally:
            conn.close()
    
    def get_department_events(self, department: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get events for a specific department"""
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Check if department table exists
            cursor.execute('SELECT table_name FROM department_tables WHERE department = %s', (department,))
            result = cursor.fetchone()
            
            if not result:
                return []
            
            table_name = result['table_name']
            
            cursor.execute(f'''
                SELECT * FROM {table_name} 
                ORDER BY event_date DESC, created_at DESC 
                LIMIT %s
            ''', (limit,))
            
            events = cursor.fetchall()
            
            # Convert datetime objects to strings for JSON serialization
            for event in events:
                if event.get('event_date'):
                    event['event_date'] = event['event_date'].strftime('%Y-%m-%d')
                if event.get('event_time'):
                    event['event_time'] = str(event['event_time'])
                if event.get('created_at'):
                    event['created_at'] = event['created_at'].strftime('%Y-%m-%d %H:%M:%S')
                if event.get('updated_at'):
                    event['updated_at'] = event['updated_at'].strftime('%Y-%m-%d %H:%M:%S')
            
            return events
            
        except mysql.connector.Error as e:
            print(f"Error getting department events: {e}")
            return []
        finally:
            conn.close()
    
    def get_all_departments(self) -> List[str]:
        """Get list of all departments with events"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('SELECT department FROM department_tables ORDER BY department')
            departments = [row[0] for row in cursor.fetchall()]
            return departments
            
        except mysql.connector.Error as e:
            print(f"Error getting departments: {e}")
            return []
        finally:
            conn.close()

# Create global instance
event_db = EventDatabase()
