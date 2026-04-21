import React from 'react';
import { useSelector } from 'react-redux';
import { MessageSquare, ChevronUp, ChevronDown } from 'lucide-react';
import type { RootState } from '../../../../redux/store';
import {
  CONTACT_SUPPORT_CATEGORIES,
  submitContactSupportRequest,
  type ContactSupportCategory,
} from '../../../../services/contactSupportApi';
import CategoryStep from '../SupportSteps/CategoryStep';
import MessageStep from '../SupportSteps/MessageStep';
import AttachmentStep from '../SupportSteps/AttachmentStep';

interface ContactSupportSectionProps {
  expanded: boolean;
  onToggle: () => void;
  supportStep: number;
  onSetSupportStep: (step: number) => void;
}

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to submit support request. Please try again.';
}

export default function ContactSupportSection({ expanded, onToggle, supportStep, onSetSupportStep }: ContactSupportSectionProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [category, setCategory] = React.useState<ContactSupportCategory | ''>('');
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [attachment, setAttachment] = React.useState<File | null>(null);
  const [categoryError, setCategoryError] = React.useState<string | null>(null);
  const [subjectError, setSubjectError] = React.useState<string | null>(null);
  const [messageError, setMessageError] = React.useState<string | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [toast, setToast] = React.useState<ToastState | null>(null);

  React.useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const showSuccessToast = React.useCallback((nextMessage: string) => {
    setToast({ id: Date.now(), message: nextMessage, type: 'success' });
  }, []);

  const showErrorToast = React.useCallback((nextMessage: string) => {
    setToast({ id: Date.now(), message: nextMessage, type: 'error' });
  }, []);

  const validateCategory = React.useCallback((): boolean => {
    if (category) {
      setCategoryError(null);
      return true;
    }

    setCategoryError('Category is required.');
    return false;
  }, [category]);

  const validateMessageFields = React.useCallback((): boolean => {
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    let isValid = true;

    if (!trimmedSubject) {
      setSubjectError('Subject is required.');
      isValid = false;
    } else if (trimmedSubject.length < 5) {
      setSubjectError('Subject must be at least 5 characters.');
      isValid = false;
    } else {
      setSubjectError(null);
    }

    if (!trimmedMessage) {
      setMessageError('Message is required.');
      isValid = false;
    } else if (trimmedMessage.length < 10) {
      setMessageError('Message must be at least 10 characters.');
      isValid = false;
    } else {
      setMessageError(null);
    }

    return isValid;
  }, [message, subject]);

  const resetForm = React.useCallback(() => {
    setCategory('');
    setSubject('');
    setMessage('');
    setAttachment(null);
    setCategoryError(null);
    setSubjectError(null);
    setMessageError(null);
    setFileError(null);
    onSetSupportStep(1);
  }, [onSetSupportStep]);

  const handleContinueFromCategory = () => {
    if (!validateCategory()) return;
    onSetSupportStep(2);
  };

  const handleContinueFromMessage = () => {
    const categoryOk = validateCategory();
    const messageOk = validateMessageFields();
    if (!categoryOk || !messageOk) return;
    onSetSupportStep(3);
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setAttachment(null);
      setFileError(null);
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      setAttachment(null);
      setFileError('File size must be 10MB or less.');
      return;
    }

    setAttachment(file);
    setFileError(null);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const categoryOk = validateCategory();
    const messageOk = validateMessageFields();
    if (!categoryOk || !messageOk) return;

    if (!accessToken?.trim()) {
      showErrorToast('You are not authenticated. Please log in again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const successMessage = await submitContactSupportRequest(accessToken, {
        category: category as ContactSupportCategory,
        subject: subject.trim(),
        description: message.trim(),
        file: attachment,
      });

      showSuccessToast(successMessage || 'Support request submitted successfully.');
      resetForm();
    } catch (error: unknown) {
      showErrorToast(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm transition-all duration-300">
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

      <button
        onClick={onToggle}
        className="w-full p-6 sm:p-8 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[10px] bg-[#FFF1EC] border border-[#FF693410] flex items-center justify-center shadow-sm">
            <MessageSquare className="text-[#FF6934]" size={24} />
          </div>
          <div className="font-manrope">
            <h3 className="text-[16px] font-semibold text-[#101828]">Contact Support</h3>
            <p className="text-[14px] text-[#667085]">Get help from our support team</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="text-[#667085]" /> : <ChevronDown className="text-[#667085]" />}
      </button>

      {expanded && (
        <div className="px-6 sm:px-8 pb-8 font-manrope animate-in fade-in duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${supportStep >= 1 ? 'bg-[#FF6934] text-white shadow-sm' : 'border border-[#E4E7EC] text-[#667085]'}`}>1</div>
              <span className={`text-[12px] font-medium ${supportStep >= 1 ? 'text-[#FF6934]' : 'text-[#667085]'}`}>Category</span>
            </div>
            <div className={`flex-1 h-px ${supportStep >= 2 ? 'bg-[#FF6934]' : 'bg-[#E4E7EC]'}`} />
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${supportStep >= 2 ? 'bg-[#FF6934] text-white shadow-sm' : 'border border-[#E4E7EC] text-[#667085]'}`}>2</div>
              <span className={`text-[12px] font-medium ${supportStep >= 2 ? 'text-[#FF6934]' : 'text-[#667085]'}`}>Message</span>
            </div>
            <div className={`flex-1 h-px ${supportStep >= 3 ? 'bg-[#FF6934]' : 'bg-[#E4E7EC]'}`} />
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${supportStep >= 3 ? 'bg-[#FF6934] text-white shadow-sm' : 'border border-[#E4E7EC] text-[#667085]'}`}>3</div>
              <span className={`text-[12px] font-medium ${supportStep >= 3 ? 'text-[#FF6934]' : 'text-[#667085]'}`}>Attachment</span>
            </div>
          </div>

          {supportStep === 1 && (
            <CategoryStep
              category={category}
              categories={CONTACT_SUPPORT_CATEGORIES}
              onCategoryChange={(nextCategory) => {
                setCategory(nextCategory);
                setCategoryError(null);
              }}
              errorMessage={categoryError}
              onContinue={handleContinueFromCategory}
              continueDisabled={isSubmitting}
            />
          )}

          {supportStep === 2 && (
            <MessageStep
              subject={subject}
              message={message}
              subjectError={subjectError}
              messageError={messageError}
              onSubjectChange={(value) => {
                setSubject(value);
                setSubjectError(null);
              }}
              onMessageChange={(value) => {
                setMessage(value);
                setMessageError(null);
              }}
              onBack={() => onSetSupportStep(1)}
              onContinue={handleContinueFromMessage}
              continueDisabled={isSubmitting}
            />
          )}

          {supportStep === 3 && (
            <AttachmentStep
              selectedFile={attachment}
              fileError={fileError}
              submitDisabled={isSubmitting}
              isSubmitting={isSubmitting}
              onFileChange={handleFileChange}
              onBack={() => onSetSupportStep(2)}
              onSubmit={() => {
                void handleSubmit();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
