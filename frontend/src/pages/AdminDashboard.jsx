import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Code, MessageSquare, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const { user, authFetch, API_BASE_URL } = useAuth();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('users');
    const [data, setData] = useState({ users: [], algorithms: [], comments: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'superadmin') {
            navigate('/');
            return;
        }
        fetchData();
    }, [user, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/api/admin/${activeTab}`);
            if (res.ok) {
                const result = await res.json();
                setData(prev => ({ ...prev, [activeTab]: result }));
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, type) => {
        if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) return;
        
        try {
            const res = await authFetch(`${API_BASE_URL}/api/admin/${type}/${id}`, {
                method: 'DELETE'
            });
            
            if (res.ok) {
                setData(prev => ({
                    ...prev,
                    [type]: prev[type].filter(item => item.id !== id)
                }));
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to delete');
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    return (
        <div className="animate-fade-in" style={{ padding: '3rem 2rem', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#ffa500' }}>Admin Dashboard</h2>
                <p style={{ color: 'var(--color-tertiary)', fontSize: '1rem' }}>Manage users, algorithms, and comments across the system.</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <button 
                    className={`btn ${activeTab === 'users' ? 'btn-primary' : ''}`} 
                    style={{ background: activeTab !== 'users' ? 'transparent' : '', color: activeTab !== 'users' ? 'var(--color-tertiary)' : '' }}
                    onClick={() => setActiveTab('users')}
                >
                    <Users size={18} style={{ marginRight: '0.5rem' }} /> Users
                </button>
                <button 
                    className={`btn ${activeTab === 'algorithms' ? 'btn-primary' : ''}`} 
                    style={{ background: activeTab !== 'algorithms' ? 'transparent' : '', color: activeTab !== 'algorithms' ? 'var(--color-tertiary)' : '' }}
                    onClick={() => setActiveTab('algorithms')}
                >
                    <Code size={18} style={{ marginRight: '0.5rem' }} /> Algorithms
                </button>
                <button 
                    className={`btn ${activeTab === 'comments' ? 'btn-primary' : ''}`} 
                    style={{ background: activeTab !== 'comments' ? 'transparent' : '', color: activeTab !== 'comments' ? 'var(--color-tertiary)' : '' }}
                    onClick={() => setActiveTab('comments')}
                >
                    <MessageSquare size={18} style={{ marginRight: '0.5rem' }} /> Comments
                </button>
            </div>

            <div className="glass-panel" style={{ minHeight: '500px', padding: '2rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-tertiary)' }}>Loading data...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-tertiary)' }}>
                                    <th style={{ padding: '1rem', width: '80px' }}>#</th>
                                    {activeTab === 'users' && (
                                        <>
                                            <th style={{ padding: '1rem' }}>RegNum</th>
                                            <th style={{ padding: '1rem' }}>Name</th>
                                            <th style={{ padding: '1rem' }}>Role</th>
                                            <th style={{ padding: '1rem' }}>Score</th>
                                        </>
                                    )}
                                    {activeTab === 'algorithms' && (
                                        <>
                                            <th style={{ padding: '1rem' }}>Name</th>
                                            <th style={{ padding: '1rem' }}>Slug</th>
                                            <th style={{ padding: '1rem' }}>Creator</th>
                                            <th style={{ padding: '1rem' }}>Created At</th>
                                        </>
                                    )}
                                    {activeTab === 'comments' && (
                                        <>
                                            <th style={{ padding: '1rem' }}>Message</th>
                                            <th style={{ padding: '1rem' }}>User</th>
                                            <th style={{ padding: '1rem' }}>Algorithm</th>
                                            <th style={{ padding: '1rem' }}>Created At</th>
                                        </>
                                    )}
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data[activeTab].length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-tertiary)' }}>
                                            No {activeTab} found.
                                        </td>
                                    </tr>
                                ) : (
                                    data[activeTab].map((item, index) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{index + 1}</td>
                                            
                                            {activeTab === 'users' && (
                                                <>
                                                    <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)' }}>{item.regnum}</td>
                                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{item.name}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{ 
                                                            padding: '0.2rem 0.6rem', 
                                                            borderRadius: '1rem', 
                                                            fontSize: '0.8rem',
                                                            background: item.role === 'superadmin' ? 'rgba(255, 165, 0, 0.1)' : 'rgba(163, 230, 181, 0.1)',
                                                            color: item.role === 'superadmin' ? '#ffa500' : 'var(--color-accent-green)'
                                                        }}>
                                                            {item.role}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>{item.contribution_score}</td>
                                                </>
                                            )}
                                            
                                            {activeTab === 'algorithms' && (
                                                <>
                                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{item.name}</td>
                                                    <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{item.slug}</td>
                                                    <td style={{ padding: '1rem' }}>{item.creator_name || 'Unknown'}</td>
                                                    <td style={{ padding: '1rem' }}>{new Date(item.created_at).toLocaleDateString()}</td>
                                                </>
                                            )}
                                            
                                            {activeTab === 'comments' && (
                                                <>
                                                    <td style={{ padding: '1rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.message}</td>
                                                    <td style={{ padding: '1rem' }}>{item.user_name || 'Unknown'}</td>
                                                    <td style={{ padding: '1rem' }}>{item.algorithm_name || 'Unknown'}</td>
                                                    <td style={{ padding: '1rem' }}>{new Date(item.created_at).toLocaleDateString()}</td>
                                                </>
                                            )}

                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                {item.role !== 'superadmin' && (
                                                    <button 
                                                        onClick={() => handleDelete(item.id, activeTab)}
                                                        className="btn" 
                                                        style={{ 
                                                            background: 'rgba(255, 68, 68, 0.1)', 
                                                            color: '#ff4444', 
                                                            padding: '0.4rem 0.8rem',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem'
                                                        }}
                                                    >
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
