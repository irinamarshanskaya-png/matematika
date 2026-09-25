/* ==========================================================================
   core.js — профиль, прогресс, адаптивное обучение, анализ ошибок
   Всё состояние ребёнка живёт здесь. Экраны только читают и зовут методы.
   ========================================================================== */

const STORE_KEY = 'matika.v1';

const Store = {
  data: null,
  load(){
    try { this.data = JSON.parse(localStorage.getItem(STORE_KEY)) || null; }
    catch(e){ this.data = null; }
    if(!this.data) this.data = { profiles:[], current:null };
    return this.data;
  },
  save(){
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); }
    catch(e){ /* приватный режим — просто не сохраняем */ }
  }
};

const today = ()=> new Date().toISOString().slice(0,10);
const daysBetween = (a,b)=> Math.round((new Date(b) - new Date(a)) / 86400000);

function newProfile(name, avatar, level){
  return {
    id: 'p' + Date.now(),
    name, avatar, level,
    created: today(),
    stars: 0, coins: 0, keys: 0,
    skills: {},          // ключ → { m, d, right, wrong, recent:[] }
    mistakes: {},        // тип ошибки → сколько раз всего
    recent: [],          // последние ошибки: { type, key, at }
    days: {},            // дата → { tasks, right, sec }
    streak: 0, bestStreak: 0, lastDay: null,
    totalRight: 0, totalWrong: 0, totalSessions: 0, perfectSessions: 0,
    bestCombo: 0, totalCoins: 0,
    achievements: [],
    diagDone: false, readyDone: false
  };
}

const P = ()=> Store.data.profiles.find(p=>p.id === Store.data.current) || null;

/* -------------------------------------------------------------------------
   Навыки
   ------------------------------------------------------------------------- */
const skillKey = (lv,tp,sk)=> `${lv}.${tp}.${sk}`;

function getSkill(key){
  const p = P();
  if(!p.skills[key]) p.skills[key] = { m:0, d:1, right:0, wrong:0, recent:[] };
  return p.skills[key];
}
const starsOf = m => Math.max(0, Math.min(5, Math.round(m/20)));

/* Сложность подбирается автоматически: уверенно решает — усложняем,
   начал ошибаться — временно упрощаем. */
function tuneDifficulty(s){
  const last = s.recent.slice(-4);
  if(last.length >= 3){
    const bad = last.filter(x=>!x).length;
    if(bad === 0 && s.d < 3 && s.m >= s.d*30) s.d++;
    else if(bad >= 2 && s.d > 1) s.d--;
  }
}

/* -------------------------------------------------------------------------
   Разбор ошибки: почему ребёнок ответил именно так
   ------------------------------------------------------------------------- */
function classify(task, given){
  if(task.mmap && task.mmap[given]) return task.mmap[given];
  const a = Number(task.answer), g = Number(given);
  if(!isNaN(a) && !isNaN(g)){
    if(Math.abs(a-g) === 1) return 'off_one';
    if(Math.abs(a-g) === 10) return task.mtype === 'count' ? 'carry' : 'place';
  }
  return task.mtype || 'attention';
}

/* -------------------------------------------------------------------------
   Запись ответа
   ------------------------------------------------------------------------- */
function recordAnswer(key, task, given, ok, ms){
  const p = P(), s = getSkill(key);
  s.recent.push(ok ? 1 : 0);
  if(s.recent.length > 8) s.recent.shift();

  if(ok){
    s.right++; p.totalRight++;
    s.m = Math.min(100, s.m + [0,7,9,11][s.d]);
  } else {
    s.wrong++; p.totalWrong++;
    s.m = Math.max(0, s.m - 6);
    const type = classify(task, given);
    p.mistakes[type] = (p.mistakes[type]||0) + 1;
    p.recent.unshift({ type, key, at: Date.now() });
    if(p.recent.length > 40) p.recent.pop();
  }
  tuneDifficulty(s);

  const d = today();
  if(!p.days[d]) p.days[d] = { tasks:0, right:0, sec:0 };
  p.days[d].tasks++;
  if(ok) p.days[d].right++;
  p.days[d].sec += Math.min(120, Math.round(ms/1000));
  return ok ? null : classify(task, given);
}

/* серия дней */
function touchDay(){
  const p = P(), d = today();
  if(p.lastDay === d) return;
  if(p.lastDay && daysBetween(p.lastDay, d) === 1) p.streak++;
  else p.streak = 1;
  p.lastDay = d;
  p.bestStreak = Math.max(p.bestStreak, p.streak);
}

function award(stars, coins, keys){
  const p = P();
  p.stars += stars||0;
  p.coins += coins||0;
  p.keys  += keys||0;
  p.totalCoins += coins||0;
  Store.save();
}

/* -------------------------------------------------------------------------
   Достижения
   ------------------------------------------------------------------------- */
function masteredCount(){
  const p = P();
  return Object.values(p.skills).filter(s=>starsOf(s.m) >= 5).length;
}
function checkAchievements(){
  const p = P();
  const snap = Object.assign({}, p, { masteredSkills: masteredCount() });
  const fresh = [];
  ACHIEVEMENTS.forEach(a=>{
    if(!p.achievements.includes(a.id) && a.test(snap)){
      p.achievements.push(a.id); fresh.push(a);
    }
  });
  if(fresh.length) Store.save();
  return fresh;
}

/* -------------------------------------------------------------------------
   Открытие тем и уровней
   ------------------------------------------------------------------------- */
function topicMastery(levelId, topic){
  const p = P();
  let sum = 0;
  topic.skills.forEach(sk=>{
    const s = p.skills[skillKey(levelId, topic.id, sk.id)];
    sum += s ? s.m : 0;
  });
  return Math.round(sum / topic.skills.length);
}

function topicUnlocked(levelId, idx){
  if(idx < 2) return true;
  const list = CURRICULUM[levelId];
  return topicMastery(levelId, list[idx-1]) >= 25;
}

function levelUnlocked(levelId){
  const p = P();
  const my = LEVELS.find(l=>l.id === p.level);
  const it = LEVELS.find(l=>l.id === levelId);
  return it.grade <= my.grade;
}

/* -------------------------------------------------------------------------
   Подбор заданий
   ------------------------------------------------------------------------- */
function allSkills(levelId){
  const out = [];
  (CURRICULUM[levelId]||[]).forEach((tp, ti)=>{
    if(!topicUnlocked(levelId, ti)) return;
    tp.skills.forEach(sk=>{
      out.push({ level:levelId, topic:tp, skill:sk, key:skillKey(levelId,tp.id,sk.id) });
    });
  });
  return out;
}

/* какая ошибка повторяется чаще всего в последних ответах */
function weakMistake(){
  const p = P();
  const cnt = {};
  p.recent.slice(0,14).forEach(r=> cnt[r.type] = (cnt[r.type]||0)+1 );
  let best = null, n = 0;
  for(const k in cnt) if(cnt[k] > n){ n = cnt[k]; best = k; }
  return n >= 3 ? best : null;
}

/* самый слабый навык — для кнопки «Потренировать слабое место» */
function weakestSkill(levelId){
  const list = allSkills(levelId).map(it=>{
    const s = P().skills[it.key];
    return { it, m: s ? s.m : -1, touched: !!s };
  }).filter(x=>x.touched);
  if(!list.length) return null;
  list.sort((a,b)=> a.m - b.m);
  return list[0].it;
}

/* Задание = описание навыка + сгенерированный вопрос */
function makeTask(it, forceD){
  const s = getSkill(it.key);
  const d = forceD || s.d;
  const gen = GEN[it.skill.gen];
  if(!gen) return null;
  const t = gen(it.skill.p || {}, d);
  t.key = it.key;
  t.skillTitle = it.skill.title;
  t.topicTitle = it.topic.title;
  t.topicEm = it.topic.em;
  t.bg = it.topic.bg;
  t.d = d;
  return t;
}

/* Тренировка «5 минут математики»:
   слабые места + текущие темы + немного повторения + новое */
function buildDaily(levelId, count){
  count = count || 10;
  const pool = allSkills(levelId);
  if(!pool.length) return [];
  const p = P();
  const mt = weakMistake();

  const scored = pool.map(it=>{
    const s = p.skills[it.key];
    let score = 10;
    if(!s) score += 25;                       // новое — интересно
    else {
      score += Math.max(0, 70 - s.m) * 0.9;   // слабое — важнее
      if(s.m >= 95) score -= 45;              // освоенное — только для повторения
      const bad = s.recent.slice(-3).filter(x=>!x).length;
      score += bad * 18;
    }
    if(mt){
      const probe = GEN[it.skill.gen] ? (()=>{ try{ return GEN[it.skill.gen](it.skill.p||{},1).mtype; }catch(e){ return null; } })() : null;
      if(probe === mt) score += 40;           // тренируем повторяющуюся ошибку
    }
    return { it, score: Math.max(1, score) };
  });

  const out = [], used = {};
  for(let i=0; i<count && scored.length; i++){
    const total = scored.reduce((s,x)=> s + x.score / (1 + (used[x.it.key]||0)*3), 0);
    let r = Math.random()*total, choice = scored[0];
    for(const x of scored){
      r -= x.score / (1 + (used[x.it.key]||0)*3);
      if(r <= 0){ choice = x; break; }
    }
    used[choice.it.key] = (used[choice.it.key]||0) + 1;
    out.push(choice.it);
  }
  return out;
}

/* Тренировка по конкретной теме или навыку */
function buildTopic(levelId, topic, count){
  count = count || 10;
  const pool = topic.skills.map(sk=>({ level:levelId, topic, skill:sk, key:skillKey(levelId,topic.id,sk.id) }));
  const out = [];
  for(let i=0;i<count;i++) out.push(pool[i % pool.length]);
  return shuffle(out);
}
/* таблица умножения: ключ навыка и прогресс по каждому числу */
const mulKey = sk => skillKey(MUL_LEVEL, MUL_TOPIC.id, sk.id);
const mulMastery = sk => (P().skills[mulKey(sk)] || { m:0 }).m;
function mulProgress(){
  const list = MUL_SKILLS.map(mulMastery);
  return {
    avg: Math.round(list.reduce((a,b)=>a+b,0) / list.length),
    done: list.filter(m=> starsOf(m) >= 5).length,
    total: list.length
  };
}
function buildMul(skill, count){
  return Array.from({length:count||10}, ()=>(
    { level:MUL_LEVEL, topic:MUL_TOPIC, skill, key:mulKey(skill) }
  ));
}

function buildSkill(levelId, topic, skill, count){
  const it = { level:levelId, topic, skill, key:skillKey(levelId,topic.id,skill.id) };
  return Array.from({length:count||8}, ()=>it);
}

/* Диагностика: по одному заданию из каждой темы, средняя сложность */
function buildDiagnostic(levelId){
  const out = [];
  (CURRICULUM[levelId]||[]).forEach(tp=>{
    const sk = tp.skills[Math.min(1, tp.skills.length-1)];
    out.push({ level:levelId, topic:tp, skill:sk, key:skillKey(levelId,tp.id,sk.id), diag:true });
  });
  return out;
}

/* Выпускной тест предшколы */
function buildReadiness(){
  const want = [['count','c10'],['count','cback'],['compare','more'],['compose','cmp10'],
                ['add','a10'],['sub','s10'],['shapes','sname'],['seq','qcol'],
                ['logic','odd'],['space','btw'],['memory','gone'],['time','part']];
  const out = [];
  want.forEach(([t,s])=>{
    const tp = PRE.find(x=>x.id===t); if(!tp) return;
    const sk = tp.skills.find(x=>x.id===s); if(!sk) return;
    out.push({ level:'pre', topic:tp, skill:sk, key:skillKey('pre',t,s), ready:true });
  });
  return out;
}

/* -------------------------------------------------------------------------
   Сводка для родителей
   ------------------------------------------------------------------------- */
function parentSummary(){
  const p = P();
  const levelId = p.level;
  const rows = (CURRICULUM[levelId]||[]).map(tp=>({
    topic: tp, m: topicMastery(levelId, tp)
  }));
  const strong = rows.filter(r=>r.m >= 70).sort((a,b)=>b.m-a.m);
  const now    = rows.filter(r=>r.m > 0 && r.m < 70).sort((a,b)=>b.m-a.m);
  const weak   = rows.filter(r=>r.m > 0 && r.m < 40).sort((a,b)=>a.m-b.m);

  const mist = Object.entries(p.mistakes).sort((a,b)=>b[1]-a[1]).slice(0,3)
               .map(([k,n])=>({ key:k, n, info: MISTAKES[k] || { name:k, hint:'' } }));

  const week = [];
  for(let i=6;i>=0;i--){
    const dt = new Date(Date.now() - i*86400000).toISOString().slice(0,10);
    const rec = p.days[dt] || { tasks:0, right:0, sec:0 };
    week.push({ date:dt, ...rec, label:['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][new Date(dt).getDay()] });
  }
  const totalWeekTasks = week.reduce((s,d)=>s+d.tasks,0);
  const totalWeekRight = week.reduce((s,d)=>s+d.right,0);
  const totalWeekSec   = week.reduce((s,d)=>s+d.sec,0);

  return { rows, strong, now, weak, mist, week, totalWeekTasks, totalWeekRight, totalWeekSec };
}
