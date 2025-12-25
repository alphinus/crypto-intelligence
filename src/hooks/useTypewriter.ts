'use client';

import { useState, useEffect, useCallback } from 'react';

interface TypewriterOptions {
  /** Speed in ms per word (default: 50) */
  speed?: number;
  /** Delay before starting in ms (default: 0) */
  delay?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Skip animation and show full text */
  skip?: boolean;
}

interface TypewriterResult {
  /** Currently displayed text */
  displayText: string;
  /** Is the animation still running */
  isTyping: boolean;
  /** Skip to full text */
  skipToEnd: () => void;
  /** Restart animation */
  restart: () => void;
  /** Progress 0-100 */
  progress: number;
}

export function useTypewriter(
  text: string,
  options: TypewriterOptions = {}
): TypewriterResult {
  const { speed = 50, delay = 0, onComplete, skip = false } = options;

  // Split text into words, preserving spaces and punctuation
  const words = text.split(/(\s+)/);
  const totalWords = words.filter(w => w.trim()).length;

  const [wordIndex, setWordIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSkipped, setIsSkipped] = useState(skip);

  // Restart animation when text changes
  useEffect(() => {
    setWordIndex(0);
    setIsSkipped(skip);
    setHasStarted(false);
    setIsTyping(false);
  }, [text, skip]);

  // Handle initial delay
  useEffect(() => {
    if (isSkipped || hasStarted) return;

    const delayTimer = setTimeout(() => {
      setHasStarted(true);
      setIsTyping(true);
    }, delay);

    return () => clearTimeout(delayTimer);
  }, [delay, isSkipped, hasStarted]);

  // Typewriter effect
  useEffect(() => {
    if (isSkipped || !hasStarted || wordIndex >= words.length) {
      if (wordIndex >= words.length && isTyping) {
        setIsTyping(false);
        onComplete?.();
      }
      return;
    }

    const timer = setTimeout(() => {
      setWordIndex(prev => prev + 1);
    }, words[wordIndex].trim() ? speed : speed / 3); // Faster for whitespace

    return () => clearTimeout(timer);
  }, [wordIndex, words, speed, isSkipped, hasStarted, isTyping, onComplete]);

  const skipToEnd = useCallback(() => {
    setIsSkipped(true);
    setWordIndex(words.length);
    setIsTyping(false);
    onComplete?.();
  }, [words.length, onComplete]);

  const restart = useCallback(() => {
    setWordIndex(0);
    setIsSkipped(false);
    setHasStarted(false);
    setIsTyping(false);
  }, []);

  // Calculate displayed text
  const displayText = isSkipped ? text : words.slice(0, wordIndex).join('');

  // Calculate progress
  const displayedWords = words.slice(0, wordIndex).filter(w => w.trim()).length;
  const progress = totalWords > 0 ? Math.round((displayedWords / totalWords) * 100) : 100;

  return {
    displayText,
    isTyping: isTyping && !isSkipped,
    skipToEnd,
    restart,
    progress,
  };
}
