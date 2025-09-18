-- AI Event Manager - Event Database Setup
-- Run this script in MySQL Workbench to create the event database and tables

-- Create database
CREATE DATABASE IF NOT EXISTS ai_eventmanager_events 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE ai_eventmanager_events;

-- Create admin events table
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
) ENGINE=InnoDB;

-- Create department tables metadata
CREATE TABLE IF NOT EXISTS department_tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department VARCHAR(255) NOT NULL UNIQUE,
    table_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_department (department)
) ENGINE=InnoDB;

-- Example department table (Computer Science)
-- This will be created automatically when first document is uploaded from CS department
CREATE TABLE IF NOT EXISTS events_computer_science (
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
) ENGINE=InnoDB;

-- Insert metadata for the example department table
INSERT INTO department_tables (department, table_name) 
VALUES ('Computer Science', 'events_computer_science')
ON DUPLICATE KEY UPDATE table_name = VALUES(table_name);

-- Show created tables
SHOW TABLES;

-- Show admin_events table structure
DESCRIBE admin_events;

-- Show department_tables structure
DESCRIBE department_tables;

-- Show example department table structure
DESCRIBE events_computer_science;
