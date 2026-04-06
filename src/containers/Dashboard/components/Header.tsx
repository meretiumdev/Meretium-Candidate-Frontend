import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  return (
    <div className="bg-white sm:mt-3 border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
      <div>
         <h1 className="text-xl md:text-[32px] font-semibold text-[#101828] flex items-center gap-2">
          Good Evening, Sarah <span className=" inline-block">👋</span>
        </h1>
        <p className="text-[#475467] mt-1.5 text-[14px]">
          You have 2 interviews this week
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
