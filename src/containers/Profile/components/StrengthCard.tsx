import { ChevronDown, CheckCircle2, Circle } from 'lucide-react';

export default function StrengthCard() {
  const steps = [
    { title: 'Upload CV', completed: true },
    { title: 'Add 2 more skills', completed: false },
    { title: 'Add recent experience', completed: true }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm font-manrope transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[18px] md:text-[20px] font-semibold text-[#101828] flex items-center gap-3">
          Profile strength <span className="text-[#FF6934] text-[20px] font-semibold">82%</span>
        </h2>
        <button className="text-[#475467] hover:text-gray-900 transition-colors cursor-pointer">
          <ChevronDown size={20} />
        </button>
      </div>

      <div className="relative h-2 w-full bg-[#f2f4f7] rounded-full overflow-hidden mb-5">
        <div 
          className="absolute left-0 top-0 h-full bg-[#FF6934] rounded-full transition-all duration-500"
          style={{ width: '82%' }}
        />
      </div>

      <div className="text-[14px] text-[#475467] font-medium mb-4">
        1 of 3 completed
      </div>

      <div className="flex flex-col gap-4">
        {steps.map((step) => (
          <div key={step.title} className="flex items-center gap-3 group cursor-pointer">
            {step.completed ? (
               <CheckCircle2 size={20} className="text-[#039855] shrink-0" />
            ) : (
               <Circle size={20} className="text-[#D0D5DD] shrink-0" />
            )}
            <span className={`text-[14px] ${step.completed ? 'text-[#475467] line-through decoration-gray-300' : 'text-[#101828]'} font-medium`}>
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
