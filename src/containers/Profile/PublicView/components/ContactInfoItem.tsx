import React from 'react';

interface ContactInfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export const ContactInfoItem: React.FC<ContactInfoItemProps> = ({ icon, label, value }) => {
  return (
    <div className="flex items-center gap-3 p-4 border border-[#EAECF0] rounded-xl">
      <div className="size-9 bg-[#FFF4EC] rounded-full flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[13px] font-semibold text-[#101828]">{label}</p>
        <p className="text-[14px] font-medium text-[#98A2B3]">{value}</p>
      </div>
    </div>
  );
};
