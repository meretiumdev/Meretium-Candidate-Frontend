import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function JobAlerts() {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-[#E4E7EC] rounded-[16px] p-6 shadow-sm">
      <h2 className="text-[14px] font-semibold text-[#101828] mb-5 font-sans">Job Alerts</h2>
      
      <div className="flex items-start gap-4 mb-6">
        <div className="size-10 shrink-0 bg-[#CC370014] rounded-[10px] flex items-center justify-center border border-orange-100/50">
          <Bell className="text-[#FF6934] size-5" />
        </div>
        <div>
          <p className="text-[13px] text-gray-500 font-medium leading-[19px]">
            <span className="font-bold text-gray-900">12 new jobs</span> match your Product Designer alert
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
