const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { upload } = require('../middleware/appMiddleware');
const { v4: uuidv4 } = require('uuid');


// Products API
router.get('/products', (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', 'data', 'products.json');
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]));
      return res.json([]);
    }
    
    const products = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Add product
router.post('/products', upload.array('images', 5), (req, res) => {
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
    const dataDir = path.join(__dirname, '..', 'data');
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
    const filePath = path.join(__dirname, '..', 'data', 'products.json');
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
router.get('/products/:id', (req, res) => {
  try {
    const productId = req.params.id;
    const filePath = path.join(__dirname, '..', 'data', 'products.json');
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const products = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});



module.exports = router;
