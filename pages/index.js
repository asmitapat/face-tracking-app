import Head from 'next/head';
import FaceTracker from '../components/FaceTracker';
import Navigation from '../components/Navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const [showSaved, setShowSaved] = useState(false);

  const handleSavedVideosClick = () => {
    setShowSaved(true);
    setTimeout(() => {
      const el = document.getElementById('saved-video-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <>
      <Head>
        <title>Face Tracking App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Navigation onSavedVideosClick={handleSavedVideosClick} />
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 0 0 0' }}>
        <FaceTracker />
        {showSaved && <SavedVideo />}
      </main>
    </>
  );
}

const SavedVideo = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const arr = JSON.parse(localStorage.getItem('recordedVideos')) || [];
        setVideos(arr.reverse()); // show most recent first
      } catch {
        setVideos([]);
      }
    }
  }, []);

  const handleDelete = (idxToDelete) => {
    const arr = [...videos];
    arr.splice(idxToDelete, 1);
    setVideos(arr);
    // Save back to localStorage (reverse again to keep order)
    localStorage.setItem('recordedVideos', JSON.stringify([...arr].reverse()));
  };

  if (!hasMounted || !videos.length) return null;

  return (
    <div id="saved-video-section" className="face-card" style={{ marginTop: 32, maxWidth: 700 }}>
      <h2 style={{ color: '#6366f1', fontWeight: 700, fontSize: '1.4rem', marginBottom: 16 }}>Saved Videos:</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {videos.map((vid, idx) => (
          <div key={vid.date + idx} style={{ marginBottom: 8, position: 'relative' }}>
            <video 
              controls 
              width="480" 
              src={vid.data} 
              className="rounded shadow-lg w-full" 
              style={{ background: '#e0e7ef', borderRadius: 16, width: '100%', maxWidth: 480 }}
            />
            <div style={{ fontSize: '0.95em', color: '#64748b', marginTop: 4 }}>
              Saved: {new Date(vid.date).toLocaleString()}
            </div>
            <button
              onClick={() => handleDelete(idx)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '0.4em 1em',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(239,68,68,0.08)',
                fontSize: '0.95em',
                transition: 'background 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#b91c1c'}
              onMouseOut={e => e.currentTarget.style.background = '#ef4444'}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};