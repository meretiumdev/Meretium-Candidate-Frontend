import React from 'react';
import { ExternalLink, Loader2, X } from 'lucide-react';
import { updateCandidateProfile } from '../../../services/profileApi';

interface AddPortfolioModalProps {
  isOpen: boolean;
  accessToken: string | null;
  initialPortfolioUrl?: string | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to save portfolio link. Please try again.';
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function AddPortfolioModal({
  isOpen,
  accessToken,
  initialPortfolioUrl = null,
  onClose,
  onSuccess,
  onError,
}: AddPortfolioModalProps) {
  const [portfolioUrl, setPortfolioUrl] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const initialValue = initialPortfolioUrl?.trim() || '';

    if (!isOpen) {
      setPortfolioUrl(initialValue);
      setIsSubmitting(false);
      setFieldError(null);
      return;
    }

    setPortfolioUrl(initialValue);
    setIsSubmitting(false);
    setFieldError(null);
  }, [initialPortfolioUrl, isOpen]);

  const trimmedUrl = portfolioUrl.trim();
  const canSubmit = !isSubmitting && trimmedUrl.length > 0;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    if (!accessToken?.trim()) {
      onError('You are not authenticated. Please log in again.');
      return;
    }

    if (!isValidHttpUrl(trimmedUrl)) {
      setFieldError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setFieldError(null);
    setIsSubmitting(true);

    try {
      await updateCandidateProfile(accessToken, {
        portfolio_link: trimmedUrl,
      });
      onSuccess('Portfolio link saved successfully.');
      onClose();
    } catch (error: unknown) {
      onError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-black/45 flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="w-full max-w-[560px] rounded-2xl bg-white border border-[#EAECF0] shadow-xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[#EAECF0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF1EC] flex items-center justify-center">
              <ExternalLink size={18} className="text-[#FF6934]" />
            </div>
            <h3 className="text-[24px] font-semibold text-[#101828]">Add Portfolio</h3>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[#667085] hover:bg-gray-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6 space-y-5">
            <div className="space-y-2">
              <label className="text-[14px] font-semibold text-[#101828]">
                Portfolio URL <span className="text-[#B42318]">*</span>
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(event) => setPortfolioUrl(event.target.value)}
                placeholder="https://yourportfolio.com"
                className="w-full px-4 py-3 bg-white border border-[#D0D5DD] rounded-[10px] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 font-manrope"
              />
              {fieldError && (
                <p className="text-[13px] text-[#B42318]">{fieldError}</p>
              )}
            </div>
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
              className="min-w-[130px] px-5 py-2.5 text-[14px] font-medium text-white bg-[#FF6934] rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center justify-center gap-2"
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Add portfolio'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
