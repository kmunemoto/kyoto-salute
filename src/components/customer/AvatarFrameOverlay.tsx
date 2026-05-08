import { getFrameImage } from "@/hooks/useFrames";

interface Props {
  frameKey?: string | null;
  /** Scale factor relative to parent container (default 1.18). */
  scale?: number;
  className?: string;
}

/**
 * Renders a decorative frame image overlay over an avatar container.
 * Place inside a `position: relative` parent and the frame will fill it.
 */
const AvatarFrameOverlay = ({ frameKey, scale = 1.18, className }: Props) => {
  const src = getFrameImage(frameKey);
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      className={`pointer-events-none absolute inset-0 w-full h-full object-contain z-30 ${className || ""}`}
      style={{ transform: `scale(${scale})` }}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
};

export default AvatarFrameOverlay;