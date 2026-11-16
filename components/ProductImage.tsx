import Image from "next/image";
import { HelmetArt } from "./HelmetArt.tsx";

/**
 * A photo when the product has one, vector art when it does not.
 * Always fills its container, so the parent must be `relative`.
 */
export function ProductImage({
  src,
  alt,
  seed,
  hex,
  sizes,
  priority,
  artClassName = "p-[12%]",
}: {
  src: string | undefined;
  alt: string;
  seed: string;
  hex: string;
  sizes: string;
  priority?: boolean;
  artClassName?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    );
  }
  return (
    <HelmetArt
      seed={seed}
      hex={hex}
      className={`absolute inset-0 size-full ${artClassName}`}
    />
  );
}
