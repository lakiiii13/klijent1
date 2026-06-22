export function slotButtonClass({ occupied, selected }) {
  if (occupied) {
    return 'cursor-not-allowed border border-red-200/80 bg-red-50/50 text-ink-muted/50 line-through'
  }
  if (selected) {
    return 'bg-brown text-white'
  }
  return 'border border-brown/20 text-ink-muted hover:border-brown'
}
