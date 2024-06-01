type Table = (arg: { headers: string[]; rows: string[][] }) => string

export const table: Table = ({ headers, rows }) => {
  const headerRow = headers.join(' | ')
  const headerSeparator = headers.map(() => '---').join(' | ')
  const bodyRows = rows.map(row => row.join(' | ')).join('\n')

  return `${headerRow}\n${headerSeparator}\n${bodyRows}`
}
