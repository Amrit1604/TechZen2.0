const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'techzen-marketplace-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public/uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and WebP are allowed.'));
        }
    }
});

// Ensure data directories exist
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'public/uploads');

async function ensureDirectories() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating directories:', error);
    }
}

ensureDirectories();

// Data file paths
const USERS_FILE = path.join(DATA_DIR, 'users2.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

// Helper functions for data handling
async function readData(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, return empty array
            return [];
        }
        throw error;
    }
}

async function writeData(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'selling.html'));
});

// Authentication endpoints
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password, accountType } = req.body;

        if (!name || !email || !password || !accountType) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const users = await readData(USERS_FILE);
        
        // Check if user already exists
        if (users.some(user => user.email === email)) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = {
            id: uuidv4(),
            name,
            email,
            password: hashedPassword,
            accountType,
            createdAt: new Date().toISOString()
        };

        // Add user to the data file
        users.push(newUser);
        await writeData(USERS_FILE, users);

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;
        
        // Set session
        req.session.user = userWithoutPassword;
        
        res.status(201).json({ 
            message: 'User registered successfully', 
            user: userWithoutPassword 
        });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const users = await readData(USERS_FILE);
        
        // Find the user
        const user = users.find(user => user.email === email);
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Don't send the password back
        const { password: _, ...userWithoutPassword } = user;
        
        // Set session
        req.session.user = userWithoutPassword;
        
        res.status(200).json({
            message: 'Login successful',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out' });
        }
        res.status(200).json({ message: 'Logout successful' });
    });
});

// Auth middleware for protected routes
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized access' });
    }
}

// Product endpoints
app.get('/api/products', async (req, res) => {
    try {
        let products = await readData(PRODUCTS_FILE);
        
        // Apply filters if provided
        if (req.query.search) {
            const searchTerm = req.query.search.toLowerCase();
            products = products.filter(product => 
                product.name.toLowerCase().includes(searchTerm) || 
                product.description.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm)
            );
        }

        if (req.query.categories) {
            const categories = Array.isArray(req.query.categories) 
                ? req.query.categories 
                : [req.query.categories];
            products = products.filter(product => categories.includes(product.category));
        }

        if (req.query.conditions) {
            const conditions = Array.isArray(req.query.conditions) 
                ? req.query.conditions 
                : [req.query.conditions];
            products = products.filter(product => conditions.includes(product.condition));
        }

        if (req.query.minPrice) {
            products = products.filter(product => product.price >= parseFloat(req.query.minPrice));
        }

        if (req.query.maxPrice) {
            products = products.filter(product => product.price <= parseFloat(req.query.maxPrice));
        }

        // Sort by newest first
        products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const products = await readData(PRODUCTS_FILE);
        const product = products.find(p => p.id === req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json(product);
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ message: 'Error fetching product details' });
    }
});

app.post('/api/products', isAuthenticated, upload.array('images', 5), async (req, res) => {
    try {
        const { name, description, category, condition, price, quantity } = req.body;
        let seller;
        
        // Parse seller if it's a JSON string
        try {
            seller = typeof req.body.seller === 'string' ? JSON.parse(req.body.seller) : req.body.seller;
        } catch (e) {
            return res.status(400).json({ message: 'Invalid seller data format' });
        }
        
        if (!name || !description || !category || !condition || !price || !seller) {
            // Clean up uploaded files if validation fails
            if (req.files && req.files.length > 0) {
                req.files.forEach(async file => {
                    try {
                        await fs.unlink(file.path);
                    } catch (err) {
                        console.error('Error deleting file:', err);
                    }
                });
            }
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        // Validate that the seller matches the authenticated user
        if (seller.id !== req.session.user.id) {
            return res.status(403).json({ message: 'You can only add products as yourself' });
        }
        
        // Process uploaded images
        const images = req.files.map(file => `/uploads/${file.filename}`);
        
        // Create new product
        const newProduct = {
            id: uuidv4(),
            name,
            description,
            category,
            condition,
            price: parseFloat(price),
            quantity: parseInt(quantity || 1, 10),
            images,
            seller,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Add to products data
        const products = await readData(PRODUCTS_FILE);
        products.push(newProduct);
        await writeData(PRODUCTS_FILE, products);
        
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Error adding product' });
    }
});

app.put('/api/products/:id', isAuthenticated, upload.array('newImages', 5), async (req, res) => {
    try {
        const productId = req.params.id;
        const updates = req.body;
        const products = await readData(PRODUCTS_FILE);
        
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Check if the user is the seller
        if (products[productIndex].seller.id !== req.session.user.id) {
            return res.status(403).json({ message: 'You can only update your own products' });
        }
        
        // Process uploaded images if any
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `/uploads/${file.filename}`);
            
            // Add new images to existing ones
            updates.images = [...(updates.images || products[productIndex].images), ...newImages];
        }
        
        // Update product
        products[productIndex] = {
            ...products[productIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        await writeData(PRODUCTS_FILE, products);
        
        res.json(products[productIndex]);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product' });
    }
});

app.delete('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
        const productId = req.params.id;
        const products = await readData(PRODUCTS_FILE);
        
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Check if the user is the seller
        if (products[productIndex].seller.id !== req.session.user.id) {
            return res.status(403).json({ message: 'You can only delete your own products' });
        }
        
        // Delete product images from the uploads directory
        const productImages = products[productIndex].images || [];
        for (const imagePath of productImages) {
            try {
                if (imagePath.startsWith('/uploads/')) {
                    const fullPath = path.join(__dirname, 'public', imagePath);
                    await fs.unlink(fullPath);
                }
            } catch (err) {
                console.error('Error deleting product image:', err);
            }
        }
        
        // Remove product from array
        products.splice(productIndex, 1);
        await writeData(PRODUCTS_FILE, products);
        
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error deleting product' });
    }
});

// Order endpoints
app.post('/api/orders', async (req, res) => {
    try {
        const orderData = req.body;
        
        if (!orderData.items || !orderData.shipping || !orderData.payment) {
            return res.status(400).json({ message: 'Invalid order data' });
        }
        
        // Generate order ID
        const orderId = uuidv4();
        
        // Create new order
        const newOrder = {
            ...orderData,
            id: orderId,
            date: new Date().toISOString(),
            status: 'processing',
            updatedAt: new Date().toISOString()
        };
        
        // Add to orders data
        const orders = await readData(ORDERS_FILE);
        orders.push(newOrder);
        await writeData(ORDERS_FILE, orders);
        
        // Update product quantities
        const products = await readData(PRODUCTS_FILE);
        for (const item of orderData.items) {
            const productIndex = products.findIndex(p => p.id === item.id);
            if (productIndex !== -1) {
                products[productIndex].quantity -= item.quantity;
                if (products[productIndex].quantity < 0) {
                    products[productIndex].quantity = 0;
                }
            }
        }
        await writeData(PRODUCTS_FILE, products);
        
        res.status(201).json({ 
            message: 'Order placed successfully',
            order: newOrder
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating order' });
    }
});

app.get('/api/orders', isAuthenticated, async (req, res) => {
    try {
        const userId = req.query.user || req.session.user.id;
        const status = req.query.status;
        
        // Check if the user is requesting their own orders
        if (userId !== req.session.user.id) {
            return res.status(403).json({ message: 'You can only view your own orders' });
        }
        
        const orders = await readData(ORDERS_FILE);
        
        // Filter orders by user ID
        let userOrders = orders.filter(order => order.user === userId);
        
        // Filter by status if provided
        if (status === 'active') {
            userOrders = userOrders.filter(order => 
                ['processing', 'shipped', 'out-for-delivery'].includes(order.status)
            );
        } else if (status === 'completed') {
            userOrders = userOrders.filter(order => 
                ['delivered', 'cancelled', 'returned'].includes(order.status)
            );
        }
        
        // Sort by newest first
        userOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.json(userOrders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

app.get('/api/orders/:id/track', async (req, res) => {
    try {
        const orderId = req.params.id;
        const orders = await readData(ORDERS_FILE);
        
        const order = orders.find(o => o.id === orderId);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        // If authenticated, check if the order belongs to the user
        if (req.session.user && order.user !== 'guest' && order.user !== req.session.user.id) {
            return res.status(403).json({ message: 'You can only track your own orders' });
        }
        
        // Calculate estimated delivery (3-5 days from order date)
        const orderDate = new Date(order.date);
        const estimatedDelivery = new Date(orderDate);
        estimatedDelivery.setDate(orderDate.getDate() + Math.floor(Math.random() * 3) + 3);
        
        // Generate tracking information
        const trackingInfo = {
            orderId: order.id,
            status: order.status,
            date: order.date,
            estimatedDelivery: estimatedDelivery.toISOString(),
            shipping: order.shipping,
            trackingNumber: `TZ${Math.floor(Math.random() * 1000000).toString().padStart(7, '0')}`,
            carrier: 'TechZen Express',
            currentStep: getCurrentOrderStep(order.status)
        };
        
        // Add dates for completed steps
        const orderDateObj = new Date(order.date);
        
        trackingInfo.processingDate = new Date(orderDateObj.getTime() + 1000 * 60 * 60 * 2).toISOString(); // 2 hours after order
        
        if (['shipped', 'out-for-delivery', 'delivered'].includes(order.status)) {
            trackingInfo.shippedDate = new Date(orderDateObj.getTime() + 1000 * 60 * 60 * 24).toISOString(); // 1 day after order
        }
        
        if (['out-for-delivery', 'delivered'].includes(order.status)) {
            trackingInfo.outForDeliveryDate = new Date(orderDateObj.getTime() + 1000 * 60 * 60 * 24 * 2).toISOString(); // 2 days after order
        }
        
        if (order.status === 'delivered') {
            trackingInfo.deliveredDate = new Date(orderDateObj.getTime() + 1000 * 60 * 60 * 24 * 3).toISOString(); // 3 days after order
        }
        
        res.json(trackingInfo);
    } catch (error) {
        console.error('Error tracking order:', error);
        res.status(500).json({ message: 'Error tracking order' });
    }
});

// Helper function to determine the current step of an order
function getCurrentOrderStep(status) {
    switch (status) {
        case 'processing': return 'processing';
        case 'shipped': return 'shipped';
        case 'out-for-delivery': return 'out-for-delivery';
        case 'delivered': return 'delivered';
        default: return 'order-placed';
    }
}

// Review endpoints
app.post('/api/reviews', isAuthenticated, async (req, res) => {
    try {
        const { orderId, rating, title, comment } = req.body;
        
        if (!orderId || !rating || !title || !comment) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        // Verify the order exists and belongs to the user
        const orders = await readData(ORDERS_FILE);
        const order = orders.find(o => o.id === orderId);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        if (order.user !== req.session.user.id) {
            return res.status(403).json({ message: 'You can only review your own orders' });
        }
        
        // Create the review
        const newReview = {
            id: uuidv4(),
            orderId,
            userId: req.session.user.id,
            userName: req.session.user.name,
            rating,
            title,
            comment,
            date: new Date().toISOString()
        };
        
        // Add to reviews data
        const reviews = await readData(REVIEWS_FILE);
        reviews.push(newReview);
        await writeData(REVIEWS_FILE, reviews);
        
        // Update order status if needed
        if (order.status === 'delivered') {
            order.reviewed = true;
            await writeData(ORDERS_FILE, orders);
        }
        
        res.status(201).json(newReview);
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ message: 'Error creating review' });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err);
    
    // Handle multer errors
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    
    res.status(500).json({ message: err.message || 'Something went wrong' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});