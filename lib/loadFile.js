import fs from 'fs'

import yaml from 'yamljs'

export default function (path) {
  // Read the file
  let fileStr

  try {
    fileStr = fs.readFileSync(path).toString()
  } catch (e) {
    throw e
  }

  let file

  // Try parse as JSON
  try {
    file = JSON.parse(fileStr)
  } catch (e) {
    // ignore
  }

  // Try parse as YAML
  try {
    file = yaml.parse(fileStr)
  } catch (e) {
    // ignore
  }

  if (!file) {
    console.error('Failed to parse file, does it exist? Is it valid JSON/Yaml?')
    process.exit(1)
  }

  return file
}
