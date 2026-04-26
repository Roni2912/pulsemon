import { logger } from '@/lib/logger'
import { performHttpCheck } from './http'
import { performTcpCheck } from './tcp'
import type { CheckResult, MonitorInput } from './types'

export type { CheckResult, MonitorInput } from './types'

/**
 * Dispatch a check by monitor type.
 *
 * - http / https: real HTTP request via fetch.
 * - tcp:          raw TCP connection probe (host:port from monitor.url).
 * - ping:         TCP probe to port 80 by default. ICMP requires elevated
 *                 privileges and isn't available in serverless runtimes,
 *                 so we use a layer-4 reachability probe as the closest
 *                 portable substitute.
 */
export async function performCheck(monitor: MonitorInput): Promise<CheckResult> {
  switch (monitor.type) {
    case 'http':
    case 'https':
      return performHttpCheck(monitor)
    case 'tcp':
      return performTcpCheck(monitor, 80)
    case 'ping':
      logger.info('PING_AS_TCP_PROBE', {
        context: 'performCheck',
        url: monitor.url,
      })
      return performTcpCheck(monitor, 80)
    default:
      logger.warn('CHECK_UNKNOWN_TYPE', {
        context: 'performCheck',
        type: (monitor as any).type,
      })
      return {
        success: false,
        responseTime: 0,
        statusCode: null,
        error: `Unsupported monitor type: ${(monitor as any).type}`,
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
}
