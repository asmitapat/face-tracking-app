import React from 'react';

const Navigation = ({ onSavedVideosClick }) => (
  <nav className="nav-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <span className="nav-title" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', letterSpacing: 1, marginLeft: 10 }}>
      Face Tracking + Recording
    </span>
    <ul className="nav-list" style={{ marginLeft: 'auto' }}>
      <li className="nav-box nav-box-2">
        <button onClick={onSavedVideosClick} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', padding: 0 }}>
          Saved Videos
        </button>
      </li>
    </ul>
  </nav>
);

export default Navigation; 