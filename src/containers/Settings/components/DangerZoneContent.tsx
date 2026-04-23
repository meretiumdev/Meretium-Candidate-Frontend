import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlertTriangle, Pause, Trash2, X } from 'lucide-react';
import type { RootState } from '../../../redux/store';
import { logout } from '../../../redux/store';
import { deactivateAccount, deleteAccount } from '../../../services/dangerZoneApi';
import { logoutUser } from '../../../services/authApi';

type DangerAction = 'deactivate' | 'delete';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export default function DangerZoneContent() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const refreshToken = useSelector((state: RootState) => state.auth.refreshToken);
  const dispatch = useDispatch();
  const [toast, setToast] = React.useState<ToastState | null>(null);
  const [actionToConfirm, setActionToConfirm] = React.useState<DangerAction | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState('');

  React.useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const showSuccessToast = React.useCallback((message: string) => {
    setToast({ id: Date.now(), message, type: 'success' });
  }, []);

  const showErrorToast = React.useCallback((message: string) => {
    setToast({ id: Date.now(), message, type: 'error' });
  }, []);

  const closeModal = () => {
    if (isSubmitting) return;
    setActionToConfirm(null);
    setDeleteConfirmText('');
  };

  const runClientLogoutFlow = () => {
    dispatch(logout());
    window.location.replace('/auth');
  };

  const runServerLogoutFlow = async () => {
    const trimmedAccessToken = accessToken?.trim() || '';
    const trimmedRefreshToken = refreshToken?.trim() || '';
    if (!trimmedAccessToken || !trimmedRefreshToken) {
      throw new Error('Unable to logout. Missing authentication token.');
    }

    await logoutUser(trimmedAccessToken, { refresh_token: trimmedRefreshToken });
    runClientLogoutFlow();
  };

  const handleDeactivateConfirm = async () => {
    if (isSubmitting) return;

    const trimmedAccessToken = accessToken?.trim() || '';
    if (!trimmedAccessToken) {
      showErrorToast('You are not authenticated. Please log in again.');
      return;
    }

    setIsSubmitting(true);

    try {
      await deactivateAccount(trimmedAccessToken);
      // Deactivate revokes the session server-side, so finish with local logout.
      runClientLogoutFlow();
    } catch (error: unknown) {
      showErrorToast(
        getErrorMessage(
          error,
          'Unable to deactivate account. Please try again.'
        )
      );
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (isSubmitting) return;
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') return;

    const trimmedAccessToken = accessToken?.trim() || '';
    if (!trimmedAccessToken) {
      showErrorToast('You are not authenticated. Please log in again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const responseMessage = await deleteAccount(trimmedAccessToken);
      showSuccessToast(responseMessage || 'Account deleted successfully.');
      await runServerLogoutFlow();
    } catch (error: unknown) {
      showErrorToast(
        getErrorMessage(
          error,
          'Unable to delete account. Please try again.'
        )
      );
      setIsSubmitting(false);
    }
  };

  const isBusy = isSubmitting;
  const isDeleteConfirmValid = deleteConfirmText.trim().toUpperCase() === 'DELETE';

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
                onClick={() => {
                  setActionToConfirm('deactivate');
                  setDeleteConfirmText('');
                }}
                disabled={isBusy}
                className="px-6 h-[44px] border border-gray-200 text-[#344054] rounded-[10px] text-[14px] font-medium hover:border-[#E7000B]/30 hover:text-[#E7000B] transition-all cursor-pointer shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
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
                onClick={() => {
                  setActionToConfirm('delete');
                  setDeleteConfirmText('');
                }}
                disabled={isBusy}
                className="px-6 h-[44px] border border-gray-200 text-[#344054] rounded-[10px] text-[14px] font-medium hover:bg-[#E7000B] hover:text-white hover:border-[#E7000B] transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={18} />
                Delete account
              </button>
            </div>
          </div>
        </div>
      </div>

      {actionToConfirm === 'deactivate' && (
        <div
          className="fixed inset-0 z-[170] flex items-center justify-center bg-black/45 p-3 sm:p-4"
          onClick={() => {
            if (!isBusy) closeModal();
          }}
        >
          <div
            className="w-full max-w-[480px] rounded-[14px] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-5 pt-5 sm:pt-6">
              <h3 className="text-[18px] leading-none font-semibold text-[#111827]">Deactivate Account</h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={isBusy}
                className="text-[#98A2B3] hover:text-[#667085] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-4 sm:px-5 pt-3 pb-5 sm:pb-6">
              <p className="text-[14px] sm:text-[14px] leading-[1.45] text-[#364153] mb-5 font-400">
                Deactivate your account? You can reactivate later by logging in again.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={closeModal}
                  disabled={isBusy}
                  className="h-[42px] rounded-[10px] bg-white border border-[#D0D5DD] text-[#344054] text-[14px] sm:text-[15px] font-medium hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { void handleDeactivateConfirm(); }}
                  disabled={isBusy}
                  className="h-[42px] rounded-[10px] bg-[#E7000B] text-white text-[14px] sm:text-[15px] font-medium hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Deactivating...' : 'Deactivate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {actionToConfirm === 'delete' && (
        <div
          className="fixed inset-0 z-[170] flex items-center justify-center bg-black/45 p-3 sm:p-4"
          onClick={() => {
            if (!isBusy) closeModal();
          }}
        >
          <div
            className="w-full max-w-[480px] rounded-[14px] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6">
              <h3 className="text-[18px] leading-none font-semibold text-[#111827]">Delete Account</h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={isBusy}
                className="text-[#98A2B3] hover:text-[#667085] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 sm:px-6 pt-3 pb-5 sm:pb-6 space-y-4">
              <div className="rounded-[12px] border border-[#F5B5BB] bg-[#FFF2F3] px-3.5 py-3 flex items-start gap-2">
                <AlertTriangle size={15} className="text-[#B10D17] shrink-0 mt-0.5" />
                <p className="text-[14px] leading-[1.45] text-[#B10D17]">
                  Deleting your account is permanent and cannot be undone. All your data will be lost.
                </p>
              </div>
              <div>
                <p className="text-[14px] text-[#101828] mb-2 line-2">Type <span className="font-semibold">DELETE</span> to confirm</p>
                <input
                  value={deleteConfirmText}
                  onChange={(event) => setDeleteConfirmText(event.target.value)}
                  disabled={isBusy}
                  placeholder="DELETE"
                  className="w-full h-[42px] rounded-[10px] border border-[#D0D5DD] px-3.5 text-[14px] text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#E7000B] focus:ring-2 focus:ring-[#E7000B]/20 disabled:bg-[#F9FAFB] disabled:cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={closeModal}
                  disabled={isBusy}
                  className="h-[42px] rounded-[10px] border border-[#D0D5DD] bg-white text-[#344054] text-[14px] sm:text-[15px] font-medium hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { void handleDeleteConfirm(); }}
                  disabled={isBusy || !isDeleteConfirmValid}
                  className={`h-[42px] rounded-[10px] text-white text-[14px] sm:text-[15px] font-medium transition-opacity disabled:cursor-not-allowed ${
                    isDeleteConfirmValid ? 'bg-[#E7000B] hover:opacity-90' : 'bg-[#E97680]'
                  }`}
                >
                  {isSubmitting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
