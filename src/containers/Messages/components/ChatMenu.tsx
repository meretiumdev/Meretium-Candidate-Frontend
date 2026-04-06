import { BellOff, Flag, Ban, MoreVertical } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import BlockRecruiterModal from './BlockRecruiterModal';
import MuteConversationModal from './MuteConversationModal';
import ReportConversationModal from './ReportConversationModal';

export default function ChatMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<null | 'mute' | 'report' | 'block'>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer rounded-full ${isMenuOpen ? 'bg-gray-100' : ''}`}
      >
        <MoreVertical size={20} />
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 overflow-hidden animate-in fade-in zoom-in slide-in-from-top-2 duration-150 transform origin-top-right font-manrope">
          <button 
            onClick={() => { setActiveModal('mute'); closeMenu(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left font-body cursor-pointer"
          >
            <BellOff size={16} className="text-gray-400" /> Mute conversation
          </button>
          <button 
            onClick={() => { setActiveModal('report'); closeMenu(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left font-body cursor-pointer"
          >
            <Flag size={16} className="text-gray-400" /> Report conversation
          </button>
          <div className="h-px bg-gray-50 my-1 mx-2"></div>
          <button 
            onClick={() => { setActiveModal('block'); closeMenu(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-red-500 hover:bg-red-50 transition-colors text-left font-body cursor-pointer"
          >
            <Ban size={16} className="text-red-500" /> Block recruiter
          </button>
        </div>
      )}

      {/* Modals */}
      <MuteConversationModal 
        isOpen={activeModal === 'mute'} 
        onClose={() => setActiveModal(null)} 
        onConfirm={() => setActiveModal(null)} 
      />
      
      <ReportConversationModal 
        isOpen={activeModal === 'report'} 
        onClose={() => setActiveModal(null)} 
        onConfirm={() => setActiveModal(null)} 
      />

      <BlockRecruiterModal 
        isOpen={activeModal === 'block'} 
        onClose={() => setActiveModal(null)} 
        onConfirm={() => setActiveModal(null)}
        recruiterName="Michael Chen"
      />
    </div>
  );
}
