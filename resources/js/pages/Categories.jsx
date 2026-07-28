import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import api from '../api';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

const FILIERE_DATA = {
    'Genie Informatique': {
        icon: 'fas fa-laptop-code',
        color: '#3B82F6', bg: '#eff6ff',
        grad: 'linear-gradient(135deg,#1E3A8A 0%,#3B82F6 100%)',
        description: "Formez-vous aux metiers du numerique : developpement logiciel, reseaux, cybersecurite, intelligence artificielle et gestion des systemes d'information.",
    },
    'Agriculture et Elevage': {
        icon: 'fas fa-seedling',
        color: '#10B981', bg: '#ecfdf5',
        grad: 'linear-gradient(135deg,#065F46 0%,#10B981 100%)',
        description: "Maitrisez les techniques modernes de production vegetale et animale, d'agro-alimentaire, d'agroforesterie et de gestion durable des ressources naturelles.",
    },
    'Genie Electrique': {
        icon: 'fas fa-bolt',
        color: '#F59E0B', bg: '#fff8ec',
        grad: 'linear-gradient(135deg,#92400E 0%,#F59E0B 100%)',
        description: "Developpez des competences en electronique, electrotechnique, automatisme industriel, energies renouvelables et maintenance des equipements electriques.",
    },
    'Genie Civil et Genie Thermique': {
        icon: 'fas fa-hard-hat',
        color: '#8B5CF6', bg: '#f5f3ff',
        grad: 'linear-gradient(135deg,#4C1D95 0%,#8B5CF6 100%)',
        description: "Concevez et realisez des ouvrages de construction, de genie thermique et climatique, de topographie et d'infrastructure pour le developpement urbain.",
    },
    'Genie Mecanique et Productique': {
        icon: 'fas fa-cogs',
        color: '#E74C3C', bg: '#fef2f2',
        grad: 'linear-gradient(135deg,#7F1D1D 0%,#E74C3C 100%)',
        description: "Concevez, fabriquez et maintenez des systemes mecaniques industriels. Maitrisez la productique, la maintenance et les procedes de fabrication avances.",
    },
    'Commerce, Vente et Gestion': {
        icon: 'fas fa-chart-line',
        color: '#EC4899', bg: '#fdf2f8',
        grad: 'linear-gradient(135deg,#831843 0%,#EC4899 100%)',
        description: "Acquierez des competences en commerce international, comptabilite, gestion d'entreprise, marketing digital et management pour piloter votre carriere.",
    },
    'Art, Tourisme et Hotellerie': {
        icon: 'fas fa-utensils',
        color: '#F5A623', bg: '#fff8ec',
        grad: 'linear-gradient(135deg,#7C3500 0%,#F5A623 100%)',
        description: "Explorez les metiers de la restauration, de l'hotellerie, du tourisme, des arts graphiques et de la communication visuelle pour valoriser votre creativite.",
    },
    'Sante': {
        icon: 'fas fa-heartbeat',
        color: TEAL, bg: '#e8f8f5',
        grad: 'linear-gradient(135deg,#1B2A4A 0%,#5BBCB4 100%)',
        description: "Formez-vous aux metiers de la sante et du paramedicale : soins infirmiers, sante publique, imagerie medicale et accompagnement des patients.",
    },
};

const FILIERE_ORDER = [
    'Agriculture et Elevage',
    'Genie Informatique',
    'Genie Electrique',
    'Genie Civil et Genie Thermique',
    'Genie Mecanique et Productique',
    'Commerce, Vente et Gestion',
    'Art, Tourisme et Hotellerie',
    'Sante',
];

const css = `
.fil-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
.spe-grid  { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
@media(max-width:1024px){ .fil-grid { grid-template-columns:repeat(3,1fr); } .spe-grid { grid-template-columns:repeat(3,1fr); } }
@media(max-width:768px)  { .fil-grid { grid-template-columns:repeat(2,1fr); gap:14px; } .spe-grid { grid-template-columns:repeat(2,1fr); } }
@media(max-width:480px)  { .fil-grid { grid-template-columns:1fr; } .spe-grid { grid-template-columns:1fr; } }
`;

export default function Categories() {
    const { t } = useLang();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [params] = useSearchParams();
    const activeFiliere = params.get('f') || null; // null = show filière cards, string = show that filière's specialités

    useEffect(() => {
        api.get('/api/public/categories')
            .then(r => setCategories(r.data.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Group by filiere_name
    const grouped = {};
    for (const cat of categories) {
        const key = cat.filiere_name || 'Autres';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(cat);
    }

    const filiereKeys = [
        ...FILIERE_ORDER.filter(f => grouped[f]),
        ...Object.keys(grouped).filter(f => !FILIERE_ORDER.includes(f)),
    ];

    const matchesCat = (cat) => {
        if (!search) return true;
        return cat.name?.toLowerCase().includes(search.toLowerCase()) ||
               cat.description?.toLowerCase().includes(search.toLowerCase());
    };

    const handleSearch = () => setSearch(searchInput);

    // ── FILIÈRE DETAIL VIEW (when ?f=... param is set) ──
    if (activeFiliere) {
        const fd = FILIERE_DATA[activeFiliere] || { icon: 'fas fa-folder', color: TEAL, bg: '#e8f8f5', grad: `linear-gradient(135deg,${NAVY},${TEAL})`, description: '' };
        const cats = (grouped[activeFiliere] || []).filter(matchesCat);

        return (
            <div style={{ background: '#F5F5F5', minHeight: '100vh' }}>
                <style>{css}</style>

                {/* Filière hero banner */}
                <div style={{ background: fd.grad, padding: '36px 0 32px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }}></div>
                    <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
                    <div style={W}>
                        <Link to="/formations" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 20 }}>
                            <i className="fas fa-arrow-left" style={{ fontSize: 11 }}></i> Toutes les filieres
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                            <div style={{ width: 70, height: 70, borderRadius: 20, background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, color: 'white', flexShrink: 0 }}>
                                <i className={fd.icon}></i>
                            </div>
                            <div>
                                <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: '0 0 6px', letterSpacing: -0.3 }}>{activeFiliere}</h1>
                                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', margin: 0, maxWidth: 600 }}>{fd.description}</p>
                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '6px 0 0' }}>
                                    <i className="fas fa-graduation-cap" style={{ marginRight: 5 }}></i>
                                    {(grouped[activeFiliere] || []).length} specialite{(grouped[activeFiliere] || []).length > 1 ? 's' : ''} disponible{(grouped[activeFiliere] || []).length > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ ...W, paddingTop: 32, paddingBottom: 64 }}>
                    {/* Search */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'white', borderRadius: 10, overflow: 'hidden', height: 44, border: '1px solid #e5e7eb' }}>
                            <span style={{ padding: '0 14px', color: '#9ca3af' }}><i className="fas fa-search"></i></span>
                            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="Rechercher une specialite..."
                                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: NAVY, background: 'transparent', height: '100%' }} />
                            {searchInput && <button onClick={() => { setSearchInput(''); setSearch(''); }} style={{ padding: '0 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>×</button>}
                        </div>
                        <button onClick={handleSearch} style={{ background: fd.color, color: 'white', border: 'none', borderRadius: 10, padding: '0 20px', height: 44, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Rechercher</button>
                    </div>

                    {loading ? (
                        <div className="spe-grid">{[...Array(6)].map((_, i) => <div key={i} style={{ background: 'white', borderRadius: 12, height: 120, border: '1px solid #f0f0f0' }}></div>)}</div>
                    ) : cats.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
                            <i className="fas fa-search" style={{ fontSize: 48, marginBottom: 16, color: '#e5e7eb' }}></i>
                            <p style={{ fontSize: 15, fontWeight: 600, color: '#6b7280' }}>Aucune specialite trouvee</p>
                        </div>
                    ) : (
                        <div className="spe-grid">
                            {cats.map(cat => <SpecialiteCard key={cat.id} cat={cat} fd={fd} />)}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── MAIN VIEW: filière cards ──
    const isSearching = !!search;

    return (
        <div style={{ background: '#F5F5F5', minHeight: '100vh' }}>
            <style>{css}</style>

            {/* Header / Search */}
            <section style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #243a63 100%)`, padding: '40px 0 32px' }}>
                <div style={{ ...W, textAlign: 'center' }}>
                    <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', margin: '0 0 8px', letterSpacing: -0.5 }}>
                        Nos <span style={{ color: TEAL }}>Filieres</span> de Formation
                    </h1>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 24px' }}>
                        Cliquez sur une filiere pour decouvrir ses specialites
                    </p>
                    <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', gap: 10 }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'white', borderRadius: 10, overflow: 'hidden', height: 46, boxShadow: '0 4px 16px rgba(0,0,0,.2)' }}>
                            <span style={{ padding: '0 14px', color: '#9ca3af' }}><i className="fas fa-search"></i></span>
                            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="Rechercher une filiere ou specialite..."
                                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: NAVY, background: 'transparent', height: '100%' }} />
                            {searchInput && <button onClick={() => { setSearchInput(''); setSearch(''); }} style={{ padding: '0 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>×</button>}
                        </div>
                        <button onClick={handleSearch} style={{ background: TEAL, color: 'white', border: 'none', borderRadius: 10, padding: '0 22px', height: 46, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Rechercher</button>
                    </div>
                </div>
            </section>

            <div style={{ ...W, paddingTop: 36, paddingBottom: 64 }}>

                {loading && (
                    <div className="fil-grid">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} style={{ background: 'white', borderRadius: 16, height: 240, border: '1px solid #f0f0f0' }}></div>
                        ))}
                    </div>
                )}

                {/* Search results */}
                {!loading && isSearching && (
                    <>
                        {filiereKeys.map(filiere => {
                            const cats = (grouped[filiere] || []).filter(matchesCat);
                            if (cats.length === 0) return null;
                            const fd = FILIERE_DATA[filiere] || { color: TEAL, bg: '#e8f8f5', grad: `linear-gradient(135deg,${NAVY},${TEAL})` };
                            return (
                                <div key={filiere} style={{ marginBottom: 40 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                        <div style={{ width: 6, height: 24, borderRadius: 3, background: fd.grad }}></div>
                                        <h3 style={{ fontSize: 15, fontWeight: 800, color: NAVY, margin: 0 }}>{filiere}</h3>
                                        <span style={{ fontSize: 11, color: fd.color, background: fd.bg, padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>{cats.length} specialite{cats.length > 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="spe-grid">
                                        {cats.map(cat => <SpecialiteCard key={cat.id} cat={cat} fd={fd} />)}
                                    </div>
                                </div>
                            );
                        })}
                        {filiereKeys.every(f => (grouped[f] || []).filter(matchesCat).length === 0) && (
                            <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
                                <i className="fas fa-search" style={{ fontSize: 48, marginBottom: 16, color: '#e5e7eb' }}></i>
                                <p style={{ fontSize: 15, fontWeight: 600, color: '#6b7280' }}>Aucun resultat pour "{search}"</p>
                                <button onClick={() => { setSearch(''); setSearchInput(''); }} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 50, background: TEAL, color: 'white', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                                    Effacer
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Filière cards grid */}
                {!loading && !isSearching && (
                    <div className="fil-grid">
                        {filiereKeys.map(key => {
                            const fd = FILIERE_DATA[key] || { icon: 'fas fa-folder', color: TEAL, bg: '#e8f8f5', grad: `linear-gradient(135deg,${NAVY},${TEAL})`, description: '' };
                            return (
                                <FiliereCard key={key} name={key} fd={fd} count={(grouped[key] || []).length} />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function FiliereCard({ name, fd, count }) {
    const [hovered, setHovered] = useState(false);

    return (
        <Link
            to={`/formations?f=${encodeURIComponent(name)}`}
            style={{ textDecoration: 'none', display: 'block' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div style={{
                borderRadius: 16, overflow: 'hidden',
                border: `2px solid ${hovered ? fd.color + '80' : '#e8e8e8'}`,
                boxShadow: hovered ? `0 12px 32px ${fd.color}25` : '0 2px 8px rgba(0,0,0,.05)',
                transform: hovered ? 'translateY(-5px)' : 'none',
                transition: 'all .2s', background: 'white',
            }}>
                {/* Photo / gradient banner */}
                <div style={{ height: 150, background: fd.grad, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }}></div>
                    <div style={{ position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }}></div>
                    <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                        <i className={fd.icon || 'fas fa-folder'}></i>
                    </div>
                    {count > 0 && (
                        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.92)', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: fd.color }}>
                            {count} specialite{count > 1 ? 's' : ''}
                        </div>
                    )}
                    {/* Hover arrow */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: `rgba(0,0,0,${hovered ? 0.3 : 0})`, textAlign: 'center', padding: '6px 0', fontSize: 11, color: 'white', fontWeight: 700, transition: 'all .2s', opacity: hovered ? 1 : 0 }}>
                        <i className="fas fa-arrow-right" style={{ marginRight: 5 }}></i>Ouvrir la filiere
                    </div>
                </div>

                {/* Info */}
                <div style={{ padding: '15px 17px' }}>
                    <h3 style={{ fontSize: 13, fontWeight: 800, color: NAVY, margin: '0 0 6px', lineHeight: 1.3, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                        {name}
                    </h3>
                    <p style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.55, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {fd.description || 'Decouvrez les specialites de cette filiere.'}
                    </p>
                    <span style={{ fontSize: 11, color: fd.color, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <i className="fas fa-graduation-cap" style={{ fontSize: 10 }}></i>
                        Voir les specialites
                    </span>
                </div>
            </div>
        </Link>
    );
}

function SpecialiteCard({ cat, fd }) {
    const [hovered, setHovered] = useState(false);

    return (
        <Link to={`/formations/${cat.id}`} style={{ textDecoration: 'none', display: 'block' }}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            <div style={{
                background: hovered ? fd.bg : 'white',
                borderRadius: 12,
                border: `1.5px solid ${hovered ? fd.color + '60' : '#e8e8e8'}`,
                overflow: 'hidden', transition: 'all .2s',
                boxShadow: hovered ? `0 6px 20px ${fd.color}18` : '0 1px 4px rgba(0,0,0,.04)',
                transform: hovered ? 'translateY(-2px)' : 'none',
            }}>
                <div style={{ height: 3, background: fd.grad }}></div>
                <div style={{ padding: '14px 15px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: fd.bg, border: `1px solid ${fd.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: fd.color, fontSize: 15, flexShrink: 0 }}>
                            <i className={cat.icon || 'fas fa-graduation-cap'}></i>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontSize: 12, fontWeight: 700, color: NAVY, margin: '0 0 4px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {cat.name}
                            </h4>
                            {cat.description && (
                                <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 5px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {cat.description}
                                </p>
                            )}
                            <span style={{ fontSize: 10, color: fd.color, fontWeight: 600 }}>
                                Voir les cours <i className="fas fa-arrow-right" style={{ fontSize: 8 }}></i>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
