import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function JobAlerts() {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm lg:sticky top-24 font-manrope transition-all duration-300">
      <h2 className="text-[16px] font-semibold text-[#101828] mb-6">Job Alerts</h2>
      
      <div className="flex items-start gap-4 mb-6">
        <div className="size-10 shrink-0 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
          <Bell className="text-[#FF6934] size-5" />
        </div>
        <div>
          <p className="text-[14px] text-gray-500 font-semibold leading-[19px]">
            <span className="font-bold text-[14px] text-gray-900">12 new jobs</span> match your Product Designer alert
          </p>
        </div>
      </div>

      <button 
        onClick={() => navigate('/jobs')}
        className="w-full bg-[#FF6934] text-white py-2.5 rounded-[10px] text-[14px] font-medium hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
      >
        View all
      </button>
    </div>
  );
}
