#!/usr/bin/env python3
"""
Development server runner for Gatherly Flask backend
"""

if __name__ == '__main__':
    from app import app
    import os
    
    port = int(os.getenv('PORT', 5001))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    
    print(f"🚀 Starting Gatherly Backend (Flask) on port {port}")
    print(f"📡 Health check: http://localhost:{port}/health")
    print(f"🤖 Chat API: http://localhost:{port}/api/chat")
    print(f"🔧 Debug mode: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
