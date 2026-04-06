import { useState } from 'react';
import { FileText, Trash2, Edit3, UploadCloud, Star } from 'lucide-react';
import RenameCVModal from './RenameCVModal';
import DeleteCVModal from './DeleteCVModal';
import UploadCVModal from '../../../components/UploadCVModal';

export default function CVSection() {
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const cvs = [
    { name: 'Frontend_Designer_CV.pdf', date: 'Uploaded 2 days ago', default: true },
    { name: 'Product_Designer_CV.pdf', date: 'Uploaded 1 week ago', default: false },
    { name: 'General_CV.pdf', date: 'Uploaded 2 weeks ago', default: false }
  ];

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6 font-manrope transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-[18px] md:text-[20px] font-bold text-[#101828] w-full sm:w-auto">My CVs</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto flex justify-center items-center gap-2 border border-[#E4E7EC] px-4 py-2.5 rounded-[10px] text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors bg-white cursor-pointer"
        >
          <UploadCloud size={18} /> Upload CV
        </button>
      </div>

      <div className="space-y-4">
        {cvs.map((cv) => (
          <div key={cv.name} className="p-4 bg-white border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-gray-50/50 hover:shadow-md cursor-pointer group">
             <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                <div className="size-11 bg-[#FFF4EC] rounded-[8px] flex items-center justify-center text-[#FF6934] shrink-0">
                   <FileText size={20} />
                </div>
                <div className="min-w-0 flex-1">
                   <h3 className="text-[14px] md:text-[15px] font-medium text-[#101828] flex flex-wrap items-center gap-2">
                      <span className="truncate max-w-[90%] sm:max-w-[70%]">{cv.name}</span>
                      {cv.default && <span className="shrink-0 bg-[#D1FADF]/50 text-[#039855] text-[12px] font-medium px-2.5 py-0.5 rounded-full">Default</span>}
                   </h3>
                   <p className="text-[13px] font-medium text-[#98A2B3] mt-0.5">{cv.date}</p>
                </div>
             </div>

             <div className="flex items-center justify-end gap-5 sm:gap-4 shrink-0 sm:ml-4">
                {!cv.default && (
                  <button className="text-[#98A2B3] hover:text-gray-600 transition-colors cursor-pointer"><Star size={18} /></button>
                )}
                <button 
                  onClick={() => setRenameTarget(cv.name)}
                  className="text-[#98A2B3] hover:text-gray-600 transition-colors cursor-pointer"
                ><Edit3 size={18} /></button>
                <button 
                  onClick={() => setDeleteTarget(cv.name)}
                  className="text-[#FF5B5B] hover:opacity-80 transition-opacity cursor-pointer"
                ><Trash2 size={18} /></button>
             </div>
          </div>
        ))}
      </div>
      </div>

      <RenameCVModal 
        isOpen={!!renameTarget} 
        onClose={() => setRenameTarget(null)} 
        cvName={renameTarget || ''} 
      />
      <DeleteCVModal 
        isOpen={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)} 
        cvName={deleteTarget || ''} 
      />
      <UploadCVModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
