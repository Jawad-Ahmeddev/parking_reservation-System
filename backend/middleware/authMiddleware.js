const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Extract the token from the Authorization header
  const token = authHeader.split(' ')[1]; // Expecting "Bearer <token>"

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;  // `user` will contain the `id` from the payload
    next();
  } catch (err) {
    console.error('Token validation error:', err.message); // Log the error for debugging
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
