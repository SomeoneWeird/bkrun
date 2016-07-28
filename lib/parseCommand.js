import { parse } from 'parse-spawn-args'

export default function parseCommand (command) {
  let split = command.split(' ')
  let cmd = split.splice(0, 1)[0]
  let args = parse(split.join(' '))
  return [ cmd, args ]
}
