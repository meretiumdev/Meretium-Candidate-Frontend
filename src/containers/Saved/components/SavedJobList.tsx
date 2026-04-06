import { Building2, MapPin, DollarSign, Calendar, Star } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuickApplyModal from '../../../components/QuickApplyModal';
import RemoveSavedModal from '../../../components/RemoveSavedModal';

export default function SavedJobList() {
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const savedJobs = [
    {
      id: 1,
      title: 'Senior Product Designer',
      company: 'Notion',
      location: 'London (Remote)',
      salary: '£80k - £120k',
      timeAgo: '2 days ago',
      isClosed: false,
    },
    {
      id: 2,
      title: 'Lead UX Designer',
      company: 'Stripe',
      location: 'San Francisco (Remote)',
      salary: '£90k - £140k',
      timeAgo: '1 week ago',
      isClosed: false,
    },
    {
      id: 3,
      title: 'Product Design Manager',
      company: 'Figma',
      location: 'Remote',
      salary: '£100k - £150k',
      timeAgo: '3 days ago',
      isApplied: true,
      appliedDate: '12 Feb',
      isClosed: false,
    }
  ];

  const closedJob = {
    id: 4,
    title: 'Design Systems Lead',
    company: 'Google',
    location: 'Remote (UK)',
    salary: '£95k - £145k',
    timeAgo: '2 weeks ago',
    isClosed: true,
  };

  return (
    <div className="flex flex-col gap-6 font-manrope transition-all duration-300">
      {/* Active & Applied Section */}
      <div className="flex flex-col gap-4">
        {savedJobs.map((job) => (
          <div key={job.id} className="relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between gap-6 transition-all hover:shadow-md cursor-pointer pt-6 group">
            {/* Top Right Star */}
            <div className="absolute top-6 right-6">
              <Star size={20} className="text-[#FF6934] fill-[#FF6934]" />
            </div>

            {/* Left Box: Logo + Info */}
            <div className="flex items-start gap-4">
              <div className="size-12 bg-[#FFF1EC] rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-[#FF693415] transition-transform group-hover:scale-105">
                <Building2 className="text-[#FF6934] size-6" />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <h3 className="text-[18px] font-semibold text-gray-900 leading-tight pr-24">{job.title}</h3>
                  {job.isApplied && <span className="bg-blue-50 text-blue-600 text-[11px] font-bold px-2 py-0.5 rounded-full">Applied</span>}
                </div>
                <p className="text-[14px] text-gray-500 font-regular mt-1">{job.company}</p>

                <div className="flex flex-wrap items-center gap-4 mt-2  text-[12px] text-[#475467] font-regular">
                  <div className="flex items-center gap-1.5"><MapPin size={13} className="text-[#475467]" /> {job.location}</div>
                  <div className="flex items-center gap-1.5"><DollarSign size={13} className="text-[#475467]" /> {job.salary}</div>
                  <div className="flex items-center gap-1.5"><Calendar size={13} className="text-[#475467]" /> {job.timeAgo}</div>
                </div>

                {job.isApplied && (
                  <p className="text-[12px] text-[#475467]  font-body mt-2">You applied on {job.appliedDate}</p>
                )}

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4">
                  <button 
                    onClick={() => navigate('/job-detail')}
                    className="flex-1 sm:flex-none px-4 py-2 text-[14px] font-bold text-[#344054] border border-gray-200 rounded-[10px] hover:bg-gray-50 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                  >
                    View job
                  </button>
                  {job.isApplied ? (
                    <button 
                      onClick={() => navigate('/applications')}
                      className="flex-1 sm:flex-none px-4 py-2 text-[14px] font-bold text-white bg-[#FF6934] rounded-[10px] hover:opacity-90 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                    >
                      View application
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJob(job);
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 text-[14px] font-bold text-white bg-[#FF6934] rounded-[10px] hover:opacity-90 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                    >
                      Quick apply
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRemoveModal(true);
                    }}
                    className="w-full sm:w-auto px-4 py-1.5 text-[14px] font-medium text-gray-500 border border-[#E4E7EC] rounded-[10px] hover:bg-gray-50 transition-colors font-body cursor-pointer whitespace-nowrap"
                  >
                    Remove saved
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Closed Section */}
      <div className="flex flex-col rounded-xl overflow-hidden border border-gray-200 shadow-sm transition-all duration-300">
        <div className="bg-[#475467] text-white px-6 py-3 font-bold text-[16px]">
          Closed Positions
        </div>
        <div className="relative bg-[#F9FAFB] p-6 flex flex-col sm:flex-row justify-between gap-6 pt-6 opacity-75 grayscale-[0.3]">
          {/* Top Right Star */}
          <div className="absolute top-6 right-6">
            <Star size={20} className="text-[#98A2B3] fill-[#98A2B3]" />
          </div>

          <div className="flex items-start gap-4">
            <div className="size-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 border border-gray-200">
              <Building2 className="text-gray-400 size-6" />
            </div>

            <div className="flex flex-col">
              <h3 className="text-[18px] font-semibold text-gray-900 leading-tight pr-24">{closedJob.title}</h3>
              <p className="text-[13px] text-gray-500 font-regular mt-1">{closedJob.company}</p>

              <div className="flex flex-wrap items-center gap-4 mt-3 mb-4 text-[12px] text-[#475467] font-regular">
                <div className="flex items-center gap-1.5"><MapPin size={13} className="text-gray-300" /> {closedJob.location}</div>
                <div className="flex items-center gap-1.5"><DollarSign size={13} className="text-gray-300" /> {closedJob.salary}</div>
                <div className="flex items-center gap-1.5"><Calendar size={13} className="text-gray-300" /> {closedJob.timeAgo}</div>
              </div>

              <p className="text-[12px] text-gray-400 font-medium font-body mb-4 italic">This job is no longer accepting applications.</p>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button 
                  onClick={() => navigate('/job-detail')}
                  className="flex-1 sm:flex-none px-4 py-1.5 text-[14px] font-medium text-[#101828] border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-body bg-white cursor-pointer whitespace-nowrap"
                >
                  View job
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRemoveModal(true);
                  }}
                  className="flex-1 sm:flex-none px-4 py-1.5 text-[14px] font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-body bg-white cursor-pointer whitespace-nowrap"
                >
                  Remove saved
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <QuickApplyModal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        job={selectedJob}
      />

      <RemoveSavedModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={() => setShowRemoveModal(false)}
      />
    </div>
  );
}
