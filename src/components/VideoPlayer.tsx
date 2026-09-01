import { useRef, useState, useEffect } from "react";
import { Lock, Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, Loader2 } from "lucide-react";

type VideoPlayerProps = {
  src: string;
  poster?: string;
  title?: string;
};

export default function VideoPlayer({ src, poster, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  }

  function handleLoadedMetadata() {
    const v = videoRef.current;
    if (v) setDuration(v.duration);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    v.currentTime = (parseFloat(e.target.value) / 100) * v.duration;
    setProgress(parseFloat(e.target.value));
  }

  function handleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  }

  function formatTime(seconds: number) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function onActivity() {
    setShowControls(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-ink-950 rounded-2xl overflow-hidden group"
      onMouseMove={onActivity}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => { setBuffering(false); setPlaying(true); }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onClick={togglePlay}
        preload="metadata"
      />

      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-10 h-10 text-white/80 animate-spin" />
        </div>
      )}

      {!playing && !buffering && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-ink-950/30 transition-opacity"
          aria-label="Lecture"
        >
          <span className="w-16 h-16 rounded-full bg-sakura-500/90 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Play className="w-7 h-7 text-white ml-0.5" fill="currentColor" />
          </span>
        </button>
      )}

      {title && (
        <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-ink-950/70 to-transparent transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
          <p className="text-white font-medium text-sm truncate">{title}</p>
        </div>
      )}

      <div className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-ink-950/80 to-transparent transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={handleSeek}
          className="video-seek w-full"
          style={{ "--progress": `${progress}%` } as React.CSSProperties}
        />
        <div className="flex items-center gap-3 mt-2">
          <button onClick={togglePlay} className="text-white hover:text-sakura-300 transition-colors" aria-label={playing ? "Pause" : "Lecture"}>
            {playing ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5" fill="currentColor" />}
          </button>
          <button onClick={toggleMute} className="text-white hover:text-sakura-300 transition-colors" aria-label={muted ? "Activer le son" : "Couper le son"}>
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <span className="text-xs text-white/80 font-mono tabular-nums">
            {formatTime(videoRef.current?.currentTime ?? 0)} / {formatTime(duration)}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => { const v = videoRef.current; if (v) { v.currentTime = 0; setProgress(0); } }}
            className="text-white hover:text-sakura-300 transition-colors"
            aria-label="Recommencer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={handleFullscreen} className="text-white hover:text-sakura-300 transition-colors" aria-label="Plein écran">
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function LockedVideoPlayer({ poster, title, onUnlock, unlockLabel }: { poster?: string; title?: string; onUnlock?: () => void; unlockLabel: string }) {
  return (
    <div className="relative w-full aspect-video bg-ink-950 rounded-2xl overflow-hidden">
      {poster && <img src={poster} alt="" className="w-full h-full object-cover opacity-40" />}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-ink-900/80 flex items-center justify-center backdrop-blur-sm">
          <Lock className="w-7 h-7 text-sakura-400" />
        </div>
        <div>
          {title && <p className="text-white font-semibold mb-1">{title}</p>}
          <p className="text-ink-300 text-sm">Achetez ce tutoriel pour débloquer la vidéo complète</p>
        </div>
        {onUnlock && (
          <button className="btn-primary text-sm" onClick={onUnlock}>
            {unlockLabel}
          </button>
        )}
      </div>
    </div>
  );
}
