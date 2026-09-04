const score = document.getElementById("score");
const best = document.getElementById("best");
const toptenBtn = document.getElementById("top-ten");
const toptenModal = document.querySelector(".best-ten");
const scoreList = document.getElementById("score-table");
const gameoverModal = document.querySelector(".game-over");
const restartBtn = document.getElementById("start-new");
const gamerulesBtn = document.querySelector(".rules");
const gamerulesModal = document.querySelector(".game-details");

const plusSnd = new Audio('assets/aud/blip.mp3');
const goSnd = new Audio('assets/aud/game_over3.mp3')

let liveScore = 0;
let bestTen = [];
let bestScore = 0;

console.log(gameoverModal.querySelector('span').innerText)


document.onclick = function (e) {
  if (e.target.classList.contains("game-details")) {
    gamerulesModal.style.display = "none";
  }
  if (e.target.classList.contains("best-ten")) {
    toptenModal.style.display = "none";
  }
  if (e.target.classList.contains("game-over")) {
    gameoverModal.style.display = "none";
  }
};
// start new game button
restartBtn.onclick = function (e) {
  e.preventDefault();
  gameBoard.innerHTML = "";
  startGame();
};
// try again button
gameoverModal.querySelector("button").onclick = function (e) {
  gameoverModal.style.display = "none";
  gameBoard.innerHTML = "";
  startGame();
};
// topten button
toptenBtn.onclick = function (e) {
  e.preventDefault();
  toptenModal.style.display = "flex";
  toptenModal.querySelector("#score-table").innerHTML = "";
  if (bestTen.length > 0) {
    const bestList = bestTen.reduce((acc, val, idx) => {
      return [...acc, [idx + 1, formatDate(val[0]), val[1]]];
    }, []);
    const table = generateTable(bestList);
    toptenModal.querySelector("#score-table").appendChild(table);
  } else {
    toptenModal.querySelector("#score-table").innerText = "No results...";
  }
};
function generateTable(bestList) {
  // create table
  const table = document.createElement("table");
  // create head
  const thead = table.createTHead();
  const hrow = thead.insertRow();
  const titles = ["No", "Date", "Score"];
  for (let i = 0; i < 3; i += 1) {
    const th = document.createElement("th");
    hrow.appendChild(th).appendChild(document.createTextNode(titles[i]));
  }

  table.appendChild(thead);
  // create body
  let tbody = table.createTBody();
  for (let element of bestList) {
    let row = tbody.insertRow();
    for (let j = 0; j < 3; j += 1) {
      let cell = row.insertCell();
      let text = document.createTextNode(element[j]);
      cell.appendChild(text);
    }
  }
  table.appendChild(tbody);
  return table;
}
// How to play show up
gamerulesBtn.onclick = function (e) {
  e.preventDefault();
  gamerulesModal.style.display = "flex";
};
// How to play close
gamerulesModal.querySelector("button").onclick = function (e) {
  gamerulesModal.style.display = "none";
};

// GAME ALGORITHM
const gameBoard = document.getElementById("game-board");
let cells = [];
const CELL_SIZE = 15;
const GAP = 2;

startGame();

function startGame() {
  cells = Array.from({ length: 16 }).map((_, i) => {
    return {
      idx: i,
      cell: generateCell(),
      x: i % 4,
      y: Math.floor(i / 4),
      tile: null,
      value: null,
      merged: null,
    };
  });
  // console.log(cells);

  randomTile(Math.random() > 0.6 ? 2 : 4);
  randomTile(Math.random() > 0.2 ? 2 : 4);

  setKeydown();
  // set scores
  bestTen = JSON.parse(localStorage.getItem("results") || "[]");
  bestScore = bestTen.sort((a, b) => b[1] - a[1])[0] || 0;
  best.innerText = bestScore[1];
  liveScore = 0;
  scoreBoard(liveScore);
}

function setKeydown() {
  window.addEventListener("keydown", handleDirection, { once: true });
}

async function handleDirection(e) {
  switch (e.key) {
    case "ArrowUp":
      // console.log(canSlideUp());
      if (!canSlideUp()) {
        setKeydown();
        return;
      }
      await slideUp();
      break;
    case "ArrowDown":
      if (!canSlideDown()) {
        setKeydown();
        return;
      }
      await slideDown();
      break;
    case "ArrowLeft":
      if (!canSlideLeft()) {
        setKeydown();
        return;
      }
      await slideLeft();
      break;
    case "ArrowRight":
      if (!canSlideRight()) {
        setKeydown();
        return;
      }
      await slideRight();
      break;
    default:
      setKeydown();
      return;
  }
  resetTiles();
  randomTile(Math.random() > 0.3 ? 2 : 4);
  if (!canSlideUp() && !canSlideDown() && !canSlideLeft() && !canSlideRight()) {
    gameOver();
    return;
  }
  setKeydown();
}

// Moving tiles
function slideUp() {
  return slider(cellColumns());
}

function slideDown() {
  return slider(cellColumns().map((column) => [...column].reverse()));
}
function slideLeft() {
  return slider(cellRows());
}
function slideRight() {
  return slider(cellRows().map((row) => [...row].reverse()));
}

function slider(array) {
  return Promise.all(
    array.flatMap((x) => {
      const promises = [];
      for (let i = 1; i < x.length; i += 1) {
        if (x[i].tile === null) continue;
        for (let j = i; j > 0; j -= 1) {
          const source = x[j]; // cell to be moved
          const target = x[j - 1]; // target cell
          if (target.merged || source.merged) continue;
          if (target.tile === null) {
            target.value = source.value;
            promises.push(transitionStatus(source.tile));
            mergeTiles(source, target);
          }
          if (target.value === source.value) {
            target.value += source.value;
            target.merged = target.tile;
            scoreBoard(target.value);
            promises.push(transitionStatus(source.tile));
            mergeTiles(source, target);
          }
        }
      }
      return promises;
    })
  );
}

function canSlideUp() {
  return canSlide(cellColumns());
}

function canSlideDown() {
  return canSlide(cellColumns().map((column) => [...column].reverse()));
}

function canSlideLeft() {
  return canSlide(cellRows());
}

function canSlideRight() {
  return canSlide(cellRows().map((row) => [...row].reverse()));
}

function canSlide(array) {
  return array.some((x) => {
    return x.some((cell, idx, arr) => {
      if (idx == 0) return false;
      if (cell.tile === null) return false;
      // console.log(idx, "-", cell.tile, '-', arr[idx-1].tile, "-", cell.value, '-', arr[idx - 1].value);
      if (arr[idx - 1].tile === null) return true;
      if (arr[idx - 1].value === cell.value) return true;
    });
  });
}
// Generate HTML Elements
function generateCell() {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  cell.style.setProperty("--cell-size", `${CELL_SIZE}vmin`);
  cell.style.setProperty("--cell-size", `${CELL_SIZE}vmin`);
  gameBoard.appendChild(cell);
  return cell;
}
function generateTile(x, y, value) {
  const lightness = 100 - Math.log2(value) * 7;
  const tile = document.createElement("div");
  tile.classList.add("tile");
  tile.style.setProperty("--cell-size", `${CELL_SIZE}vmin`);
  tile.style.setProperty("--gap", `${GAP}vmin`);
  tile.style.setProperty("--bg", `${lightness}%`);
  tile.style.setProperty("--text", `${lightness <= 50 ? 90 : 10}%`);
  tile.style.setProperty("--x", x);
  tile.style.setProperty("--y", y);
  tile.innerText = value;
  gameBoard.appendChild(tile);
  return tile;
}
function randomTile(value) {
  const emptyCells = cells
    .filter((c) => c.tile === null) // filter empty cells
    .map((x) => x.idx);
  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  const targetIndex = emptyCells[randomIndex];
  const x = cells[targetIndex].x;
  const y = cells[targetIndex].y;
  const tile = generateTile(x, y, value);
  cells[targetIndex].tile = tile;
  cells[targetIndex].value = value;
  // console.log(`${targetIndex} - x:${x} y:${y}; value: ${value}`);
  return;
}
// Helpers
function cellColumns() {
  return cells.reduce((columns, cell) => {
    columns[cell.x] = columns[cell.x] || [];
    columns[cell.x][cell.y] = cell;
    return columns;
  }, []);
}

function cellRows() {
  return cells.reduce((rows, cell) => {
    rows[cell.y] = rows[cell.y] || [];
    rows[cell.y][cell.x] = cell;
    return rows;
  }, []);
}

function resetTiles() {
  cells
    .filter((x) => x.tile != null)
    .forEach((x) => (x.tile.innerText = x.value));
  cells.filter((x) => x.merged != null).forEach((x) => x.merged.remove());
  cells.map((x) => (x.merged = null));
}

function mergeTiles(source, target) {
  // console.log(`${source.tile} - ${target} - ${value}`)
  const light = 100 - Math.log2(target.value) * 7;
  if (target.value >= 100) {
    source.tile.style.fontSize = "5vmin";
  }
  source.tile.style.setProperty("--bg", `${light}%`);
  source.tile.style.setProperty("--text", `${light <= 50 ? 90 : 10}%`);
  source.tile.style.setProperty("--x", target.x);
  source.tile.style.setProperty("--y", target.y);
  target.tile = source.tile;
  source.tile = null;
  source.value = null;
}

function transitionStatus(tile) {
  return new Promise((resolve) => {
    tile.addEventListener("transitionend", resolve, {
      once: true,
    });
  });
}

function formatDate(date) {
  newDate = new Date(date);
  const map = {
    wd: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    mn: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    mm: newDate.getMonth(),
    dd: newDate.getDay(),
    yy: newDate.getFullYear().toString().slice(-2),
    yyyy: newDate.getFullYear(),
    tt: newDate.toTimeString().slice(0, 8),
  };
  return `${map.wd[map.dd]} ${map.mn[map.mm]} ${map.dd} ${map.yyyy} ${map.tt}`;
}
// End of Game Algorithm

// Other functions
function gameOver() {
  saveScore();
  gameoverModal.querySelector('span').innerText = liveScore
  goSnd.play();
  gameoverModal.style.display = "flex";
}

function scoreBoard(value) {
  if (value) {plusSnd.play();}
  liveScore += Number(value);
  score.innerText = liveScore;
  if (bestScore <= liveScore) {
    bestScore = liveScore;
    best.innerText = liveScore;
  }
}
function saveScore() {
  const storageData = JSON.parse(localStorage.getItem("results") || "[]");
  let highScore = 0;
  if (storageData.length > 0) {
    highScore = storageData.sort((a, b) => b[1] - a[1])[0][1];
  }
  if (liveScore > highScore) {
    storageData.push([Date.now(), liveScore]);
    const newData = storageData.sort((a, b) => b[1] - a[1]).slice(0, 10);
    localStorage.setItem("results", JSON.stringify(newData));
  }
}
