import React from 'react';
import { 
  User, 
  Eye, 
  FileText, 
  Bell, 
  Sparkles, 
  Lock, 
  Link2, 
  HelpCircle, 
  AlertTriangle 
} from 'lucide-react';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, danger, onClick }: SidebarItemProps) => {
  return (
    <button
      onClick={onClick}
      className={`flex md:w-full items-center gap-3 px-4 py-3 rounded-[10px] transition-all duration-200 cursor-pointer whitespace-nowrap ${
        active 
          ? 'bg-[#FFF1EC] text-[#FF6934] font-medium' 
          : danger 
            ? 'text-[#F04438] hover:bg-red-50' 
            : 'text-[#475467] hover:bg-gray-50'
      }`}
    >
      <Icon size={18} className={`shrink-0 ${active ? 'text-[#FF6934]' : danger ? 'text-[#F04438]' : 'text-[#475467]'}`} />
      <span className="text-[14px]">{label}</span>
    </button>
  );
};

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { icon: User, label: 'Account' },
    { icon: Eye, label: 'Profile & Visibility' },
    { icon: FileText, label: 'CV & Data' },
    { icon: Bell, label: 'Notifications' },
    { icon: Sparkles, label: 'AI Preferences' },
    { icon: Lock, label: 'Security' },
    { icon: Link2, label: 'Integrations' },
    { icon: HelpCircle, label: 'Help & Support' },
    { icon: AlertTriangle, label: 'Danger Zone', danger: true },
  ];

  return (
    <div className="w-full md:w-64 bg-white rounded-xl p-2 md:p-3 border border-gray-200 shadow-sm h-fit font-manrope md:sticky md:top-24">
      <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible no-scrollbar">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            active={activeTab === item.label}
            danger={item.danger}
            onClick={() => setActiveTab(item.label)}
          />
        ))}
      </div>
    </div>
  );
}
