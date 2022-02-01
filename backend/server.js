const { initGame } = require("./game");
const {
  FRAME_RATE,
  OBSTICLES_NUM,
  REFRESH_OBSTICLES_DEFAULT,
} = require("./constants");

const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")();

const state = {};
const clientRoomMap = {};

// TODO: possibility for multiple rooms...
const roomName = "cool_room_name";
state[roomName] = initGame();

let refreshObsticlesCounter = 0;

// * listen for client connecting to socket
io.on("connection", (client) => {
  // * once client connects join them to game
  client.on("joinGame", handleJoinGame);
  client.on("movePlayer", handleMovePlayer);
  client.on("updateMvmt", handleUpdateMvmt);
  client.on("updateTagged", handleUpdateTagged);
  client.on("exit", handleExit);
  client.on("removeVessel", handleRemoveVessel);

  function handleExit(id) {
    delete state[roomName].agents[id];
    state[roomName].agents = { ...state[roomName].agents };

    state[roomName].taggedPlayers = state[roomName].taggedPlayers.filter(
      (el) => el !== id
    );

    io.sockets.in(roomName).emit("playerExit", id);

    if (state[roomName].taggedPlayers.length === 0 && someAgents()) {
      const agentKeys = Object.keys(state[roomName].agents);
      const lastOne = agentKeys[0];
      state[roomName].taggedPlayers = [lastOne];
    }
  }

  function handleUpdateMvmt(data) {
    Object.keys(data).forEach((agentID) => {
      updateAgent(agentID, data[agentID].pos, data[agentID].vel);
    });
  }

  function setTaggedPlayers(id) {
    const taggedPlayersSet = new Set([...state[roomName].taggedPlayers, id]);

    state[roomName].taggedPlayers = Array.from(taggedPlayersSet);
  }

  function handleUpdateTagged({ tag, untag }) {
    setTaggedPlayers(tag);

    state[roomName].taggedPlayers = state[roomName].taggedPlayers.filter(
      (t) => t !== untag
    );
  }

  function handleJoinGame({ roomName: room, player, dimensions }) {
    const id = uuidv4();

    clientRoomMap[id] = roomName;

    client.join(roomName);
    client.id = id;

    const playerProps = {
      id,
      ...player,
    };

    setTaggedPlayers(id);

    addAgent(id, playerProps);

    saveDimensions(dimensions);

    const gameState = state[roomName];
    const vessels = gameState.vessels;
    const taggedPlayers = gameState.taggedPlayers;

    if (
      someAgents() &&
      agentsLength() > 1 &&
      vessels.length + taggedPlayers.length <= agentsLength()
    ) {
      addVessel(player.oppositePos, player.vel, player.radius);
    }

    client.emit("displayPlayer", playerProps);
  }

  function saveDimensions(dimensions) {
    state[roomName].dimensions = dimensions;
  }

  function agentsLength() {
    const agents = state[roomName].agents;
    return Object.keys(agents).length;
  }

  function someAgents() {
    return agentsLength() !== 0;
  }

  function addVessel(pos, vel, radius) {
    const id = uuidv4();
    state[roomName] = {
      ...state[roomName],
      vessels: [...state[roomName].vessels, { id, pos, vel, radius }],
    };
  }

  function handleRemoveVessel({ vesselID, playerID }) {
    state[roomName] = {
      ...state[roomName],
      vessels: state[roomName].vessels.filter((v) => v.id !== vesselID),
      taggedPlayers: state[roomName].taggedPlayers.filter(
        (t) => t !== playerID
      ),
    };
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
    if (state[roomName].agents[id]) {
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
  }

  function handleMovePlayer({ id, pos, vel }) {
    updateAgent(id, pos, vel);
  }

  setInterval(() => {
    emitGameState(roomName, state[roomName]);
  }, 1000 / FRAME_RATE);
});

function getProperties({ width, height }) {
  const x = Math.random() * (width - 50);
  const y = Math.random() * (height - 50);

  const w = 10 * (Math.floor(Math.random() * 5) + 1);
  const h = 10 * (Math.floor(Math.random() * 5) + 1);
  return { x, y, w, h };
}

function createObsticles(dimensions) {
  return [...Array(OBSTICLES_NUM)].map(() => getProperties(dimensions));
}

function emitGameState(room, gameState) {
  if (gameState.dimensions.width && gameState.dimensions.height) {
    refreshObsticlesCounter--;
    if (refreshObsticlesCounter <= 0) {
      gameState.obsticles = createObsticles(gameState.dimensions);
      refreshObsticlesCounter = REFRESH_OBSTICLES_DEFAULT;
    }
  }

  // Send this event to everyone in the room.
  io.sockets.in(room).emit("gameState", JSON.stringify(gameState));
}

io.listen(process.env.PORT || 3000);

console.log("🚀🚀🚀");
