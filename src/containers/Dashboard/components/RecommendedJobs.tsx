import { Sparkles, Target, MapPin, DollarSign, Clock, CheckCircle, Bookmark, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface RecommendedJobsProps {
  onQuickApply?: (job: any) => void;
}

export default function RecommendedJobs({ onQuickApply }: RecommendedJobsProps) {
  const navigate = useNavigate();
  const [savedJobsMap, setSavedJobsMap] = useState<Record<string, boolean>>({});

  const handleApplyClick = (title: string, company: string) => {
    if (onQuickApply) {
      onQuickApply({ title, company });
    }
  };

  const toggleSave = (jobId: string) => {
    setSavedJobsMap((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-[#FF6934] size-5" />
          <h2 className="text-[18px] font-semibold text-[#101828]">AI Recommended Jobs</h2>
        </div>

        <div className="space-y-6">
          {/* Job Item 1 */}
          <div className="bg-[#FFFFFF] border border-gray-200 rounded-xl overflow-hidden pb-4 shadow-sm">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0">
                <div className="flex items-start gap-4">
                  <div className="size-12 bg-[#F2F4F7] border border-gray-200 rounded-[10px] flex items-center justify-center font-semibold text-[16px] text-[#344054] shrink-0">
                    F
                  </div>
                  <div>
                    <h3 className="text-[18px] font-semibold text-[#101828]">Lead UX Designer</h3>
                    <p className="text-[14px] text-[#475467]">Figma</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-[#F7900915] px-3 py-2 rounded-[10px] text-[#FF6934] text-[14px] font-semibold self-start sm:self-auto shadow-sm">
                  <Target size={14} /> 88% Match
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-[14px] text-[#475467]">
                <div className="flex items-center gap-1.5"><MapPin size={16} /> Remote</div>
                <div className="flex items-center gap-1.5"><DollarSign size={16} /> £95k - £140k</div>
                <div className="flex items-center gap-1.5"><Clock size={16} /> Full-time</div>
              </div>

              <div className="flex items-center gap-1.5 mt-4 text-sm font-medium text-[#039855]">
                <CheckCircle size={16} className="text-[#12B76A]" /> Verified company
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {['UI/UX', 'Prototyping', 'User Research', 'Figma'].map((tag) => (
                  <span key={tag} className="bg-[#F2F4F7] border border-gray-200 text-[#344054] text-xs font-medium px-3 py-1.5 rounded-[8px] shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mt-6">
                <span className="text-[14px] text-[#667085]">Posted 1 week ago</span>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => toggleSave('figma-lead-ux-designer')}
                    className={`transition-colors cursor-pointer p-1 ${savedJobsMap['figma-lead-ux-designer'] ? 'text-[#FF6934]' : 'text-[#667085] hover:text-[#344054]'}`}
                    aria-label={savedJobsMap['figma-lead-ux-designer'] ? 'Remove saved job' : 'Save job'}
                  >
                    <Bookmark size={20} className={savedJobsMap['figma-lead-ux-designer'] ? 'fill-[#FF6934]' : ''} />
                  </button>
                  <button 
                    onClick={() => navigate('/job-detail')}
                    className="flex-1 sm:flex-none px-4 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
                  >
                    View Job
                  </button>
                  <button 
                    onClick={() => handleApplyClick('Lead UX Designer', 'Figma')}
                    className="flex-1 sm:flex-none px-4 py-2 bg-[#FF6934] text-white rounded-[10px] text-[14px] font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                  >
                    Quick Apply
                  </button>
                </div>
              </div>
            </div>
            
            <div className="px-6">
              <div className="h-[1px] w-full bg-gray-200"></div>
              <div className="py-4 flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="bg-[#FFF4ED] text-[#FF6934] text-[12px] font-semibold h-8 w-8 rounded-full border border-[#FFE1CC] flex items-center justify-center">90%</div>
                  <span className="text-sm font-medium text-[#344054]">Why this matches you</span>
                </div>
                <ChevronDown size={18} className="text-[#FF6934]" />
              </div>
            </div>
          </div>

          {/* Job Item 2 */}
          <div className="bg-[#FFFFFF] border border-gray-200 rounded-xl overflow-hidden pb-4 shadow-sm">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0">
                <div className="flex items-start gap-4">
                  <div className="size-12 bg-[#F2F4F7] border border-gray-200 rounded-[10px] flex items-center justify-center font-semibold text-[16px] text-[#344054] shrink-0">
                    A
                  </div>
                  <div>
                    <h3 className="text-[18px] font-semibold text-[#101828]">Product Design Manager</h3>
                    <p className="text-[14px] text-[#475467]">Airbnb</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-[#F7900915] px-3 py-2 rounded-[10px] text-[#FF6934] text-[14px] font-semibold self-start sm:self-auto shadow-sm">
                  <Target size={14} /> 85% Match
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-[14px] text-[#475467]">
                <div className="flex items-center gap-1.5"><MapPin size={16} /> London, UK</div>
                <div className="flex items-center gap-1.5"><DollarSign size={16} /> £100k - £150k</div>
                <div className="flex items-center gap-1.5"><Clock size={16} /> Full-time</div>
              </div>

              <div className="flex items-center gap-1.5 mt-4 text-sm font-medium text-[#039855]">
                <CheckCircle size={16} className="text-[#12B76A]" /> Verified company
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {['Leadership', 'Product Design', 'Figma', 'Sketch'].map((tag) => (
                  <span key={tag} className="bg-[#F2F4F7] border border-gray-200 text-[#344054] text-xs font-medium px-3 py-1.5 rounded-[8px] shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mt-6">
                <span className="text-[14px] text-[#667085]">Posted 1 week ago</span>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => toggleSave('airbnb-product-design-manager')}
                    className={`transition-colors cursor-pointer p-1 ${savedJobsMap['airbnb-product-design-manager'] ? 'text-[#FF6934]' : 'text-[#667085] hover:text-[#344054]'}`}
                    aria-label={savedJobsMap['airbnb-product-design-manager'] ? 'Remove saved job' : 'Save job'}
                  >
                    <Bookmark size={20} className={savedJobsMap['airbnb-product-design-manager'] ? 'fill-[#FF6934]' : ''} />
                  </button>
                  <button 
                    onClick={() => navigate('/job-detail')}
                    className="flex-1 sm:flex-none px-4 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
                  >
                    View Job
                  </button>
                  <button 
                    onClick={() => handleApplyClick('Product Design Manager', 'Airbnb')}
                    className="flex-1 sm:flex-none px-4 py-2 bg-[#FF6934] text-white rounded-[10px] text-[14px] font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                  >
                    Quick Apply
                  </button>
                </div>
              </div>
            </div>
            
            <div className="px-6">
              <div className="h-[1px] w-full bg-gray-200"></div>
              <div className="py-4 text-center">
                <div className="flex items-center justify-between cursor-pointer mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#FFF4ED] text-[#FF6934] text-[12px] font-semibold h-8 w-8 rounded-full border border-[#FFE1CC] flex items-center justify-center">90%</div>
                    <span className="text-sm font-medium text-[#344054]">Why this matches you</span>
                  </div>
                  <ChevronUp size={18} className="text-[#FF6934]" />
                </div>
                <div className="bg-[#F9FAFB] rounded-[10px] p-4 text-[14px] text-[#475467]  block leading-relaxed shadow-sm border border-gray-100">
                  Your expertise in collaborative design tools and user-centered design matches Figma's requirements. Your portfolio demonstrates similar project complexity.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
