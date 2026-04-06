import Header from './components/Header';
import StepsGrid from './components/StepsGrid';
import ProTipBanner from './components/ProTipBanner';

export default function CandidateDashboard() {
  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen">
      <Header />
      <StepsGrid />
      <ProTipBanner />
    </div>
  );
}
