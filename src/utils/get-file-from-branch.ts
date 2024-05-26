import { execSync } from 'child_process'
import { readFileSync } from 'fs'

export function getFileFromBranch(branch: string, filePath: string): Buffer {
  execSync(`git fetch origin ${branch}`)
  execSync(`git checkout FETCH_HEAD -- ${filePath}`)
  return readFileSync(filePath)
}
