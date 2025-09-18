"""
AutoGen Event Extraction Agent
Uses AutoGen to create a single AI agent that extracts event and date information from document text
The agent uses tools to directly insert events into the database
"""

import os
import json
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.conditions import TextMessageTermination
from autogen_ext.models.openai import OpenAIChatCompletionClient

from event_database import event_db

# Tool functions for the agent to use
def store_admin_event(document_id: str, document_title: str, event_date: str, 
                     related_information: str, event_time: str = None, location: str = None) -> str:
    """
    Store an event in the admin_events table.
    
    Args:
        document_id: ID of the source document
        document_title: Title of the source document
        event_date: Date in YYYY-MM-DD format (required)
        related_information: Detailed information about the event
        event_time: Time in HH:MM format (optional)
        location: Location where event takes place (optional)
    
    Returns:
        Success message with event ID
    """
    try:
        event_data = {
            'document_id': document_id,
            'document_title': document_title,
            'event_date': event_date,
            'related_information': related_information,
            'event_time': event_time,
            'location': location,
            'user_role': 'admin'
        }
        
        event_id = event_db.store_admin_event(event_data)
        return f"Successfully stored admin event with ID: {event_id}"
    except Exception as e:
        return f"Error storing admin event: {str(e)}"

def store_department_event(department: str, document_id: str, document_title: str, 
                          event_date: str, related_information: str, 
                          event_time: str = None, location: str = None) -> str:
    """
    Store an event in a department-specific table.
    
    Args:
        department: Name of the department
        document_id: ID of the source document
        document_title: Title of the source document
        event_date: Date in YYYY-MM-DD format (required)
        related_information: Detailed information about the event
        event_time: Time in HH:MM format (optional)
        location: Location where event takes place (optional)
    
    Returns:
        Success message with event ID
    """
    try:
        event_data = {
            'document_id': document_id,
            'document_title': document_title,
            'event_date': event_date,
            'related_information': related_information,
            'event_time': event_time,
            'location': location,
            'user_role': 'department'
        }
        
        event_id = event_db.store_department_event(department, event_data)
        return f"Successfully stored {department} department event with ID: {event_id}"
    except Exception as e:
        return f"Error storing department event: {str(e)}"

class EventExtractionAgent:
    def __init__(self):
        """Initialize the AutoGen single event extraction agent with database tools"""
        self.client = OpenAIChatCompletionClient(
            model="gpt-3.5-turbo",
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # Create the single event extraction agent with database tools
        self.extraction_agent = AssistantAgent(
            name="EventExtractor",
            model_client=self.client,
            tools=[store_admin_event, store_department_event],
            system_message="""You are an expert event and date extraction agent. Your task is to analyze document text and extract event-related information, then store it in the appropriate database table using the provided tools.

**Your job is to:**
1. Analyze the document text to find all events, meetings, deadlines, announcements, and important dates
2. For each event found, extract:
   - document_title: Title of the source document
   - event_date: Date in YYYY-MM-DD format (required - only extract events with clear dates)
   - related_information: ALL relevant details about the event (description, purpose, participants, requirements, etc.)
   - event_time: Time in HH:MM format (if mentioned, otherwise leave as None)
   - location: Where the event takes place (if mentioned, otherwise leave as None)

3. Use the appropriate tool to store each event:
   - Use `store_admin_event` for admin role documents
   - Use `store_department_event` for department role documents

**Important Rules:**
- Only extract events that have clear date information
- If a date is relative like "next Monday", try to convert to actual YYYY-MM-DD format
- If no specific date is found, skip that event
- For related_information, include ALL relevant details in comprehensive sentences
- Be conservative - only extract clear, actionable events
- Call the appropriate storage tool for each valid event you find

**Process:**
1. Analyze the document text
2. For each event found, call the appropriate storage tool with all extracted information
3. Provide a summary of events processed

Remember: You have the tools to directly store events in the database. Use them for each event you extract!"""
        )
    
    async def process_document_events(self, text: str, role: str, department: str, 
                                    document_id: str, user_id: str, document_title: str = "") -> Dict[str, Any]:
        """Process a document using single agent with database tools"""
        try:
            print(f"Processing document with single agent and database tools for role: {role}, department: {department}")
            
            # Prepare the prompt with context and instructions
            if role.lower() == 'admin':
                task_prompt = f"""
Please analyze the following document text and extract all event-related information. For each event you find, use the `store_admin_event` tool to store it in the database.

**Document Context:**
- Role: {role}
- Department: {department}
- Document ID: {document_id}
- Document Title: {document_title}

**Text to analyze:**
{text}

For each event you find, call the `store_admin_event` tool with:
- document_id: "{document_id}"
- document_title: "{document_title}"
- event_date: YYYY-MM-DD format
- related_information: Comprehensive event details
- event_time: HH:MM format (if available)
- location: Event location (if available)

Process all events and provide a summary of how many events were stored.
"""
            else:
                task_prompt = f"""
Please analyze the following document text and extract all event-related information. For each event you find, use the `store_department_event` tool to store it in the database.

**Document Context:**
- Role: {role}
- Department: {department}
- Document ID: {document_id}
- Document Title: {document_title}

**Text to analyze:**
{text}

For each event you find, call the `store_department_event` tool with:
- department: "{department}"
- document_id: "{document_id}"
- document_title: "{document_title}"
- event_date: YYYY-MM-DD format
- related_information: Comprehensive event details
- event_time: HH:MM format (if available)
- location: Event location (if available)

Process all events and provide a summary of how many events were stored.
"""
            
            # Run the single agent with termination condition
            termination_condition = TextMessageTermination("EventExtractor")
            
            # Run the agent directly
            result = await self.extraction_agent.run(task=task_prompt)
            
            # Count successful storage operations from the messages
            events_stored = 0
            storage_results = []
            
            if result.messages:
                for message in result.messages:
                    if hasattr(message, 'content'):
                        content = str(message.content)
                        if "Successfully stored" in content:
                            events_stored += 1
                            storage_results.append(content)
            
            print(f"Agent processed document and stored {events_stored} events")
            
            return {
                'success': True,
                'events_extracted': events_stored,
                'events_stored': events_stored,
                'storage_results': storage_results,
                'agent_type': 'single_agent_with_tools',
                'messages': [str(msg.content) if hasattr(msg, 'content') else str(msg) for msg in result.messages] if result.messages else []
            }
            
        except Exception as e:
            print(f"Error processing document events with single agent: {e}")
            return {
                'success': False,
                'error': str(e),
                'events_extracted': 0,
                'events_stored': 0,
                'storage_results': [],
                'agent_type': 'single_agent_with_tools',
                'messages': []
            }

# Create global instance
event_agent = EventExtractionAgent()
