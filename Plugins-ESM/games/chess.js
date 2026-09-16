//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import { AIRich } from '../../Library/MessageBuilder.js';
export default async function handler(m, { conn }) {
    const htmlPayload = `<style>
:root{
  --felt:#14231a;
  --felt-2:#1b2f22;
  --ivory:#efe7d8;
  --walnut:#7c4a32;
  --walnut-dark:#5e3722;
  --brass:#c7a452;
  --brass-dim:#8a7038;
  --cream:#f3eee3;
  --sage:#9fb3a0;
  --warn:#c25b4a;
  --white-piece:#f7f2e7;
  --black-piece:#1b120b;
}
*{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;box-sizing:border-box}
.lvlBtn{transition:transform .12s,background .12s}
.lvlBtn:active{transform:scale(.97)}
.promoBtn{transition:transform .1s}
.promoBtn:active{transform:scale(.9)}
.ctrlBtn{transition:transform .12s}
.ctrlBtn:active{transform:scale(.95)}
#board{width:100%;aspect-ratio:1/1;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);border:3px solid var(--walnut-dark);border-radius:6px;overflow:hidden;box-shadow:0 14px 30px -14px rgba(0,0,0,.6)}
.sq{position:relative;display:flex;align-items:center;justify-content:center}
.sq.light{background:var(--ivory)}
.sq.dark{background:var(--walnut)}
.sq .ov{position:absolute;inset:0}
.sq.lastmove .ov{background:rgba(199,164,82,.28)}
.sq.checksq .ov{background:rgba(194,91,74,.55)}
.sq.selected .ov{box-shadow:inset 0 0 0 3px var(--brass)}
.sq .piece{position:relative;z-index:2;font-size:calc(var(--cell,40px)*1.02);line-height:1;font-family:"Segoe UI Symbol",Arial,sans-serif;pointer-events:none}
.sq .piece.wpc{color:var(--white-piece);text-shadow:0 1px 0 rgba(0,0,0,.55),0 0 3px rgba(0,0,0,.35)}
.sq .piece.bpc{color:var(--black-piece);text-shadow:0 1px 0 rgba(255,255,255,.18)}
.sq .dot{position:absolute;width:calc(var(--cell,40px)*.3);height:calc(var(--cell,40px)*.3);border-radius:50%;background:rgba(199,164,82,.55);z-index:1}
.sq .ring{position:absolute;width:calc(var(--cell,40px)*.86);height:calc(var(--cell,40px)*.86);border-radius:50%;border:3px solid rgba(199,164,82,.65);box-sizing:border-box;z-index:1}
#boardOverlay{display:none;position:absolute;inset:0;background:rgba(20,35,26,.85);z-index:20;flex-direction:column;align-items:center;justify-content:center;border-radius:6px}
#boardOverlay .t{color:var(--brass);font-weight:700;font-size:22px;font-family:Georgia,"Iowan Old Style",Palatino,"Palatino Linotype",serif;letter-spacing:.3px}
#boardOverlay .s{color:var(--cream);font-size:13px;margin-top:8px}
</style>
<body style="margin:0;background:transparent;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:var(--cream);touch-action:manipulation">
<div style="width:100%;max-width:440px;margin:auto;padding:10px">
<div id="card" style="background:radial-gradient(ellipse at 50% -20%,var(--felt-2),var(--felt) 65%);border:1px solid var(--brass-dim);border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.5)">
<div style="padding:12px 16px 8px;border-bottom:1px solid rgba(199,164,82,.18)">
<div style="font-size:9px;letter-spacing:2px;color:var(--sage);font-weight:600">AL GAMES</div>
<div style="font-size:19px;font-weight:700;color:var(--cream);margin-top:1px;letter-spacing:.2px;font-family:Georgia,'Iowan Old Style',Palatino,'Palatino Linotype',serif">Catur</div>
</div>
<div id="menu" style="padding:14px">
<div style="font-size:11px;color:var(--sage);text-align:center;margin-bottom:10px;letter-spacing:.2px">PILIH LEVEL BOT</div>
<div id="lvlList" style="display:flex;flex-direction:column;gap:6px"></div>
</div>
<div id="game" style="display:none;padding:10px 12px 12px">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
<div style="display:flex;align-items:center;gap:6px"><span id="lvlDot" style="width:7px;height:7px;border-radius:50%;display:inline-block"></span><span id="lvlLabel" style="font-size:11px;color:var(--sage);font-weight:600"></span></div>
<div id="turnTag" style="font-size:10px;color:var(--sage)">Putih jalan</div>
</div>
<div id="boardWrap" style="position:relative;width:100%">
<div id="board"></div>
<div id="boardOverlay"><div class="t" id="boardOverlayTitle"></div><div class="s" id="boardOverlaySub"></div></div>
<div id="promoBox" style="display:none;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--felt);border:1px solid var(--brass-dim);border-radius:14px;padding:14px;box-shadow:0 10px 30px rgba(0,0,0,.5)">
<div style="font-size:11px;color:var(--sage);text-align:center;margin-bottom:8px">Promosi ke?</div>
<div style="display:flex;gap:6px">
<button class="promoBtn" data-p="Q" style="width:44px;height:44px;font-size:26px;border-radius:8px;border:1px solid var(--brass-dim);background:rgba(199,164,82,.12);color:var(--cream)">♕</button>
<button class="promoBtn" data-p="R" style="width:44px;height:44px;font-size:26px;border-radius:8px;border:1px solid var(--brass-dim);background:rgba(199,164,82,.12);color:var(--cream)">♖</button>
<button class="promoBtn" data-p="B" style="width:44px;height:44px;font-size:26px;border-radius:8px;border:1px solid var(--brass-dim);background:rgba(199,164,82,.12);color:var(--cream)">♗</button>
<button class="promoBtn" data-p="N" style="width:44px;height:44px;font-size:26px;border-radius:8px;border:1px solid var(--brass-dim);background:rgba(199,164,82,.12);color:var(--cream)">♘</button>
</div>
</div>
</div>
<div id="status" style="text-align:center;font-size:12px;color:var(--brass);min-height:16px;margin:6px 0;font-weight:600">Giliran kamu (Putih)</div>
<div style="display:flex;gap:6px">
<button id="restartBtn" class="ctrlBtn" style="flex:1;padding:9px;border-radius:10px;border:1px solid var(--brass-dim);background:transparent;color:var(--cream);font-size:11px;font-weight:700;letter-spacing:.2px">MAIN LAGI</button>
<button id="changeLvlBtn" class="ctrlBtn" style="flex:1;padding:9px;border-radius:10px;border:1px solid var(--brass-dim);background:transparent;color:var(--cream);font-size:11px;font-weight:700;letter-spacing:.2px">GANTI LEVEL</button>
</div>
</div>
</div></div>
<script>
/* ===== Mesin Catur (aturan lengkap, tervalidasi via perft) ===== */
function inBounds(r,c){return r>=0&&r<8&&c>=0&&c<8}
const knightOffsets=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
const kingOffsets=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
const bishopDirs=[[-1,-1],[-1,1],[1,-1],[1,1]];
const rookDirs=[[-1,0],[1,0],[0,-1],[0,1]];
function initialState(){
const b=('rnbqkbnr'+'pppppppp'+'........'+'........'+'........'+'........'+'PPPPPPPP'+'RNBQKBNR').split('');
return {board:b,turn:'w',castle:{wK:true,wQ:true,bK:true,bQ:true},ep:-1,halfmove:0};
}
function cloneState(s){return {board:s.board.slice(),turn:s.turn,castle:Object.assign({},s.castle),ep:s.ep,halfmove:s.halfmove}}
function isWhitePiece(p){return p!=='.'&&p===p.toUpperCase()}
function isBlackPiece(p){return p!=='.'&&p===p.toLowerCase()}
function isEnemy(p,white){return p!=='.'&&(white?isBlackPiece(p):isWhitePiece(p))}
function isAttacked(board,r,c,bySide){
const pawnDR=bySide==='w'?1:-1;
const enemyPawn=bySide==='w'?'P':'p';
for(const dc of [-1,1]){const pr=r+pawnDR,pc=c+dc;if(inBounds(pr,pc)&&board[pr*8+pc]===enemyPawn)return true}
const knight=bySide==='w'?'N':'n';
for(const o of knightOffsets){const nr=r+o[0],nc=c+o[1];if(inBounds(nr,nc)&&board[nr*8+nc]===knight)return true}
const king=bySide==='w'?'K':'k';
for(const o of kingOffsets){const nr=r+o[0],nc=c+o[1];if(inBounds(nr,nc)&&board[nr*8+nc]===king)return true}
const bishopP=bySide==='w'?'B':'b',queenP=bySide==='w'?'Q':'q',rookP=bySide==='w'?'R':'r';
for(const d of bishopDirs){let nr=r+d[0],nc=c+d[1];while(inBounds(nr,nc)){const t=board[nr*8+nc];if(t!=='.'){if(t===bishopP||t===queenP)return true;break}nr+=d[0];nc+=d[1]}}
for(const d of rookDirs){let nr=r+d[0],nc=c+d[1];while(inBounds(nr,nc)){const t=board[nr*8+nc];if(t!=='.'){if(t===rookP||t===queenP)return true;break}nr+=d[0];nc+=d[1]}}
return false
}
function findKing(board,side){const k=side==='w'?'K':'k';for(let i=0;i<64;i++)if(board[i]===k)return i;return -1}
function pseudoMoves(state){
const board=state.board,white=state.turn==='w',moves=[];
for(let idx=0;idx<64;idx++){
const p=board[idx];
if(p==='.')continue;
if(isWhitePiece(p)!==white)continue;
const r=Math.floor(idx/8),c=idx%8,type=p.toUpperCase();
if(type==='P'){
const dir=white?-1:1,startRow=white?6:1,promoRow=white?0:7;
const oneR=r+dir;
if(inBounds(oneR,c)&&board[oneR*8+c]==='.'){
if(oneR===promoRow)moves.push({from:idx,to:oneR*8+c,promotion:'Q',isEnPassant:false,castle:null,captured:null});
else moves.push({from:idx,to:oneR*8+c,promotion:null,isEnPassant:false,castle:null,captured:null});
const twoR=r+2*dir;
if(r===startRow&&board[twoR*8+c]==='.')moves.push({from:idx,to:twoR*8+c,promotion:null,isEnPassant:false,castle:null,captured:null});
}
for(const dc of [-1,1]){
const nr=r+dir,nc=c+dc;
if(!inBounds(nr,nc))continue;
const t=board[nr*8+nc];
if(t!=='.'&&isEnemy(t,white)){
if(nr===promoRow)moves.push({from:idx,to:nr*8+nc,promotion:'Q',isEnPassant:false,castle:null,captured:t});
else moves.push({from:idx,to:nr*8+nc,promotion:null,isEnPassant:false,castle:null,captured:t});
}else if((nr*8+nc)===state.ep){
moves.push({from:idx,to:nr*8+nc,promotion:null,isEnPassant:true,castle:null,captured:white?'p':'P'});
}
}
}else if(type==='N'){
for(const o of knightOffsets){
const nr=r+o[0],nc=c+o[1];
if(!inBounds(nr,nc))continue;
const t=board[nr*8+nc];
if(t==='.'||isEnemy(t,white))moves.push({from:idx,to:nr*8+nc,promotion:null,isEnPassant:false,castle:null,captured:t==='.'?null:t});
}
}else if(type==='K'){
for(const o of kingOffsets){
const nr=r+o[0],nc=c+o[1];
if(!inBounds(nr,nc))continue;
const t=board[nr*8+nc];
if(t==='.'||isEnemy(t,white))moves.push({from:idx,to:nr*8+nc,promotion:null,isEnPassant:false,castle:null,captured:t==='.'?null:t});
}
const rank=white?7:0,enemy=white?'b':'w';
const kRights=white?state.castle.wK:state.castle.bK,qRights=white?state.castle.wQ:state.castle.bQ;
if(idx===rank*8+4){
if(kRights&&board[rank*8+5]==='.'&&board[rank*8+6]==='.'&&board[rank*8+7]===(white?'R':'r')){
if(!isAttacked(board,rank,4,enemy)&&!isAttacked(board,rank,5,enemy)&&!isAttacked(board,rank,6,enemy))moves.push({from:idx,to:rank*8+6,promotion:null,isEnPassant:false,castle:'K',captured:null});
}
if(qRights&&board[rank*8+3]==='.'&&board[rank*8+2]==='.'&&board[rank*8+1]==='.'&&board[rank*8+0]===(white?'R':'r')){
if(!isAttacked(board,rank,4,enemy)&&!isAttacked(board,rank,3,enemy)&&!isAttacked(board,rank,2,enemy))moves.push({from:idx,to:rank*8+2,promotion:null,isEnPassant:false,castle:'Q',captured:null});
}
}
}else{
const dirs=type==='B'?bishopDirs:type==='R'?rookDirs:bishopDirs.concat(rookDirs);
for(const d of dirs){
let nr=r+d[0],nc=c+d[1];
while(inBounds(nr,nc)){
const t=board[nr*8+nc];
if(t==='.'){moves.push({from:idx,to:nr*8+nc,promotion:null,isEnPassant:false,castle:null,captured:null})}
else{if(isEnemy(t,white))moves.push({from:idx,to:nr*8+nc,promotion:null,isEnPassant:false,castle:null,captured:t});break}
nr+=d[0];nc+=d[1]
}
}
}
}
return moves
}
function applyMove(state,move){
const ns=cloneState(state),board=ns.board;
const from=move.from,to=move.to,promotion=move.promotion,isEnPassant=move.isEnPassant,castle=move.castle;
const piece=board[from],isPawn=piece.toUpperCase()==='P';
let newEp=-1;
if(isEnPassant){const capIdx=Math.floor(from/8)*8+(to%8);board[capIdx]='.'}
board[to]=piece;board[from]='.';
if(promotion)board[to]=state.turn==='w'?promotion.toUpperCase():promotion.toLowerCase();
if(castle==='K'){const rank=state.turn==='w'?7:0;board[rank*8+5]=board[rank*8+7];board[rank*8+7]='.'}
else if(castle==='Q'){const rank=state.turn==='w'?7:0;board[rank*8+3]=board[rank*8+0];board[rank*8+0]='.'}
if(isPawn&&Math.abs(Math.floor(to/8)-Math.floor(from/8))===2)newEp=(from+to)/2;
if(piece==='K'){ns.castle.wK=false;ns.castle.wQ=false}
if(piece==='k'){ns.castle.bK=false;ns.castle.bQ=false}
if(from===56||to===56)ns.castle.wQ=false;
if(from===63||to===63)ns.castle.wK=false;
if(from===0||to===0)ns.castle.bQ=false;
if(from===7||to===7)ns.castle.bK=false;
ns.halfmove=(isPawn||move.captured)?0:(state.halfmove+1);
ns.ep=newEp;
ns.turn=state.turn==='w'?'b':'w';
return ns
}
function legalMoves(state){
const pseudo=pseudoMoves(state),legal=[];
for(const mv of pseudo){
const ns=applyMove(state,mv);
const kIdx=findKing(ns.board,state.turn);
if(kIdx===-1)continue;
if(!isAttacked(ns.board,Math.floor(kIdx/8),kIdx%8,state.turn==='w'?'b':'w'))legal.push(mv)
}
return legal
}
function inCheck(state,side){
const kIdx=findKing(state.board,side);
if(kIdx===-1)return false;
return isAttacked(state.board,Math.floor(kIdx/8),kIdx%8,side==='w'?'b':'w')
}
function insufficientMaterial(board){
let pieces=[];
for(let i=0;i<64;i++){const p=board[i];if(p!=='.'&&p.toUpperCase()!=='K')pieces.push(p.toUpperCase())}
if(pieces.length===0)return true;
if(pieces.length===1&&(pieces[0]==='B'||pieces[0]==='N'))return true;
return false
}
/* ===== AI: negamax + alpha-beta + quiescence + PST eval ===== */
const PAWN_PST=[0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,25,25,10,5,5,0,0,0,20,20,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-20,-20,10,10,5,0,0,0,0,0,0,0,0];
const KNIGHT_PST=[-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50];
const BISHOP_PST=[-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,10,10,5,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20];
const ROOK_PST=[0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0];
const QUEEN_PST=[-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20];
const KING_PST=[-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20];
const PST={P:PAWN_PST,N:KNIGHT_PST,B:BISHOP_PST,R:ROOK_PST,Q:QUEEN_PST,K:KING_PST};
const VAL={P:100,N:320,B:330,R:500,Q:900,K:0};
function evalMaterial(board){
let score=0;
for(let i=0;i<64;i++){
const p=board[i];
if(p==='.')continue;
const type=p.toUpperCase(),white=p===type;
const pstIdx=white?i:(7-Math.floor(i/8))*8+(i%8);
const v=VAL[type]+PST[type][pstIdx];
score+=white?v:-v
}
return score
}
function evalRel(state){return (state.turn==='w'?1:-1)*evalMaterial(state.board)}
let nodeCount=0;
const NODE_LIMIT=150000;
function AbortSearch(){}
AbortSearch.prototype=Object.create(Error.prototype);
function orderMoves(moves){return moves.sort((a,b)=>{const av=a.captured?(VAL[a.captured.toUpperCase()]||0):0,bv=b.captured?(VAL[b.captured.toUpperCase()]||0):0;return bv-av})}
function quiesce(state,alpha,beta,qdepth){
nodeCount++;if(nodeCount>NODE_LIMIT)throw new AbortSearch();
const standPat=evalRel(state);
if(standPat>=beta)return beta;
if(alpha<standPat)alpha=standPat;
if(qdepth<=0)return alpha;
const moves=orderMoves(legalMoves(state).filter(m=>m.captured));
for(const mv of moves){
const ns=applyMove(state,mv);
const score=-quiesce(ns,-beta,-alpha,qdepth-1);
if(score>=beta)return beta;
if(score>alpha)alpha=score
}
return alpha
}
function negamax(state,depth,alpha,beta,qdepth){
nodeCount++;if(nodeCount>NODE_LIMIT)throw new AbortSearch();
const moves=legalMoves(state);
if(moves.length===0){
if(inCheck(state,state.turn))return -100000+(10-depth);
return 0
}
if(depth===0)return qdepth>0?quiesce(state,alpha,beta,qdepth):evalRel(state);
orderMoves(moves);
let best=-Infinity;
for(const mv of moves){
const ns=applyMove(state,mv);
const score=-negamax(ns,depth-1,-beta,-alpha,qdepth);
if(score>best)best=score;
if(best>alpha)alpha=best;
if(alpha>=beta)break
}
return best
}
function findBestMove(state,lvl){
nodeCount=0;
const moves=orderMoves(legalMoves(state));
if(!moves.length)return null;
if(Math.random()<lvl.blunder)return moves[Math.floor(Math.random()*moves.length)];
const scored=[];
try{
for(const mv of moves){
const ns=applyMove(state,mv);
const score=-negamax(ns,lvl.depth-1,-Infinity,Infinity,lvl.qdepth);
scored.push({mv:mv,score:score})
}
}catch(e){}
if(!scored.length)return moves[0];
scored.sort((a,b)=>b.score-a.score);
const topN=Math.min(lvl.randomTop,scored.length);
return scored[Math.floor(Math.random()*topN)].mv
}
/* ===== UI ===== */
const LEVELS=[
{name:'Pemula',elo:800,depth:1,qdepth:0,blunder:.35,randomTop:5,color:'#8c93ff'},
{name:'Amatir',elo:1200,depth:2,qdepth:1,blunder:.15,randomTop:3,color:'#5ecf8f'},
{name:'Menengah',elo:1600,depth:3,qdepth:2,blunder:.06,randomTop:2,color:'#ffbe5a'},
{name:'Mahir',elo:2000,depth:3,qdepth:3,blunder:.02,randomTop:1,color:'#ff8c5a'},
{name:'Master',elo:2400,depth:4,qdepth:3,blunder:0,randomTop:1,color:'#ff6b6b'}
];
const menuEl=document.getElementById('menu'),gameEl=document.getElementById('game'),lvlListEl=document.getElementById('lvlList'),lvlDot=document.getElementById('lvlDot'),lvlLabel=document.getElementById('lvlLabel'),turnTag=document.getElementById('turnTag'),statusEl=document.getElementById('status'),promoBox=document.getElementById('promoBox'),restartBtn=document.getElementById('restartBtn'),changeLvlBtn=document.getElementById('changeLvlBtn');
const boardEl=document.getElementById('board'),boardWrapEl=document.getElementById('boardWrap'),boardOverlayEl=document.getElementById('boardOverlay'),boardOverlayTitleEl=document.getElementById('boardOverlayTitle'),boardOverlaySubEl=document.getElementById('boardOverlaySub');
let sqEls=[];
LEVELS.forEach((lvl,i)=>{
const btn=document.createElement('button');
btn.className='lvlBtn';
btn.dataset.i=i;
btn.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-radius:12px;border:1px solid '+lvl.color+'40;background:'+lvl.color+'14;color:#fff';
btn.innerHTML='<span style="display:flex;align-items:center;gap:8px"><span style="width:8px;height:8px;border-radius:50%;background:'+lvl.color+'"></span><span style="font-size:13px;font-weight:600">'+lvl.name+'</span></span><span style="font-size:11px;color:rgba(255,255,255,.5)">~'+lvl.elo+' elo</span>';
lvlListEl.appendChild(btn)
});
let actx=null;
function ensureAudio(){if(actx)return actx;try{actx=new(window.AudioContext||window.webkitAudioContext)()}catch(e){actx=null}return actx}
function beep(freq,dur,type,vol){let ctx=ensureAudio();if(!ctx)return;try{if(ctx.state==='suspended')ctx.resume();let osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type||'sine';osc.frequency.setValueAtTime(freq,ctx.currentTime);gain.gain.setValueAtTime(0,ctx.currentTime);gain.gain.linearRampToValueAtTime(vol||.1,ctx.currentTime+.01);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+dur);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+dur)}catch(e){}}
function sfxSelect(){beep(520,.04,'square',.05)}
function sfxMove(){beep(340,.07,'sine',.08)}
function sfxCapture(){beep(220,.09,'square',.09)}
function sfxCheck(){beep(700,.1,'triangle',.09);setTimeout(()=>beep(880,.08,'triangle',.08),80)}
function sfxCheckmate(){beep(200,.25,'sawtooth',.12);setTimeout(()=>beep(150,.3,'sawtooth',.11),150)}
function sfxDraw(){beep(400,.15,'triangle',.08)}
let state,currentLevel=0,selectedIdx=-1,legalTargets=[],lastMove=null,gameOver=false,pendingPromotion=null,botThinking=false,overlayInfo=null;
const WHITE_GLYPH={P:'♙',N:'♘',B:'♗',R:'♖',Q:'♕',K:'♔'};
const BLACK_GLYPH={P:'♟',N:'♞',B:'♝',R:'♜',Q:'♛',K:'♚'};
function updateCellSize(){
boardEl.style.setProperty('--cell',(boardEl.clientWidth/8)+'px')
}
function buildBoard(){
boardEl.innerHTML='';
sqEls=[];
for(let r=0;r<8;r++){
for(let c=0;c<8;c++){
const idx=r*8+c,light=(r+c)%2===0;
const sq=document.createElement('div');
sq.className='sq '+(light?'light':'dark');
sq.dataset.idx=idx;
sq.innerHTML='<div class="ov"></div>';
sq.addEventListener('pointerdown',onSquareTap);
boardEl.appendChild(sq);
sqEls.push(sq)
}
}
updateCellSize();
try{new ResizeObserver(updateCellSize).observe(boardEl)}catch(e){window.addEventListener('resize',updateCellSize)}
}
function renderBoard(){
sqEls.forEach(sq=>{
sq.classList.remove('lastmove','checksq','selected');
const extra=sq.querySelectorAll('.dot,.ring,.piece');
extra.forEach(el=>el.remove())
});
if(lastMove){
sqEls[lastMove.from].classList.add('lastmove');
sqEls[lastMove.to].classList.add('lastmove')
}
if(state){
const kIdx=findKing(state.board,state.turn);
if(kIdx>=0&&inCheck(state,state.turn))sqEls[kIdx].classList.add('checksq')
}
if(selectedIdx>=0)sqEls[selectedIdx].classList.add('selected');
legalTargets.forEach(mv=>{
const el=document.createElement('div');
el.className=mv.captured?'ring':'dot';
sqEls[mv.to].appendChild(el)
});
if(state){
for(let i=0;i<64;i++){
const p=state.board[i];
if(p==='.')continue;
const white=isWhitePiece(p),glyph=white?WHITE_GLYPH[p.toUpperCase()]:BLACK_GLYPH[p.toUpperCase()];
const el=document.createElement('span');
el.className='piece '+(white?'wpc':'bpc');
el.textContent=glyph;
sqEls[i].appendChild(el)
}
}
if(overlayInfo){
boardOverlayTitleEl.textContent=overlayInfo.title;
boardOverlaySubEl.textContent=overlayInfo.sub;
boardOverlayEl.style.display='flex'
}else{
boardOverlayEl.style.display='none'
}
}
function computeLegalTargets(){
legalTargets=legalMoves(state).filter(mv=>mv.from===selectedIdx)
}
function showOverlay(title,sub){overlayInfo={title:title,sub:sub}}
function checkGameEnd(){
const moves=legalMoves(state);
if(moves.length===0){
gameOver=true;
if(inCheck(state,state.turn)){
const humanWon=state.turn==='b';
statusEl.textContent=humanWon?'Skakmat! Kamu menang.':'Skakmat! Bot menang.';
showOverlay('SKAKMAT',humanWon?'Kamu menang!':'Bot menang');
sfxCheckmate()
}else{
statusEl.textContent='Remis - buntu (stalemate).';
showOverlay('SERI','Stalemate');
sfxDraw()
}
return true
}
if(state.halfmove>=100){gameOver=true;statusEl.textContent='Remis - 50 langkah tanpa kemajuan.';showOverlay('SERI','Aturan 50 langkah');sfxDraw();return true}
if(insufficientMaterial(state.board)){gameOver=true;statusEl.textContent='Remis - materi tidak cukup.';showOverlay('SERI','Materi tidak cukup');sfxDraw();return true}
return false
}
function scheduleBotMove(){
botThinking=true;
statusEl.textContent='Bot berpikir...';
turnTag.textContent='Giliran Bot';
setTimeout(()=>{
const lvl=LEVELS[currentLevel];
const mv=findBestMove(state,lvl);
botThinking=false;
if(mv)executeMove(mv)
},280)
}
function executeMove(mv){
const wasCapture=!!mv.captured;
state=applyMove(state,mv);
lastMove={from:mv.from,to:mv.to};
selectedIdx=-1;legalTargets=[];pendingPromotion=null;
promoBox.style.display='none';
const over=checkGameEnd();
if(!over){
const chk=inCheck(state,state.turn);
const humanTurn=state.turn==='w';
turnTag.textContent=humanTurn?'Giliranmu':'Giliran Bot';
if(wasCapture)sfxCapture();else sfxMove();
if(chk){statusEl.textContent=(humanTurn?'Giliran kamu':'Giliran Bot')+' - Skak!';sfxCheck()}
else statusEl.textContent=humanTurn?'Giliran kamu (Putih)':'Bot berpikir...'
}
renderBoard();
if(!over&&state.turn==='b')scheduleBotMove()
}
function positionPromoBox(idx){
const cellRect=sqEls[idx].getBoundingClientRect();
const wrapRect=boardWrapEl.getBoundingClientRect();
const cx=cellRect.left-wrapRect.left+cellRect.width/2;
const cy=cellRect.top-wrapRect.top+cellRect.height/2;
promoBox.style.left=Math.min(Math.max((cx/wrapRect.width)*100,20),80)+'%';
promoBox.style.top=Math.min(Math.max((cy/wrapRect.height)*100,20),80)+'%'
}
function onSquareTap(e){
e.preventDefault();
if(gameOver||botThinking||pendingPromotion||!state||state.turn!=='w')return;
const idx=parseInt(e.currentTarget.dataset.idx,10);
const piece=state.board[idx];
if(selectedIdx===-1){
if(piece!=='.'&&isWhitePiece(piece)){selectedIdx=idx;computeLegalTargets();sfxSelect();renderBoard()}
return
}
if(idx===selectedIdx){selectedIdx=-1;legalTargets=[];renderBoard();return}
const mv=legalTargets.find(t=>t.to===idx);
if(mv){
if(mv.promotion){
pendingPromotion=mv;
positionPromoBox(idx);
promoBox.style.display='block';
return
}
executeMove(mv);
return
}
if(piece!=='.'&&isWhitePiece(piece)){selectedIdx=idx;computeLegalTargets();sfxSelect();renderBoard();return}
selectedIdx=-1;legalTargets=[];renderBoard()
}
document.querySelectorAll('.promoBtn').forEach(btn=>{
btn.addEventListener('pointerdown',e=>{
e.preventDefault();
if(!pendingPromotion)return;
pendingPromotion.promotion=btn.dataset.p;
const mv=pendingPromotion;
pendingPromotion=null;
promoBox.style.display='none';
executeMove(mv)
})
});
function startGame(levelIdx){
currentLevel=levelIdx;
const lvl=LEVELS[levelIdx];
state=initialState();
selectedIdx=-1;legalTargets=[];lastMove=null;gameOver=false;pendingPromotion=null;botThinking=false;overlayInfo=null;
promoBox.style.display='none';
lvlDot.style.background=lvl.color;
lvlLabel.textContent=lvl.name+' ~'+lvl.elo;
turnTag.textContent='Giliranmu';
statusEl.textContent='Giliran kamu (Putih)';
menuEl.style.display='none';
gameEl.style.display='block';
if(!sqEls.length)buildBoard();
updateCellSize();
renderBoard()
}
lvlListEl.querySelectorAll('.lvlBtn').forEach(btn=>{
btn.addEventListener('pointerdown',e=>{e.preventDefault();startGame(parseInt(btn.dataset.i,10))})
});
restartBtn.addEventListener('pointerdown',e=>{e.preventDefault();startGame(currentLevel)});
changeLvlBtn.addEventListener('pointerdown',e=>{e.preventDefault();gameEl.style.display='none';menuEl.style.display='block'});
</script></body>`;
    const section = AIRich.newLayout('Single', {
        __typename: 'GenAIaeacdsnwHtmlPrimitive',
        payload: htmlPayload,
        trusted_sources: ["nixel.dev"]
    });
    const submessage = [{
        messageType: 2,
        messageText: "Catur - Pilih level bot dulu"
    }];
    const msg = new AIRich(conn);
    msg._addContent(section, submessage);
    await msg.send(m.chat, { quoted: m });
}
handler.command = /^(chess|catur)$/i;
handler.help = ['chess / catur'];
handler.tags = ['games'];
