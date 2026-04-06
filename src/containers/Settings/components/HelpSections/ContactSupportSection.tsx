import { MessageSquare, ChevronUp, ChevronDown } from 'lucide-react';
import CategoryStep from '../SupportSteps/CategoryStep';
import MessageStep from '../SupportSteps/MessageStep';
import AttachmentStep from '../SupportSteps/AttachmentStep';

interface ContactSupportSectionProps {
  expanded: boolean;
  onToggle: () => void;
  supportStep: number;
  onSetSupportStep: (step: number) => void;
}

export default function ContactSupportSection({ expanded, onToggle, supportStep, onSetSupportStep }: ContactSupportSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm transition-all duration-300">
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
          {supportStep === 1 && <CategoryStep onContinue={() => onSetSupportStep(2)} />}
          {supportStep === 2 && <MessageStep onBack={() => onSetSupportStep(1)} onContinue={() => onSetSupportStep(3)} />}
          {supportStep === 3 && <AttachmentStep onBack={() => onSetSupportStep(2)} onSubmit={() => console.log('Submit')} />}
        </div>
      )}
    </div>
  );
}
