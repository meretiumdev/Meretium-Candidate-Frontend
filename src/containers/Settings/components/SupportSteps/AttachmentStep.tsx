import { Upload } from 'lucide-react';

interface AttachmentStepProps {
  onBack: () => void;
  onSubmit: () => void;
}

export default function AttachmentStep({ onBack, onSubmit }: AttachmentStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="text-[14px] font-semibold text-[#101828] mb-2 block">Upload screenshot (optional)</label>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center text-center space-y-3 hover:bg-gray-50 transition-all cursor-pointer shadow-sm">
          <div className="w-10 h-10 rounded-[10px] bg-gray-50 flex items-center justify-center border border-gray-100">
            <Upload className="text-[#475467]" size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-[14px] font-bold text-[#101828]">Click to upload or drag and drop</p>
            <p className="text-[12px] text-[#667085] font-medium">PNG, JPG up to 10MB</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-4">
        <button 
          onClick={onBack}
          className="text-[14px] font-bold text-[#475467] hover:text-[#101828] cursor-pointer p-2 transition-colors"
        >
          Back
        </button>
        <button 
          onClick={onSubmit}
          className="px-8 py-3 bg-[#FF6934] text-white rounded-[10px] text-[14px] font-bold hover:opacity-90 transition-all shadow-sm cursor-pointer"
        >
          Submit request
        </button>
      </div>
    </div>
  );
}
