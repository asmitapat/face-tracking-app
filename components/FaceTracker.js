import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const FaceTracker = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const recordedChunks = useRef([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Loading models and camera...');
  const [faceDetected, setFaceDetected] = useState(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [rippleStyle, setRippleStyle] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [stream, setStream] = useState(null);
  const [showFaceTooltip, setShowFaceTooltip] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    };

    const startCamera = async () => {
      try {
        const streamObj = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(streamObj);
        setCameraError(null);
      } catch (err) {
        setCameraError('Camera access denied or unavailable. Please allow camera access and refresh the page.');
        setStatus('Camera access denied or unavailable.');
        setStream(null);
        console.error('Camera error:', err);
      }
    };

    loadModels().then(startCamera).then(() => {
      setLoading(false);
      setStatus('Ready!');
    });
  }, [hasMounted]);

  // Attach stream to video element as soon as both are available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  useEffect(() => {
    let intervalId;
    const handleVideoPlay = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);
      intervalId = setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        setFaceDetected(resizedDetections.length > 0);
      }, 200);
    };
    if (!loading && hasMounted && videoRef.current) {
      videoRef.current.onplay = handleVideoPlay;
    }
    return () => clearInterval(intervalId);
  }, [loading, hasMounted]);

  const startRecording = (e) => {
    handleRipple(e);
    if (!stream || !(stream instanceof MediaStream)) {
      setStatus('Camera not ready. Please wait and try again.');
      return;
    }
    if (!faceDetected) {
      setStatus('Please position your face in the frame to start recording.');
      setShowFaceTooltip(true);
      setTimeout(() => setShowFaceTooltip(false), 2000);
      return;
    }
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    setMediaRecorder(recorder);
    recordedChunks.current = [];
    setStatus('Recording...');

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.current.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result;
        // Store as array of videos, max 5
        let videos = [];
        try {
          videos = JSON.parse(localStorage.getItem('recordedVideos')) || [];
        } catch (e) { videos = []; }
        if (videos.length >= 5) {
          videos.shift(); // remove oldest
        }
        videos.push({ data: base64data, date: new Date().toISOString() });
        localStorage.setItem('recordedVideos', JSON.stringify(videos));
        setStatus('Recording saved!');
      };
      recordedChunks.current = [];
    };

    recorder.start();
    setRecording(true);
  };

  const stopRecording = (e) => {
    handleRipple(e);
    mediaRecorder.stop();
    setRecording(false);
    setStatus('Stopped recording.');
  };

  // Ripple effect handler
  const handleRipple = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    setRippleStyle({
      top: y + 'px',
      left: x + 'px',
      width: size + 'px',
      height: size + 'px',
    });
    setTimeout(() => setRippleStyle(null), 600);
  };

  if (!hasMounted) return <div style={{ minHeight: 480 }} />;

  // Card border animation based on face detection
  let cardClass = 'face-card';
  if (faceDetected === true) cardClass += ' glow';
  if (faceDetected === false) cardClass += ' no-face';

  return (
    <section className="main-section">
      <div className={cardClass} style={{ maxWidth: 700, margin: '40px auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <header style={{ width: '100%' }}>
          <p className="instructions">
            Allow camera access. Position your face in the frame. Click <b>Start Recording</b> to record.<br />
            <span style={{fontSize: '0.95em', color: '#94a3b8'}}>Your video is processed locally and never uploaded.</span>
          </p>
        </header>
        {cameraError && (
          <div style={{ color: '#ef4444', fontWeight: 600, margin: '1.5em 0', fontSize: '1.1em', textAlign: 'center' }}>{cameraError}</div>
        )}
        {loading ? (
          <div className="loader" aria-label="Loading...">
            <span className="loader-dot" />
            <span className="loader-dot" />
            <span className="loader-dot" />
          </div>
        ) : (
          <div style={{ position: 'relative', width: 640, height: 480, margin: '0 auto', background: '#e0e7ef', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <video
              ref={videoRef}
              width="640"
              height="480"
              autoPlay
              muted
              style={{ borderRadius: 16, width: '100%', height: '100%', display: 'block', background: '#e0e7ef' }}
            />
            <canvas
              ref={canvasRef}
              width="640"
              height="480"
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', width: '100%', height: '100%' }}
            />
          </div>
        )}
        <div className="status-message">{status}</div>
        {!loading && !cameraError && (
          <div className={
            faceDetected === null
              ? 'face-feedback'
              : faceDetected
              ? 'face-feedback'
              : 'face-feedback no-face'
          }>
            {faceDetected === null ? (
              <>
                <span className="face-icon" aria-label="searching">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#6366f1" strokeWidth="2"/><path d="M16 16L21 21" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/></svg>
                </span>
                Looking for a face...
              </>
            ) : faceDetected ? (
              <>
                <span className="face-icon" aria-label="face detected">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2"/><path d="M8 13l2.5 2.5L16 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                Face Detected!
              </>
            ) : (
              <>
                <span className="face-icon" aria-label="no face">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/><path d="M9 9l6 6M15 9l-6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
                </span>
                No Face Detected
              </>
            )}
          </div>
        )}
        <div style={{ marginTop: 32, display: 'flex', gap: 16, position: 'relative' }}>
          {!recording ? (
            <button
              onClick={startRecording}
              className="creative-btn"
              disabled={loading || !stream || !!cameraError || !faceDetected}
              style={loading || !stream || !!cameraError || !faceDetected ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              onMouseEnter={() => { if (!faceDetected) setShowFaceTooltip(true); }}
              onMouseLeave={() => setShowFaceTooltip(false)}
            >
              <span aria-label="record icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" fill="#fff" stroke="#34d399" strokeWidth="2"/><circle cx="10" cy="10" r="5" fill="#34d399"/></svg>
              </span>
              Start Recording
              {rippleStyle && <span className="ripple" style={rippleStyle} />}
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="creative-btn recording"
            >
              <span aria-label="stop icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" fill="#fff" stroke="#ef4444" strokeWidth="2"/><rect x="7" y="7" width="6" height="6" rx="1" fill="#ef4444"/></svg>
              </span>
              Stop Recording
              {rippleStyle && <span className="ripple" style={rippleStyle} />}
            </button>
          )}
          {showFaceTooltip && !faceDetected && (
            <div style={{
              position: 'absolute',
              top: '110%',
              left: 0,
              background: '#fff',
              color: '#ef4444',
              border: '1px solid #ef4444',
              borderRadius: 8,
              padding: '0.5em 1em',
              fontWeight: 500,
              fontSize: '1em',
              boxShadow: '0 2px 8px rgba(239,68,68,0.08)',
              zIndex: 10
            }}>
              Please position your face in the frame to start recording.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FaceTracker;