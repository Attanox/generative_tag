const { initGame } = require("./game");
const { FRAME_RATE } = require("./constants");

const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")();

const state = {};
const clientRoomMap = {};

// TODO: possibility for multiple rooms...
const roomName = "cool_room_name";
state[roomName] = initGame();

// * listen for client connecting to socket
io.on("connection", (client) => {
  // * once client connects join them to game
  client.on("joinGame", handleJoinGame);
  client.on("movePlayer", handleMovePlayer);
  client.on("updateMvmt", handleUpdateMvmt);
  client.on("updateTagged", handleUpdateTagged);
  client.on("exit", handleExit);

  function handleExit(id) {
    delete state[roomName].agents[id];

    io.sockets.in(roomName).emit("playerExit", id);
  }

  function handleUpdateMvmt(data) {
    Object.keys(data).forEach((agentID) => {
      updateAgent(agentID, data[agentID].pos, data[agentID].vel);
    });
  }

  function handleUpdateTagged(taggedPlayerID) {
    state[roomName].taggedPlayer = taggedPlayerID;
  }

  function handleJoinGame({ roomName: room, player, obsticles }) {
    const id = uuidv4();

    clientRoomMap[id] = roomName;

    client.join(roomName);
    client.id = id;

    const playerProps = {
      id,
      ...player,
    };

    if (!someAgents()) {
      state[roomName].taggedPlayer = id;
    }

    addObsticles(obsticles);

    addAgent(id, playerProps);

    client.emit("displayPlayer", playerProps);
  }

  function addObsticles(obsticles) {
    if (someAgents()) return;
    state[roomName] = {
      ...state[roomName],
      obsticles,
    };
  }

  function someAgents() {
    const agents = state[roomName].agents;
    return Object.keys(agents).length !== 0;
  }

  function addAgent(id, payload) {
    state[roomName] = {
      ...state[roomName],
      agents: {
        ...state[roomName].agents,
        [id]: {
          ...payload,
        },
      },
    };
  }

  function updateAgent(id, pos, vel) {
    state[roomName] = {
      ...state[roomName],
      agents: {
        ...state[roomName].agents,
        [id]: {
          ...state[roomName].agents[id],
          pos,
          vel,
        },
      },
    };
  }

  function handleMovePlayer({ id, pos, vel }) {
    updateAgent(id, pos, vel);
  }

  setInterval(() => {
    emitGameState(roomName, state[roomName]);
  }, 1000 / FRAME_RATE);
});

function emitGameState(room, gameState) {
  // Send this event to everyone in the room.
  io.sockets.in(room).emit("gameState", JSON.stringify(gameState));
}

io.listen(process.env.PORT || 3000);

console.log("🚀🚀🚀");
