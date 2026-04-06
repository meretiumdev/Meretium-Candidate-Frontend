import Header from './components/Header';
import StatCards from './components/StatCards';
import StatusTabs from './components/StatusTabs';
import ApplicationsList from './components/ApplicationsList';

export default function Applications() {
  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen">
      <Header />
      <StatCards />
      <StatusTabs />
      <ApplicationsList />
    </div>
  );
}
