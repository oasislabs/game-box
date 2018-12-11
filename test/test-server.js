const Web3 = require('web3');
const minimist = require('minimist')
const { GameServer, Game } = require('oasis-game-client')

const GameServerContract = artifacts.require('GameServerContract')
const web3 = new Web3(GameServerContract.web3.currentProvider)

const truffleConfig = require('../truffle-config.js')
let args = minimist(process.argv.slice(2))
let networkConfig = truffleConfig.config[args.network || 'development']
let eventsWeb3 = new Web3(new Web3.providers.WebsocketProvider(networkConfig.wsEndpoint))

async function delay (ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

contract('GameServerContract', async (accounts) => {

  it('should create a new game', async () => {
    let server = new GameServer(GameServerContract.address, {
      web3,
      eventsWeb3,
      account: 0
    })
    let game = await server.createGame([
      {
        address: accounts[0],
        is_bot: false
      },
      {
        address: accounts[1],
        is_bot: false
      }
    ])

    assert.equal(game.id, 1)

    let players = await game.getRegisteredPlayers()

    assert.deepEqual(players[accounts[0].toLowerCase()], [1])
    assert.deepEqual(players[accounts[1].toLowerCase()], [2])
  })

  it('should complete a game', async () => {
    let server1 = new GameServer(GameServerContract.address, {
      web3,
      eventsWeb3,
      account: 0
    })
    let server2 = new GameServer(GameServerContract.address, {
      web3,
      eventsWeb3,
      account: 1
    })

    let game1 = await server1.createGame([
      {
        address: accounts[0],
        is_bot: false
      },
      {
        address: accounts[1],
        is_bot: false
      }
    ])
    await game1.ready()

    let game2 = new Game(server2, game1.id)

    // Alternate moves until victory.
    await game1.sendAction({
      MakeMove: {
        move_type: 'click_slot',
        player_id: 1,
        args: [0]
      }
    })

    await game2.sendAction({
      MakeMove: {
        move_type: 'click_slot',
        player_id: 2,
        args: [1]
      }
    })

    await game1.sendAction({
      MakeMove: {
        move_type: 'click_slot',
        player_id: 1,
        args: [0]
      }
    })

    await game2.sendAction({
      MakeMove: {
        move_type: 'click_slot',
        player_id: 2,
        args: [1]
      }
    })

    await game1.sendAction({
      MakeMove: {
        move_type: 'click_slot',
        player_id: 1,
        args: [0]
      }
    })

    await game2.sendAction({
      MakeMove: {
        move_type: 'click_slot',
        player_id: 2,
        args: [1]
      }
    })

    await game1.sendAction({
      MakeMove: {
        move_type: 'click_slot',
        player_id: 1,
        args: [0]
      }
    })

    await delay(200)

    let state1 = game1.getLastState()
    let state2 = game2.getLastState()

    assert.ok(state1.ctx.gameover)
    assert.ok(state2.ctx.gameover)
  })
})
