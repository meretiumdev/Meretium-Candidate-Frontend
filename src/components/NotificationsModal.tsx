import { X, FileText, MessageSquare, Bell } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      type: 'viewed',
      title: 'Application viewed',
      description: 'Your application for Senior Software Engineer was viewed',
      time: '1h ago',
      unread: true,
      icon: FileText,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500'
    },
    {
      id: 2,
      type: 'shortlisted',
      title: 'Shortlisted',
      description: 'You were shortlisted for Product Designer at Notion',
      time: '3h ago',
      unread: true,
      icon: FileText,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500'
    },
    {
      id: 3,
      type: 'interview',
      title: 'Interview scheduled',
      description: 'Interview scheduled with Stripe',
      time: 'Yesterday',
      unread: false,
      icon: MessageSquare,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500'
    },
    {
      id: 4,
      type: 'match',
      title: 'Job match',
      description: 'New role matches your profile: Frontend Engineer',
      time: '2d ago',
      unread: false,
      icon: Bell,
      iconBg: 'bg-gray-50',
      iconColor: 'text-gray-400'
    }
  ];

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-start justify-center md:justify-end p-4 pt-16"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[20px] w-full max-w-[340px] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-top-4 duration-200 border border-gray-100 md:mr-20 mt-2"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
          <h2 className="text-[17px] font-bold text-gray-900 font-heading">Notifications</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="max-h-[50vh] overflow-y-auto scrollbar-hide py-0">
          {notifications.map((notif) => (
            <div 
              key={notif.id}
              className={`px-5 py-3.5 flex gap-3.5 transition-all hover:bg-gray-50/50 cursor-pointer relative border-b border-gray-50 last:border-b-0 ${notif.unread ? 'bg-orange-50/5' : ''}`}
            >
              <div className={`size-9 rounded-lg ${notif.iconBg} flex items-center justify-center ${notif.iconColor} shrink-0 shadow-sm border border-black/5`}>
                <notif.icon size={16} />
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <h4 className="text-[13px] font-bold text-gray-900 font-heading mb-0.5">{notif.title}</h4>
                <p className="text-[12px] font-medium text-gray-500 font-body leading-tight mb-1 truncate">{notif.description}</p>
                <span className="text-[10px] font-bold text-gray-400 font-body uppercase tracking-wider">{notif.time}</span>
              </div>
              {notif.unread && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2 size-1.5 bg-[#FF6934] rounded-full shadow-sm"></div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-white flex items-center justify-center sticky bottom-0">
           <button className="text-[13px] font-bold text-[#FF6934] hover:opacity-80 transition-all font-body cursor-pointer">
              Mark all as read
           </button>
        </div>
      </div>
    </div>
  );
}
