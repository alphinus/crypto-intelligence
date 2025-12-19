'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { fadeInUp, cardHover, cryptoCardPositive, cryptoCardNegative } from '@/lib/animations';

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  /** Enable hover scale and shadow effect */
  hover?: boolean;
  /** Crypto-style glow based on trend direction */
  glowDirection?: 'positive' | 'negative' | 'neutral';
  /** Delay before animation starts */
  delay?: number;
  /** Custom className */
  className?: string;
}

export function AnimatedCard({
  children,
  hover = true,
  glowDirection = 'neutral',
  delay = 0,
  className = '',
  ...props
}: AnimatedCardProps) {
  const glowVariants =
    glowDirection === 'positive'
      ? cryptoCardPositive
      : glowDirection === 'negative'
        ? cryptoCardNegative
        : {};

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={hover ? 'hover' : undefined}
      whileTap={hover ? 'tap' : undefined}
      transition={{ delay }}
      className={className}
      {...props}
    >
      <motion.div
        variants={hover ? { ...cardHover, ...glowVariants } : undefined}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        className="h-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// Simplified version for inline use
interface SimpleCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeInCard({ children, className = '', delay = 0 }: SimpleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Card with hover lift effect
export function HoverCard({ children, className = '' }: SimpleCardProps) {
  return (
    <motion.div
      whileHover={{
        y: -4,
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Card with glow effect on hover
interface GlowCardProps extends SimpleCardProps {
  glowColor?: string;
}

export function GlowCard({
  children,
  className = '',
  glowColor = 'rgba(59, 130, 246, 0.4)',
}: GlowCardProps) {
  return (
    <motion.div
      whileHover={{
        boxShadow: `0 0 30px ${glowColor}`,
      }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default AnimatedCard;
