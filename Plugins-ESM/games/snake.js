//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import { AIRich } from '../../Library/MessageBuilder.js';
export default async function handler(m, { conn }) {
    const htmlPayload = `<style>*{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;box-sizing:border-box}
.dpad{transition:transform .1s,background .1s}
.dpad:active{transform:scale(.92);background:rgba(15,56,15,.35)!important}
.board{width:100%;aspect-ratio:16/9;display:grid;overflow:hidden;border-radius:4px;background:#9bbc0f;border:3px solid #26331a;box-sizing:border-box;transition:background .3s}
.board.flash{background:#294d0f}
.cell{position:relative;box-shadow:inset 0 0 0 .5px rgba(38,51,26,.1)}
.cell.snakeHead{background:#0f380f}
.cell.snakeBody{background:#306230;margin:1px;border-radius:2px}
.cell.food:before{content:'';position:absolute;inset:18%;background:#0f380f;border-radius:50%}
#overlay{display:flex;position:absolute;inset:0;background:rgba(15,56,15,.75);z-index:10;flex-direction:column;align-items:center;justify-content:center;border-radius:2px;text-align:center;padding:10px}
#overlay .t{color:#9bbc0f;font-weight:700;font-size:16px;font-family:'Courier New',monospace;letter-spacing:1px}
#overlay .s{color:#9bbc0f;opacity:.85;font-size:10px;margin-top:8px;font-family:'Courier New',monospace}
</style>
<body style="margin:0;background:transparent;font-family:'Courier New',monospace;color:#0f380f;touch-action:manipulation">
<div style="width:100%;max-width:460px;margin:auto;padding:16px;box-sizing:border-box">
<div id="card" style="background:#8fac0f;border:6px solid #26331a;border-radius:10px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.45),inset 0 0 12px rgba(0,0,0,.25)">
<div style="padding:12px 16px;border-bottom:3px solid #26331a;display:flex;justify-content:space-between;align-items:center;background:#7a9a0d">
<div><div style="font-size:9px;letter-spacing:2px;color:#26331a;opacity:.7">AL GAMES</div><div style="font-size:19px;font-weight:bold;color:#26331a;letter-spacing:1px">SNAKE II</div></div>
<div style="text-align:right"><div id="score" style="font-size:16px;font-weight:bold;color:#26331a;letter-spacing:2px">SCORE 000</div><div id="best" style="font-size:9px;color:#26331a;opacity:.7;margin-top:1px">BEST 000</div></div>
</div>
<div style="padding:14px">
<div id="boardWrap" style="position:relative;width:100%">
<div id="board" class="board"></div>
<div id="overlay"><div class="t" id="overlayTitle"></div><div class="s" id="overlaySub"></div></div>
</div>
<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
<div id="status" style="font-size:11px;color:#3a4a1f;font-weight:bold">Tekan arah / panah untuk mulai</div>
<div id="speedTag" style="font-size:10px;color:#3a4a1f;opacity:.7">LV 1</div>
</div>
<div style="display:flex;justify-content:center;margin-top:14px">
<div style="display:grid;grid-template-columns:44px 44px 44px;grid-template-rows:40px 40px 40px;gap:4px">
<div></div><button class="dpad" data-d="up" style="grid-column:2;background:rgba(38,51,26,.15);border:2px solid #26331a;border-radius:8px;color:#26331a;font-size:16px;font-weight:bold">▲</button><div></div>
<button class="dpad" data-d="left" style="background:rgba(38,51,26,.15);border:2px solid #26331a;border-radius:8px;color:#26331a;font-size:16px;font-weight:bold">◀</button>
<button id="pauseBtn" style="background:rgba(38,51,26,.25);border:2px solid #26331a;border-radius:8px;color:#26331a;font-size:10px;font-weight:bold">II</button>
<button class="dpad" data-d="right" style="background:rgba(38,51,26,.15);border:2px solid #26331a;border-radius:8px;color:#26331a;font-size:16px;font-weight:bold">▶</button>
<div></div><button class="dpad" data-d="down" style="grid-column:2;background:rgba(38,51,26,.15);border:2px solid #26331a;border-radius:8px;color:#26331a;font-size:16px;font-weight:bold">▼</button><div></div>
</div>
</div>
</div></div></div>
<script>
const boardEl=document.getElementById('board'),boardWrapEl=document.getElementById('boardWrap'),overlayEl=document.getElementById('overlay'),overlayTitleEl=document.getElementById('overlayTitle'),overlaySubEl=document.getElementById('overlaySub'),scoreEl=document.getElementById('score'),bestEl=document.getElementById('best'),statusEl=document.getElementById('status'),speedTag=document.getElementById('speedTag'),pauseBtn=document.getElementById('pauseBtn');
const COLS=16,ROWS=9;
let cells=[],prevActive=[];
let snake,dir,nextDir,food,score,best=0,gameOver,started,paused,tickMs,tickHandle=null;
let actx=null;
function ensureAudio(){if(actx)return actx;try{actx=new(window.AudioContext||window.webkitAudioContext)()}catch(e){actx=null}return actx}
function beep(freq,dur,type,vol){let ctx=ensureAudio();if(!ctx)return;try{if(ctx.state==='suspended')ctx.resume();let osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type||'square';osc.frequency.setValueAtTime(freq,ctx.currentTime);gain.gain.setValueAtTime(0,ctx.currentTime);gain.gain.linearRampToValueAtTime(vol||.12,ctx.currentTime+.01);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+dur);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+dur)}catch(e){}}
function sfxEat(){beep(660,.05,'square',.1);setTimeout(()=>beep(880,.05,'square',.09),40)}
function sfxDie(){beep(180,.3,'sawtooth',.13);setTimeout(()=>beep(110,.35,'sawtooth',.12),120)}
function sfxTurn(){beep(400,.02,'square',.04)}
function loadBest(){
let vals=[];
try{let v=localStorage.getItem('nokia_snake_best');if(v)vals.push(parseInt(v,10))}catch(e){}
try{let m=document.cookie.match(/(?:^|;\\s*)nokia_snake_best=(\\d+)/);if(m)vals.push(parseInt(m[1],10))}catch(e){}
return vals.length?Math.max(...vals.filter(v=>!isNaN(v))):0
}
function saveBest(v){
let val=String(Math.floor(v));
try{localStorage.setItem('nokia_snake_best',val)}catch(e){}
try{document.cookie='nokia_snake_best='+val+';max-age=31536000;path=/'}catch(e){}
}
best=loadBest();
function buildBoard(){
boardEl.innerHTML='';
boardEl.style.gridTemplateColumns='repeat('+COLS+',1fr)';
boardEl.style.gridTemplateRows='repeat('+ROWS+',1fr)';
cells=[];
for(let y=0;y<ROWS;y++){
for(let x=0;x<COLS;x++){
const cell=document.createElement('div');
cell.className='cell';
boardEl.appendChild(cell);
cells.push(cell)
}
}
}
function placeFood(){
let cell;
do{cell={x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)}}
while(snake.some(s=>s.x===cell.x&&s.y===cell.y));
food=cell
}
function clearTick(){
if(tickHandle){clearInterval(tickHandle);tickHandle=null}
}
function scheduleTick(){
clearTick();
if(started&&!paused&&!gameOver){
tickHandle=setInterval(()=>{
try{step()}catch(e){}
},tickMs)
}
}
function showOverlay(title,sub){overlayEl.style.display='flex';overlayTitleEl.textContent=title;overlaySubEl.textContent=sub}
function hideOverlay(){overlayEl.style.display='none'}
function render(){
prevActive.forEach(idx=>{if(cells[idx])cells[idx].className='cell'});
prevActive=[];
if(food){
const fi=food.y*COLS+food.x;
if(cells[fi]){cells[fi].className='cell food';prevActive.push(fi)}
}
snake.forEach((s,i)=>{
const idx=s.y*COLS+s.x;
if(cells[idx]){cells[idx].className='cell '+(i===0?'snakeHead':'snakeBody');prevActive.push(idx)}
})
}
function reset(){
clearTick();
snake=[{x:5,y:4},{x:4,y:4},{x:3,y:4}];
dir={x:1,y:0};nextDir={x:1,y:0};
score=0;gameOver=false;started=false;paused=false;
tickMs=150;
placeFood();
scoreEl.textContent='SCORE '+String(score).padStart(3,'0');
bestEl.textContent='BEST '+String(Math.floor(best)).padStart(3,'0');
speedTag.textContent='LV 1';
statusEl.textContent='Tekan arah / panah untuk mulai';
pauseBtn.textContent='II';
showOverlay('SNAKE II','Pakai panah / tombol arah');
render()
}
function setDir(nx,ny){
if(nx===-dir.x&&ny===-dir.y)return;
nextDir={x:nx,y:ny};
if(!started){started=true;paused=false;statusEl.textContent='Main!';hideOverlay();scheduleTick()}
sfxTurn()
}
function togglePause(){
if(gameOver||!started)return;
paused=!paused;
statusEl.textContent=paused?'Jeda - tekan II lagi':'Main!';
pauseBtn.textContent=paused?'▶':'II';
scheduleTick()
}
function endGame(){
clearTick();
gameOver=true;started=false;
if(score>best){best=score;saveBest(best)}
bestEl.textContent='BEST '+String(Math.floor(best)).padStart(3,'0');
statusEl.textContent='Mati! Skor '+score;
showOverlay('GAME OVER','Skor '+score+' - Tekan arah untuk ulang');
boardEl.classList.add('flash');
setTimeout(()=>boardEl.classList.remove('flash'),300);
sfxDie()
}
function step(){
dir=nextDir;
const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
if(head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS){endGame();return}
if(snake.some(s=>s.x===head.x&&s.y===head.y)){endGame();return}
snake.unshift(head);
if(head.x===food.x&&head.y===food.y){
score++;
scoreEl.textContent='SCORE '+String(score).padStart(3,'0');
scoreEl.style.color='#4a6b1a';setTimeout(()=>scoreEl.style.color='#26331a',120);
sfxEat();
tickMs=Math.max(70,150-Math.floor(score/4)*8);
speedTag.textContent='LV '+(1+Math.floor(score/4));
placeFood();
scheduleTick()
}else{
snake.pop()
}
render()
}
document.querySelectorAll('.dpad').forEach(btn=>{
btn.addEventListener('pointerdown',e=>{
e.preventDefault();
if(gameOver){reset();return}
const d=btn.dataset.d;
if(d==='up')setDir(0,-1);
else if(d==='down')setDir(0,1);
else if(d==='left')setDir(-1,0);
else if(d==='right')setDir(1,0)
})
});
pauseBtn.addEventListener('pointerdown',e=>{e.preventDefault();togglePause()});
document.addEventListener('keydown',e=>{
if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D',' '].includes(e.key))e.preventDefault();
if(gameOver&&e.key!==' '){reset();return}
if(e.key==='ArrowUp'||e.key==='w'||e.key==='W')setDir(0,-1);
else if(e.key==='ArrowDown'||e.key==='s'||e.key==='S')setDir(0,1);
else if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')setDir(-1,0);
else if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')setDir(1,0);
else if(e.key===' ')togglePause()
});
let touchStartX=0,touchStartY=0;
boardWrapEl.addEventListener('touchstart',e=>{touchStartX=e.touches[0].clientX;touchStartY=e.touches[0].clientY},{passive:true});
boardWrapEl.addEventListener('touchend',e=>{
if(gameOver){reset();return}
const dx=e.changedTouches[0].clientX-touchStartX,dy=e.changedTouches[0].clientY-touchStartY;
if(Math.abs(dx)<20&&Math.abs(dy)<20)return;
if(Math.abs(dx)>Math.abs(dy))setDir(dx>0?1:-1,0);
else setDir(0,dy>0?1:-1)
},{passive:true});
buildBoard();
reset();
</script></body>`;
    const section = AIRich.newLayout('Single', {
        __typename: 'GenAIaeacdsnwHtmlPrimitive',
        payload: htmlPayload,
        trusted_sources: ["nixel.dev"]
    });
    const submessage = [{
        messageType: 2,
        messageText: "Snake II - Tap tombol arah buat main"
    }];
    const msg = new AIRich(conn);
    msg._addContent(section, submessage);
    await msg.send(m.chat, { quoted: m });
}
handler.command = /^(snake|ular)$/i;
handler.help = ['snake / ular'];
handler.tags = ['games'];
