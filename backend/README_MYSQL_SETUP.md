# MySQL Database Setup Instructions

## Prerequisites
1. Install MySQL Server and MySQL Workbench
2. Make sure MySQL server is running

## Database Setup Steps

### 1. Open MySQL Workbench
- Connect to your local MySQL server
- Use root user or create a new user with database creation privileges

### 2. Create Database and Tables
- **For New Installation**: Open the `mysql_setup.sql` file in MySQL Workbench
- **For Upgrading Existing Setup**: Open the `mysql_migration.sql` file instead
- Execute the entire script to create:
  - Database: `ai_eventmanager_events`
  - College events table: `admin_events`
  - Department-specific event tables: `computer_science_events`, `mechanical_events`, etc.

### 3. New Simplified Structure
The database now uses a simplified structure:
- **College Events**: Stored in `admin_events` table
- **Department Events**: Each department has its own table (e.g., `computer_science_events`, `mechanical_events`)
- **No metadata table**: Removed `department_tables` - departments are identified by table names
- **Unified structure**: All event tables have the same schema (same as admin_events)

### 4. Configure Environment Variables
- Copy `.env.example` to `.env`
- Update the MySQL connection settings:
  ```
  MYSQL_HOST=localhost
  MYSQL_PORT=3306
  MYSQL_USER=root
  MYSQL_PASSWORD=your_mysql_password
  MYSQL_DATABASE=ai_eventmanager_events
  ```

### 4. Database Schema

#### Admin Events Table (`admin_events`)
Stores events uploaded by admin users:
- `id`: Auto-increment primary key
- `document_id`: Unique document identifier
- `document_title`: Title of the uploaded document
- `event_date`: Date of the event (YYYY-MM-DD)
- `related_information`: Comprehensive event details
- `event_time`: Time of event (HH:MM) - can be NULL
- `location`: Event location - can be NULL
- `created_at`: Timestamp when record was created
- `updated_at`: Timestamp when record was last updated

#### Department Events Tables (`events_{department_name}`)
Stores events by department (created dynamically):
- Same structure as admin_events table
- Additional field: `user_role` (department_admin, teacher, student)
- Examples: `events_computer_science`, `events_mathematics`, etc.

#### Department Tables Metadata (`department_tables`)
Tracks which department tables exist:
- `department`: Department name
- `table_name`: Corresponding table name
- `created_at`: When the table was created

### 5. How It Works
1. When a document is uploaded:
   - AutoGen agent extracts event information
   - For admin role: stores in `admin_events` table
   - For other roles: stores in department-specific table
   - Creates new department table if it doesn't exist

2. Extracted data includes:
   - Document unique ID and title
   - Event date and time (if available)
   - Comprehensive event information
   - Location (if mentioned)

### 6. API Endpoints
- `GET /api/events/admin` - Get admin events
- `GET /api/events/department/{department}` - Get department events
- `GET /api/events/departments` - List all departments

### 7. Testing
After setup, upload a document through the frontend and check:
1. Document processing works
2. Events are extracted and stored in MySQL
3. Check the appropriate table (admin_events or department table)

### 8. Troubleshooting
- Verify MySQL server is running
- Check database connection credentials in .env
- Ensure database and tables exist
- Check Python MySQL connector is installed
