import inquirer from 'inquirer'

export default function promptForConfirm (question, callback) {
  inquirer.prompt({
    type: 'confirm',
    name: 'ok',
    message: question
  }).then(function (answers) {
    return callback(answers.ok === true)
  })
}
