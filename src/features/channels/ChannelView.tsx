import { useState } from 'react';
import type { Channel, Thread } from '../../lib/mockData';
import { ChannelHeader } from './ChannelHeader';
import { ThreadCanvas } from '../threads/ThreadCanvas';
import { ThreadPreviewPanel } from '../threads/ThreadPreviewPanel';

interface ChannelViewProps {
  channel: Channel;
  threads: Thread[];
}

/**
 * Owns the main content region for a channel: header, optional thread preview,
 * and the canvas. The preview lives here rather than in a `MainLayout` slot so
 * the app shell stays a generic three-slot frame — Friends, DMs and Settings all
 * render into the same slot and have no use for a preview.
 */
export function ChannelView({ channel, threads }: ChannelViewProps) {
  const [previewThreadId, setPreviewThreadId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'canvas' | 'grid'>('canvas');

  const previewThread = threads.find((thread) => thread.id === previewThreadId) ?? null;

  // One click previews. A second click on the *same* bubble opens the thread.
  const handleThreadClick = (threadId: string) => {
    if (previewThreadId === threadId) {
      console.log('Open thread:', threadId);
      // Future: navigate to the open thread view (roadmap 2.4)
      return;
    }
    setPreviewThreadId(threadId);
  };

  const handleNewThread = () => {
    console.log('New thread clicked');
    // Future: open new thread modal (roadmap 2.5)
  };

  return (
    <>
      <ChannelHeader
        channel={channel}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNewThread={handleNewThread}
      />

      {previewThread && (
        <ThreadPreviewPanel
          thread={previewThread}
          onDismiss={() => setPreviewThreadId(null)}
        />
      )}

      <ThreadCanvas threads={threads} onThreadClick={handleThreadClick} />
    </>
  );
}
