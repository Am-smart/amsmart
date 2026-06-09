/**
 * Standardized API Error Type
 * Used across all API routes to provide proper TypeScript typing
 */

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export class AppError extends Error implements ApiError {
  code?: string;
  status: number;

  constructor(message: string, status: number = 500, code?: string) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Specialized Error Types
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}

export class BadRequestError extends AppError {
    constructor(message: string = 'Bad request') {
        super(message, 400, 'BAD_REQUEST');
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Conflict detected') {
        super(message, 409, 'CONFLICT');
    }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return (error as Error).message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as Record<string, unknown>).message);
  }
  return 'An unknown error occurred';
}

/**
 * Maps common database/business logic errors to appropriate HTTP status codes
 */
export function mapErrorToStatus(error: unknown): number {
  if (error instanceof AppError) return error.status;

  const message = getErrorMessage(error).toLowerCase();

  if (message.includes('unauthorized') || message.includes('invalid token')) return 401;
  if (message.includes('forbidden') || message.includes('permission denied')) return 403;
  if (message.includes('not found')) return 404;
  if (message.includes('duplicate') || message.includes('already exists') || message.includes('conflict')) return 409;
  if (message.includes('invalid') || message.includes('required') || message.includes('too long')) return 400;

  return 500;
}
