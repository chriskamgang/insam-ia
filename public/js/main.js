// Close modals on outside click
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', function(e) {
    if (e.target === this) this.style.display = 'none';
  });
});

// Auto-hide alerts after 4 seconds
document.querySelectorAll('.alert').forEach(alert => {
  setTimeout(() => {
    alert.style.transition = 'opacity 0.5s';
    alert.style.opacity = '0';
    setTimeout(() => alert.remove(), 500);
  }, 4000);
});

// Close sidebar on mobile when clicking outside
document.addEventListener('click', function(e) {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.querySelector('.sidebar-toggle');
  if (sidebar && sidebar.classList.contains('active') && !sidebar.contains(e.target) && e.target !== toggle) {
    sidebar.classList.remove('active');
  }
});
