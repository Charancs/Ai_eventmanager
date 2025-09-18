"""
Test MySQL Connection
Run this script to verify your MySQL database connection is working
"""

import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def test_mysql_connection():
    """Test MySQL database connection"""
    try:
        # Connection configuration
        config = {
            'host': os.getenv('MYSQL_HOST', 'localhost'),
            'port': int(os.getenv('MYSQL_PORT', 3306)),
            'user': os.getenv('MYSQL_USER', 'root'),
            'password': os.getenv('MYSQL_PASSWORD', ''),
            'database': os.getenv('MYSQL_DATABASE', 'ai_eventmanager_events')
        }
        
        print("Testing MySQL connection...")
        print(f"Host: {config['host']}")
        print(f"Port: {config['port']}")
        print(f"User: {config['user']}")
        print(f"Database: {config['database']}")
        print("-" * 40)
        
        # Try to connect
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor()
        
        # Test basic query
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()
        print(f"✅ Connection successful!")
        print(f"MySQL Version: {version[0]}")
        
        # Check if our database exists
        cursor.execute("SHOW DATABASES LIKE %s", (config['database'],))
        db_exists = cursor.fetchone()
        
        if db_exists:
            print(f"✅ Database '{config['database']}' exists")
            
            # Check if our tables exist
            cursor.execute("USE " + config['database'])
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            
            print(f"📋 Tables in database:")
            for table in tables:
                print(f"   - {table[0]}")
                
        else:
            print(f"❌ Database '{config['database']}' does not exist")
            print("Please run the mysql_setup.sql script first")
        
        conn.close()
        
    except mysql.connector.Error as e:
        print(f"❌ Connection failed: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Make sure MySQL server is running")
        print("2. Check your password in .env file")
        print("3. Verify the database name is correct")
        print("4. Ensure user has permission to connect")
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    test_mysql_connection()
