import { Resource } from '@opentelemetry/resources'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION
} from '@opentelemetry/semantic-conventions'
interface OtelParams {
  serviceName: string
  serviceVersion: string
}
export const initializeOTEL = (params: OtelParams): void => {
  const RESOURCE = Resource.default().merge(
    new Resource({
      [ATTR_SERVICE_NAME]: params.serviceName,
      [ATTR_SERVICE_VERSION]: params.serviceVersion
    })
  )
  console.log(RESOURCE)
}
