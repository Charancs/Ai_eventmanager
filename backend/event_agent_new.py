"""
AutoGen Event Extraction Agent
Uses AutoGen to create an AI agent that extracts event and date information from document text
"""

import os
import json
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.conditions import MaxMessageCondition
from autogen_ext.models.openai import OpenAIChatCompletionClient

from event_database import event_db

class EventExtractionAgent:
    def __init__(self):
        """Initialize the AutoGen event extraction agent"""
        self.client = OpenAIChatCompletionClient(
            model="gpt-3.5-turbo",
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # Create the event extraction agent
        self.extraction_agent = AssistantAgent(
            name="EventExtractor",
            model_client=self.client,
            system_message="""You are an expert event and date extraction agent. Your task is to analyze document text and extract event-related information.

**Your job is to:**
1. Find all events, meetings, deadlines, announcements, and important dates in the text
2. Extract the following information for each event:
   - title: Brief descriptive title of the event
   - description: Detailed description of the event
   - event_date: Date in YYYY-MM-DD format (if found)
   - event_time: Time in HH:MM format (if found)
   - location: Where the event takes place
   - event_type: Type of event (meeting, deadline, announcement, exam, class, seminar, etc.)
   - priority: high, medium, or low based on language used
   - participants: List of people/groups mentioned

**Important Rules:**
- Only extract events that have clear date/time information or are scheduled events
- If a date is mentioned as "next Monday" or relative dates, try to convert to actual dates if possible
- If no specific date is found, set event_date to null
- Be conservative - only extract clear, actionable events
- Return your response as a JSON array of events

**Response Format:**
```json
[
  {
    "title": "Event Title",
    "description": "Detailed description",
    "event_date": "2025-09-20",
    "event_time": "14:30",
    "location": "Room 101",
    "event_type": "meeting",
    "priority": "high",
    "participants": ["students", "faculty"]
  }
]
```

If no events are found, return an empty array: []"""
        )
    
    async def extract_events_from_text(self, text: str, role: str, department: str, 
                                     document_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Extract events from document text using AutoGen agent"""
        try:
            # Create a team with just the extraction agent
            team = RoundRobinGroupChat([self.extraction_agent])
            
            # Prepare the prompt with context
            prompt = f"""
Please analyze the following document text and extract all event-related information:

**Document Context:**
- Role: {role}
- Department: {department}
- Document ID: {document_id}

**Text to analyze:**
{text}

Please return a JSON array of extracted events following the specified format.
"""
            
            # Run the agent
            stream = team.run_stream(
                task=prompt,
                termination_condition=MaxMessageCondition(max_messages=2)
            )
            
            # Collect the response
            response_text = ""
            async for message in stream:
                if hasattr(message, 'content') and message.content:
                    response_text += str(message.content)
            
            # Parse the JSON response
            events = self._parse_agent_response(response_text)
            
            # Add metadata to each event
            for event in events:
                event['document_id'] = document_id
                event['user_id'] = user_id
                event['user_role'] = role
                event['extracted_text'] = text[:500]  # Store first 500 chars for reference
            
            return events
            
        except Exception as e:
            print(f"Error in event extraction: {e}")
            return []
    
    def _parse_agent_response(self, response_text: str) -> List[Dict[str, Any]]:
        """Parse the agent's JSON response"""
        try:
            # Find JSON in the response
            import re
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                events = json.loads(json_str)
                return events if isinstance(events, list) else []
            else:
                # Try to parse the entire response as JSON
                events = json.loads(response_text)
                return events if isinstance(events, list) else []
        except json.JSONDecodeError:
            print(f"Failed to parse agent response as JSON: {response_text}")
            return []
        except Exception as e:
            print(f"Error parsing agent response: {e}")
            return []
    
    async def process_document_events(self, text: str, role: str, department: str, 
                                    document_id: str, user_id: str) -> Dict[str, Any]:
        """Process a document and store extracted events in appropriate database table"""
        try:
            # Extract events using the AutoGen agent
            events = await self.extract_events_from_text(
                text, role, department, document_id, user_id
            )
            
            stored_events = []
            
            # Store events in appropriate database table based on role
            for event in events:
                try:
                    if role.lower() == 'admin':
                        # Store in global admin table
                        event_id = event_db.store_admin_event(event)
                        event['stored_id'] = event_id
                        event['stored_in'] = 'global_admin_events'
                    else:
                        # Store in department-specific table
                        event_id = event_db.store_department_event(department, event)
                        event['stored_id'] = event_id
                        event['stored_in'] = f'events_{department.replace(" ", "_").lower()}'
                    
                    stored_events.append(event)
                    
                except Exception as e:
                    print(f"Error storing event: {e}")
                    continue
            
            return {
                'success': True,
                'events_extracted': len(events),
                'events_stored': len(stored_events),
                'events': stored_events
            }
            
        except Exception as e:
            print(f"Error processing document events: {e}")
            return {
                'success': False,
                'error': str(e),
                'events_extracted': 0,
                'events_stored': 0,
                'events': []
            }

# Create global instance
event_agent = EventExtractionAgent()
