import { MessageSquare, ExternalLink, Paperclip, Send, Calendar, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatMenu from './ChatMenu';

interface ChatAreaProps {
  selectedId: number | null;
  onBack?: () => void;
}

export default function ChatArea({ selectedId, onBack }: ChatAreaProps) {
  const navigate = useNavigate();
  if (!selectedId) {
    return (
      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden hidden md:flex flex-col items-center justify-center h-[calc(100vh-160px)] shadow-sm font-manrope">
        <div className="flex flex-col items-center text-center p-8 max-w-[400px]">
          <div className="size-20 bg-[#F9FAFB] rounded-full flex items-center justify-center text-gray-400 mb-8 shadow-inner border border-gray-50 ring-8 ring-[#F9FAFB]/50">
            <MessageSquare size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-[24px] font-bold text-[#111827] font-heading mb-3 leading-tight">Select a conversation to start messaging</h2>
          <p className="text-[15px] font-medium text-[#6B7280] font-body leading-relaxed">
            Choose a conversation from the list to view messages
          </p>
        </div>
      </div>
    );
  }

  // Sample data for different threads
  const threads: Record<number, any> = {
    1: {
      name: 'Sarah Johnson',
      company: 'Notion',
      role: 'Senior Product Designer',
      messages: [
        { type: 'recruiter', text: "Hi Sarah! We're really impressed with your experience and vision for design leadership.", time: '1 week ago' },
        { type: 'system', text: "Job offer extended", time: '1 week ago' },
        { type: 'recruiter', text: "Congratulations! We would like to extend an offer for the Product Design Manager role. Please review the offer details and let us know if you have any questions.", time: '1 week ago' }
      ],
      offer: {
        title: 'Job Offer',
        description: "We're excited to offer you the Product Design Manager position at Notion. Review the full offer details including compensation, equity, and benefits."
      }
    },
    2: {
      name: 'Michael Chen',
      company: 'Stripe',
      role: 'Lead UX Designer',
      messages: [
        { type: 'recruiter', text: "Hi there! Thank you for your application to the Lead UX Designer role at Stripe. We're currently reviewing all candidates and will get back to you within the next few days.", time: '3 days ago' },
        { type: 'candidate', text: "Thank you for the update! I'm very interested in the role and happy to provide any additional information if needed.", time: '2 days ago' },
        { type: 'recruiter', text: "We're reviewing all candidates and will update you soon.", time: '2 days ago' }
      ]
    },
    3: {
      name: 'Emily Rodriguez',
      company: 'Figma',
      role: 'Product Design Manager',
      messages: [
        { type: 'recruiter', text: "Hi! We're really impressed with your portfolio and would love to schedule an interview to discuss your experience with design systems.", time: '2 days ago' },
        { type: 'system', text: "Interview scheduled for 24 Feb at 2:00 PM", time: '2 days ago' },
        { type: 'candidate', text: "Thank you so much! I'm excited about the opportunity. I've worked extensively with design systems at my current role and would love to share more details.", time: '1 day ago' },
        { type: 'recruiter', text: "Perfect! The interview will be a video call where you'll meet with our Product Lead and one of our Senior Designers. We'll discuss your experience and walk through some of your projects. Looking forward to our interview on Thursday!", time: '2m ago' }
      ],
      invitation: {
        title: 'Interview Invitation',
        date: 'Feb 24, 2024',
        time: '2:00 PM GMT',
        mode: 'Video call'
      }
    }
  };

  const chat = selectedId ? (threads[selectedId] || threads[2]) : threads[2];

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-160px)] shadow-sm relative font-manrope">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="md:hidden p-1.5 bg-gray-50 border border-gray-100 rounded-lg text-gray-500 active:scale-95 transition-all mr-1 cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="size-10 md:size-12 rounded-full bg-[#FF6934] flex items-center justify-center text-white  text-lg shrink-0 shadow-sm border border-black/5">
            {chat.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="text-[18px] font-semibold text-gray-900 font-heading truncate pr-2 leading-none mb-1">{chat.name}</h3>
            <p className="text-[12px] font-medium text-gray-400 font-body truncate leading-none">{chat.company}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button 
            onClick={() => navigate('/job-detail')}
            className="px-3 md:px-4 py-1.5 border border-[#E4E7EC] rounded-lg text-[14px] md:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors DM_Sans cursor-pointer flex items-center gap-2"
          >
            <span className="hidden sm:inline">View application</span>
             <ExternalLink size={16} className="sm:hidden text-[#E4E7EC]" />
          </button>
          <ChatMenu />
        </div>
      </div>

      {/* Role Banner */}
      <div className="mx-4 md:mx-6 mt-4 p-4 bg-[#F9FAFB] rounded-[12px] flex items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div className="text-[14px] md:text-[15px] text-[#475467] font-medium font-body break-words">
            You applied for <span onClick={() => navigate('/job-detail')} className="text-[#FF6934] cursor-pointer hover:underline">{chat.role}</span> at {chat.company}
          </div>
          <div className="shrink-0">
            <span className="bg-[#EFF8FF] text-[#175CD3] text-[13px] font-medium px-2.5 py-1 rounded-[10px]">In Review</span>
          </div>
        </div>
        <ExternalLink 
          size={20} 
          onClick={() => navigate('/job-detail')}
          className="text-[#475467] cursor-pointer hover:text-gray-900 transition-colors self-start shrink-0 mt-1 sm:mt-0" 
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide bg-white/50">
        {chat.messages.map((m: any, idx: number) => (
          <div key={idx}>
            {m.type === 'system' ? (
              <div className="flex justify-center my-6">
                <span className="bg-gray-50 text-[#475467] text-[12px]  px-4 py-1.5 rounded-full border border-gray-100 uppercase tracking-wider">{m.text}</span>
              </div>
            ) : (
              <div className={`flex items-start gap-3 ${m.type === 'candidate' ? 'flex-row-reverse' : ''}`}>
                <div className={`size-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 ${m.type === 'candidate' ? 'bg-[#FF6934]' : 'bg-[#FF6934]'}`}>
                  {m.type === 'candidate' ? 'S' : chat.name.charAt(0)}
                </div>
                <div className="max-w-[85%] md:max-w-[75%]">
                  <div className={`p-4 rounded-2xl text-[14px] leading-relaxed font-medium font-body shadow-sm ${
                    m.type === 'candidate' 
                    ? 'bg-orange-50 text-gray-800 rounded-tr-none border border-orange-100/50' 
                    : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'
                  }`}>
                    {m.text}
                  </div>
                  <span className={`block text-[11px] mt-1.5 text-gray-400 font-medium ${m.type === 'candidate' ? 'text-right mr-1' : 'ml-1'}`}>
                    {m.time}
                  </span>
                </div>
              </div>
            )}             
          </div>
        ))}

        {/* Inline Cards */}
        {chat.invitation && (
          <div className="max-w-[90%] mx-auto bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6 mt-4">
             <div className="flex items-center gap-2 mb-6">
                <div className="size-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                   <Calendar size={18} />
                </div>
                <h3 className="text-[14px] font-semibold text-gray-900 font-heading">{chat.invitation.title}</h3>
             </div>
             
             <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 text-[14px]">
                <div className="flex items-center gap-3 text-gray-400 font-medium">Date:</div>
                <div className="text-gray-900 font-medium font-body text-right">{chat.invitation.date}</div>
                <div className="flex items-center gap-3 text-gray-400 font-medium">Time:</div>
                <div className="text-gray-900 font-medium font-body text-right">{chat.invitation.time}</div>
                <div className="flex items-center gap-3 text-gray-400 font-medium">Mode:</div>
                <div className="text-gray-900 font-medium font-body text-right">{chat.invitation.mode}</div>
             </div>

              <div className="flex flex-col gap-3">
                <button className="w-full bg-[#FF6934] text-white py-2.5 rounded-[10px] text-sm font-medium shadow-md hover:opacity-90 transition-opacity cursor-pointer">
                   Accept
                </button>
                <button className="w-full border border-gray-200 py-2.5 rounded-[10px] text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer bg-white">
                   Reschedule
                </button>
              </div>
          </div>
        )}

        {chat.offer && (
           <div className="max-w-[90%] mx-auto bg-[#F9FAFB] border border-gray-200 rounded-xl p-6 shadow-sm mb-6 mt-4 ring-1 ring-emerald-500/10">
              <div className="flex items-center gap-2 mb-4">
                 <CheckCircle2 size={18} className="text-emerald-500" />
                 <h3 className="text-[17px] font-semibold text-gray-900 font-heading">{chat.offer.title}</h3>
              </div>
              <p className="text-[13px] text-gray-500 font-medium mb-8 leading-relaxed font-body">
                 {chat.offer.description}
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                 <button className="w-full bg-[#FF6934] text-white py-2.5 rounded-xl text-[13px]  hover:opacity-90 transition-all">View offer</button>
                 <button className="w-full bg-orange-50 border border-orange-200 text-[#FF6934] py-2.5 rounded-xl text-[13px]  hover:bg-orange-100 transition-all">Accept</button>
                 <button className="w-full bg-white border border-gray-200 text-gray-600 py-2.5 rounded-xl text-[13px]  hover:bg-gray-50 transition-all">Decline</button>
              </div>
           </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-4 md:p-6 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-3 md:gap-4 bg-[#F9FAFB] border border-gray-100 rounded-[12px] md:rounded-[14px] px-4 md:px-6 py-2.5 md:py-3 shadow-inner focus-within:ring-2 focus-within:ring-[#FF6934]/20 transition-all">
          <Paperclip size={20} className="text-gray-400 cursor-pointer hover:text-gray-600" />
          <input 
            type="text" 
            placeholder="Write a message..." 
            className="flex-1 border-none focus:outline-none text-[15px]  placeholder:text-gray-400 bg-transparent"
          />
          <button className="size-10 bg-[#FF6934]/10 text-[#FF6934] rounded-xl flex items-center justify-center hover:bg-[#FF6934] hover:text-white transition-all cursor-pointer">
            <Send size={18} fill="currentColor" strokeWidth={0} />
          </button>
        </div>
      </div>

    </div>
  );
}
