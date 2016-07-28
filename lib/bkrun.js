import path from 'path'
import childProcess from 'child_process'

import inquirer from 'inquirer'
import Spinner from 'io-spin'
import 'colors'

import loadFile from './loadFile'
import parseCommand from './parseCommand'
import promptForConfirm from './promptForConfirm'

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

let agentMetadata = {}

function processStep (i) {
  let step = file.steps[i]

  if (!step.type) {
    if (step.command) {
      step.type = 'command'
    } else if (step.prompt) {
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
      runCommand(step, finish)
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

function runCommand (step, done) {
  let [ cmd, args ] = parseCommand(step.command)
  let proc = childProcess.spawn(cmd, args)

  let spinner = new Spinner('Box1', step.name)

  spinner.start()

  proc.stdout.on('data', function (data) {
    console.log(`[${new Date()} ${step.name}]`.green, data.toString().replace(/\n$/, ''))
  })

  proc.stderr.on('data', function (data) {
    console.log(`[${new Date()} ${step.name}]`.red, data.toString().replace(/\n$/, ''))
  })

  proc.on('exit', function () {
    spinner.stop()
    done()
  })
}

function handleWait (step, done) {
  done()
}

function handleUnblock (step, done) {
  let message = 'Would you like to unblock the next step?'

  if (step.label) {
    message = `Would you like to unblock: ${step.label}?`
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
    message = `Would you like to unblock: ${step.block}?`
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
        agentMetadata[k] = answers[k]
      }
      done()
    })
  })
}

function rewriteStep (step) {
  if (!step.command) {
    return step
  }
  step.command.match(/buildkite-agent meta-data get ([^\s]+)/g).forEach(function (str) {
    let match = str.split(' ').pop()
    step.command = step.command.replace(str, agentMetadata[match])
  })
  return step
}

processStep(startIndex)
