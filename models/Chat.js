const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['my', 'admin', 'system']
    },
    message: {
        type: String,
        required: true
    },
    sender: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const chatSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String, 
        required: true
    },
    issue: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'resolved', 'unresolved', 'ended'],
        default: 'active'
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

module.exports = mongoose.model('Chat', chatSchema);