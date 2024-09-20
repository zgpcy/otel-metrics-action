import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'
//import * as github from '@actions/github'
import { initializeOTLP, OtlpMetric, sendMetrics } from './otel'

/**
 * The main function for the action.
 * @returns { Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  const endpoint: string = core.getInput('endpoint')
  const headers: string = core.getInput('headers')
  const metricNamespace: string =
    core.getInput('metricNamespace') || process.env.OTLP_METRIC_NAMESPACE || ''
  const otlpServiceNameAttr =
    core.getInput('serviceNameAttr') || process.env.OTLP_SERVICE_NAME_ATTR || ''
  const otlpServiceVersionAttr =
    core.getInput('serviceVersionAttr') ||
    process.env.OTLP_SERVICE_VERSION_ATTR ||
    ''
  const metricsFile: string = core.getInput('metricsFile')

  core.debug(`Using OTLP endpoint: ${endpoint}`)
  core.debug(`Using OTLP headers: ${headers}`)
  core.debug(`Using OTLP namespace: ${metricNamespace}`)
  core.debug(`Using OTLP service name: ${otlpServiceNameAttr}`)
  core.debug(`Using OTLP service version: ${otlpServiceNameAttr}`)

  //const octokit = github.getOctokit(ghToken)

  initializeOTLP({
    endpoint: endpoint,
    headers: headers,
    metricNamespace: metricNamespace,
    serviceName: otlpServiceNameAttr,
    serviceVersion: otlpServiceVersionAttr
  })

  // Load metrics from the file
  const metrics = loadMetricsFromFile(metricsFile)

  // Set outputs for other workflow steps to use
  //core.setOutput('time', new Date().toTimeString())
  try {
    await sendMetrics(metrics)
  } catch (error: any) {
    core.setFailed(`Failed to send metrics: ${error.message}`)
    throw error
  }
}

// Function to load metrics from a file
const loadMetricsFromFile = (filePath: string): OtlpMetric[] => {
  try {
    const absolutePath = path.resolve(filePath)
    const fileContent = fs.readFileSync(absolutePath, 'utf8')
    return JSON.parse(fileContent)
  } catch (error: any) {
    core.setFailed(`Failed to read or parse metrics file: ${error.message}`)
    throw error
  }
}
