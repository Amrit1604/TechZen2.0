const express = require('express');
const router = express.Router();

// Public routes - no auth required
const publicRoutes = express.Router();

// Public routes
publicRoutes.get('/', (req, res) => {
  res.render('index', {
    siteTitle: 'TechZen: Discover. Learn. Innovate.',
    faviconPath: '/img-vid/favicon.ico',
    loaderScriptPath: '/loader.js',
    stylesPath: '/css/stylesindex.css',
    siteName: 'TechZen',
    navLinks: [
      { href: '/AboutUs', text: 'ABOUT US' },
      { href: '/ContactUs', text: 'CONTACT US' },
      { href: '/blogs', text: 'BLOG' }
    ],
    heroVideoPath: '/img-vid/backvid3.mp4',
    heroSubtitle: 'Discover. Learn. Innovate.',
    footerDescription: 'Your daily source for the latest in technology, innovation, and digital transformation.',
    socialLinks: [
      { href: '#', icon: '/img-vid/facebook.png', name: 'Facebook' },
      { href: '#', icon: '/img-vid/twitter.png', name: 'Twitter' },
      { href: '#', icon: '/img-vid/linkedin.png', name: 'LinkedIn' },
      { href: '#', icon: '/img-vid/instagram.png', name: 'Instagram' }
    ],
    footerLinks: [
      { href: '/AboutUs', text: 'About Us' },
      { href: '/ContactUs', text: 'Contact' },
      { href: '#', text: 'Privacy Policy' },
      { href: '#', text: 'Terms of Service' }
    ],
    newsletterAction: '/subscribe',
    currentYear: new Date().getFullYear()
  });
});

publicRoutes.get('/ContactUs', (req, res) => {
  res.render('ContactUs');
});

publicRoutes.get('/AboutUs', (req, res) => {
  res.render('AboutUs');
});

publicRoutes.get('/login', (req, res) => {
  res.render('login', {
    pageTitle: 'Login - TechZen',
    cssPath: '/css/stylelog.css',
    videoPath: '/img-vid/logbacknew.mp4',
    logoPath: '/img-vid/logo.jpeg',
    siteName: 'TechZen',
    signupAction: '/api/auth/signup',
    loginAction: '/api/auth/login'
  });
});

publicRoutes.get('/admin', (req, res) => {
  res.render('admin1604');
});

// Protected routes - auth required
const protectedRoutes = express.Router();

// Protected routes
protectedRoutes.get('/home', (req, res) => {
  res.render('home', {
    pageTitle: 'TechZen: Home',
    loaderScriptPath: '/js/loader.js',
    cssPath: '/css/styleshome.css',
    faviconPath: '/img-vid/favicon.ico',
    logoPath: '/img-vid/logo.jpeg',
    siteName: 'TechZen',
    navLinks: [
      { href: '/news', text: 'Tech News' },
      { href: '/gadgets', text: 'Gadgets' },
      { href: '/ai', text: 'AI Updates' },
      { href: '/blogs', text: 'Blog' },
      { href: '/selling2', text: 'Sell/Buy' },
      { href: '/customer', text: 'Tech Service' }
    ],
    heroVideoPath: '/img-vid/backvid3.mp4',
    heroSubtitle: 'Discover. Learn. Innovate.',
    categories: [
      { href: '/ai', imgSrc: '/img-vid/ai.png', title: 'AI Updates', description: 'Latest developments in artificial intelligence and machine learning' },
      { href: '/gadgets', imgSrc: '/img-vid/gadgets.png', title: 'Gadget Reviews', description: 'In-depth reviews of the latest tech gadgets and innovations' },
      { href: '/news', imgSrc: '/img-vid/tech.png', title: 'Tech News', description: 'Breaking news and updates from the tech industry' }
    ],
    newsItems: [
      { imgSrc: '/img-vid/ainews.png', tag: 'AI & ML', title: 'Latest AI Breakthroughs', description: 'Exploring recent developments in artificial intelligence and their impact on various industries.', href: '/ai' },
      { imgSrc: '/img-vid/robots.png', tag: 'Robotics', title: 'Future of Robotics', description: 'Discover the latest advancements in robotics and automation technology.', href: '/robots' },
      { imgSrc: '/img-vid/web3.png', tag: 'Web3', title: 'Web3 Revolution', description: 'Understanding the impact of blockchain and decentralized technologies.', href: '/web3' }
    ],
    footerDescription: 'Your daily source for the latest in technology, innovation, and digital transformation.',
    socialLinks: [
      { href: '#', icon: '/img-vid/facebook.png', name: 'Facebook' },
      { href: '#', icon: '/img-vid/twitter.png', name: 'Twitter' },
      { href: '#', icon: '/img-vid/linkedin.png', name: 'LinkedIn' },
      { href: '#', icon: '/img-vid/instagram.png', name: 'Instagram' }
    ],
    footerLinks: [
      { href: '/AboutUs', text: 'About Us' },
      { href: '/ContactUs', text: 'Contact' },
      { href: '#', text: 'Privacy Policy' },
      { href: '#', text: 'Terms of Service' }
    ],
    newsletterAction: '/subscribe',
    currentYear: new Date().getFullYear(),
    user: req.user || null
  });
});

protectedRoutes.get('/ai', (req, res) => {
  res.render('ai', {
    user: req.user,
    title: 'TechZen: AI Updates'
  });
});

protectedRoutes.get('/news', (req, res) => {
  res.render('news', {
    user: req.user,
    title: 'TechZen: Tech News'
  });
});

protectedRoutes.get('/gadgets', (req, res) => {
  res.render('gadget', {
    user: req.user,
    title: 'TechZen: Gadgets'
  });
});

protectedRoutes.get('/blogs', (req, res) => {
  res.render('blog', {
    user: req.user,
    title: 'TechZen: Blogs'
  });
});

protectedRoutes.get('/customer', (req, res) => {
  res.render('customer', {
    user: req.user,
    title: 'TechZen: Tech Service'
  });
});

protectedRoutes.get('/chatbot', (req, res) => {
  res.render('chatbot', {
    user: req.user,
    title: 'TechZen: Chatbot'
  });
});

protectedRoutes.get('/selling', (req, res) => {
  res.render('selling', {
    user: req.user,
    title: 'TechZen: Sell'
  });
});

protectedRoutes.get('/selling2', (req, res) => {
  res.render('selling2', {
    user: req.user,
    title: 'TechZen: Buy & Sell'
  });
});

// Central route handler
router.use((req, res, next) => {
  if (['/login', '/', '/ContactUs', '/AboutUs', '/admin'].includes(req.path)) {
    publicRoutes(req, res, next);
  } else {
    protectedRoutes(req, res, next);
  }
});

module.exports = {
  router,
  publicRoutes,
  protectedRoutes
};