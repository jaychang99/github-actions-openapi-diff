type TableArgType<T> = {
  headers: string[]
  rows: T[][]
}

export const table = <T>({ headers, rows }: TableArgType<T>): string => {
  const headerRow = headers.join(' | ')
  const headerSeparator = headers.map(() => '---').join(' | ')
  const bodyRows = rows.map(row => row.join(' | ')).join('\n')

  return `${headerRow}\n${headerSeparator}\n${bodyRows}`
}
