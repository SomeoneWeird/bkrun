import fs from 'fs'
import path from 'path'
import child_process from 'child_process'

import inquirer from 'inquirer'
import Spinner from 'io-spin'
import 'colors'

import loadFile from './loadFile'
import parseCommand from './parseCommand'

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

  if (!step.type && step.command) {
    step.type = 'command'
  }

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
      handleUnblock(step, i, finish)
      break
    }
  }
}

function runCommand(step, done) {
  let [ cmd, args ] = parseCommand(step.command)
  let proc = child_process.spawn(cmd, args)

  let spinner = new Spinner('Box1', step.name)

  spinner.start()

  proc.stdout.on('data', function (data) {
    console.log(`[${new Date} ${step.name}]`.green, data.toString().replace(/\n$/, ''))
  })

  proc.stderr.on('data', function (data) {
    console.log(`[${new Date} ${step.name}]`.red, data.toString().replace(/\n$/, ''))
  })

  proc.on('exit', function () {
    spinner.stop()
    done()
  })
}

function handleWait(step, done) {
  done()
}

function handleUnblock(step, i, done) {
  let message = 'Would you like to unblock the next step?'

  if (step.label) {
    message = `Would you like to unblock: ${step.label}?`
  }

  let name = `step_${i}`

  inquirer.prompt({
    type: 'confirm',
    name,
    message
  }).then(function (answers) {
    if (answers[name] === true) {
      return done()
    }

    process.exit()
  })
}

processStep(startIndex)
