const Web3 = require('web3')
const chalk = require('chalk')
const ora = require('ora')
const minimist = require('minimist')
const { Game, GameServer } = require('oasis-game-client')

const truffleConfig = require('../truffle-config.js')

let args = minimist(process.argv.slice(2))

module.exports = async function (cb) {
  let network = args.network || 'development'
  let networkConfig = truffleConfig.config[network]
  let web3 = new Web3(truffleConfig.networks[network].provider())
  let eventsWeb3 = new Web3(new Web3.providers.WebsocketProvider(networkConfig.wsEndpoint))

  let serverAddress = args.server || artifacts.require('GameServerContract').address
  let players = args.players.split(',')

  let spinner = ora({
    text: chalk.blue(`Creating a new game with game contract ${serverAddress}`),
    color: 'blue'
  }).start()

  let server = new GameServer(serverAddress, {
    web3,
    eventsWeb3,
    account: 0
  })

  try {
    let game = await server.createGame(players.map(address => {
      return {
        address,
        is_bot: false
      }
    }))
    await game.ready()
    spinner.succeed(chalk.green(`Created a new game with ID: ${game.id}`))
  } catch (err) {
    spinner.fail(chalk.red(`Could not create a new game: ${err}`))
  }
  
  cb()
}
