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
  res.render('ContactUs', {
    siteTitle: 'TechZen: Contact Us',
    stylesPath: '/css/styleContact.css',
    siteName: 'TechZen',
    navLinks: [
      { href: '/AboutUs', text: 'ABOUT US' },
      { href: '/ContactUs', text: 'CONTACT US' },
      { href: '/blogs', text: 'BLOG' }
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
    currentYear: new Date().getFullYear()
  });
});

publicRoutes.get('/AboutUs', (req, res) => {
  res.render('AboutUs', {
    siteTitle: 'TechZen: About Us',
    stylesPath: '/css/styleAbout.css',
    siteName: 'TechZen',
    navLinks: [
      { href: '/AboutUs', text: 'ABOUT US' },
      { href: '/ContactUs', text: 'CONTACT US' },
      { href: '/blogs', text: 'BLOG' }
    ],
    aboutUs: {
      description: 'Project TechZen represents an innovative platform aimed at keeping users informed and engaged with the latest developments in the technology sector. It provides comprehensive coverage of recent technology news, ensuring that users remain updated on significant advancements within the industry. Furthermore, TechZen offers an extensive selection of the latest gadgets, complete with detailed price comparisons across various online retail platforms, thereby facilitating informed purchasing decisions.'
    },
    cultureCards: [
      { title: 'Vision', description: 'Innovate the future with cutting-edge technology.', image: '/img-vid/vision.png' },
      { title: 'Mission', description: 'Deliver top-notch digital solutions to our clients.', image: '/img-vid/mission2.png' },
      { title: 'Motto', description: 'Excellence, Innovation, and Growth.', image: '/img-vid/motto2.png' }
    ],
    teamMembers: [
      { name: 'Amrit Joshi', role: 'Lead Developer', image: '/img-vid/aj.jpeg' },
      { name: 'Ekansh Dhiman', role: 'Project Manager', image: '/img-vid/ekansh1.jpg' },
      { name: 'Armaan Gautam', role: 'Cleaning Crew', image: '/img-vid/armaan.jpeg' }
    ],
    stats: {
      totalUsers: '1.2M+',
      totalUsersRaw: 1200000,
      countries: '154',
      satisfactionRate: '98.7%'
    },
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
    newsApiKey: process.env.NEWS_API_KEY || 'YOUR_API_KEY',
    currentYear: new Date().getFullYear(),
    user: req.user || null
  });
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
  res.render('admin1604', {
    pageTitle: 'Admin - TechZen',
    cssPath: '/css/styleadmin.css',
    siteName: 'TechZen'
  });
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
    title: 'TechZen: AI Updates',
    siteName: 'TechZen',
    navLinks: [
      { href: '/news', text: 'Tech News' },
      { href: '/gadgets', text: 'Gadgets' },
      { href: '/ai', text: 'AI Updates' },
      { href: '/blogs', text: 'Blog' },
      { href: '/selling2', text: 'Sell/Buy' },
      { href: '/customer', text: 'Tech Service' }
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
    currentYear: new Date().getFullYear()
  });
});

protectedRoutes.get('/news', (req, res) => {
  res.render('news', {
    user: req.user,
    title: 'TechZen: Tech News',
    siteName: 'TechZen',
    navLinks: [
      { href: '/news', text: 'Tech News' },
      { href: '/gadgets', text: 'Gadgets' },
      { href: '/ai', text: 'AI Updates' },
      { href: '/blogs', text: 'Blog' },
      { href: '/selling2', text: 'Sell/Buy' },
      { href: '/customer', text: 'Tech Service' }
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
    currentYear: new Date().getFullYear()
  });
});

protectedRoutes.get('/gadgets', (req, res) => {
  res.render('gadget', {
    user: req.user,
    title: 'TechZen: Gadgets',
    siteName: 'TechZen',
    navLinks: [
      { href: '/news', text: 'Tech News' },
      { href: '/gadgets', text: 'Gadgets' },
      { href: '/ai', text: 'AI Updates' },
      { href: '/blogs', text: 'Blog' },
      { href: '/selling2', text: 'Sell/Buy' },
      { href: '/customer', text: 'Tech Service' }
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
    currentYear: new Date().getFullYear()
  });
});

protectedRoutes.get('/blogs', (req, res) => {
  res.render('blog', {
    user: req.user,
    title: 'TechZen: Blogs',
    siteName: 'TechZen',
    navLinks: [
      { href: '/news', text: 'Tech News' },
      { href: '/gadgets', text: 'Gadgets' },
      { href: '/ai', text: 'AI Updates' },
      { href: '/blogs', text: 'Blog' },
      { href: '/selling2', text: 'Sell/Buy' },
      { href: '/customer', text: 'Tech Service' }
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
    currentYear: new Date().getFullYear()
  });
});

protectedRoutes.get('/customer', (req, res) => {
  res.render('customer', {
    user: req.user,
    title: 'TechZen: Tech Service',
    siteName: 'TechZen',
    navLinks: [
      { href: '/news', text: 'Tech News' },
      { href: '/gadgets', text: 'Gadgets' },
      { href: '/ai', text: 'AI Updates' },
      { href: '/blogs', text: 'Blog' },
      { href: '/selling2', text: 'Sell/Buy' },
      { href: '/customer', text: 'Tech Service' }
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
    currentYear: new Date().getFullYear()
  });
});

protectedRoutes.get('/chatbot', (req, res) => {
  res.render('chatbot', {
    user: req.user,
    title: 'TechZen: Chatbot',
    siteName: 'TechZen',
    navLinks: [
      { href: '/news', text: 'Tech News' },
      { href: '/gadgets', text: 'Gadgets' },
      { href: '/ai', text: 'AI Updates' },
      { href: '/blogs', text: 'Blog' },
      { href: '/selling2', text: 'Sell/Buy' },
      { href: '/customer', text: 'Tech Service' }
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
    currentYear: new Date().getFullYear()
  });
});

protectedRoutes.get('/selling', (req, res) => {
  res.render('selling', {
    user: req.user,
    title: 'TechZen: Sell',
    siteName: 'TechZen',
    navLinks: [
      { href: '/news', text: 'Tech News' },
      { href: '/gadgets', text: 'Gadgets' },
      { href: '/ai', text: 'AI Updates' },
      { href: '/blogs', text: 'Blog' },
      { href: '/selling2', text: 'Sell/Buy' },
      { href: '/customer', text: 'Tech Service' }
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
    currentYear: new Date().getFullYear()
  });
});

protectedRoutes.get('/selling2', (req, res) => {
  res.render('selling2', {
    user: req.user,
    title: 'TechZen: Buy & Sell',
    siteName: 'TechZen',
    navLinks: [
      { href: '/news', text: 'Tech News' },
      { href: '/gadgets', text: 'Gadgets' },
      { href: '/ai', text: 'AI Updates' },
      { href: '/blogs', text: 'Blog' },
      { href: '/selling2', text: 'Sell/Buy' },
      { href: '/customer', text: 'Tech Service' }
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
    currentYear: new Date().getFullYear()
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