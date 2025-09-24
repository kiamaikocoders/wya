import React, { useState, useEffect, useRef } from 'react';
import { Story } from '@/lib/story/types';
import { formatDistance } from 'date-fns';
import { User, Heart, MessageSquare, Share, Play, Pause, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StoryReelsProps {
  stories: any[];
  initialIndex?: number;
  onClose?: () => void;
  className?: string;
}

const StoryReels: React.FC<StoryReelsProps> = ({ stories, initialIndex = 0, onClose, className }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    // Auto-play videos when they come into view
    if (currentStory?.media_url && isVideoFile(currentStory.media_url)) {
      const video = videoRefs.current[currentIndex];
      if (video) {
        video.currentTime = 0;
        if (isPlaying) {
          video.play();
        }
      }
    }
  }, [currentIndex, isPlaying]);

  const isVideoFile = (url: string) => {
    return /\.(mp4|webm|ogg|mov|avi)$/i.test(url);
  };

  const nextStory = () => {
    setCurrentIndex((prev) => (prev + 1) % stories.length);
  };

  const prevStory = () => {
    setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    const video = videoRefs.current[currentIndex];
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    videoRefs.current.forEach(video => {
      if (video) {
        video.muted = !isMuted;
      }
    });
  };

  const handleVideoEnd = () => {
    nextStory();
  };

  if (!stories || stories.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-kenya-dark">
        <p className="text-white text-lg">No stories available</p>
      </div>
    );
  }

  return (
    <div className={cn("relative h-screen bg-black overflow-hidden", className)}>
      {/* Main Story Display */}
      <div className="relative h-full w-full">
        {currentStory && (
          <>
            {/* Media Content */}
            <div className="absolute inset-0">
              {currentStory.media_url ? (
                isVideoFile(currentStory.media_url) ? (
                  <video
                    ref={(el) => (videoRefs.current[currentIndex] = el)}
                    src={currentStory.media_url}
                    className="w-full h-full object-cover"
                    muted={isMuted}
                    loop={false}
                    onEnded={handleVideoEnd}
                    onClick={togglePlayPause}
                  />
                ) : (
                  <img
                    src={currentStory.media_url}
                    alt="Story"
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-kenya-orange/30 to-kenya-brown/30 flex items-center justify-center">
                  <p className="text-white text-2xl px-8 text-center italic">
                    "{currentStory.content}"
                  </p>
                </div>
              )}
            </div>

            {/* Overlay Content */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
              {/* User Info */}
              <div className="absolute top-8 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-kenya-brown rounded-full flex items-center justify-center">
                    {currentStory.user_image ? (
                      <img
                        src={currentStory.user_image}
                        alt={currentStory.user_name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={24} className="text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {currentStory.user_name || 'Anonymous'}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      {formatDistance(new Date(currentStory.created_at), new Date(), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Video Controls */}
                  {currentStory.media_url && isVideoFile(currentStory.media_url) && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={togglePlayPause}
                        className="text-white hover:bg-white/20"
                      >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMute}
                        className="text-white hover:bg-white/20"
                      >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                      </Button>
                    </>
                  )}
                  
                  {/* Close Button */}
                  {onClose && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="text-white hover:bg-white/20"
                    >
                      <X size={20} />
                    </Button>
                  )}
                </div>
              </div>

              {/* Story Content */}
              <div className="absolute bottom-20 left-4 right-4">
                <p className="text-white text-lg mb-4 leading-relaxed">
                  {currentStory.content}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="absolute bottom-8 right-4 flex flex-col gap-4">
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 p-3"
                  >
                    <Heart size={24} />
                  </Button>
                  <span className="text-white text-xs">{currentStory.likes_count || 0}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 p-3"
                  >
                    <MessageSquare size={24} />
                  </Button>
                  <span className="text-white text-xs">{currentStory.comments_count || 0}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 p-3"
                  >
                    <Share size={24} />
                  </Button>
                  <span className="text-white text-xs">Share</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation Areas */}
      <div className="absolute inset-0 flex">
        {/* Left side - Previous */}
        <div
          className="w-1/2 h-full cursor-pointer"
          onClick={prevStory}
        />
        {/* Right side - Next */}
        <div
          className="w-1/2 h-full cursor-pointer"
          onClick={nextStory}
        />
      </div>

      {/* Progress Indicators */}
      <div className="absolute top-4 left-4 right-4 flex gap-1">
        {stories.map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              index === currentIndex
                ? "bg-white"
                : index < currentIndex
                ? "bg-white/60"
                : "bg-white/20"
            )}
          />
        ))}
      </div>

      {/* Story Counter */}
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
        <span className="text-white text-sm">
          {currentIndex + 1} / {stories.length}
        </span>
      </div>
    </div>
  );
};

export default StoryReels;
