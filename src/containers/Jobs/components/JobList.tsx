import { MapPin, DollarSign, Clock, CheckCircle, Bookmark, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import QuickApplyModal from '../../../components/QuickApplyModal';

export default function JobList() {
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [savedJobsMap, setSavedJobsMap] = useState<Record<number, boolean>>({});

  const toggleSave = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSavedJobsMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const jobs = [
    {
      id: 1,
      initial: 'S',
      title: 'Senior Product Designer',
      company: 'Stripe',
      location: 'Remote (UK)',
      salary: '£80k - £120k',
      type: 'Full-time',
      verified: true,
      tags: ['TypeScript', 'React', 'Node.js', 'Figma', 'Design Systems'],
      match: 92,
      matchColor: 'green',
      description: "We're looking for a Senior Product Designer to join our team and help shape the future of online payments. You'll work closely with engineers and product managers to design beautiful, intuitive experiences.",
      posted: 'Posted 2 days ago'
    },
    {
      id: 2,
      initial: 'F',
      title: 'Lead UX Designer',
      company: 'Figma',
      location: 'Remote',
      salary: '£95k - £140k',
      type: 'Full-time',
      verified: true,
      tags: ['UI/UX', 'Prototyping', 'User Research', 'Figma'],
      match: 88,
      matchColor: 'orange',
      description: "Join our design team to create the next generation of collaborative design tools. You'll lead design initiatives and mentor junior designers.",
      posted: 'Posted 1 week ago'
    },
    {
      id: 3,
      initial: 'A',
      title: 'Product Design Manager',
      company: 'Airbnb',
      location: 'London, UK',
      salary: '£100k - £150k',
      type: 'Full-time',
      verified: true,
      tags: ['Leadership', 'Product Design', 'Figma', 'Sketch'],
      match: 85,
      matchColor: 'orange',
      description: "Lead a team of talented designers to create delightful experiences for millions of travelers worldwide. Experience managing design teams required.",
      posted: 'Posted 3 days ago'
    },
    {
      id: 4,
      initial: 'G',
      title: 'Senior UI/UX Designer',
      company: 'Google',
      location: 'Remote (UK)',
      salary: '£85k - £130k',
      type: 'Full-time',
      verified: true,
      tags: ['Material Design', 'React', 'Accessibility', 'Prototyping'],
      match: 90,
      matchColor: 'green',
      description: "Help us design the future of Google products. Work on large-scale projects impacting billions of users worldwide.",
      posted: 'Posted 5 days ago'
    },
    {
      id: 5,
      initial: 'S',
      title: 'Principal Designer',
      company: 'Shopify',
      location: 'Remote',
      salary: '£110k - £160k',
      type: 'Full-time',
      verified: true,
      tags: ['E-commerce', 'Product Design', 'Leadership', 'Figma'],
      match: 83,
      matchColor: 'orange',
      description: "Drive design strategy for our merchant platform. Shape the direction of commerce for millions of businesses globally.",
      posted: 'Posted 1 week ago'
    },
    {
      id: 6,
      initial: 'N',
      title: 'Design Lead',
      company: 'Netflix',
      location: 'London, UK',
      salary: '£105k - £155k',
      type: 'Full-time',
      verified: true,
      tags: ['Product Design', 'Video UI', 'Motion Design', 'Figma'],
      match: 83,
      matchColor: 'orange',
      description: "Lead design for our streaming platform. Create innovative experiences for our global entertainment service.",
      posted: 'Posted 4 days ago'
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[24px] font-semibold text-gray-900">6 jobs found</h2>
        <div className="flex items-center gap-2">
          <select className="border border-[#E4E7EC] rounded-[10px] px-3 py-1.5 text-sm font-medium text-gray-600 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 appearance-none">
            <option>Most relevant</option>
            <option>Most recent</option>
            <option>Highest salary</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            onClick={() => navigate('/job-detail')}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="size-10 bg-[#F2F4F7] border border-gray-200 rounded-[10px] flex items-center justify-center font-semibold text-[14px] text-gray-700 shrink-0">
                  {job.initial}
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{job.company}</p>
                </div>
              </div>
              <button 
                onClick={(e) => toggleSave(e, job.id)}
                className={`transition-colors cursor-pointer ${savedJobsMap[job.id] ? 'text-[#FF6934]' : 'text-[#475467] hover:text-gray-600'}`}
              >
                <Bookmark size={20} className={savedJobsMap[job.id] ? 'fill-[#FF6934]' : ''} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-5 text-sm text-gray-500 font-medium">
              <div className="flex items-center gap-1.5"><MapPin size={16} className="text-[#475467]" /> {job.location}</div>
              <div className="flex items-center gap-1.5"><DollarSign size={16} className="text-[#475467]" /> {job.salary}</div>
              <div className="flex items-center gap-1.5"><Clock size={16} className="text-[#475467]" /> {job.type}</div>
            </div>

            {job.verified && (
              <div className="flex items-center gap-1.5 mt-3 text-[14px] font-medium text-[#12B76A]">
                <CheckCircle size={15} /> Verified company
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {job.tags.map((tag) => (
                <span key={tag} className="bg-[#F2F4F7] border border-gray-200 text-[#475467] text-sm font-regular px-2.5 py-1.5 rounded-[10px]">
                  {tag}
                </span>
              ))}
            </div>

            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-sm font-semibold mt-4 w-fit ${job.matchColor === 'green' ? 'bg-[#12B76A15] text-[#12B76A]' : 'bg-orange-50 text-[#FF6934]'}`}>
              <Target size={14} /> {job.match}% Match
            </div>

            <p className="text-[14px] text-[#475467] mt-4 leading-relaxed font-regular">
              {job.description}
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mt-6 pt-3 border-t border-gray-200">
              <span className="text-[12px] text-gray-400 font-[400] whitespace-nowrap">{job.posted}</span>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button className="flex-1 sm:flex-none justify-center border border-gray-200 bg-white px-4 py-2 rounded-[10px] text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                  View Job
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedJob(job);
                  }}
                  className="flex-1 sm:flex-none justify-center bg-[#FF6934] text-white px-4 py-2 rounded-[10px] text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Quick Apply
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <QuickApplyModal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        job={selectedJob}
      />
    </div>
  );
}
