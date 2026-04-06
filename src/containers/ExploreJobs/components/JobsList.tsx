import {
  MapPin, DollarSign, Clock, Target, CheckCircle,
  Bookmark, ChevronDown, ChevronUp
} from 'lucide-react';
import { useState } from 'react';

const jobs = [
  {
    id: 1,
    initials: 'G',
    title: 'Senior Product Designer',
    company: 'Google',
    location: 'Remote',
    salary: '£110k – £160k',
    type: 'Full-time',
    match: 92,
    verified: true,
    posted: '2 days ago',
    tags: ['Product Design', 'Figma', 'User Research', 'Design Systems'],
    reason: "Your 5+ years in product design and Figma expertise align perfectly with Google's design team requirements.",
  },
  {
    id: 2,
    initials: 'S',
    title: 'UX Lead',
    company: 'Stripe',
    location: 'San Francisco, CA',
    salary: '£120k – £170k',
    type: 'Full-time',
    match: 89,
    verified: true,
    posted: '3 days ago',
    tags: ['UX Design', 'Prototyping', 'A/B Testing', 'Sketch'],
    reason: "Your background in fintech UX and data-driven design decisions syncs well with Stripe's culture.",
  },
  {
    id: 3,
    initials: 'N',
    title: 'Product Designer — Growth',
    company: 'Notion',
    location: 'Remote',
    salary: '£90k – £130k',
    type: 'Full-time',
    match: 85,
    verified: true,
    posted: '1 week ago',
    tags: ['Growth Design', 'Figma', 'Collaboration Tools'],
    reason: "Your experience with SaaS products and collaborative workflows matches Notion's growth team needs.",
  },
  {
    id: 4,
    initials: 'L',
    title: 'Design Systems Lead',
    company: 'Linear',
    location: 'Remote',
    salary: '£100k – £145k',
    type: 'Full-time',
    match: 81,
    verified: false,
    posted: '4 days ago',
    tags: ['Design Systems', 'Tokens', 'Storybook', 'React'],
    reason: "Your component library work and design-token expertise make you a strong candidate for Linear's systems team.",
  },
];

export default function JobsList() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="font-manrope">
      <div className="flex items-center justify-between mb-6 px-1">
        <p className="text-sm text-[#475467] font-medium">
          Showing <span className="font-bold text-[#101828]">248 jobs</span> for <span className="text-[#FF6934] font-bold">Product Designer</span>
        </p>
        <div className="relative">
          <select className="text-sm font-semibold text-[#344054] bg-white border border-gray-200 rounded-[10px] px-3 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 appearance-none pr-8 cursor-pointer transition-all">
            <option>Best Match</option>
            <option>Most Recent</option>
            <option>Highest Salary</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] pointer-events-none" />
        </div>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md group">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="size-12 bg-[#F9FAFB] border border-gray-100 rounded-[10px] flex items-center justify-center font-bold text-xl text-[#101828] shadow-sm transform transition-transform group-hover:scale-105">
                    {job.initials}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#101828]">{job.title}</h3>
                    <p className="text-sm text-[#667085] font-medium">{job.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-[#FFF1EC] border border-[#FF693420] px-3 py-1.5 rounded-full text-[#FF6934] text-[12px] font-bold shadow-sm">
                  <Target size={14} /> {job.match}% Match
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 text-sm text-[#667085]">
                <div className="flex items-center gap-1.5"><MapPin size={16} />{job.location}</div>
                <div className="flex items-center gap-1.5"><DollarSign size={16} />{job.salary}</div>
                <div className="flex items-center gap-1.5"><Clock size={16} />{job.type}</div>
              </div>

              {job.verified && (
                <div className="flex items-center gap-1.5 mt-3 text-sm font-medium text-[#12B76A]">
                  <CheckCircle size={16} className="text-[#12B76A]" /> Verified company
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                {job.tags.map((tag) => (
                  <span key={tag} className="bg-[#F9FAFB] border border-gray-100 text-[#344054] text-xs font-semibold px-3 py-1.5 rounded-[10px] shadow-sm transition-colors hover:bg-white hover:border-gray-200">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
                <span className="text-xs text-[#98A2B3] font-medium italic">Posted {job.posted}</span>
                <div className="flex items-center gap-3">
                  <button className="text-[#98A2B3] hover:text-[#FF6934] transition-colors p-2 cursor-pointer">
                    <Bookmark size={20} />
                  </button>
                  <button className="border border-gray-200 bg-white px-5 py-2.5 rounded-[10px] text-sm font-bold text-[#344054] hover:bg-gray-50 transition-all cursor-pointer shadow-sm">
                    View Job
                  </button>
                  <button className="bg-[#FF6934] text-white px-5 py-2.5 rounded-[10px] text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-sm">
                    Quick Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Why this matches */}
            <div
              className={`px-6 py-4 flex items-center justify-between cursor-pointer transition-all ${
                expanded === job.id ? 'bg-[#FFF1EC]' : 'bg-[#FCFCFD] hover:bg-[#F9FAFB]'
              } border-t border-gray-100`}
              onClick={() => setExpanded(expanded === job.id ? null : job.id)}
            >
              <div className="flex items-center gap-3">
                <div className="bg-[#FF6934] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {job.match}% MATCH
                </div>
                <span className="text-sm font-semibold text-[#344054]">Why this matches you</span>
              </div>
              {expanded === job.id
                ? <ChevronUp size={18} className="text-[#FF6934]" />
                : <ChevronDown size={18} className="text-[#98A2B3]" />
              }
            </div>
            {expanded === job.id && (
              <div className="bg-[#FFF1EC] px-6 pb-5 animate-in slide-in-from-top-2 duration-300">
                <div className="bg-white/80 rounded-[10px] p-5 text-sm text-[#475467] leading-relaxed border border-[#FF693410] shadow-sm">
                  {job.reason}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
