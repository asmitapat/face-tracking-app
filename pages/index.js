import Head from 'next/head';
import FaceTracker from '../components/FaceTracker';
import Navigation from '../components/Navigation';
import { useEffect, useState } from 'react';
import { getAllVideos, deleteVideo as deleteDbVideo } from '../utils/indexedDb';

export default function Home() {
  const [showSaved, setShowSaved] = useState(false);
  const [refreshSaved, setRefreshSaved] = useState(0);

  const handleSavedVideosClick = () => {
    setShowSaved(true);
    setTimeout(() => {
      const el = document.getElementById('saved-video-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Called after a recording is saved
  const handleRecordingSaved = () => setRefreshSaved((r) => r + 1);

  return (
    <>
      <Head>
        <title>Face Tracking App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Navigation onSavedVideosClick={handleSavedVideosClick} />
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 pt-6 px-2 sm:px-0">
        <div className="w-full max-w-2xl flex flex-col items-center">
          <FaceTracker onRecordingSaved={handleRecordingSaved} />
          {showSaved && <SavedVideo refresh={refreshSaved} />}
        </div>
      </main>
    </>
  );
}

const SavedVideo = ({ refresh }) => {
  const [hasMounted, setHasMounted] = useState(false);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    getAllVideos().then(setVideos);
  }, [refresh]);

  const handleDelete = async (id) => {
    await deleteDbVideo(id);
    setVideos(videos.filter(v => v.id !== id));
  };

  if (!hasMounted || !videos.length) return null;

  return (
    <div id="saved-video-section" className="w-full max-w-xl bg-white rounded-lg shadow-md mt-8 p-4 sm:p-8">
      <h2 className="text-indigo-600 font-bold text-lg sm:text-xl mb-4">Saved Videos:</h2>
      <div className="flex flex-col gap-6">
        {videos.map((vid, idx) => (
          <div key={vid.id} className="relative mb-2">
            <video 
              controls 
              src={URL.createObjectURL(vid.blob)} 
              className="rounded-lg shadow w-full bg-slate-200 max-w-full"
              style={{ maxWidth: 480 }}
            />
            <div className="text-slate-500 text-sm mt-2">
              Saved: {new Date(vid.date).toLocaleString()}
            </div>
            <button
              onClick={() => handleDelete(vid.id)}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-700 text-white rounded px-3 py-1 font-semibold text-sm shadow transition-colors"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};