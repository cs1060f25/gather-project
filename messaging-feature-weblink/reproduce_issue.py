import unittest
import json
from app import create_app, db
from models import Event, Response

class TestEventFlow(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()
        
        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_create_and_respond(self):
        # 1. Create Event
        print("\nCreating event...")
        event_data = {
            "title": "Test Event",
            "description": "This is a test event",
            "time1": "10:00 AM",
            "time2": "11:00 AM",
            "time3": "12:00 PM"
        }
        resp = self.client.post("/event", data=event_data)
        self.assertEqual(resp.status_code, 200)
        
        data = resp.get_json()
        event_id = data.get("event_id")
        print(f"Event created with ID: {event_id}")
        
        # 2. Submit Response
        print("Submitting response...")
        response_data = {
            "name": "Test User",
            "available1": "on",
            "available2": "on",
            "available3": "on"
        }
        resp = self.client.post(f"/event/{event_id}/response", data=response_data)
        self.assertEqual(resp.status_code, 200)
        print("Response submitted successfully.")
        
        # 3. Verify Response via API
        print("Verifying response...")
        resp = self.client.get(f"/api/event/{event_id}/responses")
        self.assertEqual(resp.status_code, 200)
        
        responses = resp.get_json()
        print(f"Responses found: {len(responses)}")
        self.assertTrue(len(responses) > 0)
        
        r = responses[0]
        print(f"Responder: {r['responder_name']}")
        print(f"Available: {r['available1']}, {r['available2']}, {r['available3']}")
        
        self.assertEqual(r['responder_name'], "Test User")
        self.assertTrue(r['available1'])
        self.assertTrue(r['available2'])
        self.assertTrue(r['available3'])
        print("SUCCESS: Database logic is working correctly.")

if __name__ == "__main__":
    unittest.main()
