import type { Thread } from '../../lib/mockData';
import { useSettings } from '../../hooks/useSettings';

interface ThreadInfoPanelProps {
  thread: Thread;
  onCollapse?: () => void;
}

/**
 * The right panel while a thread is open.
 *
 * It replaces `ChannelInfoPanel` rather than extending it: leaving 24 channel
 * members listed beside a seven-person conversation is misleading, and its
 * **Pinned** section would be pointing at the thread already filling the screen.
 *
 * **Settled** after review against the running app. It stays a separate component
 * rather than becoming a branch inside the channel panel: the two show different
 * things about different subjects, and a branch would thread that difference
 * through a surface that already works.
 *
 * Deliberately built from the channel panel's own idiom: same heading weight,
 * same mono section label, same 22px disc and 14px name, same collapse glyph.
 */
export function ThreadInfoPanel({ thread, onCollapse }: ThreadInfoPanelProps) {
  const { compact } = useSettings();

  return (
    <div className="flex h-full flex-col">
      <div
        className={`flex flex-shrink-0 items-center justify-between ${
          compact ? 'px-3 py-2.5' : 'px-4 py-3.5'
        }`}
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <h2
          className={`font-bold ${compact ? 'text-[12px]' : 'text-[13.5px]'}`}
          style={{ color: 'var(--color-ink)' }}
        >
          Thread info
        </h2>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className={compact ? 'text-xs leading-none' : 'text-sm leading-none'}
            style={{ color: 'var(--color-mist)' }}
            aria-label="Collapse thread info"
          >
            »
          </button>
        )}
      </div>

      <div
        className={`flex flex-col ${compact ? 'gap-2 px-3 py-3' : 'gap-2.5 px-4 py-3.5'}`}
      >
        <div
          className="uppercase font-bold tracking-wide"
          style={{
            fontSize: compact ? 'var(--text-xs)' : 'var(--text-sm)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-mist)',
          }}
        >
          Participants — {thread.participants.length}
        </div>

        {thread.participants.map((participant) => (
          <div key={participant.id} className="flex items-center gap-2.5">
            <span
              className="shrink-0 rounded-full"
              style={{
                width: compact ? 18 : 22,
                height: compact ? 18 : 22,
                backgroundColor: participant.color,
              }}
            />
            <span
              style={{
                fontSize: compact ? 'var(--text-lg)' : 'var(--text-xl)',
                color: 'var(--color-ink)',
              }}
            >
              {participant.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
