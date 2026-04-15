import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from './components/AuthLayout';
import ForgotOtpStep from './components/ForgotOtpStep';
import { forgetPassword, getApiResetToken, resetPassword, verifyForgotPasswordOtp } from '../../services/authApi';

interface ToastState {
  id: number;
  message: string;
}

type ForgotPasswordStep = 'email' | 'otp' | 'reset' | 'done';

const OTP_RESEND_COOLDOWN_SECONDS = 30;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Something went wrong. Please try again.';
}

interface PasswordVisibilityIconProps {
  isVisible: boolean;
}

function PasswordVisibilityIcon({ isVisible }: PasswordVisibilityIconProps) {
  if (isVisible) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 7C14.76 7 17 9.24 17 12C17 12.65 16.87 13.26 16.64 13.83L19.56 16.75C21.07 15.49 22.27 13.86 23 12C21.27 7.61 17 4.5 12 4.5C10.6 4.5 9.26 4.75 8.02 5.2L10.18 7.36C10.74 7.13 11.35 7 12 7ZM2 4.27L4.28 6.55L4.74 7.01C3.08 8.3 1.78 10 1 12C2.73 16.39 7 19.5 12 19.5C13.55 19.5 15.03 19.2 16.38 18.66L16.8 19.08L20 22.3L21.27 21.03L3.27 3L2 4.27ZM7.53 10.8L9.08 12.35C9.03 12.56 9 12.78 9 13C9 14.66 10.34 16 12 16C12.22 16 12.44 15.97 12.65 15.92L14.2 17.47C13.53 17.8 12.78 18 12 18C9.24 18 7 15.76 7 13C7 12.22 7.2 11.47 7.53 10.8ZM11.84 10.02L14.99 13.17L15.01 13.01C15.01 11.35 13.67 10.01 12.01 10.01L11.84 10.02Z" />
    </svg>
  );
}

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isEmailValid = emailRegex.test(email.trim());
  const isPasswordValid = newPassword.trim() !== '';
  const doPasswordsMatch = newPassword === confirmPassword;
  const isResetFormValid = isPasswordValid && doPasswordsMatch;

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const showErrorToast = (message: string) => {
    setToast({
      id: Date.now(),
      message,
    });
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailValid || loading) return;

    setLoading(true);
    try {
      await forgetPassword({ email: email.trim() });
      setStep('otp');
      setResendAvailableAt(Date.now() + OTP_RESEND_COOLDOWN_SECONDS * 1000);
    } catch (error: unknown) {
      showErrorToast(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (): Promise<boolean> => {
    if (!isEmailValid || loading) return false;

    setLoading(true);
    try {
      await forgetPassword({ email: email.trim() });
      return true;
    } catch (error: unknown) {
      showErrorToast(getErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    if (!isEmailValid || loading) return;

    setLoading(true);
    try {
      const response = await verifyForgotPasswordOtp({
        email: email.trim(),
        otp,
      });
      const token = getApiResetToken(response);
      if (!token) {
        throw new Error('Verification succeeded but reset token is missing.');
      }

      setResetToken(token);
      setStep('reset');
    } catch (error: unknown) {
      showErrorToast(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isResetFormValid) {
      if (!doPasswordsMatch) {
        showErrorToast('Passwords do not match.');
      }
      return;
    }

    if (!resetToken) {
      showErrorToast('Reset token is missing. Please verify OTP again.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        token: resetToken,
        new_password: newPassword,
      });
      setStep('done');
    } catch (error: unknown) {
      showErrorToast(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout rightPanelClassName="bg-[#FCFCFD]">
      {toast && (
        <div
          key={toast.id}
          className="fixed top-4 right-4 z-50 max-w-[360px] bg-[#FEF3F2] border border-[#FDA29B] text-[#B42318] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium"
        >
          {toast.message}
        </div>
      )}

      {step === 'email' && (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm w-full max-w-[480px] lg:w-[480px] font-manrope transition-all duration-300">
          <h2
            className="text-[22px] font-semibold text-[#0A1124] tracking-tight leading-tight"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Forgot Password
          </h2>
          <p className="text-[#475467] text-[14px] mt-2 font-[400] font-body mb-6">
            Enter your registered email address. We&apos;ll send a verification code before allowing password reset.
          </p>

          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-[14px] font-regular text-[#344054] mb-1 font-body">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="xyz@email.com"
                className="w-full px-4 py-3 rounded-[8px] border border-[#D1D5DB] focus:border-[#FF6934] outline-none text-[14px] transition-all placeholder:text-gray-400 text-gray-900 font-body"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!isEmailValid || loading}
              className={`w-full text-white py-3 rounded-[8px] transition-all text-[14px] font-[600] font-body cursor-pointer ${isEmailValid && !loading ? 'bg-[#FF6934] hover:bg-[#E5552B]' : 'bg-[#FFBD9D]'}`}
            >
              {loading ? 'Please wait...' : 'Send code'}
            </button>
          </form>

          <div className="pt-5">
            <Link to="/auth" className="text-[14px] font-semibold text-[#FF6934] hover:text-[#E5552B]">
              Back to Sign In
            </Link>
          </div>
        </div>
      )}

      {step === 'otp' && (
        <ForgotOtpStep
          email={email}
          onSuccess={handleVerifyOtp}
          onResend={handleResendOtp}
          resendAvailableAt={resendAvailableAt}
          onResendAvailableAtChange={setResendAvailableAt}
          resendCooldownSeconds={OTP_RESEND_COOLDOWN_SECONDS}
          loading={loading}
        />
      )}

      {step === 'reset' && (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm w-full max-w-[480px] lg:w-[480px] font-manrope transition-all duration-300">
          <h2
            className="text-[32px] font-semibold text-[#0A1124] tracking-tight leading-tight"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            New Password
          </h2>
          <p className="text-[#667085] text-[14px] mt-2 font-[400] font-body mb-6">
            Please create a new password that you don&apos;t use on any other site.
          </p>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-[14px] font-regular text-[#344054] mb-1 font-body">
                Password<span className="text-[#FF6934] ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-11 rounded-[8px] border border-[#D1D5DB] focus:border-[#FF6934] outline-none text-[14px] transition-all placeholder:text-gray-400 text-gray-900 font-body"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#667085] cursor-pointer"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  <PasswordVisibilityIcon isVisible={showNewPassword} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[14px] font-regular text-[#344054] mb-1 font-body">
                Confirm New Password<span className="text-[#FF6934] ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-11 rounded-[8px] border border-[#D1D5DB] focus:border-[#FF6934] outline-none text-[14px] transition-all placeholder:text-gray-400 text-gray-900 font-body"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#667085] cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  <PasswordVisibilityIcon isVisible={showConfirmPassword} />
                </button>
              </div>
              {!doPasswordsMatch && confirmPassword.length > 0 && (
                <p className="text-[12px] text-[#B42318] mt-1">Passwords do not match.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isResetFormValid || loading}
              className={`w-full text-white py-3 rounded-[8px] transition-all text-[14px] font-[600] font-body cursor-pointer ${isResetFormValid && !loading ? 'bg-[#FF6934] hover:bg-[#E5552B]' : 'bg-[#FFBD9D]'}`}
            >
              {loading ? 'Please wait...' : 'Confirm Password'}
            </button>
          </form>
        </div>
      )}

      {step === 'done' && (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm w-full max-w-[480px] lg:w-[480px] text-center flex flex-col items-center justify-center font-manrope transition-all duration-300">
          <div className="w-[84px] h-[84px] bg-[#DCFCE7] rounded-full flex items-center justify-center mb-8">
            <svg width="34" height="26" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.66663 12L10.6666 20L29.3333 4" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-[24px] font-semibold text-[#0A111F] leading-[32px] tracking-normal mb-3">Password Updated</h2>
          <p className="text-[#475467] text-[15px] font-[400] font-body mb-8">Your password has been reset successfully.</p>
          <Link
            to="/auth"
            className="w-full text-center bg-[#FF6934] hover:bg-[#E5552B] text-white py-3 rounded-[8px] transition-all text-[14px] font-[600] font-body"
          >
            Back to Sign In
          </Link>
        </div>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
