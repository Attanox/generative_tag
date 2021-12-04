const { initGame } = require("./game");

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
  client.on("addAgent", handleAddAgent);

  function handleJoinGame({ roomName, player }) {
    const id = uuidv4();

    clientRoomMap[id] = roomName;

    client.join(roomName);
    client.id = id;

    client.emit("displayPlayer", {
      id,
      tagged: isTagged(),
      alive: true,
      ...player,
    });

    client.emit("init", "Hello from server 👋");

    // startGameInterval(roomName);
  }

  function someAgents() {
    const agents = state[roomName].agents;
    return Object.keys(agents).length !== 0;
  }

  function isTagged() {
    return someAgents() ? false : true;
  }

  /**
   *
   * @param {vel: {x, y}, pos: {x, y}, radius} payload
   */
  function handleAddAgent(payload) {
    console.log("adding agent to state 🦈");
    console.log({ payload });
    const id = uuidv4();

    // * client is adding new agent
    state[roomName] = {
      ...state[roomName],
      agents: {
        ...state[roomName].agents,
        [id]: {
          ...payload,
        },
      },
    };

    // * emit to all clients to add new agent
    client.emit("displayAgent", {
      id,
      tagged: isTagged(),
      alive: false,
      ...payload,
    });
  }
});

// TODO: use .env
io.listen(3000);

console.log("🚀🚀🚀");
