// utils/userUtils.js

const fs = require('fs');
const path = require('path');
const { generateSessionId } = require('./sessionManager');
const ChatMessage = require('../models/ChatMessage');


function readUsers() {
  try {
    const usersFile = path.join(__dirname, '..', 'users.json');
    if (!fs.existsSync(usersFile)) {
      fs.writeFileSync(usersFile, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  } catch (error) {
    console.error('Error reading users file:', error);
    return {};
  }
}

function writeUsers(users) {
  try {
    fs.writeFileSync(path.join(__dirname, '..', 'users.json'), JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing users file:', error);
  }
}

// Save user chat data to MongoDB
async function saveUserChatData(userData) {
  try {
    const newChat = new ChatMessage({
      username: userData.username,
      email: userData.email,
      issueType: userData.issueType || 'general',
      issue: userData.issue,
      status: 'waiting',
      messages: [{
        sender: 'system',
        message: 'Chat started',
      }]
    });
    
    const savedChat = await newChat.save();
    console.log('User chat data saved to MongoDB:', savedChat._id);
    return { success: true, id: savedChat._id };
  } catch (error) {
    console.error('Error saving user chat data to MongoDB:', error);
    throw new Error('Failed to save user chat data');
  }
}

// Get active chats from MongoDB
async function getActiveChats() {
  try {
    const activeChats = await ChatMessage.find({
      status: { $in: ['waiting', 'active', 'unresolved'] }
    }).select('username email issue issueType status _id');
    
    return activeChats;
  } catch (error) {
    console.error('Error fetching active chats:', error);
    throw new Error('Failed to fetch active chats');
  }
}

function saveUserData(userData) {
  try {
    const users = readUsers();
    users[userData.username] = {
      ...userData,
      timestamp: new Date().toISOString()
    };
    writeUsers(users);
    return { success: true };
  } catch (error) {
    console.error('Error saving user data:', error);
    return { success: false, error: error.message };
  }
}


module.exports = {
  readUsers,
  writeUsers,
  saveUserData,
  saveUserChatData,  
  getActiveChats     
};
