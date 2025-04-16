const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Helper functions for data management
const dataPath = path.join(__dirname, '../data');

function readJsonFile(filename) {
  const filePath = path.join(dataPath, filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data || '[]');
}

function writeJsonFile(filename, data) {
  const filePath = path.join(dataPath, filename);
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Route to render role selection page
router.get('/role-selection', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/role-selection.html'));
});

// Route to render seller page
router.get('/seller-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/seller.html'));
});

// Route to render buyer page
router.get('/marketplace', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/buyer.html'));
});

// API Routes for products
router.get('/products', (req, res) => {
  const products = readJsonFile('products.json');
  res.json(products);
});

// Add a new product
router.post('/products', upload.array('productImages', 5), (req, res) => {
  try {
    const products = readJsonFile('products.json');
    const newProduct = {
      id: uuidv4(),
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      condition: req.body.condition, // new, used, refurbished
      category: req.body.category,
      seller: {
        id: req.user ? req.user.id : 'temp-seller-id',
        name: req.body.sellerName || (req.user ? req.user.name : 'Tech Seller'),
        contact: req.body.sellerContact || (req.user ? req.user.email : 'contact@example.com')
      },
      images: req.files ? req.files.map(file => `/uploads/${file.filename.replace(/^.*[\\\/]/, '')}`) : [],
      createdAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    writeJsonFile('products.json', products);
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Get a specific product
router.get('/products/:id', (req, res) => {
  const productId = req.params.id;
  const products = readJsonFile('products.json');
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  res.json(product);
});

// API Routes for cart operations
router.get('/cart/:userId', (req, res) => {
  const userId = req.params.userId;
  const orders = readJsonFile('orders.json');
  const userCart = orders.find(order => order.userId === userId && order.status === 'cart') || {
    id: uuidv4(),
    userId,
    items: [],
    status: 'cart',
    createdAt: new Date().toISOString()
  };
  
  res.json(userCart);
});

// Add item to cart
router.post('/cart/:userId/add', (req, res) => {
  const userId = req.params.userId;
  const { productId, quantity } = req.body;
  
  if (!productId || !quantity) {
    return res.status(400).json({ error: 'Product ID and quantity are required' });
  }
  
  const products = readJsonFile('products.json');
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const orders = readJsonFile('orders.json');
  let userCart = orders.find(order => order.userId === userId && order.status === 'cart');
  
  if (!userCart) {
    userCart = {
      id: uuidv4(),
      userId,
      items: [],
      status: 'cart',
      createdAt: new Date().toISOString()
    };
    orders.push(userCart);
  }
  
  // Check if item already exists in cart
  const existingItem = userCart.items.find(item => item.productId === productId);
  
  if (existingItem) {
    existingItem.quantity += parseInt(quantity);
  } else {
    userCart.items.push({
      productId,
      name: product.name,
      price: product.price,
      quantity: parseInt(quantity),
      image: product.images[0] || ''
    });
  }
  
  writeJsonFile('orders.json', orders);
  res.json(userCart);
});

// Complete checkout
router.post('/cart/:userId/checkout', (req, res) => {
  const userId = req.params.userId;
  const { shippingAddress, paymentInfo } = req.body;
  
  const orders = readJsonFile('orders.json');
  const userCartIndex = orders.findIndex(order => order.userId === userId && order.status === 'cart');
  
  if (userCartIndex === -1) {
    return res.status(404).json({ error: 'Cart not found' });
  }
  
  orders[userCartIndex].status = 'pending';
  orders[userCartIndex].updatedAt = new Date().toISOString();
  orders[userCartIndex].shippingAddress = shippingAddress;
  orders[userCartIndex].paymentInfo = paymentInfo;
  
  writeJsonFile('orders.json', orders);
  res.json({ success: true, order: orders[userCartIndex] });
});

module.exports = router;