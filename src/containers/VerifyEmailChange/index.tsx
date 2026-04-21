import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { RootState } from '../../redux/store';
import { confirmEmailChange } from '../../services/authApi';
import { clearCandidateSettingsCache } from '../../services/settingsApi';

type VerificationStatus = 'loading' | 'success' | 'error' | 'auth_required';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Unable to verify email change. Please try again.';
}

export default function VerifyEmailChange() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const token = searchParams.get('token')?.trim() || '';
  const [status, setStatus] = React.useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [retryTick, setRetryTick] = React.useState(0);
  const hasRequestedRef = React.useRef(false);

  React.useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Verification token is missing or invalid.');
      return;
    }

    if (!accessToken?.trim()) {
      setStatus('auth_required');
      setErrorMessage(null);
      return;
    }

    if (hasRequestedRef.current) return;
    hasRequestedRef.current = true;

    void (async () => {
      try {
        await confirmEmailChange(accessToken, { token });
        clearCandidateSettingsCache();
        setStatus('success');

        window.setTimeout(() => {
          navigate('/settings', { replace: true });
        }, 1400);
      } catch (error: unknown) {
        setStatus('error');
        setErrorMessage(getErrorMessage(error));
      }
    })();
  }, [accessToken, navigate, retryTick, token]);

  const redirectPath = token ? `/verify-email-change?token=${encodeURIComponent(token)}` : '/verify-email-change';

  return (
    <div className="min-h-screen bg-[#F9FAFB] px-4 py-8 flex items-center justify-center font-manrope">
      <div className="w-full max-w-[560px] bg-white border border-[#EAECF0] rounded-2xl shadow-sm p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="mx-auto w-12 h-12 rounded-full border-[3px] border-[#FF6934]/20 border-t-[#FF6934] animate-spin mb-5" />
            <h1 className="text-[24px] font-semibold text-[#101828] mb-2">Verifying Email Change</h1>
            <p className="text-[14px] text-[#667085]">Please wait while we verify your request.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-[#DCFCE7] flex items-center justify-center mb-5">
              <svg width="30" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2.66663 12L10.6666 20L29.3333 4" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-[24px] font-semibold text-[#101828] mb-2">Email Updated</h1>
            <p className="text-[14px] text-[#667085]">Your email has been changed successfully. Redirecting to settings...</p>
          </>
        )}

        {status === 'auth_required' && (
          <>
            <h1 className="text-[24px] font-semibold text-[#101828] mb-2">Sign In Required</h1>
            <p className="text-[14px] text-[#667085] mb-6">
              Please sign in first, then we&apos;ll complete your email verification.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/auth?redirect=${encodeURIComponent(redirectPath)}`)}
              className="px-5 py-2.5 text-[14px] font-medium text-white bg-[#FF6934] rounded-[10px] hover:opacity-90 transition-opacity cursor-pointer"
            >
              Go to Sign In
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-[24px] font-semibold text-[#101828] mb-2">Verification Failed</h1>
            <p className="text-[14px] text-[#B42318] mb-6">{errorMessage || 'Unable to verify email change.'}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="px-5 py-2.5 text-[14px] font-medium text-[#344054] border border-[#D0D5DD] rounded-[10px] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Back to Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  hasRequestedRef.current = false;
                  setStatus('loading');
                  setErrorMessage(null);
                  setRetryTick((prev) => prev + 1);
                }}
                className="px-5 py-2.5 text-[14px] font-medium text-white bg-[#FF6934] rounded-[10px] hover:opacity-90 transition-opacity cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
