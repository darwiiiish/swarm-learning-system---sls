import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Trophy, 
    Star, 
    Search, 
    Crown, 
    Award, 
    ArrowLeft, 
    TrendingUp, 
    Sparkles,
    User,
    Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Leaderboard() {
    const { token, API_BASE_URL } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        fetch(`${API_BASE_URL}/api/auth/leaderboard`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Filter: only student role and with stars (> 0)
                    const studentList = data
                        .filter(u => u.role === 'student' && u.contribution_score > 0)
                        // Just in case, sort desc (backend already does it, but let's be double sure)
                        .sort((a, b) => b.contribution_score - a.contribution_score);
                    setStudents(studentList);
                }
            })
            .catch(err => console.error('Error fetching leaderboard:', err))
            .finally(() => setLoading(false));
    }, [API_BASE_URL]);

    // Handle search filter
    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.regnum.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Stats calculations
    const totalStars = students.reduce((acc, curr) => acc + curr.contribution_score, 0);
    const topPerformer = students.length > 0 ? students[0].name : 'N/A';
    const averageStars = students.length > 0 ? (totalStars / students.length).toFixed(1) : '0';

    // Separate top 3 from the rest
    const podiumStudents = filteredStudents.slice(0, 3);
    const tableStudents = filteredStudents.slice(3);

    return (
        <div className="animate-fade-in" style={{ padding: '3.5rem 2rem 6rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            


            {loading ? (
                /* Loading State */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', gap: '1rem' }}>
                    <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        border: '3px solid rgba(163, 230, 181, 0.1)', 
                        borderTopColor: 'var(--color-accent-green)', 
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-accent-green)' }}>Retrieving Score Matrices...</p>
                    <style>{`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            ) : students.length === 0 ? (
                /* Beautiful Empty State */
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4.5rem 2rem', maxWidth: '600px', margin: '0 auto', border: '1px dashed rgba(163, 230, 181, 0.25)' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(252, 225, 115, 0.05)', border: '1px solid rgba(252, 225, 115, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                        <Star className="text-gold animate-pulse-glow" size={28} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>No Swarm Stars Claimed Yet</h3>
                    <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '2rem', maxWidth: '420px', margin: '0 auto 2rem auto' }}>
                        The leaderboards are currently unoccupied. Be the first to initiate coordinates, publish a swarm design, or comment on simulations to claim your place!
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem', textAlign: 'left' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--color-accent-green)', display: 'block', marginBottom: '0.5rem' }}>How to earn Stars:</span>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--color-accent-gold)' }}>⭐</span>
                            <span className="text-muted"><strong style={{ color: '#fff' }}>+10 Stars:</strong> Publish and forge your own swarm intelligence simulation repository.</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--color-accent-gold)' }}>⭐</span>
                            <span className="text-muted"><strong style={{ color: '#fff' }}>+1 Star:</strong> Leave feedback or comment on another student's simulation.</span>
                        </div>
                    </div>
                    <button className="btn btn-forge" onClick={() => navigate('/explorer')}>
                        <Sparkles size={14} /> Explore Simulations
                    </button>
                </div>
            ) : (
                /* Leaderboard Dashboard Content */
                <>
                    {/* PODIUM OF CHAMPIONS (TOP 3) */}
                    {podiumStudents.length > 0 && searchQuery === '' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '4rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <Award className="text-gold" size={20} /> Top Contributor Podium
                            </h2>
                            
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                                gap: '1.5rem', 
                                alignItems: 'stretch' 
                            }}>
                                {/* 1st Place Card */}
                                {podiumStudents[0] && (
                                    <div 
                                        className="glass-panel hoverable" 
                                        style={{ 
                                            background: 'linear-gradient(180deg, rgba(252, 225, 115, 0.05) 0%, rgba(13, 22, 16, 0.9) 100%)',
                                            border: '1px solid rgba(252, 225, 115, 0.3)',
                                            boxShadow: '0 10px 40px rgba(252, 225, 115, 0.05), 0 0 30px rgba(252, 225, 115, 0.03)',
                                            order: window.innerWidth > 768 ? 2 : 1, // Visual ordering for center 1st place
                                            marginTop: '-20px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            padding: '2.5rem 1.5rem',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                                            <Crown size={28} className="text-gold animate-pulse-glow" />
                                        </div>
                                        <div style={{ 
                                            width: '72px', 
                                            height: '72px', 
                                            borderRadius: '50%', 
                                            background: 'rgba(252, 225, 115, 0.15)',
                                            border: '2px solid var(--color-accent-gold)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '1rem',
                                            boxShadow: '0 0 15px rgba(252, 225, 115, 0.2)'
                                        }}>
                                            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-accent-gold)', fontFamily: 'var(--font-heading)' }}>1</span>
                                        </div>
                                        <h3 style={{ fontSize: '1.45rem', color: '#fff', textTransform: 'capitalize', marginBottom: '0.25rem' }}>{podiumStudents[0].name}</h3>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '1.5rem' }}>{podiumStudents[0].regnum}</span>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(252, 225, 115, 0.12)', border: '1px solid rgba(252, 225, 115, 0.25)', padding: '0.5rem 1.5rem', borderRadius: '8px' }}>
                                            <Star size={16} className="text-gold" fill="currentColor" />
                                            <strong style={{ color: 'var(--color-accent-gold)', fontSize: '1.25rem', fontFamily: 'var(--font-mono)' }}>{podiumStudents[0].contribution_score}</strong>
                                            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', opacity: 0.8, color: 'var(--color-accent-gold)' }}>STARS</span>
                                        </div>
                                    </div>
                                )}

                                {/* 2nd Place Card */}
                                {podiumStudents[1] && (
                                    <div 
                                        className="glass-panel hoverable" 
                                        style={{ 
                                            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(13, 22, 16, 0.9) 100%)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            order: window.innerWidth > 768 ? 1 : 2,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            padding: '2.2rem 1.5rem'
                                        }}
                                    >
                                        <div style={{ 
                                            width: '64px', 
                                            height: '64px', 
                                            borderRadius: '50%', 
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '2px solid #C0C0C0', // Silver
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '1rem'
                                        }}>
                                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d0d0d0', fontFamily: 'var(--font-heading)' }}>2</span>
                                        </div>
                                        <h3 style={{ fontSize: '1.3rem', color: '#fff', textTransform: 'capitalize', marginBottom: '0.25rem' }}>{podiumStudents[1].name}</h3>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '1.5rem' }}>{podiumStudents[1].regnum}</span>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.4rem 1.25rem', borderRadius: '8px' }}>
                                            <Star size={14} style={{ color: '#d0d0d0' }} fill="currentColor" />
                                            <strong style={{ color: '#fff', fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>{podiumStudents[1].contribution_score}</strong>
                                            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', opacity: 0.6 }}>STARS</span>
                                        </div>
                                    </div>
                                )}

                                {/* 3rd Place Card */}
                                {podiumStudents[2] && (
                                    <div 
                                        className="glass-panel hoverable" 
                                        style={{ 
                                            background: 'linear-gradient(180deg, rgba(176, 141, 87, 0.02) 0%, rgba(13, 22, 16, 0.9) 100%)',
                                            border: '1px solid rgba(176, 141, 87, 0.18)',
                                            order: 3,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            padding: '2.2rem 1.5rem'
                                        }}
                                    >
                                        <div style={{ 
                                            width: '64px', 
                                            height: '64px', 
                                            borderRadius: '50%', 
                                            background: 'rgba(176, 141, 87, 0.05)',
                                            border: '2px solid #CD7F32', // Bronze
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '1rem'
                                        }}>
                                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#CD7F32', fontFamily: 'var(--font-heading)' }}>3</span>
                                        </div>
                                        <h3 style={{ fontSize: '1.3rem', color: '#fff', textTransform: 'capitalize', marginBottom: '0.25rem' }}>{podiumStudents[2].name}</h3>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '1.5rem' }}>{podiumStudents[2].regnum}</span>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(176, 141, 87, 0.04)', border: '1px solid rgba(176, 141, 87, 0.1)', padding: '0.4rem 1.25rem', borderRadius: '8px' }}>
                                            <Star size={14} style={{ color: '#CD7F32' }} fill="currentColor" />
                                            <strong style={{ color: '#fff', fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>{podiumStudents[2].contribution_score}</strong>
                                            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', opacity: 0.6 }}>STARS</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* DETAILED LEADERBOARD LIST / SEARCH */}
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        
                        {/* Search & Filter Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                            <div>
                                <h2 style={{ fontSize: '1.35rem', margin: 0 }}>Class standings</h2>
                                <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                    {searchQuery !== '' ? `Found ${filteredStudents.length} matching students` : `Rankings from position 4 and below`}
                                </p>
                            </div>
                            
                            {/* Search bar */}
                            <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
                                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={16} />
                                <input 
                                    type="text" 
                                    className="search-input" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by student name or regnum..." 
                                    style={{ paddingLeft: '2.5rem', width: '100%', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        {/* List/Table */}
                        {filteredStudents.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                No students match your search criteria.
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                            <th style={{ padding: '1rem 0.75rem', fontSize: '0.8rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', width: '80px' }}>Rank</th>
                                            <th style={{ padding: '1rem 1rem', fontSize: '0.8rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>Student</th>
                                            <th style={{ padding: '1rem 1rem', fontSize: '0.8rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', width: '220px' }}>Registration No.</th>
                                            <th style={{ padding: '1rem 1rem', fontSize: '0.8rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', width: '120px', textAlign: 'right' }}>Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(searchQuery !== '' ? filteredStudents : tableStudents).map((student, idx) => {
                                            // Compute absolute rank
                                            const absoluteRank = searchQuery !== '' 
                                                ? students.findIndex(s => s.id === student.id) + 1 
                                                : idx + 4;

                                            const isTop3 = absoluteRank <= 3;
                                            const rankColor = absoluteRank === 1 ? 'var(--color-accent-gold)' :
                                                              absoluteRank === 2 ? '#C0C0C0' :
                                                              absoluteRank === 3 ? '#CD7F32' : 'var(--color-text-muted)';

                                            return (
                                                <tr 
                                                    key={student.id} 
                                                    style={{ 
                                                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                                        transition: 'background-color 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.01)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <td style={{ padding: '1.1rem 0.75rem' }}>
                                                        <div style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center', 
                                                            width: '28px', 
                                                            height: '28px', 
                                                            borderRadius: '50%',
                                                            fontFamily: 'var(--font-mono)',
                                                            fontWeight: '700',
                                                            fontSize: '0.8rem',
                                                            background: isTop3 ? `rgba(255, 255, 255, 0.05)` : 'transparent',
                                                            border: isTop3 ? `1px solid ${rankColor}` : '1px solid transparent',
                                                            color: rankColor
                                                        }}>
                                                            {absoluteRank}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1.1rem 1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <User size={14} className="text-muted" />
                                                            </div>
                                                            <span style={{ fontWeight: '500', color: '#fff', textTransform: 'capitalize', fontSize: '0.9rem' }}>
                                                                {student.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1.1rem 1rem' }}>
                                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                            {student.regnum}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1.1rem 1rem', textAlign: 'right' }}>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                            <Star size={13} className="text-gold" fill="currentColor" />
                                                            <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--color-accent-green)' }}>
                                                                {student.contribution_score}
                                                            </strong>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
