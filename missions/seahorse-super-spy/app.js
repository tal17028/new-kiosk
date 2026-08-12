const app = document.querySelector('#app');
const juno = 'assets/juno.png';
const scene = 'assets/hidden-seahorse.png';
const oceanAnimals = {
  fish: 'assets/blue-fish.png',
  clown: 'https://static.vecteezy.com/system/resources/thumbnails/044/766/226/small/sea-clown-fish-cartoon-character-illustration-design-isolate-png.png',
  octopus: 'assets/blue-octopus.png',
  starfish: 'assets/starfish.png',
  seahorse: 'assets/moving-seahorse.png'
};
const IDLE_MS = 90000;
const DASH_KELP_TARGET = 10;
let idleTimer;
let laughTimer;
let explorerLastSpawnSide = '';
let explorerLastSpawnLane = null;
let camouflageDashState = null;
const bgVideo = document.querySelector('.video-bg video');
if(bgVideo){
  bgVideo.addEventListener('timeupdate',()=>{if(bgVideo.currentTime>=300)bgVideo.currentTime=0;});
  bgVideo.play().catch(()=>{});
}

const missions = {
  explorer: [explorerFind, explorerFact],
  detective: [detectiveMatch, detectiveColorMatch, detectiveFact, detectiveTank],
  scientist: [scientistHabitat, scientistWhy, scientistBlendPuzzle, () => aquariumScreen('Scientist', 4, 'Look at the exhibit. Can you identify features that help the seahorse remain hidden?')]
};

function notifyKiosk(type='seahorse:activity'){
  if(window.parent&&window.parent!==window)window.parent.postMessage({type},'*');
}
function resetIdle(){ clearTimeout(idleTimer); notifyKiosk(); idleTimer=setTimeout(()=>{notifyKiosk('seahorse:idleTimeout');showStart();},IDLE_MS); }
['pointerdown','keydown','touchstart'].forEach(event=>document.addEventListener(event,resetIdle,{passive:true}));

function makeClickBubbles(event){
  if(event.pointerType==='mouse'&&event.button!==0)return;
  const layer=document.querySelector('.click-bubbles')||document.body.appendChild(Object.assign(document.createElement('div'),{className:'click-bubbles'}));
  for(let i=0;i<3;i++){
    const bubble=document.createElement('img');
    bubble.src='assets/click-bubble.png';
    bubble.alt='';
    bubble.className='click-bubble';
    const size=12+Math.random()*20;
    bubble.style.cssText=`left:${event.clientX-size/2+(Math.random()-.5)*24}px;top:${event.clientY-size/2+(Math.random()-.5)*16}px;width:${size}px;--drift:${(Math.random()-.5)*60}px;--rise:${75+Math.random()*75}px;--spin:${(Math.random()-.5)*45}deg;--bubble-time:${1.35+Math.random()*.65}s;--bubble-delay:${i*.05}s`;
    layer.appendChild(bubble);
    bubble.addEventListener('animationend',()=>bubble.remove(),{once:true});
  }
}
document.addEventListener('pointerdown',makeClickBubbles);

function shell(content,{mission='',step=0,total=0,home=true,extra=''}={}){
  if(camouflageDashState)camouflageDashState.running=false;
  document.body.classList.toggle('title-page',extra.includes('title-screen'));
  app.innerHTML=`<section class="screen ${extra}">${home?`<header class="topbar"><button class="home" aria-label="Home" onclick="showStart()"><img src="assets/home-icon.png" alt=""></button></header>`:''}${content}</section>`;
  resetIdle();
}
function showStart(){shell(`<div class="title-stage"><section class="brand-hero" aria-label="Juno's Ocean Adventures"><div class="title-logo-wrap"><img class="title-series-logo" src="assets/juno-ocean-adventures-seahorse-banner.png?v=2" alt="Juno's Ocean Adventures Seahorse Edition"></div><div class="juno-greeting"><span class="greeting-text">Hi! I'm <strong>Juno!</strong></span></div><button class="juno-wrap juno-button" aria-label="Make Juno giggle" onclick="giggleJuno()"><img class="juno" src="${juno}" alt="Juno the jellyfish waving"></button></section><section class="mission-card" aria-label="Seahorse Super Spy"><img class="spy-seahorse" src="assets/masked-seahorse.png?v=3" alt="A yellow seahorse wearing a black spy mask"><div class="mission-copy"><h1>Seahorse<br>Super Spy</h1><p>Seahorses are amazing at hiding. Can you help uncover their secrets?</p><div class="mission-start"><span>Start</span><button class="play-bubble" aria-label="Start" onclick="startMission(this)"><i aria-hidden="true"></i></button></div></div></section></div>`,{home:false,extra:'title-screen'});}
function startMission(button){if(button.classList.contains('popping'))return;button.insertAdjacentHTML('beforeend','<b class="pop-drop d1"></b><b class="pop-drop d2"></b><b class="pop-drop d3"></b><b class="pop-drop d4"></b><b class="pop-drop d5"></b><b class="pop-drop d6"></b>');button.classList.add('popping');button.disabled=true;setTimeout(showSelect,560);}
function giggleJuno(){
  const image=document.querySelector('.title-screen .juno');
  const button=document.querySelector('.juno-button');
  if(!image||button.classList.contains('giggling'))return;
  clearTimeout(laughTimer);
  button.classList.add('giggling');
  image.src='assets/juno-laughing.png';
  makeLaughWords(button,()=>resetJunoLaugh(image,button));
  laughTimer=setTimeout(()=>resetJunoLaugh(image,button),2000);
}
function resetJunoLaugh(image,button){
  if(!document.body.contains(image))return;
  image.src=juno;
  button.classList.remove('giggling');
  button.querySelector('.laugh-words')?.remove();
}
function makeLaughWords(button,onComplete){
  const layer=document.createElement('span');
  layer.className='laugh-words';
  ['Ha!','Ha!','Ha!'].forEach((text,index)=>{
    const word=document.createElement('span');
    word.className='laugh-word';
    word.textContent=text;
    word.style.cssText=`--laugh-x:${-55+index*55}px;--laugh-y:${115+index*24}px;--laugh-rotate:${-12+index*12}deg;--laugh-delay:${index*.16}s`;
    layer.appendChild(word);
    if(index===2)word.addEventListener('animationend',onComplete,{once:true});
  });
  button.appendChild(layer);
}
function showSelect(){shell(`<h2 class="challenge-heading">Choose your challenge:</h2><div class="path-grid"><button class="path-card" onclick="go('explorer',0)"><span class="path-icon">&#128269;</span><h3>Explorer</h3><p>Find and discover.</p><span class="age">Ages 4-7</span></button><button class="path-card" onclick="go('detective',0)"><span class="path-icon">&#128373;&#65039;</span><h3>Detective</h3><p>Solve clues and puzzles.</p><span class="age">Ages 8-11</span></button><button class="path-card" onclick="go('scientist',0)"><span class="path-icon">&#128300;</span><h3>Scientist</h3><p>Think like a marine scientist.</p><span class="age">Ages 14-18</span></button></div>`,{mission:'Choose a mission'});}
function go(path,index){ missions[path][index](); }
function feedback(text,type,clearAfter=0){const el=document.querySelector('.feedback');const ocean=el.classList.contains('ocean-feedback');const blend=el.classList.contains('blend-feedback');const color=el.classList.contains('color-feedback');const base=`feedback${ocean?' ocean-feedback':''}${blend?' blend-feedback':''}${color?' color-feedback':''}`;const animate=type.includes('ocean-pop');el.textContent=text;el.className=`${base} ${type.replace('ocean-pop','').trim()}`;if(animate)void el.offsetWidth;el.className=`${base} ${type}`;clearTimeout(el._clearTimer);if(clearAfter)el._clearTimer=setTimeout(()=>{el.textContent='';el.className=base;},clearAfter);}
function revealNext(path,index,label='Next'){const area=document.querySelector('.next-area');area.innerHTML=`<button class="primary next" onclick="go('${path}',${index})">${label} →</button>`;}
function answer(button,correct,path,nextIndex,good,bad){document.querySelectorAll('.choice,.visual-card').forEach(b=>b.classList.remove('wrong'));if(correct){button.classList.add('correct');document.querySelectorAll('.choice,.visual-card').forEach(b=>b.disabled=true);feedback(good,'good');revealNext(path,nextIndex);}else{button.classList.add('wrong');feedback(bad,'try');}}

function explorerFind(){
  const seahorses = pickExplorerSeahorseSpawns().map((spawn,index)=>{
    const duration = 11 + Math.round(Math.random() * 6);
    const reverse = spawn.side === 'right';
    const seahorseClass = reverse ? ' reverse' : '';
    const seahorseFaces = reverse ? '--right-face:-1;--left-face:1' : '--right-face:1;--left-face:-1';
    return `<button class="moving-seahorse${seahorseClass}" data-find-index="${index}" ${index>0?'hidden':''} style="--lane:${spawn.lane}%;--duration:${duration}s;--delay:${spawn.delay}s;${seahorseFaces}" aria-label="Moving seahorse ${index+1}" onclick="foundSeahorse(event)"><img src="${oceanAnimals.seahorse}" alt="Seahorse"></button>`;
  }).join('');
  const swimmers = [
    ['fish', 6, 10, 11, 0, .8, -1, 1, 'full'], ['fish', 15, 15, 9, -7, .65, -1, 1, 'full'],
    ['fish', 24, 8, 12, -12, .85, -1, 1, 'mid'], ['fish', 34, 13, 10, -4, .58, -1, 1, 'full'],
    ['fish', 47, 10, 11, -9, .7, -1, 1, 'full'], ['fish', 58, 16, 9, -15, .8, -1, 1, 'full'],
    ['fish', 72, 11, 13, -5, .76, -1, 1, 'full'], ['fish', 82, 9, 10, -11, .66, -1, 1, 'full'],
    ['clown', 10, 12, 10, -2, .72, -1, 1, 'full'], ['clown', 28, 9, 12, -9, .84, -1, 1, 'full'],
    ['clown', 53, 11, 9, -13, .68, -1, 1, 'full'], ['clown', 76, 10, 11, -6, .78, -1, 1, 'mid'],
    ['octopus', 18, 13, 14, -3, .9, -1, 1, 'full'], ['octopus', 65, 15, 13, -8, .54, -1, 1, 'full'],
    ['starfish', 41, 8, 16, -17, .45, 1, 1, 'full'], ['starfish', 86, 10, 15, -6, .38, 1, 1, 'full']
  ].map(([animal,y,size,duration,delay,speed,rightFace,leftFace,route])=>`<button class="swimmer swimmer-${animal} route-${route}" data-animal="${animal==='clown'?'clown fish':animal}" style="--lane:${y}%;--size:${size}%;--duration:${duration}s;--delay:${delay}s;--bob:${speed}s;--right-face:${rightFace};--left-face:${leftFace}" aria-label="Swimming ${animal}" tabindex="-1"><img src="${oceanAnimals[animal]}" alt=""></button>`).join('');
  const progress = `<div class="find-progress" aria-label="Seahorses found"><span data-slot="0"><img src="${oceanAnimals.seahorse}" alt=""></span><span data-slot="1"><img src="${oceanAnimals.seahorse}" alt=""></span><span data-slot="2"><img src="${oceanAnimals.seahorse}" alt=""></span></div>`;
  shell(`<h2 class="find-heading">Find the seahorse <span class="target-hint"><img class="target-seahorse" src="${oceanAnimals.seahorse}" alt="Target seahorse"><img class="target-glass" src="assets/magnifying-glass-clear.png" alt=""></span>${progress}</h2><div class="moving-ocean" onclick="wrongFind(event)"><div class="sun-rays" aria-hidden="true"></div><div class="feedback ocean-feedback" aria-live="polite"></div>${swimmers}${seahorses}<div class="kelp-foreground" aria-hidden="true"><img class="kelp side-kelp left l1" src="assets/side-kelp-crop.png" alt=""><img class="kelp side-kelp left l2" src="assets/side-kelp-crop.png" alt=""><img class="kelp side-kelp left l3" src="assets/side-kelp-crop.png" alt=""><img class="kelp side-kelp right r1" src="assets/side-kelp-crop-right.png" alt=""><img class="kelp side-kelp right r2" src="assets/side-kelp-crop-right.png" alt=""><img class="kelp side-kelp right r3" src="assets/side-kelp-crop-right.png" alt=""><img class="kelp floor-kelp f1" src="assets/side-kelp-crop.png" alt=""><img class="kelp floor-kelp f2" src="assets/side-kelp-crop-right.png" alt=""><img class="kelp floor-kelp f3" src="assets/side-kelp-crop.png" alt=""><img class="kelp k1" src="assets/foreground-seagrass.png" alt=""><img class="kelp k2" src="assets/foreground-seagrass.png" alt=""><img class="kelp k3" src="assets/foreground-seagrass.png" alt=""><img class="kelp k4" src="assets/foreground-seagrass.png" alt=""><img class="kelp k5" src="assets/foreground-seagrass.png" alt=""></div><div class="sea-floor" aria-hidden="true"></div><div class="win-splash" role="status"><strong>You found all 3!</strong><span>Super seahorse spotting!</span></div></div><div class="next-area"></div>`,{mission:'Explorer',step:1,total:2,extra:'explorer-game'});
}

function pickExplorerSeahorseSpawns(){
  const lanes = [18, 28, 38, 48, 58, 68].filter(lane => lane !== explorerLastSpawnLane);
  const selected = [];
  for(let i=0;i<3;i++){
    const laneIndex = Math.floor(Math.random() * lanes.length);
    selected.push(lanes.splice(laneIndex,1)[0]);
  }
  let previousSide = explorerLastSpawnSide;
  let firstSide;
  if(!explorerLastSpawnSide){
    firstSide = Math.random() < .5 ? 'left' : 'right';
  }else{
    const opposite = explorerLastSpawnSide === 'left' ? 'right' : 'left';
    firstSide = Math.random() < .85 ? opposite : explorerLastSpawnSide;
  }
  previousSide = firstSide;
  explorerLastSpawnLane = selected[0];
  const spawns = selected.map((lane,index)=>{
    let side = firstSide;
    if(index>0){
      const opposite = previousSide === 'left' ? 'right' : 'left';
      side = Math.random() < .85 ? opposite : previousSide;
      previousSide = side;
    }
    return {
      lane,
      side,
      delay: index === 0 ? 0 : 1 + Math.random() * 3
    };
  });
  explorerLastSpawnSide = spawns[spawns.length-1].side;
  return spawns;
}

function pickExplorerSeahorseSpawn(){
  const lanes = [18, 26, 34, 42, 50, 58, 66];
  const laneOptions = lanes.filter(lane => lane !== explorerLastSpawnLane);
  const lane = laneOptions[Math.floor(Math.random() * laneOptions.length)];
  let side;
  if(!explorerLastSpawnSide){
    side = Math.random() < .5 ? 'left' : 'right';
  }else{
    const opposite = explorerLastSpawnSide === 'left' ? 'right' : 'left';
    side = Math.random() < .75 ? opposite : explorerLastSpawnSide;
  }
  explorerLastSpawnSide = side;
  explorerLastSpawnLane = lane;
  return { side, lane };
}
function wrongFind(e){if(e.target.closest('.moving-seahorse'))return;const animal=e.target.closest('.swimmer')?.dataset.animal;if(!animal)return;const displayAnimal=animal==='fish'?'guppy':animal;const article=displayAnimal==='octopus'?'an':'a';const animalClass=animal.replace(/\s+/g,'-');feedback(`I'm ${article} ${displayAnimal}. Try again!`,`try ocean-pop animal-${animalClass}`,2600);}
function foundSeahorse(e){
  e.stopPropagation();
  const ocean=document.querySelector('.moving-ocean');
  const horse=e.seahorse||e.target.closest('.moving-seahorse')||document.querySelector('.moving-seahorse:not(.collected):not(:disabled):not([hidden])');
  if(!ocean||!horse||horse.classList.contains('found-seahorse'))return;
  const index=Number(horse.dataset.findIndex)||0;
  const slot=document.querySelector(`.find-progress [data-slot="${index}"]`);
  const oceanRect=ocean.getBoundingClientRect();
  const horseRect=horse.getBoundingClientRect();
  ocean.classList.add('collecting');
  if(slot){
    const slotRect=slot.getBoundingClientRect();
    horse.style.left=`${horseRect.left-oceanRect.left}px`;
    horse.style.top=`${horseRect.top-oceanRect.top}px`;
    horse.style.width=`${horseRect.width}px`;
    horse.style.setProperty('--collect-x',`${slotRect.left+slotRect.width/2-horseRect.left-horseRect.width/2}px`);
    horse.style.setProperty('--collect-y',`${slotRect.top+slotRect.height/2-horseRect.top-horseRect.height/2}px`);
  }
  horse.disabled=true;
  horse.classList.add('found-seahorse','spotlit');
  const note=document.querySelector('.ocean-feedback');
  if(note){note.textContent='';note.className='feedback ocean-feedback';}
  window.setTimeout(()=>horse.classList.add('collected'),650);
  window.setTimeout(()=>{
    if(slot)slot.classList.add('filled');
  },1380);
  window.setTimeout(()=>{
    horse.hidden=true;
    ocean.classList.remove('collecting');
    const next=ocean.querySelector(`.moving-seahorse[data-find-index="${index+1}"]`);
    if(next&&!next.classList.contains('collected')){
      next.hidden=false;
    }
  },1450);
  const found=ocean.querySelectorAll('.moving-seahorse.found-seahorse').length;
  if(found<3)return;
  window.setTimeout(()=>{
    ocean.classList.add('found');
    ocean.querySelectorAll('.swimmer').forEach(button=>button.disabled=true);
    const splash=document.querySelector('.win-splash');
    if(splash&&!document.querySelector('.win-discover'))splash.insertAdjacentHTML('beforeend',`<div class="win-actions"><button class="primary next win-discover" onclick="go('explorer',1)">Continue →</button><button class="primary secondary replay" onclick="go('explorer',0)">Play again</button></div>`);
    document.querySelector('.next-area').innerHTML='';
  },540);
}
function explorerFact(){shell(`<div class="panel explorer-summary"><div class="juno-row"><img class="juno-small" src="${juno}" alt="Juno"><div class="speech">Seahorses use their colour and shape to blend in.</div></div><div class="camouflage-examples"><img src="assets/example-pygmy-seahorse.jpg" alt="Pygmy seahorse camouflaged on coral"><img src="assets/example-seahorse-coral.jpg" alt="Seahorse blending into coral"><img src="assets/example-reef-camouflage.jpeg" alt="Seahorse habitat camouflage example"></div><p class="question">Now look in the tank. Can you spot a real seahorse hiding?</p><button class="primary" onclick="showSelect()">Back to home</button></div>`,{mission:'Explorer',step:2,total:2});}

function detectiveMatch(){
  const photos = [
    {src:'assets/detective-seahorse-a.jpg',alt:'Seahorse in an underwater habitat',correct:false},
    {src:'assets/detective-seahorse-b.jpg',alt:'Pygmy seahorse camouflaged against coral',correct:true},
    {src:'assets/detective-seahorse-c.jpg',alt:'Seahorse among underwater plants',correct:false}
  ];
  for(let i=photos.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[photos[i],photos[j]]=[photos[j],photos[i]];}
  const cards=photos.map((photo,index)=>`<button class="visual-card photo-card" onclick="answer(this,${photo.correct},'detective',1,'That’s right! Camouflage works best when an animal matches its surroundings.','Good try. Look carefully at the colour and background.')"><span class="art"><img src="${photo.src}" alt="${photo.alt}"></span><span class="label">${String.fromCharCode(65+index)}</span></button>`).join('');
  shell(`<div class="panel detective"><p class="question">Which seahorse would be hardest for a predator to find?</p><div class="option-visuals">${cards}</div><div class="feedback"></div><div class="next-area"></div></div>`,{mission:'Detective',step:1,total:4});
}
function detectiveColorMatch(){
  camouflageDashState = null;
  const items = [
    ['good','Orange kelp cover','assets/orange-kelp-cover.png'], ['bad','Shark','assets/enemy-shark.png'],
    ['bad','Shark','assets/enemy-shark.png'], ['good','Orange kelp cover','assets/orange-kelp-cover.png'],
    ['bad','Shark','assets/enemy-shark.png'], ['good','Orange kelp cover','assets/orange-kelp-cover.png'],
    ['bad','Shark','assets/enemy-shark.png'], ['good','Orange kelp cover','assets/orange-kelp-cover.png'],
    ['bad','Shark','assets/enemy-shark.png'], ['good','Orange kelp cover','assets/orange-kelp-cover.png'],
    ['bad','Shark','assets/enemy-shark.png'], ['bad','Shark','assets/enemy-shark.png'],
    ['good','Orange kelp cover','assets/orange-kelp-cover.png'], ['bad','Shark','assets/enemy-shark.png']
  ].map(([type,label,src],index)=>`<div class="dash-item ${type}" data-type="${type}" data-index="${index}" aria-label="${label}"><img src="${src}" alt=""><span>${label}</span></div>`).join('');
  shell(`<div class="panel camouflage-dash-panel"><div class="dash-track" aria-label="Drag the seahorse up and down" onpointerdown="startCamouflageDash(event)" onpointermove="moveCamouflageDash(event)" onpointerup="endCamouflageDash(event)" onpointercancel="endCamouflageDash(event)"><div class="dash-rays" aria-hidden="true"></div><div class="dash-start-card"><h2 class="dash-start-title">Krazy Kelp</h2><div class="dash-rules"><div class="dash-rule good"><span>Collect 10 Kelp</span><img class="dash-rule-icon kelp-rule-icon" src="assets/orange-kelp-rule-icon.png" alt="kelp"></div><div class="dash-rule bad"><span>Avoid Sharks</span><img class="dash-rule-icon shark-rule-icon" src="assets/enemy-shark-icon.png" alt="shark"></div></div><div class="dash-instructions" aria-hidden="true"><span class="drag-arrows"><img src="assets/drag-up-down-icon.png" alt=""></span><span>Drag</span><img class="dash-drag-seahorse" src="${oceanAnimals.seahorse}" alt=""><span>Up and Down</span></div><button class="primary dash-play" onclick="playCamouflageDash(event)">Play</button></div><div class="dash-seagrass back" aria-hidden="true">${dashGrass(24)}</div><button class="dash-seahorse" type="button" aria-label="Drag seahorse"><img src="${oceanAnimals.seahorse}" alt="Seahorse"></button>${items}<div class="dash-seagrass front" aria-hidden="true">${dashGrass(16)}</div><div class="dash-message" role="status"></div></div><div class="next-area"></div></div>`,{mission:'Detective',step:2,total:4,extra:'camouflage-dash-screen'});
  setTimeout(initCamouflageDash,0);
}
function dashGrass(count){return Array.from({length:count},(_,i)=>`<i style="--i:${i};--h:${46+(i%7)*7}%;--lean:${-7+(i%8)*2}deg"></i>`).join('');}
function clearDetectiveColorFeedback(input){const panel=input.closest('.color-match');const colorFeedback=panel?.querySelector('.color-feedback')||panel?.querySelector(':scope > .feedback');if(colorFeedback){colorFeedback.textContent='';colorFeedback.className='feedback color-feedback';}}
function updateDetectiveColor(input){const panel=input.closest('.color-match');panel?.style.setProperty('--guess-hue',input.value);clearDetectiveColorFeedback(input);}
function submitDetectiveColor(button){const panel=button.closest('.color-match');const target=Number(panel.style.getPropertyValue('--target-hue'));const guess=Number(panel.style.getPropertyValue('--guess-hue'));const round=Number(panel.style.getPropertyValue('--round'))||1;const used=(panel.dataset.usedHues||'').split(',').filter(Boolean).map(Number);const diff=Math.abs(((guess-target+540)%360)-180);if(diff>70){feedback('Close! Try Again','try');return;}const rating=diff<=6?'Perfect!':diff<=16?'Great!':diff<=34?'Good!':'OK!';panel.querySelector('.color-seahorse').classList.add('matched');panel.querySelector('.color-slider').disabled=true;const colorFeedback=panel.querySelector('.color-feedback')||panel.querySelector(':scope > .feedback');if(colorFeedback){colorFeedback.textContent='';colorFeedback.className='feedback color-feedback';}const slot=button.closest('.submit-slot');button.remove();slot.innerHTML=`<div class="submit-rating feedback ${diff<=34?'good':'try'}">${rating}</div>`;const area=panel.querySelector('.next-area');area.innerHTML=round<3?`<button class="primary next" onclick="detectiveColorMatch(${round+1},[${used.join(',')}])">Next round →</button>`:`<div class="win-actions"><button class="primary next" onclick="go('detective',2)">Continue →</button><button class="primary secondary replay" onclick="detectiveColorMatch(1)">Play again</button></div>`;}
function initCamouflageDash(){
  const track=document.querySelector('.dash-track');
  if(!track)return;
  const horse=track.querySelector('.dash-seahorse');
  const cover=document.querySelector('[data-dash-cover]');
  const message=track.querySelector('.dash-message');
  const rect=track.getBoundingClientRect();
  const spawnPlan={nextSpawnX:track.clientWidth-210,nextGoodSpawnX:track.clientWidth-210,lastSpawnY:null,lastGoodY:null,goodYs:[]};
  let firstKelpReady=false;
  const items=[...track.querySelectorAll('.dash-item')].map((el,index)=>{
    const item={el,type:el.dataset.type,index,x:0,y:0,speed:0,hit:false};
    const quickKelp=!firstKelpReady&&item.type==='good';
    resetCamouflageDashItem(item,rect.width,spawnPlan,quickKelp);
    if(quickKelp)firstKelpReady=true;
    return item;
  });
  camouflageDashState={track,horse,cover,message,items,y:rect.height*.52,last:performance.now(),score:0,speedLevel:0,hitCooldown:0,dragging:false,running:false,finishActive:false,nextSpawnX:track.clientWidth-210,nextGoodSpawnX:track.clientWidth-210,lastSpawnY:null,lastGoodY:null};
  setCamouflageDashY(camouflageDashState.y);
}
function resetCamouflageDashItem(item,width,spawnPlan=null,quick=false){
  const track=camouflageDashState?.track||document.querySelector('.dash-track');
  const height=track?.clientHeight||420;
  const speedLevel=camouflageDashState?.speedLevel||0;
  const spacingMin=Math.max(item.type==='bad'?390:470,(item.type==='bad'?520:610)-speedLevel*7);
  const spacingMax=Math.max(item.type==='bad'?560:610,(item.type==='bad'?700:760)-speedLevel*7);
  const plan=spawnPlan||camouflageDashState||{nextSpawnX:width+20,nextGoodSpawnX:width+20,lastSpawnY:null,lastGoodY:null};
  const activeGoodX=camouflageDashState?.items?.filter(other=>other!==item&&other.type==='good'&&!other.hit&&other.x>-180).map(other=>other.x) || [];
  const activeBadX=camouflageDashState?.items?.filter(other=>other!==item&&other.type==='bad'&&!other.hit&&other.x>-180).map(other=>other.x) || [];
  const farthestGoodX=activeGoodX.length?Math.max(...activeGoodX):width+20;
  const farthestBadX=activeBadX.length?Math.max(...activeBadX):width+20;
  const plannedX=item.type==='good'
    ? Math.max(plan.nextGoodSpawnX||width+20,farthestGoodX+Math.max(430,width*.32))
    : Math.max(plan.nextSpawnX||width+20,farthestBadX+Math.max(560,width*.42));
  const baseX=quick ? width-310 : Math.max(width+60,plannedX);
  item.x=baseX+Math.random()*34;
  if(item.type==='good'){
    plan.nextGoodSpawnX=item.x+spacingMin+Math.random()*(spacingMax-spacingMin);
    plan.nextSpawnX=Math.max(plan.nextSpawnX||width+20,item.x+260);
  }else{
    plan.nextSpawnX=item.x+spacingMin+Math.random()*(spacingMax-spacingMin);
  }
  const minY=58;
  const bottomClearance=item.type==='good'?240:150;
  const maxY=Math.max(minY+80,height-bottomClearance);
  const range=maxY-minY;
  const activeGoodYs=camouflageDashState?.items?.filter(other=>other!==item&&other.type==='good'&&!other.hit&&other.x>-180).map(other=>other.y) || [];
  const previousGoodYs=plan.goodYs || [];
  const compareYs=item.type==='good'?[...activeGoodYs,...previousGoodYs].slice(-4):[plan.lastSpawnY].filter(yValue=>yValue!==null);
  let y=minY+Math.random()*range;
  if(compareYs.length){
    let bestY=y;
    let bestDistance=-1;
    for(let attempt=0;attempt<16;attempt+=1){
      const candidate=minY+Math.random()*range;
      const distance=Math.min(...compareYs.map(otherY=>Math.abs(candidate-otherY)));
      if(distance>bestDistance){
        bestDistance=distance;
        bestY=candidate;
      }
    }
    y=bestY;
  }
  item.y=y;
  plan.lastSpawnY=y;
  if(item.type==='good'){
    plan.lastGoodY=y;
    if(plan.goodYs)plan.goodYs.push(y);
  }
  item.speed=item.type==='bad'
    ? 6.05+Math.random()*.48+speedLevel*.42
    : 5.35+Math.random()*1.32+speedLevel*.48;
  item.hit=false;
  item.el.classList.remove('collected','danger-hit','dash-flee');
  item.el.style.setProperty('--dash-x',`${item.x}px`);
  item.el.style.setProperty('--dash-y',`${item.y}px`);
  item.el.style.transform=`translate(${item.x}px,${item.y}px)`;
}
function keepCamouflageDashPopulated(state,trackWidth){
  const live=state.items.filter(item=>!item.hit&&item.x>-180&&item.x<trackWidth+300).length;
  if(live>=4)return;
  const queued=state.items.filter(item=>!item.hit&&item.x>=trackWidth+300).sort((a,b)=>a.x-b.x).slice(0,4-live);
  const height=state.track.clientHeight||420;
  const minY=58;
  let nextPulledX=trackWidth+145;
  queued.forEach(item=>{
    const maxY=Math.max(minY+80,height-(item.type==='good'?240:150));
    const sameTypeXs=state.items
      .filter(other=>other!==item&&other.type===item.type&&!other.hit&&other.x>-180&&other.x<trackWidth+900)
      .map(other=>other.x);
    const sameTypeMinGap=item.type==='bad'?520:420;
    const farthestSameType=sameTypeXs.length?Math.max(...sameTypeXs):trackWidth-220;
    item.x=Math.max(nextPulledX,farthestSameType+sameTypeMinGap)+Math.random()*64;
    nextPulledX=item.x+(item.type==='bad'?260:190);
    const recentYs=state.items.filter(other=>other!==item&&!other.hit&&other.x>-180&&other.x<trackWidth+320).map(other=>other.y);
    let y=minY+Math.random()*(maxY-minY);
    if(recentYs.length){
      let bestY=y;
      let bestDistance=-1;
      for(let attempt=0;attempt<12;attempt+=1){
        const candidate=minY+Math.random()*(maxY-minY);
        const distance=Math.min(...recentYs.map(otherY=>Math.abs(candidate-otherY)));
        if(distance>bestDistance){
          bestDistance=distance;
          bestY=candidate;
        }
      }
      y=bestY;
    }
    item.y=y;
  });
}
function dashCollisionRect(el,type){
  const rect=el.getBoundingClientRect();
  if(type==='bad'){
    return {
      left: rect.left+rect.width*.36,
      right: rect.right-rect.width*.34,
      top: rect.top+rect.height*.44,
      bottom: rect.bottom-rect.height*.4
    };
  }
  return {
    left: rect.left+rect.width*.24,
    right: rect.right-rect.width*.24,
    top: rect.top+rect.height*.08,
    bottom: rect.bottom-rect.height*.08
  };
}
function showDashScore(text,x,y,type){
  const state=camouflageDashState;
  if(!state?.track)return;
  const tag=document.createElement('b');
  tag.className=`dash-score-pop ${type}`;
  tag.textContent=text;
  tag.style.left=`${x}px`;
  tag.style.top=`${y}px`;
  state.track.appendChild(tag);
  tag.addEventListener('animationend',()=>tag.remove(),{once:true});
}
function playCamouflageDash(event){
  event?.stopPropagation();
  const state=camouflageDashState;
  if(!state||state.running)return;
  state.track.classList.add('dash-started');
  state.running=true;
  state.last=performance.now();
  requestAnimationFrame(updateCamouflageDash);
}
function setCamouflageDashY(y){
  const state=camouflageDashState;
  if(!state)return;
  const min=54;
  const max=state.track.clientHeight-90;
  state.y=Math.max(min,Math.min(max,y));
  state.horse.style.top=`${state.y}px`;
}
function startCamouflageDash(event){
  const state=camouflageDashState;
  if(!state||!state.running)return;
  state.dragging=true;
  state.track.setPointerCapture?.(event.pointerId);
  moveCamouflageDash(event);
  event.preventDefault();
}
function moveCamouflageDash(event){
  const state=camouflageDashState;
  if(!state||!state.running||!state.dragging)return;
  const rect=state.track.getBoundingClientRect();
  setCamouflageDashY(event.clientY-rect.top);
}
function endCamouflageDash(){if(camouflageDashState)camouflageDashState.dragging=false;}
function updateCamouflageDash(now){
  const state=camouflageDashState;
  if(!state||!state.running)return;
  const dt=Math.min(34,now-state.last)/16.67;
  state.last=now;
  state.hitCooldown=Math.max(0,state.hitCooldown-dt);
  const trackWidth=state.track.clientWidth;
  const horseRect=state.horse.getBoundingClientRect();
  keepCamouflageDashPopulated(state,trackWidth);
  state.items.forEach(item=>{
    const speedBoost=1+(state.speedLevel*.16);
    item.x-=item.speed*speedBoost*dt;
    if(item.x<-220){
      state.nextSpawnX=Math.max(state.nextSpawnX||0,trackWidth+150);
      if(item.type==='good')state.nextGoodSpawnX=Math.max(state.nextGoodSpawnX||0,trackWidth+Math.max(390,trackWidth*.3));
      resetCamouflageDashItem(item,trackWidth);
    }
    item.el.style.setProperty('--dash-x',`${item.x}px`);
    item.el.style.setProperty('--dash-y',`${item.y}px`);
    item.el.style.transform=`translate(${item.x}px,${item.y}px)`;
    if(item.hit)return;
    const itemRect=dashCollisionRect(item.el,item.type);
    const horseHit={left:horseRect.left+horseRect.width*.3,right:horseRect.right-horseRect.width*.26,top:horseRect.top+horseRect.height*.12,bottom:horseRect.bottom-horseRect.height*.12};
    const overlap=!(horseHit.right<itemRect.left||horseHit.left>itemRect.right||horseHit.bottom<itemRect.top||horseHit.top>itemRect.bottom);
    if(!overlap)return;
    item.hit=true;
    if(item.type==='good'){
      item.el.classList.add('collected');
      state.score=Math.min(DASH_KELP_TARGET,state.score+1);
      state.speedLevel=state.score;
      if(state.cover)state.cover.textContent=state.score;
      showDashScore(`${state.score} / ${DASH_KELP_TARGET}`,item.x+item.el.offsetWidth*.5,item.y+item.el.offsetHeight*.25,'good');
      state.horse.classList.add('dash-camouflage');
      window.setTimeout(()=>state.horse?.classList.remove('dash-camouflage'),420);
      if(state.score>=DASH_KELP_TARGET){
        state.finishActive=true;
        window.setTimeout(finishCamouflageDash,260);
      }else{
        window.setTimeout(()=>resetCamouflageDashItem(item,trackWidth),260);
      }
    }else if(!state.finishActive&&state.hitCooldown<=0){
      state.hitCooldown=45;
      item.el.classList.add('danger-hit');
      state.horse.classList.add('dash-bumped');
      state.score=Math.max(0,state.score-1);
      if(state.cover)state.cover.textContent=state.score;
      showDashScore(`${state.score} / ${DASH_KELP_TARGET}`,item.x+item.el.offsetWidth*.5,item.y+item.el.offsetHeight*.25,'bad');
      window.setTimeout(()=>state.horse?.classList.remove('dash-bumped'),360);
    }
  });
  requestAnimationFrame(updateCamouflageDash);
}
function finishCamouflageDash(){
  const state=camouflageDashState;
  if(!state||!state.running)return;
  state.running=false;
  state.dragging=false;
  state.track.classList.add('dash-won','dash-escape');
  state.score=DASH_KELP_TARGET;
  if(state.cover)state.cover.textContent=state.score;
  state.message.innerHTML='<strong>Safe!</strong><span>The seahorse vanished into cover.</span>';
  state.message.insertAdjacentHTML('beforeend',`<div class="win-actions"><button class="primary next" onclick="go('detective',2)">Continue →</button><button class="primary secondary replay" onclick="detectiveColorMatch()">Play again</button></div>`);
  state.items.forEach((item,index)=>{
    item.el.classList.add(item.type==='bad'?'dash-flee':'collected');
    item.el.style.setProperty('--flee-delay',`${index*.035}s`);
  });
}
function detectiveFact(){shell(`<div class="panel"><div class="juno-row"><img class="juno-small" src="${juno}" alt="Juno"><div class="speech">A predator might only have a split second to spot a seahorse before it disappears into the seagrass.</div></div><button class="primary" onclick="go('detective',3)">Tank challenge →</button></div>`,{mission:'Detective',step:3,total:4});}
function detectiveTank(){questionScreen({mission:'Detective',step:4,total:4,icon:'🐠',question:'Look in the tank. What helps the seahorse blend in?',options:['Colour','Shape','Both'],correct:2,good:'Exactly! Colour and shape work together.',bad:'Good try. Look at the seahorse from nose to tail.',finish:true});}

function scientistHabitat(){shell(`<div class="panel scientist-habitat"><p class="question">A seahorse is being hunted. Which habitat gives it the best chance of survival?</p><div class="option-visuals"><button class="visual-card photo-card" onclick="answer(this,false,'scientist',1,'','Look for the habitat with the best cover.')"><span class="art"><img src="assets/scientist-coral.jpg" alt="Seahorse in a bright coral reef"></span><span class="label">A. Bright coral reef</span></button><button class="visual-card photo-card" onclick="answer(this,false,'scientist',1,'','Look for the habitat with the best cover.')"><span class="art"><img src="assets/scientist-sand.jpg" alt="Seahorse on an open sandy seabed"></span><span class="label">B. Open sandy seabed</span></button><button class="visual-card photo-card" onclick="answer(this,true,'scientist',1,'Correct. Dense seagrass offers excellent camouflage.','')"><span class="art"><img src="assets/scientist-grass.jpg" alt="Seahorse hiding in dense seagrass"></span><span class="label">C. Dense seagrass meadow</span></button></div><div class="feedback"></div><div class="next-area"></div></div>`,{mission:'Scientist',step:1,total:4});}
function scientistWhy(){shell(`<div class="panel scientist-why"><div class="juno-row"><img class="juno-small" src="${juno}" alt="Juno"><div class="speech">Seahorses rely on camouflage to avoid predators. Dense seagrass breaks up their outline and helps them blend into the environment.</div></div><p class="question">Why does dense seagrass help?</p><div class="choices"><button class="choice" onclick="answer(this,false,'scientist',2,'','Think about what makes a predator lose sight of its prey.')">More food</button><button class="choice" onclick="answer(this,true,'scientist',2,'Correct! Seagrass creates many hiding places.','')">More hiding places</button><button class="choice" onclick="answer(this,false,'scientist',2,'','Think about what makes a predator lose sight of its prey.')">Warmer water</button><button class="choice" onclick="answer(this,false,'scientist',2,'','Think about what makes a predator lose sight of its prey.')">Fewer waves</button></div><div class="feedback"></div><div class="next-area"></div></div>`,{mission:'Scientist',step:2,total:4,extra:'scientist-why-screen'});}
function scientistExplain(){shell(`<div class="panel"><div class="juno-row"><img class="juno-small" src="${juno}" alt="Juno"><div class="speech">Seahorses rely on camouflage to avoid predators. Dense seagrass breaks up their outline and helps them blend into the environment.</div></div><button class="primary" onclick="go('scientist',3)">Keep investigating &rarr;</button></div>`,{mission:'Scientist',step:3,total:5});}
let blendDrag = null;
let blendZ = 10;
let lastBlendSet = '';
const scientistBlendPool = [
  {id:1,x:.22,y:.42},{id:2,x:.28,y:.57},{id:3,x:.36,y:.71},{id:4,x:.47,y:.39},{id:5,x:.55,y:.58},
  {id:6,x:.63,y:.44},{id:7,x:.70,y:.69},{id:8,x:.78,y:.33},{id:9,x:.82,y:.62},{id:10,x:.90,y:.48}
];
function pickBlendPieces(){
  let selected = [];
  let guard = 0;
  while(guard < 8){
    selected = [...scientistBlendPool].sort(()=>Math.random()-.5).slice(0,3).sort((a,b)=>a.id-b.id);
    const key = selected.map(piece=>piece.id).join('-');
    if(key !== lastBlendSet || scientistBlendPool.length <= 3){
      lastBlendSet = key;
      return selected;
    }
    guard++;
  }
  lastBlendSet = selected.map(piece=>piece.id).join('-');
  return selected;
}
function scientistBlendPuzzle(){
  blendDrag = null;
  blendZ = 10;
  const pieces=pickBlendPieces().map(piece=>`<button class="blend-piece piece-${piece.id}" data-target-x="${piece.x}" data-target-y="${piece.y}" aria-label="Camouflaged seahorse piece ${piece.id}" onpointerdown="startBlendDrag(event)"><img class="blend-texture" src="assets/scientist-seahorse-texture-${piece.id}.png" alt=""><img class="blend-outline" src="assets/scientist-seahorse-outline.png" alt=""></button>`).join('');
  shell(`<div class="panel scientist-blend-panel"><div class="blend-header"><p class="question">Find where the seahorses blend in</p><div class="blend-tools"><button class="blend-reset" onclick="resetLooseBlendPieces()">Reset</button><div class="blend-counter" aria-live="polite"><strong>0</strong> / 3 matched</div></div></div><div class="reef-puzzle"><div class="piece-tray" aria-hidden="true"></div><div class="reef-board"></div>${pieces}<div class="feedback blend-feedback"></div></div><div class="next-area"></div></div>`,{mission:'Scientist',step:3,total:4,extra:'scientist-blend-screen'});
  requestAnimationFrame(initScientistBlendPuzzle);
}
function initScientistBlendPuzzle(){
  resetLooseBlendPieces(true);
}
function resetLooseBlendPieces(includeSolved=false){
  const puzzle=document.querySelector('.reef-puzzle');
  const tray=document.querySelector('.piece-tray');
  const pieces=[...document.querySelectorAll('.blend-piece')].filter(piece=>includeSolved||!piece.classList.contains('solved'));
  if(!puzzle||!tray||!pieces.length)return;
  pieces.forEach((piece,index)=>{
    const usable=tray.clientHeight-piece.offsetHeight;
    const inset=Math.min(usable*.14,34);
    const spread=Math.max(0,usable-inset*2);
    const y=tray.offsetTop+inset+(pieces.length===1?spread/2:(spread/(pieces.length-1))*index);
    const x=tray.offsetLeft+(tray.clientWidth-piece.offsetWidth)/2;
    placeBlendPiece(piece,x,y);
    piece.style.zIndex=String(++blendZ);
  });
  const note=document.querySelector('.blend-feedback');
  if(note){note.textContent='';note.className='feedback blend-feedback';}
}
function blendTarget(piece){
  const board=document.querySelector('.reef-board');
  const puzzle=document.querySelector('.reef-puzzle');
  return {
    x:board.offsetLeft+board.clientWidth*Number(piece.dataset.targetX)-piece.offsetWidth/2,
    y:board.offsetTop+board.clientHeight*Number(piece.dataset.targetY)-piece.offsetHeight/2
  };
}
function placeBlendPiece(piece,x,y){
  piece.style.left=`${x}px`;
  piece.style.top=`${y}px`;
}
function startBlendDrag(event){
  const piece=event.currentTarget;
  if(piece.classList.contains('solved')||piece.classList.contains('matching'))return;
  const puzzle=piece.closest('.reef-puzzle');
  const pieceRect=piece.getBoundingClientRect();
  blendDrag={piece,puzzle,offsetX:event.clientX-pieceRect.left,offsetY:event.clientY-pieceRect.top,pointerId:event.pointerId};
  piece.setPointerCapture(event.pointerId);
  piece.style.zIndex=String(++blendZ);
  piece.classList.add('dragging');
  piece.addEventListener('pointermove',moveBlendDrag);
  piece.addEventListener('pointerup',endBlendDrag,{once:true});
  piece.addEventListener('pointercancel',endBlendDrag,{once:true});
  event.preventDefault();
}
function moveBlendDrag(event){
  if(!blendDrag||event.pointerId!==blendDrag.pointerId)return;
  const {piece,puzzle,offsetX,offsetY}=blendDrag;
  const rect=puzzle.getBoundingClientRect();
  const maxX=puzzle.clientWidth-piece.offsetWidth;
  const maxY=puzzle.clientHeight-piece.offsetHeight;
  const x=Math.min(maxX,Math.max(0,event.clientX-rect.left-offsetX));
  const y=Math.min(maxY,Math.max(0,event.clientY-rect.top-offsetY));
  placeBlendPiece(piece,x,y);
}
function endBlendDrag(event){
  if(!blendDrag||event.pointerId!==blendDrag.pointerId)return;
  const {piece}=blendDrag;
  piece.classList.remove('dragging');
  piece.removeEventListener('pointermove',moveBlendDrag);
  checkBlendPlacement(piece);
  blendDrag=null;
}
function checkBlendPlacement(piece){
  const board=document.querySelector('.reef-board');
  const target=blendTarget(piece);
  const x=parseFloat(piece.style.left)||0;
  const y=parseFloat(piece.style.top)||0;
  const distance=Math.hypot(x-target.x,y-target.y);
  if(distance<Math.max(12,board.clientWidth*.025)){
    placeBlendPiece(piece,target.x,target.y);
    piece.classList.add('matching');
    piece.disabled=true;
    piece.style.zIndex=String(++blendZ);
    const note=document.querySelector('.blend-feedback');
    if(note){note.textContent='';note.className='feedback blend-feedback';}
    window.setTimeout(()=>finishBlendSolve(piece),720);
  }else{
    feedback('Keep looking for the matching place.','try',1400);
  }
}
function finishBlendSolve(piece){
  if(!piece||piece.classList.contains('solved'))return;
  piece.classList.remove('matching');
  piece.classList.add('solved');
  const solved=document.querySelectorAll('.blend-piece.solved').length;
  const counter=document.querySelector('.blend-counter strong');
  if(counter)counter.textContent=solved;
  if(solved>=3){
    const puzzle=document.querySelector('.reef-puzzle');
    if(puzzle&&!puzzle.querySelector('.blend-win')){
      const confetti=Array.from({length:28},(_,i)=>`<i style="--i:${i};--x:${8+(i*37)%86}%;--delay:${(i%9)*.055}s;--spin:${-120+(i*29)%240}deg"></i>`).join('');
      puzzle.insertAdjacentHTML('beforeend',`<div class="blend-confetti" aria-hidden="true">${confetti}</div><div class="blend-win" role="status"><strong>All matched!</strong><span>The seahorses vanished into the reef.</span><div class="win-actions"><button class="primary next" onclick="go('scientist',3)">Continue &rarr;</button><button class="primary secondary replay" onclick="scientistBlendPuzzle()">Play again</button></div></div>`);
    }
  }
}

function finalAnswer(button,correct,good,bad){document.querySelectorAll('.choice').forEach(b=>b.classList.remove('wrong'));if(correct){button.classList.add('correct');document.querySelectorAll('.choice').forEach(b=>b.disabled=true);feedback(good,'good');document.querySelector('.feedback')?.classList.add('detective-finish-text');document.querySelector('.next-area').innerHTML=`<button class="primary" onclick="showSelect()">Back to home</button>`}else{button.classList.add('wrong');feedback(bad,'try')}}
function questionScreen({mission,step,total,icon='',question,options,correct,good,bad,next,finish=false}){const esc=s=>s.replace(/\\/g,'\\\\').replace(/'/g,"\\'");const action=(isCorrect)=>finish?`finalAnswer(this,${isCorrect},'${esc(good)}','${esc(bad)}')`:`answer(this,${isCorrect},'${next?.[0]||mission.toLowerCase()}',${next?.[1]||0},'${esc(good)}','${esc(bad)}')`;shell(`<div class="panel">${icon?`<div class="aquarium">${icon}</div>`:''}<p class="question">${question}</p><div class="choices ${options.length===3?'three':''}">${options.map((o,i)=>`<button class="choice" onclick="${action(i===correct)}">${o}</button>`).join('')}</div><div class="feedback"></div><div class="next-area"></div></div>`,{mission,step,total});}
function aquariumScreen(mission,step,text){shell(`<div class="panel"><div class="aquarium">&#128032;</div><p class="question">${text}</p><button class="primary" onclick="showSelect()">Back to home</button></div>`,{mission,step,total:mission==='Scientist'?4:3});}

function launchFromUrl(){
  const params = new URLSearchParams(window.location.search);
  const mission = params.get('mission');
  if(mission && missions[mission]){
    const step = Number(params.get('step') || 0);
    go(mission, Number.isInteger(step) && missions[mission][step] ? step : 0);
    return;
  }
  showStart();
}

launchFromUrl();
