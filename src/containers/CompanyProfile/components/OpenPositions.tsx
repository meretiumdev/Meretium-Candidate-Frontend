import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OPEN_POSITIONS = [
  {
    id: '1',
    title: 'Product Designer',
    location: 'Remote',
    type: 'Full-time',
    salary: '$90,000 – $120,000',
  },
  {
    id: '2',
    title: 'Senior UX Designer',
    location: 'Remote',
    type: 'Full-time',
    salary: '$100,000 – $130,000',
  },
  {
    id: '3',
    title: 'Design System Lead',
    location: 'Remote',
    type: 'Full-time',
    salary: '$110,000 – $140,000',
  },
];

export default function OpenPositions({ onViewAll }: { onViewAll: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-[18px] md:text-[20px] font-bold text-[#101828]">Open positions at Notion</h2>
        <span className="inline-flex items-center w-fit gap-1.5 text-[12px] font-medium text-[#12B76A] bg-[#ECFDF3] px-4 py-1.5 rounded-full">
          Actively hiring
        </span>
      </div>

      {/* Job List */}
      <div className="flex flex-col gap-4">
        {OPEN_POSITIONS.map((job) => (
          <div
            key={job.id}
            onClick={() => navigate('/jobs')}
            className="border border-[#E4E7EC] rounded-[10px] p-4 cursor-pointer hover:border-[#FF6934] transition-all group"
          >
            <h3 className="text-[18px] md:text-[18px] font-semibold text-[#101828] mb-3">
              {job.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] md:text-[16px] text-[#475467] font-regular">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-[#475467]" />
                {job.location}
              </div>
              <span className="text-gray-900">•</span>
              <div className="flex items-center gap-1">
                {job.type}
              </div>
              <span className="text-gray-900">•</span>
              <div className="text-[#12B76A] font-medium">
                {job.salary}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All */}
      <button
        type="button"
        onClick={onViewAll}
        className="w-full mt-6 border border-[#E4E7EC] rounded-[10px] py-4 text-center text-[16px] md:text-[18px] font-medium text-[#344054] hover:bg-gray-50 transition-all cursor-pointer"
      >
        View all jobs
      </button>
    </div>
  );
}
