import { ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router";

// "Volver" del design system (docs/design-system/03-componentes.html#rotulos).
// - variant "text": chevron + texto, para flujos sobre fondo claro.
// - variant "icon": botón circular de 44, para usar sobre fotos.
// Con `to` navega a esa ruta; sin `to`, vuelve a la pantalla anterior.
export function BackLink({
  to,
  label = "Volver",
  variant = "text",
  onClick,
  className = "",
}: {
  to?: string;
  label?: string;
  variant?: "text" | "icon";
  onClick?: () => void;
  className?: string;
}) {
  const navigate = useNavigate();
  const isIcon = variant === "icon";
  const classes = isIcon
    ? `editorial-icon-button editorial-icon-button--filled ${className}`
    : `editorial-back-link ${className}`;
  const content = (
    <>
      <ChevronLeft size={isIcon ? 20 : 16} strokeWidth={1.5} aria-hidden="true" />
      {isIcon ? null : <span>{label}</span>}
    </>
  );

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={classes} aria-label={isIcon ? label : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => (onClick ? onClick() : navigate(-1))}
      className={classes}
      aria-label={isIcon ? label : undefined}
    >
      {content}
    </button>
  );
}
