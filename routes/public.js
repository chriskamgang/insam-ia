const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Accueil
router.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
  const heroMedia = db.prepare('SELECT * FROM hero_media ORDER BY sort_order ASC').all();
  const recentVideos = db.prepare(`
    SELECT v.*, c.name as category_name
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    ORDER BY v.created_at DESC LIMIT 6
  `).all();

  res.render('index', { categories, heroMedia, recentVideos });
});

// Toutes les categories
router.get('/categories', (req, res) => {
  const categories = db.prepare(`
    SELECT c.*, COUNT(v.id) as video_count
    FROM categories c
    LEFT JOIN videos v ON c.id = v.category_id
    GROUP BY c.id
    ORDER BY c.sort_order ASC
  `).all();

  res.render('categories', { categories });
});

// Page specialite (debouches + liens certifications/TP)
router.get('/category/:id', (req, res) => {
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!category) return res.status(404).render('404');

  const debouches = db.prepare('SELECT * FROM debouches WHERE category_id = ? ORDER BY sort_order ASC').all(req.params.id);
  const certCount = db.prepare('SELECT COUNT(*) as count FROM certifications WHERE category_id = ?').get(req.params.id).count;
  const videoCount = db.prepare('SELECT COUNT(*) as count FROM videos WHERE category_id = ?').get(req.params.id).count;
  const roadmapCount = db.prepare('SELECT COUNT(*) as count FROM roadmap_steps WHERE category_id = ?').get(req.params.id).count;

  res.render('category', { category, debouches, certCount, videoCount, roadmapCount });
});

// Certifications d'une specialite - recupere les formations depuis l'API Laravel
router.get('/category/:id/certifications', async (req, res) => {
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!category) return res.status(404).render('404');

  // Certifications locales
  const certifications = db.prepare('SELECT * FROM certifications WHERE category_id = ? ORDER BY sort_order ASC').all(req.params.id);

  // Formations depuis l'API Laravel (insamtechs) - supporte plusieurs slugs separes par des virgules
  let formations = [];
  if (category.api_slug) {
    const API_URL = process.env.LARAVEL_API_URL || 'https://admin.insamtechs.com/api';
    const slugs = category.api_slug.split(',').map(s => s.trim()).filter(Boolean);

    const results = await Promise.all(slugs.map(async (slug) => {
      try {
        const response = await fetch(`${API_URL}/formation/${slug}?per_page=50`);
        if (response.ok) {
          const data = await response.json();
          return data.data || [];
        }
      } catch (err) {
        console.log(`API Laravel indisponible pour ${slug}:`, err.message);
      }
      return [];
    }));

    formations = results.flat();
  }

  res.render('certifications', { category, certifications, formations });
});

// TP Videos d'une specialite
router.get('/category/:id/videos', (req, res) => {
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!category) return res.status(404).render('404');

  const videos = db.prepare('SELECT * FROM videos WHERE category_id = ? ORDER BY created_at DESC').all(req.params.id);

  res.render('category-videos', { category, videos });
});

// Roadmap d'une specialite
router.get('/category/:id/roadmap', (req, res) => {
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!category) return res.status(404).render('404');

  const steps = db.prepare('SELECT * FROM roadmap_steps WHERE category_id = ? ORDER BY step_number ASC').all(req.params.id);

  res.render('roadmap', { category, steps });
});

// Page video individuelle
router.get('/video/:id', (req, res) => {
  const video = db.prepare(`
    SELECT v.*, c.name as category_name, c.id as cat_id
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    WHERE v.id = ?
  `).get(req.params.id);

  if (!video) return res.status(404).render('404');

  // Incrementer le compteur de vues
  db.prepare('UPDATE videos SET views_count = views_count + 1 WHERE id = ?').run(req.params.id);

  // Videos similaires (meme categorie)
  const relatedVideos = db.prepare(`
    SELECT * FROM videos WHERE category_id = ? AND id != ? ORDER BY created_at DESC LIMIT 4
  `).all(video.cat_id, video.id);

  res.render('video', { video, relatedVideos });
});

module.exports = router;
