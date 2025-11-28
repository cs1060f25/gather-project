from app import create_app
from extensions import db

def init_db():
    app = create_app()
    with app.app_context():
        # Drop all tables first (be careful with this in production!)
        db.drop_all()
        
        # Create all database tables
        db.create_all()
        
        print("Database initialized successfully!")
        print("Database location:", app.config['SQLALCHEMY_DATABASE_URI'])

if __name__ == '__main__':
    init_db()
