import * as core from '@actions/core'
import opentelemetry from '@opentelemetry/api'
import { Resource } from '@opentelemetry/resources'
import { MeterProvider } from '@opentelemetry/sdk-metrics'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION
} from '@opentelemetry/semantic-conventions'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'

export interface OtlpMetric {
  name: string
  description: string
  value: number
  unit: string
  labels: Record<string, string>
}

interface OtlpConfig {
  endpoint: string
  headers: string
  metricNamespace: string
  serviceName: string
  serviceVersion: string
}

let otlpConfig: OtlpConfig
let meter: any
let meterProvider: MeterProvider

export const initializeOTLP = (config: OtlpConfig): void => {
  const RESOURCE = Resource.default().merge(
    new Resource({
      [ATTR_SERVICE_NAME]: config.serviceName,
      [ATTR_SERVICE_VERSION]: config.serviceVersion
    })
  )

  const metricExporter = new OTLPMetricExporter({
    url: `${config.endpoint}/v1/metrics`,
    concurrencyLimit: 1
  })

  meterProvider = new MeterProvider({
    resource: RESOURCE
  })

  meter = opentelemetry.metrics.getMeter(
    config.serviceName,
    config.serviceVersion
  )
  core.debug(`Using Resource: ${RESOURCE}`)
  core.debug(`Using metricExporter: ${metricExporter}`)
  otlpConfig = config
}

export const sendMetrics = async (metrics: OtlpMetric[]): Promise<void> => {
  metrics.forEach(data => {
    const m = meter.createGauge(`${otlpConfig.metricNamespace}.${data.name}`, {
      description: data.description,
      unit: '1'
    })
    m.bind(data.labels).set(data.value)
  })
  await meterProvider.forceFlush()
}
