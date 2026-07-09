import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 900, margin: '0 auto', padding: '0 24px' };

function Avatar({ name, size = 80 }) {
    const letter = (name || 'U').charAt(0).toUpperCase();
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: 'linear-gradient(135deg, #5BBCB4 0%, #1B2A4A 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: size * 0.38,
            boxShadow: '0 4px 16px rgba(91,188,180,0.35)',
            flexShrink: 0,
        }}>
            {letter}
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                {label}
            </label>
            {children}
        </div>
    );
}

const inputStyle = (readOnly) => ({
    width: '100%', padding: '12px 14px',
    borderRadius: 10,
    border: `1.5px solid ${readOnly ? '#f0f0f0' : '#e5e7eb'}`,
    fontSize: 14, color: readOnly ? '#9ca3af' : NAVY,
    background: readOnly ? '#f8fafb' : 'white',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color .15s',
    cursor: readOnly ? 'not-allowed' : 'text',
});

export default function Profile() {
    const { user, setUser } = useAuth();
    const { lang, switchLang } = useLang();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    /* Form fields */
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [filiere, setFiliere] = useState('');
    const [niveau, setNiveau] = useState('');
    const [categories, setCategories] = useState([]);

    /* Stats */
    const [stats, setStats] = useState({ quiz_count: 0, avg_score: null });

    /* ── FETCH ── */
    useEffect(() => {
        api.get('/api/public/categories')
            .then(r => setCategories(r.data?.data || []))
            .catch(() => {});

        api.get('/api/me')
            .then(r => {
                const u = r.data.user || r.data;
                setProfile(u);
                const parts = (u.name || '').split(' ');
                setPrenom(u.prenom || parts[0] || '');
                setNom(u.nom || parts.slice(1).join(' ') || '');
                setFiliere(u.filiere || '');
                setNiveau(u.niveau || '');
            })
            .catch(() => setError('Impossible de charger le profil.'))
            .finally(() => setLoading(false));

        api.get('/api/my-results')
            .then(r => {
                const results = r.data.data || r.data || [];
                const count = results.length;
                const avg = count > 0
                    ? Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / count)
                    : null;
                setStats({ quiz_count: count, avg_score: avg });
            })
            .catch(() => {});
    }, []);

    /* ── SAVE ── */
    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const name = [prenom, nom].filter(Boolean).join(' ');
            const { data } = await api.put('/api/me', { name, filiere, niveau });
            const updated = data.user || data;
            setProfile(updated);
            if (setUser) setUser(updated);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la sauvegarde.');
        } finally {
            setSaving(false);
        }
    };

    /* ── LOADING ── */
    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#F8FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: 36, color: TEAL, marginBottom: 16 }}></i>
                    <p style={{ fontSize: 15 }}>Chargement du profil...</p>
                </div>
            </div>
        );
    }

    const displayName = profile?.name || [prenom, nom].filter(Boolean).join(' ') || 'Utilisateur';
    const email = profile?.email || '';
    const role = profile?.role || 'etudiant';

    const roleLabel = {
        admin: 'Administrateur',
        teacher: 'Enseignant',
        etudiant: 'Etudiant',
        student: 'Etudiant',
    }[role] || role;

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh', paddingBottom: 60 }}>

            {/* ── HERO ── */}
            <section style={{
                background: 'linear-gradient(135deg, #1B2A4A 0%, #243758 60%, #2d4470 100%)',
                padding: '48px 0 80px',
            }}>
                <div style={{ ...W }}>
                    <span style={{ color: TEAL, fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>MON COMPTE</span>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', margin: '10px 0 6px', lineHeight: 1.2 }}>
                        Mon <span style={{ color: TEAL }}>Profil</span>
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                        Gerez vos informations personnelles et preferences.
                    </p>
                </div>
            </section>

            <div style={{ ...W, marginTop: -48 }}>

                {/* ── USER INFO CARD ── */}
                <div style={{
                    background: 'white', borderRadius: 20,
                    border: '1px solid #f0f0f0',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                    padding: '28px 32px',
                    display: 'flex', alignItems: 'center', gap: 24,
                    flexWrap: 'wrap',
                    marginBottom: 24,
                }}>
                    <Avatar name={displayName} size={80} />
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: '0 0 4px' }}>
                            {displayName}
                        </h2>
                        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 10px' }}>{email}</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: '#e8f8f5', color: TEAL,
                                padding: '4px 12px', borderRadius: 20,
                                fontSize: 12, fontWeight: 700,
                            }}>
                                <i className="fas fa-user-graduate"></i>
                                {roleLabel}
                            </span>
                            {filiere && (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    background: '#f0f4ff', color: NAVY,
                                    padding: '4px 12px', borderRadius: 20,
                                    fontSize: 12, fontWeight: 700,
                                }}>
                                    <i className="fas fa-graduation-cap"></i>
                                    {filiere}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stats mini */}
                    <div style={{ display: 'flex', gap: 32, flexShrink: 0 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 900, color: NAVY }}>{stats.quiz_count}</div>
                            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Quiz completes</div>
                        </div>
                        <div style={{ width: 1, background: '#f3f4f6' }}></div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 900, color: stats.avg_score !== null ? TEAL : '#9ca3af' }}>
                                {stats.avg_score !== null ? `${stats.avg_score}%` : '—'}
                            </div>
                            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Score moyen</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

                    {/* ── EDIT FORM ── */}
                    <div style={{
                        background: 'white', borderRadius: 20,
                        border: '1px solid #f0f0f0',
                        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                        padding: '28px 32px',
                    }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: NAVY, margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <i className="fas fa-user-edit" style={{ color: TEAL, fontSize: 14 }}></i>
                            Informations personnelles
                        </h3>

                        {error && (
                            <div style={{
                                background: '#fee2e2', color: '#dc2626',
                                padding: '12px 16px', borderRadius: 10,
                                fontSize: 13, fontWeight: 600, marginBottom: 20,
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <i className="fas fa-exclamation-circle"></i>
                                {error}
                            </div>
                        )}

                        {saved && (
                            <div style={{
                                background: '#d1fae5', color: '#059669',
                                padding: '12px 16px', borderRadius: 10,
                                fontSize: 13, fontWeight: 600, marginBottom: 20,
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <i className="fas fa-check-circle"></i>
                                Profil mis a jour avec succes !
                            </div>
                        )}

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <Field label="Prenom">
                                    <input
                                        value={prenom}
                                        onChange={e => setPrenom(e.target.value)}
                                        placeholder="Votre prenom"
                                        style={inputStyle(false)}
                                        onFocus={e => e.target.style.borderColor = TEAL}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                    />
                                </Field>
                                <Field label="Nom">
                                    <input
                                        value={nom}
                                        onChange={e => setNom(e.target.value)}
                                        placeholder="Votre nom"
                                        style={inputStyle(false)}
                                        onFocus={e => e.target.style.borderColor = TEAL}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                    />
                                </Field>
                            </div>

                            <Field label="Adresse email">
                                <div style={{ position: 'relative' }}>
                                    <input
                                        value={email}
                                        readOnly
                                        style={inputStyle(true)}
                                    />
                                    <i className="fas fa-lock" style={{
                                        position: 'absolute', right: 14, top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#d1d5db', fontSize: 13,
                                    }}></i>
                                </div>
                                <span style={{ fontSize: 11, color: '#9ca3af' }}>L&apos;email ne peut pas etre modifie.</span>
                            </Field>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <Field label="Filiere">
                                    <select
                                        value={filiere}
                                        onChange={e => setFiliere(e.target.value)}
                                        style={{ ...inputStyle(false), cursor: 'pointer' }}
                                    >
                                        <option value="">Selectionnez votre filiere</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Niveau">
                                    <select
                                        value={niveau}
                                        onChange={e => setNiveau(e.target.value)}
                                        style={{ ...inputStyle(false), cursor: 'pointer' }}
                                    >
                                        <option value="">Selectionnez</option>
                                        <option value="L1">Licence 1 (L1)</option>
                                        <option value="L2">Licence 2 (L2)</option>
                                        <option value="L3">Licence 3 (L3)</option>
                                        <option value="M1">Master 1 (M1)</option>
                                        <option value="M2">Master 2 (M2)</option>
                                        <option value="BTS1">BTS 1</option>
                                        <option value="BTS2">BTS 2</option>
                                    </select>
                                </Field>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    padding: '13px 24px', borderRadius: 12,
                                    background: saving ? '#9ca3af' : `linear-gradient(135deg, ${TEAL}, #3da89f)`,
                                    color: 'white', border: 'none',
                                    fontWeight: 700, fontSize: 14,
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    boxShadow: saving ? 'none' : '0 4px 16px rgba(91,188,180,0.3)',
                                    transition: 'all .2s',
                                    alignSelf: 'flex-start',
                                }}
                            >
                                {saving
                                    ? <><i className="fas fa-spinner fa-spin"></i> Sauvegarde...</>
                                    : <><i className="fas fa-save"></i> Sauvegarder</>
                                }
                            </button>
                        </form>
                    </div>

                    {/* ── RIGHT COLUMN ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Language toggle */}
                        <div style={{
                            background: 'white', borderRadius: 20,
                            border: '1px solid #f0f0f0',
                            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                            padding: '22px 24px',
                        }}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: NAVY, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <i className="fas fa-globe" style={{ color: TEAL, fontSize: 14 }}></i>
                                Langue de l&apos;interface
                            </h3>
                            <div style={{ display: 'flex', gap: 10 }}>
                                {[{ code: 'fr', label: 'Francais', flag: '🇫🇷' }, { code: 'en', label: 'English', flag: '🇬🇧' }].map(l => (
                                    <button
                                        key={l.code}
                                        onClick={() => switchLang(l.code)}
                                        style={{
                                            flex: 1, padding: '10px 12px',
                                            borderRadius: 10,
                                            border: `2px solid ${lang === l.code ? TEAL : '#e5e7eb'}`,
                                            background: lang === l.code ? '#e8f8f5' : 'white',
                                            color: lang === l.code ? TEAL : '#374151',
                                            fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                            transition: 'all .15s',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        }}
                                    >
                                        <span style={{ fontSize: 18 }}>{l.flag}</span>
                                        {l.label}
                                        {lang === l.code && <i className="fas fa-check" style={{ fontSize: 11 }}></i>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stats card */}
                        <div style={{
                            background: 'white', borderRadius: 20,
                            border: '1px solid #f0f0f0',
                            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                            padding: '22px 24px',
                        }}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: NAVY, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <i className="fas fa-chart-bar" style={{ color: TEAL, fontSize: 14 }}></i>
                                Mes statistiques
                            </h3>
                            {[
                                { icon: 'fas fa-clipboard-check', label: 'Quiz completes', value: stats.quiz_count, color: TEAL, bg: '#e8f8f5' },
                                { icon: 'fas fa-trophy', label: 'Score moyen', value: stats.avg_score !== null ? `${stats.avg_score}%` : '—', color: '#F5A623', bg: '#fff8ec' },
                                {
                                    icon: 'fas fa-star', label: 'Niveau', color: NAVY, bg: '#f0f4ff',
                                    value: stats.avg_score === null ? '—'
                                        : stats.avg_score >= 80 ? 'Expert'
                                            : stats.avg_score >= 60 ? 'Intermediaire'
                                                : 'Debutant',
                                },
                            ].map((s, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 0',
                                    borderBottom: i < 2 ? '1px solid #f9fafb' : 'none',
                                }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        background: s.bg,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 14, color: s.color, flexShrink: 0,
                                    }}>
                                        <i className={s.icon}></i>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{s.label}</div>
                                    </div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Account info */}
                        <div style={{
                            background: 'white', borderRadius: 20,
                            border: '1px solid #f0f0f0',
                            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                            padding: '22px 24px',
                        }}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: NAVY, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <i className="fas fa-shield-alt" style={{ color: TEAL, fontSize: 14 }}></i>
                                Informations du compte
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                    <span style={{ color: '#6b7280' }}>Role</span>
                                    <span style={{ fontWeight: 700, color: NAVY }}>{roleLabel}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                    <span style={{ color: '#6b7280' }}>Statut</span>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                        fontWeight: 700, color: '#059669',
                                    }}>
                                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                                        Actif
                                    </span>
                                </div>
                                {profile?.created_at && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                        <span style={{ color: '#6b7280' }}>Membre depuis</span>
                                        <span style={{ fontWeight: 700, color: NAVY }}>
                                            {new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
