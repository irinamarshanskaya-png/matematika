/* ==========================================================================
   trainer.js — личный тренер
   Никогда не ограничивается «правильно / неправильно»:
   ответ → анализ → объяснение → подсказка → похожее задание → возврат в маршрут.
   ========================================================================== */

const PRAISE = [
  'Отлично!', 'Верно!', 'Молодец!', 'Точно в цель!', 'Здорово!',
  'Так и есть!', 'Правильно!', 'Хорошо считаешь!', 'Умница!'
];
const PRAISE_COMBO = [
  'Уже {n} подряд — ты в ударе!',
  '{n} правильных подряд! Продолжаем.',
  'Серия из {n}! Отлично идёт.'
];
const SOFT = [
  'Почти! Давай разберём вместе.',
  'Чуть-чуть не хватило. Смотри, как проще.',
  'Хорошая попытка. Разберёмся вместе.',
  'Бывает. Сейчас покажу, как думать.'
];
const BACK = [
  'Вот теперь понятно! Идём дальше.',
  'Получилось! Возвращаемся к тренировке.',
  'Отлично, ты понял. Дальше!',
  'Вот так! Продолжаем.'
];
const HELLO = [
  'Привет, {name}! Давай потренируемся.',
  'Рад тебя видеть, {name}!',
  '{name}, готов считать?',
  'Привет, {name}! Сегодня будет интересно.'
];

const rnd = a => a[Math.floor(Math.random()*a.length)];

const Trainer = {

  greet(){
    const p = P();
    return rnd(HELLO).replace('{name}', p.name);
  },

  /* короткая подводка к теме */
  intro(task){
    return `Тема: ${task.topicTitle.toLowerCase()}. ${task.skillTitle}.`;
  },

  praise(combo){
    if(combo >= 3 && Math.random() < .55) return rnd(PRAISE_COMBO).replace('{n}', combo);
    return rnd(PRAISE);
  },

  back(){ return rnd(BACK); },

  /* ---------------------------------------------------------------
     Разбор ошибки: что именно пошло не так и как думать правильно
     --------------------------------------------------------------- */
  explain(task, given){
    const type = classify(task, given);
    const info = MISTAKES[type] || { name:'Ошибка', hint:'' };
    const lines = [];

    /* сначала — что видит тренер в ответе ребёнка */
    const a = Number(task.answer), g = Number(given);
    if(!isNaN(a) && !isNaN(g)){
      if(type === 'off_one')  lines.push(`Ты назвал ${g}, а правильно ${a}. Разница всего в единицу — значит, один предмет потерялся при счёте.`);
      else if(type === 'sign') lines.push(`Похоже, выбрано другое действие. Посмотри на знак ещё раз.`);
      else if(type === 'carry')lines.push(`Тут нужен переход через десяток — из-за него и разница.`);
      else if(type === 'borrow')lines.push(`Тут нужно занять десяток — из-за этого получилось другое число.`);
      else if(type === 'table')lines.push(`Это таблица умножения. Давай посчитаем группами.`);
      else if(type === 'order')lines.push(`Действия выполнены не в том порядке.`);
      else if(type === 'place')lines.push(`Похоже, разряды встали не на свои места.`);
    }
    if(type === 'condition') lines.push('Давай ещё раз перечитаем условие: что известно и что нужно найти.');
    if(type === 'compare')   lines.push('Сравним два числа внимательно.');
    if(type === 'units')     lines.push('Сначала приведём всё к одной мерке.');

    /* потом — сам разбор из задания */
    (task.explain || []).forEach(s=>lines.push(s));

    return { type, title: rnd(SOFT), name: info.name, hint: info.hint || task.hint, lines };
  },

  /* ---------------------------------------------------------------
     «Покажи, как ты думаешь» — вопрос до решения
     --------------------------------------------------------------- */
  probeFor(task){
    if(!task.act) return null;                 // пока только текстовые задачи
    if(task.d < 2 && Math.random() < .5) return null;
    const map = { '+':'Сложение', '−':'Вычитание', '×':'Умножение', '÷':'Деление' };
    return {
      q: 'Сначала подумай: какое действие тут нужно?',
      say: 'Прежде чем считать — какое действие нужно выполнить?',
      options: shuffle(Object.entries(map).map(([v,t])=>({ t, v }))),
      answer: task.act,
      wrongSay: 'Подумай ещё: предметов стало больше или меньше?'
    };
  },

  /* ---------------------------------------------------------------
     Итог тренировки
     --------------------------------------------------------------- */
  summary(right, total){
    const pct = total ? right/total : 0;
    if(pct === 1)     return 'Ни одной ошибки! Это отличная работа.';
    if(pct >= 0.8)    return 'Очень хороший результат. Ты растёшь!';
    if(pct >= 0.5)    return 'Хорошо поработали. Часть заданий разберём ещё раз.';
    return 'Сегодня было трудно — и это нормально. Завтра станет легче.';
  },

  /* что предложить тренировать дальше */
  advice(){
    const mt = weakMistake();
    if(mt && MISTAKES[mt]) return `Давай потренируем: ${MISTAKES[mt].name.toLowerCase()}. ${MISTAKES[mt].hint}.`;
    const w = weakestSkill(P().level);
    if(w) return `Предлагаю подтянуть тему «${w.topic.title}» — навык «${w.skill.title}».`;
    return 'Можем начать новую тему на карте.';
  }
};

/* ==========================================================================
   Голосовой режим: разбор свободного вопроса ребёнка
   ========================================================================== */
/* порядок важен: сначала самые однозначные слова */
const OPS = [
  { re:/умнож|×|\*/i,                     op:'*' },
  { re:/раздел|дел[иь]|÷|\//i,            op:'/' },
  { re:/минус|вычес|вычит|отним|−|-/i,    op:'-' },
  { re:/плюс|прибав|слож|\+/i,            op:'+' }
];

function parseExpression(text){
  if(!text) return null;
  const t = ' ' + String(text).toLowerCase() + ' ';
  const nums = [];
  /* цифры */
  (t.match(/\d+/g) || []).forEach(n=>nums.push(Number(n)));
  /* числа словами, если цифр не нашлось */
  if(nums.length < 2){
    const words = t.split(/[^а-яё]+/).filter(Boolean);
    let acc = null;
    words.forEach(w=>{
      if(NUMWORDS[w] !== undefined){
        if(acc === null) acc = NUMWORDS[w];
        else if(acc >= 20 && NUMWORDS[w] < 10) acc += NUMWORDS[w];
        else { nums.push(acc); acc = NUMWORDS[w]; }
      } else if(acc !== null){ nums.push(acc); acc = null; }
    });
    if(acc !== null) nums.push(acc);
  }
  if(nums.length < 2) return null;
  let op = null;
  for(const o of OPS) if(o.re.test(t)){ op = o.op; break; }
  if(!op) return null;
  const [a,b] = nums;
  const r = op==='+' ? a+b : op==='-' ? a-b : op==='*' ? a*b : (b ? a/b : null);
  if(r === null || !isFinite(r)) return null;
  return { a, b, op, r, nice: Number.isInteger(r) ? r : Math.round(r*100)/100 };
}

/* объяснение «как считать» для голоса */
function voiceExplain(e){
  const { a, b, op, nice } = e;
  if(op === '*'){
    const steps = Array.from({length:Math.min(b,10)},(_,i)=>a*(i+1)).join(', ');
    return `Это ${b} групп по ${a}. Считаем: ${steps}. Значит, ${a} умножить на ${b} равно ${nice}.`;
  }
  if(op === '+'){
    if(a % 10 + b % 10 > 10){
      const toTen = 10 - a % 10;
      return `Сначала дополним ${a} до круглого числа: плюс ${toTen} будет ${a+toTen}. Осталось прибавить ${b-toTen}. Получается ${nice}.`;
    }
    return `Берём ${a} и прибавляем ${b}. Получается ${nice}.`;
  }
  if(op === '-'){
    return `Начинаем с ${a} и отсчитываем назад ${b}. Получается ${nice}.`;
  }
  return `Делим ${a} на ${b} равных частей. В каждой получается ${nice}.`;
}
