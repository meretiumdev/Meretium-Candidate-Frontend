import React from 'react';
import { Check, Mail, X } from 'lucide-react';
import { requestEmailChange } from '../../../services/authApi';
import TwoFactorVerifyModal from './TwoFactorVerifyModal';

interface ChangeEmailModalProps {
  isOpen: boolean;
  currentEmail: string;
  accessToken: string | null;
  requireTwoFactor?: boolean;
  onClose: () => void;
}

type ChangeEmailStep = 'form' | 'sent';

function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to update email. Please try again.';
}

export default function ChangeEmailModal({
  isOpen,
  currentEmail,
  accessToken,
  requireTwoFactor = false,
  onClose,
}: ChangeEmailModalProps) {
  const [step, setStep] = React.useState<ChangeEmailStep>('form');
  const [newEmail, setNewEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = React.useState(false);
  const [pendingSubmission, setPendingSubmission] = React.useState<{ newEmail: string; password: string } | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setNewEmail('');
      setPassword('');
      setErrorMessage(null);
      setIsSubmitting(false);
      setIsTwoFactorModalOpen(false);
      setPendingSubmission(null);
      return;
    }

    setStep('form');
    setNewEmail('');
    setPassword('');
    setErrorMessage(null);
    setIsSubmitting(false);
    setIsTwoFactorModalOpen(false);
    setPendingSubmission(null);
  }, [isOpen]);

  const trimmedCurrentEmail = currentEmail.trim();
  const trimmedNewEmail = newEmail.trim();
  const isBusy = isSubmitting;
  const canSubmit = (
    !isBusy
    && isValidEmail(trimmedNewEmail)
    && password.trim().length > 0
    && trimmedNewEmail.toLowerCase() !== trimmedCurrentEmail.toLowerCase()
  );

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  const sendEmailChangeRequest = async (payload: { newEmail: string; password: string }) => {
    if (!accessToken?.trim()) {
      setErrorMessage('You are not authenticated. Please log in again.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await requestEmailChange(accessToken, {
        new_email: payload.newEmail,
        password: payload.password,
      });

      setStep('sent');
      setIsSubmitting(false);
    } catch (error: unknown) {
      setStep('form');
      setErrorMessage(getErrorMessage(error));
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    const payload = {
      newEmail: trimmedNewEmail,
      password,
    };

    if (requireTwoFactor) {
      setPendingSubmission(payload);
      setIsTwoFactorModalOpen(true);
      return;
    }

    await sendEmailChangeRequest(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-black/45 flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="w-full max-w-[640px] rounded-2xl bg-white border border-[#EAECF0] shadow-xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[#EAECF0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF1EC] flex items-center justify-center">
              <Mail size={18} className="text-[#FF6934]" />
            </div>
            <h3 className="text-[22px] md:text-[24px] font-semibold text-[#101828]">Change Email Address</h3>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[#667085] hover:bg-gray-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
            disabled={isBusy}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {step === 'form' && (
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-[#101828]">Current email</label>
                <input
                  value={trimmedCurrentEmail}
                  readOnly
                  className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E4E7EC] rounded-[10px] text-[14px] text-[#667085] font-manrope"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-[#101828]">New email address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  placeholder="Enter new email"
                  className="w-full px-4 py-3 bg-white border border-[#D0D5DD] rounded-[10px] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 font-manrope"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-[#101828]">Confirm password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-white border border-[#D0D5DD] rounded-[10px] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 font-manrope"
                />
              </div>

              <div className="rounded-[10px] border border-[#EAECF0] bg-[#F9FAFB] px-4 py-3">
                <p className="text-[13px] text-[#667085]">
                  We&apos;ll send a verification link to your new email address. You&apos;ll need to verify it before the change takes effect.
                </p>
              </div>

              {errorMessage && (
                <p className="text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-[10px] px-3 py-2">
                  {errorMessage}
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#EAECF0] flex items-center justify-end gap-3 bg-white">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 text-[14px] font-medium text-[#344054] rounded-[10px] hover:bg-gray-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-[14px] font-medium text-white bg-[#FF6934] rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={!canSubmit}
              >
                {isSubmitting ? 'Sending...' : 'Send verification link'}
              </button>
            </div>
          </form>
        )}

        {step === 'sent' && (
          <div className="px-6 py-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#DCFCE7] flex items-center justify-center mb-5">
              <Check size={28} className="text-[#12B76A]" />
            </div>
            <h4 className="text-[20px] font-semibold text-[#101828] mb-2">Verification Email Sent</h4>
            <p className="text-[14px] text-[#667085]">
              We sent a verification link to your new email. Click the link to complete the change.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 px-5 py-2.5 text-[14px] font-medium text-white bg-[#FF6934] rounded-[10px] hover:opacity-90 transition-opacity cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>

      <TwoFactorVerifyModal
        isOpen={isTwoFactorModalOpen}
        accessToken={accessToken}
        email={trimmedCurrentEmail}
        onClose={() => {
          if (isSubmitting) return;
          setIsTwoFactorModalOpen(false);
          setPendingSubmission(null);
        }}
        onVerified={async () => {
          const payload = pendingSubmission;
          if (!payload) return;
          setIsTwoFactorModalOpen(false);
          setPendingSubmission(null);
          await sendEmailChangeRequest(payload);
        }}
      />
    </div>
  );
}
