import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Edit3 } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import { updateCandidateProfile } from '../../../services/profileApi';

interface AboutSectionProps {
  about: string;
  onProfileUpdated?: () => Promise<void> | void;
}

interface ToastState {
  id: number;
  message: string;
  type: 'error' | 'success';
}

const AI_APPENDIX =
  'With over 8 years of experience in product design, I specialize in creating intuitive, user-centered interfaces that drive business results. My approach combines deep user research, rapid prototyping, and data-driven decision making to deliver exceptional digital experiences.';

export default function AboutSection({ about, onProfileUpdated }: AboutSectionProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [isImproving, setIsImproving] = useState(false);
  const [isEditingLocal, setIsEditingLocal] = useState(false);
  const [aboutText, setAboutText] = useState('');
  const [aboutDraft, setAboutDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    setAboutText(about.trim());
  }, [about]);

  const aiImprovedText = useMemo(() => {
    const base = aboutText.trim();
    if (!base) return AI_APPENDIX;
    return `${base}\n\n${AI_APPENDIX}`;
  }, [aboutText]);

  const startEditing = () => {
    setAboutDraft(aboutText);
    setIsImproving(false);
    setSaveError(null);
    setIsEditingLocal(true);
  };

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const cancelEditing = () => {
    setAboutDraft('');
    setAboutText(about.trim());
    setSaveError(null);
    setIsEditingLocal(false);
  };

  const saveEditing = async () => {
    const nextAbout = aboutDraft.trim();
    if (nextAbout === aboutText.trim()) {
      setIsEditingLocal(false);
      return;
    }

    if (!accessToken) {
      const message = 'You are not authenticated. Please log in again.';
      setSaveError(message);
      setToast({ id: Date.now(), message, type: 'error' });
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await updateCandidateProfile(accessToken, { about: nextAbout });
      setAboutText(nextAbout);
      if (onProfileUpdated) {
        await onProfileUpdated();
      }
      setIsEditingLocal(false);
      setToast({ id: Date.now(), message: 'About section updated.', type: 'success' });
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : 'Failed to update about section.';
      setSaveError(message);
      setToast({ id: Date.now(), message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6 font-manrope transition-all duration-300">
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

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[18px] md:text-[20px] font-semibold text-[#101828]">About</h2>
        {!isEditingLocal && (
          <div className="flex items-center gap-5">
            <button
              onClick={startEditing}
              className="text-[#475467] hover:text-[#FF6934] transition-colors cursor-pointer"
            >
              <Edit3 size={18} />
            </button>
            <button
              onClick={() => setIsImproving(!isImproving)}
              className={`flex items-center gap-2 text-[14px] font-bold transition-colors cursor-pointer ${isImproving ? 'text-[#FF6934]' : 'text-[#475467] hover:text-[#FF6934]'}`}
            >
              <Sparkles size={18} /> Improve with AI
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {isEditingLocal ? (
          <div className="space-y-8">
            <textarea
              value={aboutDraft}
              onChange={(e) => setAboutDraft(e.target.value)}
              className="w-full min-h-[180px] px-6 py-7 text-[14px] text-[#475467] font-medium leading-relaxed border border-[#D0D5DD] rounded-[16px] focus:outline-none focus:border-[#FF6934] transition-colors resize-none"
              placeholder="Tell us about yourself..."
            />
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => { void saveEditing(); }}
                    disabled={isSaving}
                    className="min-w-[120px] px-8 py-3 bg-[#FF6934] text-white rounded-[14px] text-[14px] font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEditing}
                    disabled={isSaving}
                    className="px-1 py-3 text-[#344054] text-[14px] font-semibold hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                {saveError && (
                  <p className="text-[13px] font-medium text-[#B42318]">{saveError}</p>
                )}
              </div>
        ) : !isImproving ? (
          aboutText.trim().length > 0 ? (
            <p className="text-[14px] text-[#475467] font-medium leading-relaxed font-body whitespace-pre-wrap">
              {aboutText}
            </p>
          ) : (
            <div className="bg-[#F9FAFB] border border-[#EAECF0] rounded-xl px-4 py-5">
              <p className="text-[14px] text-[#667085] font-medium">
                About section is empty. Add a short professional summary to improve your profile.
              </p>
            </div>
          )
        ) : (
          <div className="bg-[#FFF8F5] p-5 md:p-6 rounded-xl border border-[#FF6934]/10 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-[#FF6934] font-medium text-[15px]">
              <Sparkles size={18} className="text-[#FF6934]" /> AI-improved version
            </div>
            <p className="text-[14px] text-[#475467] font-medium leading-relaxed font-body mb-6 whitespace-pre-wrap">
              {aiImprovedText}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setAboutText(aiImprovedText);
                  setIsImproving(false);
                }}
                className="px-5 py-2 bg-[#FF6934] text-white rounded-[8px] text-[14px] font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
              >
                Accept
              </button>
              <button
                onClick={() => setIsImproving(false)}
                className="px-4 py-2 text-[#475467] rounded-[8px] text-[14px] font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Decline
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
