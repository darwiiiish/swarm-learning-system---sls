import { Link as RouterLink } from 'react-router-dom';
import { Bug, Link, Users } from 'lucide-react';
import aastLogo from '../assets/logo.png';
import backgroundImg from '../assets/background.jpg';
import '../index.css';

export default function Landing() {
  return (
    <div className="landing-container animate-fade-in" style={{ width: '100%' }}>
      
      {/* Hero Section Container */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: 'calc(100vh - 76px)', 
        width: '100%',
        padding: '2rem 2rem',
        boxSizing: 'border-box',
        backgroundImage: `linear-gradient(to bottom, rgba(18, 31, 23, 0.4) 0%, rgba(18, 31, 23, 1) 100%), url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', maxWidth: '900px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <img src={aastLogo} alt="AAST University Logo" style={{ height: '120px', width: 'auto', objectFit: 'contain' }} />
          </div>

          <h1 className="hero-title" style={{ fontSize: '4.5rem', lineHeight: '1.1', marginBottom: '1.5rem' }}>
            Simulate Nature.<br />
            <span>Empower the Swarm.</span>
          </h1>
          
          <p className="text-muted" style={{ fontSize: '1.25rem', marginBottom: '2.5rem', lineHeight: '1.6', maxWidth: '700px', margin: '0 auto 2.5rem auto' }}>
            A community-driven platform for AAST students under the supervision of <strong style={{ color: '#fff' }}>Dr. Khaled</strong> and <strong style={{ color: '#fff' }}>Eng. Salma</strong>. Create, share, and collaborate on nature-inspired swarm algorithm simulations directly from your GitHub repositories.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <RouterLink to="/signup" className="btn btn-forge" style={{ fontSize: '1rem', padding: '1rem 2.5rem' }}>
              <Users size={18} />
              Join the Community
            </RouterLink>
            <RouterLink to="/login" className="btn btn-observe" style={{ fontSize: '1rem', padding: '1rem 2.5rem' }}>
              Access Hub
            </RouterLink>
          </div>
        </div>
      </div>

      {/* Features Grid Layout Wrapper */}
      <div style={{ 
        width: '100%', 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '0 2rem', 
        boxSizing: 'border-box' 
      }}>
        {/* Features Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem', 
          width: '100%', 
          maxWidth: '1100px', 
          margin: '0 auto',
          padding: '6rem 0 8rem 0'
        }}>
        
        <div className="glass-panel hoverable staggered-item" style={{ animationDelay: '0.1s' }}>
          <div style={{ backgroundColor: 'rgba(163, 230, 181, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Bug className="text-green" size={24} />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Nature's Algorithms</h3>
          <p className="text-muted" style={{ lineHeight: '1.6' }}>
            From the foraging behavior of ants (ACO) to the waggle dance of bees, visualize and simulate algorithms exactly as they originated in nature.
          </p>
        </div>

        <div className="glass-panel hoverable staggered-item" style={{ animationDelay: '0.2s' }}>
          <div style={{ backgroundColor: 'rgba(252, 225, 115, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Link className="text-gold" size={24} />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>GitHub Integration</h3>
          <p className="text-muted" style={{ lineHeight: '1.6' }}>
            Built your own simulation? Simply paste your public GitHub repository URL. The system will seamlessly integrate and share your work with others.
          </p>
        </div>

        <div className="glass-panel hoverable staggered-item" style={{ animationDelay: '0.3s' }}>
          <div style={{ backgroundColor: 'rgba(163, 230, 181, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Users className="text-green" size={24} />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Student Community</h3>
          <p className="text-muted" style={{ lineHeight: '1.6' }}>
            Collaborate with your fellow AAST students. Explore custom algorithms, share insights, and build a collective knowledge base for the Swarm course.
          </p>
        </div>

      </div>
    </div>

  </div>
  );
}
