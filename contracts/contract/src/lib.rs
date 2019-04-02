extern crate core;
extern crate oasis_game_contract;

use core::Game;
use oasis_game_contract::gameserver::*;

use owasm_std::logger::debug;

use std::panic;

pub struct ServerFactory;
impl ServerFactory {
    pub fn create() -> GameServer {
        GameServer {
            factory: Box::new(Game {})
        }
    }
}

#[owasm_abi_derive::contract]
trait GameServerContract {
    fn create(&mut self, _tokens: Vec<u8>) {
        let mut server = ServerFactory::create();
        let id = server.create(_tokens.clone());
        self.NewGame(id, _tokens);
    }

    fn ready(&mut self, _game_id: u64, _token: Vec<u8>, _key: [u8; 16], _iv: [u8; 16], _entropy: Vec<u8>) -> u64 {
        let mut server = ServerFactory::create();
        let (player_id, started) = server.ready(_game_id, _token, _key, _iv, &mut _entropy.clone()).expect("Could not set ready status");
        if started {
            self.GameStarted(_game_id);
        }
        player_id as u64
    }

    fn sendAction(&mut self, _game_id: u64,  _player_id: u64, _game_move: Vec<u8>) {
        let mut server = ServerFactory::create();
        let player_updates = server.handle_action(_game_id, _player_id, _game_move).unwrap();
        for (event_id, player_id, state) in player_updates.iter() {
            self.GameEvent(_game_id, *player_id as u64, *event_id, state.to_vec());
        }
    }

    #[constant]
    fn getState(&mut self, _game_id: u64, _player_id: u64) {
        let mut server = ServerFactory::create();
        let state = server.get_state(_game_id, _player_id).expect("Could not get state");
        self.GameState(state);
    }

    #[constant]
    fn getPlayers(&mut self, _game_id: u64) -> Vec<u8> {
        let mut server = ServerFactory::create();
        server.get_players(_game_id).expect("Could not get players")
    }
    
    #[constant]
    fn getMoves(&mut self, _game_id: u64) -> Vec<u8> {
        let mut server = ServerFactory::create();
        server.get_moves(_game_id).expect("Could not get moves")
    }

    #[event]
    fn GameEvent(&mut self, indexed_id: u64, indexed_player_id: u64, _event_id: u64, _state: Vec<u8>);
    #[event]
    fn GameState(&mut self, _state: Vec<u8>);
    #[event]
    fn NewGame(&mut self, _id: u64, _players: Vec<u8>);
    #[event]
    fn GameStarted(&mut self, indexed_id: u64);
}
