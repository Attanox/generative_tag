let [seconds, minutes] = [0, 0];
let int = null;

const startTimer = () => {
  if (int) clearInterval(int);

  int = setInterval(updateTimer, 1000);
};

const pauseTimer = () => {
  if (int) clearInterval(int);
};

const clearTimer = () => {
  if (int) clearInterval(int);
  [seconds, minutes] = [0, 0];
  document.querySelector(".timer").innerHTML = " 00 : 00 ";
};

function updateTimer() {
  seconds++;

  if (seconds % 30 === 0) createGhost();

  if (seconds === 60) {
    seconds = 0;
    minutes++;
    if (minutes === 60) {
      minutes = 0;
    }
  }

  let m = minutes < 10 ? "0" + minutes : minutes;
  let s = seconds < 10 ? "0" + seconds : seconds;

  document.querySelector(".timer").innerHTML = ` ${m} : ${s} `;
}
