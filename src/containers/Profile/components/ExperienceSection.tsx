import { useState } from 'react';
import { Sparkles, Building2, GripVertical, Edit3, Plus, Trash2 } from 'lucide-react';
import AddExperienceModal from './AddExperienceModal';
import DeleteExperienceModal from './DeleteExperienceModal';

export default function ExperienceSection() {
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [activeAIId, setActiveAIId] = useState<number | null>(null);
  
  const experiences = [
    {
      id: 1,
      role: 'Senior Product Designer',
      company: 'Stripe',
      duration: '2021 - Present · 3 years',
      bullets: [
        'Led design for new payment dashboard, increasing merchant satisfaction by 35%',
        'Established design system used across 12 product teams',
        'Mentored 4 junior designers, 2 promoted to mid-level'
      ],
      aiDraft: {
        text: 'AI will analyze this role and suggest impactful achievements to highlight.',
        button: 'Improve now'
      }
    },
    {
      id: 2,
      role: 'Product Designer',
      company: 'Airbnb',
      duration: '2018 - 2021 · 3 years',
      bullets: [
        'Redesigned host onboarding flow, reducing drop-off by 28%',
        'Shipped mobile-first booking experience reaching 10M+ users',
        'Collaborated with engineers on React component library'
      ],
      aiDraft: {
        text: 'AI will analyze this role and suggest impactful achievements to highlight.',
        button: 'Improve now'
      }
    },
    {
      id: 3,
      role: 'UX Designer',
      company: 'Figma',
      duration: '2016 - 2018 · 2 years',
      bullets: [
        'Designed prototyping features used by 500k+ designers',
        'Conducted user research with 100+ design teams',
        'Contributed to Figma\'s public design system documentation'
      ],
      aiDraft: {
        text: 'AI will analyze this role and suggest impactful achievements to highlight.',
        button: 'Improve now'
      }
    }
  ];

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6 font-manrope transition-all duration-300">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[18px] md:text-[20px] font-bold text-[#101828]">Experience</h2>
        <button 
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 text-[14px] font-medium text-[#475467] hover:text-gray-900 transition-colors cursor-pointer"
        >
           <Plus size={18} className="text-[#475467]" /> Add experience
        </button>
      </div>

      <div className="flex flex-col">
        {experiences.map((exp, index) => (
          <div key={exp.id} className={`flex gap-4 md:gap-5 ${index !== experiences.length - 1 ? 'border-b border-gray-200 pb-8 mb-8' : ''}`}>
             {/* Timeline dot/icon */}
             <div className="flex flex-col items-center shrink-0">
                <div className="size-11 bg-[#FFF4EC] rounded-full flex items-center justify-center">
                   <Building2 size={20} className="text-[#FF6934]" />
                </div>
                {index !== experiences.length - 1 && <div className="w-[1px] h-[40px] bg-[#E4E7EC] mt-2"></div>}
             </div>

             {/* Main Content */}
             <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                   <div>
                      <h3 className="text-[16px] font-semibold text-[#101828] mb-1">{exp.role}</h3>
                      <p className="text-[15px] font-medium text-[#475467] mb-1">{exp.company}</p>
                      <p className="text-[14px] font-medium text-[#98A2B3]">{exp.duration}</p>
                   </div>
                   <div className="flex items-center gap-4 shrink-0">
                      <button className="text-[#98A2B3] hover:text-gray-600 transition-colors cursor-pointer"><GripVertical size={18} /></button>
                      <button 
                        onClick={() => setEditTarget(exp)}
                        className="text-[#475467] hover:text-gray-900 transition-colors cursor-pointer"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => setActiveAIId(activeAIId === exp.id ? null : exp.id)}
                        className={`transition-colors cursor-pointer ${activeAIId === exp.id ? 'text-[#FF6934]' : 'text-[#98A2B3] hover:text-[#FF6934]'}`}
                      >
                        <Sparkles size={18} />
                      </button>
                      <button 
                        onClick={() => setDeleteTarget(exp.id)}
                        className="text-[#FF5B5B] hover:opacity-80 transition-opacity cursor-pointer"
                      >
                         <Trash2 size={18} />
                      </button>
                   </div>
                </div>

                <div className="mt-5 space-y-3">
                   {exp.bullets.map((b, i) => (
                      <div key={i} className="flex flex-row items-start gap-2">
                         <div className="size-[5px] rounded-full bg-[#FF6934] shrink-0 mt-[8px]"></div>
                         <p className="text-[14px] text-[#475467] font-medium leading-relaxed">{b}</p>
                      </div>
                   ))}
                </div>

                {exp.aiDraft && activeAIId === exp.id && (
                   <div className="mt-6 bg-[#FFF8F5] border border-[#FF693415] rounded-xl p-5 shadow-sm animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2 mb-3 text-[#FF6934] font-medium text-[15px]">
                         <Sparkles size={18} className="text-[#FF6934]" /> AI Improvement
                      </div>
                      <p className="text-[14px] font-medium text-[#475467] mb-5 leading-relaxed">
                         {exp.aiDraft.text}
                      </p>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2">
                         <button className="flex-1 sm:flex-none justify-center px-5 py-2 bg-[#FF6934] text-white rounded-[8px] text-[14px] font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-sm flex items-center gap-2">
                            <Sparkles size={16} /> {exp.aiDraft.button}
                         </button>
                         <button 
                           onClick={() => setActiveAIId(null)}
                           className="flex-1 sm:flex-none justify-center px-4 py-2 text-[#475467] rounded-[8px] text-[14px] font-medium hover:bg-gray-50 transition-colors cursor-pointer text-center"
                         >
                            Cancel
                         </button>
                      </div>
                   </div>
                )}
             </div>
          </div>
        ))}
      </div>
      </div>

      <AddExperienceModal
        isOpen={isAddModalOpen || !!editTarget}
        onClose={() => { setAddModalOpen(false); setEditTarget(null); }}
        experience={editTarget}
      />
      <DeleteExperienceModal 
        isOpen={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)} 
        experienceId={deleteTarget} 
      />
    </>
  );
}
