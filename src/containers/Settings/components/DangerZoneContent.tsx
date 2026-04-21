import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlertTriangle, Pause, Trash2 } from 'lucide-react';
import type { RootState } from '../../../redux/store';
import { logout } from '../../../redux/store';
import { deactivateAccount, deleteAccount } from '../../../services/dangerZoneApi';

type DangerAction = 'deactivate' | 'delete';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface ConfirmationContent {
  title: string;
  message: string;
  confirmLabel: string;
  confirmLabelLoading: string;
}

const confirmationByAction: Record<DangerAction, ConfirmationContent> = {
  deactivate: {
    title: 'Deactivate account?',
    message: 'Your profile will be hidden from recruiters until you reactivate your account.',
    confirmLabel: 'Deactivate',
    confirmLabelLoading: 'Deactivating...',
  },
  delete: {
    title: 'Delete account?',
    message: 'Your account and all associated data will be permanently deleted. This action cannot be undone.',
    confirmLabel: 'Delete',
    confirmLabelLoading: 'Deleting...',
  },
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export default function DangerZoneContent() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const dispatch = useDispatch();
  const [toast, setToast] = React.useState<ToastState | null>(null);
  const [actionToConfirm, setActionToConfirm] = React.useState<DangerAction | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const redirectTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  React.useEffect(() => () => {
    if (redirectTimerRef.current !== null) {
      window.clearTimeout(redirectTimerRef.current);
    }
  }, []);

  const showSuccessToast = React.useCallback((message: string) => {
    setToast({ id: Date.now(), message, type: 'success' });
  }, []);

  const showErrorToast = React.useCallback((message: string) => {
    setToast({ id: Date.now(), message, type: 'error' });
  }, []);

  const handleConfirmAction = async () => {
    if (!actionToConfirm || isSubmitting || isRedirecting) return;

    if (!accessToken?.trim()) {
      showErrorToast('You are not authenticated. Please log in again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const responseMessage = actionToConfirm === 'deactivate'
        ? await deactivateAccount(accessToken)
        : await deleteAccount(accessToken);

      showSuccessToast(
        responseMessage
        || (actionToConfirm === 'deactivate'
          ? 'Account deactivated successfully.'
          : 'Account deleted successfully.')
      );

      setActionToConfirm(null);

      if (actionToConfirm === 'delete') {
        setIsRedirecting(true);
        redirectTimerRef.current = window.setTimeout(() => {
          dispatch(logout());
          window.location.replace('/auth');
        }, 1200);
      }
    } catch (error: unknown) {
      showErrorToast(
        getErrorMessage(
          error,
          actionToConfirm === 'deactivate'
            ? 'Unable to deactivate account. Please try again.'
            : 'Unable to delete account. Please try again.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isSubmitting || isRedirecting;
  const confirmationContent = actionToConfirm ? confirmationByAction[actionToConfirm] : null;

  return (
    <>
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[180] max-w-[360px] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium border ${
            toast.type === 'success'
              ? 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]'
              : 'bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex-1 font-manrope animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 px-1">
          <h1 className="text-xl md:text-[32px] font-semibold text-[#101828] mb-1">Danger Zone</h1>
          <p className="text-[#475467] text-[14px]">Irreversible and destructive actions</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-10 flex items-start gap-6 transition-all hover:bg-red-50/10 group shadow-sm">
            <div className="size-14 rounded-[10px] bg-red-50 border border-red-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <Pause className="text-[#FF6934]" size={28} />
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-[18px] font-semibold text-[#FF4D4F] mb-1">Deactivate account</h3>
                <p className="text-[14px] text-[#667085] leading-relaxed">Temporarily hide your profile from recruiters. You can reactivate anytime.</p>
              </div>
              <button
                onClick={() => setActionToConfirm('deactivate')}
                disabled={isBusy}
                className="px-6 h-[44px] border border-gray-200 text-[#344054] rounded-[10px] text-[14px] font-medium hover:border-red-200 hover:text-red-600 transition-all cursor-pointer shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                Deactivate account
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-10 flex items-start gap-6 transition-all hover:bg-red-50/10 group shadow-sm">
            <div className="size-14 rounded-[10px] bg-red-50 border border-red-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <Trash2 className="text-[#FF4D4F]" size={28} />
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-[18px] font-semibold text-[#FF4D4F] mb-1">Delete account</h3>
                <p className="text-[14px] text-[#667085] leading-relaxed">Permanently delete your account and all associated data. This action cannot be undone.</p>
              </div>
              <button
                onClick={() => setActionToConfirm('delete')}
                disabled={isBusy}
                className="px-6 h-[44px] border border-gray-200 text-[#344054] rounded-[10px] text-[14px] font-medium hover:bg-red-600 hover:text-white hover:border-red-600 transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={18} />
                Delete account
              </button>
            </div>
          </div>
        </div>
      </div>

      {actionToConfirm && confirmationContent && (
        <div
          className="fixed inset-0 z-[170] flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            if (!isBusy) setActionToConfirm(null);
          }}
        >
          <div
            className="w-full max-w-sm rounded-[16px] border border-gray-100 bg-white p-6 text-center shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-[#FEE4E2]">
              <AlertTriangle size={24} className="text-[#F04438]" />
            </div>
            <h3 className="mb-2 text-[18px] font-semibold text-[#101828]">{confirmationContent.title}</h3>
            <p className="mb-8 text-[14px] leading-relaxed text-[#475467]">
              {confirmationContent.message}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setActionToConfirm(null)}
                disabled={isBusy}
                className="rounded-[8px] border border-gray-300 px-6 py-2 text-[14px] font-medium text-[#344054] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { void handleConfirmAction(); }}
                disabled={isBusy}
                className="rounded-[8px] bg-[#FF6934] px-6 py-2 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? confirmationContent.confirmLabelLoading : confirmationContent.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
