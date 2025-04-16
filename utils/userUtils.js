// utils/userUtils.js

const fs = require('fs');
const path = require('path');
const { generateSessionId } = require('./sessionManager');

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

function saveUserData(userData) {
  const filePath = path.join(__dirname, '..', 'userdata.json');
  let existingData = [];
  
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      existingData = JSON.parse(fileContent);
    }

    const newData = {
      ...userData,
      timestamp: new Date().toISOString(),
      id: generateSessionId() // Add unique ID for each entry
    };
    existingData.push(newData);

    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
    console.log('User data saved successfully:', newData.id);
    return { success: true, id: newData.id };
  } catch (error) {
    console.error('Error saving user data:', error);
    throw new Error('Failed to save user data');
  }
}

module.exports = {
  readUsers,
  writeUsers,
  saveUserData
};
