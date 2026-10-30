import { useLayoutEffect, useRef, useState } from 'react';

interface ThreadComposerProps {
  onSend: (content: string) => void;
}

/** Roughly five lines, after which the field scrolls rather than growing further. */
const MAX_HEIGHT = 112;

/**
 * Writing a reply. The first surface in the app that takes text at all.
 *
 * Pinned to the bottom of the region rather than scrolling with the list, which
 * is not really a choice — a composer that scrolls away is broken.
 *
 * It is chrome: rounded rect, hairline border, flat. No shadow, because only
 * thread nodes cast those, and there isn't one on this screen.
 */
export function ThreadComposer({ onSend }: ThreadComposerProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  // Grows with its content. Reset to `auto` first or the height only ever
  // ratchets upwards — `scrollHeight` can't shrink below the height already set.
  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${Math.min(field.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const trimmed = value.trim();

  const send = () => {
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <div
      className="shrink-0"
      style={{ padding: 'var(--space-3-5) var(--space-6) var(--space-4)' }}
    >
      {/* Fills the region, like the list above it — the two share a left and a
          right edge, so the thread reads as one column rather than two. */}
      <div
        className="flex items-end"
        style={{
          gap: 'var(--space-2-5)',
          padding: 'var(--space-2) var(--space-2) var(--space-2) var(--space-3-5)',
          backgroundColor: 'var(--color-surface)',
          // Achromatic on focus: Spark means selected-or-pinned and Signal means
          // new, both exclusively, so neither can also mean "typing here".
          border: `1px solid ${focused ? 'var(--border-focus)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-lg)',
          transition: 'var(--transition-colors)',
        }}
      >
        <textarea
          ref={fieldRef}
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          // Enter sends, Shift+Enter breaks the line. Replies here are a few
          // words, so the common case is the one that takes no modifier.
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          placeholder="Write a reply"
          aria-label="Write a reply"
          className="min-w-0 flex-1 resize-none bg-transparent outline-none"
          style={{
            padding: 'var(--space-1) 0',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-lg)',
            lineHeight: 'var(--leading-normal)',
            color: 'var(--color-ink)',
          }}
        />

        <button
          type="button"
          onClick={send}
          disabled={!trimmed}
          className="shrink-0 rounded-full"
          style={{
            padding: 'var(--space-1-5) var(--space-3-5)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--weight-semibold)',
            backgroundColor: 'var(--color-spark)',
            color: 'var(--color-void)',
            opacity: trimmed ? 1 : 'var(--opacity-disabled)',
            cursor: trimmed ? 'pointer' : 'default',
            transition: 'opacity var(--duration-fast) var(--ease-standard)',
          }}
        >
          Reply
        </button>
      </div>
    </div>
  );
}
