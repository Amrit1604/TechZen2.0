const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Create Chat model directly in this file
let Chat;
try {
    Chat = mongoose.model('Chat');
} catch (error) {
    // Define the schema if the model doesn't exist yet
    const messageSchema = new mongoose.Schema({
        type: {
            type: String,
            required: true,
            enum: ['customer', 'admin', 'system']
        },
        message: {
            type: String,
            required: true
        },
        username: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    });

    const chatSchema = new mongoose.Schema({
        customerId: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true
        },
        email: {
            type: String, 
            required: true
        },
        issue: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['waiting', 'active', 'resolved', 'unresolved', 'ended'],
            default: 'waiting'
        },
        messages: [messageSchema],
        startTime: {
            type: Date,
            default: Date.now
        },
        endTime: {
            type: Date
        }
    });

    Chat = mongoose.model('Chat', chatSchema);
}

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

        socket.on('joinCustomerChat', async (data) => {
            console.log('Admin joining customer chat:', data);
            const session = activeSessions.get(data.customerId);
            if (session) {
                socket.join(data.customerId);
                
                // Update chat status in database
                try {
                    await Chat.findOneAndUpdate(
                        { customerId: data.customerId, status: 'waiting' },
                        { status: 'active' }
                    );
                } catch (error) {
                    console.error('Error updating chat status:', error);
                }
                
                const history = chatHistory.get(data.customerId) || [];
                socket.emit('chatHistory', { messages: history });
            }
        });

        socket.on('adminMessage', async (data) => {
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
                
                // Save to database
                try {
                    await Chat.findOneAndUpdate(
                        { customerId: data.customerId },
                        {
                            $push: {
                                messages: {
                                    type: 'admin',
                                    message: data.message,
                                    timestamp: new Date()
                                }
                            }
                        }
                    );
                } catch (error) {
                    console.error('Error saving admin message to database:', error);
                }
                
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

        socket.on('startCustomerChat', async (data) => {
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
            
            // Create a new chat document in MongoDB
            try {
                const newChat = new Chat({
                    customerId,
                    username: data.username,
                    email: data.email,
                    issue: data.issue,
                    status: 'waiting',
                    messages: [{
                        type: 'system',
                        message: 'Connected to support. Please wait for an agent.',
                        timestamp: new Date()
                    }]
                });
                
                await newChat.save();
                console.log('New chat saved to database');
            } catch (error) {
                console.error('Error saving chat to database:', error);
            }
            
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

        socket.on('customerMessage', async (data) => {
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
                
                // Save message to database
                try {
                    await Chat.findOneAndUpdate(
                        { customerId },
                        {
                            $push: {
                                messages: {
                                    type: 'customer',
                                    message: data.message,
                                    username: data.username,
                                    timestamp: new Date()
                                }
                            }
                        }
                    );
                } catch (error) {
                    console.error('Error saving customer message to database:', error);
                }
                
                // Send to admins
                io.of('/admin').emit('customerMessage', messageData);
            }
        });

        socket.on('disconnect', async () => {
            console.log('Customer disconnected');
            const customerId = socket.id;
            
            // Mark chat as ended in database if customer disconnects
            try {
                await Chat.findOneAndUpdate(
                    { customerId },
                    {
                        status: 'ended',
                        endTime: new Date(),
                        $push: {
                            messages: {
                                type: 'system',
                                message: 'Customer disconnected',
                                timestamp: new Date()
                            }
                        }
                    }
                );
            } catch (error) {
                console.error('Error updating chat on disconnect:', error);
            }
            
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

        socket.on('issueResolved', async (data) => {
            const customerId = socket.id;
            const session = activeSessions.get(customerId);
            
            if (session) {
                // Update session status
                session.status = 'resolved';
                activeSessions.set(customerId, session);
                
                // Update in database
                try {
                    await Chat.findOneAndUpdate(
                        { customerId },
                        {
                            status: 'resolved',
                            endTime: new Date(),
                            $push: {
                                messages: {
                                    type: 'system',
                                    message: 'Customer marked issue as resolved',
                                    timestamp: new Date()
                                }
                            }
                        }
                    );
                } catch (error) {
                    console.error('Error updating resolved status in database:', error);
                }
                
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

        socket.on('issueUnresolved', async (data) => {
            const customerId = socket.id;
            const session = activeSessions.get(customerId);
            
            if (session) {
                session.status = 'unresolved';
                activeSessions.set(customerId, session);
                
                // Update in database
                try {
                    await Chat.findOneAndUpdate(
                        { customerId },
                        {
                            status: 'unresolved',
                            endTime: new Date(),
                            $push: {
                                messages: {
                                    type: 'system',
                                    message: 'Customer marked issue as unresolved',
                                    timestamp: new Date()
                                }
                            }
                        }
                    );
                } catch (error) {
                    console.error('Error updating unresolved status in database:', error);
                }
                
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

        socket.on('endCustomerChat', async (data) => {
            const customerId = socket.id;
            const session = activeSessions.get(customerId);
            
            if (session) {
                // Update in database
                try {
                    await Chat.findOneAndUpdate(
                        { customerId },
                        {
                            status: data.status,
                            endTime: new Date(),
                            $push: {
                                messages: {
                                    type: 'system',
                                    message: `Chat ended by customer (${data.status})`,
                                    timestamp: new Date()
                                }
                            }
                        }
                    );
                } catch (error) {
                    console.error('Error updating chat end status in database:', error);
                }
                
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