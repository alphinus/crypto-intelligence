'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, Children, isValidElement, cloneElement, ReactElement } from 'react';
import { staggerContainer, staggerContainerFast, staggerContainerSlow, staggerItem } from '@/lib/animations';

interface AnimatedListProps {
  children: ReactNode;
  /** Stagger speed: fast (0.05s), normal (0.08s), slow (0.12s) */
  speed?: 'fast' | 'normal' | 'slow';
  /** Container className */
  className?: string;
  /** Enable exit animations */
  exitAnimation?: boolean;
  /** Custom tag for the container */
  as?: 'div' | 'ul' | 'ol' | 'section';
}

export function AnimatedList({
  children,
  speed = 'normal',
  className = '',
  exitAnimation = false,
  as: Component = 'div',
}: AnimatedListProps) {
  const containerVariants =
    speed === 'fast'
      ? staggerContainerFast
      : speed === 'slow'
        ? staggerContainerSlow
        : staggerContainer;

  const MotionComponent = motion[Component] as typeof motion.div;

  const content = (
    <MotionComponent
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit={exitAnimation ? 'exit' : undefined}
      className={className}
    >
      {Children.map(children, (child, index) => {
        if (isValidElement(child)) {
          return (
            <motion.div key={child.key ?? index} variants={staggerItem}>
              {child}
            </motion.div>
          );
        }
        return child;
      })}
    </MotionComponent>
  );

  return exitAnimation ? <AnimatePresence mode="wait">{content}</AnimatePresence> : content;
}

// Grid variant with staggered items
interface AnimatedGridProps extends Omit<AnimatedListProps, 'as'> {
  columns?: number;
  gap?: string;
}

export function AnimatedGrid({
  children,
  speed = 'normal',
  columns = 3,
  gap = '1rem',
  className = '',
}: AnimatedGridProps) {
  const containerVariants =
    speed === 'fast'
      ? staggerContainerFast
      : speed === 'slow'
        ? staggerContainerSlow
        : staggerContainer;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
      }}
    >
      {Children.map(children, (child, index) => {
        if (isValidElement(child)) {
          return (
            <motion.div key={child.key ?? index} variants={staggerItem}>
              {child}
            </motion.div>
          );
        }
        return child;
      })}
    </motion.div>
  );
}

// For wrapping existing list items
interface AnimatedItemProps {
  children: ReactNode;
  index?: number;
  className?: string;
}

export function AnimatedItem({ children, index = 0, className = '' }: AnimatedItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Horizontal list with stagger
export function AnimatedHorizontalList({
  children,
  speed = 'normal',
  className = '',
}: AnimatedListProps) {
  const containerVariants =
    speed === 'fast'
      ? staggerContainerFast
      : speed === 'slow'
        ? staggerContainerSlow
        : staggerContainer;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`flex ${className}`}
    >
      {Children.map(children, (child, index) => {
        if (isValidElement(child)) {
          return (
            <motion.div
              key={child.key ?? index}
              variants={{
                hidden: { opacity: 0, x: 20 },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.4, ease: 'easeOut' },
                },
              }}
            >
              {child}
            </motion.div>
          );
        }
        return child;
      })}
    </motion.div>
  );
}

export default AnimatedList;
