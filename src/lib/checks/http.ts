import { logger } from '@/lib/logger'
import type { CheckResult, MonitorInput } from './types'

export async function performHttpCheck(monitor: MonitorInput): Promise<CheckResult> {
  const startTime = Date.now()
  const dnsTime = 0
  const connectTime = 0
  const tlsTime = 0

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), monitor.timeout_seconds * 1000)

  try {
    const response = await fetch(monitor.url, {
      method: monitor.method || 'GET',
      headers: {
        'User-Agent': 'UptimeMonitor/1.0',
        ...(monitor.headers ?? {}),
      },
      body: monitor.method && monitor.method !== 'GET' ? monitor.body ?? undefined : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    const expectedCodes = monitor.expected_status_codes && monitor.expected_status_codes.length
      ? monitor.expected_status_codes
      : [200]
    const statusCodeValid = expectedCodes.includes(response.status)

    let contentMatched: boolean | null = null
    if (monitor.expected_content) {
      const responseText = await response.text()
      contentMatched = responseText.includes(monitor.expected_content)
    }

    let sslValid: boolean | null = null
    if (monitor.url.startsWith('https://') && monitor.check_ssl !== false) {
      sslValid = response.ok
    }

    const success = statusCodeValid && (contentMatched === null || contentMatched)
    const error = !statusCodeValid
      ? `Unexpected status code: ${response.status}`
      : contentMatched === false
        ? 'Expected content not found'
        : null
    const errorType = !statusCodeValid ? 'http' : contentMatched === false ? 'content' : null

    return {
      success,
      responseTime,
      statusCode: response.status,
      error,
      errorType,
      sslValid,
      sslExpiresAt: null,
      contentMatched,
      ipAddress: null,
      dnsTime,
      connectTime,
      tlsTime,
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    let errorType: CheckResult['errorType'] = 'unknown'
    let errorMessage: string = error?.message ?? 'Unknown error'

    if (error?.name === 'AbortError') {
      errorType = 'timeout'
      errorMessage = `Request timed out after ${monitor.timeout_seconds} seconds`
    } else if (error?.cause?.code === 'ENOTFOUND' || error?.code === 'ENOTFOUND') {
      errorType = 'dns_error'
      errorMessage = 'DNS resolution failed'
    } else if (error?.cause?.code === 'ECONNREFUSED' || error?.code === 'ECONNREFUSED') {
      errorType = 'connection_error'
      errorMessage = 'Connection refused'
    } else if (error?.cause?.code === 'CERT_HAS_EXPIRED' || /certificate/i.test(errorMessage)) {
      errorType = 'ssl'
    }

    logger.warn('HTTP_CHECK_FAILED', {
      context: 'performHttpCheck',
      url: monitor.url,
      errorType,
      reason: errorMessage,
    })

    return {
      success: false,
      responseTime,
      statusCode: null,
      error: errorMessage,
      errorType,
      sslValid: null,
      sslExpiresAt: null,
      contentMatched: null,
      ipAddress: null,
      dnsTime,
      connectTime,
      tlsTime,
    }
  }
}
