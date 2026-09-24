/* ==========================================================================
   tasks.js — генераторы заданий
   GEN[имя](параметры, сложность) → объект задания.

   Объект задания:
   {
     kind    : 'choice'|'input'|'tapCount'|'tapRemove'|'parts'|'match'|'memory'
     q       : текст вопроса
     say     : что произносит тренер (по умолчанию = q)
     visual  : картинка задания (см. ui.js → drawVisual)
     options : [{t:'текст', v:'значение', em:'эмодзи', sh:{s,c}}]
     answer  : правильное значение (строкой)
     explain : [шаги разбора]
     hint    : подсказка до ответа
     mtype   : тип ошибки по умолчанию
     mmap    : {ответ: тип ошибки} — уточнение по конкретному ответу
   }
   ========================================================================== */

/* ---------- мелкие помощники ---------- */
const R = (a,b)=> a + Math.floor(Math.random()*(b-a+1));
const pick = a => a[Math.floor(Math.random()*a.length)];
const shuffle = a => { const r=a.slice(); for(let i=r.length-1;i>0;i--){const j=R(0,i);[r[i],r[j]]=[r[j],r[i]];} return r; };
const rep = (x,n)=> Array.from({length:n},()=>typeof x==='function'?x():x);
/* масштаб сложности: d=1 — проще, d=3 — полный диапазон */
const sc = (max,d)=> Math.max(3, Math.round(max*(d===1?0.4:d===2?0.7:1)));

const BANK = {
  fruit:  ['🍎','🍐','🍊','🍓','🍌','🍇','🍒','🍑','🍉'],
  animal: ['🐟','🐝','🦋','🐞','🐧','🐰','🦆','🐥','🐱'],
  thing:  ['🚗','⚽','🎈','⭐','🌸','🍬','🧸','✏️','🎁'],
  any(){ return pick([...this.fruit, ...this.animal, ...this.thing]); }
};
const anyEm = ()=> BANK.any();
const WORD = { '🍎':'яблок','🍐':'груш','🍊':'апельсинов','🍓':'ягод','🍌':'бананов','🍇':'виноградин','🍒':'вишенок','🍑':'персиков','🍉':'арбузов',
  '🐟':'рыбок','🐝':'пчёлок','🦋':'бабочек','🐞':'божьих коровок','🐧':'пингвинов','🐰':'зайчиков','🦆':'уточек','🐥':'цыплят','🐱':'котят',
  '🚗':'машинок','⚽':'мячей','🎈':'шариков','⭐':'звёздочек','🌸':'цветочков','🍬':'конфет','🧸':'мишек','✏️':'карандашей','🎁':'подарков' };
const wordOf = em => WORD[em] || 'предметов';

/* варианты-числа вокруг правильного ответа */
function numOpts(ans, spread, mmap){
  const set = new Set([ans]);
  let guard = 0;
  while(set.size < 4 && guard++ < 60){
    const v = ans + R(-spread, spread);
    if(v >= 0) set.add(v);
  }
  return { options: shuffle([...set]).map(v=>({ t:String(v), v:String(v) })), mmap: mmap||{} };
}
const T = o => Object.assign({ kind:'choice', explain:[], mtype:'attention', mmap:{} }, o);

/* фигуры: s — тип, c — цвет */
const SHAPES = [
  { s:'circle', n:'Круг',         one:'круг' },
  { s:'square', n:'Квадрат',      one:'квадрат' },
  { s:'tri',    n:'Треугольник',  one:'треугольник' },
  { s:'rect',   n:'Прямоугольник',one:'прямоугольник' },
  { s:'oval',   n:'Овал',         one:'овал' }
];
const COLORS = ['#FF6B9D','#4CC9F0','#3DDC97','#FFD166','#A78BFA','#FF9F43'];

const GEN = {};

/* =========================================================================
   СЧЁТ
   ========================================================================= */
GEN.countObjects = (p,d)=>{
  const max = sc(p.max, d);
  const n = R(1, max);
  const em = anyEm();
  const big = max > 10;
  const o = numOpts(n, 2, { [n-1]:'off_one', [n+1]:'off_one' });
  return T({
    kind: big ? 'input' : 'choice',
    q: `Сколько тут ${wordOf(em)}?`,
    say: `Посчитай, сколько тут ${wordOf(em)}.`,
    visual: { t:'items', list: rep(em, n) },
    options: o.options, mmap: o.mmap,
    answer: String(n),
    hint: 'Считай по одному и трогай каждый пальцем.',
    explain: ['Считаем по одному: '+Array.from({length:n},(_,i)=>i+1).join(', ')+'.', `Всего — ${n}.`],
    mtype:'count'
  });
};

GEN.countOrder = (p,d)=>{
  const max = sc(p.max, d), dir = p.dir;
  const start = dir > 0 ? R(1, Math.max(2, max-4)) : R(5, max);
  const row = [0,1,2].map(i=> start + dir*i);
  const ans = start + dir*3;
  const o = numOpts(ans, 2, { [ans-dir]:'off_one', [ans+dir]:'off_one' });
  return T({
    q: dir>0 ? 'Какое число будет следующим?' : 'Какое число будет следующим при счёте назад?',
    say: dir>0 ? `Считаем вперёд: ${row.join(', ')}... Что дальше?` : `Считаем назад: ${row.join(', ')}... Что дальше?`,
    visual: { t:'row', list: row.map(String).concat('?') },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: dir>0 ? 'Каждое следующее число на один больше.' : 'Каждое следующее число на один меньше.',
    explain: [`Числа идут ${dir>0?'по порядку вперёд':'назад'}.`, `После ${row[2]} идёт ${ans}.`],
    mtype:'count'
  });
};

GEN.countMissing = (p,d)=>{
  const max = sc(p.max, d);
  const start = R(1, Math.max(2, max-4));
  const row = [0,1,2,3,4].map(i=>start+i);
  const gap = R(1,3);
  const ans = row[gap];
  const shown = row.map((v,i)=> i===gap ? '?' : String(v));
  const o = numOpts(ans, 2, { [ans-1]:'off_one', [ans+1]:'off_one' });
  return T({
    q: 'Какое число пропущено?',
    say: 'Посмотри на ряд чисел. Какое число убежало?',
    visual: { t:'row', list: shown, mark: gap },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: 'Числа идут по порядку, без пропусков.',
    explain: [`Ряд: ${row.join(', ')}.`, `Между ${row[gap-1]} и ${row[gap+1]} стоит ${ans}.`],
    mtype:'count'
  });
};

GEN.countTake = (p,d)=>{
  const max = sc(p.max, d);
  const need = R(2, Math.max(3, max-1));
  const total = Math.min(p.max, need + R(2,4));
  const em = anyEm();
  return T({
    kind:'tapCount',
    q: `Отметь ровно ${need} ${wordOf(em)}`,
    say: `Нажми на ${need} ${wordOf(em)}. Считай вслух.`,
    visual: { t:'items', list: rep(em, total), tap:true },
    answer: String(need),
    need,
    hint: 'Нажимай по одному и считай: один, два, три...',
    explain: [`Нужно было отметить ровно ${need}.`, 'Считаем каждый раз, когда нажимаем.'],
    mtype:'count'
  });
};

/* =========================================================================
   СРАВНЕНИЕ
   ========================================================================= */
GEN.compareGroups = (p,d)=>{
  const max = sc(p.max, d);
  let a = R(1,max), b = R(1,max);
  const gap = d===1 ? 3 : d===2 ? 2 : 1;
  while(Math.abs(a-b) < gap || a===b){ a = R(1,max); b = R(1,max); }
  const ea = anyEm(); let eb = anyEm(); while(eb===ea) eb = anyEm();
  const more = p.ask === 'more';
  const win = more ? (a>b?'a':'b') : (a<b?'a':'b');
  return T({
    q: more ? 'Где предметов больше?' : 'Где предметов меньше?',
    say: more ? 'Посмотри на две группы. Где больше?' : 'Посмотри на две группы. Где меньше?',
    visual: { t:'groups', list:[ rep(ea,a), rep(eb,b) ], sep:'и' },
    options: shuffle([{ t:'Сверху', v:'a', em:ea }, { t:'Снизу', v:'b', em:eb }]),
    answer: win,
    hint: 'Поставь предметы парами: где останутся лишние — там больше.',
    explain: [`Сверху ${a}, снизу ${b}.`, `${Math.max(a,b)} ${more?'больше':'больше'}, чем ${Math.min(a,b)}.`,
              more ? `Больше там, где ${Math.max(a,b)}.` : `Меньше там, где ${Math.min(a,b)}.`],
    mtype:'compare'
  });
};

GEN.compareEqual = (p,d)=>{
  const max = sc(p.max, d);
  const same = Math.random() < .5;
  const a = R(2,max), b = same ? a : (a + pick([-2,-1,1,2]) + max) % max + 1;
  const ea = anyEm(); let eb = anyEm(); while(eb===ea) eb = anyEm();
  const eq = a === b;
  return T({
    q: 'Предметов поровну?',
    say: 'Посмотри: предметов поровну или нет?',
    visual: { t:'groups', list:[ rep(ea,a), rep(eb,b) ], sep:'и' },
    options: [{ t:'Поровну', v:'yes' }, { t:'Не поровну', v:'no' }],
    answer: eq ? 'yes' : 'no',
    hint: 'Составь пары: один сверху — один снизу.',
    explain: [`Сверху ${a}, снизу ${b}.`, eq ? 'Числа одинаковые — значит, поровну.' : 'Числа разные — значит, не поровну.'],
    mtype:'compare'
  });
};

GEN.compareSigns = (p,d)=>{
  const max = sc(p.max, d);
  const a = R(1,max), b = Math.random()<.25 ? a : R(1,max);
  const ans = a>b ? '>' : a<b ? '<' : '=';
  return T({
    q: 'Какой знак поставить?',
    say: `Сравни: ${a} и ${b}.`,
    visual: { t:'expr', html:`${a} <span class="blank">?</span> ${b}` },
    options: [{ t:'>', v:'>' }, { t:'<', v:'<' }, { t:'=', v:'=' }],
    answer: ans,
    hint: 'Клювик знака всегда открыт в сторону большего числа.',
    explain: [ ans==='=' ? 'Числа одинаковые.' : `${Math.max(a,b)} больше, чем ${Math.min(a,b)}.`,
               `Значит, ${a} ${ans} ${b}.` ],
    mtype:'compare'
  });
};

GEN.compareDiff = (p,d)=>{
  const max = sc(p.max, d);
  const a = R(3,max), b = R(1, a-1);
  const em = anyEm();
  const ans = a-b;
  const o = numOpts(ans, 2, { [a]:'condition', [a+b]:'sign' });
  return T({
    q: 'На сколько в первом ряду больше?',
    say: 'На сколько в верхнем ряду больше предметов?',
    visual: { t:'groups', list:[ rep(em,a), rep(em,b) ], sep:'и' },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: 'Составь пары. Сколько останется без пары — на столько и больше.',
    explain: [`Сверху ${a}, снизу ${b}.`, `${a} − ${b} = ${ans}.`, `Больше на ${ans}.`],
    mtype:'compare'
  });
};

/* =========================================================================
   СОСТАВ ЧИСЛА
   ========================================================================= */
GEN.composeNum = (p,d)=>{
  const n = p.n;
  const chips = shuffle(Array.from({length:n+1},(_,i)=>i)).slice(0,6);
  if(!chips.includes(1)) chips[0]=1;
  return T({
    kind:'parts',
    q: `Собери число ${n} из двух частей`,
    say: `Собери число ${n}. Перетащи две карточки так, чтобы вместе получилось ${n}.`,
    total: n,
    chips: shuffle([...new Set(chips)]),
    answer: String(n),
    hint: `Подумай: сколько нужно добавить, чтобы получилось ${n}?`,
    explain: [`${n} можно собрать по-разному.`, `Например, ${Math.floor(n/2)} и ${n - Math.floor(n/2)}.`],
    mtype:'count'
  });
};

GEN.composePart = (p,d)=>{
  const max = sc(p.max, d);
  const n = R(3,max), a = R(1,n-1), ans = n-a;
  const o = numOpts(ans, 2, { [n]:'condition', [a]:'attention' });
  return T({
    kind: max>10 ? 'input' : 'choice',
    q: 'Найди вторую часть',
    say: `${n} — это ${a} и сколько?`,
    visual: { t:'expr', html:`${n} = ${a} + <span class="blank">?</span>` },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: `Считай от ${a} до ${n} — сколько шагов получилось?`,
    explain: [`Целое — ${n}, одна часть — ${a}.`, `${n} − ${a} = ${ans}.`],
    mtype:'count'
  });
};

/* =========================================================================
   СЛОЖЕНИЕ
   ========================================================================= */
GEN.addObjects = (p,d)=>{
  const max = sc(p.max, d);
  const a = R(1,max), b = R(1,max);
  const em = anyEm();
  const ans = a+b;
  const o = numOpts(ans, 2, { [a]:'condition', [Math.abs(a-b)]:'sign', [ans-1]:'off_one' });
  return T({
    q: 'Сколько стало вместе?',
    say: `${a} ${wordOf(em)} и ещё ${b}. Сколько стало вместе?`,
    visual: { t:'groups', list:[ rep(em,a), rep(em,b) ], sep:'+' },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: 'Сложи обе кучки вместе и посчитай все предметы.',
    explain: [`Было ${a}, добавили ${b}.`, `${a} + ${b} = ${ans}.`],
    mtype:'count'
  });
};

GEN.addSimple = (p,d)=>{
  const max = sc(p.max, d);
  let a, b;
  if(p.fixed){ b = pick(p.fixed); a = R(1, max-b); }
  else { a = R(1, Math.max(1,max-1)); b = R(1, Math.max(1, max-a)); }
  const ans = a+b;
  const o = numOpts(ans, max>20?5:2, { [a-b>0?a-b:0]:'sign', [ans-1]:'off_one', [ans+1]:'off_one' });
  return T({
    kind: max>10 ? 'input' : 'choice',
    q: 'Сколько получится?',
    say: `Сколько будет ${a} плюс ${b}?`,
    visual: { t:'expr', html:`${a} + ${b} = <span class="blank">?</span>` },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: `Начни с ${a} и прибавляй по одному ${b} раз.`,
    explain: [`Берём ${a} и прибавляем ${b}.`, `${a} + ${b} = ${ans}.`],
    mtype:'count'
  });
};

GEN.addCarry = (p,d)=>{
  const max = sc(p.max, d);
  let a = R(max>20?15:6, Math.max(9, Math.floor(max*0.6)));
  let b = R(2,9);
  while((a%10) + b <= 10) { a = R(6, Math.max(9,Math.floor(max*0.6))); b = R(2,9); }
  const ans = a+b;
  const toTen = 10 - (a%10);
  const o = numOpts(ans, 3, { [ans-10]:'carry', [ans-1]:'carry' });
  return T({
    kind:'input',
    q: 'Реши с переходом через десяток',
    say: `Сколько будет ${a} плюс ${b}?`,
    visual: { t:'expr', html:`${a} + ${b} = <span class="blank">?</span>` },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: `Сначала дополни ${a} до круглого числа.`,
    explain: [`Разложим ${b} на ${toTen} и ${b-toTen}.`, `${a} + ${toTen} = ${a+toTen}.`, `${a+toTen} + ${b-toTen} = ${ans}.`],
    mtype:'carry'
  });
};

GEN.addThree = (p,d)=>{
  const max = sc(p.max, d);
  const a=R(1,Math.floor(max/3)), b=R(1,Math.floor(max/3)), c=R(1,Math.floor(max/3));
  const ans=a+b+c;
  const o = numOpts(ans, 3, { [a+b]:'attention' });
  return T({
    kind:'input',
    q: 'Сложи три числа',
    say: `Сколько будет ${a} плюс ${b} плюс ${c}?`,
    visual: { t:'expr', html:`${a} + ${b} + ${c} = <span class="blank">?</span>` },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: 'Складывай по очереди: сначала два первых.',
    explain: [`${a} + ${b} = ${a+b}.`, `${a+b} + ${c} = ${ans}.`],
    mtype:'count'
  });
};

GEN.addColumn = (p,d)=>{
  const max = sc(p.max, d);
  const a = R(Math.floor(max/4), max), b = R(Math.floor(max/4), max);
  const ans = a+b;
  return T({
    kind:'input',
    q: 'Сложи столбиком',
    say: `Сложи ${a} и ${b}.`,
    visual: { t:'column', a, b, op:'+' },
    answer: String(ans),
    hint: 'Складывай справа налево: единицы, потом десятки.',
    explain: ['Пишем единицы под единицами, десятки под десятками.', `${a} + ${b} = ${ans}.`],
    mtype:'place'
  });
};

/* =========================================================================
   ВЫЧИТАНИЕ
   ========================================================================= */
GEN.subObjects = (p,d)=>{
  const max = sc(p.max, d);
  const a = R(3,max), b = R(1, a-1);
  const em = anyEm();
  const ans = a-b;
  return T({
    kind:'tapRemove',
    q: `Убери ${b} — сколько останется?`,
    say: `Тут ${a} ${wordOf(em)}. ${b} уплывают. Убери их пальцем.`,
    visual: { t:'items', list: rep(em,a), tap:true },
    need: b,
    answer: String(ans),
    hint: 'Сначала убери лишние, потом посчитай оставшиеся.',
    explain: [`Было ${a}, убрали ${b}.`, `${a} − ${b} = ${ans}.`],
    mtype:'count'
  });
};

GEN.subSimple = (p,d)=>{
  const max = sc(p.max, d);
  let a, b;
  if(p.fixed){ b = pick(p.fixed); a = R(b+1, max); }
  else { a = R(2,max); b = R(1,a); }
  const ans = a-b;
  const o = numOpts(ans, max>20?5:2, { [a+b]:'sign', [ans+1]:'off_one', [ans-1>=0?ans-1:0]:'off_one' });
  return T({
    kind: max>10 ? 'input' : 'choice',
    q: 'Сколько останется?',
    say: `Сколько будет ${a} минус ${b}?`,
    visual: { t:'expr', html:`${a} − ${b} = <span class="blank">?</span>` },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: `Начни с ${a} и отсчитывай назад ${b} раз.`,
    explain: [`Было ${a}, убираем ${b}.`, `${a} − ${b} = ${ans}.`],
    mtype:'count'
  });
};

GEN.subBorrow = (p,d)=>{
  const max = sc(p.max, d);
  let a = R(max>20?21:11, Math.max(12,max)), b = R(2,9);
  while((a%10) >= b){ a = R(11, Math.max(12,max)); b = R(2,9); }
  const ans = a-b;
  const toTen = a%10;
  const o = numOpts(ans, 3, { [ans+10]:'borrow', [ans+1]:'borrow' });
  return T({
    kind:'input',
    q: 'Реши с переходом через десяток',
    say: `Сколько будет ${a} минус ${b}?`,
    visual: { t:'expr', html:`${a} − ${b} = <span class="blank">?</span>` },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: 'Сначала спустись до круглого числа.',
    explain: [`Разложим ${b} на ${toTen} и ${b-toTen}.`, `${a} − ${toTen} = ${a-toTen}.`, `${a-toTen} − ${b-toTen} = ${ans}.`],
    mtype:'borrow'
  });
};

GEN.subColumn = (p,d)=>{
  const max = sc(p.max, d);
  const a = R(Math.floor(max/2), max), b = R(1, a);
  const ans = a-b;
  return T({
    kind:'input',
    q: 'Вычти столбиком',
    say: `Вычти из ${a} число ${b}.`,
    visual: { t:'column', a, b, op:'−' },
    answer: String(ans),
    hint: 'Вычитай справа налево. Не хватает единиц — займи десяток.',
    explain: ['Единицы под единицами, десятки под десятками.', `${a} − ${b} = ${ans}.`],
    mtype:'place'
  });
};

GEN.subCheck = (p,d)=>{
  const max = sc(p.max, d);
  const a = R(5,max), b = R(1,a-1);
  const real = a-b;
  const ok = Math.random() < .5;
  const shown = ok ? real : real + pick([-2,-1,1,2]);
  return T({
    q: 'Решено верно?',
    say: `Проверь: ${a} минус ${b} равно ${shown}. Верно?`,
    visual: { t:'expr', html:`${a} − ${b} = ${shown}` },
    options: [{ t:'Верно', v:'yes' }, { t:'Ошибка', v:'no' }],
    answer: ok ? 'yes' : 'no',
    hint: 'Проверить вычитание можно сложением.',
    explain: [`Проверяем сложением: ${shown} + ${b} = ${shown+b}.`,
              ok ? `Получилось ${a} — значит, верно.` : `А должно быть ${a}. Правильный ответ: ${real}.`],
    mtype:'attention'
  });
};

/* =========================================================================
   УМНОЖЕНИЕ И ДЕЛЕНИЕ
   ========================================================================= */
GEN.mulSense = ()=>{
  const a = R(2,6), b = R(2,5);
  const sum = rep(String(a), b).join(' + ');
  return T({
    q: 'Как записать это умножением?',
    say: `Посмотри: ${sum}. Как записать короче?`,
    visual: { t:'expr', html: sum },
    options: shuffle([
      { t:`${a} × ${b}`, v:'ok' },
      { t:`${a} + ${b}`, v:'x1' },
      { t:`${b} × ${b}`, v:'x2' },
      { t:`${a} × ${a}`, v:'x3' }
    ]),
    answer: 'ok',
    hint: 'Умножение — это когда складывают одинаковые числа.',
    explain: [`Число ${a} повторяется ${b} раз.`, `Значит, ${a} × ${b} = ${a*b}.`],
    mtype:'table'
  });
};

GEN.mulTable = (p,d)=>{
  const a = pick(p.a), b = R(2, d===1?5:9);
  const ans = a*b;
  if(d===3 && Math.random()<.3){
    const used = new Set([b]);
    const pairs = [[`${a} × ${b}`, String(ans)]];
    while(pairs.length < 4){ const k = R(2,9); if(used.has(k)) continue; used.add(k); pairs.push([`${a} × ${k}`, String(a*k)]); }
    return T({
      kind:'match',
      q:'Соедини пример и ответ',
      say:'Соедини каждый пример с его ответом.',
      pairs: shuffle(pairs),
      answer:'match',
      hint:`Вспомни таблицу на ${a}.`,
      explain:[`Таблица на ${a}: считаем группами по ${a}.`],
      mtype:'table'
    });
  }
  const o = numOpts(ans, a, { [ans-a]:'table', [ans+a]:'table', [a+b]:'sign' });
  return T({
    kind: d===1 ? 'choice' : 'input',
    q: 'Сколько получится?',
    say: `Сколько будет ${a} умножить на ${b}?`,
    visual: { t:'expr', html:`${a} × ${b} = <span class="blank">?</span>` },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: `Это ${b} групп по ${a}.`,
    explain: [`${b} групп по ${a}.`, `Считаем: ${Array.from({length:b},(_,i)=>a*(i+1)).join(', ')}.`, `${a} × ${b} = ${ans}.`],
    mtype:'table'
  });
};

GEN.divSense = ()=>{
  const b = R(2,5), ans = R(2,5), a = b*ans;
  const em = pick(BANK.fruit);
  const o = numOpts(ans, 2, { [a-b]:'sign', [a*b]:'sign' });
  return T({
    q: 'Сколько достанется каждому?',
    say: `${a} ${wordOf(em)} разделили поровну между ${b} друзьями. Сколько каждому?`,
    visual: { t:'items', list: rep(em,a) },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: 'Раздавай по одному, пока всё не закончится.',
    explain: [`Делим ${a} на ${b} равных частей.`, `${a} ÷ ${b} = ${ans}.`],
    mtype:'table'
  });
};

GEN.divTable = (p,d)=>{
  const b = pick(p.a), ans = R(2, d===1?5:9), a = b*ans;
  const o = numOpts(ans, 2, { [a-b]:'sign', [a*b]:'sign' });
  return T({
    kind: d===1 ? 'choice' : 'input',
    q: 'Сколько получится?',
    say: `Сколько будет ${a} разделить на ${b}?`,
    visual: { t:'expr', html:`${a} ÷ ${b} = <span class="blank">?</span>` },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: `Спроси себя: на что умножить ${b}, чтобы вышло ${a}?`,
    explain: [`${b} × ${ans} = ${a}.`, `Значит, ${a} ÷ ${b} = ${ans}.`],
    mtype:'table'
  });
};

GEN.mulRound = (p,d)=>{
  const k = pick(d===1?[10]:d===2?[10,100]:[10,100,1000]);
  const a = R(2, 99);
  const ans = a*k;
  return T({
    kind:'input',
    q:'Умножь на круглое число',
    say:`Сколько будет ${a} умножить на ${k}?`,
    visual:{ t:'expr', html:`${a} × ${k} = <span class="blank">?</span>` },
    answer:String(ans),
    hint:'Просто допиши нули.',
    explain:[`У ${k} ${String(k).length-1} ${String(k).length-1===1?'нуль':'нуля'}.`, `Дописываем их к ${a}: ${ans}.`],
    mtype:'place'
  });
};

GEN.mulOuter = (p,d)=>{
  const b = R(2,9);
  const a = R(11, Math.min(999, Math.max(20, Math.floor(p.max/b))));
  const ans = a*b;
  const t = Math.floor(a/10)*10, u = a%10;
  return T({
    kind:'input',
    q:'Реши пример',
    say:`Сколько будет ${a} умножить на ${b}?`,
    visual:{ t:'expr', html:`${a} × ${b} = <span class="blank">?</span>` },
    answer:String(ans),
    hint:'Разложи число на десятки и единицы.',
    explain:[`${a} = ${t} + ${u}.`, `${t} × ${b} = ${t*b}, ${u} × ${b} = ${u*b}.`, `${t*b} + ${u*b} = ${ans}.`],
    mtype:'place'
  });
};

GEN.mulTwo = (p,d)=>{
  const a = R(11,99), b = R(11, d===1?29:99);
  const ans = a*b;
  const t = Math.floor(b/10)*10, u = b%10;
  return T({
    kind:'input',
    q:'Умножь на двузначное число',
    say:`Сколько будет ${a} умножить на ${b}?`,
    visual:{ t:'column', a, b, op:'×' },
    answer:String(ans),
    hint:'Умножь сначала на единицы, потом на десятки, и сложи.',
    explain:[`${a} × ${u} = ${a*u}.`, `${a} × ${t} = ${a*t}.`, `${a*u} + ${a*t} = ${ans}.`],
    mtype:'place'
  });
};

GEN.divRem = (p,d)=>{
  const b = R(2,9), q = R(2, d===1?5:9), r = R(1,b-1);
  const a = b*q + r;
  const askRem = Math.random() < .5;
  const ans = askRem ? r : q;
  const o = numOpts(ans, 2, { [askRem?q:r]:'attention' });
  return T({
    kind:'input',
    q: askRem ? 'Чему равен остаток?' : 'Сколько получится (без остатка)?',
    say: askRem ? `Раздели ${a} на ${b}. Какой будет остаток?` : `Раздели ${a} на ${b}. Сколько целых получится?`,
    visual:{ t:'expr', html:`${a} ÷ ${b} = <span class="blank">?</span>${askRem?' ост. ?':''}` },
    options:o.options, mmap:o.mmap,
    answer:String(ans),
    hint:`Ищи самое большое число, которое при умножении на ${b} не больше ${a}.`,
    explain:[`${b} × ${q} = ${b*q}.`, `${a} − ${b*q} = ${r}.`, `Значит, ${a} ÷ ${b} = ${q} и в остатке ${r}.`],
    mtype:'table'
  });
};

GEN.divOuter = (p,d)=>{
  const b = R(2,9), q = R(11, Math.min(999, Math.max(12, Math.floor(p.max/b))));
  const a = b*q;
  return T({
    kind:'input',
    q:'Реши пример',
    say:`Сколько будет ${a} разделить на ${b}?`,
    visual:{ t:'expr', html:`${a} ÷ ${b} = <span class="blank">?</span>` },
    answer:String(q),
    hint:'Дели по разрядам, слева направо.',
    explain:[`Проверим умножением: ${b} × ${q} = ${a}.`, `Значит, ответ ${q}.`],
    mtype:'place'
  });
};

GEN.divRound = (p,d)=>{
  const k = pick(d===1?[10]:d===2?[10,100]:[10,100,1000]);
  const q = R(2,99);
  const a = q*k;
  return T({
    kind:'input',
    q:'Раздели на круглое число',
    say:`Сколько будет ${a} разделить на ${k}?`,
    visual:{ t:'expr', html:`${a} ÷ ${k} = <span class="blank">?</span>` },
    answer:String(q),
    hint:'Убери столько нулей, сколько их у делителя.',
    explain:[`У ${k} ${String(k).length-1} ${String(k).length-1===1?'нуль':'нуля'}.`, `Убираем их: ${q}.`],
    mtype:'place'
  });
};

/* =========================================================================
   ЧИСЛА И РАЗРЯДЫ
   ========================================================================= */
GEN.numNeighbors = (p,d)=>{
  const max = sc(p.max, d);
  const n = R(2, max);
  const next = Math.random() < .5;
  const ans = next ? n+1 : n-1;
  const o = numOpts(ans, 2, { [next?n-1:n+1]:'attention' });
  return T({
    kind: max>100 ? 'input' : 'choice',
    q: next ? `Какое число идёт после ${n}?` : `Какое число идёт перед ${n}?`,
    say: next ? `Назови число, которое идёт сразу после ${n}.` : `Назови число, которое идёт перед ${n}.`,
    visual: { t:'row', list: next ? [String(n),'?'] : ['?',String(n)] },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: next ? 'Следующее число на один больше.' : 'Предыдущее число на один меньше.',
    explain: [ next ? `${n} + 1 = ${ans}.` : `${n} − 1 = ${ans}.` ],
    mtype:'count'
  });
};

GEN.placeValue = (p,d)=>{
  const max = sc(p.max, d);
  const n = R(Math.max(10, Math.floor(max/10)), max);
  const s = String(n);
  const units = [['единиц',1],['десятков',10],['сотен',100],['тысяч',1000]].slice(0, s.length);
  const [name, mult] = pick(units);
  const ans = Math.floor(n/mult) % 10;
  const o = numOpts(ans, 2, { [n%10]:'place' });
  return T({
    q: `Сколько ${name} в числе ${n}?`,
    say: `Сколько ${name} в числе ${n}?`,
    visual: { t:'expr', html:String(n) },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: 'Разряды считаем справа: единицы, десятки, сотни.',
    explain: [`Запишем ${n} по разрядам.`, `${name.charAt(0).toUpperCase()+name.slice(1)}: ${ans}.`],
    mtype:'place'
  });
};

GEN.roundTen = (p,d)=>{
  const n = R(11, sc(p.max,d));
  const ans = Math.round(n/10)*10;
  const o = numOpts(ans, 20, { [Math.floor(n/10)*10 === ans ? ans+10 : ans-10]:'place' });
  return T({
    q: 'Какое круглое число ближе?',
    say: `К какому круглому числу ближе ${n}?`,
    visual: { t:'expr', html:String(n) },
    options: shuffle([{t:String(ans),v:String(ans)}, {t:String(ans+10),v:String(ans+10)}, {t:String(Math.max(0,ans-10)),v:String(Math.max(0,ans-10))}]),
    mmap: o.mmap,
    answer: String(ans),
    hint: 'Смотри на последнюю цифру: до 4 — вниз, от 5 — вверх.',
    explain: [`Последняя цифра ${n%10}.`, `Ближайшее круглое число — ${ans}.`],
    mtype:'place'
  });
};

/* =========================================================================
   ФИГУРЫ
   ========================================================================= */
GEN.shapeName = ()=>{
  const sh = pick(SHAPES), c = pick(COLORS);
  const others = shuffle(SHAPES.filter(x=>x.s!==sh.s)).slice(0,3);
  return T({
    q: 'Что это за фигура?',
    say: 'Как называется эта фигура?',
    visual: { t:'shapes', list:[{ s:sh.s, c, big:true }] },
    options: shuffle([sh, ...others]).map(x=>({ t:x.n, v:x.s })),
    answer: sh.s,
    hint: 'Посчитай углы и стороны.',
    explain: [`Это ${sh.one}.`],
    mtype:'logic'
  });
};

GEN.shapeFind = ()=>{
  const sh = pick(SHAPES);
  const others = shuffle(SHAPES.filter(x=>x.s!==sh.s)).slice(0,3);
  return T({
    q: `Покажи ${SHAPES.find(x=>x.s===sh.s).one}`,
    say: `Найди ${sh.one}.`,
    options: shuffle([sh, ...others]).map(x=>({ v:x.s, sh:{ s:x.s, c:pick(COLORS) } })),
    answer: sh.s,
    hint: 'Вспомни, как выглядит эта фигура.',
    explain: [`${sh.n} — вот эта фигура.`],
    mtype:'logic'
  });
};

GEN.shapeCount = (p,d)=>{
  const target = pick(SHAPES);
  const n = R(2, d===1?4:6);
  const noise = R(3,5);
  const list = shuffle([
    ...rep(()=>({ s:target.s, c:pick(COLORS) }), n),
    ...rep(()=>({ s:pick(SHAPES.filter(x=>x.s!==target.s)).s, c:pick(COLORS) }), noise)
  ]);
  const o = numOpts(n, 2, { [n+noise]:'condition' });
  return T({
    q: `Сколько здесь фигур «${target.n.toLowerCase()}»?`,
    say: `Посчитай, сколько тут фигур ${target.one}.`,
    visual: { t:'shapes', list },
    options: o.options, mmap: o.mmap,
    answer: String(n),
    hint: 'Считай только нужную фигуру, остальные пропускай.',
    explain: [`Нужных фигур — ${n}.`, `Всего фигур ${n+noise}, но нас интересуют только ${target.one}.`],
    mtype:'count'
  });
};

GEN.shapeOdd = ()=>{
  const sh = pick(SHAPES);
  const odd = pick(SHAPES.filter(x=>x.s!==sh.s));
  const c = pick(COLORS);
  const list = shuffle([
    { s:sh.s, c, v:'ok' }, { s:sh.s, c, v:'ok' }, { s:sh.s, c, v:'ok' }, { s:odd.s, c, v:'odd' }
  ]);
  return T({
    q: 'Какая фигура лишняя?',
    say: 'Найди лишнюю фигуру.',
    options: list.map((x,i)=>({ v:x.v==='odd'?'odd':'ok'+i, sh:{ s:x.s, c:x.c } })),
    answer: 'odd',
    hint: 'Три фигуры одинаковые, а одна — другая.',
    explain: [`Три ${sh.one}а и один ${odd.one}.`, `Лишний — ${odd.one}.`],
    mtype:'logic'
  });
};

/* =========================================================================
   ПРОСТРАНСТВО
   ========================================================================= */
GEN.spaceRel = (p)=>{
  const k = p.kind;
  const ems = shuffle([...BANK.animal]).slice(0,5);
  if(k === 'inout'){
    const inside = ems.slice(0,2), outside = ems.slice(2,4);
    const askIn = Math.random()<.5;
    const target = askIn ? pick(inside) : pick(outside);
    return T({
      q: `${target} внутри коробки или снаружи?`,
      say: 'Посмотри на картинку. Где стоит этот предмет?',
      visual: { t:'box', inside, outside },
      options: [{ t:'Внутри', v:'in' }, { t:'Снаружи', v:'out' }],
      answer: askIn ? 'in' : 'out',
      hint: 'Внутри — значит в коробке, снаружи — рядом с ней.',
      explain: [askIn ? 'Этот предмет стоит в коробке — значит, внутри.' : 'Этот предмет стоит рядом с коробкой — значит, снаружи.'],
      mtype:'space'
    });
  }
  const row = ems.slice(0, k==='ord'?5:3);
  if(k === 'lr'){
    const i = R(0, row.length-2);
    const right = Math.random()<.5;
    const idx = right ? i+1 : (i>0? i-1 : 1);
    const base = right ? row[i] : row[i>0?i:0];
    const ans = right ? row[i+1] : row[i>0?i-1:1];
    return T({
      q: `Кто стоит ${right?'справа от':'слева от'} ${base}?`,
      say: `Посмотри на ряд. Кто стоит ${right?'справа':'слева'}?`,
      visual: { t:'row', list: row, em:true },
      options: shuffle(row.filter(x=>x!==base)).slice(0,3).concat(ans).filter((v,i,a)=>a.indexOf(v)===i).slice(0,4).map(x=>({ t:x, v:x })),
      answer: ans,
      hint: 'Справа — это в сторону твоей правой руки.',
      explain: [`В ряду: ${row.join(' ')}.`, `${right?'Справа':'Слева'} от ${base} стоит ${ans}.`],
      mtype:'space'
    });
  }
  if(k === 'ud'){
    const up = Math.random()<.5;
    const top = ems[0], bot = ems[1];
    return T({
      q: up ? 'Кто наверху?' : 'Кто внизу?',
      say: up ? 'Кто находится сверху?' : 'Кто находится снизу?',
      visual: { t:'groups', list:[[top],[bot]], sep:'' },
      options: shuffle([{ t:top, v:'top' }, { t:bot, v:'bot' }]),
      answer: up ? 'top' : 'bot',
      hint: 'Сверху — то, что выше.',
      explain: [up ? 'Наверху стоит первый предмет.' : 'Внизу стоит второй предмет.'],
      mtype:'space'
    });
  }
  if(k === 'btw'){
    const ans = row[1];
    return T({
      q: `Кто стоит между ${row[0]} и ${row[2]}?`,
      say: 'Кто стоит посередине?',
      visual: { t:'row', list: row, em:true },
      options: shuffle(row.map(x=>({ t:x, v:x }))),
      answer: ans,
      hint: 'Между — значит посередине, с двух сторон соседи.',
      explain: [`В ряду: ${row.join(' ')}.`, `Посередине — ${ans}.`],
      mtype:'space'
    });
  }
  /* ord */
  const first = Math.random()<.5;
  const ans = first ? row[0] : row[row.length-1];
  const others = shuffle(row.filter(x=>x!==ans)).slice(0,3);
  return T({
    q: first ? 'Кто стоит первым?' : 'Кто стоит последним?',
    say: first ? 'Кто в ряду первый?' : 'Кто в ряду последний?',
    visual: { t:'row', list: row, em:true },
    options: shuffle([ans, ...others].map(x=>({ t:x, v:x }))),
    answer: ans,
    hint: 'Считаем слева направо.',
    explain: [`В ряду: ${row.join(' ')}.`, `${first?'Первый':'Последний'} — ${ans}.`],
    mtype:'space'
  });
};

/* =========================================================================
   ВЕЛИЧИНЫ (предшкола)
   ========================================================================= */
GEN.sizeCompare = (p)=>{
  const k = p.kind;
  if(k === 'heavy'){
    const heavy = pick(['🐘','🚗','🏋️','🐻']), light = pick(['🪶','🎈','🍃','🦋']);
    const askHeavy = Math.random()<.5;
    return T({
      q: askHeavy ? 'Что тяжелее?' : 'Что легче?',
      say: askHeavy ? 'Что тяжелее?' : 'Что легче?',
      options: shuffle([{ t:heavy, v:'h' }, { t:light, v:'l' }]),
      answer: askHeavy ? 'h' : 'l',
      hint: 'Представь, что держишь это в руках.',
      explain: [`${heavy} тяжёлый, ${light} лёгкий.`],
      mtype:'logic'
    });
  }
  const conf = {
    big:  { a:'Большой', b:'Маленький', dim:'both' },
    long: { a:'Длинный', b:'Короткий',  dim:'w' },
    tall: { a:'Высокий', b:'Низкий',    dim:'h' },
    wide: { a:'Широкий', b:'Узкий',     dim:'w2' }
  }[k];
  const askFirst = Math.random()<.5;
  const big = { c:pick(COLORS) }, small = { c:pick(COLORS) };
  let bars;
  if(conf.dim==='w')      bars = [{ w:150, h:26, c:big.c },  { w:70, h:26, c:small.c }];
  else if(conf.dim==='h') bars = [{ w:40,  h:110, c:big.c }, { w:40, h:50, c:small.c }];
  else if(conf.dim==='w2')bars = [{ w:130, h:70, c:big.c },  { w:44, h:70, c:small.c }];
  else                    bars = [{ w:110, h:110, c:big.c }, { w:52, h:52, c:small.c }];
  const order = Math.random()<.5;
  const list = order ? bars : [bars[1], bars[0]];
  const bigIdx = order ? 'a' : 'b';
  const smallIdx = order ? 'b' : 'a';
  return T({
    q: askFirst ? `Где ${conf.a.toLowerCase()}?` : `Где ${conf.b.toLowerCase()}?`,
    say: askFirst ? `Покажи, где ${conf.a.toLowerCase()}.` : `Покажи, где ${conf.b.toLowerCase()}.`,
    visual: { t:'bars', list, pickable:true },
    options: [{ t:'Первый', v:'a' }, { t:'Второй', v:'b' }],
    answer: askFirst ? bigIdx : smallIdx,
    hint: 'Приложи их мысленно друг к другу.',
    explain: [`${conf.a} — тот, что крупнее по этому признаку.`],
    mtype:'logic'
  });
};

/* =========================================================================
   ЗАКОНОМЕРНОСТИ
   ========================================================================= */
GEN.seqPattern = (p,d)=>{
  const k = p.kind;
  if(k === 'shape'){
    const a = pick(SHAPES), b = pick(SHAPES.filter(x=>x.s!==a.s));
    const ca = pick(COLORS), cb = pick(COLORS);
    const period = d===3 ? 3 : 2;
    const base = period===2 ? [{s:a.s,c:ca},{s:b.s,c:cb}] : [{s:a.s,c:ca},{s:b.s,c:cb},{s:b.s,c:cb}];
    const list = [];
    for(let i=0;i<6;i++) list.push(base[i%period]);
    const ans = base[6%period];
    /* варианты должны различаться на вид, иначе правильных окажется два */
    const fkey = x => x.s + x.c;
    const opts = [ans];
    const addUnique = x => { if(opts.length < 4 && !opts.some(o=>fkey(o)===fkey(x))) opts.push(x); };
    base.forEach(addUnique);
    let guard = 0;
    while(opts.length < 3 && guard++ < 40) addUnique({ s:pick(SHAPES).s, c:pick(COLORS) });
    return T({
      q: 'Что будет дальше?',
      say: 'Посмотри на ряд. Какая фигура будет следующей?',
      visual: { t:'shapes', list: list.concat({ q:true }) },
      options: shuffle(opts).map((x,i)=>({ v: fkey(x)===fkey(ans) ? 'ok' : 'no'+i, sh:x })),
      answer: 'ok',
      hint: 'Найди, что повторяется.',
      explain: ['Ряд повторяется по кругу.', 'Значит, дальше снова та же фигура.'],
      mtype:'logic'
    });
  }
  const set = k==='color' ? ['🔴','🔵','🟢','🟡','🟣','🟠'] : ['🐘','🐭','🐋','🐜'];
  const a = pick(set), b = pick(set.filter(x=>x!==a));
  const period = d===3 ? 3 : 2;
  const base = period===2 ? [a,b] : [a,a,b];
  const list = Array.from({length:6},(_,i)=>base[i%period]);
  const ans = base[6%period];
  const wrong = set.filter(x=>x!==ans).slice(0,3);
  return T({
    q: 'Что будет дальше?',
    say: 'Посмотри на ряд и продолжи его.',
    visual: { t:'items', list: list.concat('❓'), small:true },
    options: shuffle([{ t:ans, v:'ok' }, ...wrong.map((w,i)=>({ t:w, v:'no'+i }))]).slice(0,4),
    answer: 'ok',
    hint: 'Посмотри, через сколько шагов узор повторяется.',
    explain: [`Узор повторяется: ${base.join(' ')}.`, `Дальше идёт ${ans}.`],
    mtype:'logic'
  });
};

GEN.seqNumber = (p,d)=>{
  const max = sc(p.max, d);
  /* обратный ряд берём только там, где он не уходит в минус */
  const all = d===1?[1,2]:d===2?[2,3,5]:[2,3,5,10,-2,-5];
  const fit = all.filter(s=> s>0 || Math.abs(s)*4 <= max);
  const step = pick(fit.length ? fit : [1]);
  const start = step>0 ? R(1, Math.max(2, Math.floor(max/2))) : R(Math.abs(step)*4, max);
  const row = [0,1,2,3].map(i=>start+step*i);
  const ans = start+step*4;
  const o = numOpts(ans, Math.abs(step)+1, { [ans-step]:'attention' });
  return T({
    kind: max>50 ? 'input' : 'choice',
    q: 'Продолжи ряд',
    say: `Ряд чисел: ${row.join(', ')}. Какое число будет дальше?`,
    visual: { t:'row', list: row.map(String).concat('?') },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: 'Посмотри, на сколько меняется каждое следующее число.',
    explain: [`Каждое число ${step>0?'больше':'меньше'} предыдущего на ${Math.abs(step)}.`, `${row[3]} ${step>0?'+':'−'} ${Math.abs(step)} = ${ans}.`],
    mtype:'logic'
  });
};

/* =========================================================================
   ЛОГИКА
   ========================================================================= */
GEN.logicOdd = ()=>{
  const cats = [
    { n:'фрукты', list:BANK.fruit },
    { n:'животные', list:BANK.animal },
    { n:'вещи', list:BANK.thing }
  ];
  const main = pick(cats), other = pick(cats.filter(c=>c.n!==main.n));
  const three = shuffle(main.list).slice(0,3);
  const odd = pick(other.list);
  return T({
    q: 'Что здесь лишнее?',
    say: 'Найди лишнее. Три предмета похожи, а один — нет.',
    options: shuffle([...three.map((t,i)=>({ t, v:'ok'+i })), { t:odd, v:'odd' }]),
    answer: 'odd',
    hint: 'Подумай, чем три предмета похожи между собой.',
    explain: [`Три предмета — это ${main.n}.`, `А ${odd} — нет. Он лишний.`],
    mtype:'logic'
  });
};

GEN.logicGroup = ()=>{
  const cats = [
    { n:'фрукт', list:BANK.fruit },
    { n:'животное', list:BANK.animal },
    { n:'игрушка или вещь', list:BANK.thing }
  ];
  const main = pick(cats);
  const ans = pick(main.list);
  const others = shuffle(cats.filter(c=>c.n!==main.n).flatMap(c=>c.list)).slice(0,3);
  return T({
    q: `Что из этого — ${main.n}?`,
    say: `Выбери, что из этого ${main.n}.`,
    options: shuffle([{ t:ans, v:'ok' }, ...others.map((t,i)=>({ t, v:'no'+i }))]),
    answer: 'ok',
    hint: 'Подумай, к какой группе относится каждый предмет.',
    explain: [`${ans} — это ${main.n}.`],
    mtype:'logic'
  });
};

GEN.logicChanged = ()=>{
  const list = shuffle([...BANK.thing, ...BANK.animal]).slice(0,4);
  const idx = R(0,3);
  const nw = pick(BANK.fruit);
  const after = list.slice(); after[idx] = nw;
  return T({
    kind:'memory',
    q: 'Какой предмет появился?',
    say: 'Запомни предметы. Потом скажешь, что изменилось.',
    visual: { t:'items', list },
    visual2: { t:'items', list: after },
    options: shuffle([{ t:nw, v:'ok' }, ...shuffle(list).slice(0,3).map((t,i)=>({ t, v:'no'+i }))]),
    answer: 'ok',
    showMs: 3500,
    hint: 'Сравни два ряда.',
    explain: [`Раньше тут был ${list[idx]}, а стал ${nw}.`],
    mtype:'attention'
  });
};

GEN.logicPair = ()=>{
  const pairs = [['🐝','🍯'],['🐟','💧'],['🐰','🥕'],['🚗','🛞'],['✏️','📓'],['🌸','🌱'],['🐱','🐟'],['🔑','🚪']];
  const [a,b] = pick(pairs);
  const wrong = shuffle(pairs.filter(p=>p[1]!==b)).slice(0,3).map(p=>p[1]);
  return T({
    q: `Что подходит к ${a}?`,
    say: 'Что подходит к этой картинке?',
    visual: { t:'items', list:[a] },
    options: shuffle([{ t:b, v:'ok' }, ...wrong.map((t,i)=>({ t, v:'no'+i }))]),
    answer: 'ok',
    hint: 'Подумай, что с чем связано.',
    explain: [`${a} и ${b} подходят друг к другу.`],
    mtype:'logic'
  });
};

GEN.findError = (p,d)=>{
  const max = sc(p.max, d);
  const make = ()=>{ const a=R(2,max), b=R(1,max); return { a, b, r:a+b }; };
  const list = [make(), make(), make()];
  const bad = R(0,2);
  list[bad].r += pick([-2,-1,1,2]);
  return T({
    q: 'В каком примере ошибка?',
    say: 'Найди пример, где ответ неправильный.',
    options: list.map((e,i)=>({ t:`${e.a} + ${e.b} = ${e.r}`, v: i===bad?'ok':'no'+i })),
    answer: 'ok',
    hint: 'Посчитай каждый пример заново.',
    explain: [`${list[bad].a} + ${list[bad].b} = ${list[bad].a+list[bad].b}, а написано ${list[bad].r}.`],
    mtype:'attention'
  });
};

/* =========================================================================
   ВРЕМЯ
   ========================================================================= */
const DAYS = ['понедельник','вторник','среда','четверг','пятница','суббота','воскресенье'];
const SEASONS = ['зима','весна','лето','осень'];

GEN.timeDayPart = ()=>{
  const bank = [
    { q:'Когда мы завтракаем?', a:'утро' },
    { q:'Когда светит солнце высоко?', a:'день' },
    { q:'Когда мы ужинаем?', a:'вечер' },
    { q:'Когда мы спим и на небе луна?', a:'ночь' },
    { q:'Когда просыпается солнышко?', a:'утро' },
    { q:'Когда пора надевать пижаму?', a:'вечер' }
  ];
  const it = pick(bank);
  return T({
    q: it.q,
    say: it.q,
    options: shuffle(['утро','день','вечер','ночь'].map(x=>({ t:x.charAt(0).toUpperCase()+x.slice(1), v:x }))),
    answer: it.a,
    hint: 'Вспомни свой день по порядку: утро, день, вечер, ночь.',
    explain: [`Правильно: ${it.a}.`, 'Сутки идут: утро → день → вечер → ночь.'],
    mtype:'time'
  });
};

GEN.timeWeek = ()=>{
  const i = R(0,6);
  const next = Math.random()<.5;
  const ans = DAYS[(i + (next?1:6)) % 7];
  return T({
    q: next ? `Какой день после ${DAYS[i]}?` : `Какой день перед ${DAYS[i]}?`,
    say: next ? `Какой день идёт после ${DAYS[i]}?` : `Какой день идёт перед ${DAYS[i]}?`,
    options: shuffle([ans, ...shuffle(DAYS.filter(d=>d!==ans && d!==DAYS[i])).slice(0,3)])
             .map(x=>({ t:x.charAt(0).toUpperCase()+x.slice(1), v:x })),
    answer: ans,
    hint: 'Дни недели идут по порядку с понедельника.',
    explain: [`Порядок: ${DAYS.join(', ')}.`, `${next?'После':'Перед'} ${DAYS[i]} — ${ans}.`],
    mtype:'time'
  });
};

GEN.timeSeason = ()=>{
  const bank = [
    { q:'Когда падают жёлтые листья?', a:'осень' },
    { q:'Когда идёт снег и лепят снеговика?', a:'зима' },
    { q:'Когда тает снег и распускаются листочки?', a:'весна' },
    { q:'Когда самое жаркое солнце и каникулы?', a:'лето' }
  ];
  const it = Math.random()<.6 ? pick(bank) : (()=>{
    const i = R(0,3);
    return { q:`Какое время года после ${SEASONS[i]}?`, a: SEASONS[(i+1)%4] };
  })();
  return T({
    q: it.q, say: it.q,
    options: shuffle(SEASONS.map(x=>({ t:x.charAt(0).toUpperCase()+x.slice(1), v:x }))),
    answer: it.a,
    hint: 'Год идёт: зима → весна → лето → осень.',
    explain: [`Правильно: ${it.a}.`],
    mtype:'time'
  });
};

GEN.timeRelative = ()=>{
  const i = R(0,6);
  const back = Math.random()<.5;
  const ans = DAYS[(i + (back?6:1)) % 7];
  return T({
    q: back ? `Сегодня ${DAYS[i]}. Какой день был вчера?` : `Сегодня ${DAYS[i]}. Какой день будет завтра?`,
    say: back ? `Если сегодня ${DAYS[i]}, то какой день был вчера?` : `Если сегодня ${DAYS[i]}, то какой день будет завтра?`,
    options: shuffle([ans, ...shuffle(DAYS.filter(d=>d!==ans)).slice(0,3)])
             .map(x=>({ t:x.charAt(0).toUpperCase()+x.slice(1), v:x })),
    answer: ans,
    hint: back ? 'Вчера — это на один день назад.' : 'Завтра — это на один день вперёд.',
    explain: [`Порядок дней: ${DAYS.join(', ')}.`, `Ответ: ${ans}.`],
    mtype:'time'
  });
};

GEN.timeClock = (p,d)=>{
  const step = p.step;
  const h = R(1,12);
  const m = step===60 ? 0 : step===30 ? pick([0,30]) : pick([0,5,10,15,20,25,30,35,40,45,50,55]);
  const fmt = (hh,mm)=> `${hh}:${String(mm).padStart(2,'0')}`;
  const ans = fmt(h,m);
  const wrong = new Set();
  while(wrong.size<3){
    const hh = R(1,12), mm = step===60?0:step===30?pick([0,30]):pick([0,5,15,30,45]);
    const v = fmt(hh,mm); if(v!==ans) wrong.add(v);
  }
  return T({
    q: 'Который час?',
    say: 'Посмотри на часы. Который час?',
    visual: { t:'clock', h, m },
    options: shuffle([{ t:ans, v:ans }, ...[...wrong].map(w=>({ t:w, v:w }))]),
    answer: ans,
    hint: 'Короткая стрелка — часы, длинная — минуты.',
    explain: ['Короткая стрелка показывает час, длинная — минуты.', `Сейчас ${ans}.`],
    mtype:'time'
  });
};

/* =========================================================================
   ДЕНЬГИ
   ========================================================================= */
GEN.moneyCount = (p,d)=>{
  const max = sc(p.max, d);
  const coins = [];
  let sum = 0;
  const kinds = max>20 ? [1,2,5,10] : [1,2,5];
  while(sum < max-1 && coins.length < 6){
    const c = pick(kinds);
    if(sum + c > max) break;
    coins.push(c); sum += c;
  }
  if(!coins.length){ coins.push(1); sum = 1; }
  const o = numOpts(sum, 3, { [coins.length]:'condition' });
  return T({
    kind: max>20 ? 'input' : 'choice',
    q: 'Сколько всего денег?',
    say: 'Посчитай, сколько всего монет по стоимости.',
    visual: { t:'money', coins },
    options: o.options, mmap: o.mmap,
    answer: String(sum),
    hint: 'Складывай номиналы монет, а не количество монет.',
    explain: [`Монеты: ${coins.join(' + ')}.`, `Всего ${sum} тенге.`],
    mtype:'count'
  });
};

GEN.moneyBuy = (p,d)=>{
  const max = sc(p.max, d);
  const have = R(3,max);
  const price = R(1, max);
  const em = pick(BANK.fruit);
  const ok = have >= price;
  return T({
    q: 'Хватит ли денег?',
    say: `У тебя ${have} тенге. Товар стоит ${price} тенге. Хватит ли денег?`,
    visual: { t:'shop', have, price, em },
    options: [{ t:'Хватит', v:'yes' }, { t:'Не хватит', v:'no' }],
    answer: ok ? 'yes' : 'no',
    hint: 'Сравни, что больше: твои деньги или цена.',
    explain: [`У тебя ${have}, цена ${price}.`, ok ? `${have} больше или равно ${price} — значит, хватит.` : `${have} меньше ${price} — не хватит.`],
    mtype:'compare'
  });
};

GEN.moneyChange = (p,d)=>{
  const max = sc(p.max, d);
  const have = R(4,max);
  const price = R(1, have);
  const em = pick(BANK.fruit);
  const ans = have - price;
  const o = numOpts(ans, 2, { [have+price]:'sign', [have]:'condition' });
  return T({
    kind: max>20 ? 'input' : 'choice',
    q: 'Сколько денег останется?',
    say: `У тебя ${have} тенге. Ты купил товар за ${price}. Сколько осталось?`,
    visual: { t:'shop', have, price, em },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: 'Из того, что было, вычти цену.',
    explain: [`Было ${have}, потратили ${price}.`, `${have} − ${price} = ${ans}.`],
    mtype:'count'
  });
};

/* =========================================================================
   ПАМЯТЬ
   ========================================================================= */
GEN.memGone = (p,d)=>{
  const n = d===1?4:d===2?5:6;
  const list = shuffle([...BANK.thing, ...BANK.animal, ...BANK.fruit]).slice(0,n);
  const gone = pick(list);
  const after = list.filter(x=>x!==gone);
  return T({
    kind:'memory',
    q: 'Что исчезло?',
    say: 'Запомни эти предметы.',
    visual: { t:'items', list },
    visual2: { t:'items', list: after },
    options: shuffle([{ t:gone, v:'ok' }, ...shuffle(after).slice(0,3).map((t,i)=>({ t, v:'no'+i }))]),
    answer: 'ok',
    showMs: 3000 + n*300,
    hint: 'Вспомни, что было в ряду.',
    explain: [`Исчез ${gone}.`],
    mtype:'attention'
  });
};

GEN.memHowMany = (p,d)=>{
  const n = R(3, d===1?5:d===2?7:9);
  const em = anyEm();
  const o = numOpts(n, 2, { [n-1]:'off_one', [n+1]:'off_one' });
  return T({
    kind:'memory',
    q: 'Сколько предметов было?',
    say: 'Посмотри внимательно и запомни, сколько предметов.',
    visual: { t:'items', list: rep(em,n) },
    options: o.options, mmap: o.mmap,
    answer: String(n),
    showMs: 2200 + n*180,
    hint: 'Считай сразу, пока смотришь.',
    explain: [`Их было ${n}.`],
    mtype:'count'
  });
};

GEN.memOrder = (p,d)=>{
  const n = d===1?3:d===2?4:5;
  const list = shuffle([...BANK.animal, ...BANK.thing]).slice(0,n);
  const pos = R(0,n-1);
  const names = ['первым','вторым','третьим','четвёртым','пятым'];
  return T({
    kind:'memory',
    q: `Кто стоял ${names[pos]}?`,
    say: 'Запомни, в каком порядке стоят предметы.',
    visual: { t:'items', list },
    options: shuffle(list.map(x=>({ t:x, v:x }))),
    answer: list[pos],
    showMs: 2500 + n*350,
    hint: 'Считай слева направо.',
    explain: [`Порядок был: ${list.join(' ')}.`, `${names[pos].charAt(0).toUpperCase()+names[pos].slice(1)} стоял ${list[pos]}.`],
    mtype:'attention'
  });
};

/* =========================================================================
   УРАВНЕНИЯ И ВЫРАЖЕНИЯ
   ========================================================================= */
GEN.blankOp = (p,d)=>{
  const max = sc(p.max, d);
  const plus = Math.random()<.5;
  let a, ans, res;
  if(plus){ a = R(1,max-1); ans = R(1, max-a); res = a+ans; }
  else { res = R(1,max-1); ans = R(1, max-res); a = res+ans; }
  const o = numOpts(ans, 2, { [res]:'condition', [a]:'condition' });
  return T({
    kind: max>10 ? 'input' : 'choice',
    q: 'Какое число пропущено?',
    say: plus ? `${a} плюс сколько будет ${res}?` : `${a} минус сколько будет ${res}?`,
    visual: { t:'expr', html:`${a} ${plus?'+':'−'} <span class="blank">?</span> = ${res}` },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: plus ? 'Сколько не хватает до результата?' : 'Сколько нужно убрать?',
    explain: [ plus ? `${res} − ${a} = ${ans}.` : `${a} − ${res} = ${ans}.`, `Проверяем: ${a} ${plus?'+':'−'} ${ans} = ${res}.` ],
    mtype:'sign'
  });
};

GEN.equation = (p,d)=>{
  const max = sc(p.max, d);
  const op = pick(p.ops);
  let x, a, res, expl;
  if(op === '+'){ x = R(1,max-1); a = R(1, max-x); res = x+a; expl = [`x = ${res} − ${a}`, `x = ${x}`]; }
  else if(op === '-'){ x = R(2,max); a = R(1,x); res = x-a; expl = [`x = ${res} + ${a}`, `x = ${x}`]; }
  else if(op === '*'){ x = R(2,9); a = R(2,9); res = x*a; expl = [`x = ${res} ÷ ${a}`, `x = ${x}`]; }
  else { a = R(2,9); x = a*R(2,9); res = x/a; expl = [`x = ${res} × ${a}`, `x = ${x}`]; }
  const sym = { '+':'+','-':'−','*':'×','/':'÷' }[op];
  const o = numOpts(x, 3, { [res]:'condition' });
  return T({
    kind:'input',
    q: 'Найди неизвестное число',
    say: `Реши уравнение: икс ${op==='+'?'плюс':op==='-'?'минус':op==='*'?'умножить на':'разделить на'} ${a} равно ${res}.`,
    visual: { t:'expr', html:`x ${sym} ${a} = ${res}` },
    options: o.options, mmap: o.mmap,
    answer: String(x),
    hint: 'Чтобы найти неизвестное, сделай обратное действие.',
    explain: ['Выполняем обратное действие.', ...expl],
    mtype:'formula'
  });
};

GEN.orderOps = (p,d)=>{
  const max = sc(p.max, d);
  const useMul = p.mul;
  const a = R(2, useMul?9:Math.min(20,max)), b = R(2, useMul?9:Math.min(20,max)), c = R(2, Math.min(20,max));
  let html, ans, steps, wrongCommon;
  if(p.par){
    ans = (a + b) * c;
    html = `(${a} + ${b}) × ${c}`;
    steps = [`Сначала скобки: ${a} + ${b} = ${a+b}.`, `Потом умножение: ${a+b} × ${c} = ${ans}.`];
    wrongCommon = a + b*c;
  } else if(useMul){
    ans = a + b*c;
    html = `${a} + ${b} × ${c}`;
    steps = [`Сначала умножение: ${b} × ${c} = ${b*c}.`, `Потом сложение: ${a} + ${b*c} = ${ans}.`];
    wrongCommon = (a+b)*c;
  } else {
    ans = a + b - c;
    html = `${a} + ${b} − ${c}`;
    steps = [`Слева направо: ${a} + ${b} = ${a+b}.`, `${a+b} − ${c} = ${ans}.`];
    wrongCommon = a + b + c;
  }
  const o = numOpts(ans, 4, { [wrongCommon]:'order' });
  o.options = shuffle([...new Set([String(ans), String(wrongCommon), String(ans+R(1,5)), String(Math.max(0,ans-R(1,5)))])].map(v=>({ t:v, v })));
  return T({
    kind:'input',
    q: 'Вычисли',
    say: 'Посчитай выражение. Не забудь про порядок действий.',
    visual: { t:'expr', html: html + ' = <span class="blank">?</span>' },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: 'Сначала скобки, потом × и ÷, потом + и −.',
    explain: steps,
    mtype:'order'
  });
};

/* =========================================================================
   ЗАДАЧИ
   ========================================================================= */
const NAMES = ['Маша','Айгуль','Данияр','Алина','Тимур','Дана','Арман','Камила','Ержан','Сауле'];
const OBJS = [['яблок','🍎'],['конфет','🍬'],['шариков','🎈'],['карандашей','✏️'],['машинок','🚗'],['наклеек','⭐'],['книг','📚'],['мячей','⚽']];

GEN.wordProblem = (p,d)=>{
  const max = sc(p.max, d);
  const nm = pick(NAMES), nm2 = pick(NAMES.filter(x=>x!==pick(NAMES)));
  const [ob, em] = pick(OBJS);
  const type = p.type;
  let text, ans, expl, hint, wrong, act;

  if(type === 'add'){
    const a = R(2, Math.floor(max/2)), b = R(1, Math.floor(max/2));
    ans = a+b;
    text = `У ${nm} было ${a} ${ob}. ${nm2} подарил${Math.random()<.5?'а':''} ещё ${b}. Сколько ${ob} стало у ${nm}?`;
    expl = ['Предметов стало больше — значит, складываем.', `${a} + ${b} = ${ans}.`];
    hint = 'Стало больше или меньше?';
    wrong = { [a-b>0?a-b:0]:'sign' }; act = '+';
  } else if(type === 'sub'){
    const a = R(3, max), b = R(1, a-1);
    ans = a-b;
    text = `У ${nm} было ${a} ${ob}. ${nm} отдал${Math.random()<.5?'а':''} ${b}. Сколько ${ob} осталось?`;
    expl = ['Предметов стало меньше — значит, вычитаем.', `${a} − ${b} = ${ans}.`];
    hint = 'После того как отдали — стало больше или меньше?';
    wrong = { [a+b]:'sign' }; act = '−';
  } else if(type === 'diff'){
    const a = R(3, max), b = R(1, a-1);
    ans = a-b;
    text = `У ${nm} ${a} ${ob}, а у ${nm2} — ${b}. На сколько у ${nm} больше?`;
    expl = ['«На сколько больше» — это вычитание.', `${a} − ${b} = ${ans}.`];
    hint = 'Сравниваем два числа: из большего вычитаем меньшее.';
    wrong = { [a+b]:'sign' }; act = '−';
  } else if(type === 'mul'){
    const a = R(2,9), b = R(2,9);
    ans = a*b;
    text = `В ${a} коробках по ${b} ${ob}. Сколько ${ob} всего?`;
    expl = ['Одинаковые группы — значит, умножаем.', `${a} × ${b} = ${ans}.`];
    hint = 'Группы одинаковые? Тогда это умножение.';
    wrong = { [a+b]:'sign' }; act = '×';
  } else if(type === 'div'){
    const b = R(2,9), q = R(2,9), a = b*q;
    ans = q;
    text = `${a} ${ob} разложили поровну в ${b} коробки. Сколько ${ob} в каждой?`;
    expl = ['Делим поровну — значит, делим.', `${a} ÷ ${b} = ${ans}.`];
    hint = 'Раздаём поровну — какое это действие?';
    wrong = { [a-b]:'sign' }; act = '÷';
  } else if(type === 'times'){
    const a = R(2, Math.max(3,Math.floor(max/10))), k = R(2,5);
    ans = a*k;
    text = `У ${nm} ${a} ${ob}, а у ${nm2} — в ${k} раза больше. Сколько ${ob} у ${nm2}?`;
    expl = [`«В ${k} раза больше» — значит, умножаем.`, `${a} × ${k} = ${ans}.`];
    hint = '«В несколько раз больше» — это умножение.';
    wrong = { [a+k]:'sign' }; act = '×';
  } else if(type === 'price'){
    const price = R(2, Math.max(5,Math.floor(max/10))), n = R(2,9);
    ans = price*n;
    text = `Одна тетрадь стоит ${price} тенге. Сколько стоят ${n} таких тетрадей?`;
    expl = ['Стоимость = цена × количество.', `${price} × ${n} = ${ans}.`];
    hint = 'Цена за одну штуку умножается на количество.';
    wrong = { [price+n]:'formula' }; act = '×';
  } else { /* share */
    const parts = R(2,6), each = R(2, Math.max(3,Math.floor(max/10))), a = parts*each;
    ans = each;
    text = `${a} ${ob} разделили на ${parts} равные части. Сколько в одной части?`;
    expl = ['Делим на равные части — деление.', `${a} ÷ ${parts} = ${ans}.`];
    hint = 'Равные части — это деление.';
    wrong = { [a-parts]:'sign' }; act = '÷';
  }

  const o = numOpts(ans, Math.max(2, Math.round(ans*0.2)), wrong);
  return T({
    kind: max > 20 ? 'input' : 'choice',
    q: text,
    say: text,
    visual: { t:'problem', em },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    act,
    hint,
    explain: expl,
    mtype:'condition'
  });
};

/* =========================================================================
   ГЕОМЕТРИЯ И ВЕЛИЧИНЫ
   ========================================================================= */
GEN.segment = (p,d)=>{
  const a = R(2, sc(p.max,d)), b = R(2, sc(p.max,d));
  const ans = a+b;
  const o = numOpts(ans, 3, { [Math.abs(a-b)]:'sign' });
  return T({
    kind:'input',
    q: 'Какова общая длина?',
    say: `Один отрезок ${a} сантиметров, другой ${b}. Какова общая длина?`,
    visual: { t:'bars', list:[{ w:a*8, h:14, c:'#4CC9F0', label:a+' см' },{ w:b*8, h:14, c:'#FF9F43', label:b+' см' }] },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: 'Длины складываются.',
    explain: [`${a} + ${b} = ${ans} см.`],
    mtype:'units'
  });
};

GEN.perimeter = (p,d)=>{
  const w = R(2, sc(p.max,d)), h = R(2, sc(p.max,d));
  const ans = 2*(w+h);
  const o = numOpts(ans, 5, { [w*h]:'formula', [w+h]:'formula' });
  return T({
    kind:'input',
    q: 'Найди периметр',
    say: `Прямоугольник: длина ${w}, ширина ${h}. Найди периметр.`,
    visual: { t:'rect', w, h, mode:'per' },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: 'Периметр — это длина всей границы.',
    explain: ['P = (a + b) × 2.', `(${w} + ${h}) × 2 = ${ans}.`],
    mtype:'formula'
  });
};

GEN.area = (p,d)=>{
  const w = R(2, sc(p.max,d)), h = R(2, sc(p.max,d));
  const ans = w*h;
  const o = numOpts(ans, 6, { [2*(w+h)]:'formula', [w+h]:'formula' });
  return T({
    kind:'input',
    q: 'Найди площадь',
    say: `Прямоугольник: длина ${w}, ширина ${h}. Найди площадь.`,
    visual: { t:'rect', w, h, mode:'area' },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: 'Площадь — это сколько клеточек поместится внутри.',
    explain: ['S = a × b.', `${w} × ${h} = ${ans}.`],
    mtype:'formula'
  });
};

GEN.volume = (p,d)=>{
  const a = R(2, sc(p.max,d)), b = R(2, sc(p.max,d)), c = R(2, sc(p.max,d));
  const ans = a*b*c;
  const o = numOpts(ans, 10, { [a+b+c]:'formula', [a*b]:'formula' });
  return T({
    kind:'input',
    q: 'Найди объём',
    say: `Коробка: длина ${a}, ширина ${b}, высота ${c}. Найди объём.`,
    visual: { t:'expr', html:`a = ${a}, b = ${b}, c = ${c}` },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: 'Объём — три измерения перемножаются.',
    explain: ['V = a × b × c.', `${a} × ${b} × ${c} = ${ans}.`],
    mtype:'formula'
  });
};

GEN.angles = ()=>{
  const kinds = [ { d:90, n:'Прямой', v:'right' }, { d:45, n:'Острый', v:'acute' }, { d:130, n:'Тупой', v:'obtuse' } ];
  const it = pick(kinds);
  const deg = it.v==='right' ? 90 : it.v==='acute' ? R(25,75) : R(100,160);
  return T({
    q: 'Какой это угол?',
    say: 'Посмотри на угол. Какой он?',
    visual: { t:'angle', deg },
    options: shuffle(kinds.map(k=>({ t:k.n, v:k.v }))),
    answer: it.v,
    hint: 'Прямой угол — как уголок тетради.',
    explain: [ it.v==='right' ? 'Это прямой угол — ровно 90°.' : it.v==='acute' ? 'Этот угол меньше прямого — острый.' : 'Этот угол больше прямого — тупой.' ],
    mtype:'logic'
  });
};

const MEASURE = {
  len1:  { q:'дм в см', from:'дм', to:'см', k:10,   max:9 },
  cmp1:  { cmp:true, units:[['см',1],['дм',10]] },
  len2:  { from:'м', to:'см', k:100, max:9 },
  mass2: { from:'кг', to:'г', k:1000, max:9 },
  time2: { from:'ч', to:'мин', k:60, max:9 },
  len3:  { from:'км', to:'м', k:1000, max:9 },
  mass3: { from:'кг', to:'г', k:1000, max:9 },
  time3: { from:'сут', to:'ч', k:24, max:7 },
  len4:  { from:'км', to:'м', k:1000, max:20 },
  mass4: { from:'т', to:'кг', k:1000, max:20 },
  time4: { from:'мин', to:'с', k:60, max:20 },
  area4: { from:'м²', to:'дм²', k:100, max:12 }
};

GEN.measure = (p,d)=>{
  const cfg = MEASURE[p.kind];
  if(cfg.cmp){
    const [u1,k1] = cfg.units[0], [u2,k2] = cfg.units[1];
    const a = R(2,30), b = R(1,5);
    const va = a*k1, vb = b*k2;
    const ans = va>vb ? '>' : va<vb ? '<' : '=';
    return T({
      q: 'Сравни величины',
      say: `Сравни: ${a} ${u1} и ${b} ${u2}.`,
      visual: { t:'expr', html:`${a} ${u1} <span class="blank">?</span> ${b} ${u2}` },
      options: [{ t:'>', v:'>' }, { t:'<', v:'<' }, { t:'=', v:'=' }],
      answer: ans,
      hint: 'Сначала переведи в одинаковые единицы.',
      explain: [`${b} ${u2} = ${vb} ${u1}.`, `Сравниваем ${va} и ${vb}: ${a} ${u1} ${ans} ${b} ${u2}.`],
      mtype:'units'
    });
  }
  const n = R(1, Math.max(2, Math.round(cfg.max * (d===1?0.4:d===2?0.7:1))));
  const ans = n * cfg.k;
  const o = numOpts(ans, cfg.k, { [n]:'units', [n*cfg.k/10]:'units' });
  return T({
    kind:'input',
    q: 'Переведи в другие единицы',
    say: `Сколько ${cfg.to} в ${n} ${cfg.from}?`,
    visual: { t:'expr', html:`${n} ${cfg.from} = <span class="blank">?</span> ${cfg.to}` },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: `В 1 ${cfg.from} — ${cfg.k} ${cfg.to}.`,
    explain: [`1 ${cfg.from} = ${cfg.k} ${cfg.to}.`, `${n} × ${cfg.k} = ${ans}.`],
    mtype:'units'
  });
};

/* =========================================================================
   ДРОБИ
   ========================================================================= */
GEN.fracShare = ()=>{
  const den = pick([2,3,4,5,6,8]);
  const num = R(1, den-1);
  const ans = `${num}/${den}`;
  const wrong = new Set();
  while(wrong.size<3){
    const dd = pick([2,3,4,5,6,8]), nn = R(1,dd-1);
    const v = `${nn}/${dd}`; if(v!==ans) wrong.add(v);
  }
  return T({
    q: 'Какая часть закрашена?',
    say: 'Посмотри на картинку. Какая часть закрашена?',
    visual: { t:'frac', n:num, d:den },
    options: shuffle([{ t:ans, v:ans }, ...[...wrong].map(w=>({ t:w, v:w }))]),
    answer: ans,
    hint: 'Внизу дроби — на сколько частей поделили, вверху — сколько взяли.',
    explain: [`Фигуру разделили на ${den} частей.`, `Закрашено ${num}.`, `Это ${ans}.`],
    mtype:'formula'
  });
};

GEN.fracOf = (p,d)=>{
  const den = pick([2,3,4,5,10]);
  const each = R(2, Math.max(3, Math.floor(sc(p.max,d)/den)));
  const total = den*each;
  const num = d===1 ? 1 : R(1, den-1);
  const ans = each*num;
  const o = numOpts(ans, Math.max(2,each), { [total/den*(den-num)]:'attention', [den]:'formula' });
  return T({
    kind:'input',
    q: `Найди ${num}/${den} от числа ${total}`,
    say: `Найди ${num===1?'одну':num} ${den===2?'вторую':den===3?'третью':den===4?'четвёртую':den===5?'пятую':'десятую'} от числа ${total}.`,
    visual: { t:'expr', html:`${num}/${den} от ${total} = <span class="blank">?</span>` },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: 'Сначала раздели на знаменатель, потом умножь на числитель.',
    explain: [`${total} ÷ ${den} = ${each}.`, `${each} × ${num} = ${ans}.`],
    mtype:'formula'
  });
};

GEN.fracCmp = ()=>{
  /* при знаменателе 2 числитель может быть только 1 — одинаковые дроби не сравнить */
  const sameDen = Math.random()<.5;
  const den = pick(sameDen ? [3,4,5,6,8,10] : [2,3,4,5,6,8,10]);
  let a, b, ans;
  if(sameDen){
    const nums = shuffle(Array.from({length:den-1},(_,i)=>i+1));
    a = { n:nums[0], d:den }; b = { n:nums[1], d:den };
  } else {
    const d2 = pick([2,3,4,5,6,8,10].filter(x=>x!==den));
    a = { n:1, d:den }; b = { n:1, d:d2 };
  }
  const va = a.n/a.d, vb = b.n/b.d;
  ans = va>vb ? '>' : va<vb ? '<' : '=';
  return T({
    q: 'Сравни дроби',
    say: 'Какая дробь больше?',
    visual: { t:'expr', html:`${a.n}/${a.d} <span class="blank">?</span> ${b.n}/${b.d}` },
    options: [{ t:'>', v:'>' }, { t:'<', v:'<' }, { t:'=', v:'=' }],
    answer: ans,
    hint: sameDen ? 'Знаменатели одинаковые — сравниваем числители.' : 'Чем больше знаменатель, тем меньше доля.',
    explain: sameDen ? [`Делили на одинаковое число частей.`, `${a.n} ${ans} ${b.n}, значит ${a.n}/${a.d} ${ans} ${b.n}/${b.d}.`]
                     : [`Чем на больше частей делим, тем меньше каждая часть.`, `${a.n}/${a.d} ${ans} ${b.n}/${b.d}.`],
    mtype:'compare'
  });
};

GEN.fracAdd = ()=>{
  const den = pick([4,5,6,8,10]);
  const a = R(1, den-2), b = R(1, den-a-1+1 > 0 ? den-a : 1);
  const sum = Math.min(a+b, den);
  const ans = `${sum}/${den}`;
  const wrong = [`${a+b}/${den+den}`, `${sum}/${den+1}`, `${Math.abs(a-b)||1}/${den}`];
  return T({
    q: 'Сложи дроби',
    say: `Сколько будет ${a} ${den}-х плюс ${b} ${den}-х?`,
    visual: { t:'expr', html:`${a}/${den} + ${b}/${den} = <span class="blank">?</span>` },
    options: shuffle([{ t:ans, v:ans }, ...[...new Set(wrong)].filter(w=>w!==ans).slice(0,3).map(w=>({ t:w, v:w }))]),
    answer: ans,
    hint: 'Знаменатель не меняется, складываем числители.',
    explain: ['Знаменатели одинаковые — складываем только числители.', `${a} + ${b} = ${sum}.`, `Получается ${ans}.`],
    mtype:'formula'
  });
};

/* =========================================================================
   ДВИЖЕНИЕ
   ========================================================================= */
GEN.speed = (p,d)=>{
  const v = pick([4,5,10,12,15,20,50,60,80]);
  const t = R(2, d===1?4:8);
  const s = v*t;
  const find = p.find;
  const ans = find==='v' ? v : find==='t' ? t : s;
  const q = find==='v' ? `Машина проехала ${s} км за ${t} ч. Какова скорость?`
          : find==='t' ? `Машина ехала со скоростью ${v} км/ч и проехала ${s} км. Сколько времени?`
          : `Машина ехала ${t} ч со скоростью ${v} км/ч. Какое расстояние она проехала?`;
  const expl = find==='v' ? ['v = s ÷ t.', `${s} ÷ ${t} = ${v} км/ч.`]
             : find==='t' ? ['t = s ÷ v.', `${s} ÷ ${v} = ${t} ч.`]
             : ['s = v × t.', `${v} × ${t} = ${s} км.`];
  const o = numOpts(ans, Math.max(3, Math.round(ans*0.3)), { [find==='s'? v+t : s]:'formula' });
  return T({
    kind:'input',
    q, say:q,
    visual: { t:'problem', em:'🚗' },
    options: o.options, mmap: o.mmap,
    answer: String(ans),
    hint: 'Вспомни: s = v × t.',
    explain: expl,
    mtype:'formula'
  });
};
