'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export function NavLink({
  href,
  label,
  icon,
  exact,
}: {
  href: string;
  label: string;
  icon?: ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={href} className="es-nav-link" data-active={isActive} aria-current={isActive ? 'page' : undefined}>
      {icon ? <span className="es-nav-icon">{icon}</span> : null}
      {label}
    </Link>
  );
}
