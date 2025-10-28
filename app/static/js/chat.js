// Chat functionality for Gatherly

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatWidget = document.getElementById('chatWidget');
    const chatToggle = document.getElementById('chatToggle');
    const chatHeader = document.getElementById('chatHeader');
    const chatContent = document.getElementById('chatContent');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessage');
    const minimizeChat = document.getElementById('minimizeChat');
    const closeChat = document.getElementById('closeChat');
    const unreadCount = document.getElementById('unreadCount');
    
    // State
    let currentChatId = null;
    let currentRecipientId = null;
    let currentUserId = null;
    let unreadMessages = 0;
    let isChatOpen = false;
    let messagePolling = null;
    
    // Initialize chat
    function initChat() {
        // Get current user ID from cookie or data attribute
        currentUserId = document.cookie.match('(^|;)\s*user_id\s*=\s*([^;]+)')?.pop() || 
                       document.body.getAttribute('data-user-id');
        
        if (!currentUserId) {
            console.error('No user ID found');
            return;
        }
        
        // Set up event listeners
        setupEventListeners();
        
        // Load available users
        loadAvailableUsers();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Toggle chat widget
        chatToggle.addEventListener('click', toggleChat);
        
        // Chat header for dragging/minimizing
        chatHeader.addEventListener('click', (e) => {
            if (e.target === chatHeader || e.target.tagName === 'H3') {
                toggleChatContent();
            }
        });
        
        // Minimize/maximize chat
        minimizeChat.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleChatContent();
        });
        
        // Close chat
        closeChat.addEventListener('click', (e) => {
            e.stopPropagation();
            closeChatWidget();
        });
        
        // Send message on button click
        sendMessageBtn.addEventListener('click', sendMessage);
        
        // Send message on Enter key
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && messageInput.value.trim() !== '') {
                sendMessage();
            }
        });
    }
    
    // Toggle chat widget visibility
    function toggleChat() {
        if (chatWidget.style.display === 'none' || !chatWidget.style.display) {
            openChatWidget();
        } else {
            closeChatWidget();
        }
    }
    
    // Toggle chat content (minimize/maximize)
    function toggleChatContent() {
        const content = chatWidget.querySelector('#chatContent').parentNode;
        const isHidden = content.style.display === 'none';
        
        if (isHidden) {
            content.style.display = 'flex';
            minimizeChat.innerHTML = '<i class="fas fa-minus"></i>';
            // Reset unread count when opening chat
            if (unreadMessages > 0) {
                unreadMessages = 0;
                updateUnreadCount();
            }
        } else {
            content.style.display = 'none';
            minimizeChat.innerHTML = '<i class="fas fa-plus"></i>';
        }
    }
    
    // Open chat widget
    function openChatWidget() {
        chatWidget.style.display = 'flex';
        isChatOpen = true;
        
        // Reset unread count when opening chat
        if (unreadMessages > 0) {
            unreadMessages = 0;
            updateUnreadCount();
        }
        
        // Start polling for new messages
        startMessagePolling();
    }
    
    // Close chat widget
    function closeChatWidget() {
        chatWidget.style.display = 'none';
        isChatOpen = false;
        
        // Stop polling for messages when chat is closed
        stopMessagePolling();
    }
    
    // Start polling for new messages
    function startMessagePolling() {
        // Clear any existing polling
        stopMessagePolling();
        
        // Poll for new messages every 5 seconds
        messagePolling = setInterval(() => {
            if (currentChatId) {
                loadMessages(currentChatId);
            } else {
                loadAvailableUsers();
            }
        }, 5000);
        
        // Initial load
        if (currentChatId) {
            loadMessages(currentChatId);
        } else {
            loadAvailableUsers();
        }
    }
    
    // Stop polling for messages
    function stopMessagePolling() {
        if (messagePolling) {
            clearInterval(messagePolling);
            messagePolling = null;
        }
    }
    
    // Update unread message count
    function updateUnreadCount() {
        if (unreadMessages > 0) {
            unreadCount.textContent = unreadMessages > 9 ? '9+' : unreadMessages;
            unreadCount.style.display = 'flex';
        } else {
            unreadCount.style.display = 'none';
        }
    }
    
    // Load available users to chat with
    function loadAvailableUsers() {
        if (!currentUserId) return;
        
        fetch(`/api/users/available?current_user_id=${currentUserId}`)
            .then(response => response.json())
            .then(users => {
                renderUserList(users);
            })
            .catch(error => {
                console.error('Error loading users:', error);
            });
    }
    
    // Render the list of available users
    function renderUserList(users) {
        if (!users || users.length === 0) {
            chatContent.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <p>No users available for chat</p>
                </div>
            `;
            return;
        }
        
        const userList = document.createElement('div');
        userList.className = 'divide-y divide-gray-200';
        
        users.forEach(user => {
            const lastMessage = user.last_message ? 
                `<p class="text-sm text-gray-600 truncate">${user.last_message}</p>` : 
                '<p class="text-sm text-gray-400 italic">No messages yet</p>';
                
            const lastMessageTime = user.last_message_time ? 
                `<span class="text-xs text-gray-400">${formatTimeAgo(user.last_message_time)}</span>` : '';
                
            const unreadBadge = user.has_unread ? 
                '<span class="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></span>' : '';
            
            const userElement = document.createElement('div');
            userElement.className = 'p-3 hover:bg-gray-50 cursor-pointer relative';
            userElement.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                        <div class="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                            ${user.first_name[0]}${user.last_name[0]}
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between">
                            <p class="text-sm font-medium text-gray-900 truncate">
                                ${user.first_name} ${user.last_name}
                            </p>
                            ${lastMessageTime}
                        </div>
                        ${lastMessage}
                    </div>
                    ${unreadBadge}
                </div>
            `;
            
            userElement.addEventListener('click', () => {
                startNewChat(user);
            });
            
            userList.appendChild(userElement);
        });
        
        // Clear existing content and add user list
        chatContent.innerHTML = '';
        chatContent.appendChild(userList);
        
        // Update chat header
        const chatHeader = document.querySelector('#chatHeader h3');
        if (chatHeader) {
            chatHeader.textContent = 'Messages';
        }
    }
    
    // Start a new chat with a user
    function startNewChat(user) {
        currentRecipientId = user.id;
        
        // Create or get chat ID
        fetch('/api/chat/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user1_id: currentUserId,
                user2_id: user.id
            })
        })
        .then(response => response.json())
        .then(data => {
            currentChatId = data.chat_id;
            loadMessages(currentChatId);
            
            // Update chat header
            const chatHeader = document.querySelector('#chatHeader h3');
            if (chatHeader) {
                chatHeader.textContent = `${user.first_name} ${user.last_name}`;
            }
            
            // Focus on message input
            messageInput.focus();
        })
        .catch(error => {
            console.error('Error starting chat:', error);
        });
    }
    
    // Load messages for a chat
    function loadMessages(chatId) {
        fetch(`/api/chat/${chatId}/messages`)
            .then(response => response.json())
            .then(data => {
                renderMessages(data.messages);
                
                // Scroll to bottom of chat
                chatContent.scrollTop = chatContent.scrollHeight;
                
                // Update unread count
                if (!isChatOpen) {
                    unreadMessages = data.messages.filter(m => 
                        !m.read && m.sender_id !== currentUserId
                    ).length;
                    updateUnreadCount();
                }
            })
            .catch(error => {
                console.error('Error loading messages:', error);
            });
    }
    
    // Render messages in the chat
    function renderMessages(messages) {
        if (!messages || messages.length === 0) {
            chatContent.innerHTML = `
                <div class="flex-1 flex items-center justify-center">
                    <p class="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
            `;
            return;
        }
        
        const messagesContainer = document.createElement('div');
        messagesContainer.className = 'space-y-4 w-full';
        
        messages.forEach(message => {
            const isCurrentUser = message.sender_id === currentUserId;
            const messageElement = document.createElement('div');
            messageElement.className = `flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`;
            
            messageElement.innerHTML = `
                <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isCurrentUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}">
                    <p>${message.content}</p>
                    <p class="text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'} text-right">
                        ${formatTime(message.timestamp)}
                    </p>
                </div>
            `;
            
            messagesContainer.appendChild(messageElement);
        });
        
        // Clear existing content and add messages
        chatContent.innerHTML = '';
        chatContent.appendChild(messagesContainer);
    }
    
    // Send a new message
    function sendMessage() {
        const content = messageInput.value.trim();
        if (!content || !currentChatId || !currentUserId) return;
        
        fetch(`/api/chat/${currentChatId}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sender_id: currentUserId,
                content: content
            })
        })
        .then(response => response.json())
        .then(message => {
            // Clear input
            messageInput.value = '';
            
            // Reload messages
            loadMessages(currentChatId);
        })
        .catch(error => {
            console.error('Error sending message:', error);
        });
    }
    
    // Format timestamp to relative time (e.g., "2 minutes ago")
    function formatTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };
        
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
            }
        }
        
        return 'Just now';
    }
    
    // Format time to HH:MM
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Initialize chat when DOM is loaded
    initChat();
});
