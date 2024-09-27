import * as path from 'path'
import * as core from '@actions/core'
import * as fs from 'fs'
import { OtlpMetric } from './otlp'

interface Vulnerability {
  PkgName?: string
  InstalledVersion?: string
  VulnerabilityID?: string
  Severity?: string
  FixedVersion?: string
  PrimaryURL?: string
}
export const parseMetrics = (
  filePath: string,
  repository: string
): OtlpMetric[] => {
  const otlpMetrics: OtlpMetric[] = []

  const fileData = readJsonFile(filePath)
  if (!('Results' in fileData)) {
    throw new Error('No results found in the trivy output')
  }

  const results = fileData['Results'][0]
  if (!('Vulnerabilities' in results)) {
    return otlpMetrics
  }
  // Loop over vulnerabilities
  results['Vulnerabilities'].forEach((result: any) => {
    const extract: Vulnerability = {
      PkgName: '',
      InstalledVersion: '',
      VulnerabilityID: '',
      Severity: '',
      FixedVersion: '',
      PrimaryURL: ''
    }

    // Populate extract with the values from the result
    Object.keys(extract).forEach(key => {
      if (key in result) {
        ; (extract as any)[key] = result[key]
      }
    })

    const otlpMetric: OtlpMetric = {
      name: 'trivy.detected',
      description: 'the vulnerability detected',
      unit: 'vulnerability',
      labels: {
        severity: extract.Severity || '',
        repository: repository,
        id: extract.VulnerabilityID || '',
        package: extract.PkgName || '',
        installed_version: extract.InstalledVersion || '',
        fixed_version: extract.FixedVersion || '',
        link: extract.PrimaryURL || ''
      },
      value: 1
    }

    otlpMetrics.push(otlpMetric)
  })
  return otlpMetrics
}

// Function to load metrics from a file
export const readJsonFile = (filePath: string): { [key: string]: any } => {
  try {
    const absolutePath = path.resolve(filePath)
    core.debug(`Reading json file from: ${absolutePath}`)
    const fileContent = fs.readFileSync(absolutePath, 'utf8')
    return JSON.parse(fileContent)
  } catch (error: any) {
    core.setFailed(`Failed to read/prase json file: ${error.message}`)
    throw error
  }
}
