import Header from './components/Header';
import AboutCompany from './components/AboutCompany';
import JobDescription from './components/JobDescription';
import Responsibilities from './components/Responsibilities';
import Requirements from './components/Requirements';
import Benefits from './components/Benefits';
import SidebarActions from './components/SidebarActions';
import HowYouMatch from './components/HowYouMatch';

export default function JobDetail() {
  return (
      <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen">
      <div className="grid sm:mt-3 grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Left Content */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Header />
          <AboutCompany />
          <JobDescription />
          <Responsibilities />
          <Requirements />
          <Benefits />
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <SidebarActions />
          <HowYouMatch />
        </div>

      </div>
    </div>
  );
}
