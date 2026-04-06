export default function Benefits() {
  const points = [
    "Competitive salary and equity package",
    "Comprehensive health, dental, and vision insurance",
    "Flexible working hours and remote work options",
    "20 days paid vacation plus bank holidays",
    "Learning and development budget",
    "Home office setup allowance",
    "Regular team events and offsites"
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope transition-all duration-300">
      <h2 className="text-[24px] font-bold sm:-mt-2 text-[#101828] mb-3">Benefits</h2>
      <ul className="space-y-3">
        {points.map((point, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6934] shrink-0 mt-2"></span>
            <span className="text-[14px] text-[#475467] font-regular leading-relaxed">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
