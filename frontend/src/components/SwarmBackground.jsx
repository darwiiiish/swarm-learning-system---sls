import React from 'react';

export default function SwarmBackground() {
  return (
    <div className="swarm-bg-container">
      {/* Left Margin: Ant Colony Optimization (ACO) Trail */}
      <div className="swarm-bg-side swarm-bg-side-left">
        {/* SVG background trail line */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'visible',
            color: 'var(--color-accent-green)',
          }}
          preserveAspectRatio="none"
          viewBox="0 0 100 1000"
        >
          <path
            d="M 50 0 C 80 150, 20 300, 70 450 C 110 600, 30 750, 50 1000"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            className="swarm-path"
            style={{ opacity: 0.35 }}
          />
          {/* Pheromone Nodes / Footprints */}
          <circle cx="50" cy="150" r="3" fill="currentColor" style={{ opacity: 0.6 }} />
          <circle cx="35" cy="350" r="3" fill="currentColor" style={{ opacity: 0.6 }} />
          <circle cx="85" cy="550" r="3" fill="currentColor" style={{ opacity: 0.6 }} />
          <circle cx="45" cy="780" r="3" fill="currentColor" style={{ opacity: 0.6 }} />
        </svg>

        {/* Ant 1 */}
        <div
          className="swarm-ant-crawl"
          style={{
            position: 'absolute',
            top: '12%',
            left: '52%',
            transform: 'translate(-50%, -50%) rotate(15deg)',
            width: '40px',
            height: '40px',
            color: 'var(--color-accent-green)',
          }}
        >
          <AntSvg />
        </div>

        {/* Ant 2 */}
        <div
          className="swarm-ant-crawl"
          style={{
            position: 'absolute',
            top: '38%',
            left: '25%',
            transform: 'translate(-50%, -50%) rotate(-35deg)',
            width: '45px',
            height: '45px',
            color: 'var(--color-accent-green)',
            animationDelay: '1s',
          }}
        >
          <AntSvg />
        </div>

        {/* Ant 3 */}
        <div
          className="swarm-ant-crawl"
          style={{
            position: 'absolute',
            top: '62%',
            left: '65%',
            transform: 'translate(-50%, -50%) rotate(45deg)',
            width: '38px',
            height: '38px',
            color: 'var(--color-accent-green)',
            animationDelay: '2.5s',
          }}
        >
          <AntSvg />
        </div>

        {/* Ant 4 */}
        <div
          className="swarm-ant-crawl"
          style={{
            position: 'absolute',
            top: '85%',
            left: '42%',
            transform: 'translate(-50%, -50%) rotate(-10deg)',
            width: '42px',
            height: '42px',
            color: 'var(--color-accent-green)',
            animationDelay: '1.8s',
          }}
        >
          <AntSvg />
        </div>
      </div>

      {/* Right Margin: Particle Swarm / Bee Colony (PSO/ABC) Flight */}
      <div className="swarm-bg-side swarm-bg-side-right">
        {/* SVG background flight vector paths */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100%',
            height: '100%',
            overflow: 'visible',
            color: 'var(--color-accent-gold)',
          }}
          preserveAspectRatio="none"
          viewBox="0 0 100 1000"
        >
          <path
            d="M 50 0 C 10 200, 90 400, 20 600 C -20 750, 80 880, 50 1000"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            className="swarm-path"
            style={{ opacity: 0.25 }}
          />
          {/* Best Global Optimum / Target particles */}
          <circle cx="30" cy="230" r="2.5" fill="currentColor" style={{ opacity: 0.5 }} />
          <circle cx="70" cy="480" r="2.5" fill="currentColor" style={{ opacity: 0.5 }} />
          <circle cx="20" cy="720" r="2.5" fill="currentColor" style={{ opacity: 0.5 }} />
        </svg>

        {/* Bee 1 */}
        <div
          className="swarm-float-slow-1"
          style={{
            position: 'absolute',
            top: '18%',
            right: '48%',
            transform: 'translate(50%, -50%)',
            width: '46px',
            height: '46px',
            color: 'var(--color-accent-gold)',
          }}
        >
          <BeeSvg />
        </div>

        {/* Bee 2 */}
        <div
          className="swarm-float-slow-2"
          style={{
            position: 'absolute',
            top: '48%',
            right: '25%',
            transform: 'translate(50%, -50%)',
            width: '42px',
            height: '42px',
            color: 'var(--color-accent-gold)',
          }}
        >
          <BeeSvg />
        </div>

        {/* Bee 3 */}
        <div
          className="swarm-float-slow-3"
          style={{
            position: 'absolute',
            top: '78%',
            right: '58%',
            transform: 'translate(50%, -50%)',
            width: '48px',
            height: '48px',
            color: 'var(--color-accent-gold)',
          }}
        >
          <BeeSvg />
        </div>
      </div>
    </div>
  );
}

// Custom modern geometric Ant SVG
function AntSvg() {
  return (
    <svg viewBox="0 0 100 100" fill="none" style={{ width: '100%', height: '100%' }}>
      {/* Antennae */}
      <path
        d="M 46 25 Q 40 16 33 18"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M 54 25 Q 60 16 67 18"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      
      {/* Head */}
      <circle cx="50" cy="28" r="5" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.2" />
      
      {/* Neck & Thorax */}
      <ellipse cx="50" cy="42" rx="4.5" ry="7" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.2" />
      
      {/* Abdomen */}
      <ellipse cx="50" cy="64" rx="7" ry="12" fill="currentColor" fillOpacity="0.28" stroke="currentColor" strokeWidth="1.2" />
      
      {/* Front Legs */}
      <path
        d="M 46 39 C 32 35, 26 40, 22 46"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M 54 39 C 68 35, 74 40, 78 46"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      
      {/* Middle Legs */}
      <path
        d="M 45 43 C 28 44, 22 52, 18 60"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M 55 43 C 72 44, 78 52, 82 60"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      
      {/* Back Legs */}
      <path
        d="M 46 47 C 26 53, 20 62, 16 74"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M 54 47 C 74 53, 80 62, 84 74"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Custom modern geometric Bee SVG
function BeeSvg() {
  return (
    <svg viewBox="0 0 100 100" fill="none" style={{ width: '100%', height: '100%' }}>
      {/* Wing Left */}
      <path
        d="M 44 40 C 22 28, 12 45, 39 46 Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="1.2"
        className="swarm-wing-vibrate-left"
      />
      
      {/* Wing Right */}
      <path
        d="M 56 40 C 78 28, 88 45, 61 46 Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="1.2"
        className="swarm-wing-vibrate-right"
      />
      
      {/* Antennae */}
      <path
        d="M 47 24 Q 42 16, 37 18"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M 53 24 Q 58 16, 63 18"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      
      {/* Head */}
      <circle cx="50" cy="27" r="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.2" />
      
      {/* Thorax */}
      <ellipse cx="50" cy="38" rx="6" ry="7" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.2" />
      
      {/* Abdomen stripes and outline */}
      <path
        d="M 45 45 C 44 55, 43 62, 50 74 C 57 62, 56 55, 55 45 Z"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      
      {/* Internal stripe indicators */}
      <path d="M 44.5 50 Q 50 49 55.5 50" stroke="currentColor" strokeWidth="1" />
      <path d="M 43.8 56 Q 50 55 56.2 56" stroke="currentColor" strokeWidth="1" />
      <path d="M 45 62 Q 50 61 55 62" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
