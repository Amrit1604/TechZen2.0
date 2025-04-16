const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDI8eJG4HqF60a6snvSRYFoXns-6QPQN38";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Chatbot API
router.post('/chatbot', async (req, res, next) => {
  try {
    const userPrompt = req.body.prompt || req.body.message;
    
    // Validate user input
    if (!userPrompt || userPrompt.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid prompt or message'
      });
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), 15000)
    );
    
    const resultPromise = model.generateContent(userPrompt);
    const result = await Promise.race([resultPromise, timeoutPromise]);
    const response = result.response.text();
    
    res.status(200).json({ 
      message: response,
      success: true 
    });
  } catch (err) {
    console.error('Chatbot API Error:', err.message);
    
    // Return a user-friendly error
    res.status(500).json({
      success: false,
      message: 'Sorry, there was an error processing your request',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;