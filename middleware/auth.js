function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  req.flash('error', 'Veuillez vous connecter');
  res.redirect('/admin/login');
}

module.exports = { requireAuth };
