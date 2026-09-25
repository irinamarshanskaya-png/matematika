/* ==========================================================================
   screens.js — экраны и движок тренировки
   ========================================================================== */

const App = {
  screen: 'home',
  tab: 'home',
  mapLevel: null,
  topic: null,
  ses: null,
  ob: { name:'', avatar:'🦊', level:null, step:0 }
};

const AVATARS = ['🦊','🐼','🐯','🐨','🦄','🐧','🐸','🦉'];

function root(){ return $('#screens'); }
function setHTML(html, noTabs){
  root().innerHTML = `<div class="screen on enter">${html}</div>`;
  $('#tabbar').style.display = noTabs ? 'none' : '';
  root().parentElement.scrollTop = 0;
}

/* варианты-числа, когда генератор их не дал */
function numChoices(ans){
  const set = new Set([ans]);
  let g = 0;
  while(set.size < 4 && g++ < 40){ const v = ans + R(-2,2); if(v >= 0) set.add(v); }
  return shuffle([...set]).map(v=>({ t:String(v), v:String(v) }));
}
function optCols(options){
  if(options.some(o=>o.sh)) return 'c2';
  const maxLen = Math.max(...options.map(o=>String(o.t||'').length));
  if(maxLen <= 3 && options.length === 4) return 'c4';
  if(maxLen <= 3) return 'c3';
  if(maxLen <= 10) return 'c2';
  return '';
}
function optHTML(o){
  if(o.sh) return `<button class="opt" data-v="${esc(o.v)}">${shapeSVG(o.sh.s, o.sh.c, 56)}</button>`;
  const long = String(o.t).length > 3;
  return `<button class="opt${long?' text':''}" data-v="${esc(o.v)}">${esc(o.t)}${o.em?' '+o.em:''}</button>`;
}

/* ==========================================================================
   ОНБОРДИНГ
   ========================================================================== */
function scrOnboarding(){
  const st = App.ob.step;
  if(st === 0){
    setHTML(`
      <div class="scroll" style="padding-top:26px">
        <div class="center mb16">${mascot('happy',132,'float')}</div>
        <div class="logo center mb16"><b>МАТЕМАТИКА</b></div>
        <h2 class="ob-title center">Как тебя зовут?</h2>
        <p class="ob-sub center">Я твой тренер по математике</p>
        <input class="field" id="obName" placeholder="Имя" maxlength="14" value="${esc(App.ob.name)}">
        <p class="ob-sub center mt16" style="margin-bottom:6px">Выбери себе значок</p>
        <div class="avatars" id="obAv">
          ${AVATARS.map(a=>`<div class="av${a===App.ob.avatar?' on':''}" data-a="${a}">${a}</div>`).join('')}
        </div>
        <button class="btn full mt24" id="obNext">Дальше</button>
      </div>`, true);
    $('#obAv').onclick = e=>{
      const el = e.target.closest('.av'); if(!el) return;
      App.ob.avatar = el.dataset.a;
      $$('#obAv .av').forEach(x=>x.classList.toggle('on', x === el));
    };
    $('#obNext').onclick = ()=>{
      const v = $('#obName').value.trim();
      if(!v){ toast('Напиши своё имя'); return; }
      App.ob.name = v; App.ob.step = 1; scrOnboarding();
    };
    setTimeout(()=>Speech.say('Привет! Как тебя зовут?'), 400);
    return;
  }

  if(st === 1){
    setHTML(`
      <div class="scroll" style="padding-top:26px">
        <div class="center mb16">${mascot('idle',110,'float')}</div>
        <h2 class="ob-title center">Где ты учишься?</h2>
        <p class="ob-sub center">Подберу задания по твоей программе</p>
        <div class="lvl-list">
          ${LEVELS.map(l=>`
            <button class="lvl-row${App.ob.level===l.id?' on':''}" data-l="${l.id}">
              <span class="em">${l.em}</span>
              <span class="grow">
                <div class="nm">${l.id==='pre'?'Я готовлюсь к школе':l.title}</div>
                <div class="ds">${l.age}</div>
              </span>
            </button>`).join('')}
        </div>
        <button class="btn full mt24" id="obGo">Начать</button>
      </div>`, true);
    root().onclick = e=>{
      const el = e.target.closest('.lvl-row'); if(!el) return;
      App.ob.level = el.dataset.l;
      $$('.lvl-row').forEach(x=>x.classList.toggle('on', x === el));
    };
    $('#obGo').onclick = ()=>{
      if(!App.ob.level){ toast('Выбери класс'); return; }
      const p = newProfile(App.ob.name, App.ob.avatar, App.ob.level);
      Store.data.profiles.push(p);
      Store.data.current = p.id;
      Store.save();
      App.ob.step = 2; scrOnboarding();
    };
    setTimeout(()=>Speech.say('В каком ты классе?'), 300);
    return;
  }

  /* предложение диагностики */
  setHTML(`
    <div class="scroll" style="padding-top:26px">
      <div class="center mb16">${mascot('happy',132,'float')}</div>
      <h2 class="ob-title center">Приятно познакомиться, ${esc(P().name)}!</h2>
      <p class="ob-sub center">Давай узнаем, что ты уже умеешь. Это займёт пару минут — и я подберу задания именно для тебя.</p>
      <button class="btn full mt16" id="obDiag">🧭 Пройти диагностику</button>
      <button class="btn ghost full mt12" id="obSkip">Потом, сразу к заданиям</button>
    </div>`, true);
  $('#obDiag').onclick = ()=> startSession(buildDiagnostic(P().level), 'diag');
  $('#obSkip').onclick = ()=> go('home');
  setTimeout(()=>Speech.say(`Приятно познакомиться, ${P().name}! Давай узнаем, что ты уже умеешь.`), 300);
}

/* ==========================================================================
   ГЛАВНАЯ
   ========================================================================== */
function scrHome(){
  const p = P();
  const lv = LEVELS.find(l=>l.id === p.level);
  const d = p.days[today()] || { tasks:0, right:0 };
  const w = weakestSkill(p.level);
  /* две ближайшие темы: те, что уже открыты, но ещё не пройдены до конца */
  const near = (CURRICULUM[p.level]||[])
    .map((tp,i)=>({ tp, i, m: topicMastery(p.level, tp) }))
    .filter(r=> topicUnlocked(p.level, r.i) && r.m < 100)
    .sort((a,b)=> b.m - a.m)
    .slice(0,2);

  setHTML(`
    <div class="topbar">
      <div class="grow">
        <div class="logo"><b>МАТЕМАТИКА</b></div>
        <div class="logo-sub">Твой мир математики</div>
      </div>
      <button class="icon-btn" id="btnProfile" title="Профиль">${p.avatar}</button>
      <button class="icon-btn" id="btnSet">⚙️</button>
    </div>
    <div class="scroll">
      <div class="row mb16">
        <span class="counter">⭐ ${p.stars}</span>
        <span class="counter">🪙 ${p.coins}</span>
        <span class="counter">🔥 ${p.streak}</span>
        <span class="grow"></span>
        <span class="counter" style="background:none;border-color:transparent">${lv.em} ${lv.short}</span>
      </div>

      <div class="card-hero">
        <div style="display:flex;align-items:center;gap:12px;position:relative;z-index:1">
          <div style="flex:1">
            <div style="font-size:24px;font-weight:900;line-height:1.15">5 минут<br>математики</div>
            <div style="font-size:13px;font-weight:700;opacity:.9;margin-top:8px">
              ${d.tasks ? `Сегодня решено: ${d.tasks}` : 'Сегодня у тебя 10 заданий'}
            </div>
            <button class="btn mt16" id="btnDaily" style="background:#fff;color:#4A2FB8;box-shadow:none">Начать →</button>
          </div>
          <div style="margin:-10px 0 -14px 0;flex:0 0 auto">${mascot('happy',120,'float')}</div>
        </div>
      </div>

      <div class="tiles mt16">
        <button class="tile" id="tContinue">
          <div class="ti" style="background:linear-gradient(140deg,#FBBF24,#F97316)">📚</div>
          <div class="tt">Продолжить</div>
          <div class="ts">${w ? esc(w.topic.title) : 'обучение'}</div>
        </button>
        <button class="tile" id="tWeak">
          <div class="ti" style="background:linear-gradient(140deg,#F472B6,#DB2777)">🧠</div>
          <div class="tt">Слабое место</div>
          <div class="ts">${w ? esc(w.skill.title) : 'подтянуть'}</div>
        </button>
        <button class="tile" id="tVoice">
          <div class="ti" style="background:linear-gradient(140deg,#34D399,#059669)">🎤</div>
          <div class="tt">Тренер</div>
          <div class="ts">поговорить</div>
        </button>
      </div>

      <div class="card mt16">
        <div class="row">
          <div style="flex:1">
            <div style="font-size:13px;font-weight:900;color:var(--ink-3);text-transform:uppercase;letter-spacing:.6px">Совет тренера</div>
            <div style="font-size:14px;font-weight:700;line-height:1.4;margin-top:8px">${esc(Trainer.advice())}</div>
          </div>
        </div>
      </div>

      ${p.level !== 'pre' ? `
      <button class="card mt16" id="btnMul" style="width:100%;text-align:left;cursor:pointer;color:var(--ink);font-family:inherit;
               background:linear-gradient(135deg,rgba(52,211,153,.22),rgba(5,150,105,.12));border-color:rgba(52,211,153,.4)">
        <div class="row">
          <div style="font-size:30px">✖️</div>
          <div style="flex:1">
            <div style="font-size:16px;font-weight:900">Таблица умножения</div>
            <div style="font-size:12px;color:var(--ink-2);font-weight:700;margin-top:3px">
              ${mulProgress().done ? `Выучено чисел: ${mulProgress().done} из 8` : 'Отдельная тренировка по каждому числу'}</div>
          </div>
          <div style="font-size:20px">›</div>
        </div>
      </button>` : ''}

      ${p.level === 'pre' ? `
      <button class="card mt16" id="btnReady" style="width:100%;text-align:left;cursor:pointer;color:var(--ink);font-family:inherit;
               background:linear-gradient(135deg,rgba(61,220,151,.22),rgba(34,176,122,.12));border-color:rgba(61,220,151,.4)">
        <div class="row">
          <div style="font-size:30px">🎒</div>
          <div style="flex:1">
            <div style="font-size:16px;font-weight:900">Я готов к школе!</div>
            <div style="font-size:12px;color:var(--ink-2);font-weight:700;margin-top:3px">
              ${p.readyDone ? 'Пройдено — посмотреть отчёт' : 'Проверим все навыки перед первым классом'}</div>
          </div>
          <div style="font-size:20px">›</div>
        </div>
      </button>` : ''}

      ${near.length ? `<div class="h-sec">Продолжить обучение</div>
        ${near.map(r=>`
          <button class="skill-row" data-go="${r.tp.id}">
            <div class="sq" style="background:${r.tp.bg}">${r.tp.em}</div>
            <div class="grow">
              <div class="sname">${esc(r.tp.title)}</div>
              <div class="bar mt8" style="height:7px"><i style="width:${r.m}%"></i></div>
            </div>
            <div style="font-weight:900;font-size:13px">${r.m}%</div>
          </button>`).join('')}` : ''}

      <div class="h-sec">Сегодня</div>
      <div class="res-grid" style="margin:0">
        <div class="res-cell"><div class="v">${d.tasks}</div><div class="l">решено</div></div>
        <div class="res-cell"><div class="v" style="color:var(--mint)">${d.right}</div><div class="l">правильно</div></div>
      </div>
      <div style="height:8px"></div>
    </div>`);

  root().addEventListener('click', e=>{
    const el = e.target.closest('[data-go]'); if(!el) return;
    App.topic = { level:p.level, topic: CURRICULUM[p.level].find(t=>t.id === el.dataset.go) };
    App.tab = 'map'; go('topic');
  });

  $('#btnDaily').onclick  = ()=> startSession(buildDaily(p.level, 10), 'daily');
  $('#tContinue').onclick = ()=> go('map');
  $('#tWeak').onclick     = ()=>{
    const wk = weakestSkill(p.level);
    if(!wk){ toast('Сначала реши несколько заданий'); return; }
    startSession(buildSkill(wk.level, wk.topic, wk.skill, 8), 'skill');
  };
  $('#tVoice').onclick    = ()=> go('voice');
  $('#btnSet').onclick    = openSettings;
  $('#btnProfile').onclick= openSettings;
  const br = $('#btnReady'); if(br) br.onclick = ()=> startSession(buildReadiness(), 'ready');
  const bm = $('#btnMul');   if(bm) bm.onclick = ()=> go('mul');
}

/* ==========================================================================
   КАРТА
   ========================================================================== */
function scrMap(){
  const p = P();
  const lvId = App.mapLevel || p.level;
  const list = CURRICULUM[lvId] || [];

  setHTML(`
    <div class="topbar">
      <div class="grow"><div class="screen-title">Карта обучения</div>
        <div class="logo-sub">Математический город</div></div>
      <span class="counter">⭐ ${p.stars}</span>
    </div>
    <div class="level-pills">
      ${LEVELS.map(l=>{
        const open = levelUnlocked(l.id);
        return `<button class="lpill${l.id===lvId?' on':''}${open?'':' lock'}" data-l="${l.id}">
          ${l.em} ${l.id==='pre'?'Предшкола':l.short}${open?'':' 🔒'}</button>`;
      }).join('')}
    </div>
    <div class="map-scroll">
      <div class="islands">
        ${list.map((tp,i)=>{
          const open = levelUnlocked(lvId) && topicUnlocked(lvId, i);
          const m = topicMastery(lvId, tp);
          return `<button class="island${open?'':' locked'}" data-t="${tp.id}" style="background:${tp.bg}">
            <div class="ring"></div>
            ${open?'':'<div class="lockicon">🔒</div>'}
            <div style="position:relative;z-index:1">
              <div class="em">${tp.em}</div>
              <div class="nm">${esc(tp.title)}</div>
            </div>
            <div style="position:relative;z-index:1">
              <div class="bar" style="background:rgba(0,0,0,.25)"><i style="width:${m}%;background:#fff"></i></div>
              <div class="pr">${m}%</div>
            </div>
          </button>`;
        }).join('')}
      </div>
      <div style="height:16px"></div>
    </div>`);

  $('.level-pills').onclick = e=>{
    const el = e.target.closest('.lpill'); if(!el) return;
    if(!levelUnlocked(el.dataset.l)){ toast('Этот класс пока закрыт'); return; }
    App.mapLevel = el.dataset.l; scrMap();
  };
  $('.islands').onclick = e=>{
    const el = e.target.closest('.island'); if(!el) return;
    if(el.classList.contains('locked')){ toast('Сначала пройди предыдущую тему'); return; }
    App.topic = { level:lvId, topic: list.find(t=>t.id === el.dataset.t) };
    go('topic');
  };
}

/* ==========================================================================
   ТЕМА
   ========================================================================== */
function scrTopic(){
  const { level, topic } = App.topic;
  const p = P();
  setHTML(`
    <div class="topbar">
      <button class="icon-btn" id="bBack">←</button>
      <div class="grow"><div class="screen-title">${esc(topic.title)}</div>
        <div class="logo-sub">${esc(topic.desc)}</div></div>
      <div style="font-size:30px">${topic.em}</div>
    </div>
    <div class="scroll">
      <button class="btn full mb16" id="bTrain">Тренировать тему</button>
      ${topic.skills.map(sk=>{
        const key = skillKey(level, topic.id, sk.id);
        const s = p.skills[key];
        const st = s ? starsOf(s.m) : 0;
        const d  = s ? s.d : 1;
        return `<button class="skill-row" data-s="${sk.id}">
          <div class="sq" style="background:${topic.bg}">${st>=5?'✓':st||'•'}</div>
          <div class="grow">
            <div class="sname">${esc(sk.title)}</div>
            <div class="smeta">${s ? `решено ${s.right + s.wrong}` : 'ещё не начинали'}</div>
          </div>
          <div style="text-align:right">
            ${starRow(st)}
            <div class="diff-dots" style="justify-content:flex-end;margin-top:6px">
              <span class="dot${d>=1?' on':''}"></span>
              <span class="dot${d>=2?' on m':''}"></span>
              <span class="dot${d>=3?' on h':''}"></span>
            </div>
          </div>
        </button>`;
      }).join('')}
      <div style="height:10px"></div>
    </div>`);

  $('#bBack').onclick = ()=> go('map');
  $('#bTrain').onclick = ()=> startSession(buildTopic(level, topic, 10), 'topic');
  root().onclick = e=>{
    const el = e.target.closest('.skill-row'); if(!el) return;
    const sk = topic.skills.find(x=>x.id === el.dataset.s);
    startSession(buildSkill(level, topic, sk, 8), 'skill');
  };
}

/* ==========================================================================
   ТАБЛИЦА УМНОЖЕНИЯ — отдельный раздел
   ========================================================================== */
function scrMul(){
  const pr = mulProgress();
  setHTML(`
    <div class="topbar">
      <button class="icon-btn" id="bBack">←</button>
      <div class="grow"><div class="screen-title">Таблица умножения</div>
        <div class="logo-sub">${pr.done ? `Выучено чисел: ${pr.done} из ${pr.total}` : 'Выбери число и тренируйся'}</div></div>
      <div style="font-size:30px">✖️</div>
    </div>
    <div class="scroll">
      <div class="card mb16">
        <div class="row mb8"><span style="font-size:14px;font-weight:800">Вся таблица</span>
          <span class="grow"></span><span style="font-weight:900">${pr.avg}%</span></div>
        <div class="bar"><i style="width:${pr.avg}%"></i></div>
      </div>
      <button class="btn full mb16" id="bAll">Тренировать всю таблицу</button>
      <div class="h-sec">Выбери число</div>
      <div class="tiles">
        ${MUL_SKILLS.map(sk=>{
          const m = mulMastery(sk), st = starsOf(m);
          return `<button class="tile" data-n="${sk.id}">
            <div class="ti" style="background:${MUL_TOPIC.bg}">${sk.n}</div>
            <div class="tt">на ${sk.n}</div>
            <div class="ts">${st>=5 ? 'выучено ✓' : m+'%'}</div>
          </button>`;
        }).join('')}
      </div>
      <div style="height:10px"></div>
    </div>`);

  $('#bBack').onclick = ()=> go('home');
  $('#bAll').onclick  = ()=> startSession(buildMul(MUL_ALL, 10), 'mul');
  root().onclick = e=>{
    const el = e.target.closest('[data-n]'); if(!el) return;
    startSession(buildMul(MUL_SKILLS.find(x=>x.id === el.dataset.n), 10), 'mul');
  };
}

/* ==========================================================================
   ТРЕНИРОВКА
   ========================================================================== */
function startSession(items, mode){
  if(!items || !items.length){ toast('Пока нет заданий'); return; }
  touchDay();
  App.ses = {
    items, mode, idx:0, right:0, wrong:0, combo:0, bestCombo:0,
    started: Date.now(), diag:[], task:null, phase:'q', retry:false, t0:0, locked:false
  };
  go('session');
}

function scrSession(){
  const s = App.ses;
  if(!s){ go('home'); return; }
  if(s.idx >= s.items.length){ finishSession(); return; }

  if(!s.retry) s.task = makeTask(s.items[s.idx]);
  const t = s.task;
  if(!t){ s.idx++; scrSession(); return; }

  s.t0 = Date.now();
  const pct = Math.round(s.idx / s.items.length * 100);
  const probe = (!s.retry && s.phase === 'q' && s.mode !== 'diag') ? Trainer.probeFor(t) : null;
  if(probe){ s.phase = 'probe'; s.probe = probe; }

  setHTML(`
    <div class="session-head">
      <button class="icon-btn" id="bPause">⏸</button>
      <div class="bar violet grow"><i style="width:${pct}%"></i></div>
      <div class="qnum">${Math.min(s.idx+1, s.items.length)}/${s.items.length}</div>
    </div>
    <div class="scroll" id="qArea"></div>
    <div id="feedback"></div>`, true);

  $('#bPause').onclick = pauseSheet;
  renderPhase();
}

function trainerBubble(text, mood){
  return `<div class="row mb16" style="align-items:flex-end;gap:6px">
      <div style="flex:0 0 auto;margin:0 -6px -8px -8px">${mascot(mood||'idle',84)}</div>
      <div class="bubble side grow"><div class="who">Тренер</div>${esc(text)}</div>
    </div>`;
}

function renderPhase(){
  const s = App.ses, t = s.task, area = $('#qArea');

  /* ---- «Покажи, как ты думаешь» ---- */
  if(s.phase === 'probe'){
    const pr = s.probe;
    area.innerHTML = `
      ${trainerBubble(t.q, 'think')}
      <div class="q-text">${esc(pr.q)}</div>
      <div class="options ${optCols(pr.options)}">${pr.options.map(optHTML).join('')}</div>`;
    Speech.say(t.say + ' ' + pr.say);
    area.querySelectorAll('.opt').forEach(b=> b.onclick = ()=>{
      if(s.locked) return;
      const ok = b.dataset.v === pr.answer;
      b.classList.add(ok ? 'right' : 'wrong');
      if(ok){
        s.locked = true;
        Speech.say('Верно! Теперь посчитай.');
        setTimeout(()=>{ s.locked = false; s.phase = 'q'; renderPhase(); }, 700);
      } else {
        Speech.say(pr.wrongSay);
        toast(pr.wrongSay);
        setTimeout(()=>b.classList.remove('wrong'), 900);
      }
    });
    return;
  }

  /* ---- вопрос ---- */
  const chips = `<div class="row mb12" style="gap:8px">
      <span class="counter" style="font-size:12px;padding:6px 12px">${t.topicEm} ${esc(t.topicTitle)}</span>
      <span class="grow"></span>
      ${s.combo >= 2 ? `<span class="counter" style="font-size:12px;padding:6px 12px">🔥 ${s.combo}</span>` : ''}
    </div>`;
  /* вопрос произносит тренер — он всегда рядом с ребёнком */
  const bubble = trainerBubble(s.retry ? 'Попробуй похожее. ' + t.q : t.q, s.retry ? 'happy' : 'idle');

  area.innerHTML = chips + bubble + renderBody(t);
  if(!s.retry) Speech.say(t.say || t.q);
  bindBody(t);
}

/* ---------- отрисовка механик ---------- */
const qcard = v => { const h = drawVisual(v); return h ? `<div class="qcard">${h}</div>` : ''; };

function renderBody(t){
  switch(t.kind){
    case 'input':
      return qcard(t.visual) + `
        <div class="answers">
        <div class="answer-box" id="ansBox">?</div>
        <div class="keypad">
          ${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="key" data-k="${n}">${n}</button>`).join('')}
          <button class="key sm" data-k="del">⌫<span>Стереть</span></button>
          <button class="key" data-k="0">0</button>
          <button class="key act sm" data-k="ok">✓<span>Готово</span></button>
        </div></div>`;

    case 'tapCount':
    case 'tapRemove':
      return `<div class="qcard">${drawVisual(t.visual)}
        <div class="center muted" id="tapInfo" style="font-size:14px;padding-bottom:14px">Отмечено: 0</div></div>
        <div class="answers"><button class="btn full" id="tapDone">Готово</button></div>`;

    case 'parts':
      return `<div class="qcard" style="padding-bottom:18px"><div class="slots" style="margin-top:0">
          <div class="slot" data-s="0">?</div>
          <div style="font-size:30px;font-weight:900">+</div>
          <div class="slot" data-s="1">?</div>
          <div style="font-size:30px;font-weight:900">=</div>
          <div class="slot filled" style="border-style:solid;border-color:var(--mint);background:rgba(61,220,151,.18)">${t.total}</div>
        </div></div>
        <div class="answers">
        <div class="chips">${t.chips.map(c=>`<div class="chip" data-c="${c}">${c}</div>`).join('')}</div>
        <button class="btn full mt16" id="partsDone">Готово</button></div>`;

    case 'match': {
      const left  = t.pairs.map((p,i)=>({ t:p[0], i }));
      const right = shuffle(t.pairs.map((p,i)=>({ t:p[1], i })));
      return `<div class="match-wrap answers">
        <div class="match-col">${left.map(x=>`<button class="opt text" data-side="l" data-i="${x.i}">${esc(x.t)}</button>`).join('')}</div>
        <div class="match-col">${right.map(x=>`<button class="opt text" data-side="r" data-i="${x.i}">${esc(x.t)}</button>`).join('')}</div>
      </div>`;
    }

    case 'memory':
      return `<div id="memStage" style="display:flex;flex-direction:column;flex:1"><div class="qcard">${drawVisual(t.visual)}
        <div class="center muted" id="memTimer" style="font-size:14px;padding-bottom:14px">Запоминай...</div></div></div>`;

    default: {
      const opts = t.options && t.options.length ? t.options : numChoices(Number(t.answer));
      const card = qcard(t.visual);
      return card + `<div class="options answers ${card?'':'only'} ${optCols(opts)}">${opts.map(optHTML).join('')}</div>`;
    }
  }
}

/* ---------- обработка ответов ---------- */
function bindBody(t){
  const s = App.ses, area = $('#qArea');

  if(t.kind === 'input'){
    let val = '';
    const box = $('#ansBox');
    area.querySelectorAll('.key').forEach(k=> k.onclick = ()=>{
      if(s.locked) return;
      const v = k.dataset.k;
      if(v === 'del') val = val.slice(0,-1);
      else if(v === 'ok'){
        /* пустое «Готово» без ответа выглядит как поломка — говорим, чего ждём */
        if(val === '') toast('Набери ответ на кнопках');
        else answer(val);
        return;
      }
      else if(val.length < 7) val += v;
      box.textContent = val === '' ? '?' : val;
    });
    return;
  }

  if(t.kind === 'tapCount' || t.kind === 'tapRemove'){
    let picked = 0;
    const info = $('#tapInfo');
    area.querySelectorAll('.item.tappable').forEach(el=> el.onclick = ()=>{
      if(s.locked) return;
      const on = el.classList.toggle(t.kind === 'tapRemove' ? 'gone' : 'picked');
      picked += on ? 1 : -1;
      info.textContent = (t.kind === 'tapRemove' ? 'Убрано: ' : 'Отмечено: ') + picked;
      if(t.kind === 'tapRemove') el.style.pointerEvents = on ? 'none' : '';
    });
    $('#tapDone').onclick = ()=>{
      if(s.locked) return;
      if(t.kind === 'tapCount') return answer(String(picked));
      if(picked !== t.need){ toast(`Нужно убрать ровно ${t.need}`); Speech.say(`Убери ровно ${t.need}`); return; }
      /* второй шаг: сколько осталось */
      const opts = numChoices(Number(t.answer));
      $('#qArea').innerHTML = trainerBubble('А сколько осталось?', 'idle') +
        qcard({ t:'items', list: t.visual.list.slice(0, t.visual.list.length - t.need) }) +
        `<div class="options answers ${optCols(opts)}">${opts.map(optHTML).join('')}</div>`;
      Speech.say('А сколько осталось?');
      $('#qArea').querySelectorAll('.opt').forEach(b=> b.onclick = ()=> answer(b.dataset.v, b));
    };
    return;
  }

  if(t.kind === 'parts'){
    bindParts(t);
    return;
  }

  if(t.kind === 'match'){
    let sel = null, done = 0, errs = 0;
    area.querySelectorAll('.opt').forEach(b=> b.onclick = ()=>{
      if(s.locked || b.classList.contains('right')) return;
      if(b.dataset.side === 'l'){
        area.querySelectorAll('[data-side=l]').forEach(x=>x.classList.remove('sel'));
        b.classList.add('sel'); sel = b; return;
      }
      if(!sel){ toast('Сначала выбери пример слева'); return; }
      if(sel.dataset.i === b.dataset.i){
        sel.classList.remove('sel'); sel.classList.add('right'); b.classList.add('right');
        sel = null; done++;
        if(done === t.pairs.length) answer('match');
      } else {
        b.classList.add('wrong'); errs++;
        setTimeout(()=>b.classList.remove('wrong'), 500);
        if(errs >= 3) answer('wrong');
      }
    });
    return;
  }

  if(t.kind === 'memory'){
    const stage = $('#memStage');
    let left = Math.ceil((t.showMs||3000)/1000);
    const tick = setInterval(()=>{
      left--;
      const tm = $('#memTimer');
      if(tm) tm.textContent = left > 0 ? `Запоминай... ${left}` : 'Готово!';
      if(left <= 0) clearInterval(tick);
    }, 1000);
    setTimeout(()=>{
      clearInterval(tick);
      if(!$('#memStage')) return;
      const opts = t.options && t.options.length ? t.options : numChoices(Number(t.answer));
      stage.innerHTML = (t.visual2 ? qcard(t.visual2) : '') +
        `<div class="q-text">${esc(t.q)}</div>` +
        `<div class="options answers ${optCols(opts)}">${opts.map(optHTML).join('')}</div>`;
      Speech.say(t.q);
      stage.querySelectorAll('.opt').forEach(b=> b.onclick = ()=> answer(b.dataset.v, b));
    }, t.showMs || 3000);
    return;
  }

  /* choice */
  area.querySelectorAll('.opt').forEach(b=> b.onclick = ()=> answer(b.dataset.v, b));
}

/* перетаскивание карточек в состав числа */
function bindParts(t){
  const s = App.ses, area = $('#qArea');
  const slots = [...area.querySelectorAll('.slot[data-s]')];
  const filled = [null, null];

  const place = (val, chip, idx)=>{
    if(idx === undefined) idx = filled[0] === null ? 0 : filled[1] === null ? 1 : -1;
    if(idx < 0){ toast('Обе части уже заполнены'); return; }
    if(filled[idx]) filled[idx].chip.classList.remove('used');
    filled[idx] = { val, chip };
    chip.classList.add('used');
    slots[idx].textContent = val;
    slots[idx].classList.add('filled');
  };
  slots.forEach((sl,i)=> sl.onclick = ()=>{
    if(!filled[i]) return;
    filled[i].chip.classList.remove('used');
    filled[i] = null; sl.textContent = '?'; sl.classList.remove('filled');
  });

  area.querySelectorAll('.chip').forEach(chip=>{
    let ghost = null, moved = false, sx = 0, sy = 0;
    chip.onpointerdown = e=>{
      if(s.locked || chip.classList.contains('used')) return;
      moved = false; sx = e.clientX; sy = e.clientY;
      try{ chip.setPointerCapture(e.pointerId); }catch(err){}
      const move = ev=>{
        if(Math.abs(ev.clientX-sx) < 6 && Math.abs(ev.clientY-sy) < 6) return;
        if(!ghost){
          moved = true;
          ghost = chip.cloneNode(true);
          ghost.classList.add('drag');
          document.body.appendChild(ghost);
        }
        ghost.style.left = (ev.clientX-32) + 'px';
        ghost.style.top  = (ev.clientY-32) + 'px';
        slots.forEach(sl=>{
          const r = sl.getBoundingClientRect();
          sl.classList.toggle('over', ev.clientX>r.left && ev.clientX<r.right && ev.clientY>r.top && ev.clientY<r.bottom);
        });
      };
      const up = ev=>{
        chip.removeEventListener('pointermove', move);
        chip.removeEventListener('pointerup', up);
        if(ghost){ ghost.remove(); ghost = null; }
        let idx;
        slots.forEach((sl,i)=>{
          sl.classList.remove('over');
          const r = sl.getBoundingClientRect();
          if(ev.clientX>r.left && ev.clientX<r.right && ev.clientY>r.top && ev.clientY<r.bottom) idx = i;
        });
        if(!moved) place(chip.dataset.c, chip);
        else if(idx !== undefined) place(chip.dataset.c, chip, idx);
      };
      chip.addEventListener('pointermove', move);
      chip.addEventListener('pointerup', up);
    };
  });

  $('#partsDone').onclick = ()=>{
    if(s.locked) return;
    if(!filled[0] || !filled[1]){ toast('Заполни обе части'); Speech.say('Поставь две карточки'); return; }
    const sum = Number(filled[0].val) + Number(filled[1].val);
    answer(String(sum), null, `${filled[0].val} + ${filled[1].val}`);
  };
}

/* ---------- проверка ответа ---------- */
function answer(given, btn, shown){
  const s = App.ses, t = s.task;
  if(s.locked) return;
  s.locked = true;

  const ok = String(given) === String(t.answer);
  const ms = Date.now() - s.t0;
  const mistake = recordAnswer(t.key, t, given, ok, ms);

  if(btn){
    btn.classList.add(ok ? 'right' : 'wrong');
    if(!ok) $$('#qArea .opt').forEach(b=>{ if(b.dataset.v === String(t.answer)) b.classList.add('right'); });
  }
  if(t.kind === 'input'){
    const box = $('#ansBox');
    if(box){ box.classList.add(ok ? 'right' : 'wrong'); box.textContent = given; }
  }

  if(s.mode === 'diag' || s.mode === 'ready') s.diag.push({ item: s.items[s.idx], ok });

  if(ok){
    if(!s.retry){
      s.right++; s.combo++;
      s.bestCombo = Math.max(s.bestCombo, s.combo);
      P().bestCombo = Math.max(P().bestCombo, s.combo);
      award(2, 0, 0);
    }
    const msg = s.retry ? Trainer.back() : Trainer.praise(s.combo);
    Speech.say(msg);
    showQuick(msg, 'cheer');
    if(btn){ const r = btn.getBoundingClientRect(), pr = $('#phone').getBoundingClientRect();
             flyReward('⭐', r.left - pr.left + r.width/2, r.top - pr.top); }
    setTimeout(()=>{
      s.locked = false;
      if(s.retry){ s.retry = false; s.idx++; }
      else s.idx++;
      s.phase = 'q';
      Store.save();
      scrSession();
    }, 1100);
    return;
  }

  /* ошибка */
  if(!s.retry){ s.wrong++; s.combo = 0; }
  Store.save();

  /* на диагностике не учим, а измеряем — иначе она растянется и исказит результат */
  if(s.mode === 'diag' || s.mode === 'ready'){
    const msg = 'Ничего страшного, идём дальше.';
    Speech.say(msg); showQuick(msg, 'idle');
    setTimeout(()=>{ s.locked = false; s.idx++; s.phase = 'q'; scrSession(); }, 1000);
    return;
  }
  showExplain(t, given, mistake, shown);
}

function showQuick(msg, mood){
  $('#feedback').innerHTML = `
    <div style="position:absolute;left:0;right:0;bottom:0;padding:14px var(--safe) 18px;
                background:linear-gradient(180deg,transparent,rgba(14,8,36,.9) 40%)">
      ${trainerBubble(msg, mood)}
    </div>`;
  const b = $('#feedback .row'); if(b) b.style.marginBottom = '0';
}

function showExplain(t, given, mistake, shown){
  const s = App.ses;
  const ex = Trainer.explain(t, given);
  const info = MISTAKES[ex.type];
  $('#feedback').innerHTML = `
    <div class="sheet on">
      <div class="sheet-card" style="text-align:left">
        <div class="center mb12">${mascot('oops',96,'shake')}</div>
        <div style="font-size:18px;font-weight:900;text-align:center">${esc(ex.title)}</div>
        ${shown ? `<div class="center muted mt8" style="font-size:13px">Ты собрал: ${esc(shown)}</div>` : ''}
        <div class="card mt16" style="background:rgba(255,255,255,.08);padding:14px">
          ${ex.lines.map(l=>`<div style="font-size:14px;font-weight:700;line-height:1.45;margin-bottom:7px">• ${esc(l)}</div>`).join('')}
          <div style="font-size:14px;font-weight:900;color:var(--mint);margin-top:6px">Ответ: ${esc(t.answer)}</div>
        </div>
        ${info ? `<div class="center muted mt12" style="font-size:12px">${esc(info.name)} · ${esc(ex.hint||'')}</div>` : ''}
        <button class="btn full mt16" id="exNext">Понятно, попробую похожее</button>
      </div>
    </div>`;
  Speech.say(ex.title + ' ' + ex.lines.join(' '));

  $('#exNext').onclick = ()=>{
    Speech.stop();
    s.locked = false;
    $('#feedback').innerHTML = '';
    if(s.retry){ s.retry = false; s.idx++; s.phase = 'q'; scrSession(); return; }
    /* похожее задание полегче — закрепляем и возвращаемся в маршрут */
    const it = s.items[s.idx];
    const sk = getSkill(it.key);
    s.task = makeTask(it, Math.max(1, sk.d - 1));
    s.retry = true; s.phase = 'q';
    scrSession();
  };
}

/* пауза */
function pauseSheet(){
  Speech.stop();
  $('#feedback').innerHTML = `
    <div class="sheet on">
      <div class="sheet-card">
        <div class="mb12">${mascot('idle',96)}</div>
        <div style="font-size:19px;font-weight:900">Пауза</div>
        <div class="muted mt8" style="font-size:14px">Решено ${App.ses.idx} из ${App.ses.items.length}</div>
        <button class="btn full mt16" id="pOn">Продолжить</button>
        <button class="btn ghost full mt12" id="pOff">Завершить</button>
      </div>
    </div>`;
  $('#pOn').onclick  = ()=>{ $('#feedback').innerHTML = ''; };
  $('#pOff').onclick = ()=>{ $('#feedback').innerHTML = ''; finishSession(true); };
}

/* ---------- итоги ---------- */
function finishSession(early){
  const s = App.ses, p = P();
  const total = s.right + s.wrong;
  const min = Math.max(1, Math.round((Date.now() - s.started)/60000));

  p.totalSessions++;
  if(total > 0 && s.wrong === 0) p.perfectSessions++;
  award(5, s.right, (total>0 && s.wrong===0) ? 1 : 0);

  if(s.mode === 'diag'){ p.diagDone = true; applyDiagnostic(s.diag); }
  if(s.mode === 'ready'){ p.readyDone = true; }
  const fresh = checkAchievements();
  Store.save();

  if(s.mode === 'diag')  return scrDiagReport(s.diag);
  if(s.mode === 'ready') return scrReadyReport(s.diag);

  const pct = total ? Math.round(s.right/total*100) : 0;
  setHTML(`
    <div class="scroll" style="padding-top:24px">
      <div class="center">${mascot(pct>=80?'cheer':'happy',132,'float')}</div>
      <h2 class="ob-title center mt16">${early?'Тренировка завершена':'Готово!'}</h2>
      <p class="ob-sub center">${esc(Trainer.summary(s.right, total))}</p>
      <div class="res-grid">
        <div class="res-cell"><div class="v">${total}</div><div class="l">решено</div></div>
        <div class="res-cell"><div class="v" style="color:var(--mint)">${s.right}</div><div class="l">правильно</div></div>
        <div class="res-cell"><div class="v" style="color:var(--yellow)">+${s.right*2+5}</div><div class="l">звёзд</div></div>
        <div class="res-cell"><div class="v" style="color:var(--orange)">🔥 ${p.streak}</div><div class="l">дней подряд</div></div>
      </div>
      <div class="card">
        <div class="row mb8"><span style="font-size:14px;font-weight:800">Точность</span>
          <span class="grow"></span><span style="font-weight:900">${pct}%</span></div>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <div class="muted mt12" style="font-size:13px">Занятие заняло около ${min} мин</div>
      </div>
      ${fresh.length ? `<div class="h-sec">Новые достижения</div>
        ${fresh.map(a=>`<div class="ach pop"><div class="em">${a.em}</div>
          <div><div class="nm">${esc(a.name)}</div><div class="ds">${esc(a.desc)}</div></div></div>`).join('')}` : ''}
      <button class="btn full mt16" id="rAgain">Ещё тренировка</button>
      <button class="btn ghost full mt12" id="rHome">${s.mode === 'mul' ? 'К таблице умножения' : 'На главную'}</button>
      <div style="height:10px"></div>
    </div>`, true);

  Speech.say(Trainer.summary(s.right, total));
  /* из таблицы умножения возвращаемся в неё же, а не в общий маршрут */
  $('#rAgain').onclick = ()=> s.mode === 'mul'
    ? startSession(s.items, 'mul')
    : startSession(buildDaily(p.level, 10), 'daily');
  $('#rHome').onclick  = ()=>{ const mul = s.mode === 'mul'; App.ses = null; go(mul ? 'mul' : 'home'); };
}

/* диагностика → расставляем стартовые уровни навыков */
function applyDiagnostic(list){
  list.forEach(r=>{
    const s = getSkill(r.item.key);
    s.m = r.ok ? 55 : 15;
    s.d = r.ok ? 2 : 1;
  });
  Store.save();
}

function scrDiagReport(list){
  const p = P();
  setHTML(`
    <div class="scroll" style="padding-top:24px">
      <div class="center">${mascot('happy',120,'float')}</div>
      <h2 class="ob-title center mt16">Вот что я увидел</h2>
      <p class="ob-sub center">Составил для тебя личный маршрут</p>
      ${list.map(r=>`
        <div class="skill-card mb8">
          <div class="ic" style="background:${r.item.topic.bg}">${r.item.topic.em}</div>
          <div class="grow"><div class="nm">${esc(r.item.topic.title)}</div>
            <div class="muted" style="font-size:12px">${r.ok?'хорошо получается':'потренируем'}</div></div>
          <div style="font-size:20px">${r.ok?'✅':'🔸'}</div>
        </div>`).join('')}
      <button class="btn full mt16" id="dGo">Начать обучение</button>
      <div style="height:10px"></div>
    </div>`, true);
  Speech.say('Я составил для тебя личный маршрут. Начнём!');
  $('#dGo').onclick = ()=>{ App.ses = null; go('home'); };
}

function scrReadyReport(list){
  const good = list.filter(r=>r.ok).length;
  setHTML(`
    <div class="scroll" style="padding-top:24px">
      <div class="center">${mascot('cheer',126,'float')}</div>
      <h2 class="ob-title center mt16">Что умеет ${esc(P().name)}</h2>
      <p class="ob-sub center">Это не оценка — это карта навыков перед школой</p>
      ${list.map(r=>`
        <div class="skill-card mb8">
          <div class="ic" style="background:${r.item.topic.bg}">${r.item.topic.em}</div>
          <div class="grow"><div class="nm">${esc(r.item.skill.title)}</div>
            <div class="muted" style="font-size:12px">${esc(r.item.topic.title)}</div></div>
          ${starRow(r.ok ? 5 : 2)}
        </div>`).join('')}
      <div class="card mt16">
        <div style="font-size:14px;font-weight:800;margin-bottom:8px">Что стоит потренировать</div>
        <div class="muted" style="font-size:13px;line-height:1.5">
          ${list.filter(r=>!r.ok).length
            ? list.filter(r=>!r.ok).map(r=>esc(r.item.skill.title)).join(', ') + '.'
            : 'Все навыки на хорошем уровне. Можно смело идти в первый класс!'}
        </div>
      </div>
      <button class="btn full mt16" id="rdGo">Хорошо</button>
      <div style="height:10px"></div>
    </div>`, true);
  Speech.say(`Ты справился с ${good} заданиями из ${list.length}. Молодец!`);
  $('#rdGo').onclick = ()=>{ App.ses = null; go('home'); };
}

/* ==========================================================================
   ПРОГРЕСС
   ========================================================================== */
let progTab = 'skills';
function scrProgress(){
  const p = P();
  const lv = p.level;
  setHTML(`
    <div class="topbar">
      <div class="grow"><div class="screen-title">Твой прогресс</div></div>
      <span class="counter">⭐ ${p.stars}</span>
    </div>
    <div class="scroll">
      <div class="seg">
        <button class="${progTab==='skills'?'on':''}" data-t="skills">Навыки</button>
        <button class="${progTab==='ach'?'on':''}" data-t="ach">Достижения</button>
      </div>
      <div id="progBody"></div>
    </div>`);
  $('.seg').onclick = e=>{
    const b = e.target.closest('button'); if(!b) return;
    progTab = b.dataset.t; scrProgress();
  };
  const body = $('#progBody');

  if(progTab === 'skills'){
    const rows = (CURRICULUM[lv]||[]).map(tp=>({ tp, m: topicMastery(lv, tp) }));
    body.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px">
        ${rows.map(r=>`
          <div class="skill-card">
            <div class="ic" style="background:${r.tp.bg}">${r.tp.em}</div>
            <div class="grow">
              <div class="nm">${esc(r.tp.title)}</div>
              ${starRow(Math.round(r.m/20))}
            </div>
          </div>`).join('')}
      </div>
      <div class="h-sec">Всего</div>
      <div class="res-grid" style="margin:0">
        <div class="res-cell"><div class="v">${p.totalRight}</div><div class="l">правильных ответов</div></div>
        <div class="res-cell"><div class="v">${p.totalSessions}</div><div class="l">тренировок</div></div>
        <div class="res-cell"><div class="v" style="color:var(--orange)">${p.bestStreak}</div><div class="l">лучшая серия дней</div></div>
        <div class="res-cell"><div class="v" style="color:var(--mint)">${p.bestCombo}</div><div class="l">подряд без ошибок</div></div>
      </div>
      <div style="height:10px"></div>`;
  } else {
    body.innerHTML = ACHIEVEMENTS.map(a=>{
      const has = p.achievements.includes(a.id);
      return `<div class="ach${has?'':' off'}">
        <div class="em">${has?a.em:'🔒'}</div>
        <div><div class="nm">${esc(a.name)}</div><div class="ds">${esc(a.desc)}</div></div>
      </div>`;
    }).join('') + '<div style="height:10px"></div>';
  }
}

/* ==========================================================================
   РОДИТЕЛЯМ
   ========================================================================== */
function scrParents(){
  const p = P();
  const s = parentSummary();
  const maxT = Math.max(1, ...s.week.map(d=>d.tasks));
  const pct = s.totalWeekTasks ? Math.round(s.totalWeekRight/s.totalWeekTasks*100) : 0;

  setHTML(`
    <div class="topbar">
      <div class="grow"><div class="screen-title">Родителям</div>
        <div class="logo-sub">${esc(p.name)} · ${esc(LEVELS.find(l=>l.id===p.level).title)}</div></div>
      <div style="font-size:26px">${p.avatar}</div>
    </div>
    <div class="scroll">
      <div class="p-block">
        <div class="p-h">За неделю</div>
        <div class="card">
          <div class="week">
            ${s.week.map(d=>`<div class="d">
              <div class="col" style="height:${Math.round(d.tasks/maxT*72)}px"></div>
              <div class="dl">${d.label}</div></div>`).join('')}
          </div>
          <div class="row mt16" style="gap:8px">
            <span class="counter">📝 ${s.totalWeekTasks} заданий</span>
            <span class="counter">✅ ${pct}%</span>
            <span class="counter">⏱ ${Math.round(s.totalWeekSec/60)} мин</span>
          </div>
        </div>
      </div>

      <div class="p-block">
        <div class="p-h">Что уже умеет</div>
        ${s.strong.length ? s.strong.map(r=>rowTopic(r)).join('')
          : `<div class="card muted" style="font-size:13px">Пока рано делать выводы — нужно больше занятий.</div>`}
      </div>

      <div class="p-block">
        <div class="p-h">Что изучает сейчас</div>
        ${s.now.length ? s.now.slice(0,4).map(r=>rowTopic(r)).join('')
          : `<div class="card muted" style="font-size:13px">Занятия ещё не начались.</div>`}
      </div>

      <div class="p-block">
        <div class="p-h">Что стоит потренировать</div>
        ${s.weak.length ? s.weak.slice(0,3).map(r=>rowTopic(r)).join('')
          : `<div class="card muted" style="font-size:13px">Слабых мест не видно.</div>`}
      </div>

      ${s.mist.length ? `
      <div class="p-block">
        <div class="p-h">Повторяющиеся ошибки</div>
        ${s.mist.map(m=>`<div class="card mb8">
          <div style="font-size:15px;font-weight:800">${esc(m.info.name)}</div>
          <div class="muted" style="font-size:13px;margin-top:4px">${esc(m.info.hint)}</div>
          <div class="muted" style="font-size:12px;margin-top:6px">встречалась ${m.n} раз</div>
        </div>`).join('')}
      </div>` : ''}

      <div style="height:10px"></div>
    </div>`);
}
function rowTopic(r){
  return `<div class="skill-card mb8">
    <div class="ic" style="background:${r.topic.bg}">${r.topic.em}</div>
    <div class="grow"><div class="nm">${esc(r.topic.title)}</div>
      <div class="bar mt8" style="height:7px"><i style="width:${r.m}%"></i></div></div>
    <div style="font-weight:900;font-size:13px">${r.m}%</div>
  </div>`;
}

/* ==========================================================================
   ГОЛОСОВОЙ РЕЖИМ
   ========================================================================== */
const Voice = { log: [], asked: null, listening: false };

function scrVoice(){
  setHTML(`
    <div class="topbar">
      <button class="icon-btn" id="vBack">←</button>
      <div class="grow"><div class="screen-title">Поговорить с тренером</div>
        <div class="logo-sub">${Listen.available ? 'Нажми на микрофон и говори' : 'Микрофон недоступен — набери ответ'}</div></div>
    </div>
    <div class="scroll" id="vLog">
      <div class="chatlog">${Voice.log.map(m=>`<div class="msg ${m.who}">${esc(m.text)}</div>`).join('')}</div>
    </div>
    <div style="flex:0 0 auto;padding:10px var(--safe) 16px;display:grid;place-items:center;gap:10px">
      <button class="mic" id="vMic">🎤</button>
      <div class="row" style="width:100%;gap:8px">
        <button class="btn ghost sm grow" id="vAsk">Задай мне пример</button>
        <button class="btn ghost sm grow" id="vType">Написать</button>
      </div>
    </div>`, true);

  $('#vBack').onclick = ()=>{ Listen.stop(); Speech.stop(); go('home'); };
  $('#vMic').onclick  = micToggle;
  $('#vAsk').onclick  = voiceAsk;
  $('#vType').onclick = ()=>{
    const t = prompt('Что сказать тренеру?');
    if(t) voiceHandle(t);
  };

  if(!Voice.log.length){
    const hi = `Привет, ${P().name}! Спроси меня что-нибудь, например: сколько будет семь плюс восемь. Или нажми «Задай мне пример».`;
    voiceSay(hi);
  }
  const l = $('#vLog'); l.scrollTop = l.scrollHeight;
}

function voicePush(who, text){
  Voice.log.push({ who, text });
  if(Voice.log.length > 40) Voice.log.shift();
  const box = $('.chatlog');
  if(box){
    box.insertAdjacentHTML('beforeend', `<div class="msg ${who}">${esc(text)}</div>`);
    const l = $('#vLog'); l.scrollTop = l.scrollHeight;
  }
}
function voiceSay(text){ voicePush('bot', text); Speech.say(text); }

function micToggle(){
  const mic = $('#vMic');
  if(Voice.listening){ Listen.stop(); Voice.listening = false; mic.classList.remove('rec'); return; }
  if(!Listen.available){ toast('Голосовой ввод работает в Edge и Chrome'); return; }
  Voice.listening = true; mic.classList.add('rec');
  Listen.start(
    text => voiceHandle(text),
    ()   => { Voice.listening = false; const m = $('#vMic'); if(m) m.classList.remove('rec'); }
  );
}

/* тренер сам задаёт пример */
function voiceAsk(){
  const p = P();
  const pool = allSkills(p.level).filter(it=>{
    const g = GEN[it.skill.gen];
    if(!g) return false;
    try { const t = g(it.skill.p||{}, getSkill(it.key).d); return t.kind === 'choice' || t.kind === 'input'; }
    catch(e){ return false; }
  });
  if(!pool.length){ voiceSay('Давай сначала позанимаемся на главном экране.'); return; }
  const it = pick(pool);
  const t = makeTask(it);
  Voice.asked = t;
  voiceSay(t.say || t.q);
}

function voiceHandle(text){
  voicePush('me', text);

  /* ребёнок отвечает на заданный тренером пример */
  if(Voice.asked){
    const t = Voice.asked;
    const n = parseNumber(text);
    const given = n === null ? text.trim().toLowerCase() : String(n);
    const ok = given === String(t.answer);
    recordAnswer(t.key, t, given, ok, 4000);
    Store.save();
    if(ok){
      Voice.asked = null;
      award(2, 0, 0);
      voiceSay(Trainer.praise(1) + ' Хочешь ещё пример?');
      return;
    }
    const ex = Trainer.explain(t, given);
    voiceSay(`${ex.title} ${ex.lines.join(' ')}`);
    /* похожее задание для закрепления */
    const sk = getSkill(t.key);
    const next = makeTask({ level:t.key.split('.')[0], topic:{ id:t.key.split('.')[1], title:t.topicTitle, em:t.topicEm, bg:t.bg },
                            skill: null, key:t.key }, Math.max(1, sk.d-1));
    setTimeout(()=>{
      const again = makeTaskByKey(t.key, Math.max(1, sk.d-1));
      if(again){ Voice.asked = again; voiceSay('Теперь попробуй похожий пример. ' + (again.say || again.q)); }
      else { Voice.asked = null; }
    }, 600);
    return;
  }

  /* свободный вопрос «сколько будет ...» */
  const e = parseExpression(text);
  if(e){
    voiceSay(`${e.nice}. ${voiceExplain(e)}`);
    return;
  }
  if(/пример|задач|спроси|задай/i.test(text)){ voiceAsk(); return; }
  if(/привет|здравств/i.test(text)){ voiceSay(Trainer.greet()); return; }
  if(/пока|хватит|стоп/i.test(text)){ voiceSay('Хорошо, до встречи! Заходи ещё.'); return; }
  voiceSay('Я умею считать и объяснять. Спроси, например: сколько будет шесть умножить на семь. Или скажи «задай пример».');
}

/* пересобрать задание того же навыка по ключу */
function makeTaskByKey(key, d){
  const [lv, tp, sk] = key.split('.');
  const topic = (CURRICULUM[lv]||[]).find(t=>t.id === tp);
  if(!topic) return null;
  const skill = topic.skills.find(s=>s.id === sk);
  if(!skill) return null;
  return makeTask({ level:lv, topic, skill, key }, d);
}

/* ==========================================================================
   НАСТРОЙКИ
   ========================================================================== */
function openSettings(){
  const p = P();
  $('#sheet').innerHTML = `
    <div class="sheet-card" style="text-align:left">
      <div class="center mb12" style="font-size:40px">${p.avatar}</div>
      <div class="center" style="font-size:19px;font-weight:900">${esc(p.name)}</div>
      <div class="center muted" style="font-size:13px">${esc(LEVELS.find(l=>l.id===p.level).title)}</div>

      <div class="h-sec" style="margin-bottom:8px">Класс</div>
      <div class="level-pills" style="padding:0;flex-wrap:wrap;gap:6px">
        ${LEVELS.map(l=>`<button class="lpill${l.id===p.level?' on':''}" data-set-l="${l.id}">${l.em} ${l.id==='pre'?'Предшкола':l.short}</button>`).join('')}
      </div>

      <div class="h-sec" style="margin-bottom:8px">Озвучка</div>
      <button class="btn ghost full" id="setVoice">${Speech.on?'🔊 Голос тренера включён':'🔇 Голос выключен'}</button>

      <button class="btn ghost full mt12" id="setNew">👤 Новый профиль</button>
      <button class="btn full mt16" id="setClose">Закрыть</button>
      <div class="center muted mt12" style="font-size:11px">Прогресс хранится в этом браузере</div>
    </div>`;
  $('#sheet').classList.add('on');

  $('#setClose').onclick = ()=> $('#sheet').classList.remove('on');
  $('#setVoice').onclick = ()=>{
    Speech.on = !Speech.on;
    if(!Speech.on) Speech.stop(); else Speech.say('Голос включён');
    openSettings();
  };
  $('#setNew').onclick = ()=>{
    $('#sheet').classList.remove('on');
    App.ob = { name:'', avatar:'🦊', level:null, step:0 };
    scrOnboarding();
  };
  $('#sheet').querySelectorAll('[data-set-l]').forEach(b=> b.onclick = ()=>{
    p.level = b.dataset.setL; App.mapLevel = null; Store.save();
    openSettings(); toast('Класс изменён');
  });
}

/* ==========================================================================
   РОУТЕР
   ========================================================================== */
function go(name){
  Speech.stop();
  App.screen = name;
  if(['home','map','progress','parents'].includes(name)) App.tab = name;
  $$('#tabbar .tab').forEach(t=> t.classList.toggle('on', t.dataset.s === App.tab));
  ({
    home: scrHome, map: scrMap, topic: scrTopic, session: scrSession,
    progress: scrProgress, parents: scrParents, voice: scrVoice, mul: scrMul
  }[name] || scrHome)();
}
