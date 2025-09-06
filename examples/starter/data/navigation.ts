export interface NavLink {
  href: string;
  label: string;
}

export const navigationLinks: NavLink[] = [
  { href: '#setup', label: 'Setup' },
  { href: '#demo', label: 'Demo' },
  { href: '#code', label: 'Code' },
  { href: '/showcase', label: 'Showcase' }
];