import React, { useRef, useState, useEffect } from 'react';

interface TransitionOverlayProps {
  type: 'enter' | 'exit';
  origin?: string;
  destination?: string;
  onComplete: () => void;
}

export const TransitionOverlay: React.FC<TransitionOverlayProps> = ({
  type,
  origin = 'ATL',
  destination = 'JFK',
  onComplete,
}) => {
  const baseUrl = import.meta.env.BASE_URL;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stage, setStage] = useState<'takeoff' | 'cockpit'>(type === 'enter' ? 'takeoff' : 'cockpit');

  const currentVideo = stage === 'takeoff'
    ? `${baseUrl}videos/start.mp4`
    : `${baseUrl}videos/transition.mp4`;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch((err) => {
        console.warn('Autoplay diblokir browser:', err);
      });
    }
  }, [stage]);

  const handleVideoEnded = () => {
    if (type === 'enter') {
      if (stage === 'takeoff') {
        setStage('cockpit');
      } else {
        onComplete();
      }
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden pointer-events-auto">
      <video
        ref={videoRef}
        src={currentVideo}
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnded}
        onError={() => {
          console.error('File video tidak terdeteksi di public/videos/, melanjutkan ke dashboard...');
          onComplete();
        }}
        className="w-full h-full object-cover"
      />

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-slate-950/85 border border-cyan-500/50 text-cyan-400 font-mono text-xs backdrop-blur-md shadow-[0_0_25px_rgba(6,182,212,0.5)] tracking-wider uppercase flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
        {stage === 'takeoff'
          ? `✈ MEMPROSES LEPAS LANDAS RUTE ${origin} ➔ ${destination}...`
          : '🛩 MEMASUKI KOKPIT ANALITIKA FLIGHTINSIGHT...'}
      </div>
    </div>
  );
};