
import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { favoritesService } from '@/lib/favorites-service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FavoriteButtonProps {
  eventId: number;
  variant?: 'default' | 'icon';
  className?: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ 
  eventId,
  variant = 'default',
  className = ''
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (isAuthenticated) {
        try {
          const status = await favoritesService.isEventFavorited(eventId);
          setIsFavorite(status);
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
      }
    };
    
    checkFavoriteStatus();
  }, [eventId, isAuthenticated]);
  
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login to save favorites');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isFavorite) {
        await favoritesService.removeFavorite(eventId);
        setIsFavorite(false);
      } else {
        await favoritesService.addFavorite(eventId);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggleFavorite}
        disabled={isLoading}
        className={`p-2 rounded-full transition-colors ${
          isFavorite 
            ? 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20' 
            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/20'
        } ${className}`}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart 
          className={`${isLoading ? 'animate-pulse' : ''}`}
          fill={isFavorite ? "currentColor" : "none"} 
          size={20} 
        />
      </button>
    );
  }
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`flex items-center gap-2 ${
        isFavorite ? 'text-red-500 hover:bg-red-100/50' : ''
      } ${className}`}
    >
      <Heart 
        className={`${isLoading ? 'animate-pulse' : ''}`}
        fill={isFavorite ? "currentColor" : "none"} 
        size={18} 
      />
      {isFavorite ? 'Saved' : 'Save'}
    </Button>
  );
};

export default FavoriteButton;
