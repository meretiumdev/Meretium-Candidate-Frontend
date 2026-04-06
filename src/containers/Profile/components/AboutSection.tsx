import { Sparkles, Edit3 } from 'lucide-react';

export default function AboutSection() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6 font-manrope transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[18px] md:text-[20px] font-bold text-[#101828]">About</h2>
        <div className="flex items-center gap-5">
           <button className="text-[#475467] hover:text-[#FF6934] transition-colors cursor-pointer">
              <Edit3 size={18} /> 
           </button>
           <button className="flex items-center gap-2 text-[14px] font-bold text-[#475467] hover:text-[#FF6934] transition-colors cursor-pointer">
              <Sparkles size={18} /> Improve with AI
           </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-[#FFF8F5] p-5 md:p-6 rounded-xl border border-[#FF693415] shadow-sm">
           <div className="flex items-center gap-2 mb-3 text-[#FF6934] font-medium text-[15px]">
              <Sparkles size={18} className="text-[#FF6934]" /> AI-improved version
           </div>
           <p className="text-[14px] md:text-[15px] text-[#475467] leading-relaxed font-body mb-6">
              Passionate product designer with a track record of shipping impactful features used by millions. I thrive at the intersection of design, technology, and human psychology.
              <br /><br />
              With over 8 years of experience in product design, I specialize in creating intuitive, user-centered interfaces that drive business results. My approach combines deep user research, rapid prototyping, and data-driven decision making to deliver exceptional digital experiences.
           </p>
           <div className="flex items-center gap-1">
              <button className="px-5 py-2 bg-[#FF6934] text-white rounded-[8px] text-[14px] font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-sm">Accept</button>
              <button className="px-4 py-2 text-[#475467] rounded-[8px] text-[14px] font-medium hover:bg-gray-50 transition-colors cursor-pointer">Decline</button>
           </div>
        </div>
      </div>
    </div>
  );
}
