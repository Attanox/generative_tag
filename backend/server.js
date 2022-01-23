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
  client.on("removeVessel", handleRemoveVessel);

  function handleExit(id) {
    delete state[roomName].agents[id];

    io.sockets.in(roomName).emit("playerExit", id);
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

  function handleJoinGame({ roomName: room, player, obsticles }) {
    const id = uuidv4();

    clientRoomMap[id] = roomName;

    client.join(roomName);
    client.id = id;

    const playerProps = {
      id,
      ...player,
    };

    setTaggedPlayers(id);

    addObsticles(obsticles);

    addAgent(id, playerProps);

    if (someAgents() && state[roomName].vessels.length + 2 < agentsLength()) {
      addVessel(player.oppositePos, player.vel, player.radius);

      // addVessel(
      //   { ...player.oppositePos, y: player.oppositePos.y + 50 },
      //   player.vel,
      //   player.radius
      // );
      // addVessel(
      //   { ...player.oppositePos, y: player.oppositePos.y - 50 },
      //   player.vel,
      //   player.radius
      // );
      // addVessel(
      //   { ...player.oppositePos, x: player.oppositePos.x + 50 },
      //   player.vel,
      //   player.radius
      // );
    }

    client.emit("displayPlayer", playerProps);
  }

  function addObsticles(obsticles) {
    if (someAgents()) return;
    state[roomName] = {
      ...state[roomName],
      obsticles,
    };
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
