import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import api from '../api';

const W = { maxWidth: 1100, margin: '0 auto', padding: '0 24px' };

function formatDate(str) {
    if (!str) return '';
    const d = new Date(str);
    return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function RelatedCard({ video }) {
    return (
        <Link
            to={`/video/${video.id}`}
            style={{
                display: 'block',
                background: 'white',
                borderRadius: 14,
                overflow: 'hidden',
                textDecoration: 'none',
                border: '1px solid #f0f4f8',
                boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(91,188,180,0.14)'; e.currentTarget.style.borderColor = '#5BBCB4'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#f0f4f8'; }}
        >
            {/* Thumbnail */}
            <div style={{
                height: 130,
                background: 'linear-gradient(135deg, #1B2A4A 0%, #263d6b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
            }}>
                <i className="fas fa-play-circle" style={{ fontSize: 36, color: 'rgba(91,188,180,0.85)' }}></i>
                {video.duration && (
                    <span style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 10,
                        background: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: 4,
                    }}>
                        {video.duration}
                    </span>
                )}
            </div>
            {/* Info */}
            <div style={{ padding: '14px 16px' }}>
                {video.category?.name && (
                    <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#5BBCB4',
                        background: '#e8f8f5',
                        padding: '3px 8px',
                        borderRadius: 4,
                        display: 'inline-block',
                        marginBottom: 8,
                    }}>
                        {video.category.name}
                    </span>
                )}
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1B2A4A', margin: '0 0 6px', lineHeight: 1.4 }}>
                    {video.title}
                </h4>
                <p style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
                    {(video.description || '').substring(0, 70)}{video.description?.length > 70 ? '...' : ''}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                    <span style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="fas fa-eye" style={{ fontSize: 10 }}></i>
                        {video.views_count || 0}
                    </span>
                </div>
            </div>
        </Link>
    );
}

export default function VideoPlayer() {
    const { id } = useParams();
    const videoRef = useRef(null);

    const [video, setVideo] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [videoError, setVideoError] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(null);
        setVideoError(false);

        api.get(`/api/public/videos/${id}`)
            .then(res => {
                const v = res.data.data || res.data;
                setVideo(v);

                // Fetch related videos from same category
                const catId = v.category?.id || v.category_id;
                if (catId) {
                    api.get(`/api/public/categories/${catId}/videos`)
                        .then(r => {
                            const all = r.data.data || r.data || [];
                            setRelated(all.filter(rv => String(rv.id) !== String(id)).slice(0, 4));
                        })
                        .catch(() => {});
                }
            })
            .catch(() => setError('Impossible de charger la video.'))
            .finally(() => setLoading(false));
    }, [id]);

    // Reset video element when id changes
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.load();
        }
    }, [id]);

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh', paddingBottom: 72 }}>

            {/* === TOP NAV STRIP === */}
            <div style={{ background: '#1B2A4A', padding: '14px 0' }}>
                <div style={W}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Link to="/formations" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 12, fontWeight: 500 }}>
                            Formations
                        </Link>
                        {video?.category?.name && (
                            <>
                                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>/</span>
                                <Link
                                    to={`/formations/${video.category?.id || video.category_id}`}
                                    style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 12, fontWeight: 500 }}
                                >
                                    {video.category.name}
                                </Link>
                            </>
                        )}
                        {video?.title && (
                            <>
                                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>/</span>
                                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600 }}>
                                    {video.title.length > 50 ? video.title.substring(0, 50) + '...' : video.title}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ ...W, paddingTop: 36 }}>

                {/* === LOADING === */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            border: '3px solid #e5e7eb',
                            borderTopColor: '#5BBCB4',
                            animation: 'spin 0.8s linear infinite',
                            margin: '0 auto 16px',
                        }} />
                        <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement de la video...</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {/* === ERROR === */}
                {!loading && error && (
                    <div style={{
                        background: '#fff5f5',
                        border: '1px solid #fecaca',
                        borderRadius: 12,
                        padding: '24px 28px',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                    }}>
                        <i className="fas fa-exclamation-circle" style={{ fontSize: 18 }}></i>
                        <span>{error}</span>
                    </div>
                )}

                {/* === MAIN CONTENT === */}
                {!loading && !error && video && (
                    <div>

                        {/* === VIDEO PLAYER CARD === */}
                        <div style={{
                            background: '#0f172a',
                            borderRadius: 20,
                            overflow: 'hidden',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                            marginBottom: 28,
                        }}>
                            {videoError ? (
                                <div style={{
                                    height: 480,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'rgba(255,255,255,0.5)',
                                    gap: 16,
                                }}>
                                    <i className="fas fa-video-slash" style={{ fontSize: 48 }}></i>
                                    <p style={{ fontSize: 15, margin: 0 }}>
                                        La video n'est pas disponible actuellement.
                                    </p>
                                    <p style={{ fontSize: 12, margin: 0, opacity: 0.5 }}>
                                        Fichier : {video.filename}
                                    </p>
                                </div>
                            ) : (
                                <video
                                    ref={videoRef}
                                    controls
                                    style={{
                                        width: '100%',
                                        display: 'block',
                                        maxHeight: 520,
                                        background: '#000',
                                    }}
                                    src={`/storage/${video.filename}`}
                                    onError={() => setVideoError(true)}
                                >
                                    Votre navigateur ne supporte pas la lecture video.
                                </video>
                            )}
                        </div>

                        {/* === VIDEO META === */}
                        <div style={{
                            background: 'white',
                            borderRadius: 16,
                            padding: '28px 32px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                            border: '1px solid #f0f4f8',
                            marginBottom: 36,
                        }}>
                            {/* Category + date row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                                {video.category?.name && (
                                    <Link
                                        to={`/formations/${video.category?.id || video.category_id}`}
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: '#5BBCB4',
                                            background: '#e8f8f5',
                                            padding: '5px 12px',
                                            borderRadius: 6,
                                            textDecoration: 'none',
                                            border: '1px solid #c7ede9',
                                            letterSpacing: 0.3,
                                        }}
                                    >
                                        <i className="fas fa-folder" style={{ marginRight: 6 }}></i>
                                        {video.category.name}
                                    </Link>
                                )}
                                {video.created_at && (
                                    <span style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <i className="fas fa-calendar-alt" style={{ fontSize: 11 }}></i>
                                        {formatDate(video.created_at)}
                                    </span>
                                )}
                                <span style={{
                                    marginLeft: 'auto',
                                    fontSize: 12,
                                    color: '#9ca3af',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5,
                                }}>
                                    <i className="fas fa-eye" style={{ fontSize: 11 }}></i>
                                    {video.views_count || 0} vue{(video.views_count || 0) !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 style={{
                                fontSize: 24,
                                fontWeight: 800,
                                color: '#1B2A4A',
                                lineHeight: 1.3,
                                margin: '0 0 16px',
                            }}>
                                {video.title}
                            </h1>

                            {/* Divider */}
                            <div style={{ height: 1, background: '#f0f4f8', marginBottom: 18 }} />

                            {/* Description */}
                            {video.description ? (
                                <p style={{
                                    fontSize: 15,
                                    color: '#4b5563',
                                    lineHeight: 1.8,
                                    margin: 0,
                                    whiteSpace: 'pre-wrap',
                                }}>
                                    {video.description}
                                </p>
                            ) : (
                                <p style={{ fontSize: 14, color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
                                    Aucune description disponible.
                                </p>
                            )}

                            {/* Action buttons row */}
                            <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
                                {video.category && (
                                    <Link
                                        to={`/formations/${video.category?.id || video.category_id}/videos`}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 7,
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: 'white',
                                            background: 'linear-gradient(135deg, #5BBCB4, #3da89e)',
                                            padding: '10px 20px',
                                            borderRadius: 50,
                                            textDecoration: 'none',
                                            boxShadow: '0 4px 12px rgba(91,188,180,0.3)',
                                        }}
                                    >
                                        <i className="fas fa-th-list"></i>
                                        Toutes les videos
                                    </Link>
                                )}
                                {video.category && (
                                    <Link
                                        to={`/formations/${video.category?.id || video.category_id}/roadmap`}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 7,
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: '#1B2A4A',
                                            background: 'white',
                                            border: '1.5px solid #e5e7eb',
                                            padding: '10px 20px',
                                            borderRadius: 50,
                                            textDecoration: 'none',
                                        }}
                                    >
                                        <i className="fas fa-route"></i>
                                        Voir le parcours
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* === RELATED VIDEOS === */}
                        {related.length > 0 && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1B2A4A', margin: 0 }}>
                                        <i className="fas fa-film" style={{ color: '#5BBCB4', marginRight: 10 }}></i>
                                        Videos similaires
                                    </h2>
                                    {video.category && (
                                        <Link
                                            to={`/formations/${video.category?.id || video.category_id}/videos`}
                                            style={{ color: '#5BBCB4', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
                                        >
                                            Voir tout &rarr;
                                        </Link>
                                    )}
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                    gap: 18,
                                }}>
                                    {related.map(rv => (
                                        <RelatedCard key={rv.id} video={rv} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
