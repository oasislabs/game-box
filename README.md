# Making Games with Oasis
This example project demonstrates how to build a turn-based game, Connect Four, on the Oasis testnet. Our framework (inspired by [boardgame.io](https://github.com/nicolodavis/boardgame.io) lets you define a core set of game rules in Rust that can be run locally for in-browser testing, then deployed the Oasis testnet for live games, all without needing to touch WebAssembly or web3 (though under-the-hood we use both).

Here are the interesting bits of this Truffle box:
1. `core/game` is where your game logic is defined. This `core` module is imported into a browser-compatible WebAssembly module in `core/client`, and an Oasis-compatible smart contract in `contracts/server`.
2. `contracts/server` is where your smart contract is defined. It imports your core game logic and creates a game server contract that manages game instances running on the Oasis testnet.
3. `src` is where your frontend code is defined. You should only need to edit `src/components/board.js` and `src/components/board.css` to create new games.
4. `scripts` contains helper scripts to get you started. These are described in more detail below.

## Installation
This Truffle Box is designed to run from within your Contract Kit container. If you haven't already, pull the `oasislabs/contract-kit` image from Docker Hub.

1. Launch your Contract Kit container: 
   * `docker run -v "$PWD":/project -p8545:8545 -p8546:8546 -p8080:8080 -it oasislabs/contract-kit:latest /bin/bash`
   
The remaining steps are meant to be run in a shell inside your new `oasislabs/contract-kit` container.
1. Install `wasm-bindgen`: `cargo install wasm-bindgen-cli` (this can take some time).
2. Create a directory for your new project: `mkdir (project name) && cd (project name)`
2. Unbox this repo: `truffle unbox oasis-game-framework/game-box`
3. (optionally) Start a local Parity instance for debugging: `./scripts/start-parity.sh`
   * (Note: This will launch Parity with very loose network settings -- feel free to restrict those to localhost if you don't want to test with other machines on your local network)

### Specifying credentials
If you want to deploy on Oasis, make sure your mnemonic is defined in `secrets.json`. This file is not tracked by your repo, but it's imported by Truffle during migration and frontend compilation. The default Contract Kit mnemonic is already there, ready to use.

## Creating your game
Once this example has been unboxed, you're ready to start building your game. For more details about the architecture of the game framework, see (insert detailed docs link here).

In most cases, the only files you'll need to edit are `core/game/src/lib.rs` and `src/components/board.js` -- everything else should be done for you.

### API
Our APIs let you describe broad types of turn-based games with little more than a state description and a handful of flow functions. A complete game definition for our example game (Tic-Tac-Toe) can be found in [core/game/src/lib](core/game/src/lib). Games are comprised of the following pieces:
1. *State*: Your game state can be any JSON-serializable data structure, and is defined as a Rust struct.
2. *Moves*: Your moves are defined in a Rust trait, wrapped by our `#[moves]` macro. A move is a function that takes in a state and an action, and produces a new state.
3. *Flow*: Flow methods describe how your game progresses over time. You can define hooks `end_game_if`, which take your game state as an input, and tell the game engine if the game is finished. See below for a list of the available flow methods.

#### Moves
Move methods are entirely user-defined, and you can have as many as you like. For Tic-Tac-Toe, there is only one possible move, and so our Moves trait looks like:
```rs
#[moves]
trait Moves {
  fn click_cell(cell: &mut UserState<State>, args: &Option<Value>) -> Result<...> {
    ...
  }
}
```
The game framework takes these move definitions and automatically creates corresponding Javascript methods that you can call from within your client-side JS code as follows:
```js
class Board extends React.Component {
  ...
  onClick = id => {
    if (this.isActive(id)) {
      this.props.moves.click_cell(id)
    }
  };
  ...
}
```

Since Rust is statically-typed, and move methods are user-defined, we cannot know in advance how many arguments you'll need to pass from JS into your move methods. For this reason, all move methods take an optional, untyped, JSON array of arguments as input (`args: &Option<Value>`). It's up to you to complete the deserialization step inside your own code, so you can assign a user-defined type to these inputs, i.e:
```
fn click_cell(state: &mut UserState<State>, args: &Option<Value>)
            -> Result<(), Box<Error>> {
    if let Some(value) = args {
        let id = value.as_array()
            .and_then(|arr| arr.get(0))
            .and_then(|cell| cell.as_u64())
            .and_then(|cell| Some(cell as usize))
            .ok_or(Box::new(Errors::InvalidCell))?;
   ...
}
```

Once your inputs are parsed, you can then mutate the state you're given with whatever changes are necessary. In Tic-Tac-Toe, we update a cell with the player ID of the active player:
```
fn click_cell(state: &mut UserState<State>, args: &Option<Value>)
            -> Result<(), Box<Error>> {
    if let Some(value) = args {
        let id = value.as_array()
            .and_then(|arr| arr.get(0))
            .and_then(|cell| cell.as_u64())
            .and_then(|cell| Some(cell as usize))
            .ok_or(Box::new(Errors::InvalidCell))?;
        match state.g.cells[id] {
            -1 => {
                state.g.cells[id] = state.ctx.current_player as i32;
                Ok(())
            },
            _ => Err(Box::new(Errors::InvalidCell))
        }
    } else {
        return Err(Box::new(Errors::InvalidCell))
    }
}
```

#### Flow



## Building + Migrating
Building is separated into three stages, each with a corresponding build script. From the repo root:
1. Build Rust dependencies: `./scripts/build-crates.sh`
2. Migrate contracts onto a testnet: `truffle migrate --network (your network)`
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
1. `npm start` (you can do this in another shell)
2. Navigate to `localhost:8080/singleplayer` in your browser (or whichever port you've chosen to use)

This mode launches a local game server on port 8080 (note: this is an HTTP server, not an Ekiden 
gateway -- there is no blockchain involved in this game mode).

### Multiplayer
To play a complete end-to-end, on-chain game with friends, there are a few more steps:
1. Create a new game on the testnet: `truffle exec ./scripts/create.js --network (your network) --players (address1),(address2)...`
   * (The addresses you list will be assigned player IDs in order, so `address1` becomes Player 1, and so on. Make sure these addresses have already been funded!)
 2. `npm start` (you can do this in another shell)
 3.  Navigate to `localhost:8080/multiplayer/(game id)`
 
If your players are using different computers, make sure that *both* the web server *and* the testnet are accessible to all parties -- this might require updating the networking configuration in the `config` section of `truffle-config.js`.

If you're using the Oasis testnet, you will not need to update any networking configuration.

