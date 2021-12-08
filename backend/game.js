module.exports = {
  initGame,
};

function initGame() {
  const state = createGameState();
  return state;
}

function createGameState() {
  return {
    taggedPlayer: "",
    agents: {},
    obsticles: [],
  };
}
