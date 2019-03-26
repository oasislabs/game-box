const Web3 = require('web3')
const Web3c = require('web3c')
const chalk = require('chalk')
const ora = require('ora')
const minimist = require('minimist')
const codecs = require('codecs')
const { Game, GameServer } = require('oasis-game-client')

const truffleConfig = require('../truffle-config.js')

let args = minimist(process.argv.slice(2), {
  number: ['num-players'],
  string: ['network'],
  default: {
    'num-players': 2,
    network: 'oasis'
  }
})

module.exports = async function (cb) {
  let networkConfig = truffleConfig.config[args.network]
  const provider = truffleConfig.networks[args.network].provider()
  let web3c = new Web3c(provider)
  let eventsWeb3c = new Web3c(networkConfig.wsEndpoint)

  let serverAddress = args.server || artifacts.require('GameServerContract').address

  let spinner = ora({
    text: chalk.blue(`Creating a new game with game contract ${serverAddress}`),
    color: 'blue'
  }).start()


  let privateKey = '0x' + provider.wallets[provider.addresses[0]]._privKey.toString('hex')
  let server = new GameServer(serverAddress, {
    privateKey,
    web3c,
    eventsWeb3c,
    confidential: true
  })
  await server.ready()

  let port = process.env['PORT'] || 8080

  try {
    let { playerInfo, game }  = await server.createGameWithWallets(args['num-players'])
    await game.ready()

    let urls = []
    for (let [playerId, { token, privateKey }] of playerInfo) {
      let encodedInfo = codecs('json').encode({
        privateKey: privateKey.toString('base64'),
        token: token.toString('base64')
      }).toString('base64')
      let url = `http://localhost:${port}/multiplayer?gameId=${game.id}&token=${encodedInfo}`
      urls.push({ playerId, url })
    }
    spinner.succeed(chalk.green(`Created a new game with ID: ${game.id}`))
    for (let { playerId, url } of urls) {
      console.log(`    Share this link with Player ${playerId}: ${chalk.blue(url)}`)
    }
  } catch (err) {
    spinner.fail(chalk.red(`Could not create a new game: ${err}`))
  }
  
  cb()
}
