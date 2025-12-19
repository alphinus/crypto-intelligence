/**
 * Framer Motion Animation Variants
 * Crypto-First Design System - Modern & Dynamic
 */

import { Variants, Transition } from 'framer-motion';

// Shared transition presets
const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

const smoothTransition: Transition = {
  duration: 0.4,
  ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
};

const quickTransition: Transition = {
  duration: 0.2,
  ease: 'easeOut',
};

// ============================================
// ENTRANCE ANIMATIONS
// ============================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: smoothTransition,
  },
  exit: { opacity: 0, transition: quickTransition },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
  exit: { opacity: 0, y: -10, transition: quickTransition },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
  exit: { opacity: 0, y: 10, transition: quickTransition },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: smoothTransition,
  },
  exit: { opacity: 0, x: 20, transition: quickTransition },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: smoothTransition,
  },
  exit: { opacity: 0, x: -20, transition: quickTransition },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springTransition,
  },
  exit: { opacity: 0, scale: 0.95, transition: quickTransition },
};

export const scaleInBounce: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: { opacity: 0, scale: 0.9, transition: quickTransition },
};

// ============================================
// CONTAINER / STAGGER ANIMATIONS
// ============================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.05, staggerDirection: -1 },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

// Child item for staggered lists
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
};

// ============================================
// CARD ANIMATIONS
// ============================================

export const cardHover: Variants = {
  rest: {
    scale: 1,
    boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
    transition: quickTransition,
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    transition: {
      duration: 0.25,
      ease: 'easeOut',
    },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

export const cardGlow: Variants = {
  rest: {
    boxShadow: '0 0 0 rgba(59, 130, 246, 0)',
  },
  hover: {
    boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)',
    transition: { duration: 0.3 },
  },
};

export const cryptoCardPositive: Variants = {
  rest: {
    boxShadow: '0 0 0 rgba(34, 197, 94, 0)',
  },
  hover: {
    boxShadow: '0 0 25px rgba(34, 197, 94, 0.25)',
    transition: { duration: 0.3 },
  },
};

export const cryptoCardNegative: Variants = {
  rest: {
    boxShadow: '0 0 0 rgba(239, 68, 68, 0)',
  },
  hover: {
    boxShadow: '0 0 25px rgba(239, 68, 68, 0.25)',
    transition: { duration: 0.3 },
  },
};

// ============================================
// TAB / PANEL ANIMATIONS
// ============================================

export const tabContent: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

export const tabIndicator: Variants = {
  inactive: { scale: 0, opacity: 0 },
  active: {
    scale: 1,
    opacity: 1,
    transition: springTransition,
  },
};

export const slidePanel: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// ============================================
// MODAL ANIMATIONS
// ============================================

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContent: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: quickTransition,
  },
};

// ============================================
// BUTTON / INTERACTIVE ANIMATIONS
// ============================================

export const buttonHover: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { duration: 0.15 },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

export const buttonPulse: Variants = {
  rest: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatType: 'loop',
    },
  },
};

export const iconSpin: Variants = {
  rest: { rotate: 0 },
  hover: {
    rotate: 180,
    transition: { duration: 0.3 },
  },
};

export const iconBounce: Variants = {
  rest: { y: 0 },
  hover: {
    y: [-2, 2, -2],
    transition: {
      duration: 0.4,
      repeat: Infinity,
    },
  },
};

// ============================================
// LOADING / SKELETON ANIMATIONS
// ============================================

export const shimmer: Variants = {
  initial: {
    backgroundPosition: '-200% 0',
  },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const pulseLoader: Variants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ============================================
// CRYPTO-SPECIFIC ANIMATIONS
// ============================================

export const priceFlash: Variants = {
  initial: { backgroundColor: 'transparent' },
  up: {
    backgroundColor: ['rgba(34, 197, 94, 0.3)', 'transparent'],
    transition: { duration: 0.5 },
  },
  down: {
    backgroundColor: ['rgba(239, 68, 68, 0.3)', 'transparent'],
    transition: { duration: 0.5 },
  },
};

export const chartFadeIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

export const tickerScroll: Variants = {
  animate: {
    x: [0, -1000],
    transition: {
      x: {
        repeat: Infinity,
        repeatType: 'loop',
        duration: 30,
        ease: 'linear',
      },
    },
  },
};

// ============================================
// NOTIFICATION / TOAST ANIMATIONS
// ============================================

export const toastSlideIn: Variants = {
  hidden: { x: 100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: springTransition,
  },
  exit: {
    x: 100,
    opacity: 0,
    transition: quickTransition,
  },
};

export const toastSlideUp: Variants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: springTransition,
  },
  exit: {
    y: -20,
    opacity: 0,
    transition: quickTransition,
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Creates a delayed version of any variant
 */
export const withDelay = (variants: Variants, delay: number): Variants => {
  const delayed = { ...variants };
  if (delayed.visible && typeof delayed.visible === 'object') {
    delayed.visible = {
      ...delayed.visible,
      transition: {
        ...(delayed.visible.transition || {}),
        delay,
      },
    };
  }
  return delayed;
};

/**
 * Combines multiple variant objects
 */
export const combineVariants = (...variants: Variants[]): Variants => {
  return variants.reduce((acc, variant) => {
    Object.keys(variant).forEach((key) => {
      if (acc[key] && typeof acc[key] === 'object' && typeof variant[key] === 'object') {
        acc[key] = { ...acc[key], ...variant[key] };
      } else {
        acc[key] = variant[key];
      }
    });
    return acc;
  }, {} as Variants);
};
