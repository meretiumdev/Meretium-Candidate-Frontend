import { X, AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { uploadCandidateCv } from '../services/cvApi';

interface UploadCVModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle?: string;
  onUploadSuccess?: () => void;
}

interface ToastState {
  id: number;
  message: string;
  type: 'error' | 'success';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Unable to upload CV. Please try again.';
}

export default function UploadCVModal({
  isOpen,
  onClose,
  jobTitle = 'Senior Product Designer',
  onUploadSuccess,
}: UploadCVModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    if (!isOpen) {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  if (!isOpen && !toast) return null;

  const handleUploadClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setToast(null);
    setIsUploading(true);

    try {
      await uploadCandidateCv({
        file,
        accessToken: accessToken || '',
      });
      setToast({
        id: Date.now(),
        message: 'CV uploaded successfully.',
        type: 'success',
      });
      onUploadSuccess?.();
      window.setTimeout(() => {
        onClose();
      }, 600);
    } catch (error: unknown) {
      setToast({
        id: Date.now(),
        message: getErrorMessage(error),
        type: 'error',
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <>
      {toast && (
        <div
          key={toast.id}
          className={`fixed top-4 right-4 z-[140] max-w-[360px] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium border ${
            toast.type === 'error'
              ? 'bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]'
              : 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]'
          }`}
        >
          {toast.message}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
          />
      
      {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx"
          />

      {/* Modal Container */}
          <div className="relative bg-white border border-gray-200 w-full max-w-[540px] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-10 flex flex-col items-center text-center font-manrope">
        
        {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isUploading}
              className="absolute top-6 right-6 p-1 hover:bg-gray-50 rounded-full transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

        {/* Dynamic Icon */}
            <div className="size-20 bg-orange-50 rounded-full flex items-center justify-center text-[#FF6934] mb-8 animate-pulse">
              <AlertCircle size={44} strokeWidth={2.5} />
            </div>

        {/* Content */}
            <h2 className="text-[24px] font-semibold text-[#101828] mb-4">Upload your CV to apply</h2>
            <p className="text-[14px] text-[#475467] leading-relaxed max-w-[400px] mb-10">
              Select a CV to apply  and generate your AI match score.
            </p>

        {/* Buttons */}
            <div className="w-full space-y-4">
              <button
                onClick={handleUploadClick}
                disabled={isUploading}
                className="w-full bg-[#FF6934] text-white py-2.5 rounded-[10px] text-[14px] font-medium shadow-lg shadow-orange-100 hover:opacity-90 transition-all cursor-pointer"
              >
                {isUploading ? 'Uploading...' : 'Upload CV'}
              </button>
              <button
                onClick={onClose}
                disabled={isUploading}
                className="w-full py-2 text-[14px] font-medium text-[#475467] hover:text-[#101828] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
