type LogLevel = 'INFO' | 'WARN' | 'ERROR'

const icons: Record<LogLevel, string> = {
  INFO:  '✅',
  WARN:  '⚠️ ',
  ERROR: '❌',
}

interface LogMeta {
  ip?:     string
  email?:  string
  userId?: string
  reason?: string
  context?: string
  [key: string]: string | number | boolean | undefined
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  return `${local[0]}***@${domain}`
}

function formatMeta(meta: LogMeta): string {
  return Object.entries(meta)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(' ')
}

function log(level: LogLevel, event: string, meta: LogMeta = {}) {
  const safe = { ...meta }
  if (safe.email) safe.email = maskEmail(safe.email)

  const metaStr = formatMeta(safe)
  const msg = `${icons[level]} [${level}] ${event}${metaStr ? ` | ${metaStr}` : ''}`

  if (level === 'ERROR') console.error(msg)
  else if (level === 'WARN')  console.warn(msg)
  else                        console.log(msg)
}

export const logger = {
  info:  (event: string, meta?: LogMeta) => log('INFO',  event, meta),
  warn:  (event: string, meta?: LogMeta) => log('WARN',  event, meta),
  error: (event: string, meta?: LogMeta) => log('ERROR', event, meta),
}
