import Header from './components/Header';
import StepsGrid from './components/StepsGrid';
import ProTipBanner from './components/ProTipBanner';

interface CandidateDashboardProps {
  onCvUploaded?: () => Promise<boolean> | Promise<void> | boolean | void;
}

export default function CandidateDashboard({ onCvUploaded }: CandidateDashboardProps) {
  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen">
      <Header />
      <StepsGrid onCvUploaded={onCvUploaded} />
      <ProTipBanner />
    </div>
  );
}
