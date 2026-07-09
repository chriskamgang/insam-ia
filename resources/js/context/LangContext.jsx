import { createContext, useContext, useState } from 'react';

const translations = {
    fr: {
        nav: { home: 'Accueil', courses: 'Formations', blog: 'Blog', about: 'A propos', login: 'Connexion', register: 'Inscription', dashboard: 'Tableau de bord', logout: 'Deconnexion' },
        hero: { title: 'Votre assistant academique intelligent', subtitle: 'Acces aux cours, videos TP, sujets d\'examens, quiz interactifs et un tuteur IA disponible 24h/7', cta: 'Commencer gratuitement', cta2: 'Decouvrir les formations' },
        home: { stats_students: 'Etudiants', stats_courses: 'Formations', stats_videos: 'Videos TP', stats_success: 'Taux de reussite', categories_title: 'Formations par specialite', recent_title: 'Derniers cours ajoutes', features_title: 'Pourquoi INSAM-IA ?', feature1: 'Assistant IA 24h/7', feature1_desc: 'Posez vos questions, obtenez des explications personnalisees', feature2: 'Sujets d\'examens', feature2_desc: 'Bibliotheque complete classee par filiere et niveau', feature3: 'Quiz interactifs', feature3_desc: 'Testez vos connaissances avec evaluation automatique', feature4: 'Videos TP', feature4_desc: 'Regardez les travaux pratiques de chaque specialite' },
        categories: { title: 'Nos formations', videos: 'Videos TP', roadmap: 'Parcours', debouches: 'Debouches', certifications: 'Certifications' },
        chat: { title: 'Assistant IA', placeholder: 'Posez votre question...', send: 'Envoyer', upload: 'Joindre un fichier' },
        quiz: { title: 'Evaluations', start: 'Commencer', submit: 'Soumettre', score: 'Score', time_left: 'Temps restant' },
        common: { search: 'Rechercher...', loading: 'Chargement...', no_results: 'Aucun resultat', see_all: 'Voir tout', back: 'Retour', save: 'Enregistrer', delete: 'Supprimer', edit: 'Modifier', cancel: 'Annuler', confirm: 'Confirmer' },
    },
    en: {
        nav: { home: 'Home', courses: 'Courses', blog: 'Blog', about: 'About', login: 'Login', register: 'Register', dashboard: 'Dashboard', logout: 'Logout' },
        hero: { title: 'Your intelligent academic assistant', subtitle: 'Access courses, lab videos, past exams, interactive quizzes and an AI tutor available 24/7', cta: 'Start for free', cta2: 'Discover courses' },
        home: { stats_students: 'Students', stats_courses: 'Courses', stats_videos: 'Lab Videos', stats_success: 'Success rate', categories_title: 'Courses by specialty', recent_title: 'Latest courses added', features_title: 'Why INSAM-IA?', feature1: 'AI Assistant 24/7', feature1_desc: 'Ask questions, get personalized explanations', feature2: 'Past exams', feature2_desc: 'Complete library sorted by field and level', feature3: 'Interactive quizzes', feature3_desc: 'Test your knowledge with automatic evaluation', feature4: 'Lab Videos', feature4_desc: 'Watch practical work for each specialty' },
        categories: { title: 'Our courses', videos: 'Lab Videos', roadmap: 'Roadmap', debouches: 'Career paths', certifications: 'Certifications' },
        chat: { title: 'AI Assistant', placeholder: 'Ask your question...', send: 'Send', upload: 'Attach file' },
        quiz: { title: 'Assessments', start: 'Start', submit: 'Submit', score: 'Score', time_left: 'Time left' },
        common: { search: 'Search...', loading: 'Loading...', no_results: 'No results', see_all: 'See all', back: 'Back', save: 'Save', delete: 'Delete', edit: 'Edit', cancel: 'Cancel', confirm: 'Confirm' },
    },
};

const LangContext = createContext();

export function LangProvider({ children }) {
    const [lang, setLang] = useState(localStorage.getItem('lang') || 'fr');

    const t = (key) => {
        const keys = key.split('.');
        let val = translations[lang];
        for (const k of keys) {
            val = val?.[k];
        }
        return val || key;
    };

    const switchLang = (l) => {
        setLang(l);
        localStorage.setItem('lang', l);
    };

    return (
        <LangContext.Provider value={{ lang, t, switchLang }}>
            {children}
        </LangContext.Provider>
    );
}

export const useLang = () => useContext(LangContext);
