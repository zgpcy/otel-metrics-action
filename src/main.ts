import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'
//import * as github from '@actions/github'
import { initializeOTLP, OtlpMetric, sendMetrics } from './otlp'
import { parseMetrics } from './trivy'

export const run = async () => {
  const endpoint: string = core.getInput('endpoint')
  const headers: string = core.getInput('headers')
  const metricNamespace: string =
    core.getInput('metricNamespace') || process.env.OTLP_METRIC_NAMESPACE || ''
  const githubRepository: string =
    core.getInput('githubRepository') || process.env.GITHUB_REPOSITORY || ''
  const otlpServiceNameAttr =
    core.getInput('serviceNameAttr') || process.env.OTLP_SERVICE_NAME_ATTR || ''
  const otlpServiceVersionAttr =
    core.getInput('serviceVersionAttr') ||
    process.env.OTLP_SERVICE_VERSION_ATTR ||
    ''
  const trivyOutputFile: string = core.getInput('trivyOutputFile')

  core.debug(`Using OTLP endpoint: ${endpoint}`)
  core.debug(`Using OTLP headers: ${headers}`)
  core.debug(`Using OTLP namespace: ${metricNamespace}`)
  core.debug(`Using OTLP service name: ${otlpServiceNameAttr}`)
  core.debug(`Using OTLP service version: ${otlpServiceNameAttr}`)
  core.debug(`Using trivy output file: ${trivyOutputFile}`)
  core.debug(`Using repository name: ${githubRepository}`)

  let repositoryOwner, repositoryName = ''
  if (githubRepository.includes('/')) {
    const split = githubRepository.split('/')
    if (split.length !== 2) {
      throw new Error('Invalid repository format')
    }
    repositoryOwner = split[0]
    repositoryName = split[1]
  } else {
    throw new Error('Repository owner is missing')
  }
  //const octokit = github.getOctokit(ghToken)

  initializeOTLP({
    endpoint: endpoint,
    headers: headers,
    metricNamespace: metricNamespace,
    serviceName: otlpServiceNameAttr,
    serviceVersion: otlpServiceVersionAttr
  })

  // Load metrics from the file

  try {
    const metrics = parseMetrics(trivyOutputFile, repositoryOwner, repositoryName)
    core.info('Metrics to be sent:' + metrics)
    await sendMetrics(metrics)
    core.info('Metrics sent successfully')
  } catch (error: any) {
    core.setFailed(`Failed to send metrics: ${error.message}`)
    throw error
  }
}
