const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    api_slug TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    filename TEXT NOT NULL,
    thumbnail TEXT,
    category_id INTEGER NOT NULL,
    views_count INTEGER DEFAULT 0,
    duration TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT
  );

  CREATE TABLE IF NOT EXISTS hero_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('image', 'video')),
    filename TEXT NOT NULL,
    title TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS debouches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'fas fa-briefcase',
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS certifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    provider TEXT,
    description TEXT,
    url TEXT,
    image TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS roadmap_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    step_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    level TEXT DEFAULT 'Debutant',
    duration TEXT,
    skills TEXT,
    icon TEXT DEFAULT 'fas fa-book',
    color TEXT DEFAULT '#1B2A4A',
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );
`);

// Create default admin if not exists
const adminExists = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admin_users (username, password) VALUES (?, ?)').run('admin', hashedPassword);
}

// Insert default settings if not exists
const defaultSettings = [
  ['site_name', 'IUEs/INSAM'],
  ['site_subtitle', 'Institut Universitaire et Strategique de l\'Estuaire'],
  ['hero_title', 'Decouvrez nos pratiques en video'],
  ['hero_description', 'Explorez les travaux pratiques de nos etudiants dans differentes specialites'],
  ['contact_email', 'contact@iues-insam.cm'],
  ['contact_phone', ''],
  ['address', '']
];

const insertSetting = db.prepare('INSERT OR IGNORE INTO site_settings (setting_key, setting_value) VALUES (?, ?)');
for (const [key, value] of defaultSettings) {
  insertSetting.run(key, value);
}

module.exports = db;
