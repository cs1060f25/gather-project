// Connect to the Socket.IO server
const socket = io();

document.addEventListener('DOMContentLoaded', function() {
    const questionForm = document.getElementById('questionForm');
    const responsesTable = document.getElementById('responsesTable');
    
    // Handle form submission
    questionForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const phoneNumber = document.getElementById('phoneNumber').value;
        const questionId = document.getElementById('questionId').value;
        const question = document.getElementById('question').value;
        
        try {
            const response = await fetch('/send_question', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone_number: phoneNumber,
                    question_id: questionId,
                    question: question
                })
            });
            
            const result = await response.json();
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                // Clear the form
                questionForm.reset();
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while sending the question.');
        }
    });
    
    // Function to update the responses table
    function updateResponsesTable(responses) {
        // Clear existing rows
        responsesTable.innerHTML = '';
        
        // Add each response as a row
        Object.entries(responses).forEach(([sid, data]) => {
            const row = document.createElement('tr');
            row.setAttribute('data-sid', sid);  // Add data attribute for message SID
            
            // Format the phone number for display
            const phoneNumber = data.phone_number || '';
            const formattedPhone = phoneNumber.startsWith('+1') 
                ? `(${phoneNumber.substring(2, 5)}) ${phoneNumber.substring(5, 8)}-${phoneNumber.substring(8)}`
                : phoneNumber;
            
            // Set the status badge class based on the status
            let statusClass = 'bg-gray-100 text-gray-800';
            if (data.status === 'sent') statusClass = 'bg-blue-100 text-blue-800';
            else if (data.status === 'delivered') statusClass = 'bg-green-100 text-green-800';
            else if (data.status === 'responded') statusClass = 'bg-purple-100 text-purple-800';
            else if (data.status === 'failed') statusClass = 'bg-red-100 text-red-800';
            
            // Set the response badge class
            let responseClass = 'bg-gray-100 text-gray-800';
            let responseText = 'No response';
            if (data.response === 'YES') {
                responseClass = 'bg-green-100 text-green-800';
                responseText = 'YES';
            } else if (data.response === 'NO') {
                responseClass = 'bg-red-100 text-red-800';
                responseText = 'NO';
            }
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${data.question_id || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formattedPhone}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${data.question || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap status-cell">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                        ${data.status || 'unknown'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap response-cell">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${responseClass}">
                        ${responseText}
                    </span>
                </td>
            `;
            
            responsesTable.appendChild(row);
        });
    }
    
    // Handle initial data
    socket.on('initial_data', (data) => {
        updateResponsesTable(data);
    });
    
    // Handle status updates
    socket.on('status_update', (data) => {
        // In a real app, you would update the specific row
        // For simplicity, we'll just reload all data
        socket.emit('get_initial_data');
    });
    
    // Handle new responses
    socket.on('response_received', (data) => {
        console.log('Response received:', data);
        // Find and update the specific row
        const rows = document.querySelectorAll('#responsesTable tr');
        let found = false;
        
        for (const row of rows) {
            if (row.getAttribute('data-sid') === data.message_sid) {
                // Update status
                const statusCell = row.querySelector('.status-cell');
                if (statusCell) {
                    statusCell.innerHTML = `
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            responded
                        </span>
                    `;
                }
                
                // Update response
                const responseCell = row.querySelector('.response-cell');
                if (responseCell) {
                    const responseClass = data.response === 'YES' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800';
                    responseCell.innerHTML = `
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${responseClass}">
                            ${data.response}
                        </span>
                    `;
                }
                
                found = true;
                break;
            }
        }
        
        // If row not found, refresh the whole table (shouldn't happen often)
        if (!found) {
            socket.emit('get_initial_data');
        }
    });
    
    // Request initial data
    socket.emit('get_initial_data');
});
