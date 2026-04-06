import { Search } from 'lucide-react';

interface SidebarProps {
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function Sidebar({ selectedId, onSelect }: SidebarProps) {
  const messages = [
    {
      id: 1,
      name: 'Sarah Johnson',
      company: 'Notion',
      role: 'Senior Product Designer',
      snippet: 'Looking forward to our interview on Thurs...',
      time: '2m ago',
      initial: 'S',
      unread: true,
      active: true
    },
    {
      id: 2,
      name: 'Michael Chen',
      company: 'Stripe',
      role: 'Lead UX Designer',
      snippet: "We're reviewing all candidates and will updat...",
      time: '2 days ago',
      initial: 'M',
      unread: false,
      active: false
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      company: 'Figma',
      role: 'Product Design Manager',
      snippet: 'Congratulations! We would like to extend an...',
      time: '1 week ago',
      initial: 'E',
      unread: false,
      active: false
    }
  ];

  return (
    <div className="w-full md:w-[380px] bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-120px)] shadow-sm font-manrope transition-all duration-300">
      <div className="p-6 pb-4">
        <h1 className="text-[24px] font-semibold text-gray-900  mb-6">Messages</h1>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#10182880]" />
          <input 
            type="text" 
            placeholder="Search by company or recruiter" 
            className="w-full bg-gray-50/50 border border-[#E4E7EC] rounded-[10px] py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 transition-all font-body"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            onClick={() => onSelect(msg.id)}
            className={`p-5 cursor-pointer transition-colors relative border-b border-gray-50 last:border-b-0 ${
              selectedId === msg.id 
                ? 'bg-[#FFF9F4]' 
                : msg.unread 
                  ? 'bg-[#EFF8FF]' 
                  : 'bg-white hover:bg-gray-50'
            }`}
          >
            {selectedId === msg.id && (
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF6934] shadow-sm shadow-[#FF6934]/40"></div>
            )}
            <div className="flex gap-4">
              <div className="size-12 rounded-full bg-[#FF6934] flex items-center justify-center text-white text-[18px] shrink-0 border border-white/20 shadow-sm overflow-hidden">
                {msg.initial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-[14px] font-semibold text-gray-900 font-heading truncate pr-2">{msg.name}</h3>
                  <span className="text-[12px] font-medium text-gray-400 whitespace-nowrap">{msg.time}</span>
                </div>
                <p className="text-[12px]  text-gray-500 font-body mb-0.5 leading-tight">{msg.company}</p>
                <p className="text-[13px]  text-gray-400 font-body mb-2 leading-tight">{msg.role}</p>
                
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-[#101828] font-body truncate leading-relaxed">
                    {msg.snippet}
                  </p>
                  {msg.unread && (
                    <div className="size-2 bg-[#FF6934] rounded-full shrink-0 ml-2 shadow-sm"></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
