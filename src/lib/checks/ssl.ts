import tls from 'node:tls'
import { logger } from '@/lib/logger'

export interface SslProbeResult {
  valid: boolean
  expiresAt: Date | null
  issuer: string | null
  daysToExpiry: number | null
  error: string | null
}

export async function probeSslCertificate(
  hostname: string,
  port = 443,
  timeoutMs = 10_000
): Promise<SslProbeResult> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (res: SslProbeResult) => {
      if (settled) return
      settled = true
      try {
        socket.destroy()
      } catch {
        // ignore
      }
      resolve(res)
    }

    const socket = tls.connect(
      {
        host: hostname,
        port,
        servername: hostname,
        rejectUnauthorized: false,
      },
      () => {
        const cert = socket.getPeerCertificate(false)
        if (!cert || Object.keys(cert).length === 0) {
          finish({
            valid: false,
            expiresAt: null,
            issuer: null,
            daysToExpiry: null,
            error: 'No certificate presented',
          })
          return
        }

        const expiresAt = cert.valid_to ? new Date(cert.valid_to) : null
        const daysToExpiry = expiresAt
          ? Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null
        const valid = socket.authorized && expiresAt !== null && expiresAt.getTime() > Date.now()
        const issuer = (cert.issuer as any)?.O ?? (cert.issuer as any)?.CN ?? null

        finish({
          valid,
          expiresAt,
          issuer,
          daysToExpiry,
          error: socket.authorized ? null : socket.authorizationError?.toString() ?? 'untrusted',
        })
      }
    )

    socket.setTimeout(timeoutMs, () => {
      logger.warn('SSL_PROBE_TIMEOUT', {
        context: 'probeSslCertificate',
        hostname,
        port,
      })
      finish({
        valid: false,
        expiresAt: null,
        issuer: null,
        daysToExpiry: null,
        error: 'TLS handshake timed out',
      })
    })

    socket.once('error', (err: Error) => {
      logger.warn('SSL_PROBE_FAILED', {
        context: 'probeSslCertificate',
        hostname,
        port,
        reason: err.message,
      })
      finish({
        valid: false,
        expiresAt: null,
        issuer: null,
        daysToExpiry: null,
        error: err.message,
      })
    })
  })
}
