export class Markdown {
  markdown: string

  constructor() {
    this.markdown = ''
  }

  append(markdown: string): void {
    this.markdown += markdown
  }

  appendToNewLine(markdown: string): void {
    this.markdown += `\n${markdown}`
  }

  toString(): string {
    return this.markdown
  }
}
