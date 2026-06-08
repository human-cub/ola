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
    <circle cx="4.4" cy="9.5" r="2.25" />
    <path d="M1.5 20.6V18.2A2.95 2.95 0 0 1 7.4 18.2V20.6" />
    {/* derecha */}
    <circle cx="19.6" cy="9.5" r="2.25" />
    <path d="M16.6 20.6V18.2A2.95 2.95 0 0 1 22.5 18.2V20.6" />
    {/* central (más grande, más arriba) */}
    <circle cx="12" cy="7.8" r="3.05" />
    <path d="M7.9 20.6V17.2A4.05 4.05 0 0 1 16 17.2V20.6" />
  </svg>
);

export default GroupIcon;
