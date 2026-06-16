"use client";

import React, { useState } from 'react';
import { validateEmail, normalizeEmail, normalizeInput } from '@/lib/validation';
import { requestPasswordReset } from '@/lib/api-actions';

interface ResetPasswordFormProps {
  onClose: () => void;
  onShowLogin: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onClose, onShowLogin }) => {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reasons = [
    { label: "I forgot my password.", value: "forgot" },
    { label: "I think my account is hacked.", value: "hacked" },
    { label: "I’m having trouble logging in.", value: "trouble" },
    { label: "Other", value: "other" }
  ];

  const riskMap: Record<string, string> = { forgot: "low", hacked: "high", trouble: "medium", other: "medium" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setErrors({ email: emailValidation.errors[0]?.message || 'Invalid email' });
      return;
    }

    // Validate reason
    if (!reason) {
        setError('Please select a reason.');
        return;
    }

    const selectedLabel = reasons.find(r => r.value === reason)?.label;
    const finalReason = reason === 'other' ? customReason : selectedLabel;

    if (!finalReason) {
        setError('Please provide a reason.');
        return;
    }

    if (reason === 'other' && customReason.length < 10) {
      setError('Please provide more details (at least 10 characters).');
      return;
    }

    setIsLoading(true);
    try {
      const normalizedEmail = normalizeEmail(email);
      const sanitizedReason = normalizeInput(finalReason);
      
      const success = await requestPasswordReset(normalizedEmail, sanitizedReason, riskMap[reason]);

      if (!success) {
          setError('No account found with this email.');
          return;
      }

      setIsSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white w-full max-w-md rounded-xl sm:rounded-2xl p-4 sm:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
      <button onClick={onClose} className="absolute top-2 right-2 sm:top-4 sm:right-4 text-xl sm:text-2xl text-slate-400 hover:text-slate-600 transition-colors">×</button>
      <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mb-2 pr-6">Reset Password</h2>

      {isSubmitted ? (
        <div className="text-center py-6 sm:py-8">
            <div className="text-2xl sm:text-4xl mb-3 sm:mb-4 text-green-500">📧</div>
            <p className="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6">Your request has been sent to the administrators. Please check back later or contact support.</p>
            <button onClick={onShowLogin} className="btn-primary w-full py-2 sm:py-3 text-sm sm:text-base">Back to Login</button>
        </div>
      ) : (
        <>
            <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6">Enter your email and the reason for the reset. Our administrators will review your request.</p>
            <form onSubmit={handleSubmit} noValidate className="space-y-3 sm:space-y-4">
                <div>
                    <input
                        type="email"
                        placeholder="Email Address"
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

                <select
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="input-custom text-xs sm:text-sm"
                    required
                    disabled={isLoading}
                >
                    <option value="">Why are you resetting your password?</option>
                    {reasons.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>

                {reason === 'trouble' && (
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-100 text-xs text-blue-700 space-y-2">
                        <p className="font-bold text-xs sm:text-sm">Before resetting, try these:</p>
                        <ul className="list-disc ml-4 space-y-1 text-xs">
                            <li>Check caps lock</li>
                            <li>Check the special character used</li>
                            <li>Try another device</li>
                        </ul>
                    </div>
                )}

                {reason === 'other' && (
                    <input
                        type="text"
                        placeholder="Please specify... (at least 10 characters)"
                        value={customReason}
                        onChange={e => setCustomReason(e.target.value)}
                        className="input-custom text-xs sm:text-sm"
                        maxLength={500}
                        required
                        disabled={isLoading}
                    />
                )}

                <button type="submit" className="btn-primary w-full py-2 sm:py-3 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                    {isLoading ? 'Submitting...' : 'Submit Request'}
                </button>
                <p className="text-center text-xs sm:text-sm text-slate-600">Remembered your password? <button onClick={(e) => { e.preventDefault(); onShowLogin(); }} className="text-primary font-semibold hover:underline">Sign in</button></p>
            </form>
        </>
      )}
      {error && <p className="text-red-500 text-xs sm:text-sm mt-4 text-center">{error}</p>}
    </div>
  );
};
