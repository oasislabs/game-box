# Making Games with Oasis
This example project demonstrates how to build a turn-based game, Connect Four, on the Oasis testnet. Our framework (inspired by [boardgame.io](https://github.com/nicolodavis/boardgame.io) lets you define a core set of game rules in Rust that can be run locally for in-browser testing, then deployed the Oasis testnet for live games, all without needing to touch WebAssembly or web3 (though under-the-hood we use both).

Here are the interesting bits of this Truffle box:
1. `core/game` is where your game logic is defined. This `core` module is imported into a browser-compatible WebAssembly module in `core/client`, and an Oasis-compatible smart contract in `contracts/server`.
2. `contracts/server` is where you smart contract is defined. It imports your core game logic and creates a game server contract that manages game instances running on the Oasis testnet.
3. `src` is where your frontend code is defined. You should only need to edit `src/components/board.js` and `src/components/board.css` to create new games.
4. `scripts` contains helper scripts to get you started. These are described in more detail below.

## Installation
This Truffle Box is designed to run from within your Contract Kit container. If you haven't already, pull the `oasislabs/contract-kit` image from Docker Hub.

1. Launch your Contract Kit container: `docker run --net=host -it oasislabs/contract-kit:latest /bin/bash`
   (If you'd prefer not to use `--net=host`, you can use the `-p` option to forward whichever ports you like).

The remaining steps are meant to be run in a shell inside your new `oasislabs/contract-kit` container.
1. Install `wasm-bindgen`: `cargo install wasm-bindgen-cli` (this can take some time).
2. Unbox this repo: `truffle unbox oasis-game-framework/game-box`

### Specifying credentials
If you want to deploy on Oasis, make sure your mnemonic is defined in `secrets.json`. This file is not tracked by your repo, but it's imported by Truffle during migration and frontend compilation. The default Contract Kit mnemonic is already there, ready to use.

## Creating your game
Once this example has been unboxed, you're ready to start building your game. For more details about the architecture of the game framework, see (insert detailed docs link here).

In most cases, the only files you'll need to edit are `core/game/src/lib.rs` and `src/components/board.js` -- everything else should be done for you.

## Building + Migrating
Building is separated into three stages, each with a corresponding build script. From the repo root:
1. Building Rust dependencies: `./scripts/build-crates.sh`
2. Migrate your contracts onto a testnet: `truffle migrate --network (your network)`
3. Build frontend components: `truffle exec ./scripts/build-frontend.js --network (your network)`

It's important that (3) always be performed after (2), and with `truffle exec`, because it depends on the address of your deployed contract, which Truffle automatically determines.

Once everything is built and migrated, you're ready to play!

## Playing
This box currently contains the following game modes:
1. Singleplayer: Two boards are rendered on the same screen, and a single user makes moves for
   both. This is useful for debugging your core game logic.
2. Two Player (On-Chain): Production time! This game mode allows for multiple players, or bots,
   to compete using a game contract running on Oasis.

### Singleplayer
To debug your game in singleplayer mode, first complete the installation steps above, then perform
the following steps:
1. `npm start`
2. Navigate to `localhost:8080/singleplayer` in your browser (or whichever port you've chosen to use)

This mode launches a local game server on port 8080 (note: this is an HTTP server, not an Ekiden 
gateway -- there is no blockchain involved in this game mode).

### Two Player
To play a complete end-to-end, on-chain game with a friend there are a few more steps:
1. Create a new game on the testnet: `truffle exec ./scripts/create.js --network (your network) --players (address1),(address2)...`
   (The addresses you list will be assigned player IDs in order, so `address1` becomes Player 1, and so on. Make sure these addresses have already been funded!)
 2. `npm start`
 3.  Navigate to `localhost:8080/multiplayer/(game id)`
 
If your players are using different computers, make sure that *both* the web server *and* the testnet are accessible to all parties -- this might require updating the networking configuration in the `config` section of `truffle-config.js`.

If you're using the Oasis testnet, you will not need to update any networking configuration.

