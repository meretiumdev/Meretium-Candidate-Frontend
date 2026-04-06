import { X, Building2, MapPin, Briefcase, FileText, Upload, ChevronLeft, Sparkles, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

interface QuickApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
}

const DEFAULT_COVER_LETTER = `Dear Hiring Manager,

I am writing to express my strong interest in the Product Design Manager position at Airbnb. With my extensive experience and proven track record, I am confident I would be a valuable addition to your team.

Throughout my career, I have developed expertise in design and ship high-quality product features, which aligns perfectly with your requirements. My approach combines strategic thinking with hands-on execution, ensuring that every decision is backed by research and business objectives.

I am particularly drawn to Airbnb because of your commitment to innovation and excellence. I would be thrilled to bring my skills and passion to contribute to your team's success.

Thank you for considering my application. I look forward to the opportunity to discuss how I can contribute to Airbnb.

Best regards`;

export default function QuickApplyModal({ isOpen, onClose, job }: QuickApplyModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCV, setSelectedCV] = useState('product-designer');
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [coverLetter, setCoverLetter] = useState(DEFAULT_COVER_LETTER);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (isGenerating && !hasGenerated) {
      const timer = setTimeout(() => {
        setIsGenerating(false);
        setHasGenerated(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, hasGenerated]);

  if (!isOpen || !job) return null;

  const cvs = [
    {
      id: 'frontend',
      name: 'Frontend_Developer_CV.pdf',
      updated: 'Last updated 2 days ago',
      recommended: true
    },
    {
      id: 'product-designer',
      name: 'Product_Designer_CV.pdf',
      updated: 'Last updated 5 days ago',
      recommended: false
    },
    {
      id: 'general',
      name: 'General_CV.pdf',
      updated: 'Last updated 10 days ago',
      recommended: false
    }
  ];

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (hasGenerated) {
      setHasGenerated(false);
      setIsGenerating(false);
      return;
    }
    if (isGenerating) {
      setIsGenerating(false);
      return;
    }
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left Column: Role Preview */}
            <div className="bg-[#F9FAFB] border border-gray-200 rounded-xl p-8 shadow-sm">
              <h3 className="text-[18px] font-semibold text-[#101828] font-heading mb-4">Role preview</h3>
              
              <h2 className="text-[24px] font-semibold text-gray-900 font-heading leading-tight mb-2">{job.title}</h2>
              <div className="flex items-center gap-2 text-[#475467] text-[14px] font-regular font-body mb-6">
                <Building2 size={18} className="opacity-70" /> {job.company || 'Airbnb'}
              </div>

              <div className="flex flex-row gap-6 mb-6">
                <div className="flex items-center gap-3 text-[14px] text-[#475467] font-regular font-body">
                  <MapPin size={17} className="opacity-60" /> {job.location || 'New York, NY'}
                </div>
                <div className="flex items-center gap-3 text-[14px] text-[#475467] font-regular font-body">
                  <Briefcase size={17} className="opacity-60" /> Full-time
                </div>
              </div>

              <div>
                <h4 className="text-[14px] font-regular text-[#101828] font-heading mb-4">Key responsibilities:</h4>
                <ul className="space-y-3">
                  {[
                    "Design and ship high-quality product features",
                    "Collaborate with cross-functional teams",
                    "Maintain and evolve design systems",
                    "Conduct user research and usability testing"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-[14px] text-[#4B5563] font-medium font-body leading-relaxed">
                      <span className="size-1.5 bg-[#FF6934] rounded-full mt-2 shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column: Select CV */}
            <div>
              <h3 className="text-[18px] font-semibold text-[#101828] font-heading mb-4">Select a CV</h3>
              
              <div className="flex flex-col gap-3">
                {cvs.map((cv) => (
                  <div 
                    key={cv.id}
                    onClick={() => setSelectedCV(cv.id)}
                    className={`relative p-4 rounded-xl border transition-all cursor-pointer group flex items-start gap-4 ${
                      selectedCV === cv.id 
                      ? 'border-[#FF6934] bg-[#FFF9F2] shadow-sm' 
                      : 'border-gray-200 hover:border-orange-200 bg-white'
                    }`}
                  >
                    {cv.recommended && (
                      <div className="absolute -top-2.5 right-4 bg-[#ECFDF3] text-[#10B981] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#D1FADF]">
                        Recommended
                      </div>
                    )}

                    <div className={`mt-0.5 size-5 rounded-[3px] border-1 flex items-center justify-center transition-colors ${
                      selectedCV === cv.id ? 'bg-[#FF6934] border-[#FF6934]' : 'border-[#FF6934]'
                    }`}>
                      {selectedCV === cv.id && <div className="size-2 bg-white rounded-sm"></div>}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-[14px] font-medium text-[#101828] font-body mb-1">
                        <FileText size={17} className="text-[#101828]" /> {cv.name}
                      </div>
                      <div className="text-[12px] font-medium text-[#475467] font-body">
                        {cv.updated}
                      </div>
                    </div>
                  </div>
                ))}

                <button className="flex items-center justify-between w-full p-4 rounded-xl bg-[#FFF9F2]/50 border border-gray-200 hover:border-orange-200 hover:bg-[#FFF9F2] transition-all group mt-2 cursor-pointer shadow-sm">
                  <div className="flex items-center gap-3 text-[14px] font-medium text-[#475467] font-body">
                    <Upload size={18} className="text-[#475467] group-hover:text-[#FF6934]" /> Upload new CV
                  </div>
                </button>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="p-8 space-y-8 min-h-[400px]">
             <h3 className="text-[20px] font-bold text-[#101828] font-heading mb-6 -mt-2">Screening questions</h3>
             
             {/* Question 1 */}
             <div className="space-y-3">
               <label className="block text-[15px] font-medium text-[#101828]">Are you authorized to work in the UK?<span className="text-red-500">*</span></label>
               <div className="flex gap-4">
                 <button 
                  onClick={() => setAuthStatus('yes')}
                  className={`flex-1 py-3 px-6 rounded-xl border font-medium text-[15px] transition-all cursor-pointer shadow-sm ${authStatus === 'yes' ? 'bg-[#FF6934] text-white border-[#FF6934]' : 'bg-white text-[#475467] border-gray-200 hover:bg-gray-50'}`}
                 >
                   Yes
                 </button>
                 <button 
                  onClick={() => setAuthStatus('no')}
                  className={`flex-1 py-3 px-6 rounded-xl border font-medium text-[15px] transition-all cursor-pointer shadow-sm ${authStatus === 'no' ? 'bg-[#FF6934] text-white border-[#FF6934]' : 'bg-white text-[#475467] border-gray-200 hover:bg-gray-50'}`}
                 >
                   No
                 </button>
               </div>
             </div>

             {/* Question 2 */}
             <div className="space-y-3">
                <label className="block text-[15px] font-medium text-[#101828]">What is your expected salary range?<span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6934]/10 focus:border-[#FF6934] text-[15px] placeholder:text-[#98A2B3] shadow-sm"
                />
             </div>

             {/* Question 3 */}
             <div className="space-y-3">
                <label className="block text-[15px] font-medium text-[#101828]">Why are you interested in this role?<span className="text-red-500">*</span></label>
                <textarea 
                  placeholder="Type your answer..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6934]/10 focus:border-[#FF6934] text-[15px] placeholder:text-[#98A2B3] min-h-[140px] resize-none shadow-sm"
                />
             </div>
          </div>
        );
      case 3:
        if (hasGenerated) {
          return (
            <div className="p-8 space-y-6">
              <h3 className="text-[20px] font-bold text-[#101828] font-heading mb-4">Review and edit your cover letter</h3>
              <div className="relative group">
                <textarea 
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full min-h-[460px] p-8 rounded-xl border border-gray-200 bg-white text-[#344054] text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#FF6934]/5 focus:border-[#FF6934] transition-all scrollbar-hide shadow-sm font-body"
                />
                <div className="absolute bottom-4 right-4 text-[12px] text-gray-400 font-medium">
                  {coverLetter.length} characters
                </div>
              </div>
            </div>
          );
        }
        if (isGenerating) {
          return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
              <div className="size-20 bg-orange-50 rounded-full flex items-center justify-center text-[#FF6934] mb-12">
                <Sparkles size={40} />
              </div>
              
              <div className="w-full max-w-[400px] space-y-5 mb-10">
                <div className="flex items-center gap-4 text-[16px] font-medium text-gray-900">
                  <div className="size-6 rounded-full bg-[#12B76A] flex items-center justify-center text-white">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  Analyzing your CV
                </div>
                <div className="flex items-center gap-4 text-[16px] font-medium text-gray-900">
                  <div className="size-6 rounded-full bg-[#FF6934] flex items-center justify-center animate-pulse">
                    <div className="size-2 bg-white rounded-full"></div>
                  </div>
                  Matching job requirements
                </div>
                <div className="flex items-center gap-4 text-[16px] font-medium text-[#98A2B3]">
                  <div className="size-6 rounded-full bg-[#F2F4F7] flex items-center justify-center">
                    <div className="size-2 bg-[#D0D5DD] rounded-full"></div>
                  </div>
                  Writing your personalized cover letter
                </div>
              </div>

              <div className="w-full max-w-[440px] h-2 bg-[#F2F4F7] rounded-full overflow-hidden">
                <div className="w-[60%] h-full bg-[#FF6934] rounded-full transition-all duration-1000 animate-pulse"></div>
              </div>
            </div>
          );
        }
        return (
          <div className="p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
            <div className="size-20 bg-orange-50 rounded-full flex items-center justify-center text-[#FF6934] mb-8 animate-pulse">
              <Sparkles size={40} strokeWidth={2} />
            </div>
            
            <h3 className="text-[26px] font-semibold text-[#101828] mb-4">Generate AI cover letter</h3>
            <p className="text-[17px] text-[#475467] max-w-[500px] mb-10 leading-relaxed">
              Our AI will write a personalized cover letter based on your CV and the job requirements
            </p>

            <button 
              onClick={() => setIsGenerating(true)}
              className="bg-[#FF6934] text-white px-8 py-3.5 rounded-[12px] font-semibold text-[16px] shadow-lg shadow-orange-100 flex items-center gap-3 hover:opacity-90 transition-all cursor-pointer group"
            >
              <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
              Generate cover letter
            </button>
          </div>
        );
      case 4:
        return (
          <div className="p-8 space-y-6">
            <h3 className="text-[20px] font-bold text-[#101828] font-heading mb-4">Review your application</h3>
            
            <div className="space-y-4">
              {/* Selected CV */}
              <div className="bg-[#F9FAFB] rounded-xl p-5 border border-gray-200 shadow-sm">
                <h4 className="text-[14px] font-semibold text-[#101828] mb-2">Selected CV</h4>
                <div className="flex items-center gap-3 text-[14px] text-[#475467]">
                  <FileText size={18} className="text-[#344054]" />
                  {cvs.find(c => c.id === selectedCV)?.name || 'Frontend_Developer_CV.pdf'}
                </div>
              </div>

              {/* Applying to */}
              <div className="bg-[#F9FAFB] rounded-xl p-5 border border-gray-200 shadow-sm">
                <h4 className="text-[14px] font-semibold text-[#101828] mb-1">Applying to</h4>
                <div className="text-[15px] font-semibold text-gray-900">{job.title}</div>
                <div className="text-[14px] text-[#475467]">{job.company || 'Airbnb'}</div>
              </div>

              {/* Cover Letter */}
              <div className="bg-[#F9FAFB] rounded-xl p-5 border border-gray-200 shadow-sm">
                <h4 className="text-[14px] font-semibold text-[#101828] mb-3">Cover letter</h4>
                <p className="text-[14px] text-[#475467] leading-relaxed line-clamp-5 whitespace-pre-wrap">
                  {coverLetter}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-4">
              <div 
                onClick={() => setIsConfirmed(!isConfirmed)}
                className={`mt-1 size-5 rounded-[4px] border-1 flex items-center justify-center transition-all cursor-pointer shrink-0 ${isConfirmed ? 'bg-[#FF6934] border-[#FF6934]' : 'border-[#D0D5DD] hover:border-[#FF6934]'}`}
              >
                {isConfirmed && <Check size={14} className="text-white stroke-[3.5]" />}
              </div>
              <p className="text-[14px] text-[#475467] leading-relaxed select-none">
                I confirm that the information provided is correct and I understand that {job.company || 'Airbnb'} will review my application.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-20 text-center text-gray-500 font-medium">
            Step {currentStep} content coming soon...
          </div>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-6 transition-opacity"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div 
        className="bg-white border border-gray-200 rounded-xl overflow-hidden w-full max-w-[840px] shadow-2xl relative flex flex-col font-manrope transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[24px] font-semibold text-[#111827] font-heading">Quick Apply</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 bg-gray-50 hover:bg-gray-100 rounded-full cursor-pointer">
              <X size={20} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[14px] font-regular text-gray-500 font-body">Step {currentStep} of 4</span>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#FF6934] rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto scrollbar-hide max-h-[calc(90vh-200px)]">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-white border-t border-gray-200 flex items-center justify-between">
          <button 
            onClick={currentStep === 1 ? onClose : handleBack}
            className="text-[15px] font-medium text-[#475467] hover:text-[#101828] transition-colors cursor-pointer flex items-center gap-1"
          >
            {currentStep > 1 && <ChevronLeft size={18} />}
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>
          {!isGenerating && (
            <button 
              onClick={currentStep === 4 ? onClose : handleNext}
              className="bg-[#FF6934] text-white px-8 py-3 rounded-[10px] font-medium shadow-lg shadow-orange-100 hover:opacity-90 transition-opacity cursor-pointer"
            >
              {currentStep === 4 ? 'Submit Application' : 'Continue'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
