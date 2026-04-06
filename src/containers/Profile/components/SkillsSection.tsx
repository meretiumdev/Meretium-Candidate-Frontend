import { useState } from 'react';
import { Plus, Flame } from 'lucide-react';
import AddSkillModal from './AddSkillModal';

export default function SkillsSection() {
  const [isModalOpen, setModalOpen] = useState(false);

  const sections = [
    {
      title: 'Core Skills',
      skills: [
        { name: 'Product Design', hot: true, progress: 85 },
        { name: 'Design Systems', hot: true, progress: 80 },
        { name: 'User Research', hot: false, progress: 65 },
        { name: 'Prototyping', hot: false, progress: 75 }
      ]
    },
    {
      title: 'Tools & Technologies',
      skills: [
        { name: 'Figma', hot: true, progress: 95 },
        { name: 'React', hot: true, progress: 70 },
        { name: 'TypeScript', hot: true, progress: 60 },
        { name: 'Sketch', hot: false, progress: 45 }
      ]
    },
    {
      title: 'Soft Skills',
      skills: [
        { name: 'Leadership', hot: false, progress: 85 },
        { name: 'Communication', hot: false, progress: 95 },
        { name: 'Problem Solving', hot: false, progress: 90 },
        { name: 'Collaboration', hot: false, progress: 90 }
      ]
    }
  ];

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6 font-manrope transition-all duration-300">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[18px] md:text-[20px] font-bold text-[#101828]">Skills</h2>
          <button 
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 text-[14px] font-bold text-[#475467] hover:text-[#FF6934] transition-colors cursor-pointer"
          >
             <Plus size={18} className="text-[#475467]" /> Add skill
          </button>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-[14px] font-bold text-[#667085] uppercase tracking-wider mb-4">{section.title}</h4>
              <div className="flex flex-wrap gap-3">
                {section.skills.map((skill) => (
                  <div 
                    key={skill.name}
                    className="bg-[#F9FAFB] border border-gray-200 rounded-xl px-4 py-3 flex flex-col gap-2.5 hover:border-[#FF6934] transition-all cursor-pointer shadow-sm group min-w-[140px]"
                  >
                    <div className="flex items-center gap-2">
                       <span className="text-[14px] font-medium text-[#101828]">{skill.name}</span>
                       {skill.hot && <Flame size={15} className="text-[#FF6934]" />}
                    </div>
                    <div className="h-[4px] w-full bg-[#E4E7EC] rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-[#FF6934] rounded-full transition-all duration-500"
                         style={{ width: `${skill.progress}%` }}
                       ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <AddSkillModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
