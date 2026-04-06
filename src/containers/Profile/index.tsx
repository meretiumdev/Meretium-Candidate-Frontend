import Header from './components/Header';
import StrengthCard from './components/StrengthCard';
import AboutSection from './components/AboutSection';
import ExperienceSection from './components/ExperienceSection';
import SkillsSection from './components/SkillsSection';
import CVSection from './components/CVSection';
import JobPreferences from './components/JobPreferences';
import SidebarStats from './components/SidebarStats';

export default function Profile() {
  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Header />
          <StrengthCard />
          <AboutSection />
          <ExperienceSection />
          <SkillsSection />
          <CVSection />
          <JobPreferences />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <SidebarStats />
        </div>

      </div>
    </div>
  );
}
