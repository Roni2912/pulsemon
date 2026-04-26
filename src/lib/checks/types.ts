export type CheckErrorType =
  | 'timeout'
  | 'dns_error'
  | 'connection_error'
  | 'http'
  | 'content'
  | 'ssl'
  | 'invalid_target'
  | 'unknown'

export interface CheckResult {
  success: boolean
  responseTime: number
  statusCode: number | null
  error: string | null
  errorType: CheckErrorType | null
  sslValid: boolean | null
  sslExpiresAt: string | null
  contentMatched: boolean | null
  ipAddress: string | null
  dnsTime: number
  connectTime: number
  tlsTime: number
}

export interface MonitorInput {
  type: 'http' | 'https' | 'tcp' | 'ping'
  url: string
  method?: string
  headers?: Record<string, string> | null
  body?: string | null
  timeout_seconds: number
  expected_status_codes?: number[] | null
  expected_content?: string | null
  check_ssl?: boolean
}
