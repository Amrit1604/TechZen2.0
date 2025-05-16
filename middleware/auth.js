const isAuthenticated = (req, res, next) => {
    // Check if user is authenticated via session
    if (req.session && req.session.userId) {
        return next();
    }
    
    // If not authenticated
    return res.status(401).json({ error: 'Authentication required' });
};

module.exports = {
    isAuthenticated
};