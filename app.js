const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const bodyParser = require('body-parser');
const morgan = require('morgan');
require('dotenv').config();

// const { hashPassword } = require('./utils/passwordUtils');
// hashPassword(123).then((password) => console.log(password));

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}));
app.use(flash());

const { verifyToken } = require('./utils/jwtUtils');
// Global User Info Middleware
app.use((req, res, next) => {
    const token = req.cookies.user_token;
    if (token) {
        const decoded = verifyToken(token);
        if (decoded && decoded.role === 'customer') {
            res.locals.customer = decoded;
        } else {
            res.locals.customer = null;
        }
    } else {
        res.locals.customer = null;
    }
    next();
});

// Routes
app.use('/', require('./routes/viewRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/api', require('./routes/apiRoutes'));
app.use('/', require('./routes/userRoutes'));
app.use('/', require('./routes/claimRoutes'));

// Error handling
app.use((req, res, next) => {
  res.status(404).render('home', { title: '404 - Page Not Found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Database: ${process.env.APP_DB_NAME || 'node_vehicle_insurance'}`);
});
