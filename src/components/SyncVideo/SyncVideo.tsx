import React, { useRef, useEffect, useState } from "react";
import { ReactCompareSlider } from "react-compare-slider";
import { LoaderIcon, Pause, Play, Volume2, VolumeX } from "lucide-react";
import "./index.css";
interface CacheEntry {
  url: string;
  refCount: number;
}
const videoCache = new Map<string, CacheEntry>();

const getCachedUrl = (src: string): string | null => {
  return videoCache.get(src)?.url || null;
};

const fetchAndCache = async (src: string): Promise<string> => {
  if (videoCache.has(src)) {
    const entry = videoCache.get(src)!;
    videoCache.set(src, { ...entry, refCount: entry.refCount + 1 });
    return entry.url;
  }

  const response = await fetch(src);
  if (!response.ok) throw new Error(`Failed to fetch ${src}`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  videoCache.set(src, { url, refCount: 1 });
  return url;
};

const releaseCachedUrl = (src: string): void => {
  if (!videoCache.has(src)) return;

  const entry = videoCache.get(src)!;
  entry.refCount -= 1;

  if (entry.refCount <= 0) {
    URL.revokeObjectURL(entry.url);
    videoCache.delete(src);
  }
};

export interface SynchronizedVideoProps {
  src1: string;
  src2: string;
  width?: string;
  height?: string;
  className1?: string;
  className2?: string;
  isPause?: boolean;
  isMute?: boolean;
  fallbackSrc?: string;
  type: string;
  //  Watermark Props (Removed)

  label1Text?: string;
  label2Text?: string;

  textStyleLabel1?: string;
  textStyleLabel2?: string;
  volumeSliderColor?: string;
  volumeSliderStyle?: string;
  timeLineStyle?: string;
  timeLineColor?: string;
  progressBarBackgroundColor?: string; // Add this line
  progressBarFilledColor?: string; // Add this line
  controlBarBackgroundColor?: string; // Add this line
  controlButtonColor?: string; // Add this line
  controlButtonHoverColor?: string; // Add this line
  timeTextColor?: string; // Add this line
  volumeSliderThumbColor?: string; // Add this line
  controlbarwidth?: string; // Add this line
}

const SynchronizedVideo: React.FC<SynchronizedVideoProps> = ({
  src1,
  type,
  src2,
  width,
  height,
  className1,
  className2,
  isPause,
  isMute,
  fallbackSrc,
  label1Text,
  label2Text,
  textStyleLabel1,
  textStyleLabel2,

  volumeSliderStyle,

  progressBarBackgroundColor = "bg-gray-300", // Default background color
  progressBarFilledColor = "bg-[#FFBF00]", // Default filled color
  controlBarBackgroundColor = "bg-[#212121]", // Default control bar color
  controlButtonColor = "#ffffff", // Default button color
  controlButtonHoverColor = "bg-gray-700", // Default hover color
  timeTextColor = "text-gray-600", // Default time text color
  volumeSliderThumbColor = "bg-[#FFBF00]", //Default volume slider color
  controlbarwidth
}) => {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const wasPlayingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [videosReady, setVideosReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(!isPause);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(isMute || false);
  const [volume, setVolume] = useState(1);
  const [videoUrls, setVideoUrls] = useState<{ url1: string | null; url2: string | null }>({
    url1: null,
    url2: null,
  });
  const [error, setError] = useState<string | null>(null);


  // Handle tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      const video1 = video1Ref.current;
      const video2 = video2Ref.current;

      if (!video1 || !video2) return;

      if (document.hidden) {
        wasPlayingRef.current = !video1.paused;
        video1.pause();
        video2.pause();
      } else {
        if (wasPlayingRef.current && !isPause) {
          Promise.all([
            video1.play().catch(() => {}),
            video2.play().catch(() => {})
          ]).then(() => setIsPlaying(true));
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPause]);

  // Fetch and cache videos
  useEffect(() => {
    let isMounted = true;

    const fetchVideos = async () => {
      try {
        const cachedUrl1 = getCachedUrl(src1);
        const cachedUrl2 = getCachedUrl(src2);

        const [url1, url2] = await Promise.all([
          cachedUrl1 ? Promise.resolve(cachedUrl1) : fetchAndCache(src1),
          cachedUrl2 ? Promise.resolve(cachedUrl2) : fetchAndCache(src2),
        ]);

        if (isMounted) setVideoUrls({ url1, url2 });
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load videos');
      }
    };

    if (src1 && src2) {
      fetchVideos();
    }

    return () => {
      isMounted = false;
      releaseCachedUrl(src1);
      releaseCachedUrl(src2);
    };
  }, [src1, src2]);

  // Handle video synchronization
  useEffect(() => {
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;

    if (!video1 || !video2) return;

    let loadedVideos = 0;

    const handleLoadedData = () => {
      loadedVideos += 1;
      if (loadedVideos === 2) {
        setVideosReady(true);
        setDuration(video1.duration);
        video1.loop = true;
        video2.loop = true;
        if (!isPause) {
          Promise.all([
            video1.play().catch(() => {}),
            video2.play().catch(() => {})
          ]);
        }
      }
    };

    const synchronizeVideos = (source: HTMLVideoElement, target: HTMLVideoElement) => {
      if (Math.abs(source.currentTime - target.currentTime) > 0.1) {
        target.currentTime = source.currentTime;
      }

      if (!document.hidden) {
        if (!source.paused && target.paused) {
          target.play().catch(() => {});
        } else if (source.paused && !target.paused) {
          target.pause();
        }
      }
    };

    const handleTimeUpdate = () => {
      if (video1 && !isDragging) {
        setProgress((video1.currentTime / video1.duration) * 100);
      }
    };

    const handleVideo1TimeUpdate = () => {
      if (video2) {
        synchronizeVideos(video1, video2);
      }
      handleTimeUpdate();
    };

    const handleVideo2TimeUpdate = () => {
      if (video1) {
        synchronizeVideos(video2, video1);
      }
    };

    video1.addEventListener("loadeddata", handleLoadedData);
    video2.addEventListener("loadeddata", handleLoadedData);
    video1.addEventListener("timeupdate", handleVideo1TimeUpdate);
    video2.addEventListener("timeupdate", handleVideo2TimeUpdate);

    // Set initial mute state
    video1.muted = isMuted;
    video2.muted = isMuted;

    return () => {
      video1.removeEventListener("loadeddata", handleLoadedData);
      video2.removeEventListener("loadeddata", handleLoadedData);
      video1.removeEventListener("timeupdate", handleVideo1TimeUpdate);
      video2.removeEventListener("timeupdate", handleVideo2TimeUpdate);
    };
  }, [isDragging, isMuted]);

  useEffect(() => {
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;

    if (!video1 || !video2 || !videosReady) return;

    if (isPause) {
      video1.pause();
      video2.pause();
      setIsPlaying(false);
    } else {
      Promise.all([
        video1.play().catch(() => {}),
        video2.play().catch(() => {})
      ]).then(() => setIsPlaying(true));
    }
  }, [isPause, videosReady]);

  const togglePlayPause = () => {
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;

    if (!video1 || !video2) return;

    if (isPlaying) {
      video1.pause();
      video2.pause();
      wasPlayingRef.current = false;
    } else {
      Promise.all([
        video1.play().catch(() => {}),
        video2.play().catch(() => {})
      ]);
      wasPlayingRef.current = true;
    }
    setIsPlaying(!isPlaying);
  };

  const seekToPosition = (clientX: number) => {
    const progressBar = progressBarRef.current;
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;

    if (!progressBar || !video1 || !video2) return;

    const rect = progressBar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = pos * video1.duration;

    const wasPlaying = !video1.paused;
    video1.pause();
    video2.pause();

    video1.currentTime = newTime;
    video2.currentTime = newTime;

    setProgress(pos * 100);

    if (wasPlaying) {
      Promise.all([
        video1.play().catch(() => {}),
        video2.play().catch(() => {})
      ]);
    }
  };

  const handleProgressBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    seekToPosition(e.clientX);

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        seekToPosition(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleMute = () => {
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;

    if (!video1 || !video2) return;

    const newMutedState = !isMuted;
    video1.muted = newMutedState;
    video2.muted = newMutedState;
    setIsMuted(newMutedState);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;

    if (!video1 || !video2) return;

    video1.volume = newVolume;
    video2.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return <div className="text-red-500">Error loading videos: {error}</div>;
  }

  return (
    <div className="synchronized-video-container" style={{width: width}}>
    {(src1 && src2) ? (
      <>
        <div className={`video-wrapper ${!videosReady ? 'loading' : 'loaded'}`}>
          <ReactCompareSlider
            position={70}
            itemOne={
              <div className="h-full w-full">
                <video
                  ref={video1Ref}
                  id="video1"
                  src={videoUrls.url1 || undefined}
                  preload="auto"
                  className={className1}
                  style={{ width: width, height: height, outline: "none" }}
                />
                <div className="video-label">
                  {label1Text}
                </div>
              </div>
            }
            itemTwo={
              <div className="h-full w-full">
                <video
                  ref={video2Ref}
                  id="video2"
                  src={videoUrls.url2 || undefined}
                  preload="auto"
                  className={className2}
                  style={{ width: width, height: height, outline: "none" }}
                />
                <div className="video-label">
                  {label2Text}
                </div>
              </div>
            }
          />
          {!videosReady && (
            <div className="video-loader">
              <LoaderIcon height={30} width={30} />
            </div>
          )}
        </div>
        {className1 !== "max-h-[200px] max-w-[270px]" && (
          <div className="control-bar">
            <div className="progress-bar-container">
              <div
                ref={progressBarRef}
                className="progress-bar"
                onMouseDown={handleProgressBarMouseDown}
              >
                <div
                  className="progress-bar-filled"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="time-display">
                {video1Ref.current && (
                  <>
                    {formatTime(video1Ref.current.currentTime)} / {formatTime(duration)}
                  </>
                )}
              </div>
            </div>

            <div className="control-buttons">
              <div className="play-pause-volume-controls">
                <button
                  onClick={togglePlayPause}
                  className="control-button"
                >
                  {isPlaying ? (
                    <Pause color="white" size={24} />
                  ) : (
                    <Play color="white" size={24} />
                  )}
                </button>

                <div className="volume-control">
                  <button
                    onClick={toggleMute}
                    className="control-button"
                  >
                    {isMuted ? (
                      <VolumeX color="white" size={24} />
                    ) : (
                      <Volume2 color="white" size={24} />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    ) : (
      <video src={fallbackSrc} controls autoPlay></video>
    )}
  </div>
  );
};

export default SynchronizedVideo;