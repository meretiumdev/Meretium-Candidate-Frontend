interface MessageStepProps {
  onBack: () => void;
  onContinue: () => void;
}

export default function MessageStep({ onBack, onContinue }: MessageStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="text-[14px] font-semibold text-[#101828] mb-2 block">Subject *</label>
        <input 
          type="text"
          placeholder="Brief description of your issue"
          className="w-full h-[52px] px-4 py-3 bg-white border border-[#EAECF0] rounded-xl text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20"
        />
      </div>
      <div>
        <label className="text-[14px] font-semibold text-[#101828] mb-2 block">Description *</label>
        <textarea 
          placeholder="Please provide as much detail as possible..."
          rows={4}
          className="w-full px-4 py-3 bg-white border border-[#EAECF0] rounded-xl text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 resize-none"
        />
        <p className="text-[12px] text-[#667085] mt-2">Our average response time is under 24 hours.</p>
      </div>
      <div className="flex items-center justify-between pt-4">
        <button 
          onClick={onBack}
          className="text-[14px] font-medium text-[#475467] hover:text-[#101828]"
        >
          Back
        </button>
        <button 
          onClick={onContinue}
          className="px-8 py-3 bg-[#FF6934] text-white rounded-xl text-[14px] font-semibold hover:bg-[#FF6934]/90 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
