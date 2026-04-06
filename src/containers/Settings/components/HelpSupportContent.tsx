import React from 'react';
import HelpCenterSection from './HelpSections/HelpCenterSection';
import ContactSupportSection from './HelpSections/ContactSupportSection';
import ReportBugSection from './HelpSections/ReportBugSection';

export default function HelpSupportContent() {
  const [expandedSection, setExpandedSection] = React.useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = React.useState<string | null>(null);
  const [supportStep, setSupportStep] = React.useState(1);

  const handleSectionToggle = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
      setSelectedArticle(null);
      setSupportStep(1);
    }
  };

  return (
        <div className="flex-1 font-manrope animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="mb-8 px-1">
        <h1 className="text-xl md:text-[32px] font-semibold text-[#101828] mb-1">Help & Support</h1>
        <p className="text-[#475467] text-[14px]">Get help and send feedback</p>
      </div>

      <div className="space-y-4">
        {/* Help Center Section */}
        <HelpCenterSection 
          expanded={expandedSection === 'Help Center'}
          onToggle={() => handleSectionToggle('Help Center')}
          selectedArticle={selectedArticle}
          onSelectArticle={setSelectedArticle}
          onBackToTopics={() => setSelectedArticle(null)}
        />

        {/* Contact Support Section */}
        <ContactSupportSection 
          expanded={expandedSection === 'Contact Support'}
          onToggle={() => handleSectionToggle('Contact Support')}
          supportStep={supportStep}
          onSetSupportStep={setSupportStep}
        />

        {/* Report a Bug Section */}
        <ReportBugSection 
          expanded={expandedSection === 'Report a Bug'}
          onToggle={() => handleSectionToggle('Report a Bug')}
        />
      </div>
    </div>
  );
}
