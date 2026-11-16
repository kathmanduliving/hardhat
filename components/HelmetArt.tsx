/**
 * Vector stand-in for product photography: a full-face shell tinted with the
 * product's colour. Used wherever a helmet has no `images` yet.
 */
export function HelmetArt({
  seed,
  hex,
  className,
}: {
  /** Unique per instance — gradient ids must not collide in one document. */
  seed: string;
  hex: string;
  className?: string;
}) {
  const shell = `shell-${seed}`;
  const visor = `visor-${seed}`;
  const glow = `glow-${seed}`;

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Helmet illustration"
    >
      <defs>
        <radialGradient id={shell} cx="36%" cy="24%" r="78%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="42%" stopColor={hex} />
          <stop offset="100%" stopColor="#09090b" />
        </radialGradient>
        <linearGradient id={visor} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d0d10" />
          <stop offset="55%" stopColor="#17171c" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>
        <radialGradient id={glow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff5a1f" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ff5a1f" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="104" r="92" fill={`url(#${glow})`} />

      {/* shell */}
      <path
        d="M100 16c45 0 78 33 78 86 0 33-9 60-26 73-13 10-32 13-52 13s-39-3-52-13c-17-13-26-40-26-73 0-53 33-86 78-86Z"
        fill={`url(#${shell})`}
      />

      {/* visor opening */}
      <path
        d="M39 92c13-18 109-18 122 0 2 20-6 38-18 45H57c-12-7-20-25-18-45Z"
        fill={`url(#${visor})`}
      />
      <path
        d="M47 90c14-12 92-12 106 0 1 6-1 11-4 13-26-9-72-9-98 0-3-2-5-7-4-13Z"
        fill="#ffffff"
        opacity="0.16"
      />

      {/* chin vent */}
      <rect x="78" y="156" width="44" height="12" rx="6" fill="#09090b" opacity="0.65" />
      <rect x="86" y="159" width="28" height="2" rx="1" fill="#ffffff" opacity="0.22" />

      {/* brow vents */}
      <rect x="66" y="56" width="26" height="7" rx="3.5" fill="#09090b" opacity="0.5" />
      <rect x="108" y="56" width="26" height="7" rx="3.5" fill="#09090b" opacity="0.5" />

      {/* shell edge light */}
      <path
        d="M100 16c45 0 78 33 78 86 0 33-9 60-26 73-13 10-32 13-52 13s-39-3-52-13c-17-13-26-40-26-73 0-53 33-86 78-86Z"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.14"
        strokeWidth="1.5"
      />
    </svg>
  );
}
