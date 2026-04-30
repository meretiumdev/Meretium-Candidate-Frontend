import React from 'react';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, children }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm font-manrope">
      <h2 className="text-[18px] md:text-[20px] font-bold text-[#101828] mb-6">{title}</h2>
      {children}
    </div>
  );
};
