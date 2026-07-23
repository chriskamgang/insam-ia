import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 900, margin: '0 auto', padding: '0 24px' };

export default function RevisionProgram() {
    const { user } = useAuth();
    const [revisionType, setRevisionType] = useState(null);
    const [revisionPlan, setRevisionPlan] = useState(null);
    const [revisionLoading, setRevisionLoading] = useState(false);
    const [revisionOptions, setRevisionOptions] = useState(null);
    const [selectedAnnee, setSelectedAnnee] = useState(1);
    const [selectedSemestre, setSelectedSemestre] = useState(1);

    useEffect(() => {
        api.get('/api/revision-plan/options').then(r => setRevisionOptions(r.data)).catch(() => {});
    }, []);

    const loadBtsRevision = async () => {
        setRevisionLoading(true);
        try {
            const r = await api.get('/api/revision-plan/bts');
            setRevisionPlan(r.data);
            setRevisionType('bts');
        } catch { toast.error('Erreur chargement plan BTS'); }
        finally { setRevisionLoading(false); }
    };

    const loadSemesterRevision = async () => {
        setRevisionLoading(true);
        try {
            const r = await api.post('/api/revision-plan/semester', { annee: selectedAnnee, semestre: selectedSemestre });
            setRevisionPlan(r.data);
            setRevisionType('semester');
        } catch { toast.error('Erreur chargement plan semestre'); }
        finally { setRevisionLoading(false); }
    };

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh' }}>
            {/* Hero */}
            <section style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #263d6b 100%)`, padding: '44px 0 36px' }}>
                <div style={W}>
                    <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13, fontWeight: 500, marginBottom: 18 }}>
                        <i className="fas fa-arrow-left"></i> Retour au dashboard
                    </Link>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: '0 0 8px' }}>
                        <i className="fas fa-clipboard-list" style={{ color: TEAL, marginRight: 12 }}></i>
                        Programme de revision
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>
                        Plan personnalise base sur vos evaluations - {user?.filiere || 'Votre filiere'}
                    </p>
                </div>
            </section>

            <section style={{ padding: '32px 0 60px' }}>
                <div style={W}>
                    {/* Choice: BTS or Semester */}
                    <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #f0f0f0', marginBottom: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 16 }}>
                            <i className="fas fa-route" style={{ color: TEAL, marginRight: 8 }}></i>
                            Choisissez votre type de revision
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <button onClick={loadBtsRevision} style={{
                                padding: 24, borderRadius: 14, border: `2px solid ${revisionType === 'bts' ? TEAL : '#e5e7eb'}`,
                                background: revisionType === 'bts' ? '#e8f8f5' : 'white',
                                cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit', transition: 'all .2s',
                            }}>
                                <i className="fas fa-graduation-cap" style={{ fontSize: 28, color: TEAL, marginBottom: 10, display: 'block' }}></i>
                                <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>Cycle BTS</div>
                                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                                    Toutes les epreuves du BTS : evaluees et non evaluees.
                                    Priorise les matieres ou vous avez des lacunes.
                                </p>
                            </button>
                            <button onClick={() => setRevisionType('semester_choice')} style={{
                                padding: 24, borderRadius: 14, border: `2px solid ${revisionType?.startsWith('semester') ? TEAL : '#e5e7eb'}`,
                                background: revisionType?.startsWith('semester') ? '#e8f8f5' : 'white',
                                cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit', transition: 'all .2s',
                            }}>
                                <i className="fas fa-calendar-alt" style={{ fontSize: 28, color: '#F5A623', marginBottom: 10, display: 'block' }}></i>
                                <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>Par semestre</div>
                                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                                    Preparez-vous pour les examens d'un semestre specifique.
                                    Choisissez l'annee et le semestre.
                                </p>
                            </button>
                        </div>

                        {/* Semester selector */}
                        {revisionType === 'semester_choice' && (
                            <div style={{ marginTop: 20, padding: 20, background: '#f9fafb', borderRadius: 12 }}>
                                <h4 style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>
                                    Selectionnez l'annee et le semestre
                                </h4>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <select value={selectedAnnee} onChange={e => setSelectedAnnee(Number(e.target.value))}
                                        style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit' }}>
                                        {(revisionOptions?.annees || [1, 2, 3]).map(a => (
                                            <option key={a} value={a}>{a === 1 ? '1ere' : `${a}eme`} annee</option>
                                        ))}
                                    </select>
                                    <select value={selectedSemestre} onChange={e => setSelectedSemestre(Number(e.target.value))}
                                        style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit' }}>
                                        <option value={1}>Semestre 1</option>
                                        <option value={2}>Semestre 2</option>
                                    </select>
                                    <button onClick={loadSemesterRevision} style={{
                                        padding: '10px 24px', borderRadius: 10, border: 'none',
                                        background: TEAL, color: 'white', fontWeight: 700, fontSize: 14,
                                        cursor: 'pointer', fontFamily: 'inherit',
                                    }}>
                                        <i className="fas fa-search" style={{ marginRight: 8 }}></i>Voir le plan
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Loading */}
                    {revisionLoading && (
                        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                            <i className="fas fa-spinner fa-spin" style={{ fontSize: 28, color: TEAL }}></i>
                            <p style={{ marginTop: 12, fontSize: 14 }}>Chargement du plan de revision...</p>
                        </div>
                    )}

                    {/* Results */}
                    {revisionPlan && !revisionLoading && (
                        <div>
                            {/* Summary cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
                                {(revisionType === 'bts' ? [
                                    { label: 'Epreuves totales', value: revisionPlan.summary?.total_exams || 0, icon: 'fas fa-file-alt', color: NAVY, bg: '#f0f4ff' },
                                    { label: 'Evaluees', value: revisionPlan.summary?.evaluated || 0, icon: 'fas fa-check-circle', color: TEAL, bg: '#e8f8f5' },
                                    { label: 'Non evaluees', value: revisionPlan.summary?.not_evaluated || 0, icon: 'fas fa-hourglass-half', color: '#F5A623', bg: '#fff8ec' },
                                    { label: 'A revoir', value: revisionPlan.summary?.weak || 0, icon: 'fas fa-exclamation-triangle', color: '#ef4444', bg: '#fef2f2' },
                                ] : [
                                    { label: 'Total UE', value: revisionPlan.summary?.total_ues || 0, icon: 'fas fa-book', color: NAVY, bg: '#f0f4ff' },
                                    { label: 'Cours termines', value: revisionPlan.summary?.courses_completed || 0, icon: 'fas fa-check-circle', color: TEAL, bg: '#e8f8f5' },
                                    { label: 'A revoir', value: revisionPlan.summary?.weak || 0, icon: 'fas fa-exclamation-triangle', color: '#ef4444', bg: '#fef2f2' },
                                    { label: 'Non commencees', value: revisionPlan.summary?.not_started || 0, icon: 'fas fa-hourglass-half', color: '#F5A623', bg: '#fff8ec' },
                                ]).map((s, i) => (
                                    <div key={i} style={{
                                        background: 'white', borderRadius: 14, padding: '18px 14px',
                                        border: '1px solid #f0f0f0', textAlign: 'center',
                                    }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 16, color: s.color }}>
                                            <i className={s.icon}></i>
                                        </div>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: NAVY }}>{s.value}</div>
                                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Plan title */}
                            <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #f0f0f0' }}>
                                <h3 style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
                                    <i className="fas fa-tasks" style={{ color: TEAL, marginRight: 8 }}></i>
                                    {revisionType === 'bts' ? 'Programme de revision BTS' : `Programme - Annee ${revisionPlan.annee}, Semestre ${revisionPlan.semestre}`}
                                </h3>
                                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
                                    {revisionType === 'bts'
                                        ? 'Vos matieres sont classees par priorite. Commencez par celles ou vous avez eu de mauvaises notes, puis lisez les cours des matieres non evaluees.'
                                        : 'Revisez les UE de ce semestre en priorite selon vos resultats.'}
                                </p>

                                {(revisionPlan.plan || []).length === 0 && !(revisionPlan.ues_without_exams?.length > 0) ? (
                                    <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                                        <i className="fas fa-inbox" style={{ fontSize: 40, marginBottom: 14, color: '#e5e7eb' }}></i>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: '#6b7280' }}>Aucune epreuve trouvee pour votre filiere</p>
                                        <p style={{ fontSize: 12 }}>Les UE et epreuves doivent etre ajoutees par l'administration.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        {/* Section 1: A REVISER (mauvaises notes) */}
                                        {revisionPlan.plan.filter(p => p.status === 'weak' || p.status === 'average').length > 0 && (
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                                    <div style={{ width: 5, height: 24, borderRadius: 3, background: '#ef4444' }}></div>
                                                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', margin: 0 }}>
                                                        A REVISER - Matieres avec notes insuffisantes
                                                    </h4>
                                                </div>
                                                {revisionPlan.plan.filter(p => p.status === 'weak' || p.status === 'average').map((item, i) => (
                                                    <div key={`weak-${i}`} style={{
                                                        padding: 18, borderRadius: 14, marginBottom: 12,
                                                        border: '1px solid #fecaca', background: '#fffbfb',
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                <i className="fas fa-exclamation-circle" style={{ color: '#ef4444', fontSize: 16 }}></i>
                                                                <span style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>{item.ue.nom}</span>
                                                                {item.ue.code && <span style={{ fontSize: 11, color: '#9ca3af' }}>({item.ue.code})</span>}
                                                            </div>
                                                            <span style={{ padding: '4px 10px', borderRadius: 8, background: item.avg_score < 50 ? '#fef2f2' : '#fff8ec', color: item.avg_score < 50 ? '#ef4444' : '#F5A623', fontSize: 13, fontWeight: 700 }}>
                                                                {item.avg_score}%
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
                                                            <i className="fas fa-chart-line" style={{ marginRight: 6 }}></i>
                                                            Evalue sur {item.evaluated_count}/{item.total_exams} epreuve{item.total_exams > 1 ? 's' : ''}
                                                        </div>
                                                        <div style={{ padding: 14, background: '#fff5f5', borderRadius: 10, border: '1px dashed #fca5a5' }}>
                                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#b91c1c', marginBottom: 4 }}>
                                                                <i className="fas fa-arrow-right" style={{ marginRight: 6 }}></i>Action: Reviser les chapitres de cette UE
                                                            </div>
                                                            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                                                                Retournez lire les cours de "{item.ue.nom}" et refaites les exercices des chapitres ou vous avez eu des difficultes.
                                                            </p>
                                                        </div>
                                                        {/* Individual exams with scores */}
                                                        {item.exams && item.exams.filter(e => e.evaluated).length > 0 && (
                                                            <div style={{ marginTop: 12 }}>
                                                                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Epreuves evaluees :</div>
                                                                {item.exams.filter(e => e.evaluated).map((ex, ei) => (
                                                                    <div key={ei} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12, color: '#374151' }}>
                                                                        <i className={`fas fa-${ex.score >= 50 ? 'check' : 'times'}`} style={{ color: ex.score >= 50 ? TEAL : '#ef4444', fontSize: 11 }}></i>
                                                                        <span style={{ flex: 1 }}>{ex.title}</span>
                                                                        <span style={{ fontWeight: 700, color: ex.score >= 50 ? TEAL : '#ef4444' }}>{ex.score}%</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Section 2: A LIRE (non evaluees) */}
                                        {revisionPlan.plan.filter(p => p.status === 'not_evaluated' || p.status === 'not_started').length > 0 && (
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                                    <div style={{ width: 5, height: 24, borderRadius: 3, background: '#F5A623' }}></div>
                                                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#92400e', margin: 0 }}>
                                                        A LIRE - Matieres non encore evaluees
                                                    </h4>
                                                </div>
                                                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, marginLeft: 15 }}>
                                                    Vous n'avez pas encore ete evalue sur ces matieres. Lisez les cours pour vous preparer.
                                                </p>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                                                    {revisionPlan.plan.filter(p => p.status === 'not_evaluated' || p.status === 'not_started').map((item, i) => (
                                                        <div key={`read-${i}`} style={{
                                                            padding: 16, borderRadius: 12,
                                                            border: '1px solid #fde68a', background: '#fffbeb',
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                                <i className="fas fa-book-open" style={{ color: '#F5A623' }}></i>
                                                                <span style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{item.ue.nom}</span>
                                                            </div>
                                                            {item.ue.annee && (
                                                                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>
                                                                    Annee {item.ue.annee} - Semestre {item.ue.semestre}
                                                                </div>
                                                            )}
                                                            <div style={{ fontSize: 12, color: '#92400e' }}>
                                                                <i className="fas fa-arrow-right" style={{ marginRight: 4 }}></i>
                                                                Aller lire les cours de cette UE
                                                            </div>
                                                            {item.total_exams > 0 && (
                                                                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 6 }}>
                                                                    {item.total_exams} epreuve{item.total_exams > 1 ? 's' : ''} disponible{item.total_exams > 1 ? 's' : ''}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* UEs without exams */}
                                                {revisionPlan.ues_without_exams?.length > 0 && (
                                                    <div style={{ marginTop: 14 }}>
                                                        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8 }}>Autres UE (sans epreuves BTS) :</div>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                            {revisionPlan.ues_without_exams.map((item, i) => (
                                                                <span key={`noexam-${i}`} style={{
                                                                    padding: '6px 14px', borderRadius: 8,
                                                                    background: '#f9fafb', border: '1px solid #e5e7eb',
                                                                    fontSize: 11, color: '#6b7280',
                                                                }}>
                                                                    <i className="fas fa-book" style={{ marginRight: 4 }}></i>{item.ue.nom}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Section 3: MAITRISEES */}
                                        {revisionPlan.plan.filter(p => p.status === 'strong' || p.status === 'maintain').length > 0 && (
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                                    <div style={{ width: 5, height: 24, borderRadius: 3, background: TEAL }}></div>
                                                    <h4 style={{ fontSize: 14, fontWeight: 700, color: TEAL, margin: 0 }}>
                                                        MAITRISEES - Continuez ainsi
                                                    </h4>
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                                    {revisionPlan.plan.filter(p => p.status === 'strong' || p.status === 'maintain').map((item, i) => (
                                                        <div key={`strong-${i}`} style={{
                                                            padding: '12px 16px', borderRadius: 12,
                                                            border: '1px solid #bbf7d0', background: '#f0fdf9',
                                                            display: 'flex', alignItems: 'center', gap: 10,
                                                        }}>
                                                            <i className="fas fa-check-double" style={{ color: TEAL }}></i>
                                                            <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{item.ue.nom}</span>
                                                            <span style={{ fontSize: 12, color: TEAL, fontWeight: 700 }}>{item.avg_score}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
