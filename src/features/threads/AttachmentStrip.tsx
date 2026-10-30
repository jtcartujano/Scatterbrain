import type { Attachment } from '../../lib/mockData';

interface AttachmentStripProps {
  attachments: Attachment[];
  /**
   * Tile edge. 96 in the grouped layout, 64 inline — the density setting is
   * expressed by how big these are, never by how many are shown.
   */
  size: number;
}

/**
 * Media hanging off a single reply.
 *
 * What this standardises is **position and indent** — under the text, on the
 * text's own left edge — not tile shape. Images and video are tiles; a voice note
 * is a bar and a file is a row, because those are genuinely different media and
 * squaring them off would be a lie about what they are. So the per-kind branch
 * below is the design, not a stopgap.
 *
 * Attachments **wrap** rather than collapsing behind a `+N` chip, which is where
 * this parts company with the canvas fan and the grid card on purpose. Those
 * surfaces *index* a thread and you click through to see the rest; a reply is the
 * thing itself, so a chip there would mean clicking to finish reading a message.
 */
export function AttachmentStrip({ attachments, size }: AttachmentStripProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap" style={{ gap: 'var(--space-2)' }}>
      {attachments.map((attachment, index) => (
        <AttachmentTile
          key={`${attachment.url}-${index}`}
          attachment={attachment}
          size={size}
        />
      ))}
    </div>
  );
}

function AttachmentTile({ attachment, size }: { attachment: Attachment; size: number }) {
  switch (attachment.kind) {
    case 'image':
      return (
        <div
          role="img"
          aria-label={attachment.alt ?? 'Attached image'}
          className="shrink-0 bg-cover bg-center"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            backgroundImage: `url(${attachment.url})`,
          }}
        />
      );
    default: {
      // Adding a kind to `Attachment` stops this line compiling, which is the
      // whole reason the union carries a discriminant while it has one variant:
      // every new kind has to be drawn here before it can ship anywhere.
      //
      // The check is on `kind` rather than on `attachment`, and that is not a
      // stylistic choice — with one member `Attachment` is an object type, not a
      // union, so narrowing it here leaves it fully typed. The discriminant is a
      // one-value literal union, and excluding that value really does leave
      // `never`. It starts working on the object too the moment a second kind
      // lands, which is the only moment it matters.
      const unhandled: never = attachment.kind;
      void unhandled;
      return null;
    }
  }
}
