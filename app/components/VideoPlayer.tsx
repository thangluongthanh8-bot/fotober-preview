"use client";

import React, { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, MoreVertical, Settings, Captions } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="relative group bg-black rounded-lg overflow-hidden aspect-[9/16] max-w-[300px] mx-auto shadow-lg">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
      />
      
      {/* Overlay Controls */}
      <div className="absolute top-4 right-4 flex gap-2">
         <button className="p-1.5 bg-black/50 rounded text-white hover:bg-black/70">
            <Maximize size={16} />
         </button>
         <button className="p-1.5 bg-black/50 rounded text-white hover:bg-black/70">
            <Captions size={16} />
         </button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between text-white mb-2">
            <div className="flex items-center gap-2">
                <button onClick={togglePlay}>
                    {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
                </button>
                <span className="text-sm font-medium">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={toggleMute}>
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <button>
                    <Maximize size={20} />
                </button>
                <button>
                    <MoreVertical size={20} />
                </button>
            </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-gray-600 h-1 rounded-full overflow-hidden cursor-pointer">
            <div 
                className="bg-white h-full" 
                style={{ width: `${(currentTime / duration) * 100}%` }}
            />
        </div>
      </div>
      
      {/* Center Play Button (if paused) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/30 p-4 rounded-full backdrop-blur-sm">
                <Play size={48} fill="white" className="text-white ml-1" />
            </div>
        </div>
      )}
    </div>
  );
}
