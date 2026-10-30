import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import { MainLayout } from './components/MainLayout';
import { ServerSidebar } from './features/servers/ServerSidebar';
import { ChannelView } from './features/channels/ChannelView';
import { ChannelInfoPanel } from './features/channels/ChannelInfoPanel';
import { ThreadDetailView } from './features/threads/ThreadDetailView';
import { ThreadInfoPanel } from './features/threads/ThreadInfoPanel';
import type { Message, Thread } from './lib/mockData';
import { appendReply, currentUser, mockServers, mockThreads } from './lib/mockData';

/**
 * Stands in for a server round-trip. A reply is appended immediately and marked
 * pending, then confirms — which is what optimistic append will mean once there
 * is something to confirm it. Realtime replaces this timer, not the state.
 */
const CONFIRM_DELAY = 450;

function App() {
  // c4 (#brainstorm) is the only channel with threads — booting anywhere else
  // shows an empty canvas.
  const [activeChannelId, setActiveChannelId] = useState('c4');

  // Threads live here rather than being read from the module, because three
  // things write to them — appending a reply, clearing unread on open, and
  // creating a thread (2.5). This is also where Phase 3's query result lands, so
  // the shape is already right for the swap.
  const [threads, setThreads] = useState<Thread[]>(mockThreads);

  /**
   * The thread open in full, or null for the channel's own view.
   *
   * A bare id rather than the thread itself, and held beside `activeChannelId`
   * rather than inside `ChannelView`: both are exactly the shape of a route
   * param, so Phase 3's conversion to `/channels/:channelId/threads/:threadId`
   * is mechanical rather than a rewrite.
   */
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);

  /**
   * The reply the `new` divider sits after, captured when the thread is opened.
   *
   * It has to be captured *here*, before the unread flag is cleared, and it
   * cannot be derived inside the view. Opening sets `openThreadId` and clears
   * `isUnread` in the same batch, so by the time the view first renders the
   * thread already reads as read — an initialiser down there sees nothing to
   * mark. The screenshots caught this; nothing about it is visible in types.
   */
  const [dividerAfterId, setDividerAfterId] = useState<string | null>(null);

  const timers = useRef<number[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(window.clearTimeout);
  }, []);

  const activeChannel = mockServers
    .flatMap((s) => s.channels)
    .find((c) => c.id === activeChannelId);

  const channelThreads = threads.filter((t) => t.channelId === activeChannelId);
  const openThread = threads.find((t) => t.id === openThreadId) ?? null;

  const updateThread = useCallback((threadId: string, change: (thread: Thread) => Thread) => {
    setThreads((current) =>
      current.map((thread) => (thread.id === threadId ? change(thread) : thread)),
    );
  }, []);

  /**
   * Unread clears here and nowhere else — opening a thread in full, never
   * previewing it. That rule is what lets the preview panel's kicker say
   * `unread` honestly, and this is the first code that has ever enforced it.
   *
   * `lastReadMessageId` moves to the newest reply at the same time. The divider
   * a reader is currently looking at survives because the open view captured its
   * position on entry rather than reading this live.
   */
  const handleOpenThread = useCallback(
    (threadId: string) => {
      const opening = threads.find((thread) => thread.id === threadId);
      setDividerAfterId(
        opening?.isUnread ? (opening.lastReadMessageId ?? null) : null,
      );
      setOpenThreadId(threadId);
      updateThread(threadId, (thread) =>
        thread.isUnread
          ? {
              ...thread,
              isUnread: false,
              lastReadMessageId: thread.messages[thread.messages.length - 1]?.id,
            }
          : thread,
      );
    },
    [threads, updateThread],
  );

  const handleChannelSelect = useCallback((channelId: string) => {
    setActiveChannelId(channelId);
    // A thread belongs to the channel it was opened from; picking another one
    // leaves it rather than stranding an unrelated thread over a new channel.
    setOpenThreadId(null);
  }, []);

  const handleSendReply = useCallback(
    (threadId: string, content: string) => {
      const message: Message = {
        id: `${threadId}-m${Date.now()}`,
        authorId: currentUser.id,
        content,
        timestamp: new Date(),
        pending: true,
      };

      // Through `appendReply` rather than pushing onto `messages`: replyCount,
      // participants and lastActivity are all derived, and they hold by
      // construction only for as long as everything goes through one place.
      updateThread(threadId, (thread) => appendReply(thread, message));

      timers.current.push(
        window.setTimeout(() => {
          updateThread(threadId, (thread) => ({
            ...thread,
            messages: thread.messages.map((m) =>
              m.id === message.id ? { ...m, pending: false } : m,
            ),
          }));
        }, CONFIRM_DELAY),
      );
    },
    [updateThread],
  );

  return (
    <MainLayout
      sidebar={
        <ServerSidebar
          servers={mockServers}
          activeChannelId={activeChannelId}
          onChannelSelect={handleChannelSelect}
        />
      }
      main={
        openThread && activeChannel ? (
          <ThreadDetailView
            thread={openThread}
            channel={activeChannel}
            dividerAfterId={dividerAfterId}
            onBack={() => setOpenThreadId(null)}
            onSendReply={(content) => handleSendReply(openThread.id, content)}
          />
        ) : (
          activeChannel && (
            <ChannelView
              channel={activeChannel}
              threads={channelThreads}
              onOpenThread={handleOpenThread}
            />
          )
        )
      }
      rightPanel={
        openThread ? (
          <ThreadInfoPanel thread={openThread} />
        ) : (
          activeChannel && <ChannelInfoPanel channel={activeChannel} threads={channelThreads} />
        )
      }
    />
  );
}

export default App;
