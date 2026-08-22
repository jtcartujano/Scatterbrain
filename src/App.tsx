import { useState } from 'react';
import './App.css';
import { MainLayout } from './components/MainLayout';
import { ServerSidebar } from './features/servers/ServerSidebar';
import { ChannelHeader } from './features/channels/ChannelHeader';
import { ChannelInfoPanel } from './features/channels/ChannelInfoPanel';
import { ThreadCanvas } from './features/threads/ThreadCanvas';
import { mockServers, mockThreads } from './lib/mockData';

function App() {
  // c4 (#brainstorm) is the only channel with threads — booting anywhere else
  // shows an empty canvas.
  const [activeChannelId, setActiveChannelId] = useState('c4');
  const [viewMode, setViewMode] = useState<'canvas' | 'grid'>('canvas');

  const activeChannel = mockServers
    .flatMap((s) => s.channels)
    .find((c) => c.id === activeChannelId);

  const channelThreads = mockThreads.filter((t) => t.channelId === activeChannelId);

  const handleThreadClick = (threadId: string) => {
    console.log('Thread clicked:', threadId);
    // Future: Navigate to thread detail view
  };

  const handleNewThread = () => {
    console.log('New thread clicked');
    // Future: Open new thread modal
  };

  return (
    <MainLayout
      sidebar={
        <ServerSidebar
          servers={mockServers}
          activeChannelId={activeChannelId}
          onChannelSelect={setActiveChannelId}
        />
      }
      main={
        <>
          {activeChannel && (
            <>
              <ChannelHeader
                channel={activeChannel}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onNewThread={handleNewThread}
              />
              <ThreadCanvas threads={channelThreads} onThreadClick={handleThreadClick} />
            </>
          )}
        </>
      }
      rightPanel={activeChannel && <ChannelInfoPanel channel={activeChannel} />}
    />
  );
}

export default App;
