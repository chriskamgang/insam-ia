import { createContext, useContext, useState } from 'react';

const translations = {
    fr: {
        nav: { home: 'Accueil', courses: 'Formations', blog: 'Blog', about: 'A propos', login: 'Connexion', register: 'Inscription', dashboard: 'Tableau de bord', logout: 'Deconnexion' },
        hero: { title: 'Votre assistant academique intelligent', subtitle: 'Acces aux cours, sujets d\'examens, quiz interactifs et un tuteur IA disponible 24h/7', cta: 'Commencer gratuitement', cta2: 'Decouvrir les formations' },
        home: { stats_students: 'Etudiants', stats_courses: 'Formations', stats_videos: 'Cours', stats_success: 'Taux de reussite', categories_title: 'Formations par specialite', recent_title: 'Derniers cours ajoutes', features_title: 'Pourquoi INSAM-IA ?', feature1: 'Assistant IA 24h/7', feature1_desc: 'Posez vos questions, obtenez des explications personnalisees', feature2: 'Sujets d\'examens', feature2_desc: 'Bibliotheque complete classee par specialite et niveau', feature3: 'Quiz interactifs', feature3_desc: 'Testez vos connaissances avec evaluation automatique', feature4: 'Communaute', feature4_desc: 'Echangez avec les etudiants de votre specialite' },
        categories: { title: 'Nos formations', videos: 'Cours', roadmap: 'Parcours', debouches: 'Debouches', certifications: 'Certifications' },
        chat: { title: 'Assistant IA', placeholder: 'Posez votre question...', send: 'Envoyer', upload: 'Joindre un fichier', summary: 'Resume de cours', ue_quiz: 'UE + Quiz', online: 'En ligne · disponible 24h/7', read_course: 'Lire le cours', stop: 'Arreter', summarize_part: 'Ou resumer une partie specifique :', no_formations: 'Aucune formation trouvee pour votre filiere.', generating_summary: 'Generation du resume...', summary_generated: 'Resume genere', teaching_units: 'Unites d\'Enseignement', read: 'Lire', take_quiz: 'Passer au Quiz', generating_quiz: 'Generation du quiz...', questions: 'questions', submit_quiz: 'Soumettre', new_quiz: 'Nouveau quiz', excellent: 'Excellent travail !', keep_studying: 'Continuez a reviser, vous pouvez vous ameliorer !', enter_send: 'Appuyez sur Entree pour envoyer', shift_newline: 'Maj+Entree pour un saut de ligne' },
        quiz: { title: 'Evaluations', start: 'Commencer', submit: 'Soumettre', score: 'Score', time_left: 'Temps restant' },
        library: { title: 'Bibliotheque Intelligente', subtitle: 'Anciens sujets BTS, generation d\'epreuves par IA, corrections automatiques et enrichissement de la banque d\'epreuves.', tab_subjects: 'Anciens Sujets BTS', tab_generate: 'Generer des Epreuves', tab_enrich: 'Enrichir la Banque', tab_correct: 'Obtenir une Correction', tab_analytics: 'Progression', search_subject: 'Rechercher un sujet...', all_levels: 'Tous niveaux', all_fields: 'Toutes specialites', no_subject: 'Aucun sujet trouve', submit_first: 'Soumettez le premier sujet ou modifiez vos filtres.', submit_subject: 'Soumettre un sujet', download: 'Telecharger', ai_correction: 'Correction IA', gen_title: 'Generer une epreuve basee sur les anciens sujets', gen_desc: 'L\'IA analyse les anciens sujets de votre matiere et genere une nouvelle epreuve complete avec exercices et bareme.', subject: 'Matiere', field: 'Specialite', level: 'Niveau', choose: 'Choisir...', generating: 'Generation en cours...', generate_btn: 'Generer l\'epreuve', generated: 'Epreuve generee', copy: 'Copier', read: 'Lire', stop: 'Arreter', enrich_title: 'Enrichir la banque d\'epreuves', enrich_desc: 'Chargez vos epreuves dans la base de donnees pour aider les autres etudiants.', title_label: 'Titre du sujet', year: 'Annee', category: 'Categorie', none: 'Aucune', file_label: 'Fichier (PDF, DOC)', click_choose: 'Cliquez pour choisir un fichier', sending: 'Envoi...', submit_btn: 'Soumettre le sujet', correct_title: 'Obtenir la correction d\'une epreuve', correct_desc: 'Collez le contenu d\'une epreuve et obtenez une correction detaillee par l\'IA. L\'epreuve sera automatiquement stockee dans la banque.', title_field: 'Titre', content_label: 'Contenu de l\'epreuve', content_placeholder: 'Collez ici le contenu complet de l\'epreuve...', correcting: 'Correction en cours...', correct_btn: 'Corriger et enregistrer', correction_detail: 'Correction detaillee', official: 'Officiel', correction_loading: 'L\'IA genere la correction...', correction_wait: 'Cela peut prendre quelques secondes.', prog_bts: 'Progression BTS', prog_ue: 'Progression UE', avg_score: 'Score moyen', best_score: 'Meilleur score', attempts: 'tentatives', no_data: 'Aucune donnee de progression', no_data_desc: 'Traitez des epreuves ou suivez des cours pour voir votre progression.', revision: 'Revision', revision_quiz: 'Quiz de revision', complete_course: 'Terminer le cours', course_done: 'Cours termine', start_revision: 'Passer au quiz de revision', quiz_bts: 'Quiz BTS', quiz_course: 'Quiz Cours' },
        common: { search: 'Rechercher...', loading: 'Chargement...', no_results: 'Aucun resultat', see_all: 'Voir tout', back: 'Retour', save: 'Enregistrer', delete: 'Supprimer', edit: 'Modifier', cancel: 'Annuler', confirm: 'Confirmer' },
    },
    en: {
        nav: { home: 'Home', courses: 'Courses', blog: 'Blog', about: 'About', login: 'Login', register: 'Register', dashboard: 'Dashboard', logout: 'Logout' },
        hero: { title: 'Your intelligent academic assistant', subtitle: 'Access courses, lab videos, past exams, interactive quizzes and an AI tutor available 24/7', cta: 'Start for free', cta2: 'Discover courses' },
        home: { stats_students: 'Students', stats_courses: 'Courses', stats_videos: 'Courses', stats_success: 'Success rate', categories_title: 'Courses by specialty', recent_title: 'Latest courses added', features_title: 'Why INSAM-IA?', feature1: 'AI Assistant 24/7', feature1_desc: 'Ask questions, get personalized explanations', feature2: 'Past exams', feature2_desc: 'Complete library sorted by specialty and level', feature3: 'Interactive quizzes', feature3_desc: 'Test your knowledge with automatic evaluation', feature4: 'Community', feature4_desc: 'Exchange with students from your specialty' },
        categories: { title: 'Our courses', videos: 'Courses', roadmap: 'Roadmap', debouches: 'Career paths', certifications: 'Certifications' },
        chat: { title: 'AI Assistant', placeholder: 'Ask your question...', send: 'Send', upload: 'Attach file', summary: 'Course summary', ue_quiz: 'Courses + Quiz', online: 'Online · available 24/7', read_course: 'Read course', stop: 'Stop', summarize_part: 'Or summarize a specific part:', no_formations: 'No courses found for your field.', generating_summary: 'Generating summary...', summary_generated: 'Summary generated', teaching_units: 'Teaching Units', read: 'Read', take_quiz: 'Take Quiz', generating_quiz: 'Generating quiz...', questions: 'questions', submit_quiz: 'Submit', new_quiz: 'New quiz', excellent: 'Excellent work!', keep_studying: 'Keep studying, you can improve!', enter_send: 'Press Enter to send', shift_newline: 'Shift+Enter for new line' },
        quiz: { title: 'Assessments', start: 'Start', submit: 'Submit', score: 'Score', time_left: 'Time left' },
        library: { title: 'Smart Library', subtitle: 'Past BTS exams, AI-generated exercises, automatic corrections and exam bank enrichment.', tab_subjects: 'Past BTS Exams', tab_generate: 'Generate Exercises', tab_enrich: 'Enrich the Bank', tab_correct: 'Get a Correction', tab_analytics: 'Progression', search_subject: 'Search an exam...', all_levels: 'All levels', all_fields: 'All fields', no_subject: 'No exam found', submit_first: 'Submit the first exam or change your filters.', submit_subject: 'Submit an exam', download: 'Download', ai_correction: 'AI Correction', gen_title: 'Generate an exam based on past papers', gen_desc: 'AI analyzes past exams for your subject and generates a complete new exam with exercises and grading scale.', subject: 'Subject', field: 'Field', level: 'Level', choose: 'Choose...', generating: 'Generating...', generate_btn: 'Generate exam', generated: 'Generated exam', copy: 'Copy', read: 'Read', stop: 'Stop', enrich_title: 'Enrich the exam bank', enrich_desc: 'Upload your exams to the database to help other students.', title_label: 'Exam title', year: 'Year', category: 'Category', none: 'None', file_label: 'File (PDF, DOC)', click_choose: 'Click to choose a file', sending: 'Sending...', submit_btn: 'Submit exam', correct_title: 'Get an exam correction', correct_desc: 'Paste exam content and get a detailed AI correction. The exam will be automatically stored in the bank.', title_field: 'Title', content_label: 'Exam content', content_placeholder: 'Paste the full exam content here...', correcting: 'Correcting...', correct_btn: 'Correct and save', correction_detail: 'Detailed correction', official: 'Official', correction_loading: 'AI is generating the correction...', correction_wait: 'This may take a few seconds.', prog_bts: 'BTS Progression', prog_ue: 'UE Progression', avg_score: 'Average score', best_score: 'Best score', attempts: 'attempts', no_data: 'No progression data', no_data_desc: 'Complete exams or courses to see your progression.', revision: 'Revision', revision_quiz: 'Revision quiz', complete_course: 'Complete course', course_done: 'Course completed', start_revision: 'Take revision quiz', quiz_bts: 'BTS Quiz', quiz_course: 'Course Quiz' },
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
