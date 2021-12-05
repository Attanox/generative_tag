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

  function handleUpdateMvmt(data) {
    Object.keys(data).forEach((agentID) => {
      updateAgent(
        agentID,
        data[agentID].pos,
        data[agentID].vel,
        data[agentID].tagged
      );
    });
  }

  function handleJoinGame({ roomName: room, player }) {
    const id = uuidv4();

    clientRoomMap[id] = roomName;

    client.join(roomName);
    client.id = id;

    const playerProps = {
      id,
      tagged: isTagged(),
      alive: true,
      ...player,
    };

    addAgent(id, playerProps);
    // // TODO: test without this
    client.emit("displayPlayer", playerProps);

    startGameInterval(roomName);
  }

  function someAgents() {
    const agents = state[roomName].agents;
    return Object.keys(agents).length !== 0;
  }

  function isTagged() {
    return someAgents() ? false : true;
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

  function updateAgent(id, pos, vel, tagged) {
    state[roomName] = {
      ...state[roomName],
      agents: {
        ...state[roomName].agents,
        [id]: {
          ...state[roomName].agents[id],
          pos,
          vel,
          tagged,
        },
      },
    };
  }

  function startGameInterval(roomName) {
    const intervalId = setInterval(() => {
      emitGameState(roomName, state[roomName]);
    }, 1000 / FRAME_RATE);
  }
});

function handleMovePlayer({ id, pos, vel, tagged }) {
  updateAgent(id, pos, vel, tagged);

  // io.sockets.in(roomName).emit("changePlayerPosition", { id, pos, vel });
}

function emitGameState(room, gameState) {
  // Send this event to everyone in the room.
  io.sockets.in(room).emit("gameState", JSON.stringify(gameState));
}

// TODO: use .env
io.listen(3000);

console.log("🚀🚀🚀");