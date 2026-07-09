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

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((reg) => console.log('SW registered:', reg.scope))
            .catch((err) => console.log('SW registration failed:', err));
    });
}
