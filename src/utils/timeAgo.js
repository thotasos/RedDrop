export function timeAgo(timestamp) {
  const seconds = Math.floor(Date.now() / 1000 - timestamp)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    return `${mins}m ago`
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600)
    return `${hours}h ago`
  }
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400)
    return `${days}d ago`
  }
  if (seconds < 2592000) {
    const weeks = Math.floor(seconds / 604800)
    return `${weeks}w ago`
  }
  if (seconds < 31536000) {
    const months = Math.floor(seconds / 2592000)
    return `${months}mo ago`
  }
  const years = Math.floor(seconds / 31536000)
  return `${years}y ago`
}
