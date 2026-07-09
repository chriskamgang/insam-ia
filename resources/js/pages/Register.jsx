import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../api';
import toast from 'react-hot-toast';

export default function Register() {
    const { register } = useAuth();
    const { t } = useLang();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        filiere: '',
        niveau: '',
        password: '',
        password_confirmation: '',
    });
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        api.get('/api/public/categories').then(r => setCategories(r.data.data || [])).catch(() => {});
    }, []);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.password_confirmation) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }
        setLoading(true);
        try {
            await register({
                name: `${form.prenom} ${form.nom}`,
                nom: form.nom,
                prenom: form.prenom,
                email: form.email,
                telephone: form.telephone || undefined,
                filiere: form.filiere || undefined,
                niveau: form.niveau || undefined,
                password: form.password,
                password_confirmation: form.password_confirmation,
            });
            toast.success('Compte cree avec succes !');
            navigate('/dashboard');
        } catch (err) {
            const errors = err.response?.data?.errors;
            if (errors) {
                Object.values(errors).flat().forEach(e => toast.error(e));
            } else {
                toast.error(err.response?.data?.message || 'Erreur');
            }
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 20px',
        borderRadius: 50,
        border: '1.5px solid #d1d5db',
        fontSize: 14,
        color: '#374151',
        outline: 'none',
        boxSizing: 'border-box',
        background: '#fff',
        transition: 'border-color 0.2s',
    };

    const labelStyle = {
        display: 'block',
        fontSize: 14,
        fontWeight: 700,
        color: '#1B2A4A',
        marginBottom: 8,
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            background: '#f8f9fa',
        }}>
            {/* ── LEFT: classroom photo simulation ── */}
            <div style={{
                width: '45%',
                flexShrink: 0,
                position: 'relative',
                borderRadius: '0 20px 20px 0',
                overflow: 'hidden',
                background: `
                    linear-gradient(
                        160deg,
                        rgba(27, 42, 74, 0.82) 0%,
                        rgba(91, 188, 180, 0.55) 45%,
                        rgba(180, 120, 60, 0.45) 70%,
                        rgba(120, 80, 30, 0.75) 100%
                    ),
                    linear-gradient(
                        110deg,
                        #c97b3a 0%,
                        #e8a95c 20%,
                        #d4874a 40%,
                        #7a5230 55%,
                        #3d6b78 75%,
                        #1B2A4A 100%
                    )
                `,
            }}>
                {/* Decorative circles */}
                <div style={{
                    position: 'absolute',
                    top: '-80px',
                    left: '-80px',
                    width: 320,
                    height: 320,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.04)',
                }}/>
                <div style={{
                    position: 'absolute',
                    top: '30%',
                    right: '-60px',
                    width: 240,
                    height: 240,
                    borderRadius: '50%',
                    background: 'rgba(91,188,180,0.12)',
                }}/>
                <div style={{
                    position: 'absolute',
                    bottom: '20%',
                    left: '-40px',
                    width: 180,
                    height: 180,
                    borderRadius: '50%',
                    background: 'rgba(201,123,58,0.15)',
                }}/>

                {/* Center illustration */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -60%)',
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.18)',
                }}>
                    <svg width="220" height="220" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="20" y="60" width="180" height="120" rx="8" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="2"/>
                        <rect x="40" y="80" width="140" height="80" rx="4" fill="rgba(255,255,255,0.05)"/>
                        <line x1="40" y1="100" x2="180" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                        <line x1="40" y1="115" x2="180" y2="115" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                        <line x1="40" y1="130" x2="140" y2="130" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                        <circle cx="110" cy="36" r="22" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.15)" strokeWidth="2"/>
                        <path d="M98 36 L110 24 L122 36 L110 30 Z" fill="rgba(255,255,255,0.3)"/>
                        <path d="M98 36 L110 48 L122 36" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
                    </svg>
                </div>

                {/* Bottom overlay: branding */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '40px 36px 44px',
                    background: 'linear-gradient(to top, rgba(27,42,74,0.92) 0%, rgba(27,42,74,0.4) 60%, transparent 100%)',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 10,
                    }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: '#5BBCB4',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 2L18 7L10 12L2 7L10 2Z" fill="white"/>
                                <path d="M2 7V13M18 7V13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                                <path d="M5 9.5V13C5 13 7 15 10 15C13 15 15 13 15 13V9.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <span style={{
                            color: 'white',
                            fontSize: 22,
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                        }}>INSAM-IA</span>
                    </div>
                    <p style={{
                        color: 'rgba(255,255,255,0.82)',
                        fontSize: 14,
                        fontWeight: 400,
                        margin: 0,
                        lineHeight: 1.5,
                    }}>
                        Votre assistant academique intelligent
                    </p>
                </div>
            </div>

            {/* ── RIGHT: form ── */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 40px',
                background: '#fff',
                overflowY: 'auto',
            }}>
                <div style={{ width: '100%', maxWidth: 420 }}>

                    {/* Title */}
                    <h1 style={{
                        fontSize: 26,
                        fontWeight: 800,
                        color: '#1B2A4A',
                        textAlign: 'center',
                        marginBottom: 28,
                        marginTop: 0,
                    }}>
                        Welcome to INSAM-IA !
                    </h1>

                    {/* Pill toggle */}
                    <div style={{
                        display: 'flex',
                        marginBottom: 24,
                        border: '1.5px solid #5BBCB4',
                        borderRadius: 50,
                        padding: 4,
                        background: 'transparent',
                    }}>
                        <Link
                            to="/login"
                            style={{
                                flex: 1,
                                textAlign: 'center',
                                padding: '10px 0',
                                borderRadius: 50,
                                background: 'transparent',
                                color: '#5BBCB4',
                                fontWeight: 700,
                                textDecoration: 'none',
                                fontSize: 14,
                                transition: 'all 0.2s',
                            }}
                        >
                            {t('nav.login')}
                        </Link>
                        <Link
                            to="/register"
                            style={{
                                flex: 1,
                                textAlign: 'center',
                                padding: '10px 0',
                                borderRadius: 50,
                                background: '#5BBCB4',
                                color: 'white',
                                fontWeight: 700,
                                textDecoration: 'none',
                                fontSize: 14,
                                transition: 'all 0.2s',
                            }}
                        >
                            {t('nav.register')}
                        </Link>
                    </div>

                    {/* Subtitle */}
                    <p style={{
                        fontSize: 13,
                        color: '#6b7280',
                        textAlign: 'center',
                        marginBottom: 24,
                        lineHeight: 1.6,
                    }}>
                        Creez votre compte gratuitement et accedez a des ressources pedagogiques adaptees a votre parcours academique.
                    </p>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>

                        {/* Email Address */}
                        <div style={{ marginBottom: 18 }}>
                            <label style={labelStyle}>Adresse email</label>
                            <input
                                type="email"
                                placeholder="votre@email.com"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                required
                                style={inputStyle}
                            />
                        </div>

                        {/* User name: nom + prenom side by side */}
                        <div style={{ marginBottom: 18 }}>
                            <label style={labelStyle}>Nom d'utilisateur</label>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <input
                                    placeholder="Nom"
                                    value={form.nom}
                                    onChange={e => setForm({ ...form, nom: e.target.value })}
                                    required
                                    style={{ ...inputStyle, flex: 1 }}
                                />
                                <input
                                    placeholder="Prenom"
                                    value={form.prenom}
                                    onChange={e => setForm({ ...form, prenom: e.target.value })}
                                    required
                                    style={{ ...inputStyle, flex: 1 }}
                                />
                            </div>
                        </div>

                        {/* Telephone */}
                        <div style={{ marginBottom: 18 }}>
                            <label style={labelStyle}>Telephone</label>
                            <input
                                type="tel"
                                placeholder="+237 6XX XXX XXX"
                                value={form.telephone}
                                onChange={e => setForm({ ...form, telephone: e.target.value })}
                                style={inputStyle}
                            />
                        </div>

                        {/* Filiere + Niveau */}
                        <div style={{ marginBottom: 18 }}>
                            <label style={labelStyle}>Filiere</label>
                            <select
                                value={form.filiere}
                                onChange={e => {
                                    const catName = e.target.value;
                                    setForm({ ...form, filiere: catName });
                                }}
                                style={{ ...inputStyle, appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'10\' height=\'6\' viewBox=\'0 0 10 6\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1L5 5L9 1\' stroke=\'%239ca3af\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
                            >
                                <option value="">Selectionnez votre filiere</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: 18 }}>
                            <label style={labelStyle}>Niveau</label>
                            <select
                                value={form.niveau}
                                onChange={e => setForm({ ...form, niveau: e.target.value })}
                                style={{ ...inputStyle, appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'10\' height=\'6\' viewBox=\'0 0 10 6\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1L5 5L9 1\' stroke=\'%239ca3af\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
                            >
                                <option value="">Selectionnez votre niveau</option>
                                <option value="L1">Licence 1 (L1)</option>
                                <option value="L2">Licence 2 (L2)</option>
                                <option value="L3">Licence 3 (L3)</option>
                                <option value="M1">Master 1 (M1)</option>
                                <option value="M2">Master 2 (M2)</option>
                                <option value="BTS1">BTS 1</option>
                                <option value="BTS2">BTS 2</option>
                            </select>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: 26 }}>
                            <label style={labelStyle}>Mot de passe</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min. 6 caracteres"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    required
                                    style={{ ...inputStyle, paddingRight: 48 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    style={{
                                        position: 'absolute',
                                        right: 16,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0,
                                        color: '#9ca3af',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                            <line x1="1" y1="1" x2="23" y2="23"/>
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {/* Hidden confirmation field — same value enforced via validation */}
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={form.password_confirmation}
                                onChange={e => setForm({ ...form, password_confirmation: e.target.value })}
                                required
                                placeholder="Confirmez le mot de passe"
                                style={{ ...inputStyle, marginTop: 12 }}
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px 0',
                                borderRadius: 50,
                                background: loading ? '#a8d8d4' : '#5BBCB4',
                                color: 'white',
                                fontSize: 15,
                                fontWeight: 700,
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s',
                                letterSpacing: '0.3px',
                            }}
                        >
                            {loading ? 'Inscription...' : t('nav.register')}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}
