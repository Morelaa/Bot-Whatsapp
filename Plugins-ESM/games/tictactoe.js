//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import { AIRich } from '../../Library/MessageBuilder.js';
export default async function handler(m, { conn }) {
    const htmlPayload = `<style>*{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;box-sizing:border-box}
@keyframes fadeSlide{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
@keyframes popIn{0%{opacity:0;transform:scale(.3)}65%{opacity:1;transform:scale(1.12)}100%{opacity:1;transform:scale(1)}}
@keyframes cellIn{0%{opacity:0;transform:scale(.85)}100%{opacity:1;transform:scale(1)}}
@keyframes shakeX{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes glowFlicker{0%,100%{filter:drop-shadow(0 0 6px currentColor)}50%{filter:drop-shadow(0 0 12px currentColor)}}
@keyframes confettiFall{0%{opacity:1;transform:translateY(-10px) rotate(0deg)}100%{opacity:0;transform:translateY(180px) rotate(340deg)}}
@keyframes dropdownIn{0%{opacity:0;transform:translateY(-6px) scale(.97)}100%{opacity:1;transform:translateY(0) scale(1)}}
#card{animation:fadeSlide .35s ease}
.ctrlBtn{transition:transform .12s,filter .12s}
.ctrlBtn:active{transform:scale(.95)}
.cellBox{position:relative;display:flex;align-items:center;justify-content:center;background:#15151b;border:1px solid rgba(255,255,255,.06);border-radius:14px;cursor:pointer;overflow:hidden;opacity:0;animation:cellIn .3s ease forwards;transition:background .2s}
.cellBox.filled{cursor:default}
.markLetter{font-size:44px;font-weight:800;line-height:1;animation:popIn .3s cubic-bezier(.34,1.56,.64,1) forwards}
.markX{color:#fff;text-shadow:0 0 10px rgba(255,255,255,.85),0 0 22px rgba(255,255,255,.4)}
.markO{color:#9d84ff;text-shadow:0 0 10px rgba(157,132,255,.9),0 0 24px rgba(157,132,255,.5)}
.cellBox.mX{box-shadow:inset 0 0 26px rgba(255,255,255,.12)}
.cellBox.mO{box-shadow:inset 0 0 26px rgba(157,132,255,.18)}
.winCell{animation:cellIn .3s ease forwards,glowFlicker 1.1s ease-in-out infinite}
#modeMenu{animation:dropdownIn .16s ease}
.confetti{position:absolute;top:0;width:6px;height:10px;border-radius:1px;animation:confettiFall 1s ease-in forwards;pointer-events:none}
.shakeAnim{animation:shakeX .4s ease}
#status{transition:opacity .15s}
</style>
<body style="margin:0;background:transparent;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#eee;touch-action:manipulation">
<div style="width:100%;max-width:420px;margin:auto;padding:16px">
<div id="card" style="position:relative;background:linear-gradient(160deg,#1c1c22,#141418);border:1px solid rgba(255,255,255,.08);border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.5);padding:20px 20px 22px">
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
<div>
<div style="font-size:10px;letter-spacing:3px;color:rgba(255,255,255,.35);font-weight:700">AL GAMES</div>
<div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-.5px;margin-top:2px">TIC TAC TOE</div>
</div>
<div style="text-align:right">
<div id="resultLabel" style="font-size:11px;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,.5)">SIAP MAIN</div>
<div id="tally" style="font-size:15px;font-weight:700;color:#fff;margin-top:2px">0-0-0</div>
</div>
</div>
<div style="display:flex;gap:10px;margin-bottom:16px;position:relative">
<div style="flex:1;position:relative">
<button id="modeBtn" class="ctrlBtn" style="width:100%;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:#0f0f13;color:#fff;font-size:13px;font-weight:700;letter-spacing:.5px;display:flex;justify-content:space-between;align-items:center">
<span id="modeBtnLabel">NORMAL</span><span style="font-size:10px;opacity:.6">▾</span>
</button>
<div id="modeMenu" style="display:none;position:absolute;top:calc(100% + 6px);left:0;right:0;background:#1a1a20;border:1px solid rgba(255,255,255,.12);border-radius:12px;overflow:hidden;z-index:5;box-shadow:0 8px 24px rgba(0,0,0,.5)">
<div class="modeOpt" data-mode="easy" style="padding:11px 14px;font-size:12px;font-weight:600;color:#fff">MUDAH</div>
<div class="modeOpt" data-mode="medium" style="padding:11px 14px;font-size:12px;font-weight:600;color:#fff;border-top:1px solid rgba(255,255,255,.06)">NORMAL</div>
<div class="modeOpt" data-mode="hard" style="padding:11px 14px;font-size:12px;font-weight:600;color:#fff;border-top:1px solid rgba(255,255,255,.06)">SUSAH</div>
</div>
</div>
<button id="resetBtn" class="ctrlBtn" style="flex:1;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:#0f0f13;color:#fff;font-size:13px;font-weight:700;letter-spacing:.5px">RESET</button>
</div>
<div style="position:relative">
<div id="board" style="position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;aspect-ratio:1;z-index:1"></div>
<svg id="winLineSvg" viewBox="0 0 100 100" style="position:absolute;inset:0;pointer-events:none;z-index:2"></svg>
</div>
<div id="status" style="text-align:center;font-size:12px;color:rgba(255,255,255,.45);min-height:16px;margin-top:14px;font-weight:600;letter-spacing:.3px">GILIRAN KAMU</div>
</div></div>
<script>
const boardEl=document.getElementById('board'),statusEl=document.getElementById('status'),tallyEl=document.getElementById('tally'),resultLabelEl=document.getElementById('resultLabel'),cardEl=document.getElementById('card'),winLineSvg=document.getElementById('winLineSvg'),modeBtn=document.getElementById('modeBtn'),modeBtnLabel=document.getElementById('modeBtnLabel'),modeMenu=document.getElementById('modeMenu'),resetBtn=document.getElementById('resetBtn');
let board,mode='medium',active,tally={w:0,l:0,d:0};
const MODE_LABEL={easy:'MUDAH',medium:'NORMAL',hard:'SUSAH'};
let actx=null;
function ensureAudio(){if(actx)return actx;try{actx=new(window.AudioContext||window.webkitAudioContext)()}catch(e){actx=null}return actx}
function beep(freq,dur,type,vol){let ctx=ensureAudio();if(!ctx)return;try{if(ctx.state==='suspended')ctx.resume();let osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type||'square';osc.frequency.setValueAtTime(freq,ctx.currentTime);gain.gain.setValueAtTime(0,ctx.currentTime);gain.gain.linearRampToValueAtTime(vol||.12,ctx.currentTime+.01);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+dur);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+dur)}catch(e){}}
function sfxPlace(){beep(500,.07,'square',.08)}
function sfxWin(){beep(880,.12,'sine',.1);setTimeout(()=>beep(1100,.14,'sine',.1),100);setTimeout(()=>beep(1320,.16,'sine',.1),200)}
function sfxLose(){beep(200,.25,'sawtooth',.12)}
function sfxDraw(){beep(400,.15,'triangle',.09)}
function sfxClick(){beep(650,.04,'square',.05)}
const WIN_LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function checkWinner(b){
for(const[a,c,d]of WIN_LINES){if(b[a]&&b[a]===b[c]&&b[a]===b[d])return{winner:b[a],line:[a,c,d]}}
if(b.every(v=>v))return{winner:'draw',line:null};
return null
}
function emptyCells(b){return b.map((v,i)=>v?null:i).filter(v=>v!==null)}
function findWinMove(b,player){
for(const i of emptyCells(b)){b[i]=player;const w=checkWinner(b);b[i]=null;if(w&&w.winner===player)return i}
return -1
}
function minimax(b,isMax){
const w=checkWinner(b);
if(w){if(w.winner==='O')return 10;if(w.winner==='X')return -10;if(w.winner==='draw')return 0}
if(isMax){
let best=-Infinity;
for(const i of emptyCells(b)){b[i]='O';best=Math.max(best,minimax(b,false));b[i]=null}
return best
}else{
let best=Infinity;
for(const i of emptyCells(b)){b[i]='X';best=Math.min(best,minimax(b,true));b[i]=null}
return best
}
}
function hardMove(b){
let bestScore=-Infinity,move=emptyCells(b)[0];
for(const i of emptyCells(b)){b[i]='O';const score=minimax(b,false);b[i]=null;if(score>bestScore){bestScore=score;move=i}}
return move
}
function mediumMove(b){
let m=findWinMove(b,'O');
if(m>=0)return m;
m=findWinMove(b,'X');
if(m>=0)return m;
if(!b[4])return 4;
const corners=[0,2,6,8].filter(i=>!b[i]);
if(corners.length)return corners[Math.floor(Math.random()*corners.length)];
const cells=emptyCells(b);
return cells[Math.floor(Math.random()*cells.length)]
}
function easyMove(b){
const cells=emptyCells(b);
return cells[Math.floor(Math.random()*cells.length)]
}
function botMove(b){
if(mode==='hard')return hardMove(b);
if(mode==='medium')return mediumMove(b);
return easyMove(b)
}
function renderBoard(winLine){
boardEl.innerHTML='';
board.forEach((v,i)=>{
const cell=document.createElement('div');
cell.className='cellBox'+(v?(' m'+v):'')+((winLine&&winLine.includes(i))?' winCell':'');
cell.style.animationDelay=(i*0.03)+'s';
if(v)cell.innerHTML='<span class="markLetter '+(v==='X'?'markX':'markO')+'">'+v+'</span>';
if(!v&&active)cell.addEventListener('pointerdown',e=>{e.preventDefault();playerMove(i)});
boardEl.appendChild(cell)
})
}
function drawWinLine(line){
winLineSvg.innerHTML='';
if(!line)return;
const centers=line.map(i=>({x:(i%3)*33.34+16.66,y:Math.floor(i/3)*33.34+16.66}));
const[p1,,p3]=centers;
let dx=p3.x-p1.x,dy=p3.y-p1.y;const len=Math.sqrt(dx*dx+dy*dy)||1;const ux=dx/len,uy=dy/len,ext=10;
const sx=p1.x-ux*ext,sy=p1.y-uy*ext,ex=p3.x+ux*ext,ey=p3.y+uy*ext;
const totalLen=len+ext*2;
const lineEl=document.createElementNS('http://www.w3.org/2000/svg','line');
lineEl.setAttribute('x1',sx);lineEl.setAttribute('y1',sy);lineEl.setAttribute('x2',ex);lineEl.setAttribute('y2',ey);
lineEl.setAttribute('stroke','#fff');lineEl.setAttribute('stroke-width','3.2');lineEl.setAttribute('stroke-linecap','round');
lineEl.style.filter='drop-shadow(0 0 6px rgba(255,255,255,.95))';
lineEl.style.strokeDasharray=totalLen;lineEl.style.strokeDashoffset=totalLen;
lineEl.style.transition='stroke-dashoffset .4s ease .1s';
winLineSvg.appendChild(lineEl);
requestAnimationFrame(()=>{lineEl.style.strokeDashoffset=0})
}
function spawnConfetti(){
const colors=['#fff','#9d84ff','#ffbe5a','#78ffaa'];
for(let k=0;k<16;k++){
const c=document.createElement('div');
c.className='confetti';
c.style.left=(Math.random()*94)+'%';
c.style.top=(60+Math.random()*20)+'px';
c.style.background=colors[Math.floor(Math.random()*colors.length)];
c.style.animationDelay=(Math.random()*0.25)+'s';
c.style.animationDuration=(0.7+Math.random()*0.5)+'s';
cardEl.appendChild(c);
setTimeout(()=>c.remove(),1400)
}
}
function updateTally(){tallyEl.textContent=tally.w+'-'+tally.l+'-'+tally.d}
function setStatus(text){statusEl.style.opacity=0;setTimeout(()=>{statusEl.textContent=text;statusEl.style.opacity=1},120)}
function endGame(result,line){
active=false;
drawWinLine(line);
if(result==='X'){resultLabelEl.textContent='KAMU MENANG';setStatus('KAMU MENANG');tally.w++;sfxWin();spawnConfetti()}
else if(result==='O'){resultLabelEl.textContent='YOU LOSE';setStatus('BOT MENANG');tally.l++;sfxLose();cardEl.classList.add('shakeAnim');setTimeout(()=>cardEl.classList.remove('shakeAnim'),450)}
else{resultLabelEl.textContent='SERI';setStatus('SERI');tally.d++;sfxDraw()}
updateTally();
renderBoard(line)
}
function playerMove(i){
if(!active||board[i])return;
board[i]='X';
sfxPlace();
renderBoard();
const w=checkWinner(board);
if(w){endGame(w.winner,w.line);return}
setStatus('CPU SEDANG BERPIKIR...');
setTimeout(()=>{
const m=botMove(board);
board[m]='O';
sfxPlace();
renderBoard();
const w2=checkWinner(board);
if(w2){endGame(w2.winner,w2.line);return}
setStatus('GILIRAN KAMU')
},380)
}
function startGame(){
board=Array(9).fill(null);
active=true;
winLineSvg.innerHTML='';
setStatus('GILIRAN KAMU');
renderBoard();
updateTally()
}
function setMode(m){
mode=m;
modeBtnLabel.textContent=MODE_LABEL[m];
sfxClick();
startGame()
}
modeBtn.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();modeMenu.style.display=modeMenu.style.display==='block'?'none':'block'});
document.querySelectorAll('.modeOpt').forEach(opt=>{
opt.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();modeMenu.style.display='none';setMode(opt.dataset.mode)})
});
document.body.addEventListener('pointerdown',e=>{if(!modeBtn.contains(e.target))modeMenu.style.display='none'});
resetBtn.addEventListener('pointerdown',e=>{e.preventDefault();sfxClick();startGame()});
startGame();
</script></body>`;
    const section = AIRich.newLayout('Single', {
        __typename: 'GenAIaeacdsnwHtmlPrimitive',
        payload: htmlPayload,
        trusted_sources: ["nixel.dev"]
    });
    const submessage = [{
        messageType: 2,
        messageText: "Tic Tac Toe vs Bot"
    }];
    const msg = new AIRich(conn);
    msg._addContent(section, submessage);
    await msg.send(m.chat, { quoted: m });
}
handler.command = /^(tictactoe|ttt)$/i;
handler.help = ['tictactoe / ttt'];
handler.tags = ['games'];
