import Navbar from './Navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <Navbar />
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}
