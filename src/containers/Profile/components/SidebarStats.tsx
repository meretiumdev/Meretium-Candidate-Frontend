import { useState } from 'react';
import { Sparkles, CheckCircle, AlertTriangle, TrendingUp, Eye, Search } from 'lucide-react';
import MatchImprovementModal from '../../../components/MatchImprovementModal';

interface RoleMatch {
  role: string;
  match: number;
}

export default function SidebarStats() {
  const [selectedRole, setSelectedRole] = useState<RoleMatch | null>(null);

  const roleMatches: RoleMatch[] = [
    { role: 'Senior Frontend Engineer', match: 78 },
    { role: 'Product Engineer', match: 87 },
    { role: 'Design Systems Lead', match: 84 },
  ];

  return (
    <>
      <div className="space-y-6 font-manrope transition-all duration-300">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6 sm:mt-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 bg-[#FFF4EC] rounded-full flex items-center justify-center text-[#FF6934] shrink-0">
              <Sparkles size={18} />
            </div>
            <h3 className="text-[16px] md:text-[18px] font-semibold text-[#101828]">
              AI Summary
            </h3>
          </div>
          <p className="text-[14px] md:text-[15px] text-[#475467] leading-relaxed">
            Strong product design background with proven leadership in design systems. Technical skills in React and TypeScript make this candidate valuable for design-engineering collaboration.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <CheckCircle size={22} className="text-[#039855]" />
            <h3 className="text-[16px] md:text-[18px] font-semibold text-[#101828]">
              Strengths
            </h3>
          </div>
          <ul className="space-y-4">
            {[
              'Scalable React architecture experience',
              'System design and component library expertise',
              'Proven mentorship and team leadership',
              'Data-driven design approach'
            ].map((s) => (
              <li key={s} className="flex items-start gap-3 text-[14px] md:text-[15px] text-[#475467] leading-relaxed">
                <CheckCircle size={18} className="text-[#039855] shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <AlertTriangle size={22} className="text-[#FF6934]" />
            <h3 className="text-[16px] md:text-[18px] font-semibold text-[#101828]">
              Areas to improve
            </h3>
          </div>
          <ul className="space-y-4">
            {[
              'Limited recent leadership roles',
              'No unit testing framework experience mentioned'
            ].map((s) => (
              <li key={s} className="flex items-start gap-3 text-[14px] md:text-[15px] text-[#475467] leading-relaxed">
                <AlertTriangle size={18} className="text-[#FF6934] shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp size={22} className="text-[#FF6934]" />
            <h3 className="text-[16px] md:text-[18px] font-semibold text-[#101828]">
              Top Role Matches
            </h3>
          </div>
          <div className="space-y-4">
            {roleMatches.map((r) => (
              <div
                key={r.role}
                onClick={() => setSelectedRole(r)}
                className="bg-[#FAFAFA]/80 border border-gray-200 rounded-xl p-4 flex flex-col gap-3 cursor-pointer hover:border-[#FF6934] hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[14px] md:text-[15px] font-medium text-[#101828]">{r.role}</span>
                  <span className="text-[14px] md:text-[15px] font-medium text-[#FF6934]">{r.match}%</span>
                </div>
                <div className="h-[6px] w-full bg-[#E4E7EC] rounded-full overflow-hidden">
                  <div className="h-full bg-[#EA580C] rounded-full transition-all" style={{ width: `${r.match}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setSelectedRole(roleMatches[0])}
            className="w-fit mt-6 px-6 py-2.5 bg-[#FF6934] text-white rounded-[10px] text-[14px] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm cursor-pointer"
          >
            <Sparkles size={18} /> Improve my match
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-[16px] md:text-[18px] font-semibold text-[#101828] mb-6">
            Profile performance
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-11 bg-[#FFF4EC] rounded-full flex items-center justify-center text-[#FF6934] shrink-0">
                  <Eye size={20} />
                </div>
                <div>
                  <p className="text-[14px] md:text-[15px] font-medium text-[#475467]">Profile views</p>
                  <p className="text-[13px] text-[#98A2B3] mt-0.5">by recruiters</p>
                </div>
              </div>
              <span className="text-[24px] md:text-[28px] font-medium text-[#FF6934]">12</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-11 bg-[#FFF4EC] rounded-full flex items-center justify-center text-[#FF6934] shrink-0">
                  <Search size={20} />
                </div>
                <div>
                  <p className="text-[14px] md:text-[15px] font-medium text-[#475467]">Search appearances</p>
                  <p className="text-[13px] text-[#98A2B3] mt-0.5">in the last 30 days</p>
                </div>
              </div>
              <span className="text-[24px] md:text-[28px] font-medium text-[#FF6934]">48</span>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-200 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#039855]" />
            <p className="text-[14px] md:text-[15px] text-[#475467]">
              Last viewed <span className="font-medium text-[#101828]">2 days ago</span>
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp size={22} className="text-[#039855]" />
            <h3 className="text-[16px] md:text-[18px] font-semibold text-[#101828]">
              Match improvement
            </h3>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-[14px] md:text-[15px] text-[#475467]">Before profile update</p>
                <p className="text-[14px] md:text-[15px] font-semibold text-[#475467]">68%</p>
              </div>
              <div className="h-[6px] w-full bg-[#E4E7EC] rounded-full overflow-hidden">
                <div className="h-full bg-[#FF6934] rounded-full w-[68%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-[14px] md:text-[15px] text-[#FF6934]">After update</p>
                <p className="text-[14px] md:text-[15px] font-semibold text-[#FF6934]">82%</p>
              </div>
              <div className="h-[6px] w-full bg-[#FAFAFA] rounded-full overflow-hidden">
                <div className="h-full bg-[#EA580C] rounded-full w-[82%]" />
              </div>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-gray-200">
            <div className="flex w-fit items-center gap-2 px-4 py-2 bg-[#D1FADF]/50 text-[#039855] rounded-full">
              <TrendingUp size={18} />
              <span className="text-[14px] md:text-[15px] font-medium">+14% improvement</span>
            </div>
          </div>
        </div>
      </div>

      <MatchImprovementModal
        isOpen={!!selectedRole}
        onClose={() => setSelectedRole(null)}
        role={selectedRole?.role ?? ''}
        currentMatch={selectedRole?.match ?? 0}
      />
    </>
  );
}
