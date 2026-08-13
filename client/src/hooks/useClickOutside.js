import { useEffect } from 'react'

export function useClickOutside(ref, active, onOutside) {
  useEffect(() => {
    if (!active) return

    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onOutside()
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [ref, active, onOutside])
}
