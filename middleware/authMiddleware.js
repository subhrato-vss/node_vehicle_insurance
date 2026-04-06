const { verifyToken } = require('../utils/jwtUtils');

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    if (req.xhr || req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    return res.redirect('/admin/login');
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    if (req.xhr || req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    return res.redirect('/admin/login');
  }

  req.user = decoded;
  res.locals.user = decoded;
  next();
};

module.exports = authMiddleware;
