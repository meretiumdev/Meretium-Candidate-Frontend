import { useEffect, useState } from 'react';
import { Sparkles, CheckCircle, AlertTriangle, TrendingUp, Eye, Search, Target, Award, Calendar } from 'lucide-react';
import MatchImprovementModal from '../../../components/MatchImprovementModal';
import type { CandidateProfileInsightRoleMatch } from '../../../services/profileApi';

interface RoleMatch {
  role: string;
  match: number;
}

interface SidebarStatsProps {
  aiSummary?: string;
  strengths?: string[];
  areasToImprove?: string[];
  topRoleMatches?: CandidateProfileInsightRoleMatch[];
}

const AI_SUMMARY_PREVIEW_LIMIT = 260;

export default function SidebarStats({
  aiSummary = '',
  strengths = [],
  areasToImprove = [],
  topRoleMatches = [],
}: SidebarStatsProps) {
  const [selectedRole, setSelectedRole] = useState<RoleMatch | null>(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const roleMatches: RoleMatch[] = topRoleMatches
    .map((item) => ({
      role: item.title.replace(/\s*-\s*$/, '').trim(),
      match: Math.max(0, Math.min(100, Math.round(item.match_percentage))),
    }))
    .filter((item) => item.role.length > 0);

  const summaryText = aiSummary.trim() || 'AI summary is not available right now.';
  const isSummaryLong = summaryText.length > AI_SUMMARY_PREVIEW_LIMIT;
  const visibleSummaryText = isSummaryExpanded || !isSummaryLong
    ? summaryText
    : `${summaryText.slice(0, AI_SUMMARY_PREVIEW_LIMIT).trimEnd()}...`;
  const strengthsItems = strengths
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  const areasToImproveItems = areasToImprove
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  useEffect(() => {
    setIsSummaryExpanded(false);
  }, [summaryText]);

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
            {visibleSummaryText}
          </p>
          {isSummaryLong && (
            <button
              type="button"
              onClick={() => setIsSummaryExpanded((prev) => !prev)}
              className="mt-3 text-[13px] font-semibold text-[#FF6934] hover:opacity-90 transition-opacity cursor-pointer"
            >
              {isSummaryExpanded ? 'View less' : 'View more'}
            </button>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <CheckCircle size={22} className="text-[#039855]" />
            <h3 className="text-[16px] md:text-[18px] font-semibold text-[#101828]">
              Strengths
            </h3>
          </div>
          {strengthsItems.length > 0 ? (
            <ul className="space-y-4">
              {strengthsItems.map((strength, index) => (
                <li
                  key={`${strength}-${index}`}
                  className="flex items-start gap-3 text-[14px] md:text-[15px] text-[#475467] leading-relaxed"
                >
                  <CheckCircle size={18} className="text-[#039855] shrink-0 mt-0.5" />
                  {strength}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] md:text-[15px] text-[#475467]">
              Strength insights are not available right now.
            </p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <AlertTriangle size={22} className="text-[#FF6934]" />
            <h3 className="text-[16px] md:text-[18px] font-semibold text-[#101828]">
              Areas to improve
            </h3>
          </div>
          {areasToImproveItems.length > 0 ? (
            <ul className="space-y-4">
              {areasToImproveItems.map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="flex items-start gap-3 text-[14px] md:text-[15px] text-[#475467] leading-relaxed"
                >
                  <AlertTriangle size={18} className="text-[#FF6934] shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] md:text-[15px] text-[#475467]">
              Improvement insights are not available right now.
            </p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp size={22} className="text-[#FF6934]" />
            <h3 className="text-[16px] md:text-[18px] font-semibold text-[#101828]">
              Top Role Matches
            </h3>
          </div>
          {roleMatches.length > 0 ? (
            <>
              <div className="space-y-4">
                {roleMatches.map((r) => (
                  <div
                    key={`${r.role}-${r.match}`}
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
            </>
          ) : (
            <p className="text-[14px] md:text-[15px] text-[#475467]">
              Role match insights are not available right now.
            </p>
          )}
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
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
           <h3 className="text-[20px] font-bold text-[#101828] font-heading mb-6">
             Performance Insights
           </h3>

           {/* Stats Grid */}
           <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { label: 'Application response', value: '68%', change: '+12%', icon: Target, bgColor: 'bg-orange-50', iconColor: 'text-[#FF6934]' },
                { label: 'Interview conversion', value: '45%', change: '+8%', icon: Award, bgColor: 'bg-orange-50', iconColor: 'text-[#FF6934]' },
                { label: 'Avg. time to hear back', value: '3.2 days', change: '+15%', icon: Calendar, bgColor: 'bg-orange-50', iconColor: 'text-[#FF6934]' },
                { label: 'Profile views (30 days)', value: '127', change: '+34%', icon: Eye, bgColor: 'bg-orange-50', iconColor: 'text-[#FF6934]' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-[#F9FAFB] rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`size-10 ${stat.bgColor} rounded-xl flex items-center justify-center ${stat.iconColor}`}>
                      <stat.icon size={20} />
                    </div>
                    <div className="flex items-center gap-1 text-[#039855] text-[12px] font-bold">
                       <TrendingUp size={14} /> {stat.change}
                    </div>
                  </div>
                  <div className="text-[22px] font-bold text-[#101828] mb-1">{stat.value}</div>
                  <div className="text-[12px] font-medium text-[#475467] leading-tight">{stat.label}</div>
                </div>
              ))}
           </div>

           {/* You Vs Similar Candidates */}
           <div className="border-t border-gray-100 pt-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                 <span className="text-[14px] font-semibold text-[#667085]">You Vs. Similar Candidates</span>
                 <span className="text-[14px] font-bold text-[#039855]">Top 15%</span>
              </div>
              <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-visible">
                 <div className="absolute left-0 top-0 h-full bg-[#FF6934] rounded-full w-[85%]"></div>
                 <div className="absolute left-[85%] top-1/2 -translate-y-1/2 size-4 bg-white border-[3px] border-[#FF6934] rounded-full shadow-sm ring-4 ring-orange-50"></div>
              </div>
           </div>

           {/* Momentum Tips */}
           <div className="bg-[#FFF4F0] border border-[#FFE4D9] rounded-xl p-5">
              <div className="flex gap-4">
                 <div className="size-10 bg-[#FF6934] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                    <TrendingUp size={20} />
                 </div>
                 <div>
                    <h4 className="text-[15px] font-bold text-[#101828] mb-2 leading-tight">Keep the momentum going!</h4>
                    <p className="text-[13px] text-[#475467] leading-relaxed font-body">
                       Your response rate is <span className="">23% higher</span> than last month. Adding 2-3 more skills could increase your match score by 15%.
                    </p>
                 </div>
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
