const TILE = 60;
const COLUMNS = 3;
const GAP = 6;
/** Two rows of three. Beyond that the label carries the count. */
const MAX_TILES = COLUMNS * 2;

interface ImageGridProps {
  images: string[];
}

/**
 * The preview panel's image block. Where the bubble face fans its images like
 * playing cards — a hint that there's something to look at — the panel lays them
 * out flat, because the panel is where you actually look.
 *
 * Chrome, like the rest of the panel: square tiles, conventional radius, hairline
 * borders, no rotation and no shadow.
 */
export function ImageGrid({ images }: ImageGridProps) {
  return (
    <div
      className="flex shrink-0 flex-col"
      style={{
        width: `${COLUMNS * TILE + (COLUMNS - 1) * GAP}px`,
        gap: 'var(--space-1-5)',
      }}
    >
      <div
        className="flex items-baseline justify-between uppercase"
        style={{
          fontSize: 'var(--text-xs-plus)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: 'var(--tracking-wide)',
          color: 'var(--color-mist)',
        }}
      >
        <span>Images</span>
        <span>{images.length}</span>
      </div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${COLUMNS}, ${TILE}px)`,
          gridAutoRows: `${TILE}px`,
          gap: `${GAP}px`,
        }}
      >
        {images.slice(0, MAX_TILES).map((src, index) => (
          <div
            key={index}
            style={{
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
      </div>
    </div>
  );
}
