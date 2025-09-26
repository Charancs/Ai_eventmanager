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
            
            # Create admin events table (for college-wide events)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS admin_events (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    document_id VARCHAR(255) NOT NULL,
                    document_title VARCHAR(500),
                    event_date DATE,
                    related_information TEXT,
                    event_time TIME NULL,
                    location VARCHAR(500) NULL,
                    document_path VARCHAR(1000) NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_document_id (document_id),
                    INDEX idx_event_date (event_date)
                ) ENGINE=InnoDB
            ''')
            
            conn.commit()
            conn.close()
            
        except mysql.connector.Error as e:
            print(f"Error initializing database: {e}")
    
    def create_department_table(self, department: str) -> str:
        """Create a department-specific events table with same structure as admin_events"""
        # Sanitize department name for table name
        safe_dept_name = department.replace(" ", "_").replace("-", "_").lower()
        table_name = f"{safe_dept_name}_events"
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # Create the department-specific table with same structure as admin_events
            cursor.execute(f'''
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    document_id VARCHAR(255) NOT NULL,
                    document_title VARCHAR(500),
                    event_date DATE,
                    related_information TEXT,
                    event_time TIME NULL,
                    location VARCHAR(500) NULL,
                    document_path VARCHAR(1000) NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_document_id (document_id),
                    INDEX idx_event_date (event_date)
                ) ENGINE=InnoDB
            ''')
            
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
                    document_id, document_title, event_date, related_information, event_time, location, document_path
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            ''', (
                event_data.get('document_id'),
                event_data.get('document_title'),
                event_data.get('event_date'),
                event_data.get('related_information'),
                event_data.get('event_time'),
                event_data.get('location'),
                event_data.get('document_path')
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
                    document_id, document_title, event_date, related_information, event_time, location, document_path
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            ''', (
                event_data.get('document_id'),
                event_data.get('document_title'),
                event_data.get('event_date'),
                event_data.get('related_information'),
                event_data.get('event_time'),
                event_data.get('location'),
                event_data.get('document_path')
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
            # Generate table name directly from department name
            safe_dept_name = department.replace(" ", "_").replace("-", "_").lower()
            table_name = f"{safe_dept_name}_events"
            
            # Check if table exists by trying to query it
            cursor.execute(f"SHOW TABLES LIKE '{table_name}'")
            if not cursor.fetchone():
                return []  # Table doesn't exist yet
            
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
        """Get list of all departments by scanning for department event tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # Get all tables that match the department pattern
            cursor.execute("SHOW TABLES LIKE '%_events'")
            tables = cursor.fetchall()
            
            departments = []
            for table in tables:
                table_name = table[0]
                # Skip admin_events table
                if table_name == 'admin_events':
                    continue
                # Extract department name from table name (remove _events suffix)
                dept_name = table_name.replace('_events', '').replace('_', ' ').title()
                departments.append(dept_name)
            
            return sorted(departments)
            
        except mysql.connector.Error as e:
            print(f"Error getting departments: {e}")
            return []
        finally:
            conn.close()
    
    def get_upcoming_events(self, days_ahead: int = 2) -> Dict[str, List[Dict[str, Any]]]:
        """Get upcoming events from today to specified days ahead for notifications"""
        from datetime import datetime, timedelta
        
        today = datetime.now().date()
        end_date = today + timedelta(days=days_ahead)
        
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        result = {
            'college_events': [],
            'department_events': {}
        }
        
        try:
            # Get college events (admin events)
            cursor.execute('''
                SELECT id, document_id, document_title, event_date, event_time, location, 
                       related_information, document_path, created_at
                FROM admin_events 
                WHERE event_date >= %s AND event_date <= %s
                ORDER BY event_date ASC, event_time ASC
            ''', (today, end_date))
            
            college_events = cursor.fetchall()
            
            # Convert datetime objects to strings for JSON serialization
            for event in college_events:
                if event.get('event_date'):
                    event['event_date'] = event['event_date'].strftime('%Y-%m-%d')
                if event.get('event_time'):
                    event['event_time'] = str(event['event_time'])
                if event.get('created_at'):
                    event['created_at'] = event['created_at'].strftime('%Y-%m-%d %H:%M:%S')
            
            result['college_events'] = college_events
            
            # Get department events from all department tables
            # Create a fresh cursor without dictionary mode for SHOW TABLES
            tables_cursor = conn.cursor()  # Regular cursor, not dictionary mode
            tables_cursor.execute("SHOW TABLES LIKE '%_events'")
            tables = tables_cursor.fetchall()
            tables_cursor.close()
            
            for table_row in tables:
                # For regular cursor, results are tuples
                table_name = table_row[0]  # Get first element from tuple
                    
                # Skip admin_events table as it's handled above
                if table_name == 'admin_events':
                    continue
                
                # Extract department name from table name
                department = table_name.replace('_events', '').replace('_', ' ').title()
                
                cursor.execute(f'''
                    SELECT id, document_id, document_title, event_date, event_time, location, 
                           related_information, document_path, created_at
                    FROM {table_name}
                    WHERE event_date >= %s AND event_date <= %s
                    ORDER BY event_date ASC, event_time ASC
                ''', (today, end_date))
                
                dept_events = cursor.fetchall()
                
                # Convert datetime objects to strings
                for event in dept_events:
                    if event.get('event_date'):
                        event['event_date'] = event['event_date'].strftime('%Y-%m-%d')
                    if event.get('event_time'):
                        event['event_time'] = str(event['event_time'])
                    if event.get('created_at'):
                        event['created_at'] = event['created_at'].strftime('%Y-%m-%d %H:%M:%S')
                
                if dept_events:
                    result['department_events'][department] = dept_events
            
            return result
            
        except mysql.connector.Error as e:
            print(f"Error getting upcoming events: {e}")
            return result
        finally:
            conn.close()

# Create global instance
event_db = EventDatabase()
