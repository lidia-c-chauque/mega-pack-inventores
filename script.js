(()=>{
 const track=document.querySelector('#carousel-track'); const windowEl=document.querySelector('#carousel-window');
 const dots=[...document.querySelectorAll('.dots .dot')];let active=0,downX=null;
 const update=(i)=>{active=(i+dots.length)%dots.length;track.style.transform=`translateX(-${active*100}%)`;dots.forEach((d,n)=>{d.classList.toggle('active',n===active);if(n===active)d.setAttribute('aria-current','true');else d.removeAttribute('aria-current')})};
 document.querySelector('.carousel-btn.prev')?.addEventListener('click',()=>update(active-1));document.querySelector('.carousel-btn.next')?.addEventListener('click',()=>update(active+1));
 dots.forEach((d,n)=>d.addEventListener('click',()=>update(n)));
 windowEl?.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();update(active-1)}if(e.key==='ArrowRight'){e.preventDefault();update(active+1)}});
 windowEl?.addEventListener('touchstart',e=>{downX=e.touches[0].clientX},{passive:true});windowEl?.addEventListener('touchend',e=>{if(downX===null)return;const delta=e.changedTouches[0].clientX-downX;if(Math.abs(delta)>40)update(active+(delta<0?1:-1));downX=null},{passive:true});
})();

