export default function Responsibilities() {
  const points = [
    "Design and ship high-quality product features end-to-end",
    "Collaborate with cross-functional teams including engineering, product, and marketing",
    "Conduct user research and usability testing to inform design decisions",
    "Maintain and evolve our design system",
    "Mentor junior designers and contribute to the design culture",
    "Present design work to stakeholders and incorporate feedback"
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope transition-all duration-300">
      <h2 className="text-[24px] font-bold sm:-mt-2 text-[#101828] mb-3">Key responsibilities</h2>
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
