"use client";

import React, { useState, useEffect } from 'react';
import { UserRole } from '@/lib/types';
import { useAuth } from './AuthContext';
import { validateSignupForm, normalizeEmail, normalizeInput, calculatePasswordStrength } from '@/lib/validation';
import { getRoleCount, getInviteSession } from '@/lib/api-actions';
import { SIGNUP_LIMITS, USER_ROLES } from '@/lib/constants';
import { Eye, EyeOff } from 'lucide-react';

interface SignupFormProps {
  initialRole?: UserRole;
  onClose: () => void;
  onShowLogin: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ initialRole, onClose, onShowLogin }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: initialRole || USER_ROLES.STUDENT
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Empty', color: 'bg-slate-200' });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [roleCounts, setRoleCounts] = useState({ teachers: 0, admins: 0, total: 0 });
  const [inviteSession, setInviteSession] = useState<{ inviteId: string; type: string; email?: string; role: UserRole } | null>(null);

  const { signup } = useAuth();

  useEffect(() => {
      setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password]);

  // Fetch role counts and invite session on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [counts, session] = await Promise.all([
            getRoleCount(),
            getInviteSession()
        ]);
        setRoleCounts(counts);

        if (session) {
            const castedSession = session as unknown as { inviteId: string; type: string; email?: string; role: UserRole };
            setInviteSession(castedSession);
            setFormData(prev => ({
                ...prev,
                email: castedSession.email || prev.email,
                role: castedSession.role || prev.role
            }));
        }
      } catch (err) {
        console.error('Failed to fetch signup data:', err);
      }
    };

    fetchData();
  }, []);

  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});

    // Validate input
    const validation = validateSignupForm(
      formData.fullName,
      formData.email,
      formData.password,
      formData.confirmPassword,
      formData.phone
    );

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
      const normalizedEmail = normalizeEmail(formData.email);
      const normalizedName = normalizeInput(formData.fullName);
      
      await signup({
          full_name: normalizedName,
          email: normalizedEmail,
          phone: formData.phone ? normalizeInput(formData.phone) : undefined,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: formData.role
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
          setError(err.message || 'Signup failed');
      } else {
          setError('Signup failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="signup" className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 relative shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
      <button onClick={onClose} className="absolute top-3 right-3 sm:top-4 sm:right-4 text-xl sm:text-2xl text-slate-400 hover:text-slate-600 transition-colors shrink-0">×</button>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mb-6 sm:mb-8 pr-8 tracking-tight">Sign Up</h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
        <div>
          <input
            type="text"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            className={`input-custom ${errors.fullName ? 'border-red-500 focus:ring-red-500' : ''}`}
            required
            disabled={isLoading}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          />
          {errors.fullName && (
            <p id="fullName-error" className="text-red-500 text-xs mt-1">{errors.fullName}</p>
          )}
        </div>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className={`input-custom ${errors.email ? 'border-red-500 focus:ring-red-500' : ''} ${inviteSession?.type === 'email_bound' ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
            required
            disabled={isLoading || inviteSession?.type === 'email_bound'}
            readOnly={inviteSession?.type === 'email_bound'}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>
        <div>
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className={`input-custom ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
            disabled={isLoading}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {errors.phone && (
            <p id="phone-error" className="text-red-500 text-xs mt-1">{errors.phone}</p>
          )}
        </div>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
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
          {formData.password && (
              <div className="mt-2 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-semibold">
                      <span className="text-slate-500">Strength:</span>
                      <span className={passwordStrength.color.replace('bg-', 'text-')}>{passwordStrength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                  </div>
              </div>
          )}
        </div>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            className={`input-custom pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
            required
            disabled={isLoading}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs sm:text-sm font-semibold text-slate-700">Select your role:</p>
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {([USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN] as UserRole[]).map((r) => {
              const teacherLimitReached = roleCounts.teachers >= SIGNUP_LIMITS.TEACHER && r === USER_ROLES.TEACHER;
              const adminLimitReached = roleCounts.admins >= SIGNUP_LIMITS.ADMIN && r === USER_ROLES.ADMIN;
              const isLimitReached = (teacherLimitReached || adminLimitReached) && !inviteSession;
              const isInviteRole = inviteSession && inviteSession.role === r;
              const isDisabled = isLoading || (inviteSession && !isInviteRole) || (!inviteSession && isLimitReached);

              return (
                <div key={r} className="relative">
                  <button
                    type="button"
                    onClick={() => handleRoleChange(r)}
                    disabled={isDisabled}
                    title={isLimitReached ? `${r.charAt(0).toUpperCase() + r.slice(1)} creation limit reached (${SIGNUP_LIMITS[r.toUpperCase() as keyof typeof SIGNUP_LIMITS]})` : ''}
                    className={`w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl border-2 transition-all text-[10px] sm:text-sm font-bold capitalize disabled:opacity-50 disabled:cursor-not-allowed ${
                      formData.role === r
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                  {isLimitReached && (
                    <span className="absolute -top-4 left-0 right-0 text-center text-red-500 text-[8px] sm:text-xs whitespace-nowrap font-bold">Limit reached ❌</span>
                  )}
                </div>
              );
            })}
          </div>
          {(roleCounts.teachers >= SIGNUP_LIMITS.TEACHER || roleCounts.admins >= SIGNUP_LIMITS.ADMIN) && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
              Note: Public creation of teachers and admins is limited to {SIGNUP_LIMITS.TEACHER} per role. Please contact support to create more.
            </p>
          )}
        </div>

        <button type="submit" className="btn-primary w-full py-2 sm:py-3 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
        <p className="text-center text-xs sm:text-sm text-slate-600">Already have an account? <button onClick={(e) => { e.preventDefault(); onShowLogin(); }} className="text-primary font-semibold hover:underline">Sign in</button></p>
      </form>
      {error && <p className="text-red-500 text-xs sm:text-sm mt-4 text-center">{error}</p>}
    </div>
  );
};
