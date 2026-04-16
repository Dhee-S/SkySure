const admin = require('../firebase');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // During local dev, we might fall back to mock users without real tokens
    if (process.env.NODE_ENV !== 'production' && req.headers['x-mock-user']) {
      req.user = JSON.parse(req.headers['x-mock-user']);
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    
    // Fallback for mock users in development
    if (process.env.NODE_ENV !== 'production' && req.headers['x-mock-user']) {
      req.user = JSON.parse(req.headers['x-mock-user']);
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = { verifyToken };
