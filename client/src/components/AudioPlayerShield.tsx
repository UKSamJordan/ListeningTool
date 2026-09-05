import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, AlertCircle, CheckCircle2, Lock, Radio } from 'lucide-react';

interface AudioPlayerShieldProps {
  youtubeUrl: string;
  showVideo: boolean;
  maxListens: number;
  listensUsed: number;
  onListenStart: () => Promise<boolean>;
  onListenFinished?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function extractVideoId(url: string | undefined | null): string {
  if (!url) return "wbNeIn3vVKM";
  const trimmed = url.trim();
  if (!trimmed) return "wbNeIn3vVKM";

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);

    // Query parameter ?v=
    const vParam = urlObj.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
      return vParam;
    }

    // Shortened URL youtu.be/<id>
    if (urlObj.hostname.includes('youtu.be')) {
      const id = urlObj.pathname.replace(/^\/+/, '').split('/')[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return id;
      }
    }

    // Embed, Shorts, Live paths: /embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const triggerIndex = pathParts.findIndex(p => ['embed', 'shorts', 'live', 'v'].includes(p));
    if (triggerIndex !== -1 && pathParts[triggerIndex + 1]) {
      const candidate = pathParts[triggerIndex + 1];
      if (/^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
        return candidate;
      }
    }
  } catch (e) {
    // Fallback if URL parsing fails
  }

  // Regex for standard formats
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1] && match[1].length === 11) {
    return match[1];
  }

  // Search for any 11-char candidate in the string
  const anyIdMatch = trimmed.match(/(?:^|[^a-zA-Z0-9_-])([a-zA-Z0-9_-]{11})(?:[^a-zA-Z0-9_-]|$)/);
  if (anyIdMatch && anyIdMatch[1]) {
    return anyIdMatch[1];
  }

  return "wbNeIn3vVKM";
}

export const AudioPlayerShield: React.FC<AudioPlayerShieldProps> = ({
  youtubeUrl,
  showVideo,
  maxListens,
  listensUsed,
  onListenStart,
  onListenFinished
}) => {
  const videoId = extractVideoId(youtubeUrl);
  const playerRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [localListens, setLocalListens] = useState<number>(listensUsed);
  const [listenRecordedForCurrentPlay, setListenRecordedForCurrentPlay] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const listensLeft = Math.max(0, maxListens - localListens);
  const isLocked = listensLeft <= 0;

  useEffect(() => {
    setLocalListens(listensUsed);
  }, [listensUsed]);

  // Handle videoId or showVideo updates
  useEffect(() => {
    if (!videoId) return;

    // If player already exists and controls layout (showVideo) hasn't changed, cue the new video directly
    if (playerRef.current && typeof playerRef.current.cueVideoById === 'function') {
      try {
        playerRef.current.cueVideoById(videoId);
        setCurrentTime(0);
        setIsPlaying(false);
        setListenRecordedForCurrentPlay(false);
        return;
      } catch (e) {
        // If cueing fails, fall through to re-init
      }
    }

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      const target = document.getElementById('yt-player-instance');
      if (!target) return;

      try {
        playerRef.current = new window.YT.Player('yt-player-instance', {
          videoId: videoId,
          playerVars: {
            controls: showVideo ? 1 : 0,
            disablekb: showVideo ? 0 : 1,
            fs: showVideo ? 1 : 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
          },
          events: {
            onReady: (event: any) => {
              setDuration(event.target.getDuration() || 0);
            },
            onStateChange: (event: any) => {
              if (event.data === 1) {
                setIsPlaying(true);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                setIsPlaying(false);
                setListenRecordedForCurrentPlay(false);
                if (onListenFinished) onListenFinished();
              }
            }
          }
        });
      } catch (err) {
        console.error("Failed to initialize YT Player:", err);
      }
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }
  }, [videoId, showVideo]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try { playerRef.current.destroy(); } catch (e) {}
        playerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying && playerRef.current && playerRef.current.getCurrentTime) {
      interval = setInterval(() => {
        const t = playerRef.current.getCurrentTime();
        setCurrentTime(t);
      }, 500);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePlayToggle = async () => {
    setErrorMessage('');
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      if (!listenRecordedForCurrentPlay) {
        if (isLocked) {
          setErrorMessage("You have already used all 2 listening opportunities.");
          return;
        }

        const approved = await onListenStart();
        if (!approved) {
          setErrorMessage("Listen limit reached on the server.");
          return;
        }

        setLocalListens(prev => prev + 1);
        setListenRecordedForCurrentPlay(true);
      }

      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const handleMuteToggle = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-8">
      
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="font-bold text-sm tracking-wide uppercase text-slate-200">Listening Station</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
            {showVideo ? "Video Visible" : "Audio-Only Shield"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isLocked ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>0 of {maxListens} Listens Left (Locked)</span>
            </div>
          ) : listensLeft === 1 ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Final Listen! (1 of {maxListens} remaining)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{listensLeft} of {maxListens} Listens Remaining</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {showVideo ? (
          <div className="relative mb-6 rounded-2xl overflow-hidden bg-black shadow-inner aspect-video max-w-2xl mx-auto">
            <div id="yt-player-instance" className="w-full h-full"></div>
            {isLocked && !isPlaying && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 text-white z-20">
                <Lock className="w-12 h-12 text-rose-400 mb-2" />
                <h4 className="text-lg font-bold">Listen Limit Reached</h4>
                <p className="text-slate-300 text-xs mt-1 max-w-xs">
                  You have completed both permitted listens for this assessment.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="absolute -left-[9999px] top-0 opacity-0 pointer-events-none">
              <div id="yt-player-instance"></div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden max-w-2xl mx-auto border border-blue-900/40">
              
              <div className="flex items-center justify-center gap-1.5 h-16 sm:h-20 mb-6 bg-slate-950/60 rounded-2xl px-6 border border-white/5">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-300 ${
                      isPlaying
                        ? 'wave-bar bg-gradient-to-t from-amber-400 to-amber-200'
                        : 'h-2 bg-slate-700'
                    }`}
                    style={{
                      height: isPlaying ? undefined : '6px',
                      animationDelay: `${(i % 8) * 0.1}s`
                    }}
                  />
                ))}
              </div>

              <div className="text-center mb-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                  {isPlaying ? 'Now Playing Cambridge Audio' : isLocked ? 'Audio Locked' : 'Ready to Listen'}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                  Cambridge Stage 6 Listening Track
                </h3>
              </div>

              <div className="space-y-1.5 mb-6">
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-300"
                    style={{
                      width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%'
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={handleMuteToggle}
                  className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={handlePlayToggle}
                  disabled={isLocked && !isPlaying}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-bold shadow-2xl transition transform hover:scale-105 active:scale-95 cursor-pointer ${
                    isLocked && !isPlaying
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                      : isPlaying
                      ? 'bg-amber-400 text-blue-950 shadow-amber-400/30'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/40'
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 fill-current" />
                  ) : isLocked ? (
                    <Lock className="w-7 h-7" />
                  ) : (
                    <Play className="w-8 h-8 fill-current ml-1" />
                  )}
                </button>

                <div className="p-3 rounded-full bg-slate-800/80 text-xs font-bold text-amber-300 min-w-[50px] text-center border border-slate-700">
                  {listensLeft} left
                </div>
              </div>

            </div>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-slate-500 max-w-md mx-auto">
          💡 <span className="font-semibold text-slate-700">Cambridge Listening Tip:</span> You can take notes on paper while listening. Remember you have exactly <strong>2 opportunities</strong> to play the audio!
        </div>

      </div>

    </div>
  );
};
