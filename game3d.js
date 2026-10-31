import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const $=selector=>document.querySelector(selector);
const canvas=$('#view');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.25;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(57,1,.1,450);
const clock=new THREE.Clock();
const root=new THREE.Group();scene.add(root);
let level=1,mode='menu',score=0,elapsed=0,muted=false,last=performance.now(),toastUntil=0;
let world={},keys={left:false,right:false},onAction=null,composer=null,frameCount=0;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),rand=(a,b)=>a+Math.random()*(b-a);
const levels=[
 {title:'Kapløbet til flyet',tag:'LEVEL 1 · AIRPORT DASH',desc:'Spring over kufferter og nå gate 26, før flyet letter.'},
 {title:'Ditte i M&M’S Store',tag:'LEVEL 2 · CANDY STORM',desc:'Grib 25 farverige chokolader fra butikkens rør.'},
 {title:'Empire State Elevator',tag:'LEVEL 3 · THE SKY IS THE LIMIT',desc:'Løs de seks energigåder for at komme til toppen.'},
 {title:'NYC Food Quest',tag:'LEVEL 4 · NEW YORK FOOD WALK',desc:'Merge og servér mad fra Frihedsgudinden til Madison Square Garden.'}
];
const mats={};
function mat(color,metalness=.05,roughness=.65,emissive=0){return new THREE.MeshStandardMaterial({color,metalness,roughness,emissive,emissiveIntensity:emissive?0.4:0})}
function material(key,col,metal=.05,rough=.7){return mats[key]??=(mat(col,metal,rough))}
function box(w,h,d,color,x=0,y=0,z=0,metal=.08,rough=.7){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof color==='string'||typeof color==='number'?mat(color,metal,rough):color);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);return m}
function cylinder(r1,r2,h,color,x,y,z,sides=16){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,sides),typeof color==='string'?mat(color):color);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);return m}
function sphere(r,color,x,y,z,metal=.03,rough=.3){const m=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),typeof color==='string'?mat(color,metal,rough):color);m.position.set(x,y,z);m.castShadow=true;root.add(m);return m}
function plane(w,d,color,x,y,z){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),typeof color==='string'?mat(color):color);m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;root.add(m);return m}
function textTexture(text,color='#ffffff',back='#0e344a',width=512,height=140,size=52){const cvs=document.createElement('canvas');cvs.width=width;cvs.height=height;const cc=cvs.getContext('2d');cc.fillStyle=back;cc.fillRect(0,0,width,height);cc.fillStyle=color;cc.font='900 '+size+'px system-ui';cc.textAlign='center';cc.textBaseline='middle';cc.fillText(text,width/2,height/2,width*.9);const tex=new THREE.CanvasTexture(cvs);tex.colorSpace=THREE.SRGBColorSpace;return tex}
function sign(label,x,y,z,w=4,h=1,front=true,color='#ffdf9a',back='#133b50'){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:textTexture(label,color,back),transparent:false,side:THREE.DoubleSide}));m.position.set(x,y,z);if(!front)m.rotation.y=Math.PI;root.add(m);return m}
function areaLight(x,y,z,color,intensity=25,width=6,height=1){const l=new THREE.PointLight(color,intensity,20,2);l.position.set(x,y,z);root.add(l);const panel=box(width,.035,height,'#d5ecff',x,y+.01,z);panel.material=new THREE.MeshBasicMaterial({color});return l}
function glowSphere(x,y,z,color,r=.11){let m=sphere(r,new THREE.MeshBasicMaterial({color}),x,y,z);m.castShadow=false;return m}
function clearWorld(){avatars.length=0;while(root.children.length){const obj=root.children[0];root.remove(obj);if(obj.geometry)obj.geometry.dispose();if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());else if(obj.material&&!Object.values(mats).includes(obj.material))obj.material.dispose()}world={};scene.fog=new THREE.FogExp2('#142b44',.019);scene.background=new THREE.Color('#142b44');}
const hemi=new THREE.HemisphereLight('#d3eeff','#6f789c',2.1);scene.add(hemi);
const sun=new THREE.DirectionalLight('#fff0d1',3.2);sun.position.set(-10,18,16);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-32;sun.shadow.camera.right=32;sun.shadow.camera.top=32;sun.shadow.camera.bottom=-32;sun.shadow.bias=-.0002;scene.add(sun);
const cameraTarget=new THREE.Vector3();function cam(x,y,z,lookX,lookY,lookZ,instant=false){const a=instant?1:.065;camera.position.lerp(new THREE.Vector3(x,y,z),a);cameraTarget.lerp(new THREE.Vector3(lookX,lookY,lookZ),a);camera.lookAt(cameraTarget)}
const candyColors=['#e9426d','#f2c23d','#63b9eb','#76c76c','#e18443','#bc74d7'];
const photoTexture=new THREE.TextureLoader();let spriteMaterial=null;const avatars=[];
try{photoTexture.load('./assets/nyc-family-sprite.jpg',tex=>{tex.colorSpace=THREE.SRGBColorSpace;spriteMaterial=tex;for(const a of avatars)attachPortrait(a.group,a.cell)},undefined,()=>{})}catch{}
function attachPortrait(g,photoCell){if(!spriteMaterial||g.userData.hasPortrait)return;const uv=photoCell%4,vy=Math.floor(photoCell/4);const geo=new THREE.PlaneGeometry(.39,.38);const tex=spriteMaterial.clone();tex.needsUpdate=true;tex.repeat.set(.25,.5);tex.offset.set(uv*.25,(1-vy)*.5-.5);const portrait=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide}));portrait.position.set(0,1.75,.22);g.add(portrait);g.userData.hasPortrait=true}
function human(x,z,coat='#fc8e84',scale=1,photoCell=3){const g=new THREE.Group();const leg=mat('#203449',.07,.76);
function add(mesh,x,y,z){mesh.position.set(x,y,z);mesh.castShadow=true;g.add(mesh);return mesh}
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.25,.62,6,12),mat(coat,.06,.56));add(body,0,1.1,0);
const head=new THREE.Mesh(new THREE.SphereGeometry(.23,18,12),mat('#edbe9c',.05,.8));add(head,0,1.74,0);
const hair=new THREE.Mesh(new THREE.SphereGeometry(.238,18,10,0,Math.PI*2,0,Math.PI*.46),mat('#342c31'));add(hair,0,1.8,0);
for(const dx of [-.14,.14]){const limb=new THREE.Mesh(new THREE.CapsuleGeometry(.095,.5,3,9),leg);add(limb,dx,.48,0)}
for(const dx of [-.34,.34]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.085,.36,3,8),mat('#e6ac8e'));add(arm,dx,1.16,0)}
attachPortrait(g,photoCell);avatars.push({group:g,cell:photoCell});g.position.set(x,0,z);g.scale.setScalar(scale);root.add(g);return g}
function groundShadow(x,z,sx=1.1,sz=.6){const g=new THREE.Mesh(new THREE.CircleGeometry(1,24),new THREE.MeshBasicMaterial({color:'#0c1e2e',transparent:true,opacity:.18,depthWrite:false}));g.rotation.x=-Math.PI/2;g.position.set(x,.015,z);g.scale.set(sx,sz,1);root.add(g);return g}
function lamp(x,z){cylinder(.05,.07,5,'#223647',x,2.5,z);glowSphere(x,5,z,'#fff1c7',.17);const p=new THREE.PointLight('#ffedcf',8,12);p.position.set(x,5,z);root.add(p)}
function gateDoor(x){box(4.6,4.6,.2,'#25445e',x,2.3,-8);box(3.4,3.9,.08,'#8ebcd3',x,2.25,-7.84,.55,.18);sign('GATE 26 · BOARDING',x,4.8,-7.68,5,.9)}
function airplane(x){const group=new THREE.Group();const white=mat('#f7f7f0',.48,.27),blue=mat('#3a85ad',.32,.3);
function part(mesh,x,y,z){mesh.position.set(x,y,z);group.add(mesh)}
const fus=new THREE.Mesh(new THREE.CapsuleGeometry(1.05,8,6,16),white);fus.rotation.z=Math.PI/2;part(fus,0,1.8,0);
const wing=new THREE.Mesh(new THREE.BoxGeometry(5,.14,8),white);part(wing,-.5,1.85,0);
const tail=new THREE.Mesh(new THREE.BoxGeometry(.8,2.3,2.2),blue);part(tail,-4.4,2.8,0);
for(let j=0;j<8;j++)for(const side of [-1,1]){const w=new THREE.Mesh(new THREE.SphereGeometry(.12,8,8),blue);part(w,j-3.2,2.2,side*.99)}
group.position.set(x,1,-20);root.add(group)}
function suitcase(x,z,color='#ab5f78',scale=1){const group=new THREE.Group(),body=new THREE.Mesh(new THREE.BoxGeometry(.9,1.25,.58),mat(color,.3,.38));body.position.y=.72;group.add(body);const handle=new THREE.Mesh(new THREE.TorusGeometry(.2,.05,5,10,Math.PI),mat('#26394c'));handle.position.set(0,1.48,0);group.add(handle);for(const xx of [-.3,.3]){const wheel=new THREE.Mesh(new THREE.SphereGeometry(.09,8,8),mat('#212b38'));wheel.position.set(xx,.08,.2);group.add(wheel)}group.position.set(x,0,z);group.scale.setScalar(scale);root.add(group);return group}
function setup1(){
clearWorld();scene.background=new THREE.Color('#8db5c4');scene.fog=new THREE.Fog('#a3bdc4',40,130);sun.intensity=3.5;hemi.intensity=2.4;
plane(200,26,'#b4c7cd',48,-.07,0);
for(let i=0;i<125;i++){box(.025,.005,24,'#92aab7',i*1.6,.007,0);if(i%2===0)box(1.6,.005,.027,'#92aab7',i*1.6,.008,0)}
for(let x=-8;x<115;x+=10){box(.35,8,.4,'#d6e3e9',x,4,-10);box(.35,8,.4,'#d6e3e9',x,4,10);box(10,.3,20,'#dae5ea',x,8,0);box(8,.22,2,'#a0acb9',x,7,-1);areaLight(x,7.8,0,'#e6f6ff',18,4.8,.8);
for(let j=0;j<4;j++){box(.06,7,.06,'#e2f4ff',x+j*2.35,3.5,-9.9);box(2.2,6.7,.055,'#7bafc6',x+j*2.35+1.16,3.7,-9.94,.52,.17)}
}
box(135,8,.35,'#7b9aa9',51,4,10.7,.44,.42);
for(let i=0;i<60;i++){const x=-5+i*2.1;box(1.4,.05,.02,'#fff1c3',x,.012,0)}
for(let i=0;i<16;i++){sign('GATES  →',i*8,5.8,-9.7,2.9,.66,false,'#ffebb4','#17415b');box(1.4,.85,1.1,'#7190a7',i*8, .43,7);box(1.1,.09,2.1,'#c7dfde',i*8,.89,7)}
gateDoor(106);airplane(108);
const obstacles=[];for(let i=0;i<17;i++){let x=7+i*5.6,z=(i%3-1)*2.5;obstacles.push({x,z,r:.8});suitcase(x,z,['#cf765d','#5a81b9','#9068a3'][i%3])}
const starItems=[];for(let i=0;i<20;i++){const x=8+i*4.8,z=[-3,0,3][i%3];const group=new THREE.Group();const tor=new THREE.Mesh(new THREE.TorusGeometry(.32,.1,8,5),new THREE.MeshStandardMaterial({color:'#ffcc60',metalness:.8,roughness:.2,emissive:'#d7a442',emissiveIntensity:.55}));group.add(tor);group.position.set(x,1.5,z);root.add(group);starItems.push({x,z,group,taken:false})}
const player=human(0,0,'#e9a272',1,3),family=[human(-1.4,-1.6,'#82c6d0',.84,1),human(-2.7,1.6,'#e395b8',.77,6)];
world={x:0,z:0,velocityY:0,y:0,time:75,health:3,inv:0,player,family,obstacles,starItems,length:106,stats:0};
cam(-8,6.5,12,6,1.5,0,true);
}
function makePipe(x){const metal=mat('#d6cad8',.7,.21);cylinder(.72,.72,4.2,metal,x,7.8,-5,20);const rim=cylinder(.8,.8,.24,'#f2e6f2',x,5.65,-5);rim.material=mat('#f8eff8',.7,.17);for(let j=0;j<8;j++)sphere(.22,candyColors[j%6],x+Math.sin(j*2)*.24,5.8+(j%3)*.17,-5+Math.cos(j*2)*.22,.2,.22)}
function candy(x,y,z,col,bad=false){
const group=new THREE.Group();
if(bad){const body=new THREE.Mesh(new THREE.BoxGeometry(.84,.86,.55),mat('#717f92',.17,.36));group.add(body)}
else{const ball=new THREE.Mesh(new THREE.SphereGeometry(.47,24,16),mat(candyColors[col],.18,.22));group.add(ball);const txt=new THREE.Mesh(new THREE.PlaneGeometry(.45,.31),new THREE.MeshBasicMaterial({map:textTexture('m','#fff','#ffffff00',128,100,73),transparent:true,depthWrite:false}));txt.position.set(0,0,.44);group.add(txt)}
group.position.set(x,y,z);root.add(group);return group}
function setup2(){
clearWorld();scene.background=new THREE.Color('#9e517f');scene.fog=new THREE.Fog('#bb7a9c',28,90);sun.intensity=2.6;hemi.intensity=2.6;
plane(30,22,'#edd5dc',0,0,0);for(let x=-15;x<15;x+=3)for(let z=-12;z<12;z+=3)box(2.92,.008,2.92,'#d9a3c4',x,.008,z);
box(30,15,.4,'#e7badc',0,7.5,-10);box(.5,15,20,'#ae6f99',-15,7.5,0);box(.5,15,20,'#ae6f99',15,7.5,0);
for(let x=-12;x<=12;x+=4){const shelf=box(2.6,5,1.3,'#d3acd0',x,2.5,-9);for(let h=1;h<5;h++)for(let i=0;i<5;i++)sphere(.19,candyColors[(h+i+x+12)%6],x-1+i*.4,h+.3,-8.2,.05,.3)}
for(let i=0;i<4;i++)makePipe([-9,-3,3,9][i]);
sign('THE CANDY LAB',0,9.3,-9.2,13,2,true,'#ffffff','#a42c79');
for(let i=0;i<7;i++){areaLight(-12+i*4,12,-3,'#fff2f6',9,2.6,.8)}
const player=human(0,3.5,'#f0afcd',1.15,4);const basket=box(2.2,.4,1.2,'#ffce83',0,1,3.5);basket.material=mat('#efc06e',.22,.45);
world={x:0,player,basket,time:66,caught:0,goal:25,health:4,items:[],spawn:.45,magnetTime:0};
cam(0,10,17,0,4,-3,true)
}
function setup3(){
clearWorld();scene.background=new THREE.Color('#182c46');scene.fog=new THREE.FogExp2('#1d3150',.012);sun.intensity=1.3;hemi.intensity=1.6;
plane(28,25,'#a1b5bc',0,0,0);
for(let i=0;i<34;i++){let y=i*2.8;box(.35,2.8,.5,'#d6ba89',-5.5,y+1.4,-5);box(.35,2.8,.5,'#d6ba89',5.5,y+1.4,-5);box(11,.3,1.3,'#b6976b',0,y,-5);for(let j=0;j<9;j++)box(.3,.6,.1,j%2?'#e6c992':'#a3bac9',-4+j, y+.9,-4.35)}
for(let i=0;i<22;i++){const y=i*4.4;areaLight(0,y+2.5,-2.5,'#ffcfa7',3,2,.4)}
const cabin=new THREE.Group();const cabinMat=mat('#e3c79d',.67,.25);const p=new THREE.Mesh(new THREE.BoxGeometry(5.3,.3,4.8),cabinMat);p.position.y=.1;cabin.add(p);
const ceil=new THREE.Mesh(new THREE.BoxGeometry(5.3,.2,4.8),cabinMat);ceil.position.y=4.5;cabin.add(ceil);
for(let x of [-2.6,2.6]){const col=new THREE.Mesh(new THREE.BoxGeometry(.2,4.4,.25),cabinMat);col.position.set(x,2.3,-2.3);cabin.add(col)}
for(let z of [-2.4,2.4]){const wall=new THREE.Mesh(new THREE.BoxGeometry(5.1,4.2,.15),mat('#c6d6d8',.6,.25));wall.position.set(0,2.2,z);cabin.add(wall)}
cabin.position.set(0,.4,1.5);root.add(cabin);
const family=[human(-1.5,1,'#eab0a7',.76,1),human(0,1,'#74bac6',.77,3),human(1.5,1,'#efad8f',.77,4)];
const puzzles=[{v:[2,3,5],goal:7},{v:[1,4,6],goal:11},{v:[2,5,8],goal:10},{v:[3,4,7],goal:14},{v:[1,6,9],goal:16},{v:[4,7,8],goal:19}];
world={floor:0,selected:[false,false,false],puzzles,cabin,family,liftY:0,goalY:0,moving:false};
cam(10,8,16,0,3,0,true);
renderPuzzle();
}
function buildNYC(stop){
clearWorld();sun.intensity=stop===3?1.2:3;hemi.intensity=stop===3?1.1:1.9;
const skies=['#8ec1d0','#7d9dac','#e8b28c','#253657'];scene.background=new THREE.Color(skies[stop]);scene.fog=new THREE.Fog(skies[stop],32,125);
plane(65,38,stop===3?'#41526c':'#89979b',0,0,0);
for(let i=-14;i<=14;i++){const x=i*4.5;const height=4+(Math.abs(i*13)%13);
box(3.7,height,5.5,['#a1a8b0','#948e9f','#c49a7f','#535b75'][stop],x,height/2,-14,.15,.5);
for(let h=1;h<height;h+=2)for(let dx=-1;dx<=1;dx++){const windowMat=new THREE.MeshBasicMaterial({color:stop===3?'#ffdf9a':'#bbd8db'});box(.45,.8,.03,windowMat,x+dx*.85,h,-11.22)}}
for(let i=0;i<10;i++){lamp(i*5-25,7.5);box(1.1,.35,2,'#31404b',i*5-24,.22,7.5)}
for(let j=0;j<2;j++){const taxi=box(3.4,.9,1.7,'#ffbd30',-14+j*22,.65,3,.2,.35);box(1.75,.78,1.55,'#e2b253',taxi.position.x,1.4,3)}
if(stop===0){cylinder(.8,1,5.7,'#7eb3a4',-16,3,-6);sphere(.85,'#7eb3a4',-16,6.5,-6);box(.35,2,.35,'#81c1a7',-15.1,7.4,-6);sign('LIBERTY HARBOR',0,6.5,-11,10,1.5)}
if(stop===1){const pool=box(8,.18,8,'#1c4055',-7,.18,-5);for(let k=0;k<14;k++)box(.13,.1,7.4,'#6abacf',-10.5+k*.52,.33,-5);sign('9/11 MEMORIAL',5,7,-11,9,1.5)}
if(stop===2){sign('CHINATOWN · NYC',0,8,-11,11,1.8,'#ffe1a2','#912c30');for(let x=-14;x<=14;x+=7){for(let y=3;y<=8;y+=2){glowSphere(x,y,-6,'#e74238',.38);glowSphere(x+.8,y,-6,'#efc857',.16)}}}
if(stop===3){sign('MADISON SQUARE GARDEN',0,8,-11,13,1.8,'#edfdff','#173d87');for(let i=0;i<8;i++)glowSphere(i*4-16,7,-6,i%2?'#ec75a9':'#6bc5ef',.3)}
const family=[human(-4,3,'#e8a28a',1,3),human(-2.5,3,'#77bdcf',.87,1),human(-1,3,'#eaa6c5',.87,6)];
world.family=family;cam(12,12,23,0,2,-3,true);
}
const dishes=['🥕','🥟','🥨','🍕','🥪','🍽️'];
const dishNames=['Grøntsager','Dumplings','Pretzel','Pizza','Sandwich','NYC Feast'];
const locations=['Frihedsgudinden','Ground Zero','Chinatown','Madison Square Garden'];
function setup4(){
buildNYC(0);world={...world,stop:0,board:Array(16).fill(-1),selection:-1,merges:0,orders:[2,3,4,5],delivered:0,generated:0};updateFoodUI()
}
function showToast(msg,duration=1.5){$('#notice').textContent=msg;$('#notice').classList.add('show');toastUntil=elapsed+duration}
function addScore(n){score+=n;$('#score').textContent=score.toLocaleString('da-DK')}
function updateHUD(){const L=levels[level-1];$('#lv').textContent=level+' / 4';$('#stageName').textContent=L.title;$('#chapterTag').textContent=L.tag;$('#stageDesc').textContent=L.desc;$('#score').textContent=score.toLocaleString('da-DK');$('#progressFill').style.width='0%';$('#puzzle').classList.add('hidden');$('#cookUI').classList.add('hidden');$('#left').style.display=level===3||level===4?'none':'';$('#right').style.display=level===3||level===4?'none':'';$('#action').textContent=['HOP','FANG','KØR ↑','LAV MAD'][level-1]}
function showPanel(tag,title,desc,button,cb){mode='panel';onAction=cb;$('#modalTag').textContent=tag;$('#modalTitle').innerHTML=title;$('#modalDesc').textContent=desc;$('#primary').textContent=button;$('#chapterList').innerHTML=['✈️','🍬','🏙️','🍕'].map((emoji,i)=>'<div class="chapter '+(i+1<level?'passed':i+1===level?'current':'')+'"><b>'+emoji+'</b>'+['LUFTHAVN','DITTE','ELEVATOR','FOOD QUEST'][i]+'</div>').join('');$('#panel').classList.remove('hidden');}
function openGame(){level=1;score=0;elapsed=0;setup1();updateHUD();showPanel('EN FAMILIEREJSE TIL NEW YORK','NYC FAMILY<br>QUEST 3D','Fire forskellige 3D-spil med familien. Nå flyet, fang M&M’S med Ditte, løs Empire State-elevatoren, og gå gennem Manhattan med mad-merges.','START LEVEL 1 →',()=>startLevel(1))}
function startLevel(n){level=n;elapsed=0;mode='play';keys.left=false;keys.right=false;if(n===1)setup1();else if(n===2)setup2();else if(n===3)setup3();else setup4();updateHUD();$('#panel').classList.add('hidden');$('#puzzle').classList.toggle('hidden',n!==3);$('#cookUI').classList.toggle('hidden',n!==4);if(n===3)renderPuzzle();if(n===4)updateFoodUI();showToast(['✈ NÅ GATE 26!','🍬 HJÆLP DITTE!','🏙 TÆND DE RIGTIGE KREDSLØB!','🍽️ LAV JERES NYC-RETTER!'][n-1])}
function win(){beep(700,.2);if(level===4){showPanel('MISSION COMPLETE','NEW YORK<br>CHAMPIONS','Hele familien har gennemført alle fire 3D-levels! I fik '+score.toLocaleString('da-DK')+' point.','SPIL IGEN →',openGame);return}const next=level+1;showPanel('LEVEL '+level+' GENNEMFØRT','GODT GÅET!','Familien er klar til næste kapitel: '+levels[next-1].title+'.','VIDERE TIL LEVEL '+next+' →',()=>startLevel(next))}
function lose(reason){beep(180,.2);showPanel('PRØV IGEN','VI NÅR DET!',''+reason+' I kan prøve level '+level+' igen.','PRØV IGEN →',()=>startLevel(level))}
function beep(freq,duration=.08){if(muted)return;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;world.audio??=new A();if(world.audio.state==='suspended')world.audio.resume();const os=world.audio.createOscillator(),g=world.audio.createGain(),now=world.audio.currentTime;os.frequency.setValueAtTime(freq,now);os.type='sine';g.gain.setValueAtTime(.065,now);g.gain.exponentialRampToValueAtTime(.001,now+duration);os.connect(g).connect(world.audio.destination);os.start();os.stop(now+duration)}catch{}}
function physics1(dt){
const g=world,speed=7.3;g.time-=dt;g.inv=Math.max(0,g.inv-dt);
if(g.time<=0){lose('Flyet lettede, inden familien nåede frem.');return}
if(keys.left)g.x=Math.max(-1,g.x-speed*dt);
if(keys.right)g.x=Math.min(g.length,g.x+speed*dt);
g.velocityY-=23*dt;g.y+=g.velocityY*dt;
if(g.y<=0){g.y=0;g.velocityY=0}
g.player.position.set(g.x,g.y,g.z);
for(let i=0;i<g.family.length;i++){g.family[i].position.x+=(g.x-1.3-(i+1)*1.2-g.family[i].position.x)*dt*4;g.family[i].position.z=(i-.5)*1.6}
for(const o of g.obstacles){if(g.inv<=0&&Math.abs(g.x-o.x)<.8&&Math.abs(g.z-o.z)<1.1&&g.y<1){g.health--;g.inv=1.5;g.x=Math.max(-1,g.x-2);g.velocityY=7;showToast('PAS PÅ KUFFERTEN!');beep(170);if(g.health<=0){lose('Familien snublede over for mange kufferter.');return}}}
for(const item of g.starItems){item.group.rotation.y+=dt*2.2;item.group.position.y=1.5+Math.sin(elapsed*3+item.x)*.16;if(!item.taken&&Math.abs(item.x-g.x)<.7&&Math.abs(item.z-g.z)<1.7){item.taken=true;item.group.visible=false;addScore(50);beep(840)}}
$('#status').textContent='AFGANG OM '+Math.ceil(g.time)+'s\n❤ '+g.health;
$('#progressFill').style.width=(g.x/g.length*100)+'%';
cam(g.x-10,6.7,12,g.x+8,1.8,0);
if(g.x>=g.length-1){addScore(Math.ceil(g.time)*12+g.health*100);win()}
}
function jump(){if(level===1&&mode==='play'&&world.y<=.01){world.velocityY=9.5;beep(340)}}
function physics2(dt){
const g=world;g.time-=dt;g.spawn-=dt;g.magnetTime=Math.max(0,g.magnetTime-dt);
if(keys.left)g.x=Math.max(-11,g.x-dt*11);if(keys.right)g.x=Math.min(11,g.x+dt*11);
g.player.position.x+=(g.x-g.player.position.x)*Math.min(1,dt*15);g.basket.position.x=g.player.position.x;
if(g.spawn<=0){g.spawn=rand(.28,.45);let x=[-9,-3,3,9][Math.floor(Math.random()*4)]+rand(-.6,.6),col=Math.floor(Math.random()*6);const bad=Math.random()<.15;g.items.push({x,y:5.6,z:3.5,vy:0,bad,col,mesh:candy(x,5.6,3.5,col,bad)})}
for(let i=g.items.length-1;i>=0;i--){const q=g.items[i];q.vy+=11*dt;q.y-=q.vy*dt;q.mesh.position.y=q.y;q.mesh.rotation.z+=dt;
if(q.y<1.5&&Math.abs(q.x-g.x)<(g.magnetTime>0?2.9:1.25)){if(q.bad){g.health--;showToast('IKKE KUFFERTEN!');beep(150);if(g.health<=0){lose('For mange kufferter ramte Dittes kurv.');return}}else{g.caught++;addScore(30);beep(620+q.col*45)}root.remove(q.mesh);g.items.splice(i,1);continue}
if(q.y<-.5){root.remove(q.mesh);g.items.splice(i,1)}
}
$('#status').textContent='🍬 '+g.caught+' / '+g.goal+'\n'+Math.ceil(g.time)+'s · ❤ '+g.health;
$('#progressFill').style.width=(g.caught/g.goal*100)+'%';
if(g.caught>=g.goal){addScore(g.health*90+Math.ceil(g.time)*8);win()}else if(g.time<=0)lose('Tiden løb ud, før Ditte samlede nok chokolade.')}
function activateCatch(){if(level!==2||mode!=='play')return;world.magnetTime=.9;showToast('DITTES SUPER-KURV!');beep(680,.14)}
function renderPuzzle(){
if(!world.puzzles)return;
const p=world.puzzles[Math.min(world.floor,5)];
$('#goal').textContent=p.goal;
$('#switches').innerHTML=p.v.map((v,i)=>'<button data-switch="'+i+'" class="'+(world.selected[i]?'on':'')+'">'+v+'</button>').join('');
$('#puzzleMsg').textContent='ETAGE '+(world.floor+1)+' / 6 · DIN SUM: '+p.v.reduce((n,v,i)=>n+(world.selected[i]?v:0),0);
}
function toggleSwitch(i){if(level!==3||mode!=='play'||world.moving)return;world.selected[i]=!world.selected[i];renderPuzzle();beep(400+i*100)}
function solve(){
if(level!==3||mode!=='play'||world.moving)return;const g=world,p=g.puzzles[g.floor],sum=p.v.reduce((v,x,i)=>v+(g.selected[i]?x:0),0);
if(sum===p.goal){g.floor++;g.selected=[false,false,false];g.goalY=g.floor*11;g.moving=true;addScore(250);showToast('DING! ETAGE '+g.floor);beep(870,.18);$('#puzzle').classList.add('hidden');if(g.floor>=6){setTimeout(()=>{if(mode==='play'&&level===3){addScore(600);win()}},1600)}else{setTimeout(()=>{if(mode==='play'&&level===3){g.moving=false;$('#puzzle').classList.remove('hidden');renderPuzzle()}},1300)}}else{$('#puzzleMsg').textContent='SUMMEN ER '+sum+' – PRØV IGEN!';beep(220)}
}
function physics3(dt){const g=world;if(!g.moving)return;g.liftY+=(g.goalY-g.liftY)*Math.min(1,dt*3);g.cabin.position.y=g.liftY+.4;$('#progressFill').style.width=(g.floor/6*100)+'%';cam(10,g.liftY+8,16,0,g.liftY+3,0);$('#status').textContent='ETAGE '+g.floor+' / 6'}
function foodSpawn(){if(level!==4||mode!=='play')return;const g=world,free=g.board.map((x,i)=>x<0?i:-1).filter(i=>i>=0);if(!free.length){showToast('MERGE BRIKKER FOR AT FÅ PLADS');return}const i=free[Math.floor(Math.random()*free.length)];g.board[i]=Math.random()<.25?1:0;g.generated++;beep(360);updateFoodUI()}
function foodSelect(i){if(level!==4||mode!=='play'||world.board[i]<0)return;const g=world;
if(g.selection<0){g.selection=i;beep(350)}else if(g.selection===i)g.selection=-1;else if(g.board[g.selection]===g.board[i]&&g.board[i]<5){g.board[i]++;g.board[g.selection]=-1;g.selection=-1;g.merges++;addScore(80*(g.board[i]+1));showToast('PERFEKT MERGE!');beep(650)}else g.selection=i;
updateFoodUI()}
function deliver(){if(level!==4||mode!=='play')return;const g=world;const target=g.orders[g.stop];if(g.selection<0||g.board[g.selection]<target){showToast('VÆLG RET PÅ NIVEAU '+target);beep(210);return}g.board[g.selection]=-1;g.selection=-1;g.delivered++;addScore(500+g.stop*250);g.stop++;$('#progressFill').style.width=(g.stop/4*100)+'%';beep(930,.16);if(g.stop===4){win();return}const previous={...g};buildNYC(g.stop);world={...previous,family:world.family};updateFoodUI();showToast('NÆSTE STOP · '+locations[g.stop])}
function updateFoodUI(){if(level!==4||!world.board)return;const g=world;$('#stopName').textContent=locations[g.stop];$('#orderFood').textContent=dishes[g.orders[g.stop]];$('#orderText').textContent=dishNames[g.orders[g.stop]];$('#board').innerHTML=g.board.map((v,i)=>'<button class="tile '+(g.selection===i?'selected':'')+'" data-cell="'+i+'">'+(v<0?'':dishes[v]+'<small>LV '+v+'</small>')+'</button>').join('');$('#status').textContent='🍴 '+g.delivered+' / 4\nMERGES '+g.merges}
function update(dt){
if(mode!=='play')return;elapsed+=dt;if(toastUntil&&elapsed>toastUntil){$('#notice').classList.remove('show');toastUntil=0}
if(level===1)physics1(dt);if(level===2)physics2(dt);if(level===3)physics3(dt);
}
function animate(ts){const dt=Math.min(.04,(ts-last)/1000||0);last=ts;update(dt);renderer.render(scene,camera);requestAnimationFrame(animate)}
function resize(){const w=innerWidth,h=innerHeight,pr=Math.min(devicePixelRatio||1,2);renderer.setPixelRatio(pr);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
window.addEventListener('resize',resize);
const press=(name,value)=>{keys[name]=value;$('#'+name).classList.toggle('down',value)};
for(const name of ['left','right']){let button=$('#'+name);button.addEventListener('pointerdown',e=>{e.preventDefault();press(name,true);button.setPointerCapture(e.pointerId)});for(const evt of ['pointerup','pointercancel','lostpointercapture','pointerleave'])button.addEventListener(evt,()=>press(name,false))}
$('#action').addEventListener('click',()=>{if(mode!=='play')return;if(level===1)jump();if(level===2)activateCatch();if(level===3)solve();if(level===4)foodSpawn()});
window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Space','ArrowUp','Enter'].includes(e.code))e.preventDefault();if(e.code==='ArrowLeft'||e.code==='KeyA')keys.left=true;if(e.code==='ArrowRight'||e.code==='KeyD')keys.right=true;if(e.repeat)return;if((e.code==='Space'||e.code==='ArrowUp')&&level===1)jump();if(e.code==='Space'&&level===2)activateCatch();if(level===3&&mode==='play'){if(['Digit1','Digit2','Digit3'].includes(e.code))toggleSwitch(Number(e.code.slice(-1))-1);if(e.code==='Enter')solve()}if(level===4&&mode==='play'&&e.code==='Enter')foodSpawn()});
window.addEventListener('keyup',e=>{if(e.code==='ArrowLeft'||e.code==='KeyA')keys.left=false;if(e.code==='ArrowRight'||e.code==='KeyD')keys.right=false});
$('#switches').addEventListener('click',e=>{const button=e.target.closest('[data-switch]');if(button)toggleSwitch(Number(button.dataset.switch))});
$('#board').addEventListener('click',e=>{const button=e.target.closest('[data-cell]');if(button)foodSelect(Number(button.dataset.cell))});
$('#runElevator').addEventListener('click',solve);$('#cook').addEventListener('click',foodSpawn);$('#deliver').addEventListener('click',deliver);
$('#primary').addEventListener('click',()=>{if(onAction)onAction()});$('#restart').addEventListener('click',openGame);
$('#sound').addEventListener('click',()=>{muted=!muted;$('#sound').textContent=muted?'♪ LYD FRA':'♫ LYD'});
canvas.addEventListener('pointermove',e=>{if(level===2&&mode==='play'&&e.buttons){const xx=(e.clientX/innerWidth-.5)*24;world.x=clamp(xx,-11,11)}});
canvas.addEventListener('pointerdown',e=>{if(level===2&&mode==='play'){world.x=clamp((e.clientX/innerWidth-.5)*24,-11,11)}});
function webglFail(){document.querySelector('#loading').innerHTML='<div style="text-align:center;padding:30px">3D-grafik kræver WebGL i browseren.<br>Prøv en opdateret browser, eller spil <a style="color:#ffdcaa" href="legacy-2d.html">2D-versionen</a>.</div>'}
try{resize();openGame();$('#loading').classList.add('hidden');requestAnimationFrame(animate)}catch(e){console.error(e);webglFail()}
window.__nycQA={startLevel,pass:win,lose,game:()=>world,mode:()=>mode,level:()=>level,solve,foodSpawn,foodSelect,deliver,renderPuzzle,activateCatch};
