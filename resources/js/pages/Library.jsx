import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

const TABS = [
    { key: 'documents', label: 'Cours PDF', icon: 'fas fa-file-pdf' },
    { key: 'videos', label: 'Cours Videos', icon: 'fas fa-play-circle' },
    { key: 'exams', label: 'Epreuves', icon: 'fas fa-file-alt' },
];

const GRADIENTS = [
    'linear-gradient(135deg, #5BBCB4 0%, #1B2A4A 100%)',
    'linear-gradient(135deg, #F5A623 0%, #E07B00 100%)',
    'linear-gradient(135deg, #8B5CF6 0%, #5B21B6 100%)',
    'linear-gradient(135deg, #E74C3C 0%, #9B1C1C 100%)',
    'linear-gradient(135deg, #10B981 0%, #065F46 100%)',
    'linear-gradient(135deg, #3B82F6 0%, #1E3A8A 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #92400E 100%)',
    'linear-gradient(135deg, #EC4899 0%, #831843 100%)',
    'linear-gradient(135deg, #14B8A6 0%, #134E4A 100%)',
    'linear-gradient(135deg, #6366F1 0%, #312E81 100%)',
];

const ACCENT_COLORS = [
    TEAL, '#F5A623', '#8B5CF6', '#E74C3C', '#10B981',
    '#3B82F6', '#F59E0B', '#EC4899', '#14B8A6', '#6366F1',
];

// ── Video Player Modal ──
function VideoModal({ video, onClose }) {
    if (!video) return null;
    return (
        <div
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
        >
            <div style={{
                background: '#111', borderRadius: 16, width: '100%', maxWidth: 900,
                boxShadow: '0 24px 60px rgba(0,0,0,0.4)', overflow: 'hidden',
            }}>
                <div style={{
                    padding: '14px 20px', background: NAVY,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <i className="fas fa-play-circle" style={{ color: TEAL, fontSize: 18 }}></i>
                        <h3 style={{
                            fontSize: 14, fontWeight: 700, color: 'white', margin: 0,
                            textTransform: 'capitalize',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                            {video.intitule || video.title || 'Video'}
                        </h3>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
                        width: 34, height: 34, cursor: 'pointer', fontSize: 14, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginLeft: 12,
                    }}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                    <iframe
                        src={video.lien}
                        style={{
                            position: 'absolute', top: 0, left: 0,
                            width: '100%', height: '100%', border: 'none',
                        }}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                    />
                </div>
            </div>
        </div>
    );
}

// ── PDF Viewer Modal ──
function PdfModal({ doc, onClose }) {
    if (!doc) return null;
    return (
        <div
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
        >
            <div style={{
                background: 'white', borderRadius: 16, width: '100%', maxWidth: 800,
                maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 24px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
            }}>
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid #e5e7eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <i className="fas fa-file-pdf" style={{ color: '#ef4444', fontSize: 18 }}></i>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, margin: 0 }}>{doc.title}</h3>
                    </div>
                    <button onClick={onClose} style={{
                        background: '#f3f4f6', border: 'none', borderRadius: 8,
                        width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: '#6b7280',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                    {doc.content ? (
                        <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                            {doc.content}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
                            <i className="fas fa-file-pdf" style={{ fontSize: 48, marginBottom: 16, color: '#e5e7eb' }}></i>
                            <p>Contenu non disponible en lecture.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Video Card for InsamTechs videos ──
function ITVideoCard({ video, idx, onPlay }) {
    const [hovered, setHovered] = useState(false);
    const gradient = GRADIENTS[(idx + 2) % GRADIENTS.length];
    const accentColor = ACCENT_COLORS[(idx + 2) % ACCENT_COLORS.length];

    return (
        <div
            onClick={() => onPlay(video)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: 'white', borderRadius: 12, border: '1px solid #e8e8e8',
                overflow: 'hidden', cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                transition: 'all .22s ease',
            }}
        >
            <div style={{
                height: 120, background: gradient, position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%)',
                }}></div>
                <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform .22s',
                    transform: hovered ? 'scale(1.12)' : 'scale(1)',
                }}>
                    <i className="fas fa-play" style={{ color: 'white', fontSize: 16, marginLeft: 2 }}></i>
                </div>
                <div style={{ position: 'absolute', top: 8, left: 8 }}>
                    <span style={{
                        background: accentColor, color: 'white',
                        fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 50,
                    }}>Video</span>
                </div>
            </div>
            <div style={{ padding: '12px 14px 0' }}>
                <h4 style={{
                    fontSize: 14, fontWeight: 700, color: NAVY, margin: '0 0 6px', lineHeight: 1.35,
                    textTransform: 'capitalize',
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                    {video.intitule}
                </h4>
            </div>
            <div style={{ height: 1, background: '#f3f4f6', margin: '8px 14px 0' }}></div>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 14px 12px', marginTop: 'auto',
            }}>
                <span style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className="fas fa-play-circle" style={{ color: accentColor, fontSize: 10 }}></i>
                    Lire la video
                </span>
            </div>
        </div>
    );
}

// ── Chapitre Card (standalone, for grid display) ──
function ChapitreGridCard({ chapitre, idx, onClick }) {
    const [hovered, setHovered] = useState(false);
    const gradient = GRADIENTS[idx % GRADIENTS.length];
    const accentColor = ACCENT_COLORS[idx % ACCENT_COLORS.length];
    const videoCount = chapitre.videos?.length || 0;

    return (
        <div
            onClick={() => onClick(chapitre, idx)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: 'white', borderRadius: 12, border: '1px solid #e8e8e8',
                overflow: 'hidden', cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                transition: 'all .22s ease',
            }}
        >
            <div style={{
                height: 130, background: gradient, position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%)',
                }}></div>
                <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, color: 'white', fontWeight: 800,
                    transition: 'transform .22s',
                    transform: hovered ? 'scale(1.1)' : 'scale(1)',
                }}>
                    {idx + 1}
                </div>
                <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                    <span style={{
                        background: accentColor, color: 'white',
                        fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 50,
                    }}>Chapitre</span>
                    {videoCount > 0 && (
                        <span style={{
                            background: 'rgba(255,255,255,0.92)', color: NAVY,
                            fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 50,
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                            <i className="fas fa-play-circle" style={{ color: accentColor, fontSize: 9 }}></i>
                            {videoCount}
                        </span>
                    )}
                </div>
            </div>
            <div style={{ padding: '14px 16px 0' }}>
                <h3 style={{
                    fontSize: 15, fontWeight: 700, color: NAVY,
                    margin: '0 0 6px', lineHeight: 1.35, textTransform: 'capitalize',
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                    {chapitre.intitule}
                </h3>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 14px', minHeight: 20 }}>
                    {videoCount} video{videoCount > 1 ? 's' : ''} disponible{videoCount > 1 ? 's' : ''}
                </p>
            </div>
            <div style={{ height: 1, background: '#f3f4f6', margin: '0 16px' }}></div>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 16px 14px', marginTop: 'auto',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: gradient,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: 'white', fontWeight: 800, flexShrink: 0,
                    }}>
                        {idx + 1}
                    </div>
                    <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Chapitre {idx + 1}</span>
                </div>
                <span style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className="fas fa-video" style={{ fontSize: 10, color: accentColor }}></i>
                    {videoCount} vid.
                </span>
            </div>
        </div>
    );
}

// ── Breadcrumb navigation for formation detail ──
function DetailBreadcrumb({ formationName, chapitreName, onBackToFormations, onBackToChapitres }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
            fontSize: 13, color: '#9ca3af', flexWrap: 'wrap',
        }}>
            <button onClick={onBackToFormations} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: TEAL, fontWeight: 600, fontSize: 13, padding: 0,
                display: 'flex', alignItems: 'center', gap: 5,
            }}>
                <i className="fas fa-arrow-left" style={{ fontSize: 11 }}></i>
                Formations
            </button>
            <i className="fas fa-chevron-right" style={{ fontSize: 9, color: '#d1d5db' }}></i>
            {chapitreName ? (
                <>
                    <button onClick={onBackToChapitres} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: TEAL, fontWeight: 600, fontSize: 13, padding: 0,
                    }}>
                        {formationName}
                    </button>
                    <i className="fas fa-chevron-right" style={{ fontSize: 9, color: '#d1d5db' }}></i>
                    <span style={{ color: NAVY, fontWeight: 600, textTransform: 'capitalize' }}>{chapitreName}</span>
                </>
            ) : (
                <span style={{ color: NAVY, fontWeight: 600, textTransform: 'capitalize' }}>{formationName}</span>
            )}
        </div>
    );
}

// ── Formation Detail Panel: 3-level card navigation ──
function FormationDetail({ formation, formationIdx, accentColor, onPlayVideo, onClose }) {
    const [selectedChapitre, setSelectedChapitre] = useState(null);
    const [selectedChapitreIdx, setSelectedChapitreIdx] = useState(0);
    const totalVideos = (formation.chapitres || []).reduce((t, ch) => t + (ch.videos?.length || 0), 0);

    const handleChapitreClick = (ch, idx) => {
        setSelectedChapitre(ch);
        setSelectedChapitreIdx(idx);
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    // Level 3: Videos of a chapitre
    if (selectedChapitre) {
        const chapAccent = ACCENT_COLORS[selectedChapitreIdx % ACCENT_COLORS.length];
        const chapGradient = GRADIENTS[selectedChapitreIdx % GRADIENTS.length];
        return (
            <div style={{ marginBottom: 32 }}>
                <DetailBreadcrumb
                    formationName={formation.intitule}
                    chapitreName={selectedChapitre.intitule}
                    onBackToFormations={onClose}
                    onBackToChapitres={() => setSelectedChapitre(null)}
                />
                {/* Chapitre header */}
                <div style={{
                    background: chapGradient, borderRadius: 16, padding: '24px 28px', marginBottom: 24,
                    display: 'flex', alignItems: 'center', gap: 16,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                    }}></div>
                    <div style={{
                        width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                        background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, color: 'white', fontWeight: 800,
                        position: 'relative', zIndex: 1,
                    }}>
                        {selectedChapitreIdx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
                        <h3 style={{
                            fontSize: 20, fontWeight: 800, color: 'white', margin: 0,
                            textTransform: 'capitalize', lineHeight: 1.3,
                        }}>
                            {selectedChapitre.intitule}
                        </h3>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: '6px 0 0' }}>
                            <i className="fas fa-play" style={{ marginRight: 4 }}></i>
                            {selectedChapitre.videos?.length || 0} videos disponibles
                        </p>
                    </div>
                    <button onClick={() => setSelectedChapitre(null)} style={{
                        background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10,
                        width: 38, height: 38, cursor: 'pointer', fontSize: 15, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, position: 'relative', zIndex: 1,
                    }}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                </div>
                {/* Videos grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 20,
                }}>
                    {selectedChapitre.videos?.map((vid, vi) => (
                        <ITVideoCard key={vi} video={vid} idx={vi + selectedChapitreIdx} onPlay={onPlayVideo} />
                    ))}
                </div>
            </div>
        );
    }

    // Level 2: Chapitres of the formation
    return (
        <div style={{ marginBottom: 32 }}>
            <DetailBreadcrumb
                formationName={formation.intitule}
                chapitreName={null}
                onBackToFormations={onClose}
                onBackToChapitres={() => {}}
            />
            {/* Formation header */}
            <div style={{
                background: `linear-gradient(135deg, ${NAVY}, #243758)`,
                borderRadius: 16, padding: '24px 28px', marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 16,
                boxShadow: '0 8px 32px rgba(27,42,74,0.3)',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(circle at 80% 20%, rgba(91,188,180,0.15) 0%, transparent 50%)',
                }}></div>
                {formation.img ? (
                    <img src={formation.img} alt="" style={{
                        width: 64, height: 64, borderRadius: 14, objectFit: 'cover', flexShrink: 0,
                        border: '2px solid rgba(255,255,255,0.2)', position: 'relative', zIndex: 1,
                    }} onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                    <div style={{
                        width: 64, height: 64, borderRadius: 14, flexShrink: 0,
                        background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, color: TEAL, position: 'relative', zIndex: 1,
                    }}>
                        <i className="fas fa-book-open"></i>
                    </div>
                )}
                <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
                    <h3 style={{
                        fontSize: 20, fontWeight: 800, color: 'white', margin: 0,
                        textTransform: 'capitalize', lineHeight: 1.3,
                    }}>
                        {formation.intitule}
                    </h3>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <i className="fas fa-folder"></i> {formation.chapitres?.length || 0} chapitres
                        </span>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <i className="fas fa-play"></i> {totalVideos} videos
                        </span>
                    </div>
                </div>
                <button onClick={onClose} style={{
                    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10,
                    width: 38, height: 38, cursor: 'pointer', fontSize: 15, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, position: 'relative', zIndex: 1,
                }}>
                    <i className="fas fa-arrow-left"></i>
                </button>
            </div>
            {/* Chapitres grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 20,
            }}>
                {formation.chapitres?.map((ch, ci) => (
                    <ChapitreGridCard
                        key={ci}
                        chapitre={ch}
                        idx={ci}
                        onClick={handleChapitreClick}
                    />
                ))}
            </div>
        </div>
    );
}

// ── Formation Card (TOTC gradient style) ──
function FormationCard({ formation, idx, onClick }) {
    const [hovered, setHovered] = useState(false);
    const gradient = GRADIENTS[idx % GRADIENTS.length];
    const accentColor = ACCENT_COLORS[idx % ACCENT_COLORS.length];
    const totalVideos = (formation.chapitres || []).reduce((t, ch) => t + (ch.videos?.length || 0), 0);
    const totalChapitres = formation.chapitres?.length || 0;

    return (
        <div
            onClick={() => onClick(formation, idx)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: 'white',
                borderRadius: 12,
                border: '1px solid #e8e8e8',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: hovered
                    ? '0 12px 32px rgba(0,0,0,0.12)'
                    : '0 2px 8px rgba(0,0,0,0.04)',
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                transition: 'all .22s ease',
                cursor: 'pointer',
            }}
        >
            {/* Thumbnail area */}
            <div style={{
                height: 150,
                background: gradient,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}>
                {/* Background pattern */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%)',
                }}></div>

                {/* Formation image overlay or icon */}
                {formation.img ? (
                    <>
                        <img src={formation.img} alt="" style={{
                            position: 'absolute', inset: 0, width: '100%', height: '100%',
                            objectFit: 'cover', opacity: 0.3,
                        }} onError={e => { e.target.style.display = 'none'; }} />
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: 'rgba(255,255,255,0.18)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 22, color: 'white',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            transition: 'transform .22s',
                            transform: hovered ? 'scale(1.1)' : 'scale(1)',
                            position: 'relative', zIndex: 1,
                        }}>
                            <i className="fas fa-play"></i>
                        </div>
                    </>
                ) : (
                    <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        background: 'rgba(255,255,255,0.18)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, color: 'white',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        transition: 'transform .22s',
                        transform: hovered ? 'scale(1.1)' : 'scale(1)',
                    }}>
                        <i className="fas fa-book-open"></i>
                    </div>
                )}

                {/* Top-left tags */}
                <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                    <span style={{
                        background: accentColor, color: 'white',
                        fontSize: 10, fontWeight: 700,
                        padding: '3px 9px', borderRadius: 50,
                        letterSpacing: 0.3,
                    }}>
                        Formation
                    </span>
                    {totalVideos > 0 && (
                        <span style={{
                            background: 'rgba(255,255,255,0.92)', color: NAVY,
                            fontSize: 10, fontWeight: 700,
                            padding: '3px 9px', borderRadius: 50,
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                            <i className="fas fa-play-circle" style={{ color: accentColor, fontSize: 9 }}></i>
                            {totalVideos}
                        </span>
                    )}
                </div>
            </div>

            {/* Card body */}
            <div style={{ padding: '14px 16px 0' }}>
                <h3 style={{
                    fontSize: 15, fontWeight: 700, color: NAVY,
                    margin: '0 0 6px', lineHeight: 1.35,
                    textTransform: 'capitalize',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                }}>
                    {formation.intitule}
                </h3>
                <p style={{
                    fontSize: 13, color: '#6b7280', lineHeight: 1.6,
                    margin: '0 0 14px',
                    minHeight: 40,
                }}>
                    {totalChapitres} chapitre{totalChapitres > 1 ? 's' : ''} &middot; {totalVideos} video{totalVideos > 1 ? 's' : ''} disponible{totalVideos > 1 ? 's' : ''}
                </p>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#f3f4f6', margin: '0 16px' }}></div>

            {/* Bottom row */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 16px 14px',
                marginTop: 'auto',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${TEAL}, ${NAVY})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: 'white', fontWeight: 800, flexShrink: 0,
                    }}>
                        IT
                    </div>
                    <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>INSAMTECHS</span>
                </div>
                <span style={{
                    fontSize: 12, color: '#9ca3af',
                    display: 'flex', alignItems: 'center', gap: 4,
                }}>
                    <i className="fas fa-folder" style={{ fontSize: 10, color: accentColor }}></i>
                    {totalChapitres} chap.
                </span>
            </div>
        </div>
    );
}

// ── Document Card ──
function DocCard({ doc, onRead }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: 'white', borderRadius: 14, border: `1.5px solid ${hovered ? TEAL : '#f0f0f0'}`,
                padding: '20px', display: 'flex', flexDirection: 'column', gap: 10,
                transition: 'all .2s', transform: hovered ? 'translateY(-2px)' : 'none',
                boxShadow: hovered ? '0 8px 24px rgba(91,188,180,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 10, background: '#fef2f2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, color: '#ef4444', flexShrink: 0,
                }}>
                    <i className="fas fa-file-pdf"></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.4 }}>{doc.title}</h3>
                    {doc.category?.name && (
                        <span style={{ fontSize: 11, color: TEAL, fontWeight: 600 }}>{doc.category.name}</span>
                    )}
                </div>
            </div>
            <button
                onClick={() => onRead(doc)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    marginTop: 'auto', background: hovered ? TEAL : 'transparent',
                    color: hovered ? 'white' : TEAL, border: `2px solid ${TEAL}`,
                    borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
                }}
            >
                <i className="fas fa-book-open"></i> Lire
            </button>
        </div>
    );
}

// ── Video Card (local) ──
function VideoCard({ video }) {
    const [hovered, setHovered] = useState(false);
    return (
        <Link
            to={`/video/${video.id}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: 'white', borderRadius: 14, border: `1.5px solid ${hovered ? TEAL : '#f0f0f0'}`,
                overflow: 'hidden', textDecoration: 'none',
                transition: 'all .2s', transform: hovered ? 'translateY(-2px)' : 'none',
                boxShadow: hovered ? '0 8px 24px rgba(91,188,180,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
            }}
        >
            <div style={{
                height: 120, background: 'linear-gradient(135deg, #5BBCB430 0%, #1B2A4A20 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, color: TEAL,
            }}>
                <i className="fas fa-play-circle"></i>
            </div>
            <div style={{ padding: '14px 16px' }}>
                {video.category?.name && (
                    <span style={{
                        fontSize: 10, background: '#e8f8f5', color: TEAL,
                        padding: '3px 8px', borderRadius: 4, fontWeight: 700,
                        display: 'inline-block', marginBottom: 8,
                    }}>
                        {video.category.name}
                    </span>
                )}
                <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.4 }}>
                    {video.title}
                </h3>
            </div>
        </Link>
    );
}

// ── Exam Card (gradient style) ──
function ExamCard({ exam, idx, onDownload, onCorrection }) {
    const [hovered, setHovered] = useState(false);
    const gradient = GRADIENTS[(idx + 3) % GRADIENTS.length];
    const accentColor = ACCENT_COLORS[(idx + 3) % ACCENT_COLORS.length];

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: 'white', borderRadius: 12, border: '1px solid #e8e8e8',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                transition: 'all .22s ease',
            }}
        >
            <div style={{
                height: 120, background: gradient, position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%)',
                }}></div>
                <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: 'white',
                    transition: 'transform .22s',
                    transform: hovered ? 'scale(1.1)' : 'scale(1)',
                }}>
                    <i className="fas fa-file-alt"></i>
                </div>
                <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                    {exam.annee && (
                        <span style={{
                            background: accentColor, color: 'white',
                            fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 50,
                        }}>{exam.annee}</span>
                    )}
                    {exam.niveau && (
                        <span style={{
                            background: 'rgba(255,255,255,0.92)', color: NAVY,
                            fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 50,
                        }}>{exam.niveau}</span>
                    )}
                </div>
                {exam.is_corrected && (
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                        <span style={{
                            background: '#10B981', color: 'white',
                            fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 50,
                            display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                            <i className="fas fa-check" style={{ fontSize: 8 }}></i> Corrige
                        </span>
                    </div>
                )}
            </div>
            <div style={{ padding: '14px 16px 0' }}>
                <h3 style={{
                    fontSize: 15, fontWeight: 700, color: NAVY,
                    margin: '0 0 6px', lineHeight: 1.35,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                    {exam.title}
                </h3>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 10px' }}>
                    {exam.matiere || exam.category?.name || 'Epreuve'}
                </p>
            </div>
            <div style={{ height: 1, background: '#f3f4f6', margin: '0 16px' }}></div>
            <div style={{
                display: 'flex', gap: 6, padding: '10px 16px 14px', marginTop: 'auto', flexWrap: 'wrap',
            }}>
                <button onClick={() => onDownload(exam)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    background: 'transparent', color: accentColor, border: `1.5px solid ${accentColor}`,
                    borderRadius: 8, padding: '8px 8px', fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                    minWidth: 70,
                }}>
                    <i className="fas fa-download" style={{ fontSize: 10 }}></i> PDF
                </button>
                <button onClick={() => onCorrection(exam)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    background: hovered ? accentColor : 'transparent',
                    color: hovered ? 'white' : accentColor,
                    border: `1.5px solid ${accentColor}`,
                    borderRadius: 8, padding: '8px 8px', fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                    minWidth: 70,
                }}>
                    <i className="fas fa-robot" style={{ fontSize: 10 }}></i> Corrige IA
                </button>
            </div>
        </div>
    );
}

// ── Matiere Card (for grouping exams) ──
function MatiereCard({ matiere, exams, idx, onClick }) {
    const [hovered, setHovered] = useState(false);
    const gradient = GRADIENTS[idx % GRADIENTS.length];
    const accentColor = ACCENT_COLORS[idx % ACCENT_COLORS.length];

    return (
        <div
            onClick={() => onClick(matiere)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: 'white', borderRadius: 12, border: '1px solid #e8e8e8',
                overflow: 'hidden', cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                transition: 'all .22s ease',
            }}
        >
            <div style={{
                height: 130, background: gradient, position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%)',
                }}></div>
                <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: 'white',
                    transition: 'transform .22s',
                    transform: hovered ? 'scale(1.1)' : 'scale(1)',
                }}>
                    <i className="fas fa-file-alt"></i>
                </div>
                <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                    <span style={{
                        background: accentColor, color: 'white',
                        fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 50,
                    }}>Matiere</span>
                    <span style={{
                        background: 'rgba(255,255,255,0.92)', color: NAVY,
                        fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 50,
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                        <i className="fas fa-file-alt" style={{ color: accentColor, fontSize: 9 }}></i>
                        {exams.length}
                    </span>
                </div>
            </div>
            <div style={{ padding: '14px 16px 0' }}>
                <h3 style={{
                    fontSize: 15, fontWeight: 700, color: NAVY,
                    margin: '0 0 6px', lineHeight: 1.35, textTransform: 'capitalize',
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                    {matiere}
                </h3>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 14px' }}>
                    {exams.length} epreuve{exams.length > 1 ? 's' : ''} disponible{exams.length > 1 ? 's' : ''}
                </p>
            </div>
            <div style={{ height: 1, background: '#f3f4f6', margin: '0 16px' }}></div>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 16px 14px', marginTop: 'auto',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${TEAL}, ${NAVY})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: 'white', fontWeight: 800, flexShrink: 0,
                    }}>
                        IA
                    </div>
                    <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>INSAM-IA</span>
                </div>
                <span style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className="fas fa-file-alt" style={{ fontSize: 10, color: accentColor }}></i>
                    {exams.length} sujets
                </span>
            </div>
        </div>
    );
}

// ── Upload Exam Modal ──
function UploadExamModal({ categories, onClose, onUploaded }) {
    const [form, setForm] = useState({ title: '', matiere: '', filiere: '', niveau: '', annee: '', category_id: '' });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const niveaux = ['L1', 'L2', 'L3', 'M1', 'M2', 'BTS1', 'BTS2'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return alert('Selectionnez un fichier.');
        setUploading(true);
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
        fd.append('file', file);
        try {
            await api.post('/api/exams/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            onUploaded();
            onClose();
        } catch {
            alert('Erreur lors de l\'upload.');
        } finally {
            setUploading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb',
        fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    };

    return (
        <div
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
        >
            <div style={{
                background: 'white', borderRadius: 16, width: '100%', maxWidth: 520,
                boxShadow: '0 24px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
            }}>
                <div style={{
                    padding: '18px 24px', background: NAVY,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: 0 }}>
                        <i className="fas fa-upload" style={{ marginRight: 8, color: TEAL }}></i>
                        Soumettre une epreuve
                    </h3>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
                        width: 32, height: 32, cursor: 'pointer', color: 'white', fontSize: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <input placeholder="Titre de l'epreuve *" required value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} />
                    <input placeholder="Matiere *" required value={form.matiere}
                        onChange={e => setForm({ ...form, matiere: e.target.value })} style={inputStyle} />
                    <div style={{ display: 'flex', gap: 10 }}>
                        <select value={form.filiere} onChange={e => setForm({ ...form, filiere: e.target.value })}
                            required style={{ ...inputStyle, color: form.filiere ? NAVY : '#9ca3af' }}>
                            <option value="">Filiere *</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <select value={form.niveau} onChange={e => setForm({ ...form, niveau: e.target.value })}
                            required style={{ ...inputStyle, color: form.niveau ? NAVY : '#9ca3af' }}>
                            <option value="">Niveau *</option>
                            {niveaux.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input placeholder="Annee (ex: 2024) *" required value={form.annee}
                            onChange={e => setForm({ ...form, annee: e.target.value })} style={inputStyle} />
                        <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                            style={{ ...inputStyle, color: form.category_id ? NAVY : '#9ca3af' }}>
                            <option value="">Categorie</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div style={{
                        border: '2px dashed #d1d5db', borderRadius: 12, padding: 20,
                        textAlign: 'center', cursor: 'pointer', background: '#f9fafb',
                    }} onClick={() => document.getElementById('exam-file-input').click()}>
                        <i className="fas fa-cloud-upload-alt" style={{ fontSize: 28, color: TEAL, marginBottom: 8 }}></i>
                        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                            {file ? file.name : 'Cliquez pour selectionner un fichier PDF'}
                        </p>
                        <input id="exam-file-input" type="file" accept=".pdf,.doc,.docx" hidden
                            onChange={e => setFile(e.target.files[0])} />
                    </div>
                    <button type="submit" disabled={uploading} style={{
                        background: TEAL, color: 'white', border: 'none', borderRadius: 10,
                        padding: '13px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'inherit', opacity: uploading ? 0.6 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                        {uploading ? <><i className="fas fa-spinner fa-spin"></i> Envoi...</> : <><i className="fas fa-upload"></i> Soumettre</>}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ── AI Correction Modal ──
function CorrectionModal({ exam, onClose }) {
    const [correction, setCorrection] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/api/exams/${exam.id}/ai-correction`)
            .then(r => setCorrection(r.data?.correction || 'Erreur lors de la generation.'))
            .catch(() => setCorrection('Erreur: impossible de generer le corrige. Verifiez votre connexion.'))
            .finally(() => setLoading(false));
    }, [exam.id]);

    return (
        <div
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
        >
            <div style={{
                background: 'white', borderRadius: 16, width: '100%', maxWidth: 800,
                maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 24px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
            }}>
                <div style={{
                    padding: '18px 24px', background: NAVY,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <i className="fas fa-robot" style={{ color: TEAL, fontSize: 18 }}></i>
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Corrige IA - {exam.title}
                            </h3>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                                {exam.matiere} {exam.annee ? `- ${exam.annee}` : ''}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
                        width: 34, height: 34, cursor: 'pointer', color: 'white', fontSize: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                            <i className="fas fa-spinner fa-spin" style={{ fontSize: 32, color: TEAL, marginBottom: 16 }}></i>
                            <p style={{ fontSize: 15, fontWeight: 600, color: NAVY }}>L'IA genere le corrige...</p>
                            <p style={{ fontSize: 13 }}>Cela peut prendre quelques secondes.</p>
                        </div>
                    ) : (
                        <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                            {correction}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main Page ──
export default function Library() {
    const [activeTab, setActiveTab] = useState('documents');
    const [documents, setDocuments] = useState([]);
    const [videos, setVideos] = useState([]);
    const [exams, setExams] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formations, setFormations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [readingDoc, setReadingDoc] = useState(null);
    const [playingVideo, setPlayingVideo] = useState(null);
    const [selectedFormation, setSelectedFormation] = useState(null);
    const [selectedFormationIdx, setSelectedFormationIdx] = useState(0);
    const [selectedMatiere, setSelectedMatiere] = useState(null);
    const [showUploadExam, setShowUploadExam] = useState(false);
    const [correctingExam, setCorrectingExam] = useState(null);

    useEffect(() => {
        api.get('/api/public/categories')
            .then(r => setCategories(r.data?.data || []))
            .catch(() => {});
        api.get('/api/my-formations')
            .then(r => setFormations(r.data?.formations || []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search.trim()) params.append('search', search.trim());
        if (categoryFilter) params.append('category_id', categoryFilter);
        const qs = params.toString() ? `?${params.toString()}` : '';

        if (activeTab === 'documents') {
            api.get(`/api/public/documents${qs}`)
                .then(r => setDocuments(r.data?.data || []))
                .catch(() => setDocuments([]))
                .finally(() => setLoading(false));
        } else if (activeTab === 'videos') {
            api.get(`/api/public/videos${qs}`)
                .then(r => setVideos(r.data?.data || []))
                .catch(() => setVideos([]))
                .finally(() => setLoading(false));
        } else {
            api.get(`/api/exams${qs}`)
                .then(r => setExams(r.data?.exams || r.data?.data || []))
                .catch(() => setExams([]))
                .finally(() => setLoading(false));
        }
    }, [activeTab, search, categoryFilter]);

    const handleDownload = async (exam) => {
        try {
            const response = await api.get(`/api/exams/${exam.id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `${exam.title}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            alert('Erreur lors du telechargement.');
        }
    };

    const handleFormationClick = (formation, idx) => {
        setSelectedFormation(formation);
        setSelectedFormationIdx(idx);
        // Scroll to top of detail
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    // Filter formations by search
    const filteredFormations = search.trim()
        ? formations.filter(f =>
            f.intitule?.toLowerCase().includes(search.toLowerCase()) ||
            f.chapitres?.some(ch =>
                ch.intitule?.toLowerCase().includes(search.toLowerCase()) ||
                ch.videos?.some(v => v.intitule?.toLowerCase().includes(search.toLowerCase()))
            )
        )
        : formations;

    const insamtechsVideoCount = filteredFormations.reduce((total, f) =>
        total + (f.chapitres || []).reduce((ct, ch) => ct + (ch.videos?.length || 0), 0), 0);
    const currentItems = activeTab === 'documents' ? documents : activeTab === 'videos' ? videos : exams;
    const displayCount = activeTab === 'videos' ? videos.length + insamtechsVideoCount : currentItems.length;
    const hasContent = activeTab === 'videos' ? (videos.length + insamtechsVideoCount) > 0 : activeTab === 'exams' ? true : currentItems.length > 0;

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh', paddingBottom: 60 }}>

            {/* HERO */}
            <section style={{
                background: 'linear-gradient(135deg, #1B2A4A 0%, #243758 60%, #2d4470 100%)',
                padding: '48px 0 52px',
            }}>
                <div style={W}>
                    <span style={{ color: TEAL, fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>BIBLIOTHEQUE</span>
                    <h1 style={{ fontSize: 34, fontWeight: 800, color: 'white', margin: '10px 0 8px', lineHeight: 1.2 }}>
                        Votre <span style={{ color: TEAL }}>Bibliotheque</span> Academique
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, maxWidth: 520, marginBottom: 28 }}>
                        Accedez a tous vos cours PDF, videos TP et epreuves en un seul endroit.
                    </p>

                    {/* Search */}
                    <div style={{ display: 'flex', gap: 12, maxWidth: 600, flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: '1 1 280px' }}>
                            <i className="fas fa-search" style={{
                                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                                color: '#9ca3af', fontSize: 15,
                            }}></i>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Rechercher une formation, un chapitre, une video..."
                                style={{
                                    width: '100%', padding: '13px 16px 13px 44px',
                                    borderRadius: 12, border: 'none', fontSize: 14,
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                                    outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            style={{
                                padding: '13px 16px', borderRadius: 12, border: 'none',
                                fontSize: 14, background: 'white', cursor: 'pointer',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                                color: categoryFilter ? NAVY : '#9ca3af', fontWeight: categoryFilter ? 600 : 400,
                            }}
                        >
                            <option value="">Toutes les categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
            </section>

            <div style={{ ...W, marginTop: -20 }}>
                {/* TABS */}
                <div style={{
                    background: 'white', borderRadius: 14, display: 'inline-flex',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 28,
                }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setSelectedFormation(null); setSelectedMatiere(null); }}
                            style={{
                                padding: '14px 28px', border: 'none', cursor: 'pointer',
                                fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: activeTab === tab.key ? TEAL : 'white',
                                color: activeTab === tab.key ? 'white' : '#6b7280',
                                transition: 'all .2s',
                            }}
                        >
                            <i className={tab.icon}></i>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Stats bar */}
                <div style={{
                    display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center',
                    flexWrap: 'wrap',
                }}>
                    <div style={{
                        background: 'white', borderRadius: 12, padding: '12px 20px',
                        border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10, background: '#e8f8f5',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: TEAL, fontSize: 16,
                        }}>
                            <i className={TABS.find(t => t.key === activeTab)?.icon}></i>
                        </div>
                        <div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: NAVY }}>{displayCount}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>{TABS.find(t => t.key === activeTab)?.label}</div>
                        </div>
                    </div>
                    {activeTab === 'videos' && filteredFormations.length > 0 && (
                        <div style={{
                            background: 'white', borderRadius: 12, padding: '12px 20px',
                            border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10, background: '#f0f4ff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: NAVY, fontSize: 16,
                            }}>
                                <i className="fas fa-book-open"></i>
                            </div>
                            <div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: NAVY }}>{filteredFormations.length}</div>
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>Formations InsamTechs</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} style={{
                                background: 'white', borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden',
                            }}>
                                <div style={{ height: 150, background: '#f3f4f6' }}></div>
                                <div style={{ padding: '14px 16px 16px' }}>
                                    <div style={{ height: 14, background: '#f3f4f6', borderRadius: 4, marginBottom: 8, width: '75%' }}></div>
                                    <div style={{ height: 11, background: '#f9fafb', borderRadius: 4 }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !hasContent ? (
                    <div style={{ background: 'white', borderRadius: 16, padding: 60, textAlign: 'center', color: '#9ca3af', border: '1px solid #f0f0f0' }}>
                        <i className="fas fa-folder-open" style={{ fontSize: 36, marginBottom: 14, color: '#e5e7eb' }}></i>
                        <p style={{ fontSize: 15, fontWeight: 600, color: NAVY }}>Aucun contenu trouve</p>
                        <p style={{ fontSize: 13, marginTop: 6 }}>
                            {search || categoryFilter ? 'Essayez de modifier vos criteres.' : 'Aucun contenu disponible pour le moment.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* PDF grid */}
                        {activeTab === 'documents' && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: 18,
                            }}>
                                {documents.map(doc => (
                                    <DocCard key={doc.id} doc={doc} onRead={setReadingDoc} />
                                ))}
                            </div>
                        )}

                        {/* Exams tab - grouped by matiere */}
                        {activeTab === 'exams' && (() => {
                            // Group exams by matiere
                            const grouped = {};
                            exams.forEach(ex => {
                                const key = ex.matiere || ex.category?.name || 'Autres';
                                if (!grouped[key]) grouped[key] = [];
                                grouped[key].push(ex);
                            });
                            const matieres = Object.keys(grouped);

                            return (
                                <>
                                    {/* Upload + back button */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        marginBottom: 20,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            {selectedMatiere && (
                                                <button onClick={() => setSelectedMatiere(null)} style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: TEAL, fontWeight: 600, fontSize: 13, padding: 0,
                                                    display: 'flex', alignItems: 'center', gap: 5,
                                                }}>
                                                    <i className="fas fa-arrow-left" style={{ fontSize: 11 }}></i>
                                                    Toutes les matieres
                                                </button>
                                            )}
                                            {selectedMatiere && (
                                                <>
                                                    <i className="fas fa-chevron-right" style={{ fontSize: 9, color: '#d1d5db' }}></i>
                                                    <span style={{ fontSize: 14, fontWeight: 700, color: NAVY, textTransform: 'capitalize' }}>
                                                        {selectedMatiere}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <button onClick={() => setShowUploadExam(true)} style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            background: TEAL, color: 'white', border: 'none',
                                            borderRadius: 10, padding: '10px 18px', fontSize: 13,
                                            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                        }}>
                                            <i className="fas fa-upload"></i> Soumettre une epreuve
                                        </button>
                                    </div>

                                    {selectedMatiere ? (
                                        /* Show exams of selected matiere as cards */
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                                            gap: 20,
                                        }}>
                                            {(grouped[selectedMatiere] || []).map((exam, i) => (
                                                <ExamCard key={exam.id} exam={exam} idx={i} onDownload={handleDownload} onCorrection={setCorrectingExam} />
                                            ))}
                                        </div>
                                    ) : matieres.length > 0 ? (
                                        /* Show matieres as cards */
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                                            gap: 20,
                                        }}>
                                            {matieres.map((mat, i) => (
                                                <MatiereCard
                                                    key={mat}
                                                    matiere={mat}
                                                    exams={grouped[mat]}
                                                    idx={i}
                                                    onClick={setSelectedMatiere}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{
                                            background: 'white', borderRadius: 16, padding: 60,
                                            textAlign: 'center', border: '1px solid #f0f0f0',
                                        }}>
                                            <i className="fas fa-file-alt" style={{ fontSize: 48, color: '#e5e7eb', marginBottom: 16 }}></i>
                                            <p style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: '0 0 8px' }}>
                                                Aucune epreuve pour le moment
                                            </p>
                                            <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 20px' }}>
                                                Soyez le premier a partager une epreuve avec la communaute !
                                            </p>
                                            <button onClick={() => setShowUploadExam(true)} style={{
                                                background: TEAL, color: 'white', border: 'none',
                                                borderRadius: 10, padding: '12px 24px', fontSize: 14,
                                                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                            }}>
                                                <i className="fas fa-upload"></i> Soumettre une epreuve
                                            </button>
                                        </div>
                                    )}
                                </>
                            );
                        })()}

                        {/* Videos tab */}
                        {activeTab === 'videos' && (
                            <>
                                {/* Local videos grid */}
                                {videos.length > 0 && (
                                    <>
                                        <h2 style={{ fontSize: 16, fontWeight: 800, color: NAVY, marginBottom: 14 }}>
                                            <i className="fas fa-video" style={{ color: TEAL, marginRight: 8 }}></i>
                                            Videos INSAM-IA
                                        </h2>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                            gap: 18, marginBottom: 32,
                                        }}>
                                            {videos.map(v => <VideoCard key={v.id} video={v} />)}
                                        </div>
                                    </>
                                )}

                                {/* InsamTechs formations - card grid */}
                                {filteredFormations.length > 0 && (
                                    <>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            marginBottom: 20,
                                        }}>
                                            <h2 style={{
                                                fontSize: 18, fontWeight: 800, color: NAVY, margin: 0,
                                                display: 'flex', alignItems: 'center', gap: 10,
                                            }}>
                                                <i className="fas fa-graduation-cap" style={{ color: TEAL }}></i>
                                                Formations de votre filiere
                                                <span style={{
                                                    fontSize: 10, background: TEAL, color: 'white',
                                                    padding: '3px 10px', borderRadius: 20, fontWeight: 700,
                                                }}>
                                                    INSAMTECHS
                                                </span>
                                            </h2>
                                            <span style={{ fontSize: 13, color: '#9ca3af' }}>
                                                {filteredFormations.length} formation{filteredFormations.length > 1 ? 's' : ''}
                                            </span>
                                        </div>

                                        {/* Selected formation detail */}
                                        {selectedFormation && (
                                            <FormationDetail
                                                formation={selectedFormation}
                                                formationIdx={selectedFormationIdx}
                                                accentColor={ACCENT_COLORS[selectedFormationIdx % ACCENT_COLORS.length]}
                                                onPlayVideo={setPlayingVideo}
                                                onClose={() => setSelectedFormation(null)}
                                            />
                                        )}

                                        {/* Formation cards grid */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                                            gap: 20,
                                        }}>
                                            {filteredFormations.map((f, i) => (
                                                <FormationCard
                                                    key={f.id || i}
                                                    formation={f}
                                                    idx={i}
                                                    onClick={handleFormationClick}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {readingDoc && <PdfModal doc={readingDoc} onClose={() => setReadingDoc(null)} />}
            {playingVideo && <VideoModal video={playingVideo} onClose={() => setPlayingVideo(null)} />}
            {correctingExam && <CorrectionModal exam={correctingExam} onClose={() => setCorrectingExam(null)} />}
            {showUploadExam && (
                <UploadExamModal
                    categories={categories}
                    onClose={() => setShowUploadExam(false)}
                    onUploaded={() => {
                        // Refresh exams
                        api.get('/api/exams').then(r => setExams(r.data?.exams || [])).catch(() => {});
                    }}
                />
            )}
        </div>
    );
}
