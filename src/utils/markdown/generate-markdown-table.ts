/* eslint-disable prefer-template */
export function generateMarkdownTable<TRecord extends object>(
  array: TRecord[]
): string {
  const headers = Object.keys(array[0] ?? {}) as (keyof TRecord)[]

  const headerRow = headers.map(header => `| ${String(header)} `).join('') + '|'

  const dividerRow = headers.map(() => '| --- ').join('') + '|'

  const bodyRows = array.map(
    record => headers.map(header => `| ${record[header]} `).join('') + '|'
  )

  return [headerRow, dividerRow, ...bodyRows].join('\n')
}
