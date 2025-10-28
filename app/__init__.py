from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import pandas as pd
import os
from datetime import datetime, timedelta
import json

def create_app():
    app = Flask(__name__)
    app.secret_key = 'your-secret-key-here'  # For session management
    
    # Load the LinkedIn profiles data
    def load_profiles():
        csv_path = os.path.join(os.path.dirname(__file__), 'data', 'linkedin_profiles.csv')
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            # Convert last_active to datetime for sorting
            if 'last_active' in df.columns:
                df['last_active'] = pd.to_datetime(df['last_active'])
            return df
        return pd.DataFrame()
    
    # Save chat messages (in-memory for this prototype)
    if 'chats' not in globals():
        global chats
        chats = {}
    
    def get_or_create_chat(user1_id, user2_id):
        chat_id = f"{min(user1_id, user2_id)}_{max(user1_id, user2_id)}"
        if chat_id not in chats:
            chats[chat_id] = {
                'participants': [user1_id, user2_id],
                'messages': [],
                'created_at': datetime.now().isoformat(),
                'last_activity': datetime.now().isoformat()
            }
        return chat_id
    
    @app.route('/')
    def index():
        df = load_profiles()
        # Get current user ID (in a real app, this would come from authentication)
        current_user_id = request.cookies.get('user_id')
        if not current_user_id and not df.empty:
            current_user_id = df.iloc[0]['id']  # Default to first user for demo
        
        # Get available users for chat (excluding current user)
        available_users = []
        if not df.empty and current_user_id in df['id'].values:
            available_users = df[df['chat_available'] & (df['id'] != current_user_id)].to_dict('records')
        
        return render_template('index.html', current_user_id=current_user_id, available_users=available_users)
    
    @app.route('/search', methods=['POST'])
    def search():
        query = request.form.get('query', '').lower()
        df = load_profiles()
        
        if query:
            # Search in names and headlines
            mask = (df['first_name'].str.lower().str.contains(query) |
                   df['last_name'].str.lower().str.contains(query) |
                   df['headline'].str.lower().str.contains(query))
            results = df[mask].to_dict('records')
        else:
            results = df.head(5).to_dict('records')
            
        return jsonify(results)
    
    @app.route('/profile/<profile_id>')
    def get_profile(profile_id):
        df = load_profiles()
        profile = df[df['id'] == profile_id].iloc[0].to_dict()
        
        # Get current user ID (in a real app, this would come from authentication)
        current_user_id = request.cookies.get('user_id')
        if not current_user_id and not df.empty:
            current_user_id = df.iloc[0]['id']  # Default to first user for demo
        
        # Check if chat exists between current user and profile
        chat_id = None
        if current_user_id and current_user_id != profile_id:
            chat_id = f"{min(current_user_id, profile_id)}_{max(current_user_id, profile_id)}"
        
        return render_template('profile.html', 
                             profile=profile, 
                             current_user_id=current_user_id,
                             chat_id=chat_id)
    
    # Chat-related endpoints
    @app.route('/api/chat/start', methods=['POST'])
    def start_chat():
        data = request.json
        user1_id = data.get('user1_id')
        user2_id = data.get('user2_id')
        
        if not user1_id or not user2_id:
            return jsonify({'error': 'Missing user IDs'}), 400
            
        chat_id = get_or_create_chat(user1_id, user2_id)
        return jsonify({'chat_id': chat_id})
    
    @app.route('/api/chat/<chat_id>/messages', methods=['GET'])
    def get_messages(chat_id):
        if chat_id not in chats:
            return jsonify({'messages': []})
        return jsonify({'messages': chats[chat_id]['messages']})
    
    @app.route('/api/chat/<chat_id>/send', methods=['POST'])
    def send_message(chat_id):
        if chat_id not in chats:
            return jsonify({'error': 'Chat not found'}), 404
            
        data = request.json
        message = {
            'id': len(chats[chat_id]['messages']) + 1,
            'sender_id': data.get('sender_id'),
            'content': data.get('content'),
            'timestamp': datetime.now().isoformat(),
            'read': False
        }
        
        chats[chat_id]['messages'].append(message)
        chats[chat_id]['last_activity'] = datetime.now().isoformat()
        
        return jsonify(message)
    
    @app.route('/api/users/available', methods=['GET'])
    def get_available_users():
        df = load_profiles()
        current_user_id = request.args.get('current_user_id')
        
        if current_user_id and not df.empty:
            available_users = df[
                (df['chat_available'] == True) & 
                (df['id'] != current_user_id)
            ].to_dict('records')
            
            # Add chat status for each user
            for user in available_users:
                chat_id = f"{min(current_user_id, user['id'])}_{max(current_user_id, user['id'])}"
                user['has_existing_chat'] = chat_id in chats
                
                if chat_id in chats:
                    # Get last message if chat exists
                    messages = chats[chat_id]['messages']
                    if messages:
                        user['last_message'] = messages[-1]['content']
                        user['last_message_time'] = messages[-1]['timestamp']
            
            return jsonify(available_users)
        
        return jsonify([])
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
