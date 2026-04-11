import { useState } from 'react';
import { Briefcase, Edit3 } from 'lucide-react';

interface Preference {
  id: number;
  label: string;
  value: string | string[];
  isPill: boolean;
}

export default function JobPreferences() {
  const [isEditing, setIsEditing] = useState(false);
  const [prefs, setPrefs] = useState<Preference[]>([
    { id: 1, label: 'Preferred roles', value: ['Product Designer', 'UX Designer', 'Design Lead'], isPill: true },
    { id: 2, label: 'Preferred locations', value: ['London, UK', 'Remote'], isPill: true },
    { id: 3, label: 'Work mode', value: 'Remote / Hybrid', isPill: false },
    { id: 4, label: 'Job type', value: 'Full-time', isPill: false },
    { id: 5, label: 'Salary expectation', value: '£80,000 - £120,000', isPill: false },
    { id: 6, label: 'Notice period', value: '1 month', isPill: false }
  ]);
  const [isRelocationOpen, setIsRelocationOpen] = useState(true);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6 font-manrope transition-all duration-300">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="size-12 bg-[#FFF4EC] rounded-full flex items-center justify-center text-[#FF6934] shrink-0">
             <Briefcase size={22} />
          </div>
          <div>
             <h2 className="text-[18px] md:text-[20px] font-semibold text-[#101828]">Job Preferences</h2>
             <p className="text-[#98A2B3] text-[13px] md:text-[14px]">Critical for AI matching</p>
          </div>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`text-[#475467] hover:text-[#FF6934] transition-colors cursor-pointer p-1 ${isEditing ? 'text-[#FF6934]' : ''}`}
        >
          <Edit3 size={18} />
        </button>
      </div>

      <div className="space-y-6">
        {prefs.map((pref) => (
          <div key={pref.id} className="flex justify-between items-start gap-4 group">
             <div className="flex flex-col gap-2.5 flex-1">
                <h4 className="text-[15px] font-medium text-[#475467]">{pref.label}</h4>
                <div className="flex flex-wrap gap-2">
                   {isEditing ? (
                      <input 
                        type="text"
                        value={Array.isArray(pref.value) ? pref.value.join(', ') : pref.value}
                        onChange={(e) => {
                           const newVal = pref.isPill ? e.target.value.split(',').map(s => s.trim()) : e.target.value;
                           setPrefs((prevPrefs) => prevPrefs.map(p => p.id === pref.id ? { ...p, value: newVal } : p));
                        }}
                        className="w-full px-3 py-2 text-[14px] text-[#475467] border border-[#EAECF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6934]/10 focus:border-[#FF6934] transition-all bg-[#F9FAFB]"
                      />
                   ) : (
                      pref.isPill && Array.isArray(pref.value) ? (
                         pref.value.map(v => <span key={v} className="px-3.5 py-1.5 bg-[#F9FAFB] text-[#475467] rounded-full text-[13px] font-medium">{v}</span>)
                      ) : (
                         <span className="text-[14px] text-[#475467]">{pref.value}</span>
                      )
                   )}
                </div>
             </div>
             <button 
               onClick={() => !isEditing && setIsEditing(true)}
               className="text-[#98A2B3] hover:text-gray-900 transition-colors cursor-pointer mt-1 shrink-0"
             >
                <Edit3 size={18} />
             </button>
          </div>
        ))}
        
        <div className="flex items-center justify-between group pt-2">
           <span className="text-[15px] font-medium text-[#475467]">Open to relocation</span>
           <button 
             onClick={() => setIsRelocationOpen(!isRelocationOpen)}
             className={`w-11 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${isRelocationOpen ? 'bg-[#FF6934]' : 'bg-[#D0D5DD]'}`}
           >
              <div className={`absolute top-0.5 size-5 bg-white rounded-full shadow-sm transition-all duration-300 ${isRelocationOpen ? 'right-0.5' : 'left-0.5'}`}></div>
           </button>
        </div>

        {isEditing && (
           <div className="flex items-center gap-4 mt-8 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-6 py-2.5 bg-[#FF6934] text-white rounded-[10px] text-[14px] font-semibold hover:opacity-90 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Save changes
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 text-[#475467] text-[14px] font-semibold hover:text-gray-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
           </div>
        )}
      </div>
    </div>
  );
}
