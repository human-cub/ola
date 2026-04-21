import { useState, useRef } from "react";
import { Play } from "lucide-react";
import videoCover from "@/assets/video-cover.png";
import { cn } from "@/lib/utils";

export const HowToBuyVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
      showControlsTemporarily();
    }
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    video.currentTime = (x / rect.width) * video.duration;
  };

  const skip = (seconds: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    showControlsTemporarily();
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    showControlsTemporarily();
  };

  return (
    <div
      className="relative max-w-md md:max-w-xs mx-auto mb-6 rounded-2xl overflow-hidden cursor-pointer group"
      onClick={handlePlayPause}
    >
      <video
        ref={videoRef}
        src="https://gl71nzm2l7iaribb.public.blob.vercel-storage.com/ola_optimized_b.mp4"
        playsInline
        preload="none"
        className="w-full rounded-2xl"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => { setIsPlaying(false); setProgress(0); }}
      />

      {!isPlaying && progress === 0 && (
        <>
          <div
            className="absolute inset-0 rounded-2xl bg-no-repeat bg-cover"
            style={{ backgroundImage: `url(${videoCover})`, backgroundPosition: '50% 35%' }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </div>
        </>
      )}

      {!isPlaying && progress > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg" onClick={handlePlayPause}>
            <Play className="w-6 h-6 text-primary-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>
      )}

      {(isPlaying || progress > 0) && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent px-5 pb-4 pt-10 transition-opacity duration-300",
            (showControls || !isPlaying) ? "opacity-100" : "opacity-0"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full h-2.5 bg-white/30 rounded-full mb-4 cursor-pointer" onClick={handleProgressClick}>
            <div className="h-full bg-primary rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>

          <div className="flex items-center">
            <div className="flex-1" />
            <div className="flex items-center gap-8">
              <button onClick={skip(-5)} className="text-white/90 hover:text-white transition-colors">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                  <text x="12" y="15.5" fontSize="7.5" textAnchor="middle" fontWeight="bold" fontFamily="Arial">5</text>
                </svg>
              </button>

              <button onClick={(e) => { e.stopPropagation(); handlePlayPause(); }} className="text-white/90 hover:text-white transition-colors">
                {isPlaying ? (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                ) : (
                  <Play className="w-8 h-8" fill="currentColor" />
                )}
              </button>

              <button onClick={skip(5)} className="text-white/90 hover:text-white transition-colors">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                  <text x="12" y="15.5" fontSize="7.5" textAnchor="middle" fontWeight="bold" fontFamily="Arial">5</text>
                </svg>
              </button>
            </div>
            <div className="flex-1 flex justify-end">
              <button onClick={toggleMute} className="text-white/90 hover:text-white transition-colors">
                {isMuted ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};