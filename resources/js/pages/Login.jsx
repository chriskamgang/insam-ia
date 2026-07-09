import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import toast from 'react-hot-toast';

export default function Login() {
    const { login } = useAuth();
    const { t } = useLang();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(form.email, form.password);
            toast.success('Bienvenue !');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Identifiants incorrects');
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
                {/* Decorative circles to simulate classroom depth */}
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

                {/* Center icon / illustration area */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -60%)',
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.18)',
                }}>
                    <svg width="220" height="220" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Simple classroom / graduation illustration */}
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
                                background: '#5BBCB4',
                                color: 'white',
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
                                background: 'transparent',
                                color: '#5BBCB4',
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
                        marginBottom: 28,
                        lineHeight: 1.6,
                    }}>
                        Connectez-vous pour acceder a votre espace academique personnalise et profiter de tous les outils intelligents mis a votre disposition.
                    </p>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>

                        {/* Email */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Email</label>
                            <input
                                type="email"
                                placeholder="Entrez votre email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                required
                                style={inputStyle}
                            />
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Mot de passe</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Entrez votre mot de passe"
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
                        </div>

                        {/* Remember me + Forgot password */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 28,
                        }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 13,
                                color: '#374151',
                                cursor: 'pointer',
                                userSelect: 'none',
                            }}>
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={e => setRememberMe(e.target.checked)}
                                    style={{
                                        width: 16,
                                        height: 16,
                                        accentColor: '#5BBCB4',
                                        cursor: 'pointer',
                                    }}
                                />
                                Se souvenir de moi
                            </label>
                            <Link
                                to="/forgot-password"
                                style={{
                                    fontSize: 13,
                                    color: '#5BBCB4',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                }}
                            >
                                Mot de passe oublie ?
                            </Link>
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
                            {loading ? 'Connexion...' : t('nav.login')}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}
