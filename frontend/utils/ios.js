// ****************************************** iOS ***************************************************************
function removeBanner() {
  var element = document.getElementById("motion-permission");
  if (element) {
    element.parentNode.removeChild(element);
  }
}

function ClickRequestDeviceMotionEvent() {
  window.DeviceMotionEvent.requestPermission()
    .then((response) => {
      if (response === "granted") {
        removeBanner();
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
  window.addEventListener("beforeunload", handleUnload);

  // * Check if is IOS 13 when page loads.
  if (
    window.DeviceMotionEvent &&
    typeof window.DeviceMotionEvent.requestPermission === "function"
  ) {
    // * Everything here is just a lazy banner. You can do the banner your way.
    const banner = document.createElement("div");
    banner.setAttribute("id", "motion-permission");
    banner.innerHTML = `<div style="z-index: 1; position: absolute; width: 100%; background-color:#000; color: #fff"><p style="padding: 10px">Click here to enable DeviceMotion</p></div>`;
    banner.onclick = ClickRequestDeviceMotionEvent; // * You NEED to bind the function into a onClick event. An artificial 'onClick' will NOT work.
    document.querySelector("body").appendChild(banner);
  } else {
    addMotionListener();
  }
};
// ****************************************** iOS END ***************************************************************
