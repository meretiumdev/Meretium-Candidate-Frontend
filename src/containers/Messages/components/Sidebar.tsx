import { Search } from 'lucide-react';
import type { CandidateConversationSummary } from '../../../services/messagingApi';

interface SidebarProps {
  selectedConversationId: string | null;
  conversations: CandidateConversationSummary[];
  searchValue: string;
  isLoading: boolean;
  error: string | null;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
}

function getRelativeTimeLabel(timestamp: string): string {
  const parsedTime = Date.parse(timestamp);
  if (!Number.isFinite(parsedTime)) return '';

  const diffMs = Date.now() - parsedTime;
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

function getInitial(name: string): string {
  const trimmedName = name.trim();
  if (!trimmedName) return '?';
  return trimmedName.charAt(0).toUpperCase();
}

export default function Sidebar({
  selectedConversationId,
  conversations,
  searchValue,
  isLoading,
  error,
  onSearchChange,
  onSelect,
}: SidebarProps) {

  return (
    <div className="w-full md:w-[380px] bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full shadow-sm font-manrope transition-all duration-300">
      <div className="p-6 pb-4">
        <h1 className="text-[24px] font-semibold text-gray-900  mb-6">Messages</h1>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#10182880]" />
          <input 
            type="text" 
            placeholder="Search by company or recruiter" 
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full bg-gray-50/50 border border-[#E4E7EC] rounded-[10px] py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 transition-all font-body"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {isLoading && (
          <p className="px-5 py-4 text-sm text-gray-500">Loading conversations...</p>
        )}

        {!isLoading && error && (
          <p className="px-5 py-4 text-sm text-[#B42318]">{error}</p>
        )}

        {!isLoading && !error && conversations.length === 0 && (
          <p className="px-5 py-4 text-sm text-gray-500">No conversations found.</p>
        )}

        {!isLoading && !error && conversations.map((conversation) => {
          const isSelected = selectedConversationId === conversation.id;
          const recruiterName = conversation.recruiter_name_snapshot || 'Recruiter';
          const companyName = conversation.company_name_snapshot || 'Company';
          const jobTitle = conversation.job_title_snapshot || 'Opportunity';
          const unreadCount = conversation.unread_count;
          const hasUnread = unreadCount > 0;

          return (
            <div 
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={`p-5 cursor-pointer transition-colors relative border-b border-gray-50 last:border-b-0 ${
                isSelected
                  ? 'bg-[#FFF9F4]'
                  : hasUnread
                    ? 'bg-[#EFF8FF]'
                    : 'bg-white hover:bg-gray-50'
              }`}
            >
              {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF6934] shadow-sm shadow-[#FF6934]/40"></div>
              )}
              <div className="flex gap-4">
                <div className="size-12 rounded-full bg-[#FF6934] flex items-center justify-center text-white text-[18px] shrink-0 border border-white/20 shadow-sm overflow-hidden">
                  {getInitial(recruiterName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-[14px] font-semibold text-gray-900 font-heading truncate pr-2">{recruiterName}</h3>
                    <span className="text-[12px] font-medium text-gray-400 whitespace-nowrap">{getRelativeTimeLabel(conversation.updated_at)}</span>
                  </div>
                  <p className="text-[12px] text-gray-500 font-body mb-0.5 leading-tight">{companyName}</p>
                  <p className="text-[13px] text-gray-400 font-body mb-2 leading-tight">{jobTitle}</p>

                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-[#101828] font-body truncate leading-relaxed">
                      {conversation.last_message || 'No messages yet'}
                    </p>
                    {hasUnread && (
                      <div className="size-5 min-w-5 bg-[#FF6934] rounded-full shrink-0 ml-2 shadow-sm flex items-center justify-center text-white text-[10px] font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
