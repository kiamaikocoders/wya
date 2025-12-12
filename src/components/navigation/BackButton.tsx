import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type LocationState = {
  returnTo?: string;
};

interface BackButtonProps {
  fallbackHref?: string;
  className?: string;
  label?: string;
}

const BackButton: React.FC<BackButtonProps> = ({
  fallbackHref = '/events',
  className,
  label = 'Back',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const handleBack = () => {
    if (state.returnTo && typeof state.returnTo === 'string') {
      navigate(state.returnTo);
      return;
    }

    // If there's navigation history, go back. Otherwise, go to a safe fallback.
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackHref);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      onClick={handleBack}
      className={cn(
        'bg-black/20 backdrop-blur-sm hover:bg-black/35 text-white border border-white/10 rounded-full',
        className
      )}
    >
      <ChevronLeft className="h-5 w-5" />
    </Button>
  );
};

export default BackButton;

