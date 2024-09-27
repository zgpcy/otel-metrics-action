# OTEL Trivy action 

[![Continuous Integration](https://github.com/zgpcy/otel-metrics-action/actions/workflows/ci.yml/badge.svg)](https://github.com/zgpcy/otel-metrics-action/actions/workflows/ci.yml)
[![Lint Codebase](https://github.com/zgpcy/otel-metrics-action/actions/workflows/linter.yml/badge.svg)](https://github.com/zgpcy/otel-metrics-action/actions/workflows/linter.yml)
[![Check Transpiled JavaScript](https://github.com/zgpcy/otel-metrics-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/zgpcy/otel-metrics-action/actions/workflows/check-dist.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

This action reads the trivy json output and sends vulnerability metrics to an Opentelemtry collector


## Usage

After testing, you can create version tag(s) that developers can use to
reference different stable versions of your action. For more information, see
[Versioning](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)
in the GitHub Actions toolkit.

To include the action in a workflow in another repository, you can use the
`uses` syntax with the `@` symbol to reference a specific branch, tag, or commit
hash.

```yaml
steps:
  - name: Checkout
    id: checkout
    uses: actions/checkout@v4

  - name: Run Trivy vulnerability scanner in fs mode
    uses: aquasecurity/trivy-action@0.24.0
    with:
      image-ref: nginx:1.25.4-alpine
      format: json
      output: trivy-output.json

  - name: Test Local Action
    uses: ./
    with:
      endpoint: ${{secrets.OTEL_TESTING_ENDPOINT}}
      headers: |
        x-custom-header-1: "test1"
        x-auth-token: "***********"
      metricNamespace: cve
      repositoryName: ${{env.GITHUB_REPOSITORY}}
      serviceNameAttr: ci-action-trivy
      serviceVersionAttr: 1.0.0
      trivyOutputFile: trivy-output.json
```
