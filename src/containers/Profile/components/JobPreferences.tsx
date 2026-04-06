import { Briefcase, Edit3 } from 'lucide-react';

export default function JobPreferences() {
  const preferences = [
    { label: 'Preferred roles', value: ['Product Designer', 'UX Designer', 'Design Lead'], isPill: true },
    { label: 'Preferred locations', value: ['London, UK', 'Remote'], isPill: true },
    { label: 'Work mode', value: 'Remote / Hybrid', isPill: false },
    { label: 'Job type', value: 'Full-time', isPill: false },
    { label: 'Salary expectation', value: '£80,000 - £120,000', isPill: false },
    { label: 'Notice period', value: '1 month', isPill: false }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6 font-manrope transition-all duration-300">
      <div className="flex items-center gap-4 mb-8">
        <div className="size-12 bg-[#FFF4EC] rounded-full flex items-center justify-center text-[#FF6934] shrink-0">
           <Briefcase size={22} />
        </div>
        <div>
           <h2 className="text-[18px] md:text-[20px] font-semibold text-[#101828]">Job Preferences</h2>
           <p className="text-[#98A2B3] text-[13px] md:text-[14px]">Critical for AI matching</p>
        </div>
      </div>

      <div className="space-y-6">
        {preferences.map((pref) => (
          <div key={pref.label} className="flex justify-between items-start gap-4 group">
             <div className="flex flex-col gap-2.5">
                <h4 className="text-[15px] font-medium text-[#475467]">{pref.label}</h4>
                <div className="flex flex-wrap gap-2">
                   {pref.isPill && Array.isArray(pref.value) ? (
                      pref.value.map(v => <span key={v} className="px-3.5 py-1.5 bg-[#F9FAFB] text-[#475467] rounded-full text-[13px] font-medium">{v}</span>)
                   ) : (
                      <span className="text-[14px] text-[#475467]">{pref.value}</span>
                   )}
                </div>
             </div>
             <button className="text-[#98A2B3] hover:text-gray-900 transition-colors cursor-pointer mt-1 shrink-0"><Edit3 size={18} /></button>
          </div>
        ))}
        
        <div className="flex items-center justify-between group pt-2">
           <span className="text-[15px] font-medium text-[#475467]">Open to relocation</span>
           <button className="w-11 h-6 bg-[#FF6934] rounded-full relative cursor-pointer transition-all">
              <div className="absolute right-0.5 top-0.5 size-5 bg-white rounded-full shadow-sm"></div>
           </button>
        </div>
      </div>
    </div>
  );
}
