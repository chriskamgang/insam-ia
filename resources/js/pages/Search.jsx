import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

const TYPE_LABELS = {
    all: 'Tout',
    category: 'Formations',
    video: 'Videos',
};

const TYPE_ICONS = {
    all: 'fas fa-th-large',
    category: 'fas fa-graduation-cap',
    video: 'fas fa-play-circle',
};

function CategoryCard({ cat }) {
    const [hovered, setHovered] = useState(false);
    return (
        <Link
            to={`/formations/${cat.id}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: 'white', borderRadius: 16,
                border: `1.5px solid ${hovered ? TEAL : '#f0f0f0'}`,
                boxShadow: hovered ? '0 8px 28px rgba(91,188,180,0.14)' : '0 1px 4px rgba(0,0,0,0.04)',
                padding: '22px 20px',
                textDecoration: 'none',
                display: 'flex', alignItems: 'flex-start', gap: 14,
                transition: 'all .2s',
                transform: hovered ? 'translateY(-2px)' : 'none',
            }}
        >
            <div style={{
                width: 46, height: 46, borderRadius: 12,
                background: '#e8f8f5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: TEAL, flexShrink: 0,
            }}>
                <i className={cat.icon || 'fas fa-laptop-code'}></i>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                        fontSize: 10, fontWeight: 700, color: TEAL,
                        background: '#e8f8f5', padding: '2px 8px', borderRadius: 4,
                        textTransform: 'uppercase', letterSpacing: 0.3,
                    }}>Formation</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: NAVY, margin: '0 0 6px', lineHeight: 1.3 }}>
                    {cat.name}
                </h3>
                {cat.description && (
                    <p style={{
                        fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                        {cat.description}
                    </p>
                )}
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    {cat.videos_count > 0 && (
                        <span style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className="fas fa-play-circle" style={{ color: TEAL }}></i>
                            {cat.videos_count} video{cat.videos_count !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

function VideoCard({ video }) {
    const [hovered, setHovered] = useState(false);
    return (
        <Link
            to={`/video/${video.id}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: 'white', borderRadius: 16,
                border: `1.5px solid ${hovered ? TEAL : '#f0f0f0'}`,
                boxShadow: hovered ? '0 8px 28px rgba(91,188,180,0.14)' : '0 1px 4px rgba(0,0,0,0.04)',
                textDecoration: 'none',
                overflow: 'hidden',
                transition: 'all .2s',
                transform: hovered ? 'translateY(-2px)' : 'none',
                display: 'flex', flexDirection: 'column',
            }}
        >
            {/* Thumbnail */}
            <div style={{
                height: 130, flexShrink: 0,
                background: 'linear-gradient(135deg, #5BBCB440, #1B2A4A30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
            }}>
                <i className="fas fa-play-circle" style={{ fontSize: 36, color: TEAL, opacity: 0.9 }}></i>
                {video.duration && (
                    <span style={{
                        position: 'absolute', bottom: 8, right: 10,
                        background: 'rgba(0,0,0,0.6)', color: 'white',
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                    }}>
                        {video.duration}
                    </span>
                )}
                <span style={{
                    position: 'absolute', top: 8, left: 10,
                    fontSize: 9, fontWeight: 700, color: TEAL,
                    background: '#e8f8f5', padding: '2px 8px', borderRadius: 4,
                    textTransform: 'uppercase', letterSpacing: 0.3,
                }}>Video TP</span>
            </div>

            <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {video.category_name && (
                    <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>{video.category_name}</span>
                )}
                <h3 style={{
                    fontSize: 13, fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.4,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                    {video.title}
                </h3>
                <div style={{ display: 'flex', gap: 10, color: '#9ca3af', fontSize: 11, marginTop: 'auto' }}>
                    <span><i className="fas fa-eye" style={{ marginRight: 3 }}></i>{video.views_count || 0} vues</span>
                </div>
            </div>
        </Link>
    );
}

export default function Search() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [inputVal, setInputVal] = useState(searchParams.get('q') || '');
    const [type, setType] = useState('all');

    const [categories, setCategories] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    const inputRef = useRef(null);

    /* ── FETCH DATA ── */
    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get('/api/public/categories').then(r => r.data.data || r.data || []).catch(() => []),
            api.get('/api/public/recent-videos').then(r => r.data.data || r.data || []).catch(() => []),
        ]).then(([cats, vids]) => {
            setCategories(cats);
            setVideos(vids);
            setFetched(true);
        }).finally(() => setLoading(false));
    }, []);

    /* Focus input on mount */
    useEffect(() => { inputRef.current?.focus(); }, []);

    /* ── FILTERING ── */
    const q = query.trim().toLowerCase();

    const filteredCats = categories.filter(c =>
        !q ||
        c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );

    const filteredVids = videos.filter(v =>
        !q ||
        v.title?.toLowerCase().includes(q) ||
        v.category_name?.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q)
    );

    const totalResults = filteredCats.length + filteredVids.length;

    const handleSearch = (e) => {
        e.preventDefault();
        setQuery(inputVal);
        setSearchParams(inputVal ? { q: inputVal } : {});
    };

    const clearSearch = () => {
        setInputVal('');
        setQuery('');
        setSearchParams({});
        inputRef.current?.focus();
    };

    /* ── POPULAR SUGGESTIONS ── */
    const suggestions = ['Python', 'Reseau', 'Algorithmique', 'Base de donnees', 'Securite', 'Web'];

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh', paddingBottom: 60 }}>

            {/* ── HERO SEARCH ── */}
            <section style={{
                background: 'linear-gradient(135deg, #1B2A4A 0%, #243758 60%, #2d4470 100%)',
                padding: '52px 0 60px',
            }}>
                <div style={{ ...W, textAlign: 'center' }}>
                    <span style={{ color: TEAL, fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>RECHERCHE</span>
                    <h1 style={{ fontSize: 36, fontWeight: 900, color: 'white', margin: '12px 0 8px', lineHeight: 1.2 }}>
                        Trouvez vos <span style={{ color: TEAL }}>formations</span>
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
                        Recherchez parmi nos formations, videos TP et ressources pedagogiques.
                    </p>

                    {/* Search form */}
                    <form onSubmit={handleSearch} style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}>
                        <div style={{ display: 'flex', gap: 0, background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.16)' }}>
                            <i className="fas fa-search" style={{
                                position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
                                color: '#9ca3af', fontSize: 16, zIndex: 1,
                            }}></i>
                            <input
                                ref={inputRef}
                                value={inputVal}
                                onChange={e => setInputVal(e.target.value)}
                                placeholder="Rechercher une formation, video, sujet..."
                                style={{
                                    flex: 1, padding: '16px 48px 16px 52px',
                                    border: 'none', outline: 'none', fontSize: 15,
                                    color: NAVY, background: 'transparent',
                                }}
                            />
                            {inputVal && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    style={{
                                        background: 'none', border: 'none', padding: '0 12px',
                                        color: '#9ca3af', cursor: 'pointer', fontSize: 16,
                                    }}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                            <button
                                type="submit"
                                style={{
                                    padding: '16px 26px', background: TEAL, color: 'white',
                                    border: 'none', fontWeight: 700, fontSize: 14,
                                    cursor: 'pointer', borderRadius: '0 14px 14px 0',
                                    transition: 'background .2s',
                                }}
                            >
                                Rechercher
                            </button>
                        </div>
                    </form>

                    {/* Suggestions */}
                    {!query && (
                        <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, alignSelf: 'center' }}>Populaire :</span>
                            {suggestions.map(s => (
                                <button
                                    key={s}
                                    onClick={() => { setInputVal(s); setQuery(s); setSearchParams({ q: s }); }}
                                    style={{
                                        padding: '5px 14px', borderRadius: 20,
                                        background: 'rgba(255,255,255,0.12)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: 'rgba(255,255,255,0.8)',
                                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                        transition: 'all .15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(91,188,180,0.3)'; e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.color = 'white'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <div style={{ ...W, marginTop: 32 }}>

                {/* ── FILTER CHIPS ── */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
                    {Object.entries(TYPE_LABELS).map(([key, label]) => {
                        const active = type === key;
                        const count = key === 'all' ? totalResults : key === 'category' ? filteredCats.length : filteredVids.length;
                        return (
                            <button
                                key={key}
                                onClick={() => setType(key)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 7,
                                    padding: '8px 16px', borderRadius: 50,
                                    border: `2px solid ${active ? TEAL : '#e5e7eb'}`,
                                    background: active ? TEAL : 'white',
                                    color: active ? 'white' : '#374151',
                                    fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                    transition: 'all .15s',
                                }}
                            >
                                <i className={TYPE_ICONS[key]}></i>
                                {label}
                                {fetched && (
                                    <span style={{
                                        background: active ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                                        color: active ? 'white' : '#6b7280',
                                        fontSize: 11, fontWeight: 700,
                                        padding: '1px 7px', borderRadius: 10,
                                    }}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}

                    {/* Result summary */}
                    {query && fetched && (
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', fontSize: 13, color: '#6b7280' }}>
                            <i className="fas fa-search" style={{ marginRight: 6 }}></i>
                            <strong style={{ color: NAVY }}>{totalResults}</strong>&nbsp;resultat{totalResults !== 1 ? 's' : ''} pour &quot;<strong style={{ color: TEAL }}>{query}</strong>&quot;
                        </div>
                    )}
                </div>

                {/* ── LOADING ── */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                        <i className="fas fa-spinner fa-spin" style={{ fontSize: 30, color: TEAL, marginBottom: 14 }}></i>
                        <p style={{ fontSize: 14 }}>Chargement...</p>
                    </div>
                )}

                {/* ── NO RESULTS ── */}
                {!loading && fetched && query && totalResults === 0 && (
                    <div style={{
                        background: 'white', borderRadius: 16, padding: '60px 40px',
                        textAlign: 'center', border: '1px solid #f0f0f0',
                    }}>
                        <i className="fas fa-search" style={{ fontSize: 40, color: '#e5e7eb', marginBottom: 16 }}></i>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: NAVY, marginBottom: 8 }}>Aucun resultat</h3>
                        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
                            Aucun contenu ne correspond a &quot;<strong>{query}</strong>&quot;. Essayez un autre terme.
                        </p>
                        <button
                            onClick={clearSearch}
                            style={{
                                padding: '10px 22px', borderRadius: 10,
                                border: `2px solid ${TEAL}`, background: 'transparent',
                                color: TEAL, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                            }}
                        >
                            Effacer la recherche
                        </button>
                    </div>
                )}

                {/* ── FORMATIONS ── */}
                {!loading && (type === 'all' || type === 'category') && filteredCats.length > 0 && (
                    <div style={{ marginBottom: 40 }}>
                        <h2 style={{ fontSize: 17, fontWeight: 800, color: NAVY, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <i className="fas fa-graduation-cap" style={{ color: TEAL, fontSize: 15 }}></i>
                            Formations
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginLeft: 4 }}>({filteredCats.length})</span>
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                            {filteredCats.map(cat => <CategoryCard key={cat.id} cat={cat} />)}
                        </div>
                    </div>
                )}

                {/* ── VIDEOS ── */}
                {!loading && (type === 'all' || type === 'video') && filteredVids.length > 0 && (
                    <div style={{ marginBottom: 40 }}>
                        <h2 style={{ fontSize: 17, fontWeight: 800, color: NAVY, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <i className="fas fa-play-circle" style={{ color: TEAL, fontSize: 15 }}></i>
                            Videos TP
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginLeft: 4 }}>({filteredVids.length})</span>
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                            {filteredVids.map(v => <VideoCard key={v.id} video={v} />)}
                        </div>
                    </div>
                )}

                {/* ── EMPTY STATE (no query, after fetch) ── */}
                {!loading && fetched && !query && (
                    <div style={{ textAlign: 'center', padding: '60px 40px', color: '#9ca3af' }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: '#e8f8f5',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px', fontSize: 32, color: TEAL,
                        }}>
                            <i className="fas fa-search"></i>
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
                            Commencez votre recherche
                        </h3>
                        <p style={{ fontSize: 14, maxWidth: 380, margin: '0 auto' }}>
                            Tapez un mot-cle pour trouver des formations, videos TP ou ressources.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
