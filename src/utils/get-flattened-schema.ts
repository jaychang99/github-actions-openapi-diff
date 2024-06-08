import { FlattenedSchemaPropertyItem } from '@/types/flattened-schema-property-item'
import { SingleReponseObj } from '@/utils/json-to-markdown-table'

const recursivelyFormatNestedObjects = (
  schema: SingleReponseObj['schema'],
  rows: FlattenedSchemaPropertyItem[] = [],
  iteration = 0,
  previousPropertyPrefix = ''
): FlattenedSchemaPropertyItem[] => {
  console.log('iteration: ', iteration)
  console.table(rows)
  console.log('schema', schema)
  const isInitialIteration = iteration === 0
  const conditionalPropertyPrefix = isInitialIteration ? '' : '.'
  if (schema.type === 'array') {
    const row: FlattenedSchemaPropertyItem = {
      property: `${previousPropertyPrefix}${conditionalPropertyPrefix}[]`,
      type: schema.type ?? '',
      required: '-',
      description: schema.description ?? '',
      example: schema.example ?? ''
    }

    rows.push(row)

    if (schema.items.properties) {
      recursivelyFormatNestedObjects(
        schema.items,
        rows,
        iteration + 1,
        row.property
      )
    } else {
      return rows
    }
  } else {
    if (schema.properties) {
      for (const [propertyName, propertyMetadata] of Object.entries(
        schema.properties
      )) {
        const arrayPrefix = propertyMetadata.type === 'array' ? '.[]' : ''
        const row: FlattenedSchemaPropertyItem = {
          property: `${previousPropertyPrefix}${conditionalPropertyPrefix}${propertyName}`,
          type: propertyMetadata.type ?? '',
          required: schema.required?.includes(propertyName) ? 'Yes' : 'No',
          description: propertyMetadata.description ?? '',
          example: propertyMetadata.example ?? ''
        }

        rows.push(row)
        console.table(rows)
        if (propertyMetadata.properties) {
          recursivelyFormatNestedObjects(propertyMetadata, rows, iteration + 1)
        }
        if (propertyMetadata.type === 'array') {
          recursivelyFormatNestedObjects(
            propertyMetadata.items,
            rows,
            iteration + 1,
            row.property + arrayPrefix
          )
        }
      }
    } else {
      return rows
    }
  }
  console.log('==right before return rows==')
  console.table(rows)
  return rows
}

export const getflattenedSchema = (
  singleResponseObjSchema: SingleReponseObj['schema']
): FlattenedSchemaPropertyItem[] => {
  const initialRows: FlattenedSchemaPropertyItem[] = []
  const rows = recursivelyFormatNestedObjects(
    singleResponseObjSchema,
    initialRows,
    0
  )
  // console.log('rows', rows)
  return rows
}
