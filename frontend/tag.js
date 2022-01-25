// const socket = io.connect("http://localhost:3000/");
const socket = io.connect("https://calm-plateau-75658.herokuapp.com/");

const RADIUS = 15;
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 500;
const OBSTICLES_NUM = 5;

let x, y;

let agents = [];
let obsticles = [];
let playerID = "";

let agentData = [];
let player;
let taggedPlayers = [];

let vessels = [];

socket.on("displayPlayer", handleDisplayPlayer);
socket.on("playerExit", handleExitPlayer);
socket.on("gameState", handleGameState);

let HUNTERS_NUM = 1;
let hunters = [];
let ghosts = [];
let ghostImg;

function preload() {
  ghostImg = loadImage("assets/ghost-solid.png");
}

function setup() {
  // * set canvas size
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

  // TODO: add roomName ?
  socket.emit("joinGame", {
    roomName: null,
    player: { ...getAddAgentPayload() },
    obsticles: createObsticles(),
  });

  for (i = 0; i < HUNTERS_NUM; i++) {
    const config = getAddAgentPayload();
    hunters.push(getAgent({ id: `hunter-${i}`, ...config }));
    ghosts.push(createGhost(config.pos.x, config.pos.y));
  }

  // ghost = createSprite(RADIUS, RADIUS);

  // * initial device motion coords
  x = 0;
  y = 0;
}

function draw() {
  // * set background color to white
  background("rgba(30,30,30,0.25)");
  // * draw ellipse
  noStroke();

  // * display variables
  fill(255);
  text("x: " + x, 25, 25);
  text("y: " + y, 25, 50);

  obsticles.forEach((o) => o.render());

  renderHunters();

  if (player) {
    let agentsMvmt = {};

    let newTaggedPlayer;
    let untaggedPlayer;
    agentData.forEach((agentConfig) => {
      // * we render current player separately below
      if (agentConfig.id !== playerID) {
        Agent.configRender(agentConfig, taggedPlayers);
        const collided = player.collide(agentConfig, taggedPlayers);
        if (collided) {
          newTaggedPlayer = collided.tag;
          untaggedPlayer = collided.untag;
        }
      }
    });

    let removeVessel;
    vessels.forEach((vesselConfig) => {
      // * we render current player separately below
      Agent.configRender(vesselConfig, taggedPlayers, true);
      removeVessel = player.possesion(vesselConfig, taggedPlayers);
    });

    deviceMoved();
    player.resolveRectCircleCollision(obsticles);
    agentsMvmt[playerID] = player.move();
    player.render(taggedPlayers);

    if (newTaggedPlayer)
      socket.emit("updateTagged", {
        tag: newTaggedPlayer,
        untag: untaggedPlayer,
      });
    if (removeVessel) {
      socket.emit("removeVessel", {
        vesselID: removeVessel,
        playerID: player.id,
      });
    }
    socket.emit("updateMvmt", agentsMvmt);
  }

  drawSprites();
}

function createGhost(x, y) {
  const a = createSprite(x, y);
  a.addImage(ghostImg);
  return a;
}

function renderHunters() {
  for (let i = 0; i < hunters.length; i++) {
    for (let j = 0; j < i; j++) {
      hunters[i].huntersCollided(hunters[j]);
    }
    if (hunters[i].huntersCollided(player)) {
      player = null;
      handleUnload();
      const createdOne = document.getElementById("replay");
      const banner = createdOne ? createdOne : document.createElement("div");
      banner.setAttribute("id", "replay");
      banner.innerHTML = `<div style="z-index: 99; position: absolute; top: 0; left: 0; width: 100%; background-color:#8f273a; color: #fff"; text-align: center><p style="padding: 10px"><h1>Game over!</h1></ br></ br>Click here to start over</p></div>`;
      banner.onclick = () => window.location.reload();
      if (!createdOne) document.querySelector("body").appendChild(banner);
    }
  }

  for (let i = 0; i < hunters.length; i++) {
    if (player && taggedPlayers.includes(player.id)) {
      hunters[i].hunt(player);
    }

    hunters[i].move();
    // hunters[i].render(taggedPlayers);
    ghosts[i].position.x = hunters[i].pos.x;
    ghosts[i].position.y = hunters[i].pos.y;
  }
}

function createObsticles() {
  return [...Array(OBSTICLES_NUM)].map(() => Obsticle.getProperties());
}

function getAddAgentPayload() {
  const pos = Agent.getStartingPosition();

  return {
    pos,
    vel: Agent.getStartingVelocity(),
    oppositePos: { ...pos, y: CANVAS_HEIGHT - pos.y },
    radius: RADIUS,
  };
}

function getAgent({ id, pos, vel, radius }) {
  const agent = new Agent(id, pos, vel, radius, obsticles);
  return agent;
}

function handleDisplayPlayer(data) {
  playerID = data.id;
  player = getAgent(data);
}

function handleGameState(unparsedGameState) {
  const parsedGameState = JSON.parse(unparsedGameState);

  agentData = [];

  Object.keys(parsedGameState.agents).forEach((id) => {
    agentData.push({ ...parsedGameState.agents[id] });
  });

  taggedPlayers = parsedGameState.taggedPlayers;
  // console.log({ parsedIDs: parsedGameState.taggedPlayers });

  obsticles = parsedGameState.obsticles.map((obst) => new Obsticle(obst));

  vessels = parsedGameState.vessels.map((v) => getAgent(v));
}

function deviceMoved() {
  if (player) {
    player.changePosition(x, y);
    socket.emit("movePlayer", {
      id: playerID,
      pos: { x: player.pos.x, y: player.pos.y },
      vel: { x: player.vel.x, y: player.vel.y },
      radius: player.radius,
    });
  }
}

function addMotionListener() {
  window.addEventListener("devicemotion", (e) => {
    // console.log({ e });
    // * get accelerometer values
    x = parseInt(e.accelerationIncludingGravity.x);
    y = parseInt(e.accelerationIncludingGravity.y);
  });
}

function handleExitPlayer(id) {
  const exitedPlayerID = agents.findIndex((a) => a.id === id);

  agents.splice(exitedPlayerID, 1);
}

function handleUnload() {
  return socket.emit("exit", playerID);
}
