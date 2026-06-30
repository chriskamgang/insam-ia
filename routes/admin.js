const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { uploadVideo, uploadImage } = require('../config/upload');

// --- AUTH ---
router.get('/login', (req, res) => {
  if (req.session.adminId) return res.redirect('/admin');
  res.render('admin/login');
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    req.flash('error', 'Identifiants incorrects');
    return res.redirect('/admin/login');
  }

  req.session.adminId = user.id;
  req.flash('success', 'Bienvenue !');
  res.redirect('/admin');
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// --- DASHBOARD ---
router.get('/', requireAuth, (req, res) => {
  const stats = {
    categories: db.prepare('SELECT COUNT(*) as count FROM categories').get().count,
    videos: db.prepare('SELECT COUNT(*) as count FROM videos').get().count,
    totalViews: db.prepare('SELECT COALESCE(SUM(views_count), 0) as total FROM videos').get().total
  };
  const recentVideos = db.prepare(`
    SELECT v.*, c.name as category_name
    FROM videos v JOIN categories c ON v.category_id = c.id
    ORDER BY v.created_at DESC LIMIT 5
  `).all();

  res.render('admin/dashboard', { stats, recentVideos });
});

// --- CATEGORIES ---
router.get('/categories', requireAuth, (req, res) => {
  const categories = db.prepare(`
    SELECT c.*, COUNT(v.id) as video_count
    FROM categories c LEFT JOIN videos v ON c.id = v.category_id
    GROUP BY c.id ORDER BY c.sort_order ASC
  `).all();
  res.render('admin/categories', { categories });
});

router.post('/categories/add', requireAuth, uploadImage.single('image'), (req, res) => {
  const { name, description, sort_order, api_slug } = req.body;
  const image = req.file ? req.file.filename : null;
  db.prepare('INSERT INTO categories (name, description, image, api_slug, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(name, description, image, api_slug || null, sort_order || 0);
  req.flash('success', 'Categorie ajoutee');
  res.redirect('/admin/categories');
});

router.post('/categories/edit/:id', requireAuth, uploadImage.single('image'), (req, res) => {
  const { name, description, sort_order, api_slug } = req.body;
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);

  if (req.file) {
    if (category.image) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'images', category.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    db.prepare('UPDATE categories SET name=?, description=?, image=?, api_slug=?, sort_order=? WHERE id=?')
      .run(name, description, req.file.filename, api_slug || null, sort_order || 0, req.params.id);
  } else {
    db.prepare('UPDATE categories SET name=?, description=?, api_slug=?, sort_order=? WHERE id=?')
      .run(name, description, api_slug || null, sort_order || 0, req.params.id);
  }

  req.flash('success', 'Categorie modifiee');
  res.redirect('/admin/categories');
});

router.post('/categories/delete/:id', requireAuth, (req, res) => {
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (category && category.image) {
    const imgPath = path.join(__dirname, '..', 'uploads', 'images', category.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  // Delete associated videos files
  const videos = db.prepare('SELECT * FROM videos WHERE category_id = ?').all(req.params.id);
  videos.forEach(v => {
    const vidPath = path.join(__dirname, '..', 'uploads', 'videos', v.filename);
    if (fs.existsSync(vidPath)) fs.unlinkSync(vidPath);
    if (v.thumbnail) {
      const thumbPath = path.join(__dirname, '..', 'uploads', 'thumbnails', v.thumbnail);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    }
  });
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  req.flash('success', 'Categorie supprimee');
  res.redirect('/admin/categories');
});

// --- VIDEOS ---
router.get('/videos', requireAuth, (req, res) => {
  const videos = db.prepare(`
    SELECT v.*, c.name as category_name
    FROM videos v JOIN categories c ON v.category_id = c.id
    ORDER BY v.created_at DESC
  `).all();
  const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  res.render('admin/videos', { videos, categories });
});

router.post('/videos/add', requireAuth, uploadVideo.single('video'), (req, res) => {
  if (!req.file) {
    req.flash('error', 'Veuillez selectionner une video');
    return res.redirect('/admin/videos');
  }
  const { title, description, category_id } = req.body;
  db.prepare('INSERT INTO videos (title, description, filename, category_id) VALUES (?, ?, ?, ?)')
    .run(title, description, req.file.filename, category_id);
  req.flash('success', 'Video ajoutee avec succes');
  res.redirect('/admin/videos');
});

router.post('/videos/edit/:id', requireAuth, (req, res) => {
  const { title, description, category_id } = req.body;
  db.prepare('UPDATE videos SET title=?, description=?, category_id=? WHERE id=?')
    .run(title, description, category_id, req.params.id);
  req.flash('success', 'Video modifiee');
  res.redirect('/admin/videos');
});

router.post('/videos/delete/:id', requireAuth, (req, res) => {
  const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);
  if (video) {
    const vidPath = path.join(__dirname, '..', 'uploads', 'videos', video.filename);
    if (fs.existsSync(vidPath)) fs.unlinkSync(vidPath);
    if (video.thumbnail) {
      const thumbPath = path.join(__dirname, '..', 'uploads', 'thumbnails', video.thumbnail);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    }
  }
  db.prepare('DELETE FROM videos WHERE id = ?').run(req.params.id);
  req.flash('success', 'Video supprimee');
  res.redirect('/admin/videos');
});

// --- HERO MEDIA (accueil) ---
router.get('/hero', requireAuth, (req, res) => {
  const heroMedia = db.prepare('SELECT * FROM hero_media ORDER BY sort_order ASC').all();
  res.render('admin/hero', { heroMedia });
});

router.post('/hero/add', requireAuth, uploadImage.single('file'), (req, res) => {
  if (!req.file) {
    req.flash('error', 'Veuillez selectionner un fichier');
    return res.redirect('/admin/hero');
  }
  const { title, type, sort_order } = req.body;
  db.prepare('INSERT INTO hero_media (type, filename, title, sort_order) VALUES (?, ?, ?, ?)')
    .run(type || 'image', req.file.filename, title, sort_order || 0);
  req.flash('success', 'Media ajoute');
  res.redirect('/admin/hero');
});

router.post('/hero/delete/:id', requireAuth, (req, res) => {
  const media = db.prepare('SELECT * FROM hero_media WHERE id = ?').get(req.params.id);
  if (media) {
    const filePath = path.join(__dirname, '..', 'uploads', 'images', media.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.prepare('DELETE FROM hero_media WHERE id = ?').run(req.params.id);
  req.flash('success', 'Media supprime');
  res.redirect('/admin/hero');
});

// --- ROADMAP ---
router.get('/roadmap', requireAuth, (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
  const steps = db.prepare(`
    SELECT r.*, c.name as category_name
    FROM roadmap_steps r JOIN categories c ON r.category_id = c.id
    ORDER BY c.sort_order ASC, r.step_number ASC
  `).all();
  res.render('admin/roadmap', { steps, categories });
});

router.post('/roadmap/add', requireAuth, (req, res) => {
  const { category_id, step_number, title, description, level, duration, skills, icon, color } = req.body;
  db.prepare('INSERT INTO roadmap_steps (category_id, step_number, title, description, level, duration, skills, icon, color, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(category_id, step_number || 1, title, description, level || 'Debutant', duration, skills, icon || 'fas fa-book', color || '#1B2A4A', step_number || 1);
  req.flash('success', 'Etape ajoutee');
  res.redirect('/admin/roadmap');
});

router.post('/roadmap/edit/:id', requireAuth, (req, res) => {
  const { category_id, step_number, title, description, level, duration, skills, icon, color } = req.body;
  db.prepare('UPDATE roadmap_steps SET category_id=?, step_number=?, title=?, description=?, level=?, duration=?, skills=?, icon=?, color=?, sort_order=? WHERE id=?')
    .run(category_id, step_number, title, description, level, duration, skills, icon || 'fas fa-book', color || '#1B2A4A', step_number, req.params.id);
  req.flash('success', 'Etape modifiee');
  res.redirect('/admin/roadmap');
});

router.post('/roadmap/delete/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM roadmap_steps WHERE id = ?').run(req.params.id);
  req.flash('success', 'Etape supprimee');
  res.redirect('/admin/roadmap');
});

// --- DEBOUCHES ---
router.get('/debouches', requireAuth, (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
  const debouches = db.prepare(`
    SELECT d.*, c.name as category_name
    FROM debouches d JOIN categories c ON d.category_id = c.id
    ORDER BY c.sort_order ASC, d.sort_order ASC
  `).all();
  res.render('admin/debouches', { debouches, categories });
});

router.post('/debouches/add', requireAuth, (req, res) => {
  const { category_id, title, description, icon, sort_order } = req.body;
  db.prepare('INSERT INTO debouches (category_id, title, description, icon, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(category_id, title, description, icon || 'fas fa-briefcase', sort_order || 0);
  req.flash('success', 'Debouche ajoute');
  res.redirect('/admin/debouches');
});

router.post('/debouches/edit/:id', requireAuth, (req, res) => {
  const { category_id, title, description, icon, sort_order } = req.body;
  db.prepare('UPDATE debouches SET category_id=?, title=?, description=?, icon=?, sort_order=? WHERE id=?')
    .run(category_id, title, description, icon || 'fas fa-briefcase', sort_order || 0, req.params.id);
  req.flash('success', 'Debouche modifie');
  res.redirect('/admin/debouches');
});

router.post('/debouches/delete/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM debouches WHERE id = ?').run(req.params.id);
  req.flash('success', 'Debouche supprime');
  res.redirect('/admin/debouches');
});

// --- CERTIFICATIONS ---
router.get('/certifications', requireAuth, (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
  const certifications = db.prepare(`
    SELECT cert.*, c.name as category_name
    FROM certifications cert JOIN categories c ON cert.category_id = c.id
    ORDER BY c.sort_order ASC, cert.sort_order ASC
  `).all();
  res.render('admin/certifications', { certifications, categories });
});

router.post('/certifications/add', requireAuth, uploadImage.single('image'), (req, res) => {
  const { category_id, title, provider, description, url, sort_order } = req.body;
  const image = req.file ? req.file.filename : null;
  db.prepare('INSERT INTO certifications (category_id, title, provider, description, url, image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(category_id, title, provider, description, url, image, sort_order || 0);
  req.flash('success', 'Certification ajoutee');
  res.redirect('/admin/certifications');
});

router.post('/certifications/edit/:id', requireAuth, uploadImage.single('image'), (req, res) => {
  const { category_id, title, provider, description, url, sort_order } = req.body;
  const cert = db.prepare('SELECT * FROM certifications WHERE id = ?').get(req.params.id);

  if (req.file) {
    if (cert.image) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'images', cert.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    db.prepare('UPDATE certifications SET category_id=?, title=?, provider=?, description=?, url=?, image=?, sort_order=? WHERE id=?')
      .run(category_id, title, provider, description, url, req.file.filename, sort_order || 0, req.params.id);
  } else {
    db.prepare('UPDATE certifications SET category_id=?, title=?, provider=?, description=?, url=?, sort_order=? WHERE id=?')
      .run(category_id, title, provider, description, url, sort_order || 0, req.params.id);
  }
  req.flash('success', 'Certification modifiee');
  res.redirect('/admin/certifications');
});

router.post('/certifications/delete/:id', requireAuth, (req, res) => {
  const cert = db.prepare('SELECT * FROM certifications WHERE id = ?').get(req.params.id);
  if (cert && cert.image) {
    const imgPath = path.join(__dirname, '..', 'uploads', 'images', cert.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  db.prepare('DELETE FROM certifications WHERE id = ?').run(req.params.id);
  req.flash('success', 'Certification supprimee');
  res.redirect('/admin/certifications');
});

// --- SETTINGS ---
router.get('/settings', requireAuth, (req, res) => {
  res.render('admin/settings');
});

router.post('/settings', requireAuth, (req, res) => {
  const fields = ['site_name', 'site_subtitle', 'hero_title', 'hero_description', 'contact_email', 'contact_phone', 'address'];
  const update = db.prepare('UPDATE site_settings SET setting_value = ? WHERE setting_key = ?');
  fields.forEach(key => {
    if (req.body[key] !== undefined) {
      update.run(req.body[key], key);
    }
  });
  req.flash('success', 'Parametres mis a jour');
  res.redirect('/admin/settings');
});

// --- CHANGE PASSWORD ---
router.post('/change-password', requireAuth, (req, res) => {
  const { current_password, new_password } = req.body;
  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.session.adminId);

  if (!bcrypt.compareSync(current_password, user.password)) {
    req.flash('error', 'Mot de passe actuel incorrect');
    return res.redirect('/admin/settings');
  }

  const hashed = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE admin_users SET password = ? WHERE id = ?').run(hashed, user.id);
  req.flash('success', 'Mot de passe modifie');
  res.redirect('/admin/settings');
});

module.exports = router;
