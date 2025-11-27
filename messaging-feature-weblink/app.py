import os
from flask import Flask
from flask_socketio import SocketIO
from config import config
from extensions import db, socketio

# Initialize extensions
# db and socketio are initialized in extensions.py

def create_app(config_name='default'):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")
    
    # Import models after db initialization to avoid circular imports
    with app.app_context():
        # Import models here to ensure they're registered with SQLAlchemy
        from models import Event, TimeSlot, Response
        # Create database tables
        db.create_all()
    
    # Import and register routes
    from routes import init_routes
    init_routes(app, socketio, db)
    
    return app

# Only create app instance when this file is run directly
if __name__ == '__main__':
    app = create_app()
    socketio.run(app, debug=True, port=5001)
