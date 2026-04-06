import { Check } from 'lucide-react';

export default function Requirements() {
  const mustHave = [
    "5+ years of experience in product design",
    "Strong portfolio demonstrating end-to-end design projects",
    "Expert knowledge of Figma and modern design tools",
    "Experience with design systems and component libraries",
    "Excellent communication and presentation skills",
    "Understanding of front-end technologies (HTML, CSS, React)"
  ];

  const niceToHave = [
    "Experience working in B2B SaaS companies",
    "Animation and interaction design skills",
    "Experience with user research methodologies",
    "Knowledge of accessibility standards"
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope transition-all duration-300">
      <h2 className="text-[24px] font-bold sm:-mt-2 text-[#101828] mb-3">Requirements</h2>
      
      <div className="mb-8">
        <h3 className="text-[14px] font-bold text-[#101828] mb-3">Must have</h3>
        <ul className="space-y-3">
          {mustHave.map((point, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Check size={18} className="text-green-500 shrink-0 mt-0.5" strokeWidth={3} />
              <span className="text-[14px] text-[#475467] leading-relaxed font-regular">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-[14px] font-[600] text-gray-900 mb-3">Nice to have</h3>
        <ul className="space-y-3">
          {niceToHave.map((point, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="size-4 rounded-full border-[2px] border-[#FF6934] shrink-0 mt-1"></div>
              <span className="text-[14px] text-gray-500 font-medium leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
