import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../../redux/store';

interface HeaderProps {
  interviewCount?: number;
}

function getGreetingByTime(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function getStringValue(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getFullName(user: unknown): string {
  if (typeof user !== 'object' || user === null) return 'there';

  const userObj = user as {
    full_name?: unknown;
    fullName?: unknown;
    name?: unknown;
    first_name?: unknown;
    firstName?: unknown;
    last_name?: unknown;
    lastName?: unknown;
    email?: unknown;
  };

  const directName = getStringValue(userObj.full_name)
    || getStringValue(userObj.fullName)
    || getStringValue(userObj.name);
  if (directName) return directName;

  const firstName = getStringValue(userObj.first_name) || getStringValue(userObj.firstName);
  const lastName = getStringValue(userObj.last_name) || getStringValue(userObj.lastName);
  const combinedName = [firstName, lastName].filter((part): part is string => Boolean(part)).join(' ').trim();
  if (combinedName) return combinedName;

  const email = getStringValue(userObj.email);
  if (email) {
    const [prefix] = email.split('@');
    if (prefix?.trim()) return prefix.trim();
  }

  return 'there';
}

function getSubHeading(interviewCount: number): string {
  if (interviewCount <= 0) return 'No interviews in pipeline yet';
  if (interviewCount === 1) return 'You have 1 interview in pipeline';
  return `You have ${interviewCount} interviews in pipeline`;
}

export default function Header({ interviewCount = 0 }: HeaderProps) {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const greeting = useMemo(() => getGreetingByTime(), []);
  const fullName = useMemo(() => getFullName(user), [user]);
  const subHeading = useMemo(() => getSubHeading(interviewCount), [interviewCount]);

  return (
    <div className="bg-white sm:mt-3 border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
      <div>
        <h1 className="text-xl md:text-[32px] font-semibold text-[#101828] flex items-center gap-2">
          {greeting}, {fullName} <span className="inline-block">👋</span>
        </h1>
        <p className="text-[#475467] mt-1.5 text-[14px]">
          {subHeading}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
        <button
          onClick={() => navigate('/profile')}
          className="w-full md:w-auto flex justify-center items-center gap-2 border border-[#E4E7EC] px-4 py-2.5 rounded-[10px] text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors bg-white cursor-pointer"
        >
          Update Profile
        </button>
        <button
          onClick={() => navigate('/jobs')}
          className="w-full md:w-auto flex justify-center items-center gap-2 px-4 py-2.5 rounded-[10px] text-sm font-medium text-white bg-[#FF6934] cursor-pointer"
        >
          Browse Jobs
        </button>
      </div>
    </div>
  );
}
