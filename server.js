const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = require('./config/database');

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
  secret: 'iues-insam-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24h
}));

app.use(flash());

// Global variables for templates
app.use((req, res, next) => {
  const settings = {};
  const rows = db.prepare('SELECT setting_key, setting_value FROM site_settings').all();
  rows.forEach(row => { settings[row.setting_key] = row.setting_value; });
  res.locals.settings = settings;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentPath = req.path;
  next();
});

// Routes
app.use('/', require('./routes/public'));
app.use('/admin', require('./routes/admin'));

// 404
app.use((req, res) => {
  res.status(404).render('404');
});

app.listen(PORT, () => {
  console.log(`Serveur IUEs/INSAM demarre sur http://localhost:${PORT}`);
});
