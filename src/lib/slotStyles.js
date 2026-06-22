export function slotButtonClass({ time, available, occupied, selected }) {
  if (occupied) {
    return 'cursor-not-allowed border border-red-200/80 bg-red-50/50 text-ink-muted/50 line-through'
  }
  if (!available) {
    return 'cursor-not-allowed border border-brown/10 bg-cream-dark/80 text-ink-muted/35'
  }
  if (selected) {
    return 'bg-brown text-white'
  }
  return 'border border-brown/20 text-ink-muted hover:border-brown'
}
