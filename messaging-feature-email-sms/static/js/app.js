// Initialize Socket.IO with the correct path
const socket = io({
  path: '/socket.io',
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

// DOM Elements
const rowsEl = document.getElementById('rows');
const phoneEl = document.getElementById('phone');
const carrierEl = document.getElementById('carrier');
const messageEl = document.getElementById('message');
const messageForm = document.getElementById('messageForm');
const sendBtn = document.getElementById('send');

// Format timestamp to readable date
function formatTimestamp(timestamp) {
  if (!timestamp) return 'Just now';
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  // Return relative time if recent
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  
  // Otherwise return full date
  return date.toLocaleString();
}

// Get status class for styling
function getStatusClass(status) {
  if (!status) return '';
  status = status.toLowerCase();
  if (status.includes('sent')) return 'status-sent';
  if (status.includes('delivered')) return 'status-delivered';
  if (status.includes('failed')) return 'status-failed';
  if (status.includes('responded')) return 'status-responded';
  return '';
}

// Format phone number for display
function formatPhoneNumber(phone) {
  if (!phone) return '';
  // Remove all non-digit characters
  const cleaned = ('' + phone).replace(/\D/g, '');
  // Format as (XXX) XXX-XXXX
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

// Format carrier name for display
function formatCarrier(carrier) {
  if (!carrier) return '';
  return carrier.charAt(0).toUpperCase() + carrier.slice(1);
}

// Create HTML for a message row
function createMessageRow(rec) {
  const row = document.createElement('tr');
  row.dataset.id = rec.id;
  row.className = 'message-row';
  
  const statusClass = getStatusClass(rec.status);
  const formattedPhone = formatPhoneNumber(rec.phone_number);
  const formattedCarrier = formatCarrier(rec.carrier);
  
  row.innerHTML = `
    <td>${formatTimestamp(rec.timestamp)}</td>
    <td>${formattedPhone}</td>
    <td>${formattedCarrier}</td>
    <td class="message-content">${rec.question || ''}</td>
    <td class="status-cell ${statusClass}">${rec.status || 'Pending'}</td>
    <td class="response-cell">${rec.response || 'No response yet'}</td>
  `;
  
  return row;
}

// Update or insert a row in the messages table
function upsertRow(rec) {
  // Check if this is the first message (placeholder row)
  const placeholderRow = rowsEl.querySelector('tr:only-child td[colspan]');
  if (placeholderRow) {
    rowsEl.innerHTML = `
      <tr>
        <th>Time</th>
        <th>Phone</th>
        <th>Carrier</th>
        <th>Message</th>
        <th>Status</th>
        <th>Response</th>
      </tr>
    `;
  }
  
  let row = rowsEl.querySelector(`tr[data-id="${rec.id}"]`);
  
  if (row) {
    // Update existing row
    const cells = row.querySelectorAll('td');
    if (cells.length >= 6) {
      // Update status cell
      if (rec.status) {
        const statusCell = cells[4];
        statusCell.textContent = rec.status;
        statusCell.className = `status-cell ${getStatusClass(rec.status)}`;
      }
      
      // Update response cell
      if (rec.response !== undefined) {
        cells[5].textContent = rec.response || 'No response yet';
      }
    }
  } else {
    // Insert new row at the top
    row = createMessageRow(rec);
    const firstRow = rowsEl.querySelector('tr:not([data-id])');
    if (firstRow) {
      rowsEl.insertBefore(row, firstRow.nextSibling);
    } else {
      rowsEl.appendChild(row);
    }
  }
  
  return row;
}

// Handle initial data load
socket.on('initial_data', (data) => {
  if (!data || Object.keys(data).length === 0) {
    // No messages yet, ensure placeholder is shown
    if (!rowsEl.querySelector('tr:only-child td[colspan]')) {
      rowsEl.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-secondary);">
            No messages sent yet
          </td>
        </tr>
      `;
    }
    return;
  }
  
  // Clear existing rows
  rowsEl.innerHTML = `
    <tr>
      <th>Time</th>
      <th>Phone</th>
      <th>Carrier</th>
      <th>Message</th>
      <th>Status</th>
      <th>Response</th>
    </tr>
  `;
  
  // Sort by timestamp (newest first)
  const sortedData = Object.values(data).sort((a, b) => 
    (b.timestamp || 0) - (a.timestamp || 0)
  );
  
  // Add rows
  sortedData.forEach(rec => upsertRow(rec));
});

// Handle new message event
socket.on('new_message', (message) => {
  if (message && message.id) {
    upsertRow(message);
  }
});

// Handle status updates
socket.on('status_update', (payload) => {
  if (payload && payload.message_sid) {
    const row = rowsEl.querySelector(`tr[data-id="${payload.message_sid}"]`);
    if (row && payload.status) {
      const statusCell = row.querySelector('.status-cell');
      if (statusCell) {
        statusCell.textContent = payload.status;
        statusCell.className = `status-cell ${getStatusClass(payload.status)}`;
      }
    }
  }
});

// Handle incoming responses
socket.on('response_received', (payload) => {
  if (payload && payload.message_sid) {
    const row = rowsEl.querySelector(`tr[data-id="${payload.message_sid}"]`);
    if (row) {
      const statusCell = row.querySelector('.status-cell');
      const responseCell = row.querySelector('.response-cell');
      
      if (statusCell) {
        statusCell.textContent = 'Responded';
        statusCell.className = 'status-cell status-responded';
      }
      
      if (responseCell) {
        responseCell.textContent = payload.response || 'No response';
      }
    }
  }
});

// Handle form submission
async function handleSendMessage(e) {
  e.preventDefault();
  
  const phone = phoneEl.value.trim();
  const carrier = carrierEl.value;
  const message = messageEl.value.trim();
  
  // Validate inputs
  if (!phone || !carrier || !message) {
    showNotification('Please fill in all fields', 'error');
    return;
  }
  
  // Basic phone number validation
  const phoneRegex = /^\+?[0-9\s\-()]{10,}$/;
  if (!phoneRegex.test(phone)) {
    showNotification('Please enter a valid phone number', 'error');
    return;
  }
  
  // Disable form during submission
  const buttonText = sendBtn.querySelector('.button-text');
  const buttonLoader = sendBtn.querySelector('.button-loader');
  const originalButtonText = buttonText.textContent;
  
  sendBtn.disabled = true;
  buttonText.textContent = 'Sending...';
  buttonLoader.style.display = 'inline';
  
  try {
    const response = await fetch('/send_sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone, 
        carrier, 
        message 
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send message');
    }
    
    // Clear form on success
    messageEl.value = '';
    document.getElementById('charCount').textContent = '0';
    
    // Show success message
    showNotification('Message sent successfully!', 'success');
    
  } catch (error) {
    console.error('Error sending message:', error);
    showNotification(`Error: ${error.message || 'Failed to send message'}`, 'error');
  } finally {
    // Re-enable form
    sendBtn.disabled = false;
    buttonText.textContent = originalButtonText;
    buttonLoader.style.display = 'none';
  }
}

// Show notification to user
function showNotification(message, type = 'info') {
  // Remove any existing notifications
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Add styles
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.padding = '12px 20px';
  notification.style.borderRadius = '8px';
  notification.style.color = 'white';
  notification.style.fontSize = '14px';
  notification.style.zIndex = '1000';
  notification.style.opacity = '0';
  notification.style.transform = 'translateY(20px)';
  notification.style.transition = 'opacity 0.3s, transform 0.3s';
  
  // Style based on type
  if (type === 'error') {
    notification.style.background = '#ef4444';
  } else if (type === 'success') {
    notification.style.background = '#10b981';
  } else {
    notification.style.background = '#3b82f6';
  }
  
  document.body.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  }, 10);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Add event listeners
if (messageForm) {
  messageForm.addEventListener('submit', handleSendMessage);
} else if (sendBtn) {
  sendBtn.addEventListener('click', handleSendMessage);
}

// Initialize the table with empty state if needed
if (rowsEl && !rowsEl.querySelector('tr')) {
  rowsEl.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-secondary);">
        No messages sent yet
      </td>
    </tr>
  `;
}
