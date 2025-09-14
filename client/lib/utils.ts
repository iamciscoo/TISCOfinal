import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Standardized API response types
export interface ApiErrorResponse {
  error: string
  code?: string
  details?: unknown
}

export interface ApiSuccessResponse<T = unknown> {
  data: T
  message?: string
}

// Utility functions for consistent API responses
export const createErrorResponse = (
  error: string, 
  status: number = 500, 
  code?: string, 
  details?: unknown
) => {
  return Response.json(
    { error, code, details } as ApiErrorResponse, 
    { status }
  )
}

export const createSuccessResponse = <T>(
  data: T, 
  status: number = 200, 
  message?: string
) => {
  return Response.json(
    { data, message } as ApiSuccessResponse<T>, 
    { status }
  )
}
