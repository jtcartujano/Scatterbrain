import type { Thread } from '../../lib/mockData';

const CARD_SIZES: Record<Thread['size'], number> = {
  small: 32,
  medium: 40,
  large: 48,
};

interface ImageFanProps {
  images: string[];
  size: Thread['size'];
}

/**
 * Playing-card style overlap — up to three images, each rotated a few degrees
 * around the centre. A fourth blank card stands in for "and more" rather than
 * showing a fourth image, so the count never competes with the pictures.
 */
export function ImageFan({ images, size }: ImageFanProps) {
  const cardSize = CARD_SIZES[size];
  const shown = images.slice(0, 3);
  // A 4th card (null = placeholder) appears only when there's more to show beyond the first 3.
  const cards: (string | null)[] = images.length > 3 ? [...shown, null] : shown;
  const mid = (cards.length - 1) / 2;

  return (
    <div className="flex items-center justify-center" style={{ height: cardSize }}>
      {cards.map((src, index) => (
        <div
          key={index}
          className="rounded-md border-2 flex-shrink-0"
          style={{
            width: cardSize,
            height: cardSize,
            marginLeft: index === 0 ? 0 : -cardSize * 0.5,
            transform: `rotate(${(index - mid) * 9}deg)`,
            borderColor: 'var(--color-surface)',
            backgroundImage: src
              ? `url(${src})`
              : 'var(--color-fan-placeholder)', // blank grey-to-white "more" placeholder
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: 'var(--shadow-fan-card)',
            zIndex: cards.length - index,
          }}
        />
      ))}
    </div>
  );
}
