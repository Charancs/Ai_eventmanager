#!/usr/bin/env python3
"""
Seed script to create test users in the SQLite database
Run this script to populate the database with sample users for testing
"""

from auth_db import UserDatabase

def seed_database():
    """Create test users for all roles"""
    db = UserDatabase()
    
    print("Seeding database with test users...")
    
    # Test users data
    test_users = [
        {
            "username": "admin",
            "email": "admin@college.edu",
            "password": "password123",
            "role": "admin",
            "department": "Administration"
        },
        {
            "username": "dept_admin", 
            "email": "cs.admin@college.edu",
            "password": "password123",
            "role": "department",
            "department": "Computer Science"
        },
        {
            "username": "teacher1",
            "email": "john.teacher@college.edu", 
            "password": "password123",
            "role": "teacher",
            "department": "Computer Science"
        },
        {
            "username": "student1",
            "email": "jane.student@college.edu",
            "password": "password123", 
            "role": "student",
            "department": "Computer Science"
        },
        {
            "username": "student2",
            "email": "mike.student@college.edu",
            "password": "password123",
            "role": "student", 
            "department": "Computer Science"
        }
    ]
    
    # Create users
    created_users = []
    for user_data in test_users:
        try:
            # Check if user already exists
            existing_user = db.get_user_by_username(user_data["username"])
            if existing_user:
                print(f"User '{user_data['username']}' already exists, skipping...")
                continue
                
            # Create new user
            user_id = db.create_user(
                username=user_data["username"],
                email=user_data["email"], 
                password=user_data["password"],
                role=user_data["role"],
                department=user_data["department"]
            )
            
            created_users.append({
                "id": user_id,
                "username": user_data["username"],
                "email": user_data["email"],
                "role": user_data["role"]
            })
            
            print(f"✅ Created user: {user_data['username']} ({user_data['role']})")
            
        except Exception as e:
            print(f"❌ Error creating user {user_data['username']}: {e}")
    
    print(f"\n🎉 Database seeding completed! Created {len(created_users)} users.")
    print("\nTest Login Credentials:")
    print("=" * 50)
    for user_data in test_users:
        print(f"Role: {user_data['role'].title()}")
        print(f"Username: {user_data['username']}")
        print(f"Password: {user_data['password']}")
        print(f"Email: {user_data['email']}")
        print("-" * 30)

if __name__ == "__main__":
    seed_database()
