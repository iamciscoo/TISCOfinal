/**
 * Utility functions for text formatting and display
 */

import React, { ReactNode } from 'react'

/**
 * Converts plain text with line breaks (\n) to JSX elements with <br> tags
 * Preserves line breaks entered in admin forms when displaying on frontend
 * 
 * @param text - The text string that may contain \n line breaks
 * @returns ReactNode array with text and <br> elements
 */
export function preserveLineBreaks(text: string): ReactNode[] {
  if (!text) return []
  
  return text.split('\n').map((line, index, array) => {
    // Return the line of text followed by a <br> tag (except for the last line)
    if (index === array.length - 1) {
      return line
    }
    return [line, React.createElement('br', { key: index })]
  }).flat()
}

/**
 * Alternative CSS-based approach: applies whitespace preservation styles
 * Can be used with className for CSS-based line break preservation
 */
export const preserveWhitespaceStyles = 'whitespace-pre-wrap break-words'

/**
 * Truncates text while preserving line breaks up to a certain character limit
 * Useful for product cards where we want to show descriptions but limit length
 * 
 * @param text - The text to truncate
 * @param maxLength - Maximum number of characters to show
 * @returns Truncated text with preserved line breaks
 */
export function truncateWithLineBreaks(text: string, maxLength: number = 150): ReactNode[] {
  if (!text) return []
  
  let truncated = text
  if (text.length > maxLength) {
    truncated = text.substring(0, maxLength).trim() + '...'
  }
  
  return preserveLineBreaks(truncated)
}
