import { useState } from 'react';
import './App.css';
import { MainLayout } from './components/MainLayout';
import { ServerSidebar } from './features/servers/ServerSidebar';
import { ChannelView } from './features/channels/ChannelView';
import { ChannelInfoPanel } from './features/channels/ChannelInfoPanel';
import { mockServers, mockThreads } from './lib/mockData';

function App() {
  // c4 (#brainstorm) is the only channel with threads — booting anywhere else
  // shows an empty canvas.
  const [activeChannelId, setActiveChannelId] = useState('c4');

  const activeChannel = mockServers
    .flatMap((s) => s.channels)
    .find((c) => c.id === activeChannelId);

  const channelThreads = mockThreads.filter((t) => t.channelId === activeChannelId);

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
        activeChannel && <ChannelView channel={activeChannel} threads={channelThreads} />
      }
      rightPanel={activeChannel && <ChannelInfoPanel channel={activeChannel} />}
    />
  );
}

export default App;
