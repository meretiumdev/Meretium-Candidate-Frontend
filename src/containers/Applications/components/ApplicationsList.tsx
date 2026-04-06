import { Building2, MapPin, Calendar, Check, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import ApplicationDetailModal from './ApplicationDetailModal';

// Reusable progress indicator component
function ApplicationProgress({ currentStage }: { currentStage: number }) {
  const totalStages = 4;

  return (
    <div className="flex items-center mt-4">
      {[...Array(totalStages)].map((_, idx) => {
        const stageNum = idx + 1;
        const isCompleted = stageNum < currentStage;
        const isActive = stageNum === currentStage;

        return (
          <div key={stageNum} className="flex items-center">
            {/* Circle */}
            <div className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isCompleted ? 'bg-[#10B981] text-white' :
                isActive ? 'bg-[#FF6934] text-white shadow-sm shadow-orange-200' :
                  'bg-gray-100 text-gray-400'
              }`}>
              {isCompleted ? <Check size={12} strokeWidth={3} /> : stageNum}
            </div>

            {/* Line connecting to next */}
            {stageNum < totalStages && (
              <div className={`h-[2px] w-6 sm:w-10 ${isCompleted ? 'bg-[#10B981]' : 'bg-gray-100'}`}></div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ApplicationsList() {
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  const applications = [
    {
      id: 1,
      title: 'Senior Product Designer',
      company: 'Notion',
      location: 'London (Remote)',
      appliedAt: 'Applied 3 days ago',
      stage: 3,
      status: 'Interview',
      statusColor: 'bg-purple-50 text-purple-600',
      showProgress: true,
    },
    {
      id: 2,
      title: 'Lead UX Designer',
      company: 'Stripe',
      location: 'San Francisco (Remote)',
      appliedAt: 'Applied 1 week ago',
      stage: 2,
      status: 'In Review',
      statusColor: 'bg-blue-50 text-blue-600',
      showProgress: true,
    },
    {
      id: 3,
      title: 'Product Design Manager',
      company: 'Figma',
      location: 'Remote',
      appliedAt: 'Applied 2 weeks ago',
      stage: 4,
      status: 'Offered',
      statusColor: 'bg-green-100 text-green-700',
      showProgress: true,
    },
    {
      id: 4,
      title: 'UI/UX Designer',
      company: 'Airbnb',
      location: 'London, UK',
      appliedAt: 'Applied 3 weeks ago',
      stage: 0,
      status: 'Rejected',
      statusColor: 'bg-red-50 text-red-600',
      showProgress: false,
    },
    {
      id: 5,
      title: 'Design Systems Lead',
      company: 'Shopify',
      location: 'Remote',
      appliedAt: 'Applied 5 days ago',
      stage: 1,
      status: 'Applied',
      statusColor: 'bg-gray-50 text-gray-600 border border-gray-100',
      showProgress: true,
    }
  ];

  return (
    <div className="flex flex-col gap-4">
      {applications.map((app) => (
        <div key={app.id} className="relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between gap-6 transition-all hover:shadow-md cursor-pointer pt-6">

          {/* Status Badge Top Right */}
          <div className="absolute top-6 right-6">
            <span className={`px-2.5 py-1 rounded-full text-[11px]  ${app.statusColor}`}>
              {app.status}
            </span>
          </div>

          {/* Left section: Icon + Info */}
          <div className="flex items-start gap-4">
            <div className="size-10 bg-[#FF6934] rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-orange-200/50">
              <Building2 className="text-white size-5 opacity-90" />
            </div>

            <div className="flex flex-col">
              <h3 className="text-[18px] font-semibold text-gray-900 leading-tight pr-24">{app.title}</h3>
              <p className="text-[14px] text-gray-500 font-regular mt-1">{app.company}</p>

              <div className="flex flex-wrap items-center gap-4 mt-2  text-[12px] text-[#475467] font-regular">
                <div className="flex items-center gap-1.5"><MapPin size={13} /> {app.location}</div>
                <div className="flex items-center gap-1.5"><Calendar size={13} /> {app.appliedAt}</div>
              </div>

              {/* Progress Tracker rendered conditionaly */}
              {app.showProgress && <ApplicationProgress currentStage={app.stage} />}
            </div>
          </div>

          {/* Right section Button */}
          <div className="flex items-center sm:items-end justify-center sm:justify-end mt-4 sm:mt-0 z-10 w-full sm:w-auto">
            <button
              onClick={() => setSelectedApp(app)}
              className="w-full sm:w-auto flex items-center justify-center gap-1 border border#FF6934] text-[#FF6934] bg-[#FDF7E9] px-4 py-2.5 sm:py-2 rounded-[10px] text-[14px] font-regular hover:bg-orange-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              View details <ChevronRight size={14} />
            </button>
          </div>

        </div>
      ))}

      <ApplicationDetailModal
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        app={selectedApp}
      />
    </div>
  );
}
