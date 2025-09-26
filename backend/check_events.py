import pickle
import os

try:
    with open('storage/college_events/college_events_index.pkl', 'rb') as f:
        data = pickle.load(f)
    
    print(f'Total events: {len(data.get("events", []))}')
    print('\nEvents details:')
    
    for i, event in enumerate(data.get('events', []), 1):
        print(f'Event {i}:')
        print(f'  Title: {event.get("title", "N/A")}')
        print(f'  Filename: {event.get("filename", "N/A")}') 
        print(f'  Document Path: {event.get("document_path", "N/A")}')
        print(f'  Event Type: {event.get("event_type", "N/A")}')
        print(f'  ID: {event.get("id", "N/A")}')
        
        # Check if file exists
        doc_path = event.get("document_path")
        if doc_path and os.path.exists(doc_path):
            print(f'  File exists: YES at {doc_path}')
        else:
            print(f'  File exists: NO - path {doc_path}')
        print('---')

except Exception as e:
    print(f'Error: {e}')