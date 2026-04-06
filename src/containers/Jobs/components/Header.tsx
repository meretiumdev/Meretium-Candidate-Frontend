import { Bell } from 'lucide-react';

interface HeaderProps {
  onCreateAlert?: () => void;
}

export default function Header({ onCreateAlert }: HeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h1 className='text-[32px] font-semibold text-[#101828]'>Find jobs</h1>
        <p className='text-[#475467] mt-1'>Discover opportunities matched to your skills</p>
      </div>
      <button
        onClick={onCreateAlert}
        className="flex items-center gap-2 border border-[#E4E7EC] px-4 py-2.5 rounded-[10px] text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors bg-white  cursor-pointer whitespace-nowrap"
      >
        <Bell size={16} /> Create job alert
      </button>
    </div>
  );
}
