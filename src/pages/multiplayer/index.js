/*
 * Copyright 2017 The boardgame.io Authors.
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

// React-specific imports
import Async from 'react-promise';
import React from 'react';
import { render } from 'react-dom';

// Client-side WASM imports.
import bindingsPromise from '../../../core/client';
import createProxyBuilder from 'oasis-game-client-proxy';

// Multiplayer game imports.
import { GameWrapper, Client } from 'oasis-game-components';
import { Game, GameServer } from 'oasis-game-client';
import Web3 from 'web3'

// Game component imports.
import Board from '../../components/board';

const Multiplayer = () => {
  // TODO: Better way to get game parameters.
  let splitUrl = window.location.pathname.split('/');
  let gameId = +splitUrl[2];

  // TODO: Extract this into a separate JS wallet manager.
  // The all-caps fields are injected by Webpack during the build.
  let eventsWeb3 = new Web3(new Web3.providers.WebsocketProvider(WS_ENDPOINT));

  let createGame = async function () {
    window.web3 = new Web3(ethereum);
    await ethereum.enable();
    let server = new GameServer(CONTRACT_ADDRESS, {
      web3: web3,
      eventsWeb3: eventsWeb3
    });
    let game = new Game(server, gameId);
    return game.ready();
  }

  let proxyPromise = Promise.all([
    bindingsPromise,
    createGame()
  ]).then(async ([bindings, game]) => {
    let builder = createProxyBuilder(bindings);
    let proxy = await builder([1, 2], game, game.playerId).ready();
    return [proxy, game];
  });

  let PlayerComponent = (props) => {
    let proxy = props.proxy
    let game = props.game

    let playerId = game.playerId
    let Player = Client({
      board: Board,
      proxy,
      playerId,
      players: [1, 2],
      multiplayer: game,
      debug: true
    });

    return (
      <div style={{ padding: 50 }}>
        <h1>Two Players (On-Chain)</h1>
        <Player />
      </div>
    );
  }

  return (
    <GameWrapper proxyPromise={proxyPromise}>
      <PlayerComponent />
    </GameWrapper>
  );
}

render(
    <Multiplayer />,
    document.getElementById('app')
);
