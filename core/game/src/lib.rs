#[macro_use]
extern crate serde_derive;
#[macro_use]
extern crate serde_json;
#[macro_use]
extern crate quick_error;

extern crate game_engine;
#[macro_use]
extern crate game_engine_derive;

use serde_json::Value;
use std::error::Error;
use game_engine::{*, Game as InnerGame};
use game_engine_derive::{flow, moves};

/// Error types.
quick_error! {
    #[derive(Debug)]
    pub enum Errors {
        InvalidCell {
            description("invalid cell")
            display("A move must specify a valid cell.")
        }
    }
}

/// Define the state shape.
/// State type.
pub type Cells = [i32; 9];
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct State {
    pub cells: Cells
}
impl Default for State {
    fn default() -> Self {
        State {
            cells: [-1; 9]
        }
    }
}

fn is_victory (cells: Cells) -> Option<[usize; 3]> {
    let positions: [[usize; 3]; 8] = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];
    for (_, pos) in positions.iter().enumerate() {
        let symbol = cells[pos[0]];
        if symbol == -1 {
            continue;
        }
        let mut won = Some(*pos);
        for (_, i) in pos.iter().enumerate() {
            if cells[*i] != symbol {
                won = None;
                break;
            }
        }
        if won.is_some() {
            return won;
        }
    }
    None
}

/// Define your moves as methods in this trait.
#[moves]
trait Moves {
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
}

/// Define the game flow.
#[flow]
trait Flow {
    fn initial_state(&self) -> State {
        State {
            cells: [-1; 9]
        }
    }

    fn end_turn_if(&self, _: &UserState<State>) -> bool {
        // End the turn after every move.
        true
    }

    fn end_game_if(&self, state: &UserState<State>) -> Option<(Option<Score>, Value)> {
        // TODO: Make a macro to simplify returning JSON values.
        // TODO: The error handling case for these flow methods is still inadequate.
        if let Some(pos) = is_victory(state.g.cells) {
            let winner = state.ctx.current_player;
            return Some((Some(Score::Win(winner)), json!({
                "winner": winner,
                "winning_cells": pos
            })));
        }
        if state.g.cells.into_iter().all(|c| *c != -1) {
            return Some((Some(Score::Draw), json!({
                "draw": true
            })));
        }
        None
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
