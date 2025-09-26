-- AI Event Manager - Event Database Setup
-- Run this script in MySQL Workbench to create the event database and tables

-- Create database
CREATE DATABASE IF NOT EXISTS ai_eventmanager_events 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE ai_eventmanager_events;

-- Create admin events table (for college-wide events)
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
) ENGINE=InnoDB;

-- Example department tables - each department gets its own table
-- Computer Science Events
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

-- Mechanical Engineering Events
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

-- Electronics & Communication Events
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

-- Show created tables
SHOW TABLES;
