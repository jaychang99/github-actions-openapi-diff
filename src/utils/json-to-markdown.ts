// Utility function to format JSON as Markdown code block

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function jsonToMarkdown(obj: any, depth = 0): string {
  let md = depth === 0 ? '```markdown\n' : '' // Start code block only at the top level
  const indent = '  '.repeat(depth)

  for (const key in obj) {
    if (
      typeof obj[key] === 'object' &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      md += `${indent} ${key} :\n`
      md += jsonToMarkdown(obj[key], depth + 1) // Recursively append sub-objects
    } else {
      md += `${indent}- ${key}: ${JSON.stringify(obj[key], null, 2)}\n`
    }
  }

  if (depth === 0) {
    md += '```\n' // End code block only at the top level
  }
  return md
}
