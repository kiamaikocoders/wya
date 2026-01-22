import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

interface HeartAnimationProps {
  show: boolean;
  onComplete: () => void;
}

const HeartAnimation: React.FC<HeartAnimationProps> = ({ show, onComplete }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1.5 }}
          exit={{ opacity: 0, scale: 2 }}
          transition={{
            duration: 0.6,
            ease: 'easeOut',
          }}
          onAnimationComplete={onComplete}
        >
          <Heart
            className="h-24 w-24 text-white fill-white drop-shadow-2xl"
            strokeWidth={2}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HeartAnimation;
