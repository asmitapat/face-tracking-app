import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { saveVideo } from '../utils/indexedDb';

const FaceTracker = ({ onRecordingSaved }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recordingCanvasRef = useRef(null);
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
      const recordingCanvas = recordingCanvasRef.current;
      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);
      intervalId = setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        // Draw on visible overlay
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        setFaceDetected(resizedDetections.length > 0);
        // Draw on hidden recording canvas
        if (recordingCanvas) {
          const ctx = recordingCanvas.getContext('2d');
          ctx.clearRect(0, 0, recordingCanvas.width, recordingCanvas.height);
          ctx.drawImage(video, 0, 0, recordingCanvas.width, recordingCanvas.height);
          faceapi.draw.drawDetections(recordingCanvas, resizedDetections);
        }
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
    // Get video stream from canvas
    const recordingCanvas = recordingCanvasRef.current;
    const canvasStream = recordingCanvas.captureStream(30); // 30 fps for smoother video
    // Get audio track from webcam stream
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0) {
      canvasStream.addTrack(audioTracks[0]);
    }
    const recorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm' });
    setMediaRecorder(recorder);
    recordedChunks.current = [];
    setStatus('Recording...');

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.current.push(event.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
      try {
        await saveVideo(blob);
        setStatus('Recording saved!');
        if (onRecordingSaved) onRecordingSaved();
      } catch (e) {
        setStatus('Failed to save recording.');
      }
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
    <section className="w-full flex flex-col items-center justify-center px-2">
      <div
        className={cardClass + " w-full max-w-xl flex flex-col items-center bg-white rounded-lg shadow-md p-4 sm:p-8 mt-6"}
      >
        {/* Hidden canvas for recording */}
        <canvas ref={recordingCanvasRef} width={640} height={480} style={{ display: 'none' }} />
        <header className="w-full mb-2">
          <p className="instructions text-center text-base sm:text-lg text-slate-700 mb-2">
            Allow camera access. Position your face in the frame. Click <b>Start Recording</b> to record.<br />
            <span className="text-sm text-slate-400">Your video is processed locally and never uploaded.</span>
          </p>
        </header>
        {cameraError && (
          <div className="text-red-500 font-semibold my-6 text-center text-lg">{cameraError}</div>
        )}
        {loading ? (
          <div className="loader flex justify-center items-center my-8" aria-label="Loading...">
            <span className="loader-dot" />
            <span className="loader-dot" />
            <span className="loader-dot" />
          </div>
        ) : (
          <div className="relative w-full aspect-video bg-slate-200 rounded-lg overflow-hidden shadow max-w-2xl sm:max-w-xl" style={{ maxWidth: '100vw', minHeight: 240 }}>
            <video
              ref={videoRef}
              width="640"
              height="480"
              autoPlay
              muted
              className="w-full h-full object-cover rounded-lg bg-slate-200 block"
            />
            <canvas
              ref={canvasRef}
              width="640"
              height="480"
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
          </div>
        )}
        <div className="status-message text-center text-slate-600 mt-4">{status}</div>
        {!loading && !cameraError && (
          <div className={
            (faceDetected === null
              ? 'face-feedback'
              : faceDetected
              ? 'face-feedback'
              : 'face-feedback no-face') +
            ' flex items-center justify-center mt-2 mb-2 text-base sm:text-lg'
          }>
            {faceDetected === null ? (
              <>
                <span className="face-icon mr-2" aria-label="searching">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#6366f1" strokeWidth="2"/><path d="M16 16L21 21" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/></svg>
                </span>
                Looking for a face...
              </>
            ) : faceDetected ? (
              <>
                <span className="face-icon mr-2" aria-label="face detected">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2"/><path d="M8 13l2.5 2.5L16 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                Face Detected!
              </>
            ) : (
              <>
                <span className="face-icon mr-2" aria-label="no face">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/><path d="M9 9l6 6M15 9l-6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
                </span>
                No Face Detected
              </>
            )}
          </div>
        )}
        <div className="mt-8 flex gap-4 w-full justify-center relative">
          {!recording ? (
            <button
              onClick={startRecording}
              className="creative-btn flex items-center gap-2 px-6 py-2 rounded-lg bg-green-400 hover:bg-green-500 text-white font-semibold shadow transition disabled:opacity-50 disabled:cursor-not-allowed relative"
              disabled={loading || !stream || !!cameraError || !faceDetected}
              onMouseEnter={() => { if (!faceDetected) setShowFaceTooltip(true); }}
              onMouseLeave={() => setShowFaceTooltip(false)}
            >
              <span aria-label="record icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" fill="#fff" stroke="#34d399" strokeWidth="2"/><circle cx="10" cy="10" r="5" fill="#34d399"/></svg>
              </span>
              Start Recording
              {rippleStyle && <span className="ripple absolute" style={rippleStyle} />}
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="creative-btn recording flex items-center gap-2 px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold shadow transition relative"
            >
              <span aria-label="stop icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" fill="#fff" stroke="#ef4444" strokeWidth="2"/><rect x="7" y="7" width="6" height="6" rx="1" fill="#ef4444"/></svg>
              </span>
              Stop Recording
              {rippleStyle && <span className="ripple absolute" style={rippleStyle} />}
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