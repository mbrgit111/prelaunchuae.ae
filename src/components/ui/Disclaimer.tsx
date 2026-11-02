export function Disclaimer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs leading-relaxed text-muted ${className}`}>{children}</p>;
}
