/**
 * Input validation and sanitization utilities
 */

// Email validation regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password requirements: 1 uppercase, 1 lowercase, 1 number, 1 special
const PASSWORD_REQUIREMENTS_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/;

// Phone number - basic international format
const PHONE_REGEX = /^[\d\s\-\+\(\)]{7,}$/;

// Name validation - alphanumeric, spaces, hyphens, and apostrophes
const NAME_REGEX = /^[a-zA-Z\s\-']{2,100}$/;

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!email || email.trim().length === 0) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (email.length > 255) {
    errors.push({ field: 'email', message: 'Email is too long' });
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates password strength
 */
export function validatePassword(password: string, minLength: number = 8): ValidationResult {
  const errors: ValidationError[] = [];

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (password.length < minLength) {
    errors.push({
      field: 'password',
      message: `Password must be at least ${minLength} characters`
    });
  } else if (password.length > 128) {
    errors.push({ field: 'password', message: 'Password is too long' });
  } else if (!PASSWORD_REQUIREMENTS_REGEX.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&#)'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates full name
 */
export function validateFullName(name: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!name || name.trim().length === 0) {
    errors.push({ field: 'fullName', message: 'Full name is required' });
  } else if (name.length > 100) {
    errors.push({ field: 'fullName', message: 'Name is too long' });
  } else if (!NAME_REGEX.test(name.trim())) {
    errors.push({
      field: 'fullName',
      message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates phone number (optional field)
 */
export function validatePhone(phone: string | null | undefined): ValidationResult {
  const errors: ValidationError[] = [];

  if (phone && phone.trim().length > 0) {
    if (phone.length > 20) {
      errors.push({ field: 'phone', message: 'Phone number is too long' });
    } else if (!PHONE_REGEX.test(phone)) {
      errors.push({
        field: 'phone',
        message: 'Invalid phone number format'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates login form
 */
export function validateLoginForm(email: string, password: string): ValidationResult {
  const errors: ValidationError[] = [];

  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password, 1); // Server will handle strong password

  errors.push(...emailValidation.errors, ...passwordValidation.errors);

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculates password strength score (0-4)
 */
export function calculatePasswordStrength(password: string): { score: number; label: string; color: string } {
    if (!password) return { score: 0, label: 'Empty', color: 'bg-slate-200' };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&#]/.test(password)) score++;

    // Normalize to 0-4 scale if needed, but here it's 0-5
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = [
        'bg-red-500',
        'bg-red-400',
        'bg-orange-400',
        'bg-yellow-400',
        'bg-green-400',
        'bg-green-600'
    ];

    return {
        score: score,
        label: labels[score],
        color: colors[score]
    };
}

/**
 * Validates signup form
 */
export function validateSignupForm(
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string,
  phone?: string | null
): ValidationResult {
  const errors: ValidationError[] = [];

  const fullNameValidation = validateFullName(fullName);
  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);
  const phoneValidation = validatePhone(phone);

  errors.push(
    ...fullNameValidation.errors,
    ...emailValidation.errors,
    ...passwordValidation.errors,
    ...phoneValidation.errors
  );

  if (password && confirmPassword && password !== confirmPassword) {
    errors.push({
      field: 'confirmPassword',
      message: 'Passwords do not match'
    });
  } else if (!confirmPassword && password) {
      errors.push({
          field: 'confirmPassword',
          message: 'Please confirm your password'
      });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitizes input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Preserving forward slashes to avoid breaking URLs and API paths
    // .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Trims and normalizes whitespace
 */
export function normalizeInput(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ')
    .substring(0, 255);
}

/**
 * Validates and normalizes email (lowercase)
 */
export function normalizeEmail(email: string): string {
  return normalizeInput(email).toLowerCase();
}

/**
 * Recursively sanitizes an object's string properties
 */
export function sanitizeObject<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
        return sanitizeInput(obj) as unknown as T;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized as T;
    }

    return obj;
}
