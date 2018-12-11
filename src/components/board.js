/*
 * Copyright 2017 The boardgame.io Authors.
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { GameInfo } from 'oasis-game-components';
import './board.css';

class Board extends React.Component {
  static propTypes = {
    G: PropTypes.any.isRequired,
    ctx: PropTypes.any.isRequired,
    moves: PropTypes.any.isRequired,
    playerID: PropTypes.number,
    isSpectating: PropTypes.bool,
    isActive: PropTypes.bool,
    isMultiplayer: PropTypes.bool,
  };

  onClick = id => {
    if (this.isActive(id)) {
      this.props.moves.click_cell(id)
    }
  };

  isActive(id) {
    let ctx = this.props.ctx
    let playerId = this.props.playerID
    let myTurn = playerId && (
      ctx.current_player === playerId ||
      (ctx.active_players && ctx.active_players.indexOf(playerId) !== -1)
    )
    return myTurn && this.props.G.cells[id] === -1
  }

  format (cellValue) {
    if (cellValue === -1) return '';
    return cellValue;
  }

  getVictoryInfo () {
    let gameover = this.props.ctx.gameover
    if (gameover) {
      let victoryInfo = {};
      if (!gameover.winner) {
        var color = 'orange'
        var text = 'It\'s a draw!'
      } else {
        color = (gameover.winner == this.props.playerID || this.props.isSpectating) ? 'green' : 'red'
        text = `Player ${gameover.winner} won!`
      }
      victoryInfo.winner = <div className={color} id="winner">{text}</div>;
      victoryInfo.color = color
      victoryInfo.cells = new Set(gameover.winning_cells)
      console.log('VICTORY INFO:', victoryInfo)
      return victoryInfo
    }
    return null
  }

  getCellClass (victoryInfo, id) {
    let cellClass = this.isActive(id) ? 'active' : ''
    if (victoryInfo && victoryInfo.cells.has(id)) {
      cellClass += ` bg-${victoryInfo.color} white`
    }
    return cellClass
  }

  render() {
    let victoryInfo = this.getVictoryInfo() 
    let tbody = [];
    for (let i = 0; i < 3; i++) {
      let cells = [];

      for (let j = 0; j < 3; j++) {
        const id = 3 * i + j;

        let cellValue = '';
        switch (this.props.G.cells[id]) {
            case 1:
                cellValue = 'X';
                break;
            case 2:
                cellValue = "O";
                break;
        }

        cells.push(
          <td
            key={id}
            className={this.getCellClass(victoryInfo, id)}
            onClick={() => this.onClick(id)}
          >
            {cellValue}
          </td>
        );
      }
      tbody.push(<tr key={i}>{cells}</tr>);
    }

    let player = null;
    if (this.props.playerID) {
      player = <div id="player">Player: {this.props.playerID}</div>;
    }

    let rendered = (
      <div className="flex flex-column justify-center items-center">
        <table id="board">
          <tbody>{tbody}</tbody>
        </table>
        <GameInfo winner={victoryInfo ? victoryInfo.winner : null} {...this.props} />
      </div>
    );
    console.log('RETURNING RENDERED:', rendered)
    return rendered;
  }
}

export default Board;
