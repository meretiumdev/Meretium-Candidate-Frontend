import { Upload } from 'lucide-react';

interface AttachmentStepProps {
  selectedFile: File | null;
  fileError?: string | null;
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  onFileChange: (file: File | null) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export default function AttachmentStep({
  selectedFile,
  fileError,
  submitDisabled = false,
  isSubmitting = false,
  onFileChange,
  onBack,
  onSubmit,
}: AttachmentStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="text-[14px] font-semibold text-[#101828] mb-2 block">Upload screenshot (optional)</label>
        <label className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center text-center space-y-3 hover:bg-gray-50 transition-all cursor-pointer shadow-sm">
          <div className="w-10 h-10 rounded-[10px] bg-gray-50 flex items-center justify-center border border-gray-100">
            <Upload className="text-[#475467]" size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-[14px] font-bold text-[#101828]">Click to upload or drag and drop</p>
            <p className="text-[12px] text-[#667085] font-medium">PNG, JPG up to 10MB</p>
          </div>
          <input
            type="file"
            accept=".png,.jpg,.jpeg"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              onFileChange(file);
              event.currentTarget.value = '';
            }}
          />
        </label>
        {selectedFile && (
          <div className="mt-3 flex items-center justify-between rounded-[10px] border border-[#EAECF0] px-3 py-2">
            <p className="truncate text-[13px] text-[#475467]">{selectedFile.name}</p>
            <button
              onClick={() => onFileChange(null)}
              type="button"
              className="text-[12px] font-medium text-[#B42318] hover:opacity-80 transition-opacity cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}
        {fileError && (
          <p className="mt-2 text-[12px] text-[#B42318]">{fileError}</p>
        )}
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
          disabled={submitDisabled}
          className="px-8 py-3 bg-[#FF6934] text-white rounded-[10px] text-[14px] font-bold hover:opacity-90 transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Submitting...' : 'Submit request'}
        </button>
      </div>
    </div>
  );
}
