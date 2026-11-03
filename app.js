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
  const labels = ['插件主界面','能力介绍','模型与 Agent','如何使用','自定义扩展'];
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
    target=scrollY/height;progress=target;wake();
  }
  function setReduced(value){reduced=value;document.body.classList.toggle('reduced',value);$('#motion').setAttribute('aria-pressed',String(value));$('#motion').textContent=value?'恢复动态':'减少动态';wake();}
  $('#motion').addEventListener('click',()=>setReduced(!reduced));
  media.addEventListener('change',e=>setReduced(e.matches));
  function navigate(index){const id=index<0?'intro':ids[index];document.getElementById(id).scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});}
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();navigate(ids.indexOf(a.hash.slice(1)));}));
  $('#next').addEventListener('click',()=>navigate(current>=4?-1:current+1));
  function visible(node,alpha){node.style.opacity=alpha.toFixed(3);node.style.visibility=alpha>.001?'visible':'hidden';node.style.pointerEvents=alpha>.7?'auto':'none';node.inert=alpha<.7;}
  function render(now,dt){
    const p=progress, dock=ease(p/1.1), mobile=width<=760;
    const startScale=mobile?0.82:Math.min(1.35,width/1000), endScale=mobile?.22:.612;
    const scale=lerp(startScale,endScale,dock);
    const startX=width/2,startY=height*.36,endX=mobile?48:width*.07+105,endY=mobile?106:height*.205;
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
    current=active;
    links.forEach((a,i)=>a.setAttribute('aria-current',String(i===active)));
    $('#chapter-label').textContent=active<0?'序章 / 一次穿行的开始':`0${active+1} / ${labels[active]}`;
    $('#next').textContent=active===4?'回到开场 ↑':'继续向下 ↓';
    $('#progress').style.width=clamp(p/scrollEnd)*100+'%';
    let sx=cx,sy=cy,opacity=1;
    if(!introFinished&&!reduced){
      const t=(now-introStart)/1000;
      // Threads drop into place from above and below in turn, then the shuttle slides in along its axis (mark.js weave)
      threads.forEach((thread,i)=>{const drop=ease((t-.15*i)/1.1);thread.style.transform=`translateY(${(i%2?40:-40)*(1-drop)}px)`;thread.style.opacity=drop;});
      const entry=ease((t-.6)/1.3);
      sx=cx-220*scale*ux*(1-entry);sy=cy-220*scale*uy*(1-entry);opacity=entry;
      if(t>=1.9)introFinished=true;
    }else{
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
  $('#expand').addEventListener('click',()=>$('#image-dialog').showModal());
  $('#guide').addEventListener('click',()=>$('#guide-dialog').showModal());
  document.querySelectorAll('dialog').forEach(d=>{d.querySelector('.close').addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});});
  setReduced(reduced);resize();
})();

