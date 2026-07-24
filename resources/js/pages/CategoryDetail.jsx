import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

const cdCSS = `
.cd-hero-flex { display:flex; align-items:center; gap:32px; }
.cd-hero-icon { width:88px; height:88px; border-radius:22px; font-size:36px; flex-shrink:0; }
.cd-hero-title { font-size:38px; }
.cd-stats-row { display:flex; justify-content:center; gap:0; }
.cd-stat-item { flex:1; padding:22px 24px; display:flex; align-items:center; gap:14px; }
.cd-grid4 { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
.cd-grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.cd-cta-bar { display:flex; align-items:center; justify-content:space-between; gap:24px; padding:36px 40px; }
.cd-cta-btns { display:flex; gap:12px; }

@media(max-width:1024px){
  .cd-grid4 { grid-template-columns:repeat(2,1fr); }
  .cd-grid3 { grid-template-columns:repeat(2,1fr); }
}
@media(max-width:768px){
  .cd-hero-flex { flex-direction:column; align-items:flex-start; gap:16px; }
  .cd-hero-icon { width:60px; height:60px; font-size:24px; border-radius:16px; }
  .cd-hero-title { font-size:26px; }
  .cd-stats-row { flex-wrap:wrap; }
  .cd-stat-item { border-right:none!important; flex:none; width:50%; }
  .cd-grid4 { grid-template-columns:repeat(2,1fr); gap:12px; }
  .cd-grid3 { grid-template-columns:1fr; }
  .cd-cta-bar { flex-direction:column; align-items:flex-start; padding:24px 20px; }
  .cd-cta-btns { width:100%; }
  .cd-cta-btns a { flex:1; justify-content:center; text-align:center; }
}
@media(max-width:480px){
  .cd-grid4 { grid-template-columns:1fr; }
  .cd-stat-item { width:100%; }
  .cd-hero-title { font-size:22px; }
}
`;

export default function CategoryDetail() {
    const { id } = useParams();
    const { t } = useLang();
    const { user } = useAuth();
    const [category, setCategory] = useState(null);
    const [debouches, setDebouches] = useState([]);
    const [certifications, setCertifications] = useState([]);
    const [ues, setUes] = useState([]);
    const [loadingCours, setLoadingCours] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(null);
    const [expandedUe, setExpandedUe] = useState(null);
    const [aiPanel, setAiPanel] = useState(null); // { docId, mode: 'summary'|'quiz' }
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState({}); // { [docId_mode]: data }
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [viewingDoc, setViewingDoc] = useState(null); // docId of PDF being viewed inline

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get(`/api/public/categories/${id}`),
            api.get(`/api/public/categories/${id}/debouches`),
            api.get(`/api/public/categories/${id}/certifications`),
        ])
            .then(([catRes, debRes, certRes]) => {
                setCategory(catRes.data.category || catRes.data.data || catRes.data);
                setDebouches(debRes.data.debouches || debRes.data.data || debRes.data || []);
                const certs = certRes.data.certifications || certRes.data.data || certRes.data || [];
                setCertifications(Array.isArray(certs) ? certs : []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id]);

    // Fetch courses when cours tab is opened
    useEffect(() => {
        if (activeTab === 'cours' && ues.length === 0 && !loadingCours) {
            setLoadingCours(true);
            api.get(`/api/public/categories/${id}/cours`)
                .then(res => setUes(res.data.ues || []))
                .catch(() => {})
                .finally(() => setLoadingCours(false));
        }
    }, [activeTab]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, border: '3px solid #e5e7eb', borderTopColor: TEAL, borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }}></div>
                    <span style={{ color: '#9ca3af', fontSize: 14 }}>{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    if (!category) {
        return (
            <div style={{ ...W, padding: '80px 24px', textAlign: 'center' }}>
                <i className="fas fa-exclamation-circle" style={{ fontSize: 48, color: '#d1d5db', marginBottom: 16 }}></i>
                <p style={{ color: '#9ca3af', fontSize: 16 }}>Formation introuvable.</p>
                <Link to="/formations" style={{ color: TEAL, fontWeight: 600, textDecoration: 'none', marginTop: 12, display: 'inline-block' }}>&larr; Retour aux formations</Link>
            </div>
        );
    }

    const stats = [
        { icon: 'fas fa-book', value: category.courses_count ?? 0, label: 'Cours', color: TEAL, scrollTo: 'section-action-cards', tab: 'cours' },
        { icon: 'fas fa-route', value: category.roadmap_steps_count ?? 0, label: t('categories.roadmap'), color: '#F5A623', scrollTo: 'section-action-cards' },
        { icon: 'fas fa-briefcase', value: category.debouches_count ?? debouches.length, label: t('categories.debouches'), color: '#E74C3C', scrollTo: 'section-debouches', tab: 'debouches' },
        { icon: 'fas fa-certificate', value: category.certifications_count ?? certifications.length, label: 'Certifications', color: NAVY, scrollTo: 'section-certifications', tab: 'certifications' },
    ];

    const actionCards = [
        {
            key: 'cours',
            icon: 'fas fa-book-open',
            title: 'Cours',
            desc: 'Accedez aux cours et supports pedagogiques de cette specialite.',
            color: TEAL,
            bg: '#e8f8f5',
        },
        {
            key: 'roadmap',
            icon: 'fas fa-route',
            title: 'Parcours',
            desc: 'Suivez les etapes du parcours recommande pour maitriser cette specialite.',
            color: '#F5A623',
            bg: '#fff8ec',
            link: `/formations/${id}/roadmap`,
            external: true,
        },
        {
            key: 'debouches',
            icon: 'fas fa-briefcase',
            title: 'Debouches',
            desc: 'Decouvrez les metiers et opportunites accessibles apres cette formation.',
            color: '#E74C3C',
            bg: '#fef2f2',
        },
        {
            key: 'certifications',
            icon: 'fas fa-certificate',
            title: 'Certifications',
            desc: 'Accedez aux certifications disponibles pour cette specialite.',
            color: NAVY,
            bg: '#eef0f5',
        },
    ];

    // ── AI Revision helpers ───────────────────────────────────────────────
    const startAi = async (doc, ue, mode) => {
        const key = `${doc.id}_${mode}`;
        // If already loaded, just toggle panel
        if (aiResult[key]) {
            setAiPanel(aiPanel?.docId === doc.id && aiPanel?.mode === mode ? null : { docId: doc.id, mode });
            setQuizAnswers({});
            setQuizSubmitted(false);
            return;
        }
        setAiPanel({ docId: doc.id, mode });
        setAiLoading(true);
        setQuizAnswers({});
        setQuizSubmitted(false);
        try {
            if (mode === 'summary') {
                const r = await api.post('/api/exams/summarize-course', {
                    course_title: doc.title,
                    course_content: doc.content || '',
                    filiere: ue.nom,
                });
                setAiResult(prev => ({ ...prev, [key]: r.data.summary }));
            } else {
                const r = await api.post('/api/exams/generate-quiz', {
                    course_title: doc.title,
                    course_content: doc.content || '',
                    num_questions: 5,
                });
                setAiResult(prev => ({ ...prev, [key]: r.data.questions }));
            }
        } catch {
            setAiResult(prev => ({ ...prev, [key]: mode === 'summary' ? 'Erreur lors de la generation du resume.' : [] }));
        } finally {
            setAiLoading(false);
        }
    };

    const quizScore = (questions) => {
        if (!questions?.length) return 0;
        let correct = 0;
        questions.forEach((q, i) => { if (quizAnswers[i] === q.correct) correct++; });
        return correct;
    };

    const renderMd = (md) => {
        if (!md) return '';
        return md
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:700;color:#1B2A4A;margin:16px 0 6px;">$1</h3>')
            .replace(/^## (.+)$/gm, '<h2 style="font-size:17px;font-weight:800;color:#1B2A4A;margin:20px 0 8px;border-bottom:2px solid #e5e7eb;padding-bottom:6px;">$1</h2>')
            .replace(/^# (.+)$/gm, '<h1 style="font-size:19px;font-weight:800;color:#1B2A4A;margin:22px 0 10px;">$1</h1>')
            .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#1B2A4A;">$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^[\-\*] (.+)$/gm, '<li style="margin:4px 0;">$1</li>')
            .replace(/^\d+\. (.+)$/gm, '<li style="margin:4px 0;list-style-type:decimal;">$1</li>')
            .replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, m => `<ul style="margin:8px 0 8px 20px;">${m}</ul>`)
            .replace(/\n{2,}/g, '</p><p style="margin:0 0 8px;line-height:1.7;color:#374151;">')
            .replace(/\n/g, '<br>');
    };

    const typeIcon = (type) => {
        switch (type) {
            case 'pdf': return 'fas fa-file-pdf';
            case 'course': return 'fas fa-book';
            default: return 'fas fa-file-alt';
        }
    };

    const typeColor = (type) => {
        switch (type) {
            case 'pdf': return '#E74C3C';
            case 'course': return TEAL;
            default: return '#6b7280';
        }
    };

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh' }}>

            {/* === HERO BANNER === */}
            <section style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #2d4270 50%, ${TEAL} 100%)`, padding: '60px 0 50px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(91,188,180,0.12)', pointerEvents: 'none' }}></div>
                <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }}></div>

                <div style={W}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                        <Link to="/formations" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, textDecoration: 'none', transition: 'color .2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'white'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
                        >Formations</Link>
                        <i className="fas fa-chevron-right" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}></i>
                        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>{category.name}</span>
                    </div>

                    <div className="cd-hero-flex">
                        <div className="cd-hero-icon" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <i className={category.icon || 'fas fa-laptop-code'}></i>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: TEAL, textTransform: 'uppercase', background: 'rgba(91,188,180,0.15)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(91,188,180,0.3)' }}>Specialite</span>
                            </div>
                            <h1 className="cd-hero-title" style={{ fontWeight: 800, color: 'white', margin: '0 0 14px', lineHeight: 1.2 }}>{category.name}</h1>
                            {category.description && (
                                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.75, maxWidth: 620, margin: 0 }}>{category.description}</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* === STATS ROW === */}
            <section style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', zIndex: 10 }}>
                <div className="cd-stats-row" style={{ ...W }}>
                    {stats.map((s, i) => (
                        <div key={i} className="cd-stat-item"
                            style={{ borderRight: i < stats.length - 1 ? '1px solid #f3f4f6' : 'none', cursor: s.scrollTo ? 'pointer' : 'default' }}
                            onClick={() => {
                                if (s.tab) setActiveTab(s.tab);
                                if (s.scrollTo) setTimeout(() => document.getElementById(s.scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                            }}
                        >
                            <div style={{ width: 46, height: 46, borderRadius: 12, background: `${s.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: 18, flexShrink: 0 }}>
                                <i className={s.icon}></i>
                            </div>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: NAVY, lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* === ACTION CARDS === */}
            <section id="section-action-cards" style={{ padding: '48px 0 0' }}>
                <div style={W}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 24 }}>Contenu de la formation</h2>
                    <div className="cd-grid4">
                        {actionCards.map((card) => (
                            card.external ? (
                                <Link key={card.key} to={card.link}
                                    style={{ background: 'white', borderRadius: 16, padding: '26px 22px', textDecoration: 'none', border: '1px solid #f0f0f0', transition: 'all .2s', display: 'block' }}
                                    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 28px ${card.color}22`; e.currentTarget.style.borderColor = card.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    <div style={{ width: 50, height: 50, borderRadius: 14, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: card.color, marginBottom: 16 }}><i className={card.icon}></i></div>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{card.title}</h3>
                                    <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.65, margin: 0 }}>{card.desc}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, color: card.color, fontSize: 13, fontWeight: 600 }}>
                                        <span>Acceder</span><i className="fas fa-arrow-right" style={{ fontSize: 11 }}></i>
                                    </div>
                                </Link>
                            ) : (
                                <button key={card.key}
                                    onClick={() => setActiveTab(activeTab === card.key ? null : card.key)}
                                    style={{ background: activeTab === card.key ? `${card.color}08` : 'white', borderRadius: 16, padding: '26px 22px', textAlign: 'left', border: activeTab === card.key ? `1.5px solid ${card.color}` : '1px solid #f0f0f0', transition: 'all .2s', cursor: 'pointer', width: '100%' }}
                                    onMouseEnter={e => { if (activeTab !== card.key) { e.currentTarget.style.boxShadow = `0 8px 28px ${card.color}22`; e.currentTarget.style.borderColor = card.color; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                                    onMouseLeave={e => { if (activeTab !== card.key) { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                                >
                                    <div style={{ width: 50, height: 50, borderRadius: 14, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: card.color, marginBottom: 16 }}><i className={card.icon}></i></div>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{card.title}</h3>
                                    <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.65, margin: 0 }}>{card.desc}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, color: card.color, fontSize: 13, fontWeight: 600 }}>
                                        <span>{activeTab === card.key ? 'Masquer' : 'Afficher'}</span>
                                        <i className={`fas fa-chevron-${activeTab === card.key ? 'up' : 'down'}`} style={{ fontSize: 11 }}></i>
                                    </div>
                                </button>
                            )
                        ))}
                    </div>
                </div>
            </section>

            {/* === COURS PANEL === */}
            {activeTab === 'cours' && (
                <section id="section-cours" style={{ padding: '36px 0 0' }}>
                    <div style={W}>
                        <div style={{ background: 'white', borderRadius: 20, padding: '32px 32px 24px', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#e8f8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEAL, fontSize: 18 }}>
                                    <i className="fas fa-book-open"></i>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 18, fontWeight: 800, color: NAVY, margin: 0 }}>Cours par Unite d'Enseignement</h3>
                                    <p style={{ fontSize: 13, color: '#9ca3af', margin: '2px 0 0' }}>Cliquez sur une UE pour voir ses cours</p>
                                </div>
                            </div>

                            {loadingCours ? (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: TEAL, borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }}></div>
                                    <p style={{ fontSize: 13, color: '#9ca3af' }}>Chargement des cours...</p>
                                </div>
                            ) : ues.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                                    <i className="fas fa-book" style={{ fontSize: 36, marginBottom: 12, display: 'block', opacity: 0.3 }}></i>
                                    <p style={{ fontSize: 14 }}>Aucun cours disponible pour le moment.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {ues.map((ue) => {
                                        const isOpen = expandedUe === ue.id;
                                        const docs = ue.knowledge_documents || [];
                                        return (
                                            <div key={ue.id} style={{ border: isOpen ? `1.5px solid ${TEAL}` : '1px solid #f0f0f0', borderRadius: 14, overflow: 'hidden', transition: 'all .2s' }}>
                                                <button
                                                    onClick={() => setExpandedUe(isOpen ? null : ue.id)}
                                                    style={{
                                                        width: '100%', background: isOpen ? `${TEAL}08` : '#fafafa', border: 'none',
                                                        padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                                                    }}
                                                >
                                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: isOpen ? TEAL : '#e5e7eb', color: isOpen ? 'white' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, transition: 'all .2s' }}>
                                                        <i className="fas fa-layer-group"></i>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{ue.nom}</div>
                                                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                                                            {ue.code && <span>{ue.code} &bull; </span>}
                                                            Semestre {ue.semestre} &bull; Coef. {ue.coefficient} &bull; {docs.length} cours
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: `${TEAL}15`, color: TEAL }}>{docs.length}</span>
                                                        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: 11, color: '#9ca3af' }}></i>
                                                    </div>
                                                </button>

                                                {isOpen && docs.length > 0 && (
                                                    <div style={{ padding: '8px 20px 16px', borderTop: '1px solid #f0f0f0' }}>
                                                        {docs.map((doc) => {
                                                            const isAiOpen = aiPanel?.docId === doc.id;
                                                            const summaryKey = `${doc.id}_summary`;
                                                            const quizKey = `${doc.id}_quiz`;
                                                            return (
                                                            <div key={doc.id}>
                                                                <div style={{
                                                                    display: 'flex', alignItems: 'center', gap: 12,
                                                                    padding: '10px 14px', marginTop: 6, borderRadius: 10,
                                                                    background: isAiOpen ? '#e8f8f5' : '#fafafa',
                                                                    flexWrap: 'wrap',
                                                                }}>
                                                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${typeColor(doc.type)}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                        <i className={typeIcon(doc.type)} style={{ fontSize: 14, color: typeColor(doc.type) }}></i>
                                                                    </div>
                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                        <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{doc.title}</div>
                                                                        <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', marginTop: 2 }}>{doc.type}</div>
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                                                        {doc.file_path && (
                                                                            <button onClick={() => setViewingDoc(viewingDoc === doc.id ? null : doc.id)}
                                                                                style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 8, background: viewingDoc === doc.id ? NAVY : '#f3f4f6', color: viewingDoc === doc.id ? 'white' : '#6b7280', display: 'flex', alignItems: 'center', gap: 4, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                                                                                title="Lire le cours"
                                                                            >
                                                                                <i className={`fas fa-${viewingDoc === doc.id ? 'times' : 'eye'}`} style={{ fontSize: 10 }}></i> {viewingDoc === doc.id ? 'Fermer' : 'Lire'}
                                                                            </button>
                                                                        )}
                                                                        {user && viewingDoc === doc.id && (
                                                                            <>
                                                                                <button onClick={() => startAi(doc, ue, 'summary')}
                                                                                    style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 8, background: isAiOpen && aiPanel.mode === 'summary' ? TEAL : '#e8f8f5', color: isAiOpen && aiPanel.mode === 'summary' ? 'white' : TEAL, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                                                                    title="Resume IA du cours"
                                                                                >
                                                                                    <i className="fas fa-magic" style={{ fontSize: 10 }}></i> Resume
                                                                                </button>
                                                                                <button onClick={() => startAi(doc, ue, 'quiz')}
                                                                                    style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 8, background: isAiOpen && aiPanel.mode === 'quiz' ? '#F5A623' : '#fff8ec', color: isAiOpen && aiPanel.mode === 'quiz' ? 'white' : '#F5A623', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                                                                    title="Quiz IA de revision"
                                                                                >
                                                                                    <i className="fas fa-question-circle" style={{ fontSize: 10 }}></i> Quiz
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Inline PDF viewer */}
                                                                {viewingDoc === doc.id && doc.file_path && (
                                                                    <div style={{ margin: '6px 0 10px', borderRadius: 12, overflow: 'hidden', border: `1.5px solid ${NAVY}`, background: '#f8f9fa' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: NAVY }}>
                                                                            <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}><i className="fas fa-book-reader" style={{ marginRight: 6 }}></i>{doc.title}</span>
                                                                            <button onClick={() => setViewingDoc(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14 }}><i className="fas fa-times"></i></button>
                                                                        </div>
                                                                        <iframe
                                                                            src={`/storage/${doc.file_path}#toolbar=0&navpanes=0`}
                                                                            style={{ width: '100%', height: 600, border: 'none' }}
                                                                            title={doc.title}
                                                                        />
                                                                    </div>
                                                                )}

                                                                {/* AI Panel */}
                                                                {isAiOpen && (
                                                                    <div style={{ margin: '6px 0 10px', padding: '18px 16px', borderRadius: 12, background: 'white', border: `1.5px solid ${aiPanel.mode === 'summary' ? TEAL : '#F5A623'}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                                                        {aiLoading ? (
                                                                            <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                                                                <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: aiPanel.mode === 'summary' ? TEAL : '#F5A623', borderRadius: '50%', margin: '0 auto 10px', animation: 'spin 0.8s linear infinite' }}></div>
                                                                                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
                                                                                    {aiPanel.mode === 'summary' ? "L'IA resume votre cours..." : "L'IA genere votre quiz..."}
                                                                                </p>
                                                                            </div>
                                                                        ) : aiPanel.mode === 'summary' ? (
                                                                            /* Summary view */
                                                                            <div>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                                                                    <i className="fas fa-magic" style={{ color: TEAL }}></i>
                                                                                    <span style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>Resume IA — {doc.title}</span>
                                                                                    <button onClick={() => setAiPanel(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}><i className="fas fa-times"></i></button>
                                                                                </div>
                                                                                <div style={{ fontSize: 13, lineHeight: 1.75, color: '#374151' }}
                                                                                    dangerouslySetInnerHTML={{ __html: renderMd(aiResult[summaryKey] || '') }}
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            /* Quiz view */
                                                                            <div>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                                                                    <i className="fas fa-question-circle" style={{ color: '#F5A623' }}></i>
                                                                                    <span style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>Quiz IA — {doc.title}</span>
                                                                                    <button onClick={() => setAiPanel(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}><i className="fas fa-times"></i></button>
                                                                                </div>
                                                                                {Array.isArray(aiResult[quizKey]) && aiResult[quizKey].length > 0 ? (
                                                                                    <>
                                                                                        {aiResult[quizKey].map((q, qi) => (
                                                                                            <div key={qi} style={{ marginBottom: 18, padding: '14px', borderRadius: 10, background: '#fafafa', border: '1px solid #f0f0f0' }}>
                                                                                                <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: '0 0 10px' }}>{qi + 1}. {q.question}</p>
                                                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                                                                    {q.options?.map((opt, oi) => {
                                                                                                        const selected = quizAnswers[qi] === oi;
                                                                                                        const isCorrect = oi === q.correct;
                                                                                                        let bg = 'white', border = '#e5e7eb', color = NAVY;
                                                                                                        if (quizSubmitted) {
                                                                                                            if (isCorrect) { bg = '#d1fae5'; border = '#6ee7b7'; color = '#065f46'; }
                                                                                                            else if (selected && !isCorrect) { bg = '#fee2e2'; border = '#fca5a5'; color = '#991b1b'; }
                                                                                                        } else if (selected) {
                                                                                                            bg = '#e8f8f5'; border = TEAL; color = TEAL;
                                                                                                        }
                                                                                                        return (
                                                                                                            <button key={oi} onClick={() => { if (!quizSubmitted) setQuizAnswers(p => ({ ...p, [qi]: oi })); }}
                                                                                                                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${border}`, background: bg, color, cursor: quizSubmitted ? 'default' : 'pointer', textAlign: 'left', fontSize: 12, fontWeight: selected ? 700 : 500, fontFamily: 'inherit', transition: 'all .15s' }}
                                                                                                            >
                                                                                                                <span style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0, background: selected ? (quizSubmitted ? bg : TEAL) : 'white', color: selected ? 'white' : '#9ca3af' }}>
                                                                                                                    {String.fromCharCode(65 + oi)}
                                                                                                                </span>
                                                                                                                {opt}
                                                                                                            </button>
                                                                                                        );
                                                                                                    })}
                                                                                                </div>
                                                                                                {quizSubmitted && q.explanation && (
                                                                                                    <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: '#f0f9ff', fontSize: 11, color: '#1e40af', lineHeight: 1.6 }}>
                                                                                                        <i className="fas fa-lightbulb" style={{ marginRight: 6, color: '#F5A623' }}></i>{q.explanation}
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        ))}
                                                                                        {!quizSubmitted ? (
                                                                                            <button onClick={() => setQuizSubmitted(true)}
                                                                                                disabled={Object.keys(quizAnswers).length < aiResult[quizKey].length}
                                                                                                style={{ width: '100%', padding: '12px', borderRadius: 10, background: Object.keys(quizAnswers).length < aiResult[quizKey].length ? '#e5e7eb' : '#F5A623', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: Object.keys(quizAnswers).length < aiResult[quizKey].length ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                                                                                            >
                                                                                                Valider mes reponses
                                                                                            </button>
                                                                                        ) : (
                                                                                            <div style={{ textAlign: 'center', padding: '14px', borderRadius: 12, background: quizScore(aiResult[quizKey]) >= aiResult[quizKey].length * 0.6 ? '#d1fae5' : '#fef3c7', border: `1px solid ${quizScore(aiResult[quizKey]) >= aiResult[quizKey].length * 0.6 ? '#6ee7b7' : '#fcd34d'}` }}>
                                                                                                <div style={{ fontSize: 28, fontWeight: 800, color: NAVY }}>{quizScore(aiResult[quizKey])}/{aiResult[quizKey].length}</div>
                                                                                                <p style={{ fontSize: 13, color: '#6b7280', margin: '6px 0 10px' }}>
                                                                                                    {quizScore(aiResult[quizKey]) >= aiResult[quizKey].length * 0.8 ? 'Excellent ! Vous maitrisez ce cours.' :
                                                                                                     quizScore(aiResult[quizKey]) >= aiResult[quizKey].length * 0.6 ? 'Bien ! Quelques points a revoir.' :
                                                                                                     'Continuez a reviser ce cours pour ameliorer vos resultats.'}
                                                                                                </p>
                                                                                                <button onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); setAiResult(prev => { const n = { ...prev }; delete n[quizKey]; return n; }); startAi(doc, ue, 'quiz'); }}
                                                                                                    style={{ padding: '8px 20px', borderRadius: 8, background: TEAL, color: 'white', fontWeight: 600, fontSize: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                                                                                                >
                                                                                                    <i className="fas fa-redo" style={{ marginRight: 6 }}></i>Nouveau quiz
                                                                                                </button>
                                                                                            </div>
                                                                                        )}
                                                                                    </>
                                                                                ) : (
                                                                                    <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>Impossible de generer le quiz. Reessayez.</p>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {isOpen && docs.length === 0 && (
                                                    <div style={{ padding: '16px 20px', borderTop: '1px solid #f0f0f0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                                                        Aucun cours pour cette UE.
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* === DEBOUCHES PANEL === */}
            {activeTab === 'debouches' && (
                <section id="section-debouches" style={{ padding: '36px 0 0' }}>
                    <div style={W}>
                        <div style={{ background: 'white', borderRadius: 20, padding: '32px 32px 24px', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E74C3C', fontSize: 18 }}><i className="fas fa-briefcase"></i></div>
                                <div>
                                    <h3 style={{ fontSize: 18, fontWeight: 800, color: NAVY, margin: 0 }}>Debouches professionnels</h3>
                                    <p style={{ fontSize: 13, color: '#9ca3af', margin: '2px 0 0' }}>Opportunites accessibles apres cette formation</p>
                                </div>
                            </div>
                            {debouches.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                                    <i className="fas fa-folder-open" style={{ fontSize: 36, marginBottom: 12, display: 'block', opacity: 0.4 }}></i>
                                    <p style={{ fontSize: 14 }}>Aucun debouche renseigne pour le moment.</p>
                                </div>
                            ) : (
                                <div className="cd-grid3">
                                    {debouches.map((d, i) => (
                                        <Link key={d.id || i} to={`/debouche/${d.id}`}
                                            style={{ background: '#fafafa', borderRadius: 14, padding: '20px 18px', border: '1px solid #f3f4f6', transition: 'all .2s', textDecoration: 'none', display: 'block' }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#E74C3C40'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#f3f4f6'; e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#E74C3C', flexShrink: 0 }}><i className={d.icon || 'fas fa-briefcase'}></i></div>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: '0 0 6px' }}>{d.title}</h4>
                                                    {d.description && <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{d.description}</p>}
                                                </div>
                                                <i className="fas fa-chevron-right" style={{ fontSize: 11, color: '#d1d5db', marginTop: 6 }}></i>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* === CERTIFICATIONS PANEL === */}
            {activeTab === 'certifications' && (
                <section id="section-certifications" style={{ padding: '36px 0 0' }}>
                    <div style={W}>
                        <div style={{ background: 'white', borderRadius: 20, padding: '32px 32px 24px', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eef0f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: NAVY, fontSize: 18 }}><i className="fas fa-certificate"></i></div>
                                <div>
                                    <h3 style={{ fontSize: 18, fontWeight: 800, color: NAVY, margin: 0 }}>Certifications</h3>
                                    <p style={{ fontSize: 13, color: '#9ca3af', margin: '2px 0 0' }}>Certifications disponibles pour cette specialite</p>
                                </div>
                            </div>
                            {certifications.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                                    <i className="fas fa-certificate" style={{ fontSize: 36, marginBottom: 12, display: 'block', opacity: 0.3 }}></i>
                                    <p style={{ fontSize: 14 }}>Aucune certification disponible pour le moment.</p>
                                </div>
                            ) : (
                                <div className="cd-grid3">
                                    {certifications.map((c, i) => (
                                        <div key={c.id || i} style={{ background: '#fafafa', borderRadius: 14, padding: '20px 18px', border: '1px solid #f3f4f6' }}>
                                            <h4 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: '0 0 6px' }}>{c.name || c.title}</h4>
                                            {c.description && <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>{c.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* === DEBOUCHES DEFAULT (when no tab active) === */}
            {activeTab === null && debouches.length > 0 && (
                <section style={{ padding: '48px 0 0' }}>
                    <div style={W}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, margin: 0 }}>Debouches professionnels</h2>
                            <span style={{ fontSize: 13, color: '#9ca3af' }}>{debouches.length} metier{debouches.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="cd-grid3">
                            {debouches.map((d, i) => (
                                <Link key={d.id || i} to={`/debouche/${d.id}`}
                                    style={{ background: 'white', borderRadius: 16, padding: '22px 20px', border: '1px solid #f0f0f0', transition: 'all .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', textDecoration: 'none', display: 'block' }}
                                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(231,76,60,0.1)'; e.currentTarget.style.borderColor = '#E74C3C40'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#E74C3C', flexShrink: 0 }}><i className={d.icon || 'fas fa-briefcase'}></i></div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: '0 0 6px' }}>{d.title}</h4>
                                            {d.description && <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{d.description}</p>}
                                        </div>
                                        <i className="fas fa-chevron-right" style={{ fontSize: 11, color: '#d1d5db', marginTop: 6 }}></i>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* === QUICK LINKS FOOTER === */}
            <section style={{ padding: '48px 0 60px' }}>
                <div style={W}>
                    <div className="cd-cta-bar" style={{ background: `linear-gradient(135deg, ${NAVY}, #2d4270)`, borderRadius: 20 }}>
                        <div>
                            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white', margin: '0 0 8px' }}>Commencer l'apprentissage</h3>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Acces aux cours et au parcours de formation</p>
                        </div>
                        <div className="cd-cta-btns">
                            <button onClick={() => { setActiveTab('cours'); setTimeout(() => document.getElementById('section-cours')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                                style={{ background: TEAL, color: 'white', padding: '12px 26px', borderRadius: 50, fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer' }}>
                                <i className="fas fa-book-open"></i> Voir les cours
                            </button>
                            <Link to={`/formations/${id}/roadmap`} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '12px 26px', borderRadius: 50, fontWeight: 600, textDecoration: 'none', fontSize: 14, whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <i className="fas fa-route"></i> Parcours
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <style>{cdCSS}{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
