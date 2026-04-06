import { X, Building2, MapPin, Calendar, Clock, FileText, Download, CheckCircle, Check, MessageSquare, ArrowRight } from 'lucide-react';

interface ApplicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: any;
}

export default function ApplicationDetailModal({ isOpen, onClose, app }: ApplicationDetailModalProps) {
  if (!isOpen || !app) return null;

  const getTimelineSteps = () => {
    // Generate mock dates or use data
    const date1 = app.status === 'Rejected' ? 'Jan 29, 2024' : (app.status === 'Applied' ? 'Feb 14, 2024' : 'Feb 12, 2024');
    
    const steps = [
      {
        title: "Applied",
        date: date1,
        desc: "Your application has been submitted"
      }
    ];

    if (app.status === 'Rejected') {
      steps.push({
        title: "Under Review",
        date: "Jan 30, 2024",
        desc: "Hiring team reviewed your application"
      });
      steps.push({
        title: "Application Closed",
        date: "Feb 5, 2024",
        desc: "We have moved forward with other candidates"
      });
    } else {
      if (app.stage >= 2) {
        steps.push({
          title: "Under Review",
          date: app.status === 'In Review' ? "Feb 13, 2024" : "Feb 17, 2024",
          desc: "Hiring team is reviewing your application"
        });
      }
      if (app.stage >= 3) {
        steps.push({
          title: "Interview Scheduled",
          date: "Feb 19, 2024",
          desc: "Video interview with Sarah Johnson, Product Lead"
        });
      }
      if (app.stage >= 4) {
        steps.push({
          title: "Offer Extended",
          date: "March 1, 2024",
          desc: "Congratulations on your offer!"
        });
      }
    }
    return steps;
  };

  const timelineSteps = getTimelineSteps();

  return (
    <>
      {/* Backdrop — Clear, no tint or blur */}
      <div className="fixed inset-0 z-[100] bg-transparent animate-in fade-in duration-300" onClick={onClose} />
      
      {/* Panel — anchored to right side, matching MatchImprovementModal logic */}
      <div className="fixed top-0 right-0 z-[110] h-full flex items-start justify-end pointer-events-none pt-19 p-4 sm:p-6">
        <div 
          className="pointer-events-auto w-[410px] md:w-[420px] bg-white mt-12.5 -mr-6 shadow-2xl 0 overflow-hidden max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-2 shrink-0">
            <h2 className="text-[20px] md:text-[22px] font-semibold text-[#111827] leading-tight pr-6">{app.title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 bg-gray-50 hover:bg-gray-100 rounded-full cursor-pointer shrink-0">
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content Body — scrollbar hidden */}
          <div 
            className="flex-1 overflow-y-auto p-6 pt-2 scrollbar-hide"
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          >
            <style>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="flex flex-col gap-3.5 mb-8">
              <div className="flex items-center gap-2.5 text-[14px] text-[#4B5563] font-medium">
                <Building2 size={16} className="text-[#6B7280]" /> {app.company}
              </div>
              <div className="flex items-center gap-2.5 text-[14px] text-[#4B5563] font-medium">
                <MapPin size={16} className="text-[#6B7280]" /> {app.location}
              </div>
              <div className="mt-1">
                <span className={`px-4 py-1.5 rounded-full text-[12px] font-medium ${app.statusColor}`}>
                  {app.status}
                </span>
              </div>
            </div>

            {/* Dynamic Notice Box (Interview vs Offer) */}
            {app.status === 'Interview' ? (
              <div className="bg-[#F0F9FF] border border-[#E0F2FE] rounded-xl p-5 mb-8 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <div className="size-10 bg-[#0EA5E9] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Calendar size={18} />
                  </div>
                  <div className="pt-0.5">
                    <div className="text-[16px] font-bold text-[#0369A1] leading-tight">Interview scheduled</div>
                    <div className="text-[13px] font-medium text-[#0284C7] mt-1">Your interview is coming up</div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2.5 text-[13px] text-[#0369A1] font-medium mb-5 ml-0">
                  <div className="flex items-center gap-2.5"><Calendar size={16} className="opacity-70"/> Feb 22, 2024</div>
                  <div className="flex items-center gap-2.5"><Clock size={16} className="opacity-70"/> 2:00 PM GMT</div>
                </div>

                <div className="flex flex-col gap-3">
                  <button className="w-full bg-white px-4 py-2.5 rounded-xl text-[14px] font-bold text-gray-900 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                    Accept interview
                  </button>
                  <button className="w-full text-[13px] font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer text-center">
                    Reschedule
                  </button>
                </div>
              </div>
            ) : app.status === 'Offered' ? (
              <div className="bg-[#ECFDF3] border border-[#D1FADF] rounded-xl p-5 mb-8 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <div className="size-10 bg-[#10B981] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                    <CheckCircle size={20} />
                  </div>
                  <div className="pt-0.5">
                    <div className="text-[16px] font-bold text-[#027A48] leading-tight">Offer received 🥳</div>
                    <div className="text-[13px] font-medium text-[#039855] mt-1">Congratulations!</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 mb-5 border border-gray-200 shadow-sm space-y-4">
                  <div>
                    <div className="text-[12px] font-bold text-[#039855] mb-0.5">Salary</div>
                    <div className="text-[15px] font-bold text-[#111820]">£95k - £115k</div>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#039855] mb-0.5">Benefits</div>
                    <div className="space-y-1.5 mt-2">
                      {["Health insurance", "25 days leave", "Remote-first"].map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[13px] text-[#05603A] font-medium">
                          <Check size={14} className="text-[#10B981] shrink-0" strokeWidth={3} /> {benefit}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button className="w-full bg-[#FF6934] px-6 py-3 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity cursor-pointer mb-3">
                  Accept offer
                </button>
                <button className="w-full text-[13px] font-bold text-[#667085] hover:text-gray-900 transition-colors cursor-pointer text-center">
                  Decline
                </button>
              </div>
            ) : null}

            {/* Documents */}
            <h3 className="text-[16px] font-semibold text-gray-900 mb-4">Documents submitted</h3>
            <div className="flex flex-col gap-2.5 mb-8">
              <div className="flex items-center justify-between bg-[#F9FAFB] p-3.5 rounded-xl border border-gray-100 group">
                <div className="flex items-center gap-3 text-[13px] font-medium text-gray-700">
                  <FileText size={16} className="text-gray-400 group-hover:text-[#FF6934]" /> Product_Designer_CV.pdf
                </div>
                <Download size={16} className="text-gray-400 cursor-pointer hover:text-gray-600"/>
              </div>
              <div className="flex items-center justify-between bg-[#F9FAFB] p-3.5 rounded-xl border border-gray-100 group">
                <div className="flex items-center gap-3 text-[13px] font-medium text-gray-700">
                  <FileText size={16} className="text-gray-400 group-hover:text-[#FF6934]" /> Cover Letter
                </div>
                <Download size={16} className="text-gray-400 cursor-pointer hover:text-gray-600"/>
              </div>
            </div>

            {/* Screening answers */}
            <h3 className="text-[16px] font-semibold text-gray-900 mb-4">Screening answers</h3>
            <div className="bg-[#F9FAFB] p-4 rounded-xl border border-gray-100 text-[13px] text-[#4B5563] font-medium leading-relaxed mb-8">
              I have extensive experience leading design systems at Stripe, focusing on scalability and engineer handoff...
            </div>

            {/* Timeline */}
            <h3 className="text-[16px] font-semibold text-gray-900 mb-5">Timeline</h3>
            <div className="flex flex-col relative pl-1 mb-8">
              {timelineSteps.map((step, idx) => (
                <div key={idx} className={`flex gap-3.5 relative ${idx < timelineSteps.length - 1 ? 'pb-7' : ''}`}>
                  {idx < timelineSteps.length - 1 && (
                    <div className="absolute top-7 bottom-0 left-[13px] w-[1px] bg-[#E5E7EB]"></div>
                  )}
                  <div className="size-7 rounded-full bg-[#FF6934] text-white flex items-center justify-center text-[12px] font-bold z-10 shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex flex-col mt-0.5">
                    <span className="text-[14px] font-semibold text-gray-900 leading-none">{step.title}</span>
                    <span className="text-[12px] text-gray-500 font-medium mt-1">{step.date}</span>
                    <span className="text-[13px] text-[#475467] mt-1 line-clamp-2">{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Latest message */}
            {app.status === 'Interview' && (
              <div className="bg-[#F9FAFB] rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
                <div className="flex items-center gap-2 text-[14px] font-bold text-gray-900 mb-2">
                   <MessageSquare size={16} className="text-[#FF6934]" /> Latest message
                </div>
                <p className="text-[13px] text-[#475467] leading-relaxed">
                  Hi! We're excited about your application...
                </p>
                <button className="flex items-center gap-1.5 text-[#FF6934] font-medium text-[13px] mt-3 hover:underline cursor-pointer">
                  Open full conversation <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
