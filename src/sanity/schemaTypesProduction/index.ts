import {type SchemaTypeDefinition} from 'sanity'
import {event} from './event'   // import your new event
import {blockContentType} from './blockContentType'

export const schemaProduction: { types: SchemaTypeDefinition[] } = {
  types: [event, blockContentType],              // only include the simple schema
}
