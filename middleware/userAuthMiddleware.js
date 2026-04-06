const { verifyToken } = require('../utils/jwtUtils');

const userAuthMiddleware = (req, res, next) => {
  const token = req.cookies.user_token || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    if (req.xhr || req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided', redirect: '/user/login' });
    }
    return res.redirect('/user/login');
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'customer') {
    if (req.xhr || req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token or role', redirect: '/user/login' });
    }
    return res.redirect('/user/login');
  }

  req.customer = decoded;
  res.locals.customer = decoded;
  next();
};

module.exports = userAuthMiddleware;
