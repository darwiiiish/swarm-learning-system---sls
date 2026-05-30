import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Play, BookOpen, MessageSquare, Award, GitPullRequest, Send, Lock, User, Calendar, Maximize2, Minimize2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AlgorithmDetails() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated, updateUserScore, API_BASE_URL } = useAuth();
    const [algorithm, setAlgorithm] = useState(null);
    const [activeTab, setActiveTab] = useState('simulation');
    
    // Fullscreen state and container ref for simulation
    const [isFullscreen, setIsFullscreen] = useState(false);
    const simContainerRef = useRef(null);

    // Fullscreen state and container ref for education
    const [isEduFullscreen, setIsEduFullscreen] = useState(false);
    const eduContainerRef = useRef(null);

    const toggleFullscreen = () => {
        if (!simContainerRef.current) return;
        
        if (!document.fullscreenElement) {
            simContainerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const toggleEduFullscreen = () => {
        if (!eduContainerRef.current) return;
        
        if (!document.fullscreenElement) {
            eduContainerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement && document.fullscreenElement === simContainerRef.current);
            setIsEduFullscreen(!!document.fullscreenElement && document.fullscreenElement === eduContainerRef.current);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);
    
    // Comments states
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isFixOffer, setIsFixOffer] = useState(false);
    const [fixDetailsUrl, setFixDetailsUrl] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/algorithms/${slug}`)
            .then(res => res.json())
            .then(data => setAlgorithm(data))
            .catch(err => console.error(err));
    }, [slug]);

    useEffect(() => {
        if (activeTab === 'collaboration') {
            setCommentsLoading(true);
            fetch(`${API_BASE_URL}/api/algorithms/${slug}/comments`)
                .then(res => res.json())
                .then(data => {
                    setComments(Array.isArray(data) ? data : []);
                    setCommentsLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching comments:', err);
                    setCommentsLoading(false);
                });
        }
    }, [activeTab, slug]);

    if (!algorithm) return <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>;

    const getSimulationUrl = (filePath) => {
        if (!algorithm.repo_url) {
            const simBase = API_BASE_URL || '/api';
            return `${simBase}/simulations/${slug}/${filePath}`;
        }
        // Match both https and ssh formats
        const match = algorithm.repo_url.match(/github\.com\/([^\/]+)\/([^\/]+)/i);
        if (match) {
            const owner = match[1];
            const repo = match[2].replace(/\.git$/, '').replace(/\/$/, '');
            const branch = algorithm.branch || 'main';
            return `https://raw.githack.com/${owner}/${repo}/${branch}/${filePath}`;
        }
        const simBase = API_BASE_URL || '/api';
        return `${simBase}/simulations/${slug}/${filePath}`;
    };

    const simUrl = getSimulationUrl(algorithm.entry_point);
    const eduUrl = getSimulationUrl(algorithm.explanation_entry);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmittingComment(true);
        setErrorMsg('');

        try {
            const token = localStorage.getItem('sls_token');
            const response = await fetch(`${API_BASE_URL}/api/algorithms/${slug}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: newComment,
                    is_fix_offer: isFixOffer ? 1 : 0,
                    fix_details_url: isFixOffer ? fixDetailsUrl : null
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit comment');
            }

            // Append the new comment
            setComments(prev => [...prev, data.comment]);
            
            // Update AuthContext user score
            if (data.contribution_score !== undefined) {
                updateUserScore(data.contribution_score);
            }

            // Reset states
            setNewComment('');
            setIsFixOffer(false);
            setFixDetailsUrl('');
        } catch (err) {
            console.error('Error posting comment:', err);
            setErrorMsg(err.message || 'Something went wrong.');
        } finally {
            setSubmittingComment(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ padding: '3rem 2rem', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            <button className="btn" style={{ background: 'transparent', color: 'var(--color-text-muted)', padding: 0, marginBottom: '1rem' }} onClick={() => navigate('/explorer')}>
                <ArrowLeft size={20} style={{ marginRight: '0.5rem' }} /> Back to Explorer
            </button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{algorithm.name}</h2>
                    <p style={{ color: 'var(--color-tertiary)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>Repository: <a href={algorithm.repo_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent-green)', textDecoration: 'none', transition: 'all 0.2s ease' }} onMouseOver={e => e.currentTarget.style.opacity = 0.8} onMouseOut={e => e.currentTarget.style.opacity = 1}>{algorithm.repo_url}</a></p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <button 
                    className={`btn ${activeTab === 'simulation' ? 'btn-primary' : ''}`} 
                    style={{ background: activeTab !== 'simulation' ? 'transparent' : '', color: activeTab !== 'simulation' ? 'var(--color-tertiary)' : '' }}
                    onClick={() => setActiveTab('simulation')}
                >
                    <Play size={18} style={{ marginRight: '0.5rem' }} /> Live Simulation
                </button>
                <button 
                    className={`btn ${activeTab === 'education' ? 'btn-primary' : ''}`} 
                    style={{ background: activeTab !== 'education' ? 'transparent' : '', color: activeTab !== 'education' ? 'var(--color-tertiary)' : '' }}
                    onClick={() => setActiveTab('education')}
                >
                    <BookOpen size={18} style={{ marginRight: '0.5rem' }} /> Biological & Math Explanation
                </button>
                <button 
                    className={`btn ${activeTab === 'collaboration' ? 'btn-primary' : ''}`} 
                    style={{ background: activeTab !== 'collaboration' ? 'transparent' : '', color: activeTab !== 'collaboration' ? 'var(--color-tertiary)' : '' }}
                    onClick={() => setActiveTab('collaboration')}
                >
                    <MessageSquare size={18} style={{ marginRight: '0.5rem' }} /> Comments & Contributions
                </button>
            </div>

            <div className="glass-panel" style={{ minHeight: '600px', padding: 0, overflow: 'hidden' }}>
                {activeTab === 'simulation' && (
                    <div 
                        ref={simContainerRef} 
                        className={`sim-fullscreen-container ${isFullscreen ? 'fullscreen' : ''}`}
                        style={{ 
                            position: 'relative', 
                            width: '100%', 
                            height: isFullscreen ? '100vh' : '600px', 
                            background: '#0a0f0d', 
                            display: 'flex', 
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        {!isFullscreen ? (
                            /* GORGEOUS LAUNCHER SCREEN */
                            <div className="animate-fade-in" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                padding: '3rem',
                                width: '100%',
                                height: '100%',
                                boxSizing: 'border-box',
                                background: 'radial-gradient(circle at center, rgba(163, 230, 181, 0.08) 0%, transparent 70%)',
                            }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'rgba(163, 230, 181, 0.05)',
                                    border: '1px solid rgba(163, 230, 181, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '1.5rem',
                                    color: 'var(--color-accent-green)',
                                    boxShadow: '0 0 30px rgba(163, 230, 181, 0.1)',
                                    animation: 'pulse-glow 3s infinite ease-in-out'
                                }}>
                                    <Play size={36} fill="var(--color-accent-green)" style={{ marginLeft: '4px' }} />
                                </div>

                                <h3 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                                    Interactive Swarm Intelligence Model
                                </h3>
                                
                                <p style={{ 
                                    color: 'var(--color-text-muted)', 
                                    fontSize: '0.95rem', 
                                    maxWidth: '520px', 
                                    lineHeight: '1.6', 
                                    marginBottom: '2.5rem' 
                                }}>
                                    To provide an optimized and immersive simulation experience, this Swarm Intelligence algorithm runs exclusively in <strong>Full Screen Mode</strong>.
                                </p>

                                <button 
                                    onClick={toggleFullscreen}
                                    className="btn btn-forge animate-pulse-glow"
                                    style={{
                                        padding: '1rem 2.5rem',
                                        fontSize: '1rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        fontWeight: '800'
                                    }}
                                >
                                    <Maximize2 size={18} /> Launch Full Screen Simulation
                                </button>
                            </div>
                        ) : (
                            /* FULLSCREEN RUNNING SIMULATION */
                            <>
                                {/* Exit Fullscreen Floating Control Bar */}
                                <div style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    zIndex: 1000,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    background: 'rgba(13, 22, 16, 0.9)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(163, 230, 181, 0.25)',
                                    borderRadius: '12px',
                                    padding: '0.5rem 1rem',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-green)', fontFamily: 'var(--font-mono)', fontWeight: '700', letterSpacing: '0.05em' }}>
                                            {algorithm.name.toUpperCase()} RUNNING
                                        </span>
                                    </div>
                                    <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.15)' }} />
                                    <button 
                                        className="btn btn-secondary" 
                                        style={{ 
                                            padding: '0.3rem 0.75rem', 
                                            fontSize: '0.75rem', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.3rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }} 
                                        onClick={toggleFullscreen}
                                    >
                                        <Minimize2 size={12} /> Exit Full Screen
                                    </button>
                                </div>
                                
                                <iframe 
                                    src={simUrl} 
                                    style={{ 
                                        flex: 1,
                                        width: '100%', 
                                        height: '100%', 
                                        border: 'none', 
                                        background: '#fff' 
                                    }} 
                                    title="Simulation" 
                                />
                            </>
                        )}
                    </div>
                )}
                {activeTab === 'education' && (
                    <div 
                        ref={eduContainerRef} 
                        className={`sim-fullscreen-container ${isEduFullscreen ? 'fullscreen' : ''}`}
                        style={{ 
                            position: 'relative', 
                            width: '100%', 
                            height: isEduFullscreen ? '100vh' : '600px', 
                            background: '#0a0f0d', 
                            display: 'flex', 
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        {!isEduFullscreen ? (
                            /* GORGEOUS LAUNCHER SCREEN FOR EDUCATION */
                            <div className="animate-fade-in" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                padding: '3rem',
                                width: '100%',
                                height: '100%',
                                boxSizing: 'border-box',
                                background: 'radial-gradient(circle at center, rgba(163, 230, 181, 0.08) 0%, transparent 70%)',
                            }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'rgba(163, 230, 181, 0.05)',
                                    border: '1px solid rgba(163, 230, 181, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '1.5rem',
                                    color: 'var(--color-accent-green)',
                                    boxShadow: '0 0 30px rgba(163, 230, 181, 0.1)',
                                    animation: 'pulse-glow 3s infinite ease-in-out'
                                }}>
                                    <BookOpen size={36} style={{ color: 'var(--color-accent-green)' }} />
                                </div>

                                <h3 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                                    Biological & Math Explanation
                                </h3>
                                
                                <p style={{ 
                                    color: 'var(--color-text-muted)', 
                                    fontSize: '0.95rem', 
                                    maxWidth: '520px', 
                                    lineHeight: '1.6', 
                                    marginBottom: '2.5rem' 
                                }}>
                                    To provide an optimized and immersive educational experience, the biological concepts and mathematical formulas run exclusively in <strong>Full Screen Mode</strong>.
                                </p>

                                <button 
                                    onClick={toggleEduFullscreen}
                                    className="btn btn-forge animate-pulse-glow"
                                    style={{
                                        padding: '1rem 2.5rem',
                                        fontSize: '1rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        fontWeight: '800'
                                    }}
                                >
                                    <Maximize2 size={18} /> Launch Full Screen Explanation
                                </button>
                            </div>
                        ) : (
                            /* FULLSCREEN RUNNING EDUCATION */
                            <>
                                {/* Exit Fullscreen Floating Control Bar */}
                                <div style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    zIndex: 1000,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    background: 'rgba(13, 22, 16, 0.9)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(163, 230, 181, 0.25)',
                                    borderRadius: '12px',
                                    padding: '0.5rem 1rem',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-green)', fontFamily: 'var(--font-mono)', fontWeight: '700', letterSpacing: '0.05em' }}>
                                            {algorithm.name.toUpperCase()} EXPLANATION
                                        </span>
                                    </div>
                                    <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.15)' }} />
                                    <button 
                                        className="btn btn-secondary" 
                                        style={{ 
                                            padding: '0.3rem 0.75rem', 
                                            fontSize: '0.75rem', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.3rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }} 
                                        onClick={toggleEduFullscreen}
                                    >
                                        <Minimize2 size={12} /> Exit Full Screen
                                    </button>
                                </div>
                                
                                <iframe 
                                    src={eduUrl} 
                                    style={{ 
                                        flex: 1,
                                        width: '100%', 
                                        height: '100%', 
                                        border: 'none', 
                                        background: '#fff' 
                                    }} 
                                    title="Education" 
                                />
                            </>
                        )}
                    </div>
                )}
                {activeTab === 'collaboration' && (
                    <div style={{ padding: '2rem' }}>
                        <h3>Collaboration & Feedback</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Offer fixes, suggest improvements, or ask questions below.</p>
                        
                        {/* Comments Thread */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            {commentsLoading ? (
                                <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '3rem', fontFamily: 'var(--font-mono)' }}>
                                    Syncing comments with Swarm network...
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.1)', borderStyle: 'dashed', textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                                    No comments or contributions yet. Be the first to share your thoughts!
                                </div>
                            ) : (
                                comments.map(c => {
                                    const dateStr = new Date(c.created_at).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });
                                    
                                    if (c.is_fix_offer) {
                                        return (
                                            <div key={c.id} className="glass-panel animate-fade-in" style={{
                                                background: 'linear-gradient(135deg, rgba(25, 42, 30, 0.45) 0%, rgba(18, 30, 22, 0.85) 100%)',
                                                border: '1px solid rgba(252, 225, 115, 0.25)',
                                                boxShadow: '0 8px 30px rgba(252, 225, 115, 0.05)',
                                                borderRadius: '12px',
                                                padding: '1.25rem'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{ background: 'rgba(252, 225, 115, 0.1)', padding: '0.4rem', borderRadius: '50%', color: 'var(--color-accent-gold)', display: 'flex' }}>
                                                            <GitPullRequest size={16} />
                                                        </div>
                                                        <div>
                                                            <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{c.user_name}</strong>
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-gold)', marginLeft: '0.5rem', fontFamily: 'var(--font-mono)', border: '1px solid rgba(252, 225, 115, 0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(252, 225, 115, 0.05)' }}>
                                                                {c.user_role === 'superadmin' ? 'Superadmin' : `Student (${c.user_regnum})`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <Calendar size={12} /> {dateStr}
                                                    </span>
                                                </div>
                                                
                                                <p style={{ color: '#EFEFEF', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 1rem 0', whiteSpace: 'pre-line' }}>{c.message}</p>
                                                
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                                                    {c.fix_details_url && (
                                                        <a 
                                                            href={c.fix_details_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            style={{ 
                                                                display: 'inline-flex', 
                                                                alignItems: 'center', 
                                                                gap: '0.4rem', 
                                                                color: 'var(--color-accent-green)', 
                                                                textDecoration: 'none', 
                                                                fontSize: '0.85rem',
                                                                fontFamily: 'var(--font-mono)'
                                                            }}
                                                        >
                                                            <GitPullRequest size={14} /> View Pull Request / Code Fix
                                                        </a>
                                                    )}
                                                    <span style={{ 
                                                        fontSize: '0.75rem', 
                                                        fontWeight: '700', 
                                                        color: 'var(--color-accent-gold)', 
                                                        background: 'rgba(252, 225, 115, 0.1)', 
                                                        padding: '0.25rem 0.6rem', 
                                                        borderRadius: '4px',
                                                        fontFamily: 'var(--font-mono)',
                                                        border: '1px solid rgba(252, 225, 115, 0.2)',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}>
                                                        <Award size={12} /> {Number(algorithm.creator_id) !== Number(c.user_id) ? "+1 SLS Star" : "+0 SLS Stars (Own Simulation)"}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div key={c.id} className="glass-panel animate-fade-in" style={{
                                                background: 'rgba(21, 37, 28, 0.2)',
                                                border: '1px solid rgba(163, 230, 181, 0.08)',
                                                borderRadius: '12px',
                                                padding: '1.25rem'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '50%', color: 'var(--color-accent-green)', display: 'flex' }}>
                                                            <User size={16} />
                                                        </div>
                                                        <div>
                                                            <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{c.user_name}</strong>
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem', fontFamily: 'var(--font-mono)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.02)' }}>
                                                                {c.user_role === 'superadmin' ? 'Superadmin' : `Student (${c.user_regnum})`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <Calendar size={12} /> {dateStr}
                                                    </span>
                                                </div>
                                                
                                                <p style={{ color: '#EFEFEF', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 1rem 0', whiteSpace: 'pre-line' }}>{c.message}</p>
                                                
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.6rem' }}>
                                                    <span style={{ 
                                                        fontSize: '0.7rem', 
                                                        fontWeight: '700', 
                                                        color: 'var(--color-accent-green-muted)', 
                                                        background: 'rgba(163, 230, 181, 0.05)', 
                                                        padding: '0.2rem 0.5rem', 
                                                        borderRadius: '4px',
                                                        fontFamily: 'var(--font-mono)',
                                                        border: '1px solid rgba(163, 230, 181, 0.1)',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.2rem'
                                                    }}>
                                                        <Award size={10} /> {Number(algorithm.creator_id) !== Number(c.user_id) ? "+1 SLS Star" : "+0 SLS Stars (Own Simulation)"}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }
                                })
                            )}
                        </div>

                        {/* Leave a Comment Box */}
                        {isAuthenticated ? (
                            <form onSubmit={handleCommentSubmit} style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                                <h4 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#fff' }}>Leave a Contribution</h4>
                                
                                {errorMsg && (
                                    <div className="glass-panel" style={{ border: '1px solid rgba(255, 100, 100, 0.3)', background: 'rgba(255, 100, 100, 0.05)', color: '#ff8888', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                        <strong>Error:</strong> {errorMsg}
                                    </div>
                                )}

                                <textarea 
                                    className="input-glass" 
                                    rows="4" 
                                    placeholder="Explain your improvement, feedback, or describe a bug fix..." 
                                    style={{ marginBottom: '1rem', width: '100%', resize: 'vertical' }}
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    required
                                ></textarea>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none', color: 'var(--color-text-main)', fontSize: '0.9rem' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={isFixOffer} 
                                            onChange={e => {
                                                setIsFixOffer(e.target.checked);
                                                if (!e.target.checked) setFixDetailsUrl('');
                                            }}
                                            style={{ 
                                                accentColor: 'var(--color-accent-gold)', 
                                                width: '18px', 
                                                height: '18px', 
                                                cursor: 'pointer' 
                                            }}
                                        />
                                        <span>This is a code fix or pull request suggestion (+1 SLS Star on other person's simulation)</span>
                                    </label>

                                    {isFixOffer && (
                                        <div style={{ animation: 'fadeIn 0.3s ease forwards' }}>
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-accent-gold)', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                                                GitHub Pull Request / Commit / Issue URL (Required)
                                            </label>
                                            <input 
                                                type="url" 
                                                className="input-glass" 
                                                placeholder="https://github.com/username/repo/pull/1" 
                                                value={fixDetailsUrl}
                                                onChange={e => setFixDetailsUrl(e.target.value)}
                                                required={isFixOffer}
                                                style={{ 
                                                    border: '1px solid rgba(252, 225, 115, 0.3)',
                                                    boxShadow: '0 0 10px rgba(252, 225, 115, 0.05)'
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                <button 
                                    type="submit" 
                                    className={`btn ${isFixOffer ? 'btn-forge' : 'btn-primary'}`} 
                                    style={{ width: 'auto', minWidth: '180px' }}
                                    disabled={submittingComment}
                                >
                                    {submittingComment ? (
                                        'Submitting...'
                                    ) : (
                                        <>
                                            <Send size={16} /> {isFixOffer ? 'Submit Fix Offer' : 'Submit Feedback'}
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="glass-panel" style={{
                                marginTop: '2rem',
                                border: '1px solid rgba(163, 230, 181, 0.2)',
                                background: 'rgba(163, 230, 181, 0.02)',
                                padding: '2rem',
                                textAlign: 'center',
                                borderRadius: '12px'
                            }}>
                                <Lock size={32} style={{ color: 'var(--color-accent-green)', marginBottom: '1rem', opacity: 0.8 }} />
                                <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#fff' }}>Join the Collaboration</h4>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
                                    You must be logged in to participate in discussion threads, offer code fixes, and earn SLS stars.
                                </p>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                    <Link to="/login" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.6rem 1.5rem' }}>Login to Account</Link>
                                    <Link to="/signup" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.6rem 1.5rem' }}>Create Account</Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
