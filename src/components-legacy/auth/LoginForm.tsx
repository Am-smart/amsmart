"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { validateLoginForm, normalizeEmail } from '@/lib/validation';
import { X, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onClose: () => void;
  onShowSignup: () => void;
  onShowReset: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onClose, onShowSignup, onShowReset }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const { login } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);

    // Focus trap
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});

    // Validate input
    const validation = validateLoginForm(email, password);
    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(err => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      return;
    }

    setIsLoading(true);
    try {
      const normalizedEmail = normalizeEmail(email);
      await login(normalizedEmail, password);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      if (message.startsWith('LOCKOUT:')) {
          const timestamp = parseInt(message.split(':')[1]);
          setLockoutUntil(timestamp);
          setError('');
      } else {
          setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
      if (!lockoutUntil) return;

      const interval = setInterval(() => {
          const now = Date.now();
          if (now >= lockoutUntil) {
              setLockoutUntil(null);
              clearInterval(interval);
          }
      }, 1000);

      return () => clearInterval(interval);
  }, [lockoutUntil]);

  const getLockoutMessage = () => {
      if (!lockoutUntil) return null;
      const seconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `Account locked. Please try again in ${mins}m ${secs}s`;
  };

  return (
    <div
        id="login"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 relative shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100 shrink-0"
      >
        <X size={20} />
      </button>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mb-6 sm:mb-8 pr-8 tracking-tight">Login</h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`input-custom ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
            required
            disabled={isLoading}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`input-custom pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
            required
            disabled={isLoading}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          {errors.password && (
            <p id="password-error" className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>
        <button
          type="submit"
          className="btn-primary w-full py-2 sm:py-3 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || !!lockoutUntil}
        >
          {isLoading ? 'Logging in...' : lockoutUntil ? 'Locked' : 'Login'}
        </button>
        <p className="text-center text-xs sm:text-sm text-slate-600">Don&apos;t have an account? <button onClick={(e) => { e.preventDefault(); onShowSignup(); }} className="text-primary font-semibold hover:underline">Sign up</button></p>
        <p className="text-center text-xs sm:text-sm text-slate-600"><button onClick={(e) => { e.preventDefault(); onShowReset(); }} className="text-primary font-semibold hover:underline">Forgot your password?</button></p>
      </form>
      {error && <p className="text-red-500 text-xs sm:text-sm mt-4 text-center">{error}</p>}
      {lockoutUntil && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-red-600 text-xs sm:text-sm font-semibold">{getLockoutMessage()}</p>
          </div>
      )}
    </div>
  );
};
