export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
      <circle cx="48" cy="48" r="44" className="fill-leaf-soft" />
      <ellipse cx="48" cy="70" rx="17" ry="4.5" className="fill-leaf" opacity="0.5" />
      <path
        d="M48 69 C48 58 48 50 48 38"
        className="stroke-leaf-deep"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M48 54 C37 52 29.5 43 28.5 31 C41 33 47.5 42 48 54 Z"
        className="fill-leaf"
      />
      <path
        d="M48 46 C59 44 66.5 35 67.5 23 C55 25 48.5 34 48 46 Z"
        className="fill-leaf-deep"
      />
    </svg>
  );
}
