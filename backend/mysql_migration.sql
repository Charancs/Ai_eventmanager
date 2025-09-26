-- AI Event Manager - Database Migration Script
-- Run this script to update from old structure to new simplified structure

USE ai_eventmanager_events;

-- Step 1: Create new department tables with simplified structure (same as admin_events)
-- Computer Science Department
CREATE TABLE IF NOT EXISTS computer_science_events (
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
) ENGINE=InnoDB;

-- Electronics & Communication Department
CREATE TABLE IF NOT EXISTS electronics_events (
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
) ENGINE=InnoDB;

-- Mechanical Engineering Department
CREATE TABLE IF NOT EXISTS mechanical_events (
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
) ENGINE=InnoDB;

-- Civil Engineering Department
CREATE TABLE IF NOT EXISTS civil_events (
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
) ENGINE=InnoDB;

-- Electrical Engineering Department
CREATE TABLE IF NOT EXISTS electrical_events (
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
) ENGINE=InnoDB;

-- Information Technology Department
CREATE TABLE IF NOT EXISTS it_events (
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
) ENGINE=InnoDB;

-- MBA Department
CREATE TABLE IF NOT EXISTS mba_events (
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
) ENGINE=InnoDB;

-- MCA Department
CREATE TABLE IF NOT EXISTS mca_events (
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
) ENGINE=InnoDB;

-- Step 2: Migrate data from old tables (if they exist)
-- Note: Uncomment and run these statements only if you have existing data

-- Migrate from events_computer_science (if exists)
-- INSERT INTO computer_science_events (document_id, document_title, event_date, related_information, event_time, location, document_path, created_at, updated_at)
-- SELECT document_id, document_title, event_date, related_information, event_time, location, document_path, created_at, updated_at
-- FROM events_computer_science
-- WHERE 1=1;

-- Step 3: Drop old metadata table (uncomment if you want to clean up)
-- DROP TABLE IF EXISTS department_tables;

-- Step 4: Drop old department tables (uncomment if you want to clean up old structure)
-- DROP TABLE IF EXISTS events_computer_science;

-- Show all tables to verify
SHOW TABLES;

-- Show sample structure
DESCRIBE admin_events;
DESCRIBE computer_science_events;