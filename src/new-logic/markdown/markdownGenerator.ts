type TableRecord = Record<string, string | number | boolean | undefined>

export class MarkdownGenerator {
  markdown = ''
  currentTableHeader: string[] = []

  addH1(title: string): void {
    this.markdown += `# ${title}\n`
  }

  addH2(title: string): void {
    this.markdown += `## ${title}\n`
  }

  addH3(title: string): void {
    this.markdown += `### ${title}\n`
  }

  addNewLine(): void {
    this.markdown += '\n'
  }

  addBulletPoint(text: string): void {
    this.markdown += `- ${text}\n`
  }

  addSimpleTextWithNewLine(text: string): void {
    this.markdown += `${text}\n`
  }

  addSimpleText(text: string): void {
    this.markdown += `${text}`
  }

  addHorizontalRule(): void {
    this.markdown += '---\n'
  }

  addTable<TRecord extends TableRecord>(
    headers: string[],
    rows: TRecord[]
  ): void {
    this.addNewLine()
    this.addTableHeader(headers)
    for (const row of rows) {
      this.addTableRow(row)
    }
  }

  addTableHeader(headers: string[]): void {
    this.addNewLine()
    this.markdown += `| ${headers.join(' | ')} |\n`
    this.markdown += `| ${headers.map(() => '---').join(' | ')} |\n`
  }

  // make subsequent calls to addTableRow reference this.currentTableHeader
  setCurrentTableHeader(headers: string[]): void {
    this.currentTableHeader = headers
  }

  addTableRow<TRecord extends TableRecord>(row: TRecord): void {
    if (this.currentTableHeader.length === 0) {
      throw new Error('Table header must be set before adding rows')
    }

    // find corresponding order of keys in the header
    const orderedRow = this.currentTableHeader.map(header => row[header] ?? '')

    this.markdown += `| ${orderedRow.join(' | ')} |\n`
  }

  getMarkdown(): string {
    return this.markdown
  }
}
