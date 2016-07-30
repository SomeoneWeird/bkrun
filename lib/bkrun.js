import path from 'path'
import childProcess from 'child_process'

import inquirer from 'inquirer'
import Spinner from 'io-spin'
import merge from 'merge'
import uuid from 'uuid'
import 'colors'

import loadFile from './loadFile'
import promptForConfirm from './promptForConfirm'

import {
  setMetadata
} from './metadata'

import {
  getPipeline,
  deletePipeline
} from './pipeline'

const buildId = uuid().replace(/-/g, '')

let [ , , fileName, startIndex = 0 ] = process.argv

if (!fileName) {
  console.error('Please run again with a filename')
  process.exit(1)
}

let filePath = path.resolve(process.cwd(), fileName)

let file = loadFile(filePath)

if (!file.steps || file.steps.length === 0) {
  console.error('Oops, your pipeline doesn\'t seem to have any steps!')
  process.exit(1)
}

if (!Array.isArray(file.steps)) {
  console.error('Oops, steps needs to be an array!')
  process.exit(1)
}

function processStep (i) {
  let step = file.steps[i]

  if (!step.type) {
    if (step.command) {
      step.type = 'command'
    } else if (step.prompt || step.block) {
      step.type = 'prompt'
    }
  }

  step = rewriteStep(step)

  function finish (err) {
    if (err) {
      // TODO: handle better
      throw err
    }
    let nextIndex = i + 1
    if (nextIndex === file.steps.length) {
      // finish
      process.exit()
    } else {
      return processStep(nextIndex)
    }
  }

  switch (step.type) {
    case 'command': {
      runCommand(i, step, finish)
      break
    }
    case 'waiter': {
      handleWait(step, finish)
      break
    }
    case 'manual': {
      handleUnblock(step, finish)
      break
    }
    case 'prompt': {
      handlePrompt(step, finish)
    }
  }
}

function logOutput (name, output, ok = true) {
  output.split('\n').forEach(function (str) {
    console.log(`[${new Date()} ${name}]`[ok ? 'green' : 'red'], str)
  })
}

function runCommand (i, step, done) {
  let proc = childProcess.exec(step.command, {
    env: merge(process.env, file.env || {})
  })

  let spinner = new Spinner('Box1', step.name)

  spinner.start()

  proc.stdout.on('data', function (data) {
    spinner.stop()
    logOutput(step.name, data.toString().replace(/\n$/, ''), true)
    spinner.start()
  })

  proc.stderr.on('data', function (data) {
    spinner.stop()
    logOutput(step.name, data.toString().replace(/\n$/, ''), false)
    spinner.start()
  })

  proc.on('exit', function (code) {
    spinner.stop()
    if (code !== 0) {
      logOutput(step.name, `Exited with code ${code}`, false)
      process.exit()
    }
    checkForNewPipeline(i)
    done()
  })
}

function handleWait (step, done) {
  done()
}

function handleUnblock (step, done) {
  let message = 'Would you like to unblock the next step?'

  if (step.label) {
    message = step.label
  }

  promptForConfirm(message, function (ok) {
    if (!ok) {
      process.exit()
    }

    return done()
  })
}

function handlePrompt (step, done) {
  let message = 'Would you like to unblock the next step?'

  if (step.block) {
    message = step.block
  }

  promptForConfirm(message, function (ok) {
    if (!ok) {
      process.exit()
    }

    let questions = step.fields.map(function (field) {
      if (field.options) {
        return {
          type: 'list',
          name: field.key,
          message: field.select,
          choices: field.options
        }
      }
      if (field.text) {
        return {
          type: 'input',
          name: field.key,
          message: field.text,
          default: field.default
        }
      }
    })

    inquirer.prompt(questions).then(function (answers) {
      for (let k in answers) {
        setMetadata(buildId, k, answers[k])
      }
      done()
    })
  })
}

function rewriteStep (step) {
  if (!step.command) {
    return step
  }
  step.command = step.command.replace(/buildkite-agent/g, `bkrun-agent ${buildId}`)
  return step
}

function checkForNewPipeline (stepIndex) {
  let response = getPipeline(buildId)
  if (!response) {
    return
  }

  let {
    replace,
    pipeline
  } = response

  // Merge new environment vars
  file.env = merge(file.env, pipeline.env || {})

  for(let i = 0; i < pipeline.steps.length; i++) {
    let step = pipeline.steps[i]
    file.steps.splice(stepIndex + 1 + i, 0, step)
  }

  if (replace) {
    let count = stepIndex + pipeline.steps.length + 1
    file.steps.splice(count, file.steps.length - count)
  }

  deletePipeline(buildId)
}

processStep(startIndex)
