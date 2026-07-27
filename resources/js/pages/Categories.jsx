import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

const FILIERE_ICONS = {
    'Genie Informatique':          'fas fa-laptop-code',
    'Agriculture et Elevage':      'fas fa-seedling',
    'Genie Electrique':            'fas fa-bolt',
    'Genie Civil et Genie Thermique': 'fas fa-hard-hat',
    'Genie Mecanique et Productique': 'fas fa-cogs',
    'Commerce, Vente et Gestion':  'fas fa-chart-line',
    'Art, Tourisme et Hotellerie': 'fas fa-utensils',
    'Sante':                       'fas fa-heartbeat',
};

const FILIERE_COLORS = {
    'Genie Informatique':          { color: '#3B82F6', bg: '#eff6ff', grad: 'linear-gradient(135deg,#3B82F6,#1E3A8A)' },
    'Agriculture et Elevage':      { color: '#10B981', bg: '#ecfdf5', grad: 'linear-gradient(135deg,#10B981,#065F46)' },
    'Genie Electrique':            { color: '#F59E0B', bg: '#fff8ec', grad: 'linear-gradient(135deg,#F59E0B,#92400E)' },
    'Genie Civil et Genie Thermique': { color: '#8B5CF6', bg: '#f5f3ff', grad: 'linear-gradient(135deg,#8B5CF6,#5B21B6)' },
    'Genie Mecanique et Productique': { color: '#E74C3C', bg: '#fef2f2', grad: 'linear-gradient(135deg,#E74C3C,#9B1C1C)' },
    'Commerce, Vente et Gestion':  { color: '#EC4899', bg: '#fdf2f8', grad: 'linear-gradient(135deg,#EC4899,#831843)' },
    'Art, Tourisme et Hotellerie': { color: '#F5A623', bg: '#fff8ec', grad: 'linear-gradient(135deg,#F5A623,#E07B00)' },
    'Sante':                       { color: TEAL,     bg: '#e8f8f5', grad: 'linear-gradient(135deg,#5BBCB4,#1B2A4A)' },
};

const FILIERE_ORDER = [
    'Genie Informatique',
    'Commerce, Vente et Gestion',
    'Genie Civil et Genie Thermique',
    'Sante',
    'Genie Electrique',
    'Genie Mecanique et Productique',
    'Agriculture et Elevage',
    'Art, Tourisme et Hotellerie',
];

const css = `
.cat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
@media(max-width:1024px){ .cat-grid { grid-template-columns:repeat(3,1fr); } }
@media(max-width:768px)  { .cat-grid { grid-template-columns:repeat(2,1fr); gap:12px; } }
@media(max-width:480px)  { .cat-grid { grid-template-columns:1fr; } }
`;

export default function Categories() {
    const { t } = useLang();
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [activeFiliere, setActiveFiliere] = useState('all');

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

    // Ordered filiere list (known order + any extras at end)
    const filiereKeys = [
        ...FILIERE_ORDER.filter(f => grouped[f]),
        ...Object.keys(grouped).filter(f => !FILIERE_ORDER.includes(f)),
    ];

    // Filter by search or active filiere
    const matchesCat = (cat) => {
        if (search) {
            return cat.name?.toLowerCase().includes(search.toLowerCase()) ||
                   cat.description?.toLowerCase().includes(search.toLowerCase());
        }
        return true;
    };

    const displayedKeys = activeFiliere === 'all'
        ? filiereKeys
        : filiereKeys.filter(f => f === activeFiliere);

    const handleSearch = () => setSearch(searchInput);

    return (
        <div style={{ background: '#F5F5F5', minHeight: '100vh' }}>
            <style>{css}</style>

            {/* Search bar */}
            <section style={{ background: TEAL, padding: '28px 0' }}>
                <div style={{ ...W, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'white', borderRadius: 8, overflow: 'hidden', height: 48, boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
                        <span style={{ padding: '0 16px', color: '#9ca3af' }}><i className="fas fa-search"></i></span>
                        <input
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="Rechercher une specialite..."
                            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: NAVY, background: 'transparent', height: '100%' }}
                        />
                        {searchInput && (
                            <button onClick={() => { setSearchInput(''); setSearch(''); }} style={{ padding: '0 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>×</button>
                        )}
                    </div>
                    <button onClick={handleSearch} style={{ background: NAVY, color: 'white', border: 'none', borderRadius: 8, padding: '0 28px', height: 48, fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                        Rechercher
                    </button>
                </div>
            </section>

            {/* Filiere filter pills */}
            <section style={{ background: 'white', borderBottom: '1px solid #e8e8e8' }}>
                <div style={{ ...W, display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 24px', scrollbarWidth: 'none' }}>
                    <FilterPill active={activeFiliere === 'all'} onClick={() => setActiveFiliere('all')}>
                        Toutes les filieres
                    </FilterPill>
                    {filiereKeys.map(f => (
                        <FilterPill key={f} active={activeFiliere === f} onClick={() => setActiveFiliere(f)} color={FILIERE_COLORS[f]?.color}>
                            <i className={FILIERE_ICONS[f] || 'fas fa-folder'} style={{ marginRight: 5, fontSize: 11 }}></i>
                            {f}
                        </FilterPill>
                    ))}
                </div>
            </section>

            {/* Content */}
            <div style={{ ...W, paddingTop: 36, paddingBottom: 64 }}>

                {loading && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                        {[...Array(8)].map(i => (
                            <div key={i} style={{ background: 'white', borderRadius: 12, height: 160, border: '1px solid #f0f0f0' }}></div>
                        ))}
                    </div>
                )}

                {!loading && displayedKeys.map(filiere => {
                    const cats = (grouped[filiere] || []).filter(matchesCat);
                    if (cats.length === 0) return null;
                    const fc = FILIERE_COLORS[filiere] || { color: TEAL, bg: '#e8f8f5', grad: `linear-gradient(135deg,${TEAL},${NAVY})` };
                    const icon = FILIERE_ICONS[filiere] || 'fas fa-folder';

                    return (
                        <div key={filiere} style={{ marginBottom: 48 }}>
                            {/* Filiere header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: fc.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, flexShrink: 0, boxShadow: `0 4px 12px ${fc.color}40` }}>
                                    <i className={icon}></i>
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 18, fontWeight: 800, color: NAVY, margin: 0 }}>
                                        FILIERE : {filiere.toUpperCase()}
                                    </h2>
                                    <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>
                                        {cats.length} specialite{cats.length > 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div style={{ flex: 1, height: 2, background: `linear-gradient(90deg, ${fc.color}30, transparent)`, borderRadius: 1, marginLeft: 8 }}></div>
                            </div>

                            {/* Specialties grid */}
                            <div className="cat-grid">
                                {cats.map(cat => (
                                    <SpecialiteCard key={cat.id} cat={cat} fc={fc} t={t} />
                                ))}
                            </div>
                        </div>
                    );
                })}

                {!loading && displayedKeys.every(f => (grouped[f] || []).filter(matchesCat).length === 0) && (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
                        <i className="fas fa-search" style={{ fontSize: 48, marginBottom: 16, color: '#e5e7eb' }}></i>
                        <p style={{ fontSize: 16, fontWeight: 600, color: '#6b7280' }}>Aucune specialite trouvee</p>
                        <button onClick={() => { setSearch(''); setSearchInput(''); setActiveFiliere('all'); }}
                            style={{ marginTop: 16, padding: '10px 24px', borderRadius: 50, background: TEAL, color: 'white', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                            Voir toutes les filieres
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function FilterPill({ active, onClick, color, children }) {
    return (
        <button onClick={onClick} style={{
            padding: '7px 16px', borderRadius: 50, whiteSpace: 'nowrap', flexShrink: 0,
            border: active ? `1.5px solid ${color || TEAL}` : '1.5px solid #d1d5db',
            background: active ? (color || TEAL) : 'white',
            color: active ? 'white' : '#6b7280',
            fontWeight: active ? 700 : 500,
            fontSize: 12, cursor: 'pointer', transition: 'all .15s',
        }}>
            {children}
        </button>
    );
}

function SpecialiteCard({ cat, fc, t }) {
    const [hovered, setHovered] = useState(false);

    return (
        <Link to={`/formations/${cat.id}`} style={{ textDecoration: 'none', display: 'block' }}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            <div style={{
                background: 'white', borderRadius: 12, border: `1px solid ${hovered ? fc.color + '60' : '#e8e8e8'}`,
                overflow: 'hidden', transition: 'all .2s',
                boxShadow: hovered ? `0 8px 24px ${fc.color}20` : '0 2px 6px rgba(0,0,0,.04)',
                transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
            }}>
                {/* Color top strip */}
                <div style={{ height: 3, background: fc.grad }}></div>

                <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: fc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: fc.color, fontSize: 16, flexShrink: 0 }}>
                            <i className={cat.icon || 'fas fa-graduation-cap'}></i>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ fontSize: 12, fontWeight: 700, color: NAVY, margin: '0 0 4px', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {cat.name}
                            </h3>
                            {cat.courses_count > 0 && (
                                <span style={{ fontSize: 10, color: fc.color, fontWeight: 600 }}>
                                    <i className="fas fa-book" style={{ marginRight: 3, fontSize: 9 }}></i>
                                    {cat.courses_count} cours
                                </span>
                            )}
                        </div>
                        <i className="fas fa-chevron-right" style={{ fontSize: 9, color: hovered ? fc.color : '#d1d5db', marginTop: 4, transition: 'color .2s', flexShrink: 0 }}></i>
                    </div>
                </div>
            </div>
        </Link>
    );
}
