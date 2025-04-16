const express = require('express')
const http = require('http')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const socketIO = require('socket.io')
const fs = require('fs')
const path = require('path')
const { GoogleGenerativeAI } = require("@google/generative-ai")
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const setupCustomerSockets = require('./customer.js')
const sellRouter = require('./routes/sell.js')

require('dotenv').config()

const app = express()
const server = http.createServer(app)
const io = socketIO(server)


// Mount the sell router at /api
app.use('/api', sellRouter)

// Middleware setup (correct order is important)
app.use(bodyParser.json())  
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())



// Request logger middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
    next()
})

// Global variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDI8eJG4HqF60a6snvSRYFoXns-6QPQN38"
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const sessions = new Map()


// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'public/uploads'))
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = uuidv4()
        const extension = path.extname(file.originalname)
        cb(null, uniqueSuffix + extension)
    }
})

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        // Accept only image files
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false)
        }
        cb(null, true)
    }
})

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Products API
app.get('/api/products', (req, res) => {
    try {
        const filePath = path.join(__dirname, 'data', 'products.json')
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify([]))
            return res.json([])
        }
        
        const products = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        res.json(products)
    } catch (error) {
        console.error('Error fetching products:', error)
        res.status(500).json({ error: 'Failed to fetch products' })
    }
})

// Add this to your /api/products POST endpoint in server3.js
app.post('/api/products', upload.array('images', 5), (req, res) => {
    console.log('Product submission received:');
    console.log('- Body:', req.body);
    console.log('- Files:', req.files ? req.files.length : 'No files');
    
    if (req.files && req.files.length > 0) {
        console.log('- First file:', req.files[0].filename);
    }
    
    try {
        const { name, price, category, description, features, condition, seller } = req.body;
        
        // Validate required fields
        if (!name || !price || !category || !condition || !seller) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                received: req.body 
            });
        }
        
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // Get uploaded image filenames
        const imageFiles = req.files ? req.files.map(file => file.filename) : [];
        
        // Create new product object
        const newProduct = {
            id: uuidv4(),
            name,
            price,
            category,
            description: description || 'No description provided',
            features: features || 'No features specified',
            condition,
            seller,
            images: imageFiles,
            createdAt: new Date().toISOString()
        };
        
        // Read existing products
        const filePath = path.join(__dirname, 'data', 'products.json');
        let products = [];
        
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            products = fileContent ? JSON.parse(fileContent) : [];
        }
        
        // Add new product
        products.push(newProduct);
        
        // Save products back to file
        fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
        console.log('Product saved:', newProduct.id);
        
        // Return success
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ 
            error: 'Failed to create product: ' + error.message,
            stack: error.stack
        });
    }
});

// Get product by ID
app.get('/api/products/:id', (req, res) => {
    try {
        const productId = req.params.id
        const filePath = path.join(__dirname, 'data', 'products.json')
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Product not found' })
        }
        
        const products = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        const product = products.find(p => p.id === productId)
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' })
        }
        
        res.json(product)
    } catch (error) {
        console.error('Error fetching product:', error)
        res.status(500).json({ error: 'Failed to fetch product' })
    }
})

const errorHandler = (err, req, res, next) => {
    console.error(`${new Date().toISOString()} - Error:`, err.stack)
    
    // Determine status code (default to 500)
    const statusCode = err.statusCode || 500
    
// Check if request accepts HTML
if (req.accepts('html')) {
    res.status(statusCode)
    // Render appropriate error page based on status code
    if (statusCode === 404) {
      return res.sendFile(path.join(__dirname, 'public', 'html', 'error404.html'))
    } else {
      return res.sendFile(path.join(__dirname, 'public', 'html', 'error500.html'))
    }
  }
    
    // If API request, return JSON
    if (req.accepts('json')) {
      return res.status(statusCode).json({ 
        error: {
          message: err.message || 'An unexpected error occurred',
          status: statusCode
        } 
      })
    }
    
    // Default plain text response
    res.status(statusCode).type('txt').send(err.message || 'Internal Server Error')
  }

  // 404 middleware for routes not found
const notFoundHandler = (req, res, next) => {
    const err = new Error(`Not Found - ${req.originalUrl}`)
    err.statusCode = 404
    next(err)
  }


// Utility Functions
function readUsers() {
    try {
        const usersFile = path.join(__dirname, 'users.json')
        if (!fs.existsSync(usersFile)) {
            fs.writeFileSync(usersFile, JSON.stringify({}))
        }
        return JSON.parse(fs.readFileSync(usersFile, 'utf8'))
    } catch (error) {
        console.error('Error reading users file:', error)
        return {}
    }
}

function writeUsers(users) {
    try {
        fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2))
    } catch (error) {
        console.error('Error writing users file:', error)
    }
}

function generateSessionId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

function saveUserData(userData) {
    const filePath = path.join(__dirname, 'userdata.json')
    let existingData = []
    
    try {
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8')
            existingData = JSON.parse(fileContent)
        }

        const newData = {
            ...userData,
            timestamp: new Date().toISOString(),
            id: generateSessionId() // Add unique ID for each entry
        }
        existingData.push(newData)

        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2))
        console.log('User data saved successfully:', newData.id)
        return { success: true, id: newData.id }
    } catch (error) {
        console.error('Error saving user data:', error)
        throw new Error('Failed to save user data')
    }
}

// // Static File Serving
// app.use(express.static(__dirname))

app.use(express.static(path.join(__dirname, 'public')))


// Routes
const routes = {
    '/': 'public/html/index.html',
    '/login': 'public/html/login.html',
    '/ContactUs': 'public/html/ContactUs.html',
    '/home': 'public/html/home.html',
    '/ai': 'public/html/ai.html',
    '/news': 'public/html/news.html',
    '/gadgets': 'public/html/gadget.html',
    '/blogs': 'public/html/blog.html',
    '/customer': 'public/html/customer.html',
    '/admin': 'public/html/admin1604.html',
    '/chatbot': 'public/html/chatbot.html',
    '/AboutUs': 'public/html/AboutUs.html',
    '/selling': 'public/html/selling.html',
    '/selling2': 'public/html/selling2.html',
}

// Middleware to check authentication for protected routes
const protectedRoutes = ['/home', '/ai', '/news', '/gadgets', '/subscribe', '/customer',  '/chatbot']
app.use((req, res, next) => {
    if (protectedRoutes.includes(req.path)) {
        const sessionId = req.cookies.sessionId
        console.log(`Route ${req.path} access attempted with sessionId: ${sessionId}`)
        console.log(`Session exists: ${sessions.has(sessionId)}`)
        
        if (!sessionId || !sessions.has(sessionId)) {
            return res.redirect('/login')
        }
    }
    next()
    
})





// Make sure uploads directory is served statically
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')))

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory at:', uploadDir);
}

// Authentication Routes
app.post('/signup', (req, res) => {
    try {
        const { username, email, password } = req.body
        const users = readUsers()

        if (users[username]) {
            return res.status(409).json({ error: 'Username already exists' })
        }

        users[username] = { email, password }
        writeUsers(users)

        res.status(200).json({ success: true })
    } catch (err) {
        res.status(500).json({ error: 'Server error' })
    }
})

// Update the login route to handle both paths
app.post(['/login', '/api/login'], (req, res) => {
    try {
        console.log('Login attempt:', req.body)
        const { username, password } = req.body
        const users = readUsers()
        
        console.log('Users database:', users)
        console.log('User exists?', !!users[username])
        
        if (!users[username] || users[username].password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }

        const sessionId = generateSessionId()
        sessions.set(sessionId, { username })
        console.log('Session created:', sessionId)
        
        res.cookie('sessionId', sessionId, { httpOnly: true, path: '/' })
        res.status(200).json({ redirect: '/home' })
    } catch (err) {
        console.error('Login error:', err)
        res.status(500).json({ error: 'Server error' })
    }
})

// Add this to your server3.js to make sure authentication works properly
app.get('/api/user', (req, res) => {
    const sessionId = req.cookies.sessionId;
    console.log('API User request - Session ID:', sessionId);
    console.log('Available sessions:', Array.from(sessions.keys()));
    
    if (sessionId && sessions.has(sessionId)) {
        const sessionData = sessions.get(sessionId);
        console.log('API user request - session data:', sessionData);
        res.status(200).json({ 
            username: sessionData.username || 'User',
            id: sessionId
        });
    } else {
        console.log('API user request - no valid session');
        res.status(401).json({ error: 'Not logged in' });
    }
});

app.post('/logout', (req, res) => {
    const sessionId = req.cookies.sessionId
    
    if (sessionId) {
        sessions.delete(sessionId)
    }

    res.clearCookie('sessionId')
    res.status(200).json({ success: true })
})

app.get('*', (req, res, next) => {
    const route = routes[req.path]
    if (route) {
        res.sendFile(path.join(__dirname, route))
    } else {
        next() // Pass to 404 handler
    }
})

// API Routes (keep these before error handlers)
app.post('/chatbot', async (req, res, next) => {
    try {
        const userPrompt = req.body.prompt || req.body.message
        
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
        const result = await model.generateContent(userPrompt)
        const response = result.response.text()
        
        res.status(200).json({ 
            message: response,
            success: true 
        })
    } catch (err) {
        next(err) // Pass errors to error handler
    }
})

// Error handling (add these at the end, after all routes)
app.use(notFoundHandler) // 404 handler for routes not defined
app.use(errorHandler)    // Global error handler

setupCustomerSockets(io)

// Start Server
const PORT = process.env.PORT || 8081
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`))