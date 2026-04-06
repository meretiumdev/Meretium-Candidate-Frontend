import { Upload, UserCircle, Search as SearchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StepsGrid() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Step 1 */}
      <div className="relative bg-white border border-[#E4E7EC] rounded-[16px] p-6 md:p-8 text-center shadow-sm flex flex-col items-center">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6934] text-white text-[12px] font-semibold px-4 py-1 rounded-full  uppercase tracking-wider">
          Start here
        </div>
        <div className="size-16 bg-orange-50 rounded-full flex items-center justify-center mb-6 ">
          <Upload className="size-8 text-[#FF6934]" />
        </div>
        <h3 className="text-[16px] md:text-[18px] font-semibold text-gray-900 mb-3">Upload Your CV</h3>
        <p className="text-[#475467] text-[13px] md:text-sm leading-relaxed mb-8">
          Let AI analyze your experience and match you with perfect roles in seconds
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-[#FF6934] text-white font-medium text-[14px] py-3 rounded-[10px] hover:opacity-90 transition-opacity  mt-auto cursor-pointer"
        >
          Get started
        </button>
      </div>

      {/* Step 2 */}
      <div className="relative bg-white border border-[#E4E7EC] rounded-[16px] p-6 md:p-8 text-center shadow-sm flex flex-col items-center">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6934] text-white text-[12px] font-semibold px-4 py-1 rounded-full  uppercase tracking-wider">
          Step 2
        </div>
        <div className="size-16 bg-orange-50 rounded-full flex items-center justify-center mb-6 ">

          <UserCircle className="size-8 text-[#FF6934] opacity-80" />
        </div>
        <h3 className="text-[16px] md:text-[18px] font-semibold text-gray-900 mb-3">Review Your Profile</h3>
        <p className="text-[#475467] text-[13px] md:text-sm leading-relaxed mb-8">
          We've created your profile from your CV. Edit anything if needed
        </p>
        <button
          onClick={() => navigate('/profile')}
          className="w-full bg-[#FFFFFF] text-[#101828] border border-[#E4E7EC] font-medium text-[14px] py-3 rounded-[10px] hover:opacity-90 transition-opacity  mt-auto cursor-pointer"
        >
          Review Details
        </button>
      </div>

      {/* Step 3 */}
      <div className="relative bg-white border border-[#E4E7EC] rounded-[16px] p-6 md:p-8 text-center shadow-sm flex flex-col items-center">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6934] text-white text-[12px] font-semibold px-4 py-1 rounded-full  uppercase tracking-wider">
          Step 3
        </div>
        <div className="size-16 bg-orange-50 rounded-full flex items-center justify-center mb-6 ">

          <SearchIcon className="size-8 text-[#FF6934] opacity-80" />
        </div>
        <h3 className="text-[16px] md:text-[18px] font-semibold text-gray-900 mb-3">Get AI-Matched Jobs</h3>
        <p className="text-[#475467] text-[13px] md:text-sm leading-relaxed mb-8 ">
          Explore thousands of opportunities from top companies hiring right now
        </p>
        <button
          onClick={() => navigate('/jobs')}
          className="w-full bg-[#FFFFFF] text-[#101828] border border-[#E4E7EC] font-medium text-[14px] py-3 rounded-[10px] hover:opacity-90 transition-opacity  mt-auto cursor-pointer"
        >
          Explore jobs
        </button>
      </div>
    </div>
  );
}
