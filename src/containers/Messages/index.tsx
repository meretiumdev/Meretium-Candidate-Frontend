import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

export default function Messages() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [view, setView] = useState<'list' | 'chat'>('list');

  // Handle auto-selection for desktop only
  useEffect(() => {
    if (window.innerWidth >= 768 && selectedId === null) {
      setSelectedId(2); // Michael Chen
    }
  }, [selectedId]);

  const handleSelect = (id: number) => {
    setSelectedId(id);
    setView('chat');
  };

  const handleBack = () => {
    setView('list');
  };

  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen">
      <div className="flex sm:mt-3 gap-0 md:gap-6 h-full min-h-[calc(100vh-160px)] relative">

        {/* Sidebar - Hidden on mobile if viewing chat */}
        <div className={`w-full md:w-96 shrink-0 ${view === 'chat' ? 'hidden md:block' : 'block'}`}>
          <Sidebar selectedId={selectedId} onSelect={handleSelect} />
        </div>

        {/* Chat Area - Hidden on mobile if viewing list */}
        <div className={`flex-1 ${view === 'list' ? 'hidden md:block' : 'block'}`}>
          <ChatArea selectedId={selectedId} onBack={handleBack} />
        </div>

      </div>
    </div>
  );
}
