import { Request, Response, NextFunction } from 'express';
import { MedicalCodeError } from './code-utils';

/**
 * Error codes for API responses
 */
export enum ErrorCode {
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MEDICAL_CODE_ERROR = 'MEDICAL_CODE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
  };
}

/**
 * Custom error handler middleware for medical reference API
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('API Error:', err);
  
  // Default error response
  const errorResponse: ErrorResponse = {
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred'
    }
  };
  
  // Set status code based on error type
  let statusCode = 500;
  
  if (err instanceof MedicalCodeError) {
    // Handle medical code specific errors
    statusCode = 400;
    errorResponse.error.code = ErrorCode.MEDICAL_CODE_ERROR;
    errorResponse.error.message = err.message;
  } else if (err.name === 'ValidationError' || err.name === 'ZodError') {
    // Handle validation errors (e.g., from Zod)
    statusCode = 400;
    errorResponse.error.code = ErrorCode.VALIDATION_ERROR;
    errorResponse.error.message = 'Validation error';
    errorResponse.error.details = err.errors || err.issues || err.message;
  } else if (err.name === 'NotFoundError' || err.statusCode === 404) {
    // Handle not found errors
    statusCode = 404;
    errorResponse.error.code = ErrorCode.NOT_FOUND;
    errorResponse.error.message = err.message || 'Resource not found';
  } else if (err.name === 'DatabaseError' || err.code === 'DB_ERROR') {
    // Handle database errors
    statusCode = 500;
    errorResponse.error.code = ErrorCode.DATABASE_ERROR;
    errorResponse.error.message = 'Database operation failed';
  }
  
  res.status(statusCode).json(errorResponse);
}

/**
 * Create a not found error
 * @param message Error message
 * @returns Error object with statusCode 404
 */
export function createNotFoundError(message: string): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number };
  error.name = 'NotFoundError';
  error.statusCode = 404;
  return error;
}

/**
 * Create a validation error
 * @param message Error message
 * @param details Additional error details
 * @returns Error object for validation failures
 */
export function createValidationError(message: string, details?: any): Error & { errors: any } {
  const error = new Error(message) as Error & { errors: any };
  error.name = 'ValidationError';
  error.errors = details || {};
  return error;
}