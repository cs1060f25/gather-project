from flask import Flask
from config import config
from extensions import db, socketio
from routes import init_routes


def create_app(config_name: str = "default") -> Flask:
    """Application factory for the Gatherly messaging-feature-weblink app."""
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialise extensions
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")

    # Register routes / blueprints
    init_routes(app, socketio, db)

    return app


if __name__ == "__main__":
    app = create_app()
    # Use socketio.run so Socket.IO works properly
    socketio.run(app, host="0.0.0.0", port=5001, debug=True)
