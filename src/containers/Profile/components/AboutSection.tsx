import { Sparkles, Edit3 } from 'lucide-react';
import { useState } from 'react';

export default function AboutSection() {
  const [isImproving, setIsImproving] = useState(false);
  const [isEditingLocal, setIsEditingLocal] = useState(false);
  const [aboutText, setAboutText] = useState("Passionate product designer with a track record of shipping impactful features used by millions. I thrive at the intersection of design, technology, and human psychology.");

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6 font-manrope transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[18px] md:text-[20px] font-semibold text-[#101828]">About</h2>
        {!isEditingLocal && (
          <div className="flex items-center gap-5">
            <button 
              onClick={() => setIsEditingLocal(true)}
              className="text-[#475467] hover:text-[#FF6934] transition-colors cursor-pointer"
            >
              <Edit3 size={18} />
            </button>
            <button 
              onClick={() => setIsImproving(!isImproving)}
              className={`flex items-center gap-2 text-[14px] font-bold transition-colors cursor-pointer ${isImproving ? 'text-[#FF6934]' : 'text-[#475467] hover:text-[#FF6934]'}`}
            >
              <Sparkles size={18} /> Improve with AI
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {isEditingLocal ? (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <textarea
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              className="w-full min-h-[120px] p-4 text-[14px] text-[#475467] font-medium leading-relaxed border border-[#EAECF0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 focus:border-[#FF6934] transition-all resize-none"
              placeholder="Tell us about yourself..."
            />
            <div className="flex items-center gap-4 mt-6">
              <button 
                onClick={() => setIsEditingLocal(false)}
                className="px-6 py-2.5 bg-[#FF6934] text-white rounded-[10px] text-[14px] font-semibold hover:opacity-90 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Save
              </button>
              <button 
                onClick={() => setIsEditingLocal(false)}
                className="px-4 py-2.5 text-[#475467] text-[14px] font-semibold hover:text-gray-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : !isImproving ? (
          <p className="text-[14px] text-[#475467] font-medium leading-relaxed font-body">
            {aboutText}
          </p>
        ) : (
          <div className="bg-[#FFF8F5] p-5 md:p-6 rounded-xl border border-[#FF6934]/10 shadow-sm animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-3 text-[#FF6934] font-medium text-[15px]">
              <Sparkles size={18} className="text-[#FF6934]" /> AI-improved version
            </div>
            <p className="text-[14px] text-[#475467] font-medium leading-relaxed font-body mb-6">
              {aboutText}
              <br /><br />
              With over 8 years of experience in product design, I specialize in creating intuitive, user-centered interfaces that drive business results. My approach combines deep user research, rapid prototyping, and data-driven decision making to deliver exceptional digital experiences.
            </p>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => {
                  setAboutText(aboutText + "\n\nWith over 8 years of experience in product design, I specialize in creating intuitive, user-centered interfaces that drive business results. My approach combines deep user research, rapid prototyping, and data-driven decision making to deliver exceptional digital experiences.");
                  setIsImproving(false);
                }}
                className="px-5 py-2 bg-[#FF6934] text-white rounded-[8px] text-[14px] font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
              >
                Accept
              </button>
              <button 
                onClick={() => setIsImproving(false)}
                className="px-4 py-2 text-[#475467] rounded-[8px] text-[14px] font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                Decline
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
