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
    className={className}
    aria-hidden="true"
  >
    {/* central */}
    <circle cx="12" cy="6.8" r="3.1" />
    <path d="M6.6 20.5c.6-4 2.6-6.1 5.4-6.1s4.8 2.1 5.4 6.1" />
    {/* izquierda */}
    <circle cx="4.6" cy="9.4" r="2.2" />
    <path d="M1.2 19.2c.4-2.9 1.8-4.5 3.9-4.6" />
    {/* derecha */}
    <circle cx="19.4" cy="9.4" r="2.2" />
    <path d="M22.8 19.2c-.4-2.9-1.8-4.5-3.9-4.6" />
  </svg>
);

export default GroupIcon;
