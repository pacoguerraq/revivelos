interface IconProps {
  size?: number
  className?: string
}

export function FacebookIcon({ size = 24, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path
        d="M13.5 21v-7h2.2l.3-2.6h-2.5v-1.7c0-.75.2-1.26 1.29-1.26H16V6.14C15.77 6.1 15 6 14.1 6c-1.87 0-3.15 1.14-3.15 3.24v1.16H8.75v2.6h2.2v7h2.55Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  )
}
