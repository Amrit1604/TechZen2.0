const express = require('express');
const path = require('path');
const fs = require('fs');

function setupCustomerSockets(io) {
    // Store active chats and admin sessions
    const activeSessions = new Map();
    const adminSessions = new Map();
    const chatHistory = new Map();

    // Function to save user data to JSON file
    function saveUserData(userData) {
        const filePath = path.join(__dirname, '..', 'userdata.json');
        let existingData = [];
        
        // Read existing data if file exists
        if (fs.existsSync(filePath)) {
            try {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                existingData = JSON.parse(fileContent);
            } catch (error) {
                console.error('Error reading existing data:', error);
            }
        }

        // Add new user data with timestamp
        const newData = {
            ...userData,
            timestamp: new Date().toISOString()
        };
        existingData.push(newData);

        // Write back to file
        try {
            fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
            console.log('User data saved successfully');
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }

    // Handle admin connections
    io.of('/admin').on('connection', (socket) => {
        console.log('Admin connected');

        socket.on('adminLogin', (data) => {
            console.log('Admin login attempt:', data);
            // Store admin session
            adminSessions.set(socket.id, {
                adminId: data.adminId,
                socket: socket
            });
            
            socket.emit('adminAuthSuccess');
            
            // Send current customer list
            const customerList = Array.from(activeSessions.values()).map(session => ({
                id: session.customerId,
                username: session.username,
                email: session.email,
                issue: session.issue,
                status: session.status
            }));
            console.log('Sending customer list:', customerList);
            socket.emit('customerList', customerList);
        });

        socket.on('joinCustomerChat', (data) => {
            console.log('Admin joining customer chat:', data);
            const session = activeSessions.get(data.customerId);
            if (session) {
                socket.join(data.customerId);
                const history = chatHistory.get(data.customerId) || [];
                socket.emit('chatHistory', { messages: history });
            }
        });

        socket.on('adminMessage', (data) => {
            console.log('Admin message:', data);
            const session = activeSessions.get(data.customerId);
            if (session) {
                const messageData = {
                    type: 'admin',
                    message: data.message,
                    timestamp: new Date().toISOString()
                };
                
                // Store in chat history
                const history = chatHistory.get(data.customerId) || [];
                history.push(messageData);
                chatHistory.set(data.customerId, history);
                
                // Send to customer
                io.to(data.customerId).emit('adminMessage', messageData);
            }
        });

        socket.on('disconnect', () => {
            console.log('Admin disconnected');
            adminSessions.delete(socket.id);
        });
    });

    // Customer socket handlers
    io.on('connection', (socket) => {
        console.log('Customer connected');

        socket.on('startCustomerChat', (data) => {
            console.log('New customer chat:', data);
            const customerId = socket.id;
            if (!data.username || !data.email || !data.issue) {
                console.error('Invalid data from customer:', data);
                socket.emit('errorMessage', 'Invalid data provided.');
                return;
            }
            
            // Save user data to JSON file
            saveUserData({
                customerId,
                username: data.username,
                email: data.email,
                issue: data.issue
            });

            // Store session info
            activeSessions.set(customerId, {
                customerId,
                username: data.username,
                email: data.email,
                issue: data.issue,
                status: 'waiting',
                socket: socket
            });
            
            // Join customer to their room
            socket.join(customerId);
            
            // Initialize chat history
            chatHistory.set(customerId, []);
            
            // Update all admins
            io.of('/admin').emit('customerList', Array.from(activeSessions.values()).map(session => ({
                id: session.customerId,
                username: session.username,
                email: session.email,
                issue: session.issue,
                status: session.status
            })));
            
            socket.emit('chatStatus', 'Connected to support. Please wait for an agent.');
        });

        socket.on('customerMessage', (data) => {
            console.log('Customer message:', data);
            const customerId = socket.id;
            const session = activeSessions.get(customerId);
            
            if (session) {
                const messageData = {
                    type: 'customer',
                    customerId,
                    username: data.username,
                    message: data.message,
                    timestamp: new Date().toISOString()
                };
                
                // Store in chat history
                const history = chatHistory.get(customerId) || [];
                history.push(messageData);
                chatHistory.set(customerId, history);
                
                // Send to admins
                io.of('/admin').emit('customerMessage', messageData);
            }
        });

        socket.on('disconnect', () => {
            console.log('Customer disconnected');
            const customerId = socket.id;
            
            // Clean up
            activeSessions.delete(customerId);
            chatHistory.delete(customerId);
            
            // Update admins
            io.of('/admin').emit('customerList', Array.from(activeSessions.values()).map(session => ({
                id: session.customerId,
                username: session.username,
                email: session.email,
                issue: session.issue,
                status: session.status
            })));
        });

        socket.on('issueResolved', (data) => {
            const customerId = socket.id;
            const session = activeSessions.get(customerId);
            
            if (session) {
                // Update session status
                session.status = 'resolved';
                activeSessions.set(customerId, session);
                
                // Notify admin
                io.of('/admin').emit('chatResolved', {
                    customerId,
                    username: data.username,
                    status: 'resolved'
                });
                
                // Add to chat history
                const history = chatHistory.get(customerId) || [];
                history.push({
                    type: 'system',
                    message: 'Customer marked issue as resolved',
                    timestamp: new Date().toISOString()
                });
                chatHistory.set(customerId, history);
            }
        });

        socket.on('issueUnresolved', (data) => {
            const customerId = socket.id;
            const session = activeSessions.get(customerId);
            
            if (session) {
                session.status = 'unresolved';
                activeSessions.set(customerId, session);
                
                io.of('/admin').emit('chatUnresolved', {
                    customerId,
                    username: data.username,
                    status: 'unresolved'
                });
                
                const history = chatHistory.get(customerId) || [];
                history.push({
                    type: 'system',
                    message: 'Customer marked issue as unresolved',
                    timestamp: new Date().toISOString()
                });
                chatHistory.set(customerId, history);
            }
        });

        socket.on('endCustomerChat', (data) => {
            const customerId = socket.id;
            const session = activeSessions.get(customerId);
            
            if (session) {
                // Notify admin
                io.of('/admin').emit('customerEndedChat', {
                    customerId,
                    username: data.username,
                    status: data.status
                });
                
                // Add to chat history
                const history = chatHistory.get(customerId) || [];
                history.push({
                    type: 'system',
                    message: `Chat ended by customer (${data.status})`,
                    timestamp: new Date().toISOString()
                });
                
                // Clean up if resolved
                if (data.status === 'resolved') {
                    activeSessions.delete(customerId);
                    chatHistory.delete(customerId);
                    
                    // Update admin customer list
                    io.of('/admin').emit('customerList', Array.from(activeSessions.values()).map(session => ({
                        id: session.customerId,
                        username: session.username,
                        email: session.email,
                        issue: session.issue,
                        status: session.status
                    })));
                }
            }
        });
    });
}

module.exports = setupCustomerSockets;