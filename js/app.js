/* ==========================================================================
   app.js — запуск
   ========================================================================== */

(function init(){
  Store.load();
  Speech.init();

  /* нижняя навигация */
  $('#tabbar').addEventListener('click', e=>{
    const b = e.target.closest('.tab'); if(!b) return;
    if(!P()) return;
    go(b.dataset.s);
  });

  /* закрыть окно по фону */
  $('#sheet').addEventListener('click', e=>{
    if(e.target.id === 'sheet') $('#sheet').classList.remove('on');
  });

  /* первый голос браузеру нужно «разбудить» жестом пользователя */
  const wake = ()=>{
    if(Speech.on && 'speechSynthesis' in window){
      try{ speechSynthesis.resume(); }catch(e){}
    }
    document.removeEventListener('pointerdown', wake);
  };
  document.addEventListener('pointerdown', wake);

  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) Speech.stop(); });

  if(P()) go('home');
  else { App.ob = { name:'', avatar:'🦊', level:null, step:0 }; scrOnboarding(); }
})();
