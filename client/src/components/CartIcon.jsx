function CartIcon({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d="M3 7h2l1.2 9.2A2 2 0 0 0 8.2 18h8.6a2 2 0 0 0 2-1.6L20 9H6"
        fill="#FFB4C8"
        stroke="#F48FB1"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M6 9h14l-.8 5.8a2 2 0 0 1-2 1.7H8.4a2 2 0 0 1-2-1.7L6 9z" fill="#FFD6E3" />
      <circle cx="9" cy="20" r="1.35" fill="#7EC8F5" />
      <circle cx="17" cy="20" r="1.35" fill="#7EC8F5" />
    </svg>
  )
}

export default CartIcon
