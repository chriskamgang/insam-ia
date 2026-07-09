import { useEffect, useState, useCallback } from 'react';
import { useLang } from '../context/LangContext';
import api from '../api';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_COLORS = {
    revision:  { bg: '#e8f8f7', color: TEAL,      label: 'Revision'    },
    quiz:      { bg: '#f3eeff', color: '#8B5CF6',  label: 'Quiz'        },
    exercise:  { bg: '#fff8ec', color: '#F59E0B',  label: 'Exercice'    },
    exam_prep: { bg: '#fef2f2', color: '#EF4444',  label: 'Examen prep' },
    video:     { bg: '#eff6ff', color: '#3B82F6',  label: 'Video'       },
    other:     { bg: '#f3f4f6', color: '#6B7280',  label: 'Autre'       },
};

const PRIORITY_COLORS = {
    high:   '#EF4444',
    medium: '#F59E0B',
    low:    '#10B981',
};

const STATUS_STYLE = {
    active:    { bg: '#d1fae5', color: '#059669', label: 'Actif'     },
    completed: { bg: '#dbeafe', color: '#2563EB', label: 'Termine'   },
    paused:    { bg: '#f3f4f6', color: '#6B7280', label: 'En pause'  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateLong(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function todayLabel() {
    return new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function groupByDate(tasks) {
    const map = {};
    for (const t of tasks) {
        const key = t.due_date ? t.due_date.split('T')[0] : 'sans-date';
        if (!map[key]) map[key] = [];
        map[key].push(t);
    }
    return map;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TypeBadge({ type }) {
    const cfg = TYPE_COLORS[type] || TYPE_COLORS.other;
    return (
        <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
            background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap',
        }}>
            {cfg.label}
        </span>
    );
}

function PriorityDot({ priority }) {
    const color = PRIORITY_COLORS[priority] || '#9ca3af';
    return (
        <span title={priority} style={{
            display: 'inline-block', width: 9, height: 9, borderRadius: '50%',
            background: color, flexShrink: 0,
        }} />
    );
}

function ProgressBar({ completed, total, style }) {
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    return (
        <div style={{ ...style }}>
            <div style={{ height: 6, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${pct}%`,
                    background: `linear-gradient(90deg, ${TEAL}, #3daaa3)`,
                    borderRadius: 99, transition: 'width .4s',
                }} />
            </div>
        </div>
    );
}

// ── TaskCard (shared between Today and Detail views) ──────────────────────────

function TaskCard({ task, onToggle, compact }) {
    const done = !!task.is_completed;
    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            padding: compact ? '10px 0' : '14px 18px',
            borderBottom: '1px solid #f3f4f6',
            background: done ? '#fafafa' : 'white',
            transition: 'background .2s',
        }}>
            {/* Checkbox */}
            <button
                onClick={() => onToggle(task)}
                style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${done ? TEAL : '#d1d5db'}`,
                    background: done ? TEAL : 'white',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', marginTop: 2, transition: 'all .2s',
                    padding: 0,
                }}
            >
                {done && <i className="fas fa-check" style={{ fontSize: 10, color: 'white' }} />}
            </button>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                    <span style={{
                        fontSize: 14, fontWeight: 700, color: done ? '#9ca3af' : NAVY,
                        textDecoration: done ? 'line-through' : 'none',
                        transition: 'all .2s',
                    }}>
                        {task.title}
                    </span>
                    <PriorityDot priority={task.priority} />
                    <TypeBadge type={task.type} />
                    {task.time && (
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>
                            <i className="fas fa-clock" style={{ marginRight: 4 }} />{task.time}
                        </span>
                    )}
                </div>
                {task.description && (
                    <p style={{
                        fontSize: 12, color: done ? '#d1d5db' : '#6b7280',
                        margin: 0, lineHeight: 1.5, transition: 'color .2s',
                    }}>
                        {task.description}
                    </p>
                )}
            </div>
        </div>
    );
}

// ── Add-task inline form ──────────────────────────────────────────────────────

function AddTaskForm({ planId, onAdded, onCancel }) {
    const [form, setForm] = useState({
        title: '', description: '', due_date: '', type: 'revision', priority: 'medium',
    });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const submit = async () => {
        if (!form.title.trim()) { setErr('Le titre est requis.'); return; }
        setSaving(true); setErr('');
        try {
            const res = await api.post(`/api/study-plans/${planId}/tasks`, form);
            onAdded(res.data.data || res.data);
        } catch {
            setErr('Erreur lors de l\'ajout de la tache.');
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '9px 12px', borderRadius: 8,
        border: '1px solid #e5e7eb', fontSize: 13, color: NAVY,
        outline: 'none', boxSizing: 'border-box',
    };
    const labelStyle = { fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 };

    return (
        <div style={{
            background: '#f8fafb', border: `1px solid ${TEAL}40`,
            borderRadius: 12, padding: 20, marginTop: 16,
        }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: NAVY, marginBottom: 16 }}>
                <i className="fas fa-plus-circle" style={{ color: TEAL, marginRight: 8 }} />
                Ajouter une tache
            </h4>

            {err && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
                    {err}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Titre *</label>
                    <input
                        value={form.title}
                        onChange={e => set('title', e.target.value)}
                        placeholder="Ex: Reviser le chapitre 3..."
                        style={inputStyle}
                    />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Description</label>
                    <textarea
                        value={form.description}
                        onChange={e => set('description', e.target.value)}
                        placeholder="Details optionnels..."
                        rows={2}
                        style={{ ...inputStyle, resize: 'vertical' }}
                    />
                </div>
                <div>
                    <label style={labelStyle}>Date</label>
                    <input
                        type="date"
                        value={form.due_date}
                        onChange={e => set('due_date', e.target.value)}
                        style={inputStyle}
                    />
                </div>
                <div>
                    <label style={labelStyle}>Type</label>
                    <select value={form.type} onChange={e => set('type', e.target.value)} style={inputStyle}>
                        {Object.entries(TYPE_COLORS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={labelStyle}>Priorite</label>
                    <select value={form.priority} onChange={e => set('priority', e.target.value)} style={inputStyle}>
                        <option value="high">Haute</option>
                        <option value="medium">Moyenne</option>
                        <option value="low">Basse</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
                <button
                    onClick={submit}
                    disabled={saving}
                    style={{
                        background: TEAL, color: 'white', border: 'none',
                        padding: '9px 20px', borderRadius: 8, fontWeight: 700,
                        fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.7 : 1,
                    }}
                >
                    {saving ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }} />Ajout...</> : 'Ajouter'}
                </button>
                <button
                    onClick={onCancel}
                    style={{
                        background: 'white', color: '#6b7280', border: '1px solid #e5e7eb',
                        padding: '9px 16px', borderRadius: 8, fontWeight: 600,
                        fontSize: 13, cursor: 'pointer',
                    }}
                >
                    Annuler
                </button>
            </div>
        </div>
    );
}

// ── Tab 1: Aujourd'hui ────────────────────────────────────────────────────────

function TodayTab() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        setLoading(true);
        api.get('/api/study-plans/today')
            .then(r => setData(r.data.data || r.data))
            .catch(() => setData({ tasks: [] }))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const tasks = data?.tasks || [];
    const total = tasks.length;
    const completed = tasks.filter(t => t.is_completed).length;

    const toggleTask = async (task) => {
        // Optimistic update
        setData(prev => ({
            ...prev,
            tasks: prev.tasks.map(t =>
                t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
            ),
        }));
        try {
            await api.patch(`/api/study-plans/${task.plan_id}/tasks/${task.id}/toggle`);
        } catch {
            // Revert on error
            setData(prev => ({
                ...prev,
                tasks: prev.tasks.map(t =>
                    t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
                ),
            }));
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: 28, marginBottom: 12, color: TEAL }} />
                <p style={{ fontSize: 14 }}>Chargement des taches...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header card */}
            <div style={{
                background: 'white', borderRadius: 16, padding: 24,
                border: '1px solid #f0f0f0', marginBottom: 20,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: NAVY, margin: 0 }}>
                            <i className="fas fa-tasks" style={{ color: TEAL, marginRight: 10 }} />
                            Taches du jour
                        </h2>
                        <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0', textTransform: 'capitalize' }}>
                            {todayLabel()}
                        </p>
                    </div>
                    <span style={{
                        background: '#e8f8f7', color: TEAL, fontWeight: 800,
                        padding: '6px 14px', borderRadius: 20, fontSize: 14,
                    }}>
                        {total} tache{total !== 1 ? 's' : ''}
                    </span>
                </div>

                {total > 0 && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
                                {completed}/{total} completees
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: TEAL }}>
                                {Math.round((completed / total) * 100)}%
                            </span>
                        </div>
                        <ProgressBar completed={completed} total={total} />
                    </>
                )}
            </div>

            {/* Tasks */}
            {tasks.length === 0 ? (
                <div style={{
                    background: 'white', borderRadius: 16, padding: 60,
                    border: '1px solid #f0f0f0', textAlign: 'center',
                }}>
                    <i className="fas fa-couch" style={{ fontSize: 40, color: '#e5e7eb', marginBottom: 16 }} />
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
                        Aucune tache pour aujourd'hui
                    </h3>
                    <p style={{ fontSize: 13, color: '#9ca3af' }}>
                        Profitez de votre journee ou generez un plan d'etude !
                    </p>
                </div>
            ) : (
                <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                    {tasks.map(task => (
                        <TaskCard key={task.id} task={task} onToggle={toggleTask} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Plan Detail View ──────────────────────────────────────────────────────────

function PlanDetail({ planId, onBack, onDeleted }) {
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        api.get(`/api/study-plans/${planId}`)
            .then(r => setPlan(r.data.data || r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [planId]);

    useEffect(() => { load(); }, [load]);

    const toggleTask = async (task) => {
        // Optimistic update
        setPlan(prev => ({
            ...prev,
            tasks: prev.tasks.map(t =>
                t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
            ),
        }));
        try {
            await api.patch(`/api/study-plans/${planId}/tasks/${task.id}/toggle`);
        } catch {
            setPlan(prev => ({
                ...prev,
                tasks: prev.tasks.map(t =>
                    t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
                ),
            }));
        }
    };

    const handleTaskAdded = (newTask) => {
        setPlan(prev => ({ ...prev, tasks: [...(prev.tasks || []), newTask] }));
        setShowAddForm(false);
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/api/study-plans/${planId}`);
            onDeleted();
        } catch {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: 28, color: TEAL, marginBottom: 12 }} />
                <p style={{ fontSize: 14 }}>Chargement du plan...</p>
            </div>
        );
    }

    if (!plan) {
        return (
            <div style={{ textAlign: 'center', padding: 60 }}>
                <p style={{ color: '#9ca3af' }}>Plan introuvable.</p>
                <button onClick={onBack} style={{ marginTop: 12, color: TEAL, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                    &larr; Retour
                </button>
            </div>
        );
    }

    const tasks = plan.tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.is_completed).length;
    const grouped = groupByDate(tasks);
    const sortedDates = Object.keys(grouped).sort();
    const statusCfg = STATUS_STYLE[plan.status] || STATUS_STYLE.active;

    return (
        <div>
            {/* Back button */}
            <button
                onClick={onBack}
                style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#6b7280', fontWeight: 600, fontSize: 14, marginBottom: 20,
                    padding: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.color = TEAL}
                onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
            >
                <i className="fas fa-arrow-left" />
                Retour aux plans
            </button>

            {/* Plan header card */}
            <div style={{
                background: 'white', borderRadius: 16, padding: 24,
                border: '1px solid #f0f0f0', marginBottom: 20,
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span style={{
                                background: statusCfg.bg, color: statusCfg.color,
                                fontWeight: 700, fontSize: 11, padding: '4px 10px', borderRadius: 20,
                            }}>
                                {statusCfg.label}
                            </span>
                            {plan.category_name && (
                                <span style={{
                                    background: '#e8f8f7', color: TEAL,
                                    fontWeight: 600, fontSize: 11, padding: '4px 10px', borderRadius: 20,
                                }}>
                                    {plan.category_name}
                                </span>
                            )}
                        </div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: '0 0 6px' }}>
                            {plan.title}
                        </h2>
                        {plan.description && (
                            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px', lineHeight: 1.5 }}>
                                {plan.description}
                            </p>
                        )}
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#9ca3af' }}>
                            {plan.start_date && (
                                <span>
                                    <i className="fas fa-calendar-alt" style={{ marginRight: 5, color: TEAL }} />
                                    Du {fmtDate(plan.start_date)}
                                    {plan.end_date ? ` au ${fmtDate(plan.end_date)}` : ''}
                                </span>
                            )}
                            <span>
                                <i className="fas fa-check-circle" style={{ marginRight: 5, color: TEAL }} />
                                {completedTasks}/{totalTasks} taches completees
                            </span>
                        </div>
                    </div>
                </div>

                {totalTasks > 0 && (
                    <div style={{ marginTop: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Progression</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: TEAL }}>
                                {Math.round((completedTasks / totalTasks) * 100)}%
                            </span>
                        </div>
                        <ProgressBar completed={completedTasks} total={totalTasks} />
                    </div>
                )}
            </div>

            {/* Tasks grouped by date */}
            {sortedDates.length === 0 ? (
                <div style={{
                    background: 'white', borderRadius: 16, padding: 40,
                    border: '1px solid #f0f0f0', textAlign: 'center',
                }}>
                    <i className="fas fa-clipboard" style={{ fontSize: 32, color: '#e5e7eb', marginBottom: 12 }} />
                    <p style={{ fontSize: 14, color: '#9ca3af' }}>Aucune tache dans ce plan.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
                    {sortedDates.map(dateKey => (
                        <div key={dateKey} style={{
                            background: 'white', borderRadius: 16,
                            border: '1px solid #f0f0f0', overflow: 'hidden',
                        }}>
                            {/* Date header */}
                            <div style={{
                                padding: '12px 18px',
                                background: 'linear-gradient(90deg, #f8fafb, white)',
                                borderBottom: '1px solid #f3f4f6',
                                display: 'flex', alignItems: 'center', gap: 10,
                            }}>
                                <i className="fas fa-calendar-day" style={{ color: TEAL, fontSize: 13 }} />
                                <span style={{ fontSize: 13, fontWeight: 700, color: NAVY, textTransform: 'capitalize' }}>
                                    {dateKey === 'sans-date' ? 'Sans date' : fmtDateLong(dateKey)}
                                </span>
                                <span style={{
                                    background: '#e8f8f7', color: TEAL, fontSize: 11,
                                    fontWeight: 700, padding: '2px 8px', borderRadius: 12, marginLeft: 'auto',
                                }}>
                                    {grouped[dateKey].length}
                                </span>
                            </div>

                            {/* Tasks under this date */}
                            {grouped[dateKey].map(task => (
                                <TaskCard key={task.id} task={task} onToggle={toggleTask} compact />
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Add task */}
            {showAddForm ? (
                <AddTaskForm
                    planId={planId}
                    onAdded={handleTaskAdded}
                    onCancel={() => setShowAddForm(false)}
                />
            ) : (
                <button
                    onClick={() => setShowAddForm(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'white', border: `2px dashed ${TEAL}60`,
                        borderRadius: 12, padding: '14px 20px',
                        width: '100%', cursor: 'pointer', color: TEAL,
                        fontWeight: 700, fontSize: 14, justifyContent: 'center',
                        transition: 'all .2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.background = '#f0fffe'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = `${TEAL}60`; e.currentTarget.style.background = 'white'; }}
                >
                    <i className="fas fa-plus-circle" />
                    Ajouter une tache
                </button>
            )}

            {/* Delete plan */}
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
                {confirmDelete ? (
                    <div style={{
                        background: '#fef2f2', border: '1px solid #fca5a5',
                        borderRadius: 12, padding: 16, display: 'inline-flex',
                        flexDirection: 'column', alignItems: 'center', gap: 12,
                    }}>
                        <p style={{ margin: 0, fontSize: 14, color: '#dc2626', fontWeight: 600 }}>
                            Supprimer ce plan definitivement ?
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                style={{
                                    background: '#EF4444', color: 'white', border: 'none',
                                    padding: '8px 18px', borderRadius: 8, fontWeight: 700,
                                    fontSize: 13, cursor: deleting ? 'not-allowed' : 'pointer',
                                    opacity: deleting ? 0.7 : 1,
                                }}
                            >
                                {deleting ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }} />Suppression...</> : 'Confirmer'}
                            </button>
                            <button
                                onClick={() => setConfirmDelete(false)}
                                style={{
                                    background: 'white', color: '#6b7280', border: '1px solid #e5e7eb',
                                    padding: '8px 16px', borderRadius: 8, fontWeight: 600,
                                    fontSize: 13, cursor: 'pointer',
                                }}
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setConfirmDelete(true)}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#EF4444', fontWeight: 600, fontSize: 13,
                            textDecoration: 'underline',
                        }}
                    >
                        <i className="fas fa-trash-alt" style={{ marginRight: 6 }} />
                        Supprimer ce plan
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Tab 2: Mes plans ──────────────────────────────────────────────────────────

function PlansTab({ jumpToPlanId, clearJumpId }) {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        api.get('/api/study-plans')
            .then(r => setPlans(r.data.data || r.data || []))
            .catch(() => setPlans([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    // When a new plan was generated, jump to its detail view
    useEffect(() => {
        if (jumpToPlanId) {
            setSelectedId(jumpToPlanId);
            clearJumpId();
            // Reload list to include new plan
            load();
        }
    }, [jumpToPlanId, clearJumpId, load]);

    const handleDeleted = () => {
        setSelectedId(null);
        load();
    };

    if (selectedId) {
        return (
            <PlanDetail
                planId={selectedId}
                onBack={() => setSelectedId(null)}
                onDeleted={handleDeleted}
            />
        );
    }

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: 28, color: TEAL, marginBottom: 12 }} />
                <p style={{ fontSize: 14 }}>Chargement des plans...</p>
            </div>
        );
    }

    if (plans.length === 0) {
        return (
            <div style={{
                background: 'white', borderRadius: 16, padding: 60,
                border: '1px solid #f0f0f0', textAlign: 'center',
            }}>
                <i className="fas fa-calendar-plus" style={{ fontSize: 40, color: '#e5e7eb', marginBottom: 16 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
                    Aucun plan d'etude
                </h3>
                <p style={{ fontSize: 13, color: '#9ca3af' }}>
                    Generez un plan avec l'IA ou creez-en un manuellement.
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {plans.map(plan => {
                const total = plan.tasks_count || 0;
                const done = plan.completed_tasks_count || 0;
                const statusCfg = STATUS_STYLE[plan.status] || STATUS_STYLE.active;

                return (
                    <div
                        key={plan.id}
                        onClick={() => setSelectedId(plan.id)}
                        style={{
                            background: 'white', borderRadius: 16, padding: 22,
                            border: '1px solid #f0f0f0', cursor: 'pointer',
                            transition: 'all .2s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(91,188,180,0.12)';
                            e.currentTarget.style.borderColor = TEAL;
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.borderColor = '#f0f0f0';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                                    <span style={{
                                        background: statusCfg.bg, color: statusCfg.color,
                                        fontWeight: 700, fontSize: 11, padding: '3px 10px', borderRadius: 20,
                                    }}>
                                        {statusCfg.label}
                                    </span>
                                    {plan.category_name && (
                                        <span style={{
                                            background: '#e8f8f7', color: TEAL,
                                            fontWeight: 600, fontSize: 11, padding: '3px 10px', borderRadius: 20,
                                        }}>
                                            {plan.category_name}
                                        </span>
                                    )}
                                </div>
                                <h3 style={{ fontSize: 17, fontWeight: 800, color: NAVY, margin: '0 0 6px', lineHeight: 1.3 }}>
                                    {plan.title}
                                </h3>
                                {plan.description && (
                                    <p style={{
                                        fontSize: 13, color: '#6b7280', margin: '0 0 10px',
                                        lineHeight: 1.5,
                                        display: '-webkit-box', WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                    }}>
                                        {plan.description}
                                    </p>
                                )}
                                {(plan.start_date || plan.end_date) && (
                                    <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 12px' }}>
                                        <i className="fas fa-calendar-alt" style={{ marginRight: 5, color: TEAL }} />
                                        {plan.start_date && `Du ${fmtDate(plan.start_date)}`}
                                        {plan.end_date && ` au ${fmtDate(plan.end_date)}`}
                                    </p>
                                )}
                                {total > 0 && (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ fontSize: 12, color: '#6b7280' }}>
                                                {done}/{total} taches completees
                                            </span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: TEAL }}>
                                                {Math.round((done / total) * 100)}%
                                            </span>
                                        </div>
                                        <ProgressBar completed={done} total={total} />
                                    </>
                                )}
                            </div>
                            <i className="fas fa-chevron-right" style={{ color: '#d1d5db', fontSize: 14, marginTop: 4, flexShrink: 0 }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Tab 3: Generer un plan ────────────────────────────────────────────────────

function GenerateTab({ onPlanGenerated }) {
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({ category_id: '', exam_date: '', hours_per_day: 2 });
    const [loading, setLoading] = useState(false);
    const [loadingCats, setLoadingCats] = useState(true);
    const [error, setError] = useState('');
    const [dotCount, setDotCount] = useState(0);

    useEffect(() => {
        api.get('/api/public/categories')
            .then(r => setCategories(r.data.data || r.data || []))
            .catch(() => {})
            .finally(() => setLoadingCats(false));
    }, []);

    // Animate dots during loading
    useEffect(() => {
        if (!loading) return;
        const interval = setInterval(() => {
            setDotCount(d => (d + 1) % 4);
        }, 500);
        return () => clearInterval(interval);
    }, [loading]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const generate = async () => {
        if (!form.category_id) { setError('Veuillez selectionner une filiere.'); return; }
        if (!form.exam_date)   { setError('Veuillez indiquer la date d\'examen.'); return; }
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/api/study-plans/generate', {
                category_id: form.category_id,
                exam_date: form.exam_date,
                hours_per_day: form.hours_per_day,
            });
            const newPlan = res.data.data || res.data;
            onPlanGenerated(newPlan.id);
        } catch (e) {
            setError(e?.response?.data?.message || 'Erreur lors de la generation. Veuillez reessayer.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '11px 14px', borderRadius: 10,
        border: '1px solid #e5e7eb', fontSize: 14, color: NAVY,
        outline: 'none', boxSizing: 'border-box', background: 'white',
    };
    const labelStyle = { fontSize: 13, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 6 };

    if (loading) {
        return (
            <div style={{
                background: 'white', borderRadius: 20, padding: 60,
                border: '1px solid #f0f0f0', textAlign: 'center',
            }}>
                {/* Animated pulse ring */}
                <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 24px' }}>
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        border: `3px solid ${TEAL}30`,
                        animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                    }} />
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${TEAL}, #3daaa3)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 30,
                    }}>
                        <i className="fas fa-robot" style={{ color: 'white' }} />
                    </div>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: NAVY, marginBottom: 10 }}>
                    L'IA prepare votre plan personnalise{'.'.repeat(dotCount)}
                </h3>
                <p style={{ fontSize: 13, color: '#9ca3af', maxWidth: 360, margin: '0 auto' }}>
                    Notre IA analyse votre programme et construit un plan d'etude adapte a vos besoins. Cela peut prendre 10 a 20 secondes.
                </p>
                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 8 }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: TEAL,
                            opacity: dotCount === i ? 1 : 0.3,
                            transition: 'opacity .3s',
                        }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{
                background: 'white', borderRadius: 20, padding: 32,
                border: '1px solid #f0f0f0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}>
                {/* Card header */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28,
                    paddingBottom: 20, borderBottom: '1px solid #f3f4f6',
                }}>
                    <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        background: 'linear-gradient(135deg, #5BBCB4, #3daaa3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22,
                    }}>
                        <i className="fas fa-magic" style={{ color: 'white' }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: NAVY, margin: 0 }}>
                            Generer un plan IA
                        </h3>
                        <p style={{ fontSize: 13, color: '#9ca3af', margin: '3px 0 0' }}>
                            Laissez l'IA organiser vos revisions
                        </p>
                    </div>
                </div>

                {error && (
                    <div style={{
                        background: '#fee2e2', color: '#dc2626', padding: '12px 16px',
                        borderRadius: 10, fontSize: 13, marginBottom: 20,
                        border: '1px solid #fca5a5',
                    }}>
                        <i className="fas fa-exclamation-circle" style={{ marginRight: 8 }} />
                        {error}
                    </div>
                )}

                {/* Form fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {/* Category */}
                    <div>
                        <label style={labelStyle}>
                            <i className="fas fa-graduation-cap" style={{ color: TEAL, marginRight: 7 }} />
                            Filiere / Matiere *
                        </label>
                        {loadingCats ? (
                            <div style={{ ...inputStyle, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <i className="fas fa-spinner fa-spin" /> Chargement...
                            </div>
                        ) : (
                            <select
                                value={form.category_id}
                                onChange={e => set('category_id', e.target.value)}
                                style={inputStyle}
                            >
                                <option value="">-- Choisir une filiere --</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Exam date */}
                    <div>
                        <label style={labelStyle}>
                            <i className="fas fa-calendar-times" style={{ color: TEAL, marginRight: 7 }} />
                            Date d'examen *
                        </label>
                        <input
                            type="date"
                            value={form.exam_date}
                            onChange={e => set('exam_date', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            style={inputStyle}
                        />
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>
                            L'IA planifiera les sessions jusqu'a cette date.
                        </p>
                    </div>

                    {/* Hours per day */}
                    <div>
                        <label style={labelStyle}>
                            <i className="fas fa-clock" style={{ color: TEAL, marginRight: 7 }} />
                            Heures d'etude par jour
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input
                                type="number"
                                value={form.hours_per_day}
                                onChange={e => set('hours_per_day', Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                                min={1}
                                max={12}
                                style={{ ...inputStyle, width: 100 }}
                            />
                            <span style={{ fontSize: 13, color: '#6b7280' }}>heure{form.hours_per_day > 1 ? 's' : ''} / jour</span>
                        </div>
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>
                            Entre 1 et 12 heures par jour.
                        </p>
                    </div>
                </div>

                {/* Divider */}
                <div style={{ margin: '24px 0', borderTop: '1px solid #f3f4f6' }} />

                {/* Info block */}
                <div style={{
                    background: '#f0fffe', border: `1px solid ${TEAL}30`,
                    borderRadius: 10, padding: '12px 16px', marginBottom: 24,
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                    <i className="fas fa-info-circle" style={{ color: TEAL, marginTop: 2, flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.6 }}>
                        L'IA va analyser votre filiere et generer un plan de revision personnalise avec des taches quotidiennes, des quiz, et des sessions d'exercices.
                    </p>
                </div>

                {/* Submit button */}
                <button
                    onClick={generate}
                    style={{
                        width: '100%', padding: '14px',
                        background: `linear-gradient(135deg, ${TEAL}, #3daaa3)`,
                        color: 'white', border: 'none', borderRadius: 12,
                        fontWeight: 800, fontSize: 15, cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(91,188,180,0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        transition: 'all .2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <i className="fas fa-magic" />
                    Generer mon plan d'etude
                </button>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

const TABS = [
    { key: 'today',    label: "Aujourd'hui",    icon: 'fas fa-sun'         },
    { key: 'plans',    label: 'Mes plans',       icon: 'fas fa-list-alt'   },
    { key: 'generate', label: 'Generer un plan', icon: 'fas fa-magic'      },
];

export default function StudyPlanner() {
    const { t } = useLang();
    const [activeTab, setActiveTab] = useState('today');
    const [jumpToPlanId, setJumpToPlanId] = useState(null);

    const handlePlanGenerated = useCallback((planId) => {
        setJumpToPlanId(planId);
        setActiveTab('plans');
    }, []);

    const clearJumpId = useCallback(() => setJumpToPlanId(null), []);

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh', paddingBottom: 60 }}>

            {/* ── HEADER ── */}
            <section style={{
                background: 'linear-gradient(135deg, #1B2A4A 0%, #1f3460 50%, #5BBCB4 150%)',
                padding: '44px 0 52px',
            }}>
                <div style={{ ...W }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                                <div style={{
                                    width: 52, height: 52, borderRadius: 14,
                                    background: 'rgba(91,188,180,0.2)',
                                    border: '1px solid rgba(91,188,180,0.35)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 22, color: TEAL,
                                }}>
                                    <i className="fas fa-calendar-check" />
                                </div>
                                <div>
                                    <span style={{ color: TEAL, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, display: 'block' }}>
                                        INSAM-IA
                                    </span>
                                    <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.2 }}>
                                        Planification Intelligente
                                    </h1>
                                </div>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, margin: 0, maxWidth: 460 }}>
                                Organisez vos revisions avec l'aide de l'IA
                            </p>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 12, padding: '12px 18px',
                            textAlign: 'right',
                        }}>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 }}>
                                Aujourd'hui
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'white', textTransform: 'capitalize' }}>
                                {todayLabel()}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TABS ── */}
            <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ ...W }}>
                    <div style={{ display: 'flex', gap: 0 }}>
                        {TABS.map(tab => {
                            const active = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '16px 22px', border: 'none', background: 'none',
                                        cursor: 'pointer', fontSize: 14, fontWeight: active ? 800 : 600,
                                        color: active ? TEAL : '#6b7280',
                                        borderBottom: active ? `3px solid ${TEAL}` : '3px solid transparent',
                                        transition: 'all .2s', whiteSpace: 'nowrap',
                                    }}
                                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = NAVY; }}
                                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#6b7280'; }}
                                >
                                    <i className={tab.icon} style={{ fontSize: 13 }} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── TAB CONTENT ── */}
            <div style={{ ...W, marginTop: 32 }}>
                {activeTab === 'today' && <TodayTab />}
                {activeTab === 'plans' && (
                    <PlansTab jumpToPlanId={jumpToPlanId} clearJumpId={clearJumpId} />
                )}
                {activeTab === 'generate' && (
                    <GenerateTab onPlanGenerated={handlePlanGenerated} />
                )}
            </div>
        </div>
    );
}
