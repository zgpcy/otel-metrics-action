import * as core from '@actions/core'
//import * as github from '@actions/github'
import { initializeOTEL } from './otel'

/**
 * The main function for the action.
 * @returns { Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const otlpEndpoint: string = core.getInput('otlpEndpoint')
    const otlpHeaders = core.getInput('otlpHeaders')
    const otelServiceName =
      core.getInput('otelServiceName') || process.env.OTEL_SERVICE_NAME || ''

    const otelServiceVersion =
      core.getInput('otelServiceVersion') ||
      process.env.OTEL_SERVICE_VERSION ||
      ''

    core.debug(`Using OTLP endpoint: ${otlpEndpoint}`)
    core.debug(`Using OTLP headers: ${otlpHeaders}`)
    core.debug(`Using OTLP service name: ${otelServiceName}`)

    //const octokit = github.getOctokit(ghToken)

    initializeOTEL({
      serviceName: otelServiceName,
      serviceVersion: otelServiceVersion
    })
    // Set outputs for other workflow steps to use
    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
