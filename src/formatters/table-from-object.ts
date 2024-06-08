type TableArgType<T> = {
  headers: string[]
  dataIndex: string[]
  rows: T[]
}

export const tableFromObject = <T extends { [key: string]: string }>({
  headers,
  dataIndex,
  rows
}: TableArgType<T>): string => {
  const headerRow = headers.join(' | ')
  const headerSeparator = headers.map(() => '---').join(' | ')
  const bodyRows = rows
    .map(row => {
      return dataIndex.map(index => row[index]).join(' | ')
    })
    .join('\n')

  return `${headerRow}\n${headerSeparator}\n${bodyRows}`
}
