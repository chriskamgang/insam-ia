import '../css/app.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import AppRouter from './AppRouter';

createRoot(document.getElementById('app')).render(
    <LangProvider>
        <AuthProvider>
            <BrowserRouter>
                <Toaster position="top-right" toastOptions={{ style: { borderRadius: 12, padding: '14px 20px' } }} />
                <AppRouter />
            </BrowserRouter>
        </AuthProvider>
    </LangProvider>
);

// ── Content Protection (anti-download, anti-screenshot deterrents) ──
(function () {
    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Block keyboard shortcuts for print, save, screenshot, copy
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S (save), Ctrl/Cmd + P (print), Ctrl/Cmd + Shift + S
        if ((e.ctrlKey || e.metaKey) && ['s', 'p'].includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
        // Ctrl/Cmd + Shift + 3/4/5 (Mac screenshots)
        if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
            e.preventDefault();
        }
        // PrintScreen key
        if (e.key === 'PrintScreen') {
            e.preventDefault();
            document.body.style.filter = 'blur(20px)';
            setTimeout(() => { document.body.style.filter = 'none'; }, 1500);
        }
        // F12 (dev tools)
        if (e.key === 'F12') {
            e.preventDefault();
        }
        // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+U (dev tools / view source)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j'].includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
            e.preventDefault();
        }
    });

    // Block drag & drop of images/content
    document.addEventListener('dragstart', (e) => e.preventDefault());

    // Blur content when page loses visibility (screenshot deterrent)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            document.body.style.filter = 'blur(15px)';
        } else {
            document.body.style.filter = 'none';
        }
    });

    // Add CSS protections
    const style = document.createElement('style');
    style.textContent = `
        /* Disable text selection on the whole site */
        body { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }
        /* Allow selection in input/textarea fields */
        input, textarea, [contenteditable="true"] { -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text; user-select: text; }
        /* Block printing */
        @media print { body { display: none !important; } }
        /* Prevent image saving */
        img { pointer-events: none; -webkit-user-drag: none; }
        /* Hide iframes from print */
        @media print { iframe { display: none !important; } }
    `;
    document.head.appendChild(style);
})();

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((reg) => console.log('SW registered:', reg.scope))
            .catch((err) => console.log('SW registration failed:', err));
    });
}
