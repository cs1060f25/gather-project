import unittest
import os
import tempfile
from app import create_app
from extensions import db
from models import Event, Response
import json
from datetime import datetime, timedelta

class TestResponseSubmission(unittest.TestCase):
    def setUp(self):
        # Create a test client with testing configuration
        self.app = create_app('development')
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        
        self.client = self.app.test_client()
        
        # Create the database and load test data
        with self.app.app_context():
            db.create_all()
            self.create_test_event()
    
    def tearDown(self):
        # Clean up the database after each test
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
    
    def create_test_event(self):
        """Helper method to create a test event"""
        test_event = Event(
            id='test-event-123',
            title='Test Event',
            description='A test event',
            time1='2023-01-01 10:00',
            time2='2023-01-01 12:00',
            time3='2023-01-01 14:00',
            token='test-token-123',
            created_at=datetime.utcnow()
        )
        db.session.add(test_event)
        db.session.commit()
    
    def test_response_submission_and_retrieval(self):
        """Test that a response is properly saved and can be retrieved"""
        # Test data
        response_data = {
            'name': 'Test User',
            'available1': 'on',
            'available2': 'off',
            'available3': 'on'
        }
        
        # Submit a response
        with self.app.app_context():
            response = self.client.post(
                '/event/test-event-123/response',
                data=response_data,
                follow_redirects=True,
                content_type='application/x-www-form-urlencoded'
            )
            
            # Check that the response was successful
            self.assertEqual(response.status_code, 200)
            response_json = json.loads(response.data)
            self.assertEqual(response_json.get('status'), 'success')
            
            # Check that the response is in the database
            db_response = Response.query.filter_by(
                event_id='test-event-123',
                responder_name='Test User'
            ).first()
            
            self.assertIsNotNone(db_response, "Response not found in database")
            self.assertTrue(db_response.available1)
            self.assertFalse(db_response.available2)
            self.assertTrue(db_response.available3)
            
            # Check that the response appears in the organizer's view
            response = self.client.get('/event/test-event-123')
            self.assertEqual(response.status_code, 200)
            response_data = response.get_data(as_text=True)
            self.assertIn('Test User', response_data)
            self.assertIn('10:00', response_data)  # Check time slot 1 is displayed
            self.assertIn('12:00', response_data)  # Check time slot 2 is displayed
            self.assertIn('14:00', response_data)  # Check time slot 3 is displayed
    
    def test_response_with_empty_name(self):
        """Test that a response with an empty name is rejected"""
        with self.app.app_context():
            response_data = {
                'name': '',  # Empty name
                'available1': 'on',
                'available2': 'on',
                'available3': 'on'
            }
            
            response = self.client.post(
                '/event/test-event-123/response',
                data=response_data,
                follow_redirects=True,
                content_type='application/x-www-form-urlencoded'
            )
            
            # Should return 400 Bad Request
            self.assertEqual(response.status_code, 400)
            response_json = json.loads(response.data)
            self.assertIn('error', response_json)
            
            # Verify no response was saved to the database
            count = Response.query.filter_by(event_id='test-event-123').count()
            self.assertEqual(count, 0)
    
    def test_response_api_endpoint(self):
        """Test the API endpoint for retrieving responses"""
        with self.app.app_context():
            # Create a test response directly in the database
            test_response = Response(
                event_id='test-event-123',
                responder_name='API Test User',
                available1=True,
                available2=False,
                available3=True
            )
            db.session.add(test_response)
            db.session.commit()
            
            # Test the API endpoint
            response = self.client.get('/api/event/test-event-123/responses')
            self.assertEqual(response.status_code, 200)
            responses = json.loads(response.data)
            
            # Should have one response
            self.assertEqual(len(responses), 1)
            self.assertEqual(responses[0]['responder_name'], 'API Test User')
            self.assertTrue(responses[0]['available1'])
            self.assertFalse(responses[0]['available2'])
            self.assertTrue(responses[0]['available3'])

if __name__ == '__main__':
    unittest.main()
