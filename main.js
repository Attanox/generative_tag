var x, y, z;
var xpos, ypos;

function setup() {
  // set canvas size
  createCanvas(400, 400);

  // default values
  xpos = 200;
  ypos = 200;
  x = 0;
  y = 0;
}

function draw() {
  // set background color to white
  background(255);

  // add/subract xpos and ypos
  xpos = xpos + x;
  ypos = ypos - y;

  // wrap ellipse if over bounds
  if (xpos > 400) {
    xpos = 0;
  }
  if (xpos < 0) {
    xpos = 400;
  }
  if (ypos > 400) {
    ypos = 0;
  }
  if (ypos < 0) {
    ypos = 400;
  }

  // draw ellipse
  fill(255, 0, 0);
  ellipse(xpos, ypos, 25, 25);

  // display variables
  fill(0);
  noStroke();
  text("x: " + x, 25, 25);
  text("y: " + y, 25, 50);
  text("z: " + z, 25, 75);
}

function addMotionListener() {
  window.addEventListener("devicemotion", (e) => {
    // do something with e
    // get accelerometer values
    x = parseInt(e.accelerationIncludingGravity.x);
    y = parseInt(e.accelerationIncludingGravity.y);
    z = parseInt(e.accelerationIncludingGravity.z);
  });
}

function ClickRequestDeviceMotionEvent() {
  window.DeviceMotionEvent.requestPermission()
    .then((response) => {
      if (response === "granted") {
        addMotionListener();
      } else {
        console.log("DeviceMotion permissions not granted.");
      }
    })
    .catch((e) => {
      console.error(e);
    });
}

window.onload = function () {
  // Check if is IOS 13 when page loads.
  if (
    window.DeviceMotionEvent &&
    typeof window.DeviceMotionEvent.requestPermission === "function"
  ) {
    // Everything here is just a lazy banner. You can do the banner your way.
    const banner = document.createElement("div");
    banner.innerHTML = `<div style="z-index: 1; position: absolute; width: 100%; background-color:#000; color: #fff"><p style="padding: 10px">Click here to enable DeviceMotion</p></div>`;
    banner.onclick = ClickRequestDeviceMotionEvent; // You NEED to bind the function into a onClick event. An artificial 'onClick' will NOT work.
    document.querySelector("body").appendChild(banner);
  }
};
