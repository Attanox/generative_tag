module.exports = {
  initGame,
};

function initGame() {
  const state = createGameState();
  return state;
}

function createGameState() {
  return {
    agents: {},
    obsticles: [],
  };
}
