/* Carrega o vídeo apenas perto da secção; autoplay silencioso quando visível. */
(()=>{
 const video=document.getElementById('demo-video');
 const source=video?.querySelector('source[data-src]');
 if(!video||!source)return;
 let loaded=false;
 const loadVideo=()=>{
   if(loaded)return;
   loaded=true;
   source.src=source.dataset.src;
   video.load();
 };
 const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const saveData=navigator.connection?.saveData===true;
 if(!('IntersectionObserver' in window)){
   video.addEventListener('pointerdown',loadVideo,{once:true});
   video.addEventListener('focus',loadVideo,{once:true});
   return;
 }
 const prepare=new IntersectionObserver(entries=>{
   if(entries.some(entry=>entry.isIntersecting)){
     loadVideo();
     prepare.disconnect();
   }
 },{rootMargin:'450px 0px',threshold:0});
 prepare.observe(video);
 const playback=new IntersectionObserver(entries=>{
   for(const entry of entries){
     if(entry.isIntersecting){
       loadVideo();
       if(!reducedMotion&&!saveData&&!video.ended){
         const task=video.play();
         task?.catch(()=>{/* Navegador pode impedir autoplay; controlos permanecem visíveis. */});
       }
     }else if(!video.paused){
       video.pause();
     }
   }
 },{threshold:0.45});
 playback.observe(video);
})();



/* Fotografias de família: deslize manual e avanço automático quando visível. */
(()=>{
 const root=document.querySelector('[data-family-carousel]');
 if(!root)return;
 const track=root.querySelector('[data-family-track]');
 const viewport=root.querySelector('[data-family-viewport]');
 const slides=[...root.querySelectorAll('[data-family-slide]')];
 const dots=[...root.querySelectorAll('[data-family-dot]')];
 const prev=root.querySelector('[data-family-previous]');
 const next=root.querySelector('[data-family-next]');
 const total=slides.length;
 if(total<2||!track||!viewport)return;
 slides.slice(0,2).forEach(slide=>{
   const copy=slide.cloneNode(true);
   copy.removeAttribute('data-family-slide');
   copy.setAttribute('aria-hidden','true');
   copy.querySelector('img')?.setAttribute('loading','lazy');
   track.appendChild(copy);
 });
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
 let current=0,timer=null,transitioning=false,inView=!('IntersectionObserver' in window);
 let hover=false,focused=false,startPoint=null;
 const interval=7000;
 const distance=()=>slides[0].getBoundingClientRect().width+(parseFloat(getComputedStyle(track).gap)||0);
 const update=(animated=true)=>{
   track.style.transition=animated&&!reduced?'transform 920ms cubic-bezier(.25,.72,.25,1)':'none';
   track.style.transform='translate3d('+(-current*distance())+'px,0,0)';
   const active=current%total;
   dots.forEach((dot,i)=>{
     dot.classList.toggle('is-active',i===active);
     if(i===active)dot.setAttribute('aria-current','true');
     else dot.removeAttribute('aria-current');
   });
 };
 const stop=()=>{if(timer!==null){clearInterval(timer);timer=null;}};
 const go=delta=>{
   if(transitioning)return;
   if(delta<0&&current===0){
     current=total;update(false);
     requestAnimationFrame(()=>requestAnimationFrame(()=>{
       current=total-1;transitioning=!reduced;update(true);
     }));
     return;
   }
   current+=delta;
   transitioning=!reduced;
   update(true);
   if(reduced&&current>=total){current=0;update(false);}
 };
 const run=()=>{
   stop();
   if(reduced||!inView||document.hidden||hover||focused||startPoint)return;
   timer=setInterval(()=>go(1),interval);
 };
 track.addEventListener('transitionend',event=>{
   if(event.target!==track||event.propertyName!=='transform')return;
   transitioning=false;
   if(current>=total){current=0;update(false);}
 });
 prev?.addEventListener('click',()=>{go(-1);run();});
 next?.addEventListener('click',()=>{go(1);run();});
 dots.forEach((dot,i)=>dot.addEventListener('click',()=>{
   if(transitioning||current%total===i)return;
   current=i;transitioning=!reduced;update(true);run();
 }));
 viewport.addEventListener('touchstart',event=>{
   startPoint={x:event.changedTouches[0].clientX,y:event.changedTouches[0].clientY};
   stop();
 },{passive:true});
 viewport.addEventListener('touchend',event=>{
   if(startPoint){
     const dx=event.changedTouches[0].clientX-startPoint.x;
     const dy=event.changedTouches[0].clientY-startPoint.y;
     startPoint=null;
     if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.2)go(dx<0?1:-1);
   }
   run();
 },{passive:true});
 viewport.addEventListener('touchcancel',()=>{startPoint=null;run();},{passive:true});
 viewport.addEventListener('keydown',event=>{
   if(event.key==='ArrowRight'){event.preventDefault();go(1);run();}
   if(event.key==='ArrowLeft'){event.preventDefault();go(-1);run();}
 });
 root.addEventListener('mouseenter',()=>{hover=true;stop();});
 root.addEventListener('mouseleave',()=>{hover=false;run();});
 root.addEventListener('focusin',()=>{focused=true;stop();});
 root.addEventListener('focusout',event=>{
   if(!root.contains(event.relatedTarget)){focused=false;run();}
 });
 window.addEventListener('resize',()=>update(false),{passive:true});
 document.addEventListener('visibilitychange',run);
 if('IntersectionObserver' in window){
   new IntersectionObserver(entries=>{
     inView=entries.some(e=>e.isIntersecting);
     run();
   },{threshold:0.15}).observe(root);
 }
 update(false);run();
})();

/* Seamless marquee: clone complete row group once. */
(()=>{for(const track of document.querySelectorAll('.dual-marquee-track')){const group=track.querySelector('.dual-marquee-group');if(!group||track.children.length>1)continue;const copy=group.cloneNode(true);copy.setAttribute('aria-hidden','true');copy.querySelectorAll('img').forEach(img=>{img.setAttribute('alt','');img.setAttribute('loading','lazy')});track.appendChild(copy)}})();


/* Promotional countdown: starts fresh on every page load; no persistent storage. */
(()=> {
  const node=document.getElementById('offer-countdown');
  if(!node)return;
  let remaining=70*60;
  const render=()=>{
    const hours=String(Math.floor(remaining/3600)).padStart(2,'0');
    const minutes=String(Math.floor((remaining%3600)/60)).padStart(2,'0');
    const seconds=String(remaining%60).padStart(2,'0');
    const value=hours+':'+minutes+':'+seconds;
    node.textContent=value;
    node.dateTime='PT'+hours+'H'+minutes+'M'+seconds+'S';
  };
  render();
  const interval=window.setInterval(()=>{
    if(remaining>0){remaining-=1;render();}
    else{window.clearInterval(interval);}
  },1000);
  window.addEventListener('pagehide',()=>window.clearInterval(interval),{once:true});
})();

/* Pause decorative marquee animations while outside the viewport to reduce work. */
(()=> {
  const rows=document.querySelectorAll('.dual-marquee');
  if(!rows.length||!('IntersectionObserver' in window))return;
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      entry.target.classList.toggle('is-visible',entry.isIntersecting);
    }
  },{rootMargin:'100px 0px'});
  rows.forEach(row=>observer.observe(row));
})();
