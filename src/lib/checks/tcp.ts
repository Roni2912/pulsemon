import net from 'node:net'
import { logger } from '@/lib/logger'
import type { CheckResult, MonitorInput } from './types'

interface ParsedTarget {
  host: string
  port: number
}

function parseTarget(url: string, defaultPort: number): ParsedTarget | null {
  let trimmed = url.trim()
  if (!trimmed) return null

  // strip scheme so callers can pass "tcp://host:5432" or just "host:5432"
  trimmed = trimmed.replace(/^[a-zA-Z]+:\/\//, '')

  // strip path/query
  const pathIdx = trimmed.indexOf('/')
  if (pathIdx >= 0) trimmed = trimmed.slice(0, pathIdx)
  const queryIdx = trimmed.indexOf('?')
  if (queryIdx >= 0) trimmed = trimmed.slice(0, queryIdx)

  if (!trimmed) return null

  const lastColon = trimmed.lastIndexOf(':')
  if (lastColon === -1) {
    return { host: trimmed, port: defaultPort }
  }

  const host = trimmed.slice(0, lastColon)
  const portStr = trimmed.slice(lastColon + 1)
  const port = Number.parseInt(portStr, 10)
  if (!host || !Number.isFinite(port) || port < 1 || port > 65535) {
    return null
  }
  return { host, port }
}

export async function performTcpCheck(
  monitor: MonitorInput,
  defaultPort = 80
): Promise<CheckResult> {
  const target = parseTarget(monitor.url, defaultPort)
  if (!target) {
    logger.warn('TCP_CHECK_INVALID_TARGET', {
      context: 'performTcpCheck',
      url: monitor.url,
    })
    return {
      success: false,
      responseTime: 0,
      statusCode: null,
      error: `Invalid target: ${monitor.url}`,
      errorType: 'invalid_target',
      sslValid: null,
      sslExpiresAt: null,
      contentMatched: null,
      ipAddress: null,
      dnsTime: 0,
      connectTime: 0,
      tlsTime: 0,
    }
  }

  const startTime = Date.now()

  return new Promise<CheckResult>((resolve) => {
    const socket = new net.Socket()
    let settled = false

    const finish = (res: CheckResult) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(res)
    }

    socket.setTimeout(monitor.timeout_seconds * 1000)

    socket.once('connect', () => {
      const connectTime = Date.now() - startTime
      const remoteAddress = socket.remoteAddress ?? null
      finish({
        success: true,
        responseTime: connectTime,
        statusCode: null,
        error: null,
        errorType: null,
        sslValid: null,
        sslExpiresAt: null,
        contentMatched: null,
        ipAddress: remoteAddress,
        dnsTime: 0,
        connectTime,
        tlsTime: 0,
      })
    })

    socket.once('timeout', () => {
      logger.warn('TCP_CHECK_TIMEOUT', {
        context: 'performTcpCheck',
        host: target.host,
        port: target.port,
        timeoutSeconds: monitor.timeout_seconds,
      })
      finish({
        success: false,
        responseTime: Date.now() - startTime,
        statusCode: null,
        error: `TCP connection to ${target.host}:${target.port} timed out`,
        errorType: 'timeout',
        sslValid: null,
        sslExpiresAt: null,
        contentMatched: null,
        ipAddress: null,
        dnsTime: 0,
        connectTime: 0,
        tlsTime: 0,
      })
    })

    socket.once('error', (err: NodeJS.ErrnoException) => {
      const errorType: CheckResult['errorType'] =
        err.code === 'ENOTFOUND' ? 'dns_error'
        : err.code === 'ECONNREFUSED' ? 'connection_error'
        : 'connection_error'

      logger.warn('TCP_CHECK_FAILED', {
        context: 'performTcpCheck',
        host: target.host,
        port: target.port,
        errorType,
        reason: err.message,
      })

      finish({
        success: false,
        responseTime: Date.now() - startTime,
        statusCode: null,
        error: err.message,
        errorType,
        sslValid: null,
        sslExpiresAt: null,
        contentMatched: null,
        ipAddress: null,
        dnsTime: 0,
        connectTime: 0,
        tlsTime: 0,
      })
    })

    socket.connect({ host: target.host, port: target.port })
  })
}
