import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Sparkles, 
    ArrowRight, 
    Mountain, 
    Wind, 
    Waves, 
    Network, 
    X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Explorer() {
    const { token, updateUserScore } = useAuth();
    const [algorithms, setAlgorithms] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [repoUrl, setRepoUrl] = useState('');
    const [loadingIngest, setLoadingIngest] = useState(false);
    
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:3001/api/algorithms')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAlgorithms(data);
                }
            })
            .catch(err => console.error(err));
    }, []);

    const handleIngest = async (e) => {
        e.preventDefault();

        if (!token) {
            alert('You must be logged in to create an algorithm simulation.');
            setShowModal(false);
            navigate('/login');
            return;
        }

        const parseGitHubUrl = (url) => {
            if (!url) return null;
            const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/i);
            if (!match) return null;
            const owner = match[1].toLowerCase();
            const repo = match[2].replace(/\.git$/, '').replace(/\/$/, '').toLowerCase();
            return `${owner}/${repo}`;
        };

        const targetRepoKey = parseGitHubUrl(repoUrl);
        if (!targetRepoKey) {
            alert('Invalid GitHub URL. Please provide a valid URL like: https://github.com/owner/repo');
            return;
        }

        const isDuplicate = algorithms.some(algo => {
            const key = parseGitHubUrl(algo.repo_url);
            return key === targetRepoKey;
        });

        if (isDuplicate) {
            alert('This algorithm repository has already been imported.');
            return;
        }

        setLoadingIngest(true);

        try {
            const res = await fetch('http://localhost:3001/api/algorithms/ingest', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ repoUrl })
            });
            const data = await res.json();
            if (res.ok) {
                setShowModal(false);
                setRepoUrl('');
                if (data.contribution_score !== undefined) {
                    updateUserScore(data.contribution_score);
                }
                navigate(`/algorithm/${data.slug}`);
            } else {
                alert(data.error || 'Ingestion failed');
            }
        } catch (err) {
            console.error(err);
            alert('A network error occurred while ingesting the repository.');
        } finally {
            setLoadingIngest(false);
        }
    };

    // Visual helpers
    const getIconForAlgo = (name) => {
        if (!name) return <Network size={20} />;
        const n = name.toLowerCase();
        if (n.includes('ant')) return <Mountain size={20} />;
        if (n.includes('bee')) return <Wind size={20} />;
        if (n.includes('slime')) return <Waves size={20} />;
        return <Network size={20} />;
    };

    const getTagForAlgo = (name) => {
        if (!name) return "System Protocol";
        const n = name.toLowerCase();
        if (n.includes('ant')) return "Lithic Stability";
        if (n.includes('bee')) return "Aetherial Search";
        if (n.includes('slime')) return "Fluidic Matrix";
        return "Neural Convergence";
    };

    return (
        <div className="animate-fade-in" style={{ padding: '3.5rem 2rem 6rem 2rem', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

            {/* HERO / MOTIVATIONAL SECTION */}
            <div style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto 4rem auto' }}>
                <h1 className="hero-title" style={{ fontSize: '3.5rem', marginBottom: '1.25rem', lineHeight: '1.2' }}>
                    Discover &amp; Create <br />
                    <span>Swarm Intelligence Algorithms</span>
                </h1>
                <p className="text-muted" style={{ fontSize: '1.15rem', lineHeight: '1.6', maxWidth: '650px', margin: '0 auto' }}>
                    Explore nature-inspired collective behavior simulations or forge your own computational swarm patterns.
                </p>
            </div>

            {/* MAIN CATALOG GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                
                {/* CREATE ALGORITHM CARD */}
                <div 
                    className="glass-panel hoverable staggered-item" 
                    onClick={() => setShowModal(true)} 
                    style={{ 
                        cursor: 'pointer', 
                        display: 'flex', 
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        border: '2px dashed rgba(163, 230, 181, 0.25)',
                        minHeight: '290px',
                        background: 'linear-gradient(180deg, rgba(163, 230, 181, 0.02) 0%, rgba(10, 18, 14, 0.4) 100%)',
                        textAlign: 'center',
                        padding: '2.5rem 2rem',
                        animationDelay: '0ms'
                    }}
                >
                    <div style={{ 
                        backgroundColor: 'rgba(163, 230, 181, 0.08)', 
                        width: '56px', 
                        height: '56px', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        marginBottom: '1.25rem',
                        border: '1px solid rgba(163, 230, 181, 0.2)'
                    }}>
                        <Sparkles className="text-green" size={26} />
                    </div>
                    <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', color: '#fff' }}>Create Algorithm</h3>
                    <p className="text-muted" style={{ fontSize: '0.85rem', lineHeight: '1.6', maxWidth: '245px' }}>
                        Forge a new swarm intelligence simulation from a public GitHub repository.
                    </p>
                </div>

                {/* EXISTING ALGORITHM CARDS */}
                {algorithms.map((alg, index) => (
                    <div 
                        key={alg.id} 
                        className="glass-panel hoverable staggered-item" 
                        onClick={() => navigate(`/algorithm/${alg.slug}`)} 
                        style={{ 
                            cursor: 'pointer', 
                            display: 'flex', 
                            flexDirection: 'column',
                            minHeight: '290px',
                            animationDelay: `${(index + 1) * 60}ms`
                        }}
                    >
                        <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                            <div className="badge badge-card" style={{ padding: '0.6rem', borderRadius: '50%' }}>
                                {getIconForAlgo(alg.name)}
                            </div>
                        </div>
                        <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>{alg.name}</h3>
                        <p className="text-muted" style={{ fontSize: '0.85rem', lineHeight: '1.6', flexGrow: 1, marginBottom: '2rem' }}>
                            {alg.name.toLowerCase().includes('ant') ? "Pheromone-based pathfinding for dynamic logistical networks. Handles continuous graph evaluations." :
                                alg.name.toLowerCase().includes('bee') ? "Exploratory searching and exploitative refinement inspired by nectar location optimization." :
                                    "A computational structure forged from GitHub origins. Adaptive, self-healing, and emergent swarm patterns."}
                        </p>
                        <div className="flex-between" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span>Author:</span>
                                <strong style={{ color: 'var(--color-accent-green)', textTransform: 'capitalize' }}>
                                    {alg.creator_name || 'System'}
                                </strong>
                            </div>
                            <button className="btn btn-scan" style={{ fontSize: '0.8rem' }}>
                                Execute Simulation <ArrowRight size={14} style={{ marginLeft: '0.2rem' }} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Ingest Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Initiate New Pattern</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        
                        {/* Repository Structure Instructions */}
                        <div style={{ 
                            backgroundColor: 'rgba(163, 230, 181, 0.03)', 
                            border: '1px solid rgba(163, 230, 181, 0.15)', 
                            borderRadius: '8px', 
                            padding: '1rem 1.25rem', 
                            marginBottom: '1.5rem',
                            fontSize: '0.85rem'
                        }}>
                            <span style={{ color: 'var(--color-accent-green)', fontWeight: '600', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                Required Repository Structure
                            </span>
                            <p className="text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '0.75rem' }}>
                                Before importing, verify that your public GitHub project matches this exact structure:
                            </p>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(2, 1fr)', 
                                gap: '0.5rem',
                                fontFamily: 'var(--font-mono)', 
                                fontSize: '0.75rem', 
                                color: '#fff' 
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ color: 'var(--color-accent-green)' }}>📄</span> index.html
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ color: 'var(--color-accent-green)' }}>📄</span> style.css
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ color: 'var(--color-accent-green)' }}>📄</span> alg-name.js
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ color: 'var(--color-accent-green)' }}>📂</span> assets/
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', gridColumn: 'span 2' }}>
                                    <span style={{ color: 'var(--color-accent-green)' }}>📄</span> explanation.html
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleIngest}>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>GitHub Repository URL</label>
                                <input
                                    type="url"
                                    className="input-glass"
                                    value={repoUrl}
                                    onChange={(e) => setRepoUrl(e.target.value)}
                                    placeholder="https://github.com/user/repo"
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="btn btn-origins" onClick={() => setShowModal(false)} disabled={loadingIngest}>Abort</button>
                                <button type="submit" className="btn btn-forge" disabled={loadingIngest}>
                                    {loadingIngest ? 'Forging Simulation...' : 'Create Simulation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
