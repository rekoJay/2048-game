const board = [];
const boardSize = 4;
let score = 0;
let bestScore = localStorage.getItem('bestScore') || 0;
const bestScoreDisplay = document.getElementById('best-score');
let timeLeft = 180; // 제한 시간(초)
let timerInterval = null;
let isTimeOver = false; // 제한시간 끝났는지 여부
const timerDisplay = document.getElementById('timer');
const gameBoard = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score');
const timeBar = document.getElementById('time-bar');
const maxTime = 180;
let hasStarted = false;
timerDisplay.innerText = '-';
let mergedIndices = [];

function initBoard() {
  for (let i = 0; i < boardSize * boardSize; i++) {
    const tile = document.createElement('div');
    tile.classList.add('tile');
    tile.innerText = '';
    gameBoard.appendChild(tile);
    board.push(0);
  }

  addNewTile();
  addNewTile();
  drawBoard();
}

function addNewTile() {
  let emptyIndices = board.map((val, idx) => val === 0 ? idx : -1).filter(idx => idx !== -1);
  if (emptyIndices.length === 0) return;

  let randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  board[randomIndex] = Math.random() > 0.9 ? 4 : 2;
}

function drawBoard() {
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach((tile, i) => {
    tile.innerText = board[i] === 0 ? '' : board[i];
    tile.style.background = getTileColor(board[i]);

    // ✅ 합쳐진 타일에 애니메이션 효과
    if (mergedIndices.includes(i)) {
      tile.classList.add('merge');
      setTimeout(() => {
        tile.classList.remove('merge');
      }, 200);
    }
  });

  scoreDisplay.innerText = score;
  bestScoreDisplay.innerText = bestScore;

  // ✅ 다 그리고 나면 리스트 초기화
  mergedIndices = [];
}


function getTileColor(val) {
  switch (val) {
    case 0: return '#cdc1b4';
    case 2: return '#eee4da';
    case 4: return '#ede0c8';
    case 8: return '#f2b179';
    case 16: return '#f59563';
    case 32: return '#f67c5f';
    case 64: return '#f65e3b';
    case 128: return '#edcf72';
    case 256: return '#edcc61';
    case 512: return '#edc850';
    case 1024: return '#edc53f';
    case 2048: return '#edc22e';
    default: return '#3c3a32';
  }
}

document.addEventListener('keydown', handleKey);

function handleKey(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      const beforeMove = [...board]; // 이동 전 상태 복사
      move(e.key);
      const afterMove = board;
  
      // 이동이 실제로 있었는지 확인
      const changed = beforeMove.some((val, idx) => val !== afterMove[idx]);
  
      if (changed) {
        addNewTile();
        drawBoard();
        checkWin();
        if (isGameOver()) alert('Game Over!');
        if (isTimeOver) return;
      }
    }
  }
// 2. 스와이프 감지 (handleKey 함수 바깥에 있어야 함)
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 30) handleKey({ key: 'ArrowRight' });
    else if (dx < -30) handleKey({ key: 'ArrowLeft' });
  } else {
    if (dy > 30) handleKey({ key: 'ArrowDown' });
    else if (dy < -30) handleKey({ key: 'ArrowUp' });
  }
});

  

function slideRowLeft(row) {
  let arr = row.filter(val => val !== 0);
  let mergedThisTurn = []; // ← 합쳐진 위치 저장

  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      score += arr[i];
      arr[i + 1] = 0;
      mergedThisTurn.push(i); // 몇 번째 위치에서 합쳐졌는지
    }
  }

  arr = arr.filter(val => val !== 0);
  while (arr.length < boardSize) {
    arr.push(0);
  }

  return { newRow: arr, merged: mergedThisTurn };
}


function slideRowRight(row) {
  let reversed = [...row].reverse(); // 원본을 해치지 않도록 복사 후 뒤집기
  let result = slideRowLeft(reversed); // ← slideRowLeft는 객체를 반환함
  return {
    newRow: result.newRow.reverse(),
    merged: result.merged.map(i => boardSize - 1 - i) // 위치도 반대로!
  };
}

  
  function move(direction) {
    if (direction === 'ArrowLeft') {
      for (let r = 0; r < boardSize; r++) {
        let row = board.slice(r * boardSize, (r + 1) * boardSize);
        let result = slideRowLeft(row); // 수정된 버전
        let newRow = result.newRow;
    
        for (let c = 0; c < boardSize; c++) {
          board[r * boardSize + c] = newRow[c];
        }
    
        result.merged.forEach(i => {
          mergedIndices.push(r * boardSize + i); // 팡! 애니메이션용 위치
        });
      }
    }
    
    else if (direction === 'ArrowRight') {
      for (let r = 0; r < boardSize; r++) {
        let row = board.slice(r * boardSize, (r + 1) * boardSize);
        let result = slideRowRight(row); // 객체 반환 받기
        let newRow = result.newRow;
    
        for (let c = 0; c < boardSize; c++) {
          board[r * boardSize + c] = newRow[c];
        }
    
        result.merged.forEach(i => {
          mergedIndices.push(r * boardSize + i);
        });
      }
    }
    

    else if (direction === 'ArrowUp') {
      for (let c = 0; c < boardSize; c++) {
        let col = getColumn(c);
        let result = slideRowLeft(col); // 그대로 사용
        let newCol = result.newRow;
    
        setColumn(c, newCol);
    
        result.merged.forEach(i => {
          mergedIndices.push(i * boardSize + c);
        });
      }
    }
    
    
    else if (direction === 'ArrowDown') {
      for (let c = 0; c < boardSize; c++) {
        let col = getColumn(c);
        let result = slideRowRight(col);
        let newCol = result.newRow;
    
        setColumn(c, newCol);
    
        result.merged.forEach(i => {
          mergedIndices.push(i * boardSize + c);
        });
      }
    }
  }    
    


function getColumn(c) {
  const col = [];
  for (let r = 0; r < boardSize; r++) {
    col.push(board[r * boardSize + c]);
  }
  return col;
}


function setColumn(c, newCol) {
    for (let r = 0; r < boardSize; r++) {
      board[r * boardSize + c] = newCol[r];
    }
  }


  function isGameOver() {
    // 1. 빈 칸이 있으면 아직 끝나지 않음
    if (board.includes(0)) return false;
  
    // 2. 가로 방향 합칠 수 있는 거 있는지 확인
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize - 1; c++) {
        let i = r * boardSize + c;
        if (board[i] === board[i + 1]) return false;
      }
    }
  
    // 3. 세로 방향 합칠 수 있는 거 있는지 확인
    for (let c = 0; c < boardSize; c++) {
      for (let r = 0; r < boardSize - 1; r++) {
        let i = r * boardSize + c;
        if (board[i] === board[i + boardSize]) return false;
      }
    }
  
    // 다 안 되면 게임 오버!
    return true;
  }
  
let hasWon = false;

function checkWin() {
  if (!hasWon && board.includes(2048)) {
    hasWon = true;
    alert("🎉 You Win! 🎉");
  }
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 180;
  isTimeOver = false;
  timerDisplay.innerText = timeLeft;

  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.innerText = timeLeft;

    // 타임바 줄이기
    const percent = (timeLeft / maxTime) * 100;
    timeBar.style.width = percent + '%';

    // ✅ 이 색상 변경 조건은 이 안에 있어야 계속 업데이트됨!
    if (percent > 66) {
      timeBar.style.backgroundColor = "#2ecc71"; // green
    } else if (percent > 33) {
      timeBar.style.backgroundColor = "#f39c12"; // yellow
    } else {
      timeBar.style.backgroundColor = "#e74c3c"; // red
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      isTimeOver = true;
      alert("⏰ Time's up!");
    }
  }, 1000);
}


  

initBoard();

const bgm = document.getElementById('bgm');

// 사용자 상호작용 감지 후 BGM 재생 (한 번만 실행됨)
function tryPlayBGM() {
  if (!hasStarted) {
    hasStarted = true;
    startTimer(); // ⏱️ 타이머도 여기서 시작!
  }

  if (bgm.paused) {
    bgm.volume = 0.5;
    bgm.play().catch((e) => {
      console.log("음악 재생 실패:", e);
    });
  }
}


// 클릭 or 키다운 한 번만 감지
document.addEventListener('click', tryPlayBGM, { once: true });
document.addEventListener('keydown', tryPlayBGM, { once: true });



document.getElementById('restart-button').addEventListener('click', () => {
    gameBoard.innerHTML = '';
    board.length = 0;
    score = 0;
    hasWon = false;
    isTimeOver = false;
    initBoard();
  });
  
  document.getElementById('music-toggle').addEventListener('click', () => {
    if (bgm.paused) {
      bgm.play();
    } else {
      bgm.pause();
    }
  });
  
