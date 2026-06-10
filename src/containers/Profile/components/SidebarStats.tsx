import { useEffect, useState } from 'react';
import { Sparkles, CheckCircle, AlertTriangle, TrendingUp, Eye, Search, Target, Award, Calendar, type LucideIcon } from 'lucide-react';
import MatchImprovementModal from '../../../components/MatchImprovementModal';
import type {
  CandidateProfileInsightRoleMatch,
  CandidateProfilePerformance,
  CandidateProfilePerformanceInsights,
} from '../../../services/profileApi';

interface RoleMatch {
  role: string;
  match: number;
}

interface SidebarStatsProps {
  aiSummary?: string;
  strengths?: string[];
  areasToImprove?: string[];
  topRoleMatches?: CandidateProfileInsightRoleMatch[];
  profilePerformance?: CandidateProfilePerformance | null;
  performanceInsights?: CandidateProfilePerformanceInsights | null;
  onProfileUpdated?: () => Promise<void> | void;
}

const AI_SUMMARY_PREVIEW_LIMIT = 260;
const EMPTY_PROFILE_PERFORMANCE: CandidateProfilePerformance = {
  profile_views: 0,
  search_appearances_30d: 0,
  last_viewed_at: null,
};
const EMPTY_PERFORMANCE_INSIGHTS: CandidateProfilePerformanceInsights = {
  application_response_pct: null,
  application_response_change_points: null,
  application_response_trend: null,
  interview_conversion_pct: null,
  interview_conversion_change_points: null,
  interview_conversion_trend: null,
  avg_days_to_hear_back: null,
  avg_days_to_hear_back_change_pct: null,
  avg_days_to_hear_back_trend: null,
  profile_views_30d: null,
  profile_views_30d_change_pct: null,
  profile_views_30d_trend: null,
};

type TrendDirection = 'up' | 'down' | 'neutral';

interface PerformanceInsightStat {
  label: string;
  value: string;
  change: string | null;
  trend: TrendDirection;
  positiveWhen: Exclude<TrendDirection, 'neutral'>;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
}

function normalizeTrend(trend: string | null | undefined): TrendDirection {
  if (trend === 'up' || trend === 'down') return trend;
  return 'neutral';
}

function formatIntegerValue(value: number | null | undefined): string {
  const normalized = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(normalized)));
}

function formatPercentageValue(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A';
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)}%`;
}

function formatDaysValue(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A';
  const formattedValue = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
  return `${formattedValue} ${Math.abs(value) === 1 ? 'day' : 'days'}`;
}

function formatChangeValue(
  value: number | null | undefined,
  trend: string | null | undefined,
  suffix: '%' | 'pts'
): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;

  const normalizedTrend = normalizeTrend(trend);
  const sign = normalizedTrend === 'down'
    ? '-'
    : normalizedTrend === 'up'
      ? '+'
      : value < 0
        ? '-'
        : value > 0
          ? '+'
          : '';
  const formattedValue = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(Math.abs(value));
  return suffix === 'pts' ? `${sign}${formattedValue} pts` : `${sign}${formattedValue}%`;
}

function getTrendToneClass(trend: TrendDirection, positiveWhen: Exclude<TrendDirection, 'neutral'>): string {
  if (trend === 'neutral') return 'text-[#667085]';
  return trend === positiveWhen ? 'text-[#039855]' : 'text-[#B42318]';
}

function getTrendIconClass(trend: TrendDirection): string {
  if (trend === 'down') return 'rotate-180';
  if (trend === 'neutral') return 'rotate-90';
  return '';
}

function formatRelativeTime(value: string | null | undefined): string | null {
  if (!value) return null;

  const parsedTime = Date.parse(value);
  if (!Number.isFinite(parsedTime)) return null;

  const diffMs = Date.now() - parsedTime;
  if (diffMs <= 0) return 'just now';

  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 5) return `${diffWeeks} weeks ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month ago';
  if (diffMonths < 12) return `${diffMonths} months ago`;

  const diffYears = Math.floor(diffDays / 365);
  return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
}

export default function SidebarStats({
  aiSummary = '',
  strengths = [],
  areasToImprove = [],
  topRoleMatches = [],
  profilePerformance = EMPTY_PROFILE_PERFORMANCE,
  performanceInsights = EMPTY_PERFORMANCE_INSIGHTS,
  onProfileUpdated,
}: SidebarStatsProps) {
  const [selectedRole, setSelectedRole] = useState<RoleMatch | null>(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const roleMatches: RoleMatch[] = topRoleMatches
    .map((item) => ({
      role: item.title.replace(/\s*-\s*$/, '').trim(),
      match: Math.max(0, Math.min(100, Math.round(item.match_percentage))),
    }))
    .filter((item) => item.role.length > 0);

  const summaryText = aiSummary.trim() || 'Update your profile to generate an AI summary.';
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
  const profilePerformanceData = profilePerformance ?? EMPTY_PROFILE_PERFORMANCE;
  const performanceInsightsData = performanceInsights ?? EMPTY_PERFORMANCE_INSIGHTS;
  const lastViewedLabel = formatRelativeTime(profilePerformanceData.last_viewed_at);
  const performanceInsightStats: PerformanceInsightStat[] = [
    {
      label: 'Application response',
      value: formatPercentageValue(performanceInsightsData.application_response_pct),
      change: formatChangeValue(
        performanceInsightsData.application_response_change_points,
        performanceInsightsData.application_response_trend,
        'pts'
      ),
      trend: normalizeTrend(performanceInsightsData.application_response_trend),
      positiveWhen: 'up',
      icon: Target,
      bgColor: 'bg-orange-50',
      iconColor: 'text-[#FF6934]',
    },
    {
      label: 'Interview conversion',
      value: formatPercentageValue(performanceInsightsData.interview_conversion_pct),
      change: formatChangeValue(
        performanceInsightsData.interview_conversion_change_points,
        performanceInsightsData.interview_conversion_trend,
        'pts'
      ),
      trend: normalizeTrend(performanceInsightsData.interview_conversion_trend),
      positiveWhen: 'up',
      icon: Award,
      bgColor: 'bg-orange-50',
      iconColor: 'text-[#FF6934]',
    },
    {
      label: 'Avg. time to hear back',
      value: formatDaysValue(performanceInsightsData.avg_days_to_hear_back),
      change: formatChangeValue(
        performanceInsightsData.avg_days_to_hear_back_change_pct,
        performanceInsightsData.avg_days_to_hear_back_trend,
        '%'
      ),
      trend: normalizeTrend(performanceInsightsData.avg_days_to_hear_back_trend),
      positiveWhen: 'down',
      icon: Calendar,
      bgColor: 'bg-orange-50',
      iconColor: 'text-[#FF6934]',
    },
    {
      label: 'Profile views (30 days)',
      value: typeof performanceInsightsData.profile_views_30d === 'number'
        ? formatIntegerValue(performanceInsightsData.profile_views_30d)
        : 'N/A',
      change: formatChangeValue(
        performanceInsightsData.profile_views_30d_change_pct,
        performanceInsightsData.profile_views_30d_trend,
        '%'
      ),
      trend: normalizeTrend(performanceInsightsData.profile_views_30d_trend),
      positiveWhen: 'up',
      icon: Eye,
      bgColor: 'bg-orange-50',
      iconColor: 'text-[#FF6934]',
    },
  ];

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
              Update your profile to generate strength insights.
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
              Update your profile to generate areas to improve.
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
              Update your profile to generate top role matches.
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
              <span className="text-[24px] md:text-[28px] font-medium text-[#FF6934]">
                {formatIntegerValue(profilePerformanceData.profile_views)}
              </span>
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
              <span className="text-[24px] md:text-[28px] font-medium text-[#FF6934]">
                {formatIntegerValue(profilePerformanceData.search_appearances_30d)}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-200 flex items-center gap-2">
            <TrendingUp size={18} className={lastViewedLabel ? 'text-[#039855]' : 'text-[#98A2B3]'} />
            <p className="text-[14px] md:text-[15px] text-[#475467]">
              {lastViewedLabel ? (
                <>
                  Last viewed <span className="font-medium text-[#101828]">{lastViewedLabel}</span>
                </>
              ) : (
                <span className="font-medium text-[#101828]">No recruiter views yet</span>
              )}
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
           <div className="grid grid-cols-2 gap-4 mb-8">
              {performanceInsightStats.map((stat, idx) => (
                <div key={idx} className="bg-[#F9FAFB] rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`size-10 ${stat.bgColor} rounded-xl flex items-center justify-center ${stat.iconColor}`}>
                      <stat.icon size={20} />
                    </div>
                    <div className={`flex items-center gap-1 text-[12px] font-bold ${getTrendToneClass(stat.trend, stat.positiveWhen)}`}>
                       <TrendingUp size={14} className={getTrendIconClass(stat.trend)} /> {stat.change || 'No change'}
                    </div>
                  </div>
                  <div className="text-[22px] font-bold text-[#101828] mb-1">{stat.value}</div>
                  <div className="text-[12px] font-medium text-[#475467] leading-tight">{stat.label}</div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <MatchImprovementModal
        isOpen={!!selectedRole}
        onClose={() => setSelectedRole(null)}
        role={selectedRole?.role ?? ''}
        currentMatch={null}
        source="profile"
        onProfileUpdated={onProfileUpdated}
      />
    </>
  );
}
