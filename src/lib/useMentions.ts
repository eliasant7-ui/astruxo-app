/**
 * useMentions Hook
 * Handles @ mentions in textarea with user suggestions
 */

import { useState, useRef, useCallback } from 'react';

interface MentionState {
  isActive: boolean;
  query: string;
  position: { top: number; left: number };
  cursorPosition: number;
}

export function useMentions() {
  const [mentionState, setMentionState] = useState<MentionState>({
    isActive: false,
    query: '',
    position: { top: 0, left: 0 },
    cursorPosition: 0,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = useCallback((text: string, cursorPos: number) => {
    if (!textareaRef.current) return;

    // Find @ before cursor
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    // Check if we're in a mention
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Check if there's a space after @ (which would end the mention)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        // Calculate position for suggestions dropdown
        const textarea = textareaRef.current;
        const { top, left } = getCaretCoordinates(textarea, lastAtIndex);

        setMentionState({
          isActive: true,
          query: textAfterAt,
          position: { top, left },
          cursorPosition: lastAtIndex,
        });
        return;
      }
    }

    // Close mention suggestions
    setMentionState((prev) => ({ ...prev, isActive: false }));
  }, []);

  const insertMention = useCallback((username: string, currentText: string) => {
    if (!textareaRef.current) return currentText;

    const { cursorPosition } = mentionState;
    const beforeMention = currentText.substring(0, cursorPosition);
    const afterCursor = currentText.substring(textareaRef.current.selectionStart);

    // Replace @query with @username
    const newText = `${beforeMention}@${username} ${afterCursor}`;
    
    // Set cursor position after the mention
    const newCursorPos = beforeMention.length + username.length + 2;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newCursorPos;
        textareaRef.current.selectionEnd = newCursorPos;
        textareaRef.current.focus();
      }
    }, 0);

    setMentionState((prev) => ({ ...prev, isActive: false }));
    return newText;
  }, [mentionState]);

  const closeMentions = useCallback(() => {
    setMentionState((prev) => ({ ...prev, isActive: false }));
  }, []);

  return {
    mentionState,
    textareaRef,
    handleTextChange,
    insertMention,
    closeMentions,
  };
}

/**
 * Get caret coordinates in textarea
 * Based on component-caret-position library
 */
function getCaretCoordinates(
  element: HTMLTextAreaElement,
  position: number
): { top: number; left: number } {
  const div = document.createElement('div');
  const style = getComputedStyle(element);
  
  // Copy styles
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre-wrap';
  div.style.wordWrap = 'break-word';
  div.style.font = style.font;
  div.style.padding = style.padding;
  div.style.border = style.border;
  div.style.width = `${element.offsetWidth}px`;

  // Get text before cursor
  const textBeforeCaret = element.value.substring(0, position);
  div.textContent = textBeforeCaret;

  // Add span at cursor position
  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.';
  div.appendChild(span);

  document.body.appendChild(div);

  const rect = element.getBoundingClientRect();
  const spanRect = span.getBoundingClientRect();

  const top = rect.top + spanRect.top - div.offsetTop + element.scrollTop + 24;
  const left = rect.left + spanRect.left - div.offsetLeft;

  document.body.removeChild(div);

  return { top, left };
}
