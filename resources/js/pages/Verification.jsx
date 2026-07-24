import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';

function renderMd(md) {
    if (!md) return '';
    let html = md;
    // Tables
    html = html.replace(/((?:^\|.+\|$\n?)+)/gm, (block) => {
        const rows = block.trim().split('\n').filter(r => r.trim());
        if (rows.length < 2) return block;
        const isSep = /^\|[\s\-:]+\|$/.test(rows[1]);
        let t = '<table class="vt"><thead><tr>';
        rows[0].split('|').filter(c => c.trim()).forEach(c => { t += `<th>${c.trim()}</th>`; });
        t += '</tr></thead><tbody>';
        for (let i = isSep ? 2 : 1; i < rows.length; i++) {
            const cells = rows[i].split('|').filter(c => c.trim());
            if (!cells.length) continue;
            t += '<tr>'; cells.forEach(c => { t += `<td>${c.trim()}</td>`; }); t += '</tr>';
        }
        return t + '</tbody></table>';
    });
    html = html.replace(/^#### (.+)$/gm, '<h4 class="vh4">$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3 class="vh3">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="vh2">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="vh1">$1</h1>');
    html = html.replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code style="background:#edf2f7;padding:2px 6px;border-radius:4px;font-size:12px;">$1</code>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
    html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="oli">$1</li>');
    html = html.replace(/((?:<li class="oli">[\s\S]*?<\/li>\s*)+)/g, m => `<ol style="margin:8px 0 8px 20px;">${m.replace(/ class="oli"/g, '')}</ol>`);
    html = html.replace(/((?:<li>[\s\S]*?<\/li>\s*)+)/g, m => m.includes('<ol') ? m : `<ul style="margin:8px 0 8px 20px;">${m}</ul>`);
    html = html.replace(/\n{2,}/g, '</p><p style="margin:0 0 10px;line-height:1.75;color:#374151;">');
    html = html.replace(/\n/g, '<br>');
    return `<p style="margin:0 0 10px;line-height:1.75;color:#374151;">${html}</p>`;
}

const vCSS = `
.v-page { min-height:calc(100vh - 70px); background:#F8FAFB; }
.v-header { background:linear-gradient(135deg, ${NAVY} 0%, #2d4270 50%, ${TEAL} 100%); padding:40px 0; }
.v-wrap { max-width:1200px; margin:0 auto; padding:0 24px; }
.v-split { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:24px; }
.v-panel { background:white; border-radius:16px; border:1px solid #f0f0f0; overflow:hidden; display:flex; flex-direction:column; }
.v-panel-head { padding:14px 20px; display:flex; align-items:center; gap:10px; border-bottom:1px solid #f0f0f0; }
.v-panel-body { flex:1; padding:0; }
.v-panel textarea { width:100%; height:280px; border:none; outline:none; resize:vertical; padding:16px 20px; font-family:inherit; font-size:13px; line-height:1.7; color:#1e293b; }
.v-result { background:white; border-radius:16px; border:1px solid #f0f0f0; margin-top:20px; overflow:hidden; }
.v-result-head { padding:16px 24px; border-bottom:1px solid #f0f0f0; display:flex; align-items:center; gap:10px; }
.v-result-body { padding:24px; font-size:14px; line-height:1.85; color:#374151; }
.v-result-body strong { color:${NAVY}; }
.v-result-body .vh1 { font-size:20px; font-weight:800; color:${NAVY}; margin:28px 0 12px; padding-bottom:8px; border-bottom:3px solid ${TEAL}; }
.v-result-body .vh2 { font-size:16px; font-weight:700; color:${NAVY}; margin:22px 0 10px; padding-left:12px; border-left:4px solid ${TEAL}; }
.v-result-body .vh3 { font-size:14px; font-weight:700; color:#2d4270; margin:16px 0 6px; }
.v-result-body .vh4 { font-size:13px; font-weight:700; color:${TEAL}; margin:12px 0 4px; }
.v-result-body ul, .v-result-body ol { margin:8px 0 8px 20px; }
.v-result-body li { margin:5px 0; line-height:1.7; }
.v-result-body .vt { width:100%; border-collapse:collapse; margin:14px 0; font-size:13px; }
.v-result-body .vt th { background:${NAVY}; color:white; padding:9px 14px; text-align:left; font-weight:600; font-size:11px; text-transform:uppercase; }
.v-result-body .vt td { padding:8px 14px; border:1px solid #e2e8f0; }
.v-result-body .vt tr:nth-child(even) td { background:#f7fafc; }
.v-select { width:100%; padding:10px 14px; border:1.5px solid #e5e7eb; border-radius:10px; font-family:inherit; font-size:13px; color:${NAVY}; outline:none; background:white; cursor:pointer; }
.v-select:focus { border-color:${TEAL}; }
@media(max-width:768px){
  .v-split { grid-template-columns:1fr; }
  .v-panel textarea { height:200px; }
}
`;

export default function Verification() {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [selectedCat, setSelectedCat] = useState('');
    const [ues, setUes] = useState([]);
    const [selectedUe, setSelectedUe] = useState('');
    const [syllabus, setSyllabus] = useState('');
    const [support, setSupport] = useState('');
    const [supportFile, setSupportFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch categories
    useEffect(() => {
        api.get('/api/public/categories').then(r => {
            const cats = r.data?.categories || r.data?.data || r.data || [];
            setCategories(Array.isArray(cats) ? cats : []);
        }).catch(() => {});
    }, []);

    // Fetch UEs when category changes
    useEffect(() => {
        if (!selectedCat) { setUes([]); return; }
        api.get(`/api/public/categories/${selectedCat}/cours`).then(r => {
            setUes(r.data?.ues || []);
        }).catch(() => setUes([]));
    }, [selectedCat]);

    // Load syllabus when UE changes
    useEffect(() => {
        if (!selectedUe) { setSyllabus(''); return; }
        const ue = ues.find(u => String(u.id) === String(selectedUe));
        if (ue?.knowledge_documents?.length) {
            const doc = ue.knowledge_documents[0];
            api.get(`/api/public/documents/${doc.id}`).then(r => {
                const content = r.data?.document?.content || r.data?.content || '';
                setSyllabus(content);
            }).catch(() => {});
        }
    }, [selectedUe]);

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSupportFile(file);
        const reader = new FileReader();
        reader.onload = () => setSupport(reader.result);
        reader.readAsText(file);
    };

    const handleVerify = async () => {
        if (!syllabus.trim() && !support.trim()) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await api.post('/api/exams/verify-syllabus', {
                syllabus: syllabus,
                support: support,
                ue_name: ues.find(u => String(u.id) === String(selectedUe))?.nom || '',
                category_name: categories.find(c => String(c.id) === String(selectedCat))?.name || '',
            });
            setResult(res.data?.analysis || res.data?.result || '');
        } catch {
            setResult('Erreur lors de la verification. Veuillez reessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="v-page">
            <style>{vCSS}</style>

            {/* Header */}
            <div className="v-header">
                <div className="v-wrap">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-check-double" style={{ fontSize: 22, color: 'white' }}></i>
                        </div>
                        <div>
                            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', margin: 0 }}>Verification de conformite</h1>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: '4px 0 0' }}>
                                Verifiez si le support de cours couvre tous les points du syllabus ministeriel
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="v-wrap" style={{ padding: '24px 24px 60px' }}>

                {/* Category & UE selection */}
                <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>Formation</label>
                        <select className="v-select" value={selectedCat} onChange={e => { setSelectedCat(e.target.value); setSelectedUe(''); setSyllabus(''); }}>
                            <option value="">Selectionnez une formation...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>Unite d'Enseignement</label>
                        <select className="v-select" value={selectedUe} onChange={e => setSelectedUe(e.target.value)} disabled={!ues.length}>
                            <option value="">Selectionnez une UE...</option>
                            {ues.map(u => <option key={u.id} value={u.id}>{u.nom} {u.code ? `(${u.code})` : ''}</option>)}
                        </select>
                    </div>
                </div>

                {/* Split: Syllabus left | Support right */}
                <div className="v-split">
                    {/* LEFT: Syllabus ministeriel */}
                    <div className="v-panel">
                        <div className="v-panel-head" style={{ background: `${NAVY}08` }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${NAVY}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-landmark" style={{ fontSize: 14, color: NAVY }}></i>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>Syllabus ministeriel</div>
                                <div style={{ fontSize: 10, color: '#9ca3af' }}>Programme officiel du ministere</div>
                            </div>
                        </div>
                        <div className="v-panel-body">
                            <textarea
                                value={syllabus}
                                onChange={e => setSyllabus(e.target.value)}
                                placeholder={"Collez ici le syllabus du ministere...\n\nExemple:\n1. Magnetostatique\n2. Phenomene d'induction electromagnetique\n3. Dynamique des particules chargees\n..."}
                            />
                        </div>
                    </div>

                    {/* RIGHT: Support de cours */}
                    <div className="v-panel">
                        <div className="v-panel-head" style={{ background: `${TEAL}08` }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${TEAL}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-book-open" style={{ fontSize: 14, color: TEAL }}></i>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>Support de cours</div>
                                <div style={{ fontSize: 10, color: '#9ca3af' }}>Document du professeur / enseignant</div>
                            </div>
                            <label style={{
                                fontSize: 10, fontWeight: 600, padding: '5px 10px', borderRadius: 8,
                                background: '#f3f4f6', color: '#6b7280', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                                <i className="fas fa-upload" style={{ fontSize: 9 }}></i> Importer
                                <input type="file" accept=".txt,.md,.text" onChange={handleFileUpload} style={{ display: 'none' }} />
                            </label>
                        </div>
                        <div className="v-panel-body">
                            <textarea
                                value={support}
                                onChange={e => setSupport(e.target.value)}
                                placeholder={"Collez ici le contenu du support de cours...\n\nOu importez un fichier texte avec le bouton ci-dessus.\n\nExemple:\nChapitre 1: Magnetostatique\n1.1 Definition du champ magnetique\n1.2 Loi de Biot-Savart\n..."}
                            />
                        </div>
                    </div>
                </div>

                {/* Verify button */}
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <button
                        onClick={handleVerify}
                        disabled={loading || (!syllabus.trim() && !support.trim())}
                        style={{
                            background: loading ? '#d1d5db' : `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                            color: 'white', border: 'none', borderRadius: 14,
                            padding: '14px 40px', fontSize: 15, fontWeight: 700,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                            boxShadow: loading ? 'none' : '0 4px 16px rgba(91,188,180,0.35)',
                            display: 'inline-flex', alignItems: 'center', gap: 10,
                            transition: 'all .2s',
                        }}
                    >
                        {loading ? (
                            <><i className="fas fa-circle-notch fa-spin"></i> Analyse en cours...</>
                        ) : (
                            <><i className="fas fa-search-plus"></i> Verifier la conformite</>
                        )}
                    </button>
                    {!loading && (
                        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
                            L'IA comparera les deux documents et identifiera les ecarts
                        </p>
                    )}
                </div>

                {/* Results */}
                {result && (
                    <div className="v-result">
                        <div className="v-result-head" style={{ background: `${TEAL}08` }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${TEAL}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-clipboard-check" style={{ fontSize: 16, color: TEAL }}></i>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>Rapport de verification</div>
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>Analyse de conformite par l'IA</div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#e8f8f5', color: TEAL }}>
                                <i className="fas fa-robot" style={{ marginRight: 4 }}></i>IA
                            </span>
                        </div>
                        <div className="v-result-body" dangerouslySetInnerHTML={{ __html: renderMd(result) }} />
                    </div>
                )}
            </div>
        </div>
    );
}
