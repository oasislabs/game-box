#[macro_use]
extern crate serde_derive;
#[macro_use]
extern crate serde_json;
#[macro_use]
extern crate quick_error;
#[macro_use]
extern crate lazy_static;

extern crate game_engine;
#[macro_use]
extern crate game_engine_derive;

use serde_json::Value;
use game_engine::{*, Game as InnerGame};
use game_engine_derive::{flow, moves};

use std::error::Error;
use std::ops::Range;

/// Error types.
quick_error! {
    #[derive(Debug)]
    pub enum Errors {
        InvalidSlot {
            description("invalid slot")
            display("A move must specify a valid slot.")
        }
    }
}

lazy_static! {
    static ref VICTORY_TESTS: [(Range<i32>, Range<i32>, [(i32, i32); 4]); 4] = {
        let horizontal_check = ((0..6), (0..4), [(0, 0), (0, 1), (0, 2), (0, 3)]);
        let vertical_check = ((0..3), (0..7), [(0, 0), (1, 0), (2, 0), (3, 0)]);
        let asc_diagonal_check = ((3..6), (0..4), [(0, 0), (-1, 1), (-2, 2), (-3, 3)]);
        let desc_diagonal_check = ((3..6), (3..7), [(0, 0), (-1, -1), (-2, -2), (-3, -3)]);
        [horizontal_check, vertical_check, asc_diagonal_check, desc_diagonal_check]
    };
}

/// Define the state shape.
/// State type.
pub type Grid = [[i32; 7]; 6];
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct State {
    pub grid: Grid
}

fn is_victory (grid: Grid) -> Option<Vec<(usize, usize)>> {
    // Modified version of algorithm by ferdelOlmo: https://stackoverflow.com/a/38211417/129967
    for (row_range, col_range, offsets) in VICTORY_TESTS.iter() {
        for row_idx in row_range.clone() {
            for col_idx in col_range.clone() {
                let mut values = offsets.iter().map(|(x, y)| {
                    let pos = ((row_idx + x) as usize, (col_idx + y) as usize);
                    (pos, grid[pos.0][pos.1])
                });
                let first = values.nth(0).unwrap().1;
                if first == -1 {
                    continue;
                }
                if values.all(|(_, value)| value == first){
                    return Some(values.map(|v| v.0).collect())
                }
            }
        }
    }
  None
}

/// Define your moves as methods in this trait.
#[moves]
trait Moves {
    fn click_slot(state: &mut UserState<State>, args: &Option<Value>) -> Result<(), Box<Error>> {
        if let Some(value) = args {
            let id = value.as_array()
                .and_then(|arr| arr.get(0))
                .and_then(|slot| slot.as_u64())
                .and_then(|slot| Some(slot as usize))
                .ok_or(Box::new(Errors::InvalidSlot))?;
            for row in 0..6 {
                if state.g.grid[row][id] == -1 {
                    state.g.grid[row][id] = state.ctx.current_player as i32;
                    return Ok(());
                }
            }
            Err(Box::new(Errors::InvalidSlot))
        } else {
            return Err(Box::new(Errors::InvalidSlot))
        }
    }
}

/// Define your game flow as methods in this trait.
#[flow]
trait Flow {
    fn initial_state(&self) -> State {
        State {
            grid: [[-1; 7]; 6]
        }
    }

    fn end_turn_if(&self, _: &UserState<State>) -> bool {
        // End the turn after every move.
        true
    }

    fn end_game_if(&self, state: &UserState<State>) -> Option<(Option<Score>, Value)> {
        // TODO: Make a macro to simplify returning JSON values.
        // TODO: The error handling case for these flow methods is still inadequate.
        if let Some(pos) = is_victory(state.g.grid) {
            let winner = state.ctx.current_player;
            return Some((Some(Score::Win(winner)), json!({
                "winner": winner,
                "winning_cells": pos
            })));
        }
        for row in 0..6 {
            for col in 0..7 {
                if state.g.grid[row][col] == -1 {
                    return None;
                }
            }
        }
        return Some((Some(Score::Draw), json!({
            "draw": true
        })));
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
