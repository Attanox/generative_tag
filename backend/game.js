module.exports = {
  initGame,
};

function initGame() {
  const state = createGameState();
  return state;
}

function createGameState() {
  return {
    taggedPlayers: [],
    agents: {},
    obsticles: [],
    vessels: [],
    dimensions: { width: 0, height: 0 },
  };
}
