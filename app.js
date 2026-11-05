(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const geometry = window.ShuttlegentBrandGeometry;
  const canvas = $('#warp'), ctx = canvas.getContext('2d');
  const brand = $('#brand'), mark = $('#mark');
  // The mark as in the plugin (mark.js): threads behind the shuttle, the shuttle, threads in front; each part pivots on its centre
  const NS = 'http://www.w3.org/2000/svg', [viewX, viewY] = geometry.viewBox;
  const part = (shape, x, y) => {const g = document.createElementNS(NS,'g');g.style.transformBox='view-box';g.style.transformOrigin=`${x-viewX}px ${y-viewY}px`;g.appendChild(shape);return g;};
  const shape = (tag, attributes) => {const node = document.createElementNS(NS,tag);for(const key in attributes)node.setAttribute(key,attributes[key]);return node;};
  const threads = geometry.threads.map((t) => part(shape('rect',{x:t.x-t.width/2,y:t.top,width:t.width,height:t.height,rx:t.width/2,fill:geometry.colors.ivory}),t.x,t.top+t.height/2));
  const shuttle = part(shape('path',{d:geometry.shuttle.d,fill:geometry.colors.red,transform:`rotate(${geometry.shuttle.axisDeg})`}),0,0);
  mark.append(...threads.filter((g,i)=>!geometry.threads[i].front),shuttle,...threads.filter((g,i)=>geometry.threads[i].front));
  // The running-step weave of the usage demo: the same parts with the classes style.css animates (the plugin's sg-weave-*)
  const markup = () => {const svg = shape('svg',{viewBox:geometry.viewBox.join(' ')});
    const threadPart = (t) => {const g = part(shape('rect',{x:t.x-t.width/2,y:t.top,width:t.width,height:t.height,rx:t.width/2,fill:geometry.colors.ivory}),t.x,t.top+t.height/2);g.classList.add('weave-thread');return g;};
    const s = part(shape('path',{d:geometry.shuttle.d,fill:geometry.colors.red,transform:`rotate(${geometry.shuttle.axisDeg})`}),0,0);s.classList.add('weave-shuttle');
    svg.append(...geometry.threads.filter(t=>!t.front).map(threadPart),s,...geometry.threads.filter(t=>t.front).map(threadPart));return svg;};
  $('#demo-weave').appendChild(markup());
  const panels = [...document.querySelectorAll('.panel')], links = [...document.querySelectorAll('nav a')];
  const ids = ['interface','capabilities','agents','usage','extend'];
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = media.matches, width = innerWidth, height = innerHeight, lines = [], pointer = null;
  let progress = scrollY / height, target = progress, frame = 0, last = 0, introStart = performance.now(), introFinished = scrollY > 20;
  let current = -1, previousShuttle = null, scrollDirection = 1;
  const clamp = (v,a=0,b=1) => Math.min(b,Math.max(a,v));
  const ease = (v) => {v=clamp(v);return v*v*(3-2*v);};
  const lerp = (a,b,t) => a+(b-a)*t;
  const axis = geometry.shuttle.axisDeg * Math.PI / 180;
  const ux = Math.cos(axis), uy = Math.sin(axis);
  // Match mark.js easing curves; one scroll timeline controls both arrival and reveal.
  function bezier(x1,y1,x2,y2) {
    const at=(t,a,b)=>3*(1-t)*(1-t)*t*a+3*(1-t)*t*t*b+t*t*t;
    return (x)=>{x=clamp(x);let lo=0,hi=1;for(let i=0;i<18;i++){const t=(lo+hi)/2;if(at(t,x1,x2)<x)lo=t;else hi=t;}return x===0?0:x===1?1:at((lo+hi)/2,y1,y2);};
  }
  const anticipate=bezier(.3,0,.6,1), depart=bezier(.6,0,.95,.4), arrive=bezier(.05,.7,.2,1);
  const holdDistance=.936, transitionDistance=.7776, chapterDistance=holdDistance+transitionDistance;
  const lastChapter=1.1+4*chapterDistance, scrollEnd=lastChapter+holdDistance;
  const flightEnd=.9, exitEnd=flightEnd*620/1460, entryStart=flightEnd*820/1460;
  function resize() {
    width=innerWidth;height=innerHeight;
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    lines=[];
    for(let x=31.5,index=0;x<width;x+=64,index++) lines.push({x,index,offset:0,velocity:0,y:height/2,reach:50});
    measureDock();
    target=scrollY/height;progress=target;wake();
  }
  // On desktop the docked mark centres over the name under it in the rail, as the intro lockup does
  let dockX=0;
  function measureDock(){const r=$('.rail-brand').getBoundingClientRect();dockX=r.left+r.width/2;wake();}
  document.fonts.ready.then(measureDock);
  function setReduced(value){reduced=value;document.body.classList.toggle('reduced',value);runDemo(current);wake();}
  // Interface shots (drawn placeholders until real editor screenshots replace them)
  const shots={
    'panel':{src:'assets/shots/panel.svg',caption:'对话面板停靠在关卡视口旁',alt:'编辑器全貌：左侧关卡视口选中三盏路灯，右侧停靠 Shuttlegent 面板，显示修改强度的确认卡'},
    'multi-session':{src:'assets/shots/multi-session.svg',caption:'两个会话同时进行，一个拖到视口下方停靠',alt:'两个 Shuttlegent 会话：一个停靠在右侧，一个停靠在关卡视口下方'},
    'content-drag':{src:'assets/shots/content-drag.svg',caption:'从内容浏览器把资产拖进输入框引用',alt:'从内容浏览器把 SM_Lamp_Post 拖向 Shuttlegent 输入框'},
    'models':{src:'assets/shots/models.svg',caption:'编辑器偏好设置 › Shuttlegent › Models：已连通的连接，密钥以掩码显示',alt:'编辑器偏好设置中的 Shuttlegent Models 设置，一条连接显示 Connected'}
  };
  let shown='panel';
  function showShot(name){
    if(name===shown)return;shown=name;const img=$('#shot'),shot=shots[name];
    document.querySelectorAll('[data-shot]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.shot===name)));
    $('#shot-caption').textContent=shot.caption;
    const swap=()=>{img.src=shot.src;img.alt=shot.alt;img.classList.remove('is-swapping');};
    if(reduced){swap();return;}
    img.classList.add('is-swapping');setTimeout(swap,180);
  }
  document.querySelectorAll('[data-shot]').forEach(b=>b.addEventListener('click',()=>showShot(b.dataset.shot)));
  function openShot(name){const shot=shots[name];$('#dialog-image').src=shot.src;$('#dialog-image').alt=shot.alt;$('#dialog-caption').textContent=shot.caption+' · 示意图';$('#image-dialog').showModal();}
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>openShot(b.dataset.view)));
  // Chapter demos: 03 connects a model, 04 confirms a change and the viewport updates; they loop while their chapter is shown
  let demoTimers=[];
  const later=(ms,fn)=>demoTimers.push(setTimeout(fn,ms));
  const conversation=$('#conversation-demo'),setup=$('#setup-demo');
  function setSetup(step,status='',key=''){setup.dataset.step=step;$('#setup-status').textContent=status;$('#setup-key').textContent=key;}
  function setupDemo(){
    setSetup('typing');
    for(let i=1;i<=16;i++)later(500+i*70,()=>{$('#setup-key').textContent='•'.repeat(i);});
    const key='•'.repeat(16);
    later(1900,()=>setSetup('pressed','',key));
    later(2150,()=>setSetup('testing','检测中…',key));
    later(3700,()=>setSetup('ready','',key));
    later(7200,()=>setSetup('idle'));
    later(7800,setupDemo);
  }
  function setViewport(state){
    $('#viewport-demo').dataset.state=state;$('#vp-tag').textContent=state==='after'?'改动后':'改动前';
    document.querySelectorAll('[data-vp]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vp===state)));
    conversation.classList.toggle('is-applied',state==='after');
    $('#approval-note').textContent=state==='after'?'已执行 · 可撤销':'仅确认这一次 · 52 秒';
  }
  function viewportDemo(){
    setViewport('before');
    later(2200,()=>conversation.classList.add('is-pressed'));
    later(2600,()=>{conversation.classList.remove('is-pressed');setViewport('after');});
    later(6800,()=>setViewport('before'));
    later(8000,viewportDemo);
  }
  function runDemo(index){
    demoTimers.forEach(clearTimeout);demoTimers=[];
    conversation.classList.remove('is-pressed');setSetup('idle');setViewport('before');
    if(reduced)return;
    if(index===2)setupDemo();else if(index===3)viewportDemo();
  }
  document.querySelectorAll('[data-vp]').forEach(b=>b.addEventListener('click',()=>{demoTimers.forEach(clearTimeout);demoTimers=[];conversation.classList.remove('is-pressed');setViewport(b.dataset.vp);}));
  media.addEventListener('change',e=>setReduced(e.matches));
  function navigate(index){const id=index<0?'intro':ids[index];document.getElementById(id).scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});}
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();navigate(ids.indexOf(a.hash.slice(1)));}));
  $('#next').addEventListener('click',()=>navigate(current>=4?-1:current+1));
  function visible(node,alpha){node.style.opacity=alpha.toFixed(3);node.style.visibility=alpha>.001?'visible':'hidden';node.style.pointerEvents=alpha>.7?'auto':'none';node.inert=alpha<.7;}
  function render(now,dt){
    const p=progress, dock=ease(p/1.1), mobile=width<=760;
    const startScale=mobile?.55:Math.min(.75,width/1300), endScale=mobile?.22:.612;
    const scale=lerp(startScale,endScale,dock);
    const startX=width/2,startY=height*.4,endX=mobile?48:dockX,endY=mobile?106:height*.205;
    const cx=lerp(startX,endX,dock),cy=lerp(startY,endY,dock);
    brand.style.transform=`translate(${cx-172*scale}px,${cy-112*scale}px) scale(${scale})`;
    const introAlpha=1-ease(p/.65);
    visible($('.intro-copy'),introAlpha);
    $('.intro-copy').style.transform=`translateY(${-40*dock}px)`;
    const railAlpha=ease((p-.55)/.5);visible($('#rail'),railAlpha);
    let local=(p-1.1)/chapterDistance, index=clamp(Math.floor(local),0,4), fraction=local-Math.floor(local);
    let change=local>=0&&index<4?clamp((fraction*chapterDistance-holdDistance)/transitionDistance):0;
    const arrival=arrive((change-entryStart)/(flightEnd-entryStart));
    const reveal=change<entryStart?.18*ease((change-exitEnd)/(entryStart-exitEnd)):.18+.82*arrival;
    let active=local<0?(p>.75?0:-1):Math.min(4,index+(change>.52?1:0));
    panels.forEach((panel,i)=>{
      let alpha=0,shift=35;
      if(local<0&&i===0){alpha=ease((p-.45)/.65);shift=(1-alpha)*45;}
      else if(i===index){alpha=1-ease(change/exitEnd);shift=-24*(1-alpha);}
      else if(i===index+1){alpha=reveal;shift=32*(1-alpha);}
      visible(panel,alpha);panel.style.transform=`translateY(calc(-50% + ${shift}px))`;
    });
    if(active!==current)runDemo(active);
    current=active;
    links.forEach((a,i)=>a.setAttribute('aria-current',String(i===active)));
    $('#next').textContent=active===4?'回到开场 ↑':'继续向下 ↓';
    $('#progress').style.width=clamp(p/scrollEnd)*100+'%';
    let sx=cx,sy=cy,opacity=1;
    if(!introFinished&&!reduced){
      const t=(now-introStart)/1000;
      // Threads drop into place from above and below in turn, then the shuttle slides in along its axis (mark.js weave)
      threads.forEach((thread,i)=>{const drop=ease((t-.15*i)/1.1);thread.style.transform=`translateY(${(i%2?40:-40)*(1-drop)}px)`;thread.style.opacity=drop;});
      const entry=ease((t-.6)/1.3);
      sx=cx-220*scale*ux*(1-entry);sy=cy-220*scale*uy*(1-entry);opacity=entry;
      // The name follows once the shuttle has nearly settled (style.css .name-in)
      if(t>=1.6)document.body.classList.add('name-in');
      if(t>=1.9)introFinished=true;
    }else{
      document.body.classList.add('name-in');
      threads.forEach(thread=>{thread.style.transform='none';thread.style.opacity=1;});
      if(!reduced&&scrollDirection>0&&change>0){
        const halfX=Math.hypot(geometry.shuttle.halfLength*ux,geometry.shuttle.halfThickness*uy)*scale;
        const halfY=Math.hypot(geometry.shuttle.halfLength*uy,geometry.shuttle.halfThickness*ux)*scale;
        const exitDistance=Math.min((width+halfX-cx)/ux,(cy+halfY)/-uy)+20;
        const enterDistance=Math.min((cx+halfX)/ux,(height+halfY-cy)/-uy)+20;
        const nudgeEnd=exitEnd*.3;
        let distance=0;
        if(change<nudgeEnd)distance=-12*scale*anticipate(change/nudgeEnd);
        else if(change<exitEnd)distance=lerp(-12*scale,exitDistance,depart((change-nudgeEnd)/(exitEnd-nudgeEnd)));
        else if(change<entryStart){distance=exitDistance;opacity=0;}
        else if(change<flightEnd)distance=-enterDistance*(1-arrival);
        sx=cx+ux*distance;sy=cy+uy*distance;
        const settle=clamp((change-flightEnd)/(1-flightEnd));
        const threadScale=1-.045*Math.sin(Math.PI*settle);
        threads.forEach(thread=>{thread.style.transform='scaleY('+threadScale+')';});
      }
    }
    shuttle.style.transform=`translate(${(sx-cx)/scale}px,${(sy-cy)/scale}px)`;shuttle.style.opacity=opacity;
    // Use the brand master profile to part alternate warp lines around the moving shuttle.
    const halfLength=geometry.shuttle.halfLength*scale, halfThickness=geometry.shuttle.halfThickness*scale;
    const angle=axis,axisX=Math.cos(angle)*halfLength;
    // Measure motion in the logo's own coordinates. Docking translation/scale must not disturb the warp.
    const relativeShuttle={x:(sx-cx)/scale,y:(sy-cy)/scale};
    const shuttleMoving=(scrollDirection>0||!introFinished)&&(p>=1.1||!introFinished)&&previousShuttle!==null&&Math.hypot(relativeShuttle.x-previousShuttle.x,relativeShuttle.y-previousShuttle.y)>.02;
    previousShuttle=relativeShuttle;
    let moving=false;ctx.clearRect(0,0,width,height);
    for(const line of lines){
      let wanted=0;
      if(!reduced&&pointer&&Math.abs(line.x-pointer.x)<26){wanted=Math.sign(line.x-pointer.x||1)*7*(1-Math.abs(line.x-pointer.x)/26);line.y=pointer.y;line.reach=44;}
      const share=(line.x-sx)/axisX;
      if(!reduced&&shuttleMoving&&opacity>.05&&Math.abs(share)<1){
        const u=Math.abs(share)*geometry.shuttle.halfLength,profile=geometry.shuttle.profile;
        let thick=0;
        for(let j=1;j<profile.length;j++){if(u<=profile[j][0]){const a=profile[j-1],b=profile[j];thick=lerp(a[1],b[1],(u-a[0])/(b[0]-a[0]))/geometry.shuttle.halfThickness;break;}}
        wanted=(line.index%2?1:-1)*halfThickness*.85*thick*opacity;
        line.y=sy+share*Math.sin(angle)*halfLength;line.reach=halfThickness*(thick+.6)+18;
      }
      if(reduced){line.offset=0;line.velocity=0;}else{// Substeps preserve the underdamped rebound even on slower frames.
        const steps=Math.max(1,Math.ceil(dt/.008)),step=dt/steps;
        for(let n=0;n<steps;n++){line.velocity+=(320*(wanted-line.offset)-9*line.velocity)*step;line.offset+=line.velocity*step;}}
      if(Math.abs(wanted-line.offset)>.025||Math.abs(line.velocity)>.2)moving=true;
      const lit=Math.min(1,Math.abs(line.offset)/6);
      ctx.strokeStyle=`rgba(232,223,207,${.04+.22*lit})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(line.x,0);
      const top=line.y-line.reach,bot=line.y+line.reach,bend=line.x+line.offset,h=line.reach*.55;
      ctx.lineTo(line.x,top);ctx.bezierCurveTo(line.x,top+h,bend,line.y-h,bend,line.y);ctx.bezierCurveTo(bend,line.y+h,line.x,bot-h,line.x,bot);ctx.lineTo(line.x,height);ctx.stroke();
    }
    return moving;
  }
  function tick(now){frame=0;if(document.hidden)return;const dt=Math.min(.033,(now-last)/1000||.016);last=now;
    const diff=target-progress;progress=reduced?target:Math.abs(diff)<.0001?target:progress+diff*(1-Math.exp(-dt*17));
    const moving=render(now,dt);if(moving||Math.abs(target-progress)>.0001||(!introFinished&&!reduced))wake();
  }
  function wake(){if(!frame&&!document.hidden)frame=requestAnimationFrame(tick);}
  addEventListener('scroll',()=>{
    const next=scrollY/height,delta=next-target;
    if(Math.abs(delta*height)>.25){
      const direction=Math.sign(delta);
      if(direction!==scrollDirection)previousShuttle=null;
      scrollDirection=direction;
    }
    target=next;introFinished=true;wake();
  },{passive:true});
  addEventListener('resize',resize);
  addEventListener('pointermove',e=>{pointer={x:e.clientX,y:e.clientY};wake();},{passive:true});
  document.addEventListener('pointerleave',()=>{pointer=null;wake();});
  document.addEventListener('visibilitychange',()=>{last=performance.now();wake();});
  $('#expand').addEventListener('click',()=>openShot(shown));
  $('#guide').addEventListener('click',()=>$('#guide-dialog').showModal());
  document.querySelectorAll('dialog').forEach(d=>{d.querySelector('.close').addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});});
  setReduced(reduced);resize();
})();

