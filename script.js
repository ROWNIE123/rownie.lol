// script.js — tiny games in vanilla JS

// ---------- Utility ----------
const $ = (sel, doc = document) => doc.querySelector(sel);
const $$ = (sel, doc = document) => Array.from(doc.querySelectorAll(sel));

function showView(id){
  $$(".view").forEach(v => v.classList.remove("is-active"));
  $("#"+id).classList.add("is-active");
  $$(".nav-btn").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === id)));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleTheme(){
  document.body.classList.toggle("light");
  localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
}

(function initTheme(){
  const saved = localStorage.getItem("theme");
  if(saved === "light") document.body.classList.add("light");
})();

// ---------- Router & Nav ----------
$$(".nav-btn").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.view)));
$("#toggle-theme").addEventListener("click", (e) => { e.preventDefault(); toggleTheme(); });

// Cards on home open views
$$(".card").forEach(card => card.addEventListener("click", () => showView(card.dataset.open)));
$$(".back").forEach(b => b.addEventListener("click", () => showView(b.dataset.view)));

// ---------- Reaction Time ----------
(function reactionGame(){
  const pad = $("#reaction-pad");
  const instructions = $("#reaction-instructions");
  const lastEl = $("#reaction-last");
  const bestEl = $("#reaction-best");
  const avgEl = $("#reaction-avg");

  let waiting = true, ready = false, go = false;
  let start = 0, timeoutId = null;
  let times = [];

  function setState(next){
    waiting = next === "waiting";
    ready = next === "get-ready";
    go = next === "go";
    pad.className = "reaction " + (waiting ? "waiting" : ready ? "get-ready" : "go");
  }

  function scheduleGo(){
    const delay = 900 + Math.random()*2200;
    timeoutId = setTimeout(()=>{
      setState("go");
      instructions.textContent = "GO! Click or press Space.";
      start = performance.now();
    }, delay);
  }

  function startRound(){
    clearTimeout(timeoutId);
    setState("get-ready");
    instructions.textContent = "Wait for green…";
    scheduleGo();
  }

  function tooSoon(){
    clearTimeout(timeoutId);
    setState("waiting");
    instructions.textContent = "Too soon! Click to try again.";
  }

  function record(ms){
    times.push(ms);
    times = times.slice(-5);
    lastEl.textContent = Math.round(ms) + "ms";
    const best = Math.min(...times);
    const avg = times.reduce((a,b)=>a+b,0)/times.length;
    bestEl.textContent = Math.round(best) + "ms";
    avgEl.textContent = Math.round(avg) + "ms";
  }

  function handlePress(){
    if(waiting){ startRound(); return; }
    if(ready){ tooSoon(); return; }
    if(go){
      const ms = performance.now() - start;
      record(ms);
      setState("waiting");
      instructions.textContent = "Nice! Click to go again.";
    }
  }

  pad.addEventListener("click", handlePress);
  pad.addEventListener("keydown", (e)=>{ if(e.code==="Space"||e.code==="Enter"){ e.preventDefault(); handlePress(); }});
})();

// ---------- Higher or Lower ----------
(function guessGame(){
  let secret = 1 + Math.floor(Math.random()*100);
  let tries = 0;

  const form = $("#guess-form");
  const input = $("#guess-input");
  const feedback = $("#guess-feedback");
  const list = $("#guess-history");
  const resetBtn = $("#guess-reset");

  function pushHistory(val, hint){
    const li = document.createElement("li");
    li.textContent = `${val} (${hint})`;
    list.prepend(li);
  }

  function reset(){
    secret = 1 + Math.floor(Math.random()*100);
    tries = 0;
    list.innerHTML = "";
    feedback.textContent = "New number. Make a guess!";
    input.value = "";
    input.focus();
  }

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const val = Number(input.value);
    if(!val || val<1 || val>100){ feedback.textContent = "Enter a number 1–100."; return; }
    tries++;
    if(val === secret){
      feedback.textContent = `Correct! It was ${secret}. You took ${tries} ${tries===1?"try":"tries"}.`;
      pushHistory(val, "correct");
    } else if(val < secret){
      feedback.textContent = "Too low.";
      pushHistory(val, "low");
    } else {
      feedback.textContent = "Too high.";
      pushHistory(val, "high");
    }
    input.select();
  });

  resetBtn.addEventListener("click", reset);
})();

// ---------- Word Scramble ----------
(function scrambleGame(){
  const words = [
    "galaxy","ocean","puzzle","whimsy","nebula","pixel","cobalt","banana","python",
    "marble","gadget","thunder","sable","violet","hacker","matrix","wander","laptop",
    "ember","rocket","fusion","crypto","coffee","kitten","forest","castle","mirror"
  ];

  const wordEl = $("#scramble-word");
  const feedback = $("#scramble-feedback");
  const input = $("#scramble-input");
  const timerEl = $("#scramble-timer");
  const form = $("#scramble-form");
  const newBtn = $("#scramble-new");

  let current = "", scrambled = "", timeLeft = 30, timerId = null, playing = false;

  function shuffle(s){
    const arr = s.split("");
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]] = [arr[j],arr[i]];
    }
    return arr.join("");
  }

  function pickNew(){
    current = words[Math.floor(Math.random()*words.length)];
    scrambled = shuffle(current);
    if(scrambled === current) scrambled = shuffle(current);
    wordEl.textContent = scrambled.toUpperCase();
    feedback.textContent = "";
    input.value = "";
    input.focus();
    startTimer(30);
    playing = true;
  }

  function startTimer(sec){
    clearInterval(timerId);
    timeLeft = sec;
    timerEl.textContent = timeLeft;
    timerId = setInterval(()=>{
      timeLeft--;
      timerEl.textContent = timeLeft;
      if(timeLeft <= 0){
        clearInterval(timerId);
        playing = false;
        feedback.textContent = `Out of time! It was "${current}".`;
      }
    },1000);
  }

  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    if(!playing) return;
    const guess = input.value.trim().toLowerCase();
    if(!guess) return;
    if(guess === current){
      clearInterval(timerId);
      playing = false;
      const bonus = Math.max(0, timeLeft - 1);
      feedback.textContent = `Correct! +${bonus} bonus seconds.`;
    } else {
      feedback.textContent = `Nope — keep trying.`;
    }
    input.select();
  });

  newBtn.addEventListener("click", pickNew);

  const observer = new MutationObserver(()=>{
    if($("#scramble").classList.contains("is-active") && !playing){
      pickNew();
    }
  });
  observer.observe($("#scramble"), { attributes:true });
})();

// ---------- Pixel Painter ----------
(function pixelPainter(){
  const canvas = document.getElementById("paint-canvas");
  const ctx = canvas.getContext("2d");
  const sizeSel = document.getElementById("paint-size");
  const colorPick = document.getElementById("paint-color");
  const bgPick = document.getElementById("paint-bg");
  const clearBtn = document.getElementById("paint-clear");
  const exportBtn = document.getElementById("paint-export");

  let grid = 24, cell, drawing=false, erasing=false;
  function resize(){
    grid = Number(sizeSel.value);
    const px = Math.min(canvas.parentElement.clientWidth, 384);
    canvas.width = px; canvas.height = px;
    const ctx2 = canvas.getContext("2d"); ctx2.imageSmoothingEnabled = false;
    cell = Math.floor(px / grid);
    redraw();
  }

  function redraw(){
    ctx.fillStyle = bgPick.value;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for(let i=0;i<=grid;i++){
      const p = i*cell + .5;
      ctx.beginPath(); ctx.moveTo(p,0); ctx.lineTo(p,canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,p); ctx.lineTo(canvas.width,p); ctx.stroke();
    }
  }

  function getPos(evt){
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (evt.clientX - rect.left) * scaleX;
    const y = (evt.clientY - rect.top) * scaleY;
    return {x, y};
  }
  function paintAtXY(x,y){
    const gx = Math.floor(x/cell), gy = Math.floor(y/cell);
    ctx.fillStyle = erasing ? bgPick.value : colorPick.value;
    ctx.fillRect(gx*cell+1, gy*cell+1, cell-1, cell-1);
  }

  canvas.addEventListener("mousedown",(e)=>{
    drawing = true; erasing = (e.button===2);
    const {x,y} = getPos(e); paintAtXY(x,y);
  });
  canvas.addEventListener("mousemove",(e)=>{ if(drawing){ const p=getPos(e); paintAtXY(p.x,p.y); } });
  canvas.addEventListener("mouseup", ()=> drawing=false);
  canvas.addEventListener("mouseleave", ()=> drawing=false);
  canvas.addEventListener("contextmenu",(e)=> e.preventDefault());

  clearBtn.addEventListener("click", redraw);
  exportBtn.addEventListener("click", ()=>{
    const link = document.createElement("a");
    link.download = "pixel-art.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });

  sizeSel.addEventListener("change", resize);
  bgPick.addEventListener("change", redraw);

  const obs = new MutationObserver(()=>{
    if($("#painter").classList.contains("is-active")) resize();
  });
  obs.observe($("#painter"), { attributes:true });

  const ro = new ResizeObserver(()=>{
    if($("#painter").classList.contains("is-active")) resize();
  });
  ro.observe(canvas.parentElement);
})();

// ---------- Snake (stable, queued input) ----------
(function snakeGameStable(){
  const canvas = document.getElementById("snake-canvas");
  const ctx = canvas.getContext("2d");
  const startBtn = document.getElementById("snake-start");
  const pauseBtn = document.getElementById("snake-pause");
  const scoreEl = document.getElementById("snake-score");
  const bestEl = document.getElementById("snake-best");

  const COLS = 20, ROWS = 20;
  const BASE = 280; // logical canvas size
  let CELL = Math.floor(BASE / COLS);
  canvas.width = BASE;
  canvas.height = BASE;
  canvas.style.width = "min(320px, 90vw)";
  canvas.style.height = "auto";
  ctx.imageSmoothingEnabled = false;

  let snake, dir, food, timer=null, speedMs=140, score=0, best=Number(localStorage.getItem("snake-best")||0);
  let moveQueue = [];
  bestEl.textContent = best;

  function reset(){
    CELL = Math.floor(canvas.width / COLS);
    snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    dir = {x:1,y:0};
    moveQueue = [];
    placeFood();
    score = 0; scoreEl.textContent = score;
    speedMs = 140;
    draw();
  }

  function placeFood(){
    while(true){
      const f = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) };
      if(!snake.some(s=> s.x===f.x && s.y===f.y)){ food = f; return; }
    }
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        if((x+y)%2===0){ ctx.fillRect(x*CELL,y*CELL,CELL,CELL); }
      }
    }
    ctx.fillStyle = "#6ae3ff";
    ctx.fillRect(food.x*CELL+2, food.y*CELL+2, CELL-4, CELL-4);
    ctx.fillStyle = "#7cffb7";
    snake.forEach(s=> ctx.fillRect(s.x*CELL+1, s.y*CELL+1, CELL-2, CELL-2));
  }

  function applyQueuedTurn(){
    if(moveQueue.length === 0) return;
    const cand = moveQueue.shift();
    if((cand.x === -dir.x && cand.y === -dir.y) || (cand.x === dir.x && cand.y === dir.y)){
      applyQueuedTurn();
    } else {
      dir = cand;
    }
  }

  function tick(){
    applyQueuedTurn();
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if(head.x<0 || head.y<0 || head.x>=COLS || head.y>=ROWS || snake.some(s=> s.x===head.x && s.y===head.y)){
      stop();
      best = Math.max(best, score);
      localStorage.setItem("snake-best", String(best));
      bestEl.textContent = best;
      draw();
      return;
    }
    snake.unshift(head);
    if(head.x===food.x && head.y===food.y){
      score++; scoreEl.textContent = score;
      speedMs = Math.max(80, speedMs - 4);
      clearInterval(timer);
      timer = setInterval(tick, speedMs);
      placeFood();
    } else {
      snake.pop();
    }
    draw();
  }

  function start(){
    reset();
    stop();
    timer = setInterval(tick, speedMs);
  }
  function stop(){
    if(timer){ clearInterval(timer); timer=null; }
  }
  function pause(){
    if(timer){ stop(); } else { timer = setInterval(tick, speedMs); }
  }

  function queueDir(nx, ny){
    const base = moveQueue.length ? moveQueue[moveQueue.length-1] : dir;
    if(nx === -base.x && ny === -base.y) return; // prevent reversing relative to last intent
    const last = moveQueue.length ? moveQueue[moveQueue.length-1] : null;
    if(last && last.x === nx && last.y === ny) return; // avoid duplicates
    moveQueue.push({x:nx, y:ny});
    if(moveQueue.length > 3) moveQueue = moveQueue.slice(-3); // cap buffer
  }

  window.addEventListener("keydown",(e)=>{
    if(!$("#snake").classList.contains("is-active")) return;
    if(e.code==="ArrowUp"||e.code==="KeyW"){ queueDir(0,-1); }
    if(e.code==="ArrowDown"||e.code==="KeyS"){ queueDir(0,1); }
    if(e.code==="ArrowLeft"||e.code==="KeyA"){ queueDir(-1,0); }
    if(e.code==="ArrowRight"||e.code==="KeyD"){ queueDir(1,0); }
  });

  startBtn.addEventListener("click", start);
  pauseBtn.addEventListener("click", pause);

  const obs = new MutationObserver(()=>{
    if($("#snake").classList.contains("is-active")){ reset(); }
    else { stop(); }
  });
  obs.observe($("#snake"), { attributes:true });
})();

// ---------- Memory Flip ----------
(function memoryFlip(){
  const gridEl = document.getElementById("mem-grid");
  const sizeSel = document.getElementById("mem-size");
  const newBtn = document.getElementById("mem-new");
  const movesEl = document.getElementById("mem-moves");
  const timeEl = document.getElementById("mem-time");
  const bestEl = document.getElementById("mem-best");
  const feedbackEl = document.getElementById("mem-feedback");
  if(!gridEl) return;

  const ICONS = ["🍎","🍊","🍋","🍓","🍉","🍇","🍒","🥝","🥕","🍄","🌶️","🥐","🧀","🍔","🍟","🍕","🍪","🍰","☕","🍵"];

  let cols=4, rows=4;
  let first=null, second=null, lock=false, moves=0, timer=null, seconds=0, matched=0;

  function setGridTemplate(){
    gridEl.style.gridTemplateColumns = `repeat(${cols}, minmax(56px, 1fr))`;
  }

  function shuffle(arr){
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]] = [arr[j],arr[i]];
    }
    return arr;
  }

  function buildDeck(){
    const pairs = (cols*rows)/2;
    const deckIcons = shuffle(ICONS.slice(0)).slice(0,pairs);
    return shuffle(deckIcons.concat(deckIcons.slice(0)));
  }

  function startTimer(){
    clearInterval(timer);
    seconds = 0; timeEl.textContent = "0";
    timer = setInterval(()=>{ seconds++; timeEl.textContent = String(seconds); },1000);
  }
  function stopTimer(){ clearInterval(timer); }

  function bestKey(){ return `mem-best-${cols}x${rows}`; }
  function updateBestLabel(){
    const prev = localStorage.getItem(bestKey());
    bestEl.textContent = prev ? (JSON.parse(prev).moves + " / " + JSON.parse(prev).seconds + "s") : "—";
  }

  function newGame(){
    const v = sizeSel.value;
    if(v==="6x4"){ cols=6; rows=4; } else { cols=4; rows=4; }
    setGridTemplate();
    first=second=null; lock=false; moves=0; matched=0;
    movesEl.textContent = "0";
    feedbackEl.textContent = "";
    gridEl.innerHTML = "";
    const deck = buildDeck();
    deck.forEach((icon)=>{
      const card = document.createElement("button");
      card.className = "mem-card";
      card.setAttribute("role","gridcell");
      card.setAttribute("aria-label","card");
      card.innerHTML = `<div class="mem-inner">
          <div class="mem-face mem-front"></div>
          <div class="mem-face mem-back">${icon}</div>
        </div>`;
      card.dataset.value = icon;
      card.addEventListener("click", ()=> flip(card));
      gridEl.appendChild(card);
    });
    startTimer();
    updateBestLabel();
  }

  function flip(card){
    if(lock || card.classList.contains("matched") || card===first) return;
    card.classList.add("flipped");
    if(!first){ first = card; return; }
    second = card; lock = true; moves++; movesEl.textContent = String(moves);
    const match = first.dataset.value === second.dataset.value;
    setTimeout(()=>{
      if(match){
        first.classList.add("matched");
        second.classList.add("matched");
        matched += 2;
        if(matched === cols*rows){
          stopTimer();
          feedbackEl.textContent = `Completed in ${moves} moves and ${seconds}s!`;
          const prevRaw = localStorage.getItem(bestKey());
          const current = {moves, seconds};
          if(!prevRaw){
            localStorage.setItem(bestKey(), JSON.stringify(current));
          }else{
            try{
              const prev = JSON.parse(prevRaw);
              const better = (moves < prev.moves) || (moves === prev.moves && seconds < prev.seconds);
              if(better) localStorage.setItem(bestKey(), JSON.stringify(current));
            }catch{ localStorage.setItem(bestKey(), JSON.stringify(current)); }
          }
          updateBestLabel();
        }
      } else {
        first.classList.remove("flipped");
        second.classList.remove("flipped");
      }
      first = null; second = null; lock = false;
    }, 450);
  }

  newBtn.addEventListener("click", newGame);
  sizeSel.addEventListener("change", newGame);

  const obs = new MutationObserver(()=>{
    if($("#memory").classList.contains("is-active")) newGame();
    else stopTimer();
  });
  obs.observe($("#memory"), { attributes:true });
})();

// ---------- Dino Run (gentle accel + speed cap, no pause) ----------
(function dinoRun(){
  const canvas = document.getElementById("dino-canvas");
  const startBtn = document.getElementById("dino-start");
  const scoreEl = document.getElementById("dino-score");
  const bestEl = document.getElementById("dino-best");
  const ctx = canvas.getContext("2d");

  let raf = null, running = false;
  let groundY = canvas.height - 28;
  let dino, cacti, birds, score, speed, best = Number(localStorage.getItem("dino-best")||0);
  bestEl.textContent = best;

  function reset(){
    dino = { x: 40, y: groundY, vy: 0, w: 24, h: 28, onGround: true, duck: false };
    cacti = [];
    birds = [];
    score = 0;
    speed = 3;
    scoreEl.textContent = score;
    spawnTimer = 0; birdTimer = 180;
  }

  let spawnTimer = 0;
  let birdTimer = 180;

  function spawnCactus(){
    const sizes = [[18,26],[24,30],[28,34]];
    const [w,h] = sizes[Math.floor(Math.random()*sizes.length)];
    const last = cacti[cacti.length-1];
    const minGap = Math.max(140, 110 + speed*25);
    const x = canvas.width + 20;
    if(last && last.x > x - minGap) return;
    cacti.push({ x, y: groundY - h, w, h });
  }
  function spawnBird(){
    const heights = [groundY-60, groundY-90];
    const y = heights[Math.floor(Math.random()*heights.length)];
    const lastC = cacti[cacti.length-1];
    const lastB = birds[birds.length-1];
    const minGap = Math.max(160, 130 + speed*30);
    const x = canvas.width + 20;
    if((lastC && lastC.x > x - minGap) || (lastB && lastB.x > x - minGap)) return;
    birds.push({ x, y, w: 26, h: 18 });
  }

  function jump(){
    if(dino.onGround){
      dino.vy = -10.5;
      dino.onGround = false;
    }
  }

  function setDuck(state){
    dino.duck = state;
    dino.h = state ? 18 : 28;
  }

  function collide(a,b){
    return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(0, groundY, canvas.width, 2);

    ctx.fillStyle = "#7cffb7";
    const dy = dino.duck ? dino.y + 10 : dino.y;
    const dh = dino.h;
    ctx.fillRect(dino.x, dy - dh, dino.w, dh);

    ctx.fillStyle = "#6ae3ff";
    cacti.forEach(c=> ctx.fillRect(c.x, c.y, c.w, c.h));
    birds.forEach(b=> ctx.fillRect(b.x, b.y, b.w, b.h));

    ctx.font = "16px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("Score: " + Math.floor(score), 12, 20);
  }

  function step(){
    dino.vy += 0.6;
    dino.y += dino.vy;
    if(dino.y >= groundY){ dino.y = groundY; dino.vy = 0; dino.onGround = true; }

    spawnTimer--;
    birdTimer--;
    if(spawnTimer <= 0){ spawnCactus(); spawnTimer = 70 + Math.random()*90; }
    if(birdTimer <= 0){ spawnBird(); birdTimer = 240 + Math.random()*180; }

    speed = Math.min(6.0, speed + 0.0012); // gentle accel + cap
    cacti.forEach(c=> c.x -= speed);
    birds.forEach(b=> b.x -= speed*1.2);
    cacti = cacti.filter(c=> c.x + c.w > -10);
    birds = birds.filter(b=> b.x + b.w > -10);

    score += 0.2 * speed;
    scoreEl.textContent = Math.floor(score);

    const dBox = { x: dino.x, y: dino.y - dino.h, w: dino.w, h: dino.h };
    if(cacti.some(c=>collide(dBox,c)) || birds.some(b=>collide(dBox,b))){
      running = false;
      best = Math.max(best, Math.floor(score));
      localStorage.setItem("dino-best", String(best));
      bestEl.textContent = best;
    }

    draw();
    if(running) raf = requestAnimationFrame(step);
  }

  function start(){ reset(); running = true; cancelAnimationFrame(raf); step(); }

  window.addEventListener("keydown",(e)=>{
    if(!$("#dino").classList.contains("is-active")) return;
    if(e.code==="Space"){ e.preventDefault(); jump(); }
    if(e.code==="ArrowDown"){ setDuck(true); }
  });
  window.addEventListener("keyup",(e)=>{
    if(!$("#dino").classList.contains("is-active")) return;
    if(e.code==="ArrowDown"){ setDuck(false); }
  });

  startBtn.addEventListener("click", start);

  const obs = new MutationObserver(()=>{
    if($("#dino").classList.contains("is-active")){ start(); }
    else { cancelAnimationFrame(raf); running = false; }
  });
  obs.observe($("#dino"), { attributes:true });
})();

// ---------- The Wheel (Roulette, synced wallet) ----------
(function theWheel(){
  const canvas = document.getElementById("wheel-canvas");
  if(!canvas) return;

  const ctx = canvas.getContext("2d");
  const spinBtn = document.getElementById("wheel-spin");
  const resultEl = document.getElementById("wheel-result");
  const balanceEl = document.getElementById("wheel-balance");
  const historyEl = document.getElementById("wheel-history");
  const betAmountInput = document.getElementById("wheel-bet-amount");
  const betNumberInput = document.getElementById("wheel-bet-number");

  // --- shared wallet (same key as Mines / Drop Zone / 21) ---
  const KEY = "wallet-sh";
  const getWallet = () => Number(localStorage.getItem(KEY) || "10000");
  const setWallet = (v) => localStorage.setItem(KEY, String(v));
  const refreshWallet = () => { balanceEl.textContent = getWallet(); };
  refreshWallet();

  // European single-zero order + official colors
  const numbers = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6,
    27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
    16, 33, 1, 20, 14, 31, 9, 22, 18, 29,
    7, 28, 12, 35, 3, 26
  ];
  const reds = new Set([32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3]);
  const colors = numbers.map(n => n===0 ? "green" : (reds.has(n) ? "red" : "black"));

  // geometry
  const cx=160, cy=160, R=158, r=92;
  const seg = 2*Math.PI / numbers.length;
  const pointerAngle = -Math.PI/2; // arrow is drawn at top

  function drawWheel(angle=0){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(angle);

    for(let i=0;i<numbers.length;i++){
      const start=i*seg, end=start+seg;

      // ring slice
      ctx.beginPath();
      ctx.arc(0,0,R,start,end,false);
      ctx.arc(0,0,r,end,start,true);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();

      // slice divider
      ctx.strokeStyle="rgba(255,255,255,.15)";
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(r*Math.cos(start), r*Math.sin(start));
      ctx.lineTo(R*Math.cos(start), R*Math.sin(start));
      ctx.stroke();

      // number (oriented outward)
      ctx.save();
      ctx.rotate(start+seg/2);
      ctx.translate((R+r)/2,0);
      ctx.rotate(Math.PI/2);
      ctx.fillStyle="#fff";
      ctx.font="bold 14px Inter, sans-serif";
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(numbers[i],0,0);
      ctx.restore();
    }

    // inner hub
    ctx.beginPath();
    ctx.arc(0,0,r-8,0,Math.PI*2);
    ctx.fillStyle="#0d0f16";
    ctx.fill();
    ctx.restore();

    // fixed arrow on canvas (always on top)
    const baseY = cy - R + 2, tipY = baseY + 16;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx-12, baseY);
    ctx.lineTo(cx+12, baseY);
    ctx.lineTo(cx, tipY);
    ctx.closePath();
    ctx.fillStyle="#ffc960";
    ctx.shadowColor="rgba(0,0,0,.45)";
    ctx.shadowBlur=6;
    ctx.fill();
    ctx.restore();
  }
  drawWheel(0);

  // helper: compute which index sits under arrow for a given wheel angle
  function indexUnderArrow(angle){
    const TAU=2*Math.PI;
    const local = (pointerAngle - (angle%TAU) + TAU) % TAU;
    return Math.floor(local / seg) % numbers.length;
  }

  // toggle single-select bet buttons
  document.querySelectorAll(".bet-buttons .btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".bet-buttons .btn").forEach(b=> b.removeAttribute("aria-pressed"));
      btn.setAttribute("aria-pressed","true");
    });
  });

  // spin animation (free spin; result determined by arrow at stop)
  const TAU=2*Math.PI;
  let currentAngle=0, anim=null;

  function spin(){
    // --- lock in this round's stake & selections up-front ---
    const betAmt = Math.max(1, Number(betAmountInput.value)||0);

    // one type bet (or none)
    const activeTypeBtn = document.querySelector(".bet-buttons .btn[aria-pressed='true']");
    const type = activeTypeBtn ? activeTypeBtn.dataset.bet : null;

    // optional straight number bet
    const numberBet = betNumberInput.value !== "" ? Number(betNumberInput.value) : null;
    if(numberBet!=null && (numberBet<0 || numberBet>36 || Number.isNaN(numberBet))){
      resultEl.textContent = "Enter a number 0–36.";
      return;
    }

    // total stake = bet for type (if chosen) + bet for number (if entered)
    const stake = (type ? betAmt : 0) + (numberBet!=null ? betAmt : 0);
    if(stake<=0){ resultEl.textContent="No bet placed!"; return; }

    const wallet = getWallet();
    if(stake > wallet){ resultEl.textContent="Not enough balance."; return; }

    // deduct now (matches the other games)
    setWallet(wallet - stake);
    refreshWallet();

    // clear the pressed state so the UI resets after the spin
    if(activeTypeBtn) activeTypeBtn.removeAttribute("aria-pressed");

    // animate spin
    let speed = 0.35 + Math.random()*0.15;
    const decel = 0.985;

    function frame(){
      drawWheel(currentAngle);
      currentAngle += speed;
      speed *= decel;

      if(speed < 0.002){
        // landed — read the number under the arrow
        const idx = indexUnderArrow(currentAngle);
        const num = numbers[idx];
        const color = colors[idx];

        // resolve payouts (relative to locked selections above)
        let win = 0;

        // number hit pays 35x
        if(numberBet!=null && numberBet===num) win += betAmt*35;

        if(type){
          const hit =
            (type==="red"   && color==="red")   ||
            (type==="black" && color==="black") ||
            (type==="even"  && num!==0 && num%2===0) ||
            (type==="odd"   && num%2===1) ||
            (type==="low"   && num>=1 && num<=18) ||
            (type==="high"  && num>=19 && num<=36);
          if(hit) win += betAmt*2;
        }

        // credit winnings
        if(win>0){ setWallet(getWallet() + win); refreshWallet(); }

        resultEl.textContent = `Hit: ${num} (${color}) → ${win>0? "Win " + win : "Lost " + stake}`;
        const chip = document.createElement("span");
        chip.textContent = num;
        chip.style.background = color;
        chip.style.color = "#fff";
        historyEl.prepend(chip);

        anim=null;
        return;
      }
      anim = requestAnimationFrame(frame);
    }
    if(!anim) anim = requestAnimationFrame(frame);
  }

  spinBtn.addEventListener("click", spin);

  // when the Wheel view opens, refresh the balance display
  const obs = new MutationObserver(()=>{
    if(document.getElementById("wheel").classList.contains("is-active")){
      refreshWallet();
    }
  });
  obs.observe(document.getElementById("wheel"), { attributes:true });
})();

// ---------- Treasure Grid (Mines) ----------
(function treasureGrid(){
  const N = 25; // 5x5
  const boardEl   = document.getElementById("mines-board");
  if(!boardEl) return;

  const betInput  = document.getElementById("mines-bet");
  const minesSel  = document.getElementById("mines-count");
  const startBtn  = document.getElementById("mines-start");
  const cashBtn   = document.getElementById("mines-cashout");
  const balEl     = document.getElementById("mines-balance");
  const safeEl    = document.getElementById("mines-safe");
  const cashEl    = document.getElementById("mines-cash");
  const statusEl  = document.getElementById("mines-status");

  // --- shared wallet (works across Plaza games)
  function getWallet(){ return Number(localStorage.getItem("wallet-sh")||"10000"); }
  function setWallet(v){ localStorage.setItem("wallet-sh", String(v)); }
  function refreshWallet(){ balEl.textContent = getWallet(); }
  refreshWallet();

  // state
  let mines = 2;
  let bet = 0;
  let mineSet = new Set();  // indexes 0..24
  let revealed = new Set();
  let playing = false;

  // build UI grid
  function buildBoard(){
    boardEl.innerHTML = "";
    for(let i=0;i<N;i++){
      const b = document.createElement("button");
      b.className = "mines-tile";
      b.setAttribute("aria-label","Tile");
      b.dataset.idx = i;
      b.addEventListener("click", () => pick(i, b));
      boardEl.appendChild(b);
    }
  }
  buildBoard();

  function randomMines(M){
    const s = new Set();
    while(s.size < M){
      s.add(Math.floor(Math.random()*N));
    }
    return s;
  }

  // fair cashout multiplier (no house edge):
  // chance of k safe picks with M mines from N tiles:
  // P = product_{i=0..k-1} ( (N-M-i) / (N-i) )
  // Multiplier = 1 / P
  function multiplierFor(picks, M){
    if(picks<=0) return 1;
    let p = 1;
    for(let i=0;i<picks;i++){
      p *= ( (N - M - i) / (N - i) );
    }
    return 1 / p;
  }

  function updateHUD(){
    const k = revealed.size;
    safeEl.textContent = k;
    const multi = multiplierFor(k, mines);
    const cash = Math.floor(bet * multi);
    cashEl.textContent = playing && k>0 ? cash : 0;
  }

  function setStatus(msg){ statusEl.textContent = msg; }

  function resetRoundUI(disableTiles=false){
    $$(".mines-tile", boardEl).forEach(t=>{
      t.classList.remove("revealed","safe","mine","disabled");
      t.textContent = "";
      if(disableTiles) t.classList.add("disabled");
      else t.classList.remove("disabled");
    });
    revealed.clear();
    safeEl.textContent = "0";
    cashEl.textContent = "0";
  }

  function startRound(){
    mines = Number(minesSel.value);
    bet = Math.max(1, Number(betInput.value)||0);
    const wallet = getWallet();
    if(bet > wallet){ setStatus("Not enough balance."); return; }

    // place mines, lock UI
    mineSet = randomMines(mines);
    playing = true;
    setWallet(wallet - bet);
    refreshWallet();

    resetRoundUI(false);
    cashBtn.disabled = true; // becomes enabled after first safe pick
    startBtn.disabled = true;
    betInput.disabled = true;
    minesSel.disabled = true;
    setStatus("Game on — pick a tile.");
  }

  function revealAll(){
    $$(".mines-tile", boardEl).forEach(t=>{
      const i = Number(t.dataset.idx);
      if(mineSet.has(i)){
        t.classList.add("revealed","mine");
        t.textContent = "💥";
      }else{
        t.classList.add("revealed","safe");
        t.textContent = "💎";
      }
      t.classList.add("disabled");
    });
  }

  function endRound(winCash=0){
    playing = false;
    startBtn.disabled = false;
    betInput.disabled = false;
    minesSel.disabled = false;
    cashBtn.disabled = true;
    if(winCash > 0){
      const w = getWallet();
      setWallet(w + winCash);
      refreshWallet();
    }
  }

  function pick(i, tileBtn){
    if(!playing) return;
    if(revealed.has(i)) return;

    const hitMine = mineSet.has(i);
    revealed.add(i);

    if(hitMine){
      tileBtn.classList.add("revealed","mine");
      tileBtn.textContent = "💥";
      revealAll();
      setStatus("Boom! You lost the bet.");
      endRound(0);
      return;
    }

    tileBtn.classList.add("revealed","safe");
    tileBtn.textContent = "💎";

    const k = revealed.size;
    const multi = multiplierFor(k, mines);
    const cash = Math.floor(bet * multi);

    cashBtn.disabled = false;
    updateHUD();
    setStatus("Safe! You can cash out or keep picking…");
  }

  function cashout(){
    if(!playing) return;
    const k = revealed.size;
    if(k <= 0) { setStatus("You need at least one safe pick."); return; }
    const win = Math.floor(bet * multiplierFor(k, mines));
    revealAll();
    setStatus(`Cashed out: +${win} sh`);
    endRound(win);
  }

  startBtn.addEventListener("click", startRound);
  cashBtn.addEventListener("click", cashout);

  // If the Treasure view opens, (re)build/reset the board
  const obs = new MutationObserver(()=>{
    if($("#treasure").classList.contains("is-active")){
      resetRoundUI(true); // disabled until Bet
      setStatus("Place a bet");
      refreshWallet();
    }
  });
  obs.observe($("#treasure"), { attributes:true });
})();

// ---------- Drop Zone (Plinko — multi-press, smoother, hits pills) ----------
(function dropZone(){
  const canvas = document.getElementById("dz-canvas");
  if(!canvas) return;
  const ctx = canvas.getContext("2d");

  const dropBtn   = document.getElementById("dz-drop");
  const betInput  = document.getElementById("dz-bet");
  const colInput  = document.getElementById("dz-col");
  const cntInput  = document.getElementById("dz-count");
  const balEl     = document.getElementById("dz-balance");
  const statusEl  = document.getElementById("dz-status");
  const multsEl   = document.getElementById("dz-mults");

  // ----- shared wallet -----
  const WALLET_KEY = "wallet-sh";
  const getWallet = () => Number(localStorage.getItem(WALLET_KEY) || "10000");
  const setWallet = (v) => localStorage.setItem(WALLET_KEY, String(v));
  const refreshWallet = () => balEl.textContent = getWallet();
  refreshWallet();

  // ----- Board geometry (tuned so balls reach pills) -----
  const SLOTS = 13;              // 0..12
  const ROWS  = 12;
  const PEG_R = 4;
  const BALL_R = 5.5;
  const gx = 28;                  // horiz spacing
  const gy = 28;                  // vert spacing
  const offsetX = (canvas.width - (gx*(SLOTS-1))) / 2;
  const topY = 28;
  const floorY = canvas.height - 28;   // LOWER floor so balls travel farther

  // symmetric multipliers (edges high, center low)
  const MULTS = [16,9,4,2,1,0.7,0.5,0.7,1,2,4,9,16];

  // pills
  function renderMults(active = -1){
    multsEl.innerHTML = "";
    MULTS.forEach((m,i)=>{
      const div = document.createElement("div");
      div.className = "pill " + (m>=9 ? "hi" : m>=1 ? "mid" : "lo");
      if(i === active) div.classList.add("active");
      div.textContent = `${m}×`;
      multsEl.appendChild(div);
    });
  }
  renderMults(-1);

  // pegs (staggered)
  const pegs = [];
  for(let r=0;r<ROWS;r++){
    const cols = SLOTS-1;
    const odd = r%2===1;
    const row = [];
    for(let c=0;c<cols;c++){
      const x = offsetX + c*gx + (odd ? gx/2 : 0);
      const y = topY + (r+1)*gy;
      row.push({x,y});
    }
    pegs.push(row);
  }

  // drawing
  function drawBoard(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // pegs
    ctx.fillStyle = "#2b344a";
    pegs.forEach(row=>{
      row.forEach(p=>{
        ctx.beginPath();
        ctx.arc(p.x,p.y,PEG_R,0,Math.PI*2);
        ctx.fill();
      });
    });

    // slot guides
    ctx.strokeStyle = "rgba(255,255,255,.10)";
    ctx.lineWidth = 1;
    for(let s=0;s<SLOTS;s++){
      const x = offsetX + s*gx;
      ctx.beginPath();
      ctx.moveTo(x, pegs[pegs.length-1][0].y + 18);
      ctx.lineTo(x, floorY - 2);
      ctx.stroke();
    }

    // floor
    ctx.fillStyle = "rgba(255,255,255,.06)";
    ctx.fillRect(0, floorY, canvas.width, 2);
  }

  // physics (sub-steps + caps)
  const GRAV = 0.35;
  const DRAG = 0.995;
  const BOUNCE = 0.22;
  const MAX_V = 6.2;
  const SUBSTEPS = 3;

  function collidePeg(b, p){
    const dx = b.x - p.x, dy = b.y - p.y;
    const dist = Math.hypot(dx,dy);
    const minD = PEG_R + BALL_R;
    if(dist < minD){
      const nx = dx / (dist || 1), ny = dy / (dist || 1);
      const overlap = (minD - dist) + 0.01;
      b.x += nx * overlap;
      b.y += ny * overlap;
      const dot = b.vx*nx + b.vy*ny;
      b.vx = (b.vx - 2*dot*nx) * DRAG + (Math.random()-0.5)*0.12;
      b.vy = (b.vy - 2*dot*ny) * DRAG + (Math.random()-0.5)*0.04;
    }
  }

  // multi-press: keep animating; new clicks just add balls
  let balls = [];
  let anim = null;

  function spawnBall(slotIndex, betPerBall){
    const x = offsetX + slotIndex*gx;
    balls.push({ x, y: topY - 8, vx: 0, vy: 0, done:false, bet: betPerBall });
  }

  function settleBall(b){
    const idx  = Math.round((b.x - offsetX)/gx);
    const slot = Math.max(0, Math.min(SLOTS-1, idx));
    const mult = MULTS[slot];
    const win  = Math.floor(b.bet * mult);

    const w = getWallet();
    setWallet(w + win);
    refreshWallet();
    renderMults(slot);

    statusEl.textContent = `Landed in ${slot} → ${mult}×  |  +${win} sh`;
  }

  function physicsStep(){
    for(let s=0;s<SUBSTEPS;s++){
      for(const b of balls){
        if(b.done) continue;

        b.vy += GRAV / SUBSTEPS;
        b.x  += b.vx / SUBSTEPS;
        b.y  += b.vy / SUBSTEPS;

        // pegs (nearby rows only)
        const ny = b.y;
        for(const row of pegs){
          if(Math.abs(row[0].y - ny) <= gy + 8){
            for(const p of row){ collidePeg(b, p); }
          }
        }

        // side walls
        const minX = offsetX - gx/2 + BALL_R;
        const maxX = offsetX + (SLOTS-1)*gx + gx/2 - BALL_R;
        if(b.x < minX){ b.x = minX; b.vx = Math.abs(b.vx)*BOUNCE; }
        if(b.x > maxX){ b.x = maxX; b.vx = -Math.abs(b.vx)*BOUNCE; }

        // cap velocity
        b.vx = Math.max(-MAX_V, Math.min(MAX_V, b.vx));
        b.vy = Math.max(-MAX_V, Math.min(MAX_V, b.vy));

        // landing — use lowered floor
        if(b.y >= floorY - BALL_R){
          b.done = true;
          b.y = floorY - BALL_R;
          settleBall(b);
        }
      }
    }
    // remove finished to keep loop light
    balls = balls.filter(b => !b.done);
  }

  function drawBalls(){
    for(const b of balls){
      ctx.beginPath();
      ctx.arc(b.x, b.y, BALL_R, 0, Math.PI*2);
      ctx.fillStyle = "#ffc960";
      ctx.shadowColor = "rgba(0,0,0,.35)";
      ctx.shadowBlur = 6;
      ctx.fill();
    }
  }

  function frame(){
    drawBoard();
    physicsStep();
    drawBalls();
    if(balls.length){ anim = requestAnimationFrame(frame); }
    else { cancelAnimationFrame(anim); anim = null; }
  }

  function drop(){
    const bet = Math.max(1, Number(betInput.value)||0);
    const count = Math.max(1, Math.min(10, Number(cntInput?.value)||1));
    const wallet = getWallet();
    const startSlot = Math.max(0, Math.min(SLOTS-1, Number(colInput.value)||0));

    const totalStake = bet * count;
    if(totalStake > wallet){ statusEl.textContent = "Not enough balance."; return; }

    // take stake now
    setWallet(wallet - totalStake);
    refreshWallet();
    renderMults(-1);

    // spawn many (tiny jitter so paths diverge)
    for(let i=0;i<count;i++){
      const jitter = Math.random()*0.35 - 0.175; // ±~0.175 of a slot
      const slot = Math.max(0, Math.min(SLOTS-1, startSlot + jitter));
      spawnBall(slot, bet);
    }

    statusEl.textContent = `Dropping ${count}…`;
    if(!anim){ drawBoard(); anim = requestAnimationFrame(frame); }
  }

  dropBtn.addEventListener("click", drop);

  // refresh when view opens
  const obs = new MutationObserver(()=>{
    if($("#dropzone").classList.contains("is-active")){
      refreshWallet();
      renderMults(-1);
      drawBoard();
    }
  });
  obs.observe($("#dropzone"), { attributes:true });

  drawBoard();
})();

// ---------- 21 Challenge (Blackjack) ----------
(function blackjack(){
  // Elements
  const dealBtn  = document.getElementById("bj-deal");
  const hitBtn   = document.getElementById("bj-hit");
  const standBtn = document.getElementById("bj-stand");
  const betInput = document.getElementById("bj-bet");
  const balEl    = document.getElementById("bj-balance");
  const dHandEl  = document.getElementById("bj-dealer");
  const pHandEl  = document.getElementById("bj-player");
  const dScoreEl = document.getElementById("bj-score-dealer");
  const pScoreEl = document.getElementById("bj-score-player");
  const statusEl = document.getElementById("bj-status");
  if(!dealBtn) return;

  // Shared wallet
  const KEY = "wallet-sh";
  const getWallet = () => Number(localStorage.getItem(KEY) || "10000");
  const setWallet = v => localStorage.setItem(KEY, String(v));
  const refreshWallet = () => balEl.textContent = getWallet();
  refreshWallet();

function clearOutcome(){
  dHandEl.classList.remove("win","lose");
  pHandEl.classList.remove("win","lose");
}
function setOutcome(playerWon, push=false){
  clearOutcome();
  if(push) return;             // no glow on push
  if(playerWon) pHandEl.classList.add("win");
  else          pHandEl.classList.add("lose");
}


  // Deck
  const SUITS = ["♠","♥","♦","♣"];
  const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const isRed  = s => (s==="♥"||s==="♦");

  let deck = [];
  function freshDeck(){
    deck = [];
    for(const s of SUITS){
      for(const r of RANKS){ deck.push({r,s}); }
    }
    // Fisher–Yates
    for(let i=deck.length-1;i>0;i--){
      const j = (Math.random()* (i+1)) | 0;
      [deck[i],deck[j]] = [deck[j],deck[i]];
    }
  }

  function draw(){ return deck.pop(); }

  function handValue(cards){
    // Aces can be 1 or 11
    let sum = 0, aces = 0;
    for(const c of cards){
      if(c.r==="A"){ aces++; sum += 11; }
      else if(["K","Q","J"].includes(c.r)){ sum += 10; }
      else sum += Number(c.r);
    }
    while(sum>21 && aces){ sum -= 10; aces--; }
    return sum;
  }

function renderCard(c, hidden=false){
  const div = document.createElement("div");
  div.className = "card" + (hidden ? " back" : "") + (!hidden && isRed(c.s) ? " red" : "");
  if(!hidden){
    div.innerHTML = `
      <div class="corner tl">${c.r}<br>${c.s}</div>
      <div class="corner br">${c.r}<br>${c.s}</div>
      <div class="center">${c.s}</div>
    `;
  }
  return div;
}


  function renderHands(){
    dHandEl.innerHTML = "";
    pHandEl.innerHTML = "";
    // Dealer: show first card face up, second hidden if player still acting
    dHandEl.append(...dealer.map((c,i)=> renderCard(c, hideHole && i===1)));
    pHandEl.append(...player.map(c => renderCard(c,false)));

    // Scores
    pScoreEl.textContent = handValue(player);
    dScoreEl.textContent = hideHole ? "?" : handValue(dealer);
  }

  // State
  let player = [];
  let dealer = [];
  let hideHole = true;   // hide dealer's second card
  let roundActive = false;
  let bet = 0;

  function setButtons(stage){
    // stage: "ready" | "act" | "done"
    if(stage==="ready"){
      dealBtn.disabled = false;
      hitBtn.disabled  = true;
      standBtn.disabled= true;
    }else if(stage==="act"){
      dealBtn.disabled = true;
      hitBtn.disabled  = false;
      standBtn.disabled= false;
    }else{
      dealBtn.disabled = false;
      hitBtn.disabled  = true;
      standBtn.disabled= true;
    }
  }

  function status(msg){ statusEl.textContent = msg; }

  function startRound(){
    bet = Math.max(1, Number(betInput.value)||0);
    const w = getWallet();
    if(bet > w){ status("Not enough balance."); return; }

    // Deduct stake
    setWallet(w - bet); refreshWallet();

    freshDeck();
    player = [draw(), draw()];
    dealer = [draw(), draw()];
    hideHole = true;
    roundActive = true;
    clearOutcome();
    renderHands();
    setButtons("act");

    const p = handValue(player);
    const dUp = handValue([dealer[0]]);
    if(p===21){
      // Natural blackjack — pay 3:2
      finishRound("blackjack");
      return;
    }
    status("Your move: Hit or Stand.");
  }

  function finishRound(reason){
    // Reveal dealer
    hideHole = false;
    renderHands();

let payout = 0;
const p = handValue(player);
const d = handValue(dealer);

if(reason==="bust"){
  status(`Bust! You lose -${bet} sh.`);
  setOutcome(false);
  payout = 0;
}else if(reason==="blackjack"){
  payout = Math.floor(bet * 2.5);
  status(`Blackjack! +${payout} sh`);
  setOutcome(true);
}else{
  // Dealer plays to 17
  while(handValue(dealer) < 17){ dealer.push(draw()); renderHands(); }
  const d2 = handValue(dealer);
  renderHands();

  if(d2>21){
    payout = bet*2;
    status(`Dealer busts. +${payout} sh`);
    setOutcome(true);
  }else if(p>d2){
    payout = bet*2;
    status(`You win ${p} vs ${d2}. +${payout} sh`);
    setOutcome(true);
  }else if(p<d2){
    payout = 0;
    status(`Dealer wins ${d2} vs ${p}.`);
    setOutcome(false);
  }else{
    payout = bet;
    status("Push. Bet returned.");
    setOutcome(false, /*push=*/true);
  }
}


    if(payout>0){
      const w = getWallet();
      setWallet(w + payout);
      refreshWallet();
    }

    roundActive = false;
    setButtons("done");
  }

  function hit(){
    if(!roundActive) return;
    player.push(draw());
    renderHands();
    const v = handValue(player);
    if(v>21){ finishRound("bust"); }
  }

  function stand(){
    if(!roundActive) return;
    finishRound("stand");
  }

  // Events
  dealBtn.addEventListener("click", startRound);
  hitBtn.addEventListener("click", hit);
  standBtn.addEventListener("click", stand);

  // When view opens, refresh UI
  const obs = new MutationObserver(()=>{
    if($("#twentyone").classList.contains("is-active")){
      setButtons("ready");
      status("Place a bet and press Deal.");
      refreshWallet();
      dHandEl.innerHTML = pHandEl.innerHTML = "";
      dScoreEl.textContent = pScoreEl.textContent = "—";
    }
  });
  obs.observe($("#twentyone"), { attributes:true });
})();








// ---------- Plaza Wallet (shared across all Plaza games) ----------
(function plazaWallet(){
  const KEY = "wallet-sh";
  const DEFAULT_BAL = 10000;

  const balEl   = document.getElementById("plaza-balance");
  const resetBt = document.getElementById("plaza-reset");
  const editBt  = document.getElementById("plaza-edit");
  if(!balEl) return; // safety

  const getWallet = () => Number(localStorage.getItem(KEY) || DEFAULT_BAL);
  const setWallet = (v) => localStorage.setItem(KEY, String(v));
  const refresh   = () => { balEl.textContent = getWallet(); };

  // Initial paint
  refresh();

  // Reset to 10,000
  resetBt.addEventListener("click", ()=>{
    setWallet(DEFAULT_BAL);
    refresh();
    // also refresh visible balances in games if those views are open
    const tryUpdate = id => {
      const el = document.getElementById(id);
      if(el) el.textContent = getWallet();
    };
    tryUpdate("wheel-balance");
    tryUpdate("mines-balance");
    tryUpdate("dz-balance");
    tryUpdate("bj-balance");
  });

  // Edit via prompt (simple, robust)
  editBt.addEventListener("click", ()=>{
    const cur = getWallet();
    const val = prompt("Enter custom shillings amount:", String(cur));
    if(val===null) return;
    const n = Math.max(0, Math.floor(Number(val)||0));
    setWallet(n);
    refresh();
    const tryUpdate = id => {
      const el = document.getElementById(id);
      if(el) el.textContent = getWallet();
    };
    tryUpdate("wheel-balance");
    tryUpdate("mines-balance");
    tryUpdate("dz-balance");
    tryUpdate("bj-balance");
  });

  // Keep Plaza balance in sync when the Plaza view becomes visible
  const plaza = document.getElementById("plaza");
  const obs = new MutationObserver(()=> {
    if(plaza.classList.contains("is-active")) refresh();
  });
  obs.observe(plaza, { attributes:true });
})();

// ---------- Spin Reels (Slots) ----------
(function slots(){
  const gridEl   = document.getElementById("slots-grid");
  if(!gridEl) return;
  const spinBtn  = document.getElementById("slots-spin");
  const betInput = document.getElementById("slots-bet");
  const modeSel  = document.getElementById("slots-mode");
  const statusEl = document.getElementById("slots-status");
  const balEl    = document.getElementById("slots-balance");

  // Shared wallet
  const KEY = "wallet-sh";
  const getWallet = () => Number(localStorage.getItem(KEY) || "10000");
  const setWallet = (v) => localStorage.setItem(KEY, String(v));
  const refresh   = () => balEl.textContent = getWallet();

  refresh();

  // Symbols (emoji + weights + multipliers)
  // Higher weight = more common
  const SYMBOLS = [
    {icon:"💎", weight:2,  mult:50},
    {icon:"⭐", weight:4,  mult:25},
    {icon:"🔔", weight:6,  mult:10},
    {icon:"🍒", weight:10, mult:5},
    {icon:"🍋", weight:12, mult:4},
    {icon:"🍀", weight:14, mult:3},
  ];
  // Build weighted bag
  const BAG = [];
  SYMBOLS.forEach(s => { for(let i=0;i<s.weight;i++) BAG.push(s.icon); });

  // Helpers
  const pick = () => BAG[(Math.random()*BAG.length)|0];
  const iconMult = (icon) => (SYMBOLS.find(s=>s.icon===icon)?.mult || 0);

  // Build 3×3 cells
  const cells = [];
  function build(){
    gridEl.innerHTML = "";
    for(let r=0;r<3;r++){
      for(let c=0;c<3;c++){
        const div = document.createElement("div");
        div.className = "slot-cell";
        div.dataset.r = r;
        div.dataset.c = c;
        div.textContent = pick();
        gridEl.appendChild(div);
        cells.push(div);
      }
    }
  }
  build();

  function clearWins(){
    cells.forEach(el => el.classList.remove("win"));
  }
  function setRowWin(r){
    for(let c=0;c<3;c++){
      const el = cells[r*3 + c];
      el.classList.add("win");
    }
  }

  // Evaluate paylines and compute total win
  // mode: "1" => middle row only; "3" => top+middle+bottom
  function evaluate(mode, bet){
    clearWins();
    const rows = (mode==="1") ? [1] : [0,1,2];
    let total = 0;
    let winsDesc = [];

    for(const r of rows){
      const a = cells[r*3 + 0].textContent;
      const b = cells[r*3 + 1].textContent;
      const c = cells[r*3 + 2].textContent;

      if(a===b && b===c){
        const mult = iconMult(a);
        if(mult>0){
          total += bet * mult;
          setRowWin(r);
          winsDesc.push(`${["Top","Middle","Bottom"][r]}: 3× ${a} → ${mult}×`);
        }
      }else if(a===b || b===c || a===c){
        // any 2-of-a-kind pays 2× (per line)
        total += bet * 2;
        setRowWin(r);
        winsDesc.push(`${["Top","Middle","Bottom"][r]}: 2 of a kind → 2×`);
      }
    }

    return { total, winsDesc };
  }

  // Spin animation: fake reel spin by shuffling columns separately and stopping one by one
  let spinning = false;

  async function spin(){
    if(spinning) return;

    const bet = Math.max(1, Number(betInput.value)||0);
    const mode = modeSel.value; // "1" or "3"
    const stake = bet;          // bet per spin (we pay per winning line)
    const w = getWallet();
    if(stake > w){ statusEl.textContent = "Not enough balance."; return; }

    // Deduct stake
    setWallet(w - stake); refresh();

    spinning = true;
    clearWins();
    statusEl.textContent = "Spinning…";

    // Add spin animation class to columns, stop sequentially
    const columns = [
      [cells[0],cells[3],cells[6]], // col 0 (top to bottom)
      [cells[1],cells[4],cells[7]],
      [cells[2],cells[5],cells[8]],
    ];

    // per-column timers
    const timers = [];

    // Start animating all columns
    columns.forEach((col, idx)=>{
      col.forEach(el => el.classList.add("slot-spin"));
      timers[idx] = setInterval(()=>{
        // roll this column visually
        const newTop = pick();
        const newMid = pick();
        const newBot = pick();
        col[0].textContent = newTop;
        col[1].textContent = newMid;
        col[2].textContent = newBot;
      }, 60);
    });

    // Stop columns one by one with a short delay
    const stopCol = (idx, delay) => new Promise(res=>{
      setTimeout(()=>{
        clearInterval(timers[idx]);
        // final settle for this column (choose final icons)
        const final = [pick(), pick(), pick()];
        columns[idx][0].textContent = final[0];
        columns[idx][1].textContent = final[1];
        columns[idx][2].textContent = final[2];
        columns[idx].forEach(el => el.classList.remove("slot-spin"));
        res();
      }, delay);
    });

    await stopCol(0, 500 + Math.random()*200);
    await stopCol(1, 350 + Math.random()*200);
    await stopCol(2, 300 + Math.random()*200);

    // Evaluate result
    const { total, winsDesc } = evaluate(mode, bet);

    // Credit winnings
    if(total>0){ setWallet(getWallet() + total); refresh(); }

    statusEl.textContent = total>0
      ? `Win +${total} sh  ${winsDesc.length? "• " + winsDesc.join("  |  ") : ""}`
      : "No win — try again.";

    spinning = false;
  }

  spinBtn.addEventListener("click", spin);

  // Keep balance fresh when this view opens
  const obs = new MutationObserver(()=>{
    if(document.getElementById("slots").classList.contains("is-active")){
      refresh();
    }
  });
  obs.observe(document.getElementById("slots"), { attributes:true });
})();

// ---------- Crash Curve (fixed cashout + restart) ----------
(function crashGame(){
  const canvas = document.getElementById("cr-canvas");
  if(!canvas) return;
  const ctx = canvas.getContext("2d");

  const startBtn = document.getElementById("cr-start");
  const cashBtn  = document.getElementById("cr-cashout");
  const betInput = document.getElementById("cr-bet");
  const riskSel  = document.getElementById("cr-risk");
  const balEl    = document.getElementById("cr-balance");
  const multiEl  = document.getElementById("cr-multi");
  const statusEl = document.getElementById("cr-status");

  // Shared wallet
  const KEY = "wallet-sh", DEFAULT_BAL = 10000;
  const getWallet = () => Number(localStorage.getItem(KEY) || DEFAULT_BAL);
  const setWallet = v => localStorage.setItem(KEY, String(v));
  const refresh   = () => balEl.textContent = getWallet();
  refresh();

  // Curve config
  const k = 0.35; // growth rate (higher -> faster climb)
  let t0 = 0, t = 0;

  // Round state
  let running = false;
  let crashed = false;
  let cashed  = false;
  let crashAt = 0;  // multiplier where it will bust
  let stake   = 0;  // bet taken up-front

  // Aesthetic helpers
  function setStatus(msg){ statusEl.textContent = msg; }
  function setMulti(x, color){ 
    multiEl.textContent = `${x.toFixed(2)}×`;
    multiEl.classList.remove("green","red","pulse");
    if(color) multiEl.classList.add(color);
    multiEl.classList.add("pulse");
    setTimeout(()=> multiEl.classList.remove("pulse"), 110);
  }

  // Risk → distribution of crash multiplier
  function randCrashMult(risk){
    const u = Math.random();
    let base;
    if(risk === "low"){
      base = 1 + (Math.pow(u, 0.65) * 7);  // 1..8
    }else if(risk === "high"){
      base = 1 + (Math.pow(u, 2.2) * 3);   // 1..4
    }else{
      base = 1 + (Math.pow(u, 1.2) * 5);   // 1..6
    }
    if(Math.random() < 0.03) base = 8 + Math.random()*12; // rare 8..20
    return Math.min(base, 50);
  }

  // Canvas coords
  const W = canvas.width, H = canvas.height;
  const PAD = 40;
  const X0 = PAD, Y0 = H - PAD; // origin (left-bottom)
  const XMAX = W - PAD, YMAX = PAD;

  // Store the path to re-draw glowing curve
  const path = [];

  function resetCanvas(){
    ctx.clearRect(0,0,W,H);
    // grid
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,.06)";
    for(let x=X0; x<=XMAX; x+=60){
      ctx.beginPath(); ctx.moveTo(x, YMAX); ctx.lineTo(x, Y0); ctx.stroke();
    }
    for(let y=Y0; y>=YMAX; y-=50){
      ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(XMAX, y); ctx.stroke();
    }
    ctx.restore();
  }

  function drawCurve(){
    if(path.length < 2) return;
    // glow underlay
    ctx.save();
    ctx.strokeStyle = "rgba(124,255,183,.28)";
    ctx.lineWidth = 6;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    for(let i=0;i<path.length;i++){
      const p = path[i];
      if(i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y);
    }
    ctx.stroke();
    ctx.restore();

    // bright line
    ctx.save();
    const grad = ctx.createLinearGradient(X0,Y0, XMAX,YMAX);
    grad.addColorStop(0, "#6ae3ff");
    grad.addColorStop(1, "#7cffb7");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for(let i=0;i<path.length;i++){
      const p = path[i];
      if(i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y);
    }
    ctx.stroke();
    ctx.restore();

    // current dot
    const p = path[path.length-1];
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4.5, 0, Math.PI*2);
    ctx.fillStyle = "#ffc960";
    ctx.shadowColor = "rgba(0,0,0,.45)";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }

  function mOf(sec){ return Math.exp(k * sec); }

  function toCanvas(sec, m){
    const x = X0 + Math.min((sec*80), XMAX - X0);
    const y = Y0 - Math.min( (Math.log(m) / Math.log(1.08)) * 6, Y0 - YMAX );
    return { x, y };
  }

  function animate(now){
    if(!running) return;                // <— stop immediately if round ended
    if(!t0) t0 = now;
    t = (now - t0) / 1000;

    const m = mOf(t);
    resetCanvas();
    const pt = toCanvas(t, m);
    path.push(pt);
    drawCurve();

    if(!crashed) setMulti(m, cashed ? "green" : null);

    // crash check — if you already cashed, DO NOT bust the round
    if(!crashed && m >= crashAt){
      crashed = true;
      if(!cashed){
        setMulti(crashAt, "red");
        setStatus(`Busted at ${crashAt.toFixed(2)}× — lost ${stake} sh`);
      }else{
        // silent end if already cashed
        setStatus(`Round ended at ${crashAt.toFixed(2)}×`);
      }
      cashBtn.disabled = true;
      running = false;
      startBtn.disabled = false;        // <— allow re-bet
      return;
    }

    requestAnimationFrame(animate);
  }

  function startRound(){
    if(running) return;
    const bet = Math.max(1, Number(betInput.value)||0);
    const w = getWallet();
    if(bet > w){ setStatus("Not enough balance."); return; }

    // take stake up-front
    setWallet(w - bet); refresh();

    // setup
    stake = bet; cashed = false; crashed = false; running = true;
    crashAt = randCrashMult(riskSel.value);
    path.length = 0;
    t0 = 0; t = 0;
    resetCanvas();
    setStatus("Rising… cash out any time.");
    multiEl.classList.remove("red","green");
    setMulti(1.00);
    cashBtn.disabled = false;
    startBtn.disabled = true;

    requestAnimationFrame(animate);
  }

  function cashout(){
    if(!running || crashed || cashed) return;
    // payout immediately at current multiplier and END ROUND NOW
    const m = mOf(t);
    const win = Math.floor(stake * m);
    setWallet(getWallet() + win);
    refresh();

    cashed = true;
    setMulti(m, "green");
    setStatus(`Cashed out at ${m.toFixed(2)}×  →  +${win} sh`);

    // end round right away so you can re-bet; stop animation
    cashBtn.disabled = true;
    running = false;
    startBtn.disabled = false;
  }

  function resetUI(){
    refresh();
    resetCanvas();
    setMulti(1.00);
    setStatus("Place a bet and press Start.");
    startBtn.disabled = false;
    cashBtn.disabled = true;
    running = false; crashed = false; cashed = false;
    path.length = 0;
    t0 = 0; t = 0;
  }

  // Events
  startBtn.addEventListener("click", startRound);
  cashBtn.addEventListener("click", cashout);

  // Reset when view shows
  const obs = new MutationObserver(()=>{
    if(document.getElementById("crash").classList.contains("is-active")){
      resetUI();
    }
  });
  obs.observe(document.getElementById("crash"), { attributes:true });

  // initial paint
  resetUI();
})();
