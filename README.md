# Connect Four on Ekiden
This example project demonstrates how to use the (name??) game framework to build turn-based
games on Ekiden. The project consists of a handful of Rust dependencies (in the `crates/`
directory), frontend Javascript (in `src/`) and a small Express server for navigating between
different game modes.

This implementation contains an example Bot, the FirstMoveBot, which plays the first valid move
it discovers. The different game modes are described below.

## Installation

### Node Dependencies
Node dependency installation is handled by `npm`. The best way to install `node` and `npm` is
through `nvm`:
1. Install NVM using the instructions [here](https://github.com/creationix/nvm)
2. `npm install`

### Rust/Cargo Dependencies
In order to build the Rust dependencies, ensure that Rust/Cargo is installed locally with the
following toolchains and targets:
1. `rustup install nightly-2018-07-16`
2. `rustup target add wasm32-unknown-unknown`
3. `rustup default nightly-2018-07-16`

Additionally, you must install `wasm-utils`:
1. `git clone https://github.com/oasislabs/wasm-utils`
2. `cd wasm-utils && git checkout ekiden`
3. `cargo install --path ./cli --bin wasm-build --force`

## Building
All build steps are handled with `npm` scripts:

To build the Rust dependencies:
`npm run build:crates`

To build the frontend JS:
`npm run build:frontend`

To build both (this is done automatically when you start the game server):
`npm run build`

## Quick Demo
1. Follow all build steps.
2. Copy your Metamask account key to the clipboard.
3. `export ENV=(test|staging|prod)`
4. `export ACCOUNT_KEY=(your private key)`
5. `npm run demo:player-vs-bot -- --player-key (your public key)`

## Game Modes
This demo currently contains the following game modes:
1. Singleplayer: Two boards are rendered on the same screen, and a single user makes moves for
   both. This is useful for debugging your core game logic.
2. Two Player (On-Chain): Production time! This game mode allows for multiple players, or bots,
   to compete using a game contract running on the Ekiden platform.

### Singleplayer
To debug your game in singleplayer mode, first complete the installation steps above, then perform
the following steps:
1. `npm start`
2. Navigate to `localhost:8080/singleplayer` in your browser

This mode launches a local game server on port 8080 (note: this is an HTTP server, not an Ekiden 
gateway -- there is no blockchain involved in this game mode).

### Two Player with Bot
To play a complete end-to-end game, with the FirstMoveBot, on-chain, there are a few more steps:
1. Make sure that the testnet of your choosing is specified in one of the `config/(mode).json`
   files.
1. Ensure that you have a funded account on this testnet, and that you're logged into this account
   in Metamask. Copy your account key to your clipboard.
3. In one shell, run `npm start`
4. In another shell, run:
    1. `ENV=(test|staging|prod) ACCOUNT_KEY=(your account key) npm run deploy:server`
  
      This command will generate a server address which is used both in the following command,
      and in your URL path.
      
    2. `ENV=(test|staging|prod) ACCOUNT_KEY=(your account key) npm run deploy:bot -- --server=(server address) --player-id=(bot's player ID, 1 or 2)`
4. Navigate to `localhost:8080/multiplayer/(server address)/(your player ID)`
