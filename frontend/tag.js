// const socket = io.connect("http://localhost:3000/");
const socket = io.connect("https://calm-plateau-75658.herokuapp.com/");

const RADIUS = 15;
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 500;

let x, y;

let agents = [];
let obsticles = [];
let playerID = "";
let player;

let agentData = [];
let taggedPlayers = [];

let vessels = [];
let playable = false;

let hunters = [];
let ghosts = [];
let ghostImg;

let timer;

let scrCnt = 0;
let canvas;

socket.on("displayPlayer", handleDisplayPlayer);
socket.on("playerExit", handleExitPlayer);
socket.on("gameState", handleGameState);

function preload() {
  ghostImg = loadImage("assets/ghost-solid.png");
}

function setup() {
  // * set canvas size
  canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

  // TODO: add roomName ?
  socket.emit("joinGame", {
    roomName: null,
    player: { ...getAddAgentPayload() },
    dimensions: {
      width,
      height,
    },
  });

  createGhost();

  // * TIMER
  timer = createElement("h1", " 00 : 00 ");
  timer.style("color", "#fff");
  timer.style("width", "100%");
  timer.style("text-align", "center");
  timer.class("timer");
  timer.position(0, CANVAS_HEIGHT);

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

  if (!playable) return;

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

function createGhost() {
  const config = getAddAgentPayload();

  hunters.push(
    getAgent({
      id: `hunter-${Date.now()}`,
      ...config,
      vel: Agent.getHunterVelocity(),
    })
  );

  const sprite = createSprite(config.pos.x, config.pos.y);
  sprite.addImage(ghostImg);
  ghosts.push(sprite);
}

function renderHunters() {
  for (let i = 0; i < hunters.length; i++) {
    for (let j = 0; j < i; j++) {
      hunters[i].huntersCollided(hunters[j]);
    }
    hunters[i].resolveRectCircleCollision(obsticles);
    if (
      player &&
      taggedPlayers.includes(player.id) &&
      hunters[i].huntersCollided(player)
    ) {
      player = null;
      handleUnload();
      const createdOne = document.getElementById("replay");
      const banner = createdOne ? createdOne : document.createElement("div");
      banner.setAttribute("id", "replay");
      banner.innerHTML = `<div style="z-index: 99; position: absolute; top: 0; left: 0; width: 100%; background-color:#8f273a; color: #fff"; text-align: center><p style="padding: 10px"><h1>You survived: ${timer.elt.innerText}</h1></ br></ br>Click here to start over</p></div>`;
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

  setGameAsPlayable();
}

function setGameAsPlayable() {
  playable = true;
  startTimer();
}

function handleExitPlayer(id) {
  const exitedPlayerID = agents.findIndex((a) => a.id === id);

  if (exitedPlayerID !== -1) agents.splice(exitedPlayerID, 1);
}

function handleUnload() {
  pauseTimer();
  return socket.emit("exit", playerID);
}

function keyPressed() {
  if (key === "s" || key === "S") {
    saveCanvas(canvas, "AndrejTlcina_FinalProject_" + scrCnt++, "png");
  }
}
