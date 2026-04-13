import { UploadCloud } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import UploadCVModal from '../../../components/UploadCVModal';

function getGreetingByTime(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function getFullName(user: unknown): string {
  if (typeof user !== 'object' || user === null) return 'there';

  const fullName = (user as { full_name?: unknown }).full_name;
  if (typeof fullName !== 'string' || !fullName.trim()) return 'there';
  return fullName.trim();
}

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);

  const greeting = useMemo(() => getGreetingByTime(), []);
  const fullName = useMemo(() => getFullName(user), [user]);

  return (
    <div className="bg-white sm:mt-3 border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 font-manrope">
      <div>
        <h1 className="text-xl md:text-[28px] font-bold text-[#101828] flex items-center gap-2">
          {greeting}, {fullName} <span className=" inline-block">👋</span>
        </h1>
        <p className="text-[#475467] mt-1.5 text-[14px] font-medium">
          Let's get you started on your career journey. Follow these simple steps to unlock AI-powered job matches.
        </p>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full md:w-auto flex justify-center items-center gap-2 border border-[#E4E7EC] px-4 py-2.5 rounded-[10px] text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors bg-white cursor-pointer"
      >
        <UploadCloud size={18} /> Upload CV
      </button>

      <UploadCVModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
