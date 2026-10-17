(()=>{
 const track=document.querySelector('#carousel-track'); const windowEl=document.querySelector('#carousel-window');
 const dots=[...document.querySelectorAll('.dots .dot')];let active=0,downX=null;
 const update=(i)=>{active=(i+dots.length)%dots.length;track.style.transform=`translateX(-${active*100}%)`;dots.forEach((d,n)=>{d.classList.toggle('active',n===active);if(n===active)d.setAttribute('aria-current','true');else d.removeAttribute('aria-current')})};
 document.querySelector('.carousel-btn.prev')?.addEventListener('click',()=>update(active-1));document.querySelector('.carousel-btn.next')?.addEventListener('click',()=>update(active+1));
 dots.forEach((d,n)=>d.addEventListener('click',()=>update(n)));
 windowEl?.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();update(active-1)}if(e.key==='ArrowRight'){e.preventDefault();update(active+1)}});
 windowEl?.addEventListener('touchstart',e=>{downX=e.touches[0].clientX},{passive:true});windowEl?.addEventListener('touchend',e=>{if(downX===null)return;const delta=e.changedTouches[0].clientX-downX;if(Math.abs(delta)>40)update(active+(delta<0?1:-1));downX=null},{passive:true});
})();

/* Data do dia no Brasil, actualizada à meia-noite de São Paulo. */
(()=>{
 const dateNode=document.getElementById('offer-current-date');
 if(!dateNode)return;
 const timeZone='America/Sao_Paulo';
 const monthFormatter=new Intl.DateTimeFormat('pt-BR',{timeZone,day:'numeric',month:'long'});
 const isoFormatter=new Intl.DateTimeFormat('pt-BR',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'});
 const refreshDate=()=>{
   const now=new Date();
   const label=monthFormatter.format(now);
   const pieces=Object.fromEntries(isoFormatter.formatToParts(now).filter(p=>p.type==='day'||p.type==='month'||p.type==='year').map(p=>[p.type,p.value]));
   dateNode.textContent=label;
   dateNode.dateTime=pieces.year+'-'+pieces.month+'-'+pieces.day;
 };
 refreshDate();
 setInterval(refreshDate,30000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDate()});
 window.addEventListener('focus',refreshDate);
 window.addEventListener('pageshow',refreshDate);
})();


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



/* Depoimentos: avanço automático, pausa fora do ecrã, navegação acessível e gesto de deslize. */
(()=>{
 const root=document.querySelector('[data-proof-carousel]');
 if(!root)return;
 const track=root.querySelector('[data-proof-track]');
 const windowEl=root.querySelector('[data-proof-window]');
 const originals=[...track.querySelectorAll('[data-proof-slide]')];
 const dots=[...root.querySelectorAll('[data-proof-dot]')];
 const previous=root.querySelector('[data-proof-prev]');
 const next=root.querySelector('[data-proof-next]');
 const total=originals.length;
 if(total<2)return;

 // Duas cópias no fim permitem uma passagem contínua da última para a primeira.
 originals.slice(0,2).forEach(slide=>{
   const clone=slide.cloneNode(true);
   clone.removeAttribute('data-proof-slide');
   clone.setAttribute('aria-hidden','true');
   clone.classList.add('proof-clone');
   clone.querySelectorAll('a').forEach(a=>a.tabIndex=-1);
   track.appendChild(clone);
 });
 const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
 let index=0,timer=null,visible=!('IntersectionObserver' in window),hovered=false,focused=false,animating=false,touchStart=null;
 const stride=()=>originals[0].getBoundingClientRect().width+parseFloat(getComputedStyle(track).columnGap||getComputedStyle(track).gap||'0');
 const paint=(animate=true)=>{
   track.style.transition=animate&&!reducedMotion?'':'none';
   track.style.transform='translate3d('+(-index*stride())+'px,0,0)';
   const active=(index+total)%total;
   dots.forEach((dot,i)=>{
     dot.classList.toggle('is-active',i===active);
     if(i===active)dot.setAttribute('aria-current','true');
     else dot.removeAttribute('aria-current');
   });
   if(!animate||reducedMotion){
     void track.offsetWidth;
     track.style.transition='';
   }
 };
 const pause=()=>{if(timer!==null){clearInterval(timer);timer=null;}};
 const run=()=>{
   pause();
   if(!visible||hovered||focused||document.hidden||reducedMotion)return;
   timer=setInterval(()=>change(1),5200);
 };
 const change=delta=>{
   if(animating)return;
   if(delta<0&&index===0){
     index=total;
     paint(false);
     requestAnimationFrame(()=>requestAnimationFrame(()=>{
       index=total-1;animating=!reducedMotion;paint(true);
     }));
     return;
   }
   index+=delta;
   animating=!reducedMotion;
   paint(true);
   if(reducedMotion&&index>=total){index=0;paint(false);}
 };
 track.addEventListener('transitionend',event=>{
   if(event.target!==track||event.propertyName!=='transform')return;
   animating=false;
   if(index>=total){index=0;paint(false);}
 });
 previous?.addEventListener('click',()=>{change(-1);run();});
 next?.addEventListener('click',()=>{change(1);run();});
 dots.forEach((dot,n)=>dot.addEventListener('click',()=>{
   if(animating)return;
   index=n;paint(true);animating=!reducedMotion;run();
 }));
 windowEl?.addEventListener('touchstart',event=>{
   touchStart={x:event.changedTouches[0].clientX,y:event.changedTouches[0].clientY};
 },{passive:true});
 windowEl?.addEventListener('touchend',event=>{
   if(!touchStart)return;
   const dx=event.changedTouches[0].clientX-touchStart.x,dy=event.changedTouches[0].clientY-touchStart.y;
   touchStart=null;
   if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){change(dx<0?1:-1);run();}
 },{passive:true});
 root.addEventListener('mouseenter',()=>{hovered=true;pause();});
 root.addEventListener('mouseleave',()=>{hovered=false;run();});
 root.addEventListener('focusin',()=>{focused=true;pause();});
 root.addEventListener('focusout',event=>{
   if(!root.contains(event.relatedTarget)){focused=false;run();}
 });
 document.addEventListener('visibilitychange',run);
 window.addEventListener('resize',()=>paint(false),{passive:true});
 if('IntersectionObserver' in window){
   new IntersectionObserver(entries=>{
     visible=entries.some(entry=>entry.isIntersecting);run();
   },{threshold:0.12}).observe(root);
 }
 paint(false);
 run();
})();
