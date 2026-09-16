//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import { AIRich } from '../../Library/MessageBuilder.js';
export default async function handler(m, { conn }) {
    const htmlPayload = `<style>*{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}</style>
<body style="margin:0;background:transparent;font-family:Arial,sans-serif;color:#eee;touch-action:manipulation;cursor:pointer">
<div style="width:100%;max-width:620px;margin:auto;padding:16px;box-sizing:border-box">
<div id="card" style="background:rgba(255,255,255,.06);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.15);border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.35);transition:background .6s">
<div style="padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.12);display:flex;justify-content:space-between;align-items:center">
<div><div style="font-size:11px;letter-spacing:1.5px;color:rgba(255,255,255,.45)">AL DINO</div><div style="font-size:21px;font-weight:bold;color:#fff">Dino Runner</div></div>
<div style="text-align:right"><div id="score" style="font-size:18px;font-weight:bold;color:#fff;font-family:'Courier New',monospace;letter-spacing:2px;text-shadow:0 0 10px rgba(108,92,231,.85);transition:transform .15s">00000</div><div id="best" style="font-size:10px;color:rgba(255,255,255,.4);margin-top:2px;font-family:'Courier New',monospace">BEST 00000</div></div>
</div>
<div style="padding:18px">
<canvas id="game" width="560" height="190" style="width:100%;height:auto;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.12);border-radius:12px;display:block;transition:filter .6s"></canvas>
<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
<div id="status" style="font-size:12px;color:rgba(255,255,255,.55)">Speed 5.0x</div>
<button id="duckBtn" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#eee;font-size:11px;padding:6px 14px;border-radius:20px;cursor:pointer">⬇ TAHAN NUNDUK</button>
</div>
</div></div></div>
<script>
const c=document.getElementById('game'),x=c.getContext('2d'),scoreEl=document.getElementById('score'),bestEl=document.getElementById('best'),statusEl=document.getElementById('status'),card=document.getElementById('card'),duckBtn=document.getElementById('duckBtn');
const GY=170;
let d,o,clouds,particles,ambient,trail,dashes,score,best=0,speed,gameOver,last,shake,flash,runT,spawnTimer,milestone,squash,ducking,night,nightMilestone;
let actx=null;
function ensureAudio(){
if(actx)return actx;
try{actx=new(window.AudioContext||window.webkitAudioContext)()}catch(e){actx=null}
return actx
}
function beep(freq,dur,type,vol){
let ctx=ensureAudio();
if(!ctx)return;
try{
if(ctx.state==='suspended')ctx.resume();
let osc=ctx.createOscillator(),gain=ctx.createGain();
osc.type=type||'square';
osc.frequency.setValueAtTime(freq,ctx.currentTime);
gain.gain.setValueAtTime(0,ctx.currentTime);
gain.gain.linearRampToValueAtTime(vol||.12,ctx.currentTime+.01);
gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+dur);
osc.connect(gain);gain.connect(ctx.destination);
osc.start();
osc.stop(ctx.currentTime+dur)
}catch(e){}
}
function sfxJump(){beep(720,.12,'square',.1)}
function sfxScore(){beep(1040,.09,'sine',.09);setTimeout(()=>beep(1320,.09,'sine',.08),70)}
function sfxDie(){
beep(220,.28,'sawtooth',.14);
setTimeout(()=>beep(140,.32,'sawtooth',.13),110)
}
function loadBest(){
let vals=[];
try{let v=localStorage.getItem('dino_best');if(v)vals.push(parseInt(v,10))}catch(e){}
try{let v=sessionStorage.getItem('dino_best');if(v)vals.push(parseInt(v,10))}catch(e){}
try{let m=document.cookie.match(/(?:^|;\\s*)dino_best=(\\d+)/);if(m)vals.push(parseInt(m[1],10))}catch(e){}
return vals.length?Math.max(...vals.filter(v=>!isNaN(v))):0
}
function saveBest(v){
let val=String(Math.floor(v));
try{localStorage.setItem('dino_best',val)}catch(e){}
try{sessionStorage.setItem('dino_best',val)}catch(e){}
try{document.cookie='dino_best='+val+';max-age=31536000;path=/'}catch(e){}
try{
let rq=indexedDB.open('dino_db',1);
rq.onupgradeneeded=()=>{rq.result.createObjectStore('kv')};
rq.onsuccess=()=>{try{rq.result.transaction('kv','readwrite').objectStore('kv').put(val,'dino_best')}catch(e){}}
}catch(e){}
}
function loadBestAsync(cb){
try{
let rq=indexedDB.open('dino_db',1);
rq.onupgradeneeded=()=>{rq.result.createObjectStore('kv')};
rq.onsuccess=()=>{
try{
let gr=rq.result.transaction('kv','readonly').objectStore('kv').get('dino_best');
gr.onsuccess=()=>{if(gr.result)cb(parseInt(gr.result,10))}
}catch(e){}
}
}catch(e){}
}
best=loadBest();
loadBestAsync(v=>{if(!isNaN(v)&&v>best){best=v;bestEl.textContent='BEST '+String(Math.floor(best)).padStart(5,'0')}});
const STAND_H=30,DUCK_H=17;
function setNight(on){
night=on;
if(night){
card.style.background='rgba(20,20,35,.55)';
c.style.filter='invert(0.92) hue-rotate(180deg)'
}else{
card.style.background='rgba(255,255,255,.06)';
c.style.filter='none'
}
}
function reset(){
d={x:55,y:132,w:27,h:STAND_H,vy:0,jumping:false};
o=[];
clouds=[{x:120,y:32,w:44,s:.35},{x:300,y:52,w:60,s:.22},{x:460,y:26,w:36,s:.4},{x:560,y:70,w:50,s:.18}];
particles=[];
trail=[];
if(!ambient){ambient=[];for(let i=0;i<18;i++)ambient.push({x:Math.random()*c.width,y:Math.random()*c.height,r:.5+Math.random()*1.5,vx:.1+Math.random()*.3,ph:Math.random()*10})}
if(!dashes){dashes=[];for(let i=0;i<40;i++)dashes.push({x:Math.random()*c.width,w:3+Math.random()*7,gap:Math.random()<.3})}
score=0;speed=5;gameOver=false;last=0;shake=0;flash=0;runT=0;milestone=0;squash=1;ducking=false;nightMilestone=0;
setNight(false);
spawnTimer=70+Math.random()*30;
bestEl.textContent='BEST '+String(Math.floor(best)).padStart(5,'0');
statusEl.textContent='Speed 5.0x'
}
function burst(px,py,n,col,spd){for(let i=0;i<n;i++)particles.push({x:px,y:py,vx:(Math.random()-.5)*spd,vy:-Math.random()*spd,life:1,col,size:2+Math.random()*2})}
function jumpDino(){
if(gameOver){reset();requestAnimationFrame(loop);return}
if(!d.jumping){d.jumping=true;d.vy=-13;squash=.7;burst(d.x+13,d.y+30,10,'255,255,255',4);sfxJump()}
}
function setDuck(on){
if(gameOver||d.jumping){if(!on)ducking=false;return}
ducking=on;
d.h=ducking?DUCK_H:STAND_H;
d.y=ducking?132+(STAND_H-DUCK_H):132
}
function cactus(){
let h=24+Math.random()*24;
o.push({kind:'cactus',x:c.width+20,y:GY-h,w:16+Math.random()*6,h});
if(Math.random()<.22){o.push({kind:'cactus',x:c.width+20+34+Math.random()*10,y:GY-(20+Math.random()*18),w:16,h:20+Math.random()*18})}
}
function bird(){
const tiers=[GY-100,GY-58,GY-24];
const y=tiers[Math.floor(Math.random()*tiers.length)];
o.push({kind:'bird',x:c.width+20,y,w:30,h:20,wing:0});
}
function hit(a,b){return a.x+4<b.x+b.w&&a.x+a.w-4>b.x&&a.y+4<b.y+b.h&&a.y+a.h>b.y}
function drawTrail(){
trail.forEach((p,i)=>{x.fillStyle='rgba(108,92,231,'+(.25*(i/trail.length))+')';x.fillRect(p.x,p.y,27,d.h)})
}
function drawDino(){
x.save();
let cx=d.x+13,cy=d.y+d.h;
x.translate(cx,cy);
x.scale(1/squash,squash);
x.translate(-cx,-cy);
x.fillStyle='#eaeaea';
if(ducking){
let legOff=Math.sin(runT*.6)*4;
x.fillRect(d.x-6,d.y+3,39,DUCK_H-3);
x.fillRect(d.x+27,d.y,10,8);
x.fillStyle='#6c5ce7';
x.fillRect(d.x+33,d.y+2,3,3);
x.fillStyle='#eaeaea';
x.fillRect(d.x-2,d.y+DUCK_H,6,6+legOff);
x.fillRect(d.x+16,d.y+DUCK_H,6,6-legOff)
}else{
let legOff=d.jumping?0:Math.sin(runT*.5)*5;
x.fillRect(d.x,d.y,27,STAND_H-8);
x.fillRect(d.x+18,d.y-10,15,16);
x.fillRect(d.x+29,d.y-8,10,10);
x.fillStyle='#6c5ce7';
x.fillRect(d.x+33,d.y-6,4,4);
x.fillStyle='#eaeaea';
x.fillRect(d.x+2,d.y+STAND_H-8,6,8+legOff);
x.fillRect(d.x+16,d.y+STAND_H-8,6,8-legOff);
x.fillRect(d.x-6,d.y+8,8,7)
}
x.restore()
}
function drawCactus(q){
x.save();
x.shadowColor='rgba(255,90,90,.35)';x.shadowBlur=10;
x.fillStyle='#e17a7a';
x.fillRect(q.x,q.y,q.w,q.h);
x.fillRect(q.x-7,q.y+10,7,6);
x.fillRect(q.x-7,q.y+4,6,12);
x.fillRect(q.x+q.w,q.y+18,7,6);
x.fillRect(q.x+q.w+1,q.y+12,6,12);
x.restore()
}
function drawBird(q){
x.save();
x.shadowColor='rgba(255,255,255,.3)';x.shadowBlur=6;
x.fillStyle='#dcdcff';
let flap=Math.sin(q.wing)*10;
x.fillRect(q.x+10,q.y+6,10,6);
x.fillRect(q.x,q.y+2-flap*.3,14,4);
x.fillRect(q.x+16,q.y+2-flap*.3,14,4);
x.restore()
}
function drawParticles(){
particles.forEach(p=>{x.fillStyle='rgba('+p.col+','+Math.max(p.life,0)+')';x.fillRect(p.x,p.y,p.size,p.size)})
}
function drawAmbient(){
ambient.forEach(p=>{let a=.15+Math.sin(runT*.05+p.ph)*.1;x.fillStyle='rgba(180,160,255,'+a+')';x.beginPath();x.arc(p.x,p.y,p.r,0,7);x.fill()})
}
function drawGround(){
x.strokeStyle='rgba(255,255,255,.25)';
x.lineWidth=2;
x.beginPath();x.moveTo(0,GY);x.lineTo(c.width,GY);x.stroke();
x.fillStyle='rgba(255,255,255,.3)';
dashes.forEach(p=>{if(!p.gap)x.fillRect(p.x,GY+3,p.w,2)})
}
function draw(){
x.clearRect(0,0,c.width,c.height);
x.save();
if(shake>0)x.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
drawAmbient();
x.fillStyle='rgba(255,255,255,.35)';
clouds.forEach(q=>{let b=Math.sin(runT*.03+q.x)*2;x.fillRect(q.x,q.y+b,q.w,5);x.fillRect(q.x+10,q.y+b-5,q.w*.45,10)});
drawGround();
drawTrail();
drawDino();
o.forEach(q=>q.kind==='bird'?drawBird(q):drawCactus(q));
drawParticles();
if(flash>0){x.fillStyle='rgba(255,60,60,'+(flash*.35)+')';x.fillRect(0,0,c.width,c.height)}
x.restore();
if(gameOver){
x.fillStyle='rgba(15,15,25,.55)';x.fillRect(0,0,c.width,c.height);
x.fillStyle='#fff';x.textAlign='center';
x.font='bold 24px Arial';x.fillText('GAME OVER',c.width/2,85);
x.font='14px Arial';x.fillText('Tap layar untuk main lagi',c.width/2,112);
x.textAlign='left'
}
}
function loop(t){
if(!last)last=t;
let dt=Math.min((t-last)/16.67,2);
last=t;
runT+=dt;
if(!gameOver){
d.y+=d.vy*dt;d.vy+=.75*dt;
let groundY=ducking?132+(STAND_H-DUCK_H):132;
if(d.y>=groundY){
if(d.jumping){burst(d.x+13,GY,10,'255,255,255',3.5);squash=1.35}
d.y=groundY;d.vy=0;d.jumping=false
}
if(d.jumping)trail.push({x:d.x,y:d.y});
if(trail.length>6)trail.shift();
if(!d.jumping)trail.length=0;
squash+=(1-squash)*.18*dt;
if(!d.jumping&&!ducking&&Math.floor(runT)%8===0&&Math.random()<.4)burst(d.x+6,GY-2,1,'255,255,255',1.5);
ambient.forEach(p=>{p.x-=p.vx*dt;if(p.x<-4)p.x=c.width+4});
dashes.forEach(p=>{p.x-=speed*dt;if(p.x<-10)p.x=c.width+Math.random()*10});
spawnTimer-=dt;
if(spawnTimer<=0){
if(score>250&&Math.random()<.35)bird();else cactus();
spawnTimer=Math.max(38,62-speed*1.4)+Math.random()*30
}
o.forEach(q=>{q.x-=speed*dt;if(q.kind==='bird')q.wing+=.2*dt});
o=o.filter(q=>q.x>-40);
clouds.forEach(q=>{q.x-=q.s*dt;if(q.x<-80)q.x=c.width+Math.random()*100});
particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.3*dt;p.life-=.03*dt});
particles=particles.filter(p=>p.life>0);
speed=Math.min(11,speed+.0018*dt);
score+=dt*.6;
if(score>best)best=score;
if(Math.floor(score/500)>milestone){
milestone=Math.floor(score/500);
scoreEl.style.transform='scale(1.35)';
setTimeout(()=>scoreEl.style.transform='scale(1)',150);
sfxScore()
}
if(Math.floor(score/700)>nightMilestone){
nightMilestone=Math.floor(score/700);
setNight(nightMilestone%2===1)
}
scoreEl.textContent=String(Math.floor(score)).padStart(5,'0');
bestEl.textContent='BEST '+String(Math.floor(best)).padStart(5,'0');
statusEl.textContent='Speed '+speed.toFixed(1)+'x';
for(const q of o)if(hit(d,q)){
gameOver=true;shake=14;flash=1;
saveBest(best);
burst(d.x+13,d.y+15,18,'255,90,90',5);
sfxDie()
}
}
if(shake>0)shake=Math.max(0,shake-.6*dt);
if(flash>0)flash=Math.max(0,flash-.05*dt);
draw();
if(!gameOver)requestAnimationFrame(loop)
}
document.addEventListener('pointerdown',e=>{
if(e.target===duckBtn)return;
e.preventDefault();jumpDino()
});
duckBtn.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();setDuck(true)});
duckBtn.addEventListener('pointerup',e=>{e.preventDefault();setDuck(false)});
duckBtn.addEventListener('pointerleave',e=>{setDuck(false)});
document.addEventListener('keydown',e=>{
if(e.code==='Space'){e.preventDefault();jumpDino()}
if(e.code==='ArrowDown'){e.preventDefault();setDuck(true)}
});
document.addEventListener('keyup',e=>{if(e.code==='ArrowDown')setDuck(false)});
reset();
requestAnimationFrame(loop);
</script></body>`;
    const section = AIRich.newLayout('Single', {
        __typename: 'GenAIaeacdsnwHtmlPrimitive',
        payload: htmlPayload,
        trusted_sources: ["nixel.dev"]
    });
    const submessage = [{
        messageType: 2,
        messageText: "Al Dino - Tap to Play"
    }];
    const msg = new AIRich(conn);
    msg._addContent(section, submessage);
    await msg.send(m.chat, { quoted: m });
}
handler.command = /^dino$/i;
handler.help = ['dino'];
handler.tags = ['games'];
