import type { User } from '../../lib/mockData';

interface ParticipantStackProps {
  participants: User[];
  /** Disc diameter. Every call site picks a different one. */
  size: number;
  /** How far each disc slides under the one before it. */
  overlap: number;
  /** Discs drawn before the overflow chip takes over. */
  max: number;
  /** The chip's background. Grid cards use `--fill-chip`; everything else `--fill-mist`. */
  chipFill: string;
  /**
   * Which end of the stack sits on top. `last-on-top` is the DOM's own answer and
   * what the bubble and the grid card draw; the preview panel reverses it. Kept as
   * a prop rather than picked because the two were already drawn differently, and
   * unifying them here would restyle an approved surface by accident.
   */
  stackOrder?: 'last-on-top' | 'first-on-top';
}

/**
 * The overlapping avatar discs plus a `+N` chip — the one piece of thread
 * furniture that appears on all three thread surfaces.
 *
 * Colours come off the participant directly. Avatars are flat colour discs with
 * no image, and the ring cut out of each one is Surface, so a stack only reads
 * correctly on a Surface-coloured face.
 */
export function ParticipantStack({
  participants,
  size,
  overlap,
  max,
  chipFill,
  stackOrder = 'last-on-top',
}: ParticipantStackProps) {
  if (participants.length === 0) return null;

  const shown = participants.slice(0, max);
  const hidden = participants.length - shown.length;
  const disc = {
    width: `${size}px`,
    height: `${size}px`,
    borderColor: 'var(--color-surface)',
  };

  return (
    <div className="flex shrink-0 items-center">
      {shown.map((participant, index) => (
        <div
          key={participant.id}
          className="rounded-full border-2"
          style={{
            ...disc,
            backgroundColor: participant.color,
            marginLeft: index > 0 ? `-${overlap}px` : 0,
            zIndex: stackOrder === 'first-on-top' ? participants.length - index : undefined,
          }}
        />
      ))}
      {hidden > 0 && (
        <div
          className="flex items-center justify-center rounded-full border-2 font-semibold"
          style={{
            ...disc,
            marginLeft: `-${overlap}px`,
            fontSize: 'var(--text-xs)',
            backgroundColor: chipFill,
            color: 'var(--color-ink)',
          }}
        >
          +{hidden}
        </div>
      )}
    </div>
  );
}
