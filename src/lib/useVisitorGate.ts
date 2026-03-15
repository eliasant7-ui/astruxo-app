/**
 * Visitor Gate Hook
 * Tracks visitor post views and determines when to show signup prompts
 */

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'astruxo_visitor_posts_viewed';
const INITIAL_FREE_POSTS = 5;
const BONUS_POSTS_AFTER_CONTINUE = 3;

export function useVisitorGate() {
  const [postsViewed, setPostsViewed] = useState(0);
  const [maxAllowedPosts, setMaxAllowedPosts] = useState(INITIAL_FREE_POSTS);
  const [shouldShowSignupPrompt, setShouldShowSignupPrompt] = useState(false);
  const [hasUsedContinue, setHasUsedContinue] = useState(false);

  useEffect(() => {
    // Load viewed count from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    const continueUsed = localStorage.getItem(STORAGE_KEY + '_continue_used');
    
    if (stored) {
      const count = parseInt(stored, 10);
      setPostsViewed(count);
    }
    
    if (continueUsed === 'true') {
      setHasUsedContinue(true);
      setMaxAllowedPosts(INITIAL_FREE_POSTS + BONUS_POSTS_AFTER_CONTINUE);
    }
  }, []);

  const incrementPostsViewed = () => {
    const newCount = postsViewed + 1;
    setPostsViewed(newCount);
    localStorage.setItem(STORAGE_KEY, newCount.toString());
    
    // Show prompt only AFTER reaching the limit (not before)
    if (newCount >= maxAllowedPosts) {
      setShouldShowSignupPrompt(true);
    }
  };

  const continueExploring = () => {
    // Grant 3 more posts
    setMaxAllowedPosts(INITIAL_FREE_POSTS + BONUS_POSTS_AFTER_CONTINUE);
    setHasUsedContinue(true);
    localStorage.setItem(STORAGE_KEY + '_continue_used', 'true');
    setShouldShowSignupPrompt(false);
  };

  const resetPostsViewed = () => {
    setPostsViewed(0);
    setMaxAllowedPosts(INITIAL_FREE_POSTS);
    setHasUsedContinue(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY + '_continue_used');
    setShouldShowSignupPrompt(false);
  };

  const hasReachedLimit = postsViewed >= maxAllowedPosts;
  const remainingPosts = Math.max(0, maxAllowedPosts - postsViewed);

  return {
    postsViewed,
    remainingPosts,
    hasReachedLimit,
    shouldShowSignupPrompt,
    hasUsedContinue,
    maxAllowedPosts,
    incrementPostsViewed,
    continueExploring,
    resetPostsViewed,
    setShouldShowSignupPrompt,
  };
}
