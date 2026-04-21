interface MessageStepProps {
  subject: string;
  message: string;
  subjectError?: string | null;
  messageError?: string | null;
  onSubjectChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
  continueDisabled?: boolean;
}

export default function MessageStep({
  subject,
  message,
  subjectError,
  messageError,
  onSubjectChange,
  onMessageChange,
  onBack,
  onContinue,
  continueDisabled = false,
}: MessageStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="text-[14px] font-semibold text-[#101828] mb-2 block">Subject *</label>
        <input
          type="text"
          value={subject}
          onChange={(event) => onSubjectChange(event.target.value)}
          placeholder="Brief description of your issue"
          className={`w-full h-[52px] px-4 py-3 bg-white border rounded-xl text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 ${
            subjectError ? 'border-[#FDA29B]' : 'border-[#EAECF0]'
          }`}
        />
        {subjectError && (
          <p className="mt-2 text-[12px] text-[#B42318]">{subjectError}</p>
        )}
      </div>
      <div>
        <label className="text-[14px] font-semibold text-[#101828] mb-2 block">Description *</label>
        <textarea
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder="Please provide as much detail as possible..."
          rows={4}
          className={`w-full px-4 py-3 bg-white border rounded-xl text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 resize-none ${
            messageError ? 'border-[#FDA29B]' : 'border-[#EAECF0]'
          }`}
        />
        {messageError && (
          <p className="mt-2 text-[12px] text-[#B42318]">{messageError}</p>
        )}
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
          disabled={continueDisabled}
          className="px-8 py-3 bg-[#FF6934] text-white rounded-xl text-[14px] font-semibold hover:bg-[#FF6934]/90 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
