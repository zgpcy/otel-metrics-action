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
export const parseJson = (
  filePath: string,
  owner: string,
  repository: string
): any => {
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
        ;(extract as any)[key] = result[key]
      }
    })

    const otlpMetric: OtlpMetric = {
      name: 'trivy.detected',
      description: 'the vulnerability detected',
      unit: 'vulnerability',
      labels: {
        severity: extract.Severity || '',
        owner: owner,
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

export const parseSarif = (
  filePath: string,
  owner: string,
  repository: string
): any => {
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/

  const otlpMetrics: OtlpMetric[] = []

  const fileData = readJsonFile(filePath)

  if (!('runs' in fileData)) {
    throw new Error('No runs found in the sarif output')
  }
  if (!('results' in fileData['runs'][0])) {
    throw new Error('No results found in the sarif output')
  }

  const results = fileData['runs'][0]['results']

  const extract = {
    'Package:': '',
    'Installed Version:': '',
    Vulnerability: '',
    'Severity:': '',
    'Fixed Version:': '',
    'Link:': ''
  }
  results.forEach((result: any) => {
    const id = result['ruleId']
    let message = result['message']['text']
    message = message.split('\n')

    message.forEach((line: string) => {
      for (const key in extract) {
        const t = line.split(key)
        if (t.length === 2) (extract as any)[key] = t[1].trim()
      }
    })

    let link = extract['Link:']
    const match = link.match(linkRegex)
    if (match && match.length === 3) {
      link = match[2]
    }

    const otlpMetric: OtlpMetric = {
      name: 'trivy.detected',
      description: 'the vulnerability detected',
      unit: 'vulnerability',
      labels: {
        severity: extract['Severity:'] || '',
        owner: owner,
        repository: repository,
        id: id || '',
        package: extract['Package:'] || '',
        installed_version: extract['Installed Version:'] || '',
        fixed_version: extract['Fixed Version:'] || '',
        link: link || ''
      },
      value: 1
    }

    otlpMetrics.push(otlpMetric)
  })

  return otlpMetrics
}

export const parseMetrics = (
  format: string,
  filePath: string,
  owner: string,
  repository: string
): OtlpMetric[] => {
  if (format === 'json') {
    return parseJson(filePath, owner, repository)
  } else if (format === 'sarif') {
    return parseSarif(filePath, owner, repository)
  } else {
    throw new Error('Invalid format')
  }
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
