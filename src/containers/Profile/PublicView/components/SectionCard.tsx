import React from 'react';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, children }) => {
  return (
    <section className="bg-white border border-[#E4E7EC] rounded-xl p-5 md:p-6 shadow-sm font-manrope">
      <h2 className="text-[15px] md:text-[16px] font-semibold text-[#101828] mb-6">{title}</h2>
      {children}
    </section>
  );
};
