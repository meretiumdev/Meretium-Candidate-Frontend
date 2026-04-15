import { useState } from 'react';
import { X, Link2, Mail, Lock } from 'lucide-react';

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileUrl?: string | null;
}

// LinkedIn SVG icon (not in lucide-react)
function LinkedInIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

export default function ShareProfileModal({ isOpen, onClose, profileUrl }: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = profileUrl?.trim() || 'https://meretium.ai/profile';

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleEmail = () => {
    window.location.href = `mailto:?subject=Check out my Meretium profile&body=View my profile here: ${shareUrl}`;
  };

  const handleLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-all"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-white rounded-[16px] shadow-2xl overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="text-[20px] font-semibold text-[#101828]">Share profile</h3>
          <button
            onClick={onClose}
            className="text-[#667085] hover:text-gray-900 transition-colors cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          {/* Public profile link */}
          <div>
            <label className="block text-[#101828] text-[14px] font-medium mb-2">
              Public profile link
            </label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-[8px] px-3.5 py-2.5">
              <Link2 size={16} className="text-[#98A2B3] shrink-0" />
              <span className="text-[14px] text-[#475467] flex-1 truncate">{shareUrl}</span>
              <button
                onClick={handleCopy}
                className="shrink-0 text-[14px] font-medium text-[#344054] border border-gray-200 px-3 py-1 rounded-[6px] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Share via */}
          <div>
            <label className="block text-[#101828] text-[14px] font-medium mb-3">
              Share via
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleLinkedIn}
                className="flex items-center justify-center gap-2.5 border border-gray-200 rounded-[10px] px-4 py-3 text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <LinkedInIcon /> LinkedIn
              </button>
              <button
                onClick={handleEmail}
                className="flex items-center justify-center gap-2.5 border border-gray-200 rounded-[10px] px-4 py-3 text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Mail size={20} className="text-[#475467]" /> Email
              </button>
            </div>
          </div>

          {/* Privacy notice */}
          <div className="flex items-center gap-2 bg-[#F9FAFB] border border-gray-100 rounded-[8px] px-4 py-3">
            <Lock size={14} className="text-[#667085] shrink-0" />
            <p className="text-[13px] font-medium text-[#475467]">
              Only visible to your selected audience based on your privacy settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
