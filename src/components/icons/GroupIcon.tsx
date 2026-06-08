interface GroupIconProps {
  className?: string;
}

/**
 * Tres personas en contorno (la del centro más grande) — ícono de
 * "Mis grupos" / "Sumate al grupo". Hereda el color via currentColor.
 */
export const GroupIcon = ({ className }: GroupIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* izquierda */}
    <circle cx="5.3" cy="9.8" r="2.15" />
    <path d="M1 20.5A5 5 0 0 1 8.28 16.05" />
    {/* derecha */}
    <circle cx="18.7" cy="9.8" r="2.15" />
    <path d="M23 20.5A5 5 0 0 0 15.72 16.05" />
    {/* central (más grande, más arriba) */}
    <circle cx="12" cy="7.6" r="3" />
    <path d="M6.2 20.5A5.8 5.8 0 0 1 17.8 20.5" />
  </svg>
);

export default GroupIcon;
