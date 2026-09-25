/* ==========================================================================
   data.js — учебный план
   Структура: уровень → тема → навык → (генератор + параметры)
   Добавить класс = добавить запись в LEVELS и ветку в CURRICULUM.
   Никакой логики здесь нет — только содержание.
   ========================================================================== */

const LEVELS = [
  { id:'pre', title:'Предшкольная группа', short:'Предшкола', age:'5–6 лет',  em:'🎈', grade:0 },
  { id:'g1',  title:'1 класс',             short:'1',        age:'6–7 лет',  em:'📘', grade:1 },
  { id:'g2',  title:'2 класс',             short:'2',        age:'7–8 лет',  em:'📗', grade:2 },
  { id:'g3',  title:'3 класс',             short:'3',        age:'8–9 лет',  em:'📙', grade:3 },
  { id:'g4',  title:'4 класс',             short:'4',        age:'9–10 лет', em:'📕', grade:4 }
];

/* палитра тем */
const TC = {
  num:   'linear-gradient(140deg,#4ADE80,#16A34A)',
  cmp:   'linear-gradient(140deg,#38BDF8,#0284C7)',
  comp:  'linear-gradient(140deg,#A78BFA,#7C3AED)',
  add:   'linear-gradient(140deg,#FBBF24,#F97316)',
  sub:   'linear-gradient(140deg,#60A5FA,#2563EB)',
  mul:   'linear-gradient(140deg,#34D399,#059669)',
  div:   'linear-gradient(140deg,#F472B6,#DB2777)',
  geom:  'linear-gradient(140deg,#C084FC,#7E22CE)',
  space: 'linear-gradient(140deg,#22D3EE,#0891B2)',
  size:  'linear-gradient(140deg,#FCD34D,#D97706)',
  seq:   'linear-gradient(140deg,#F472B6,#BE185D)',
  logic: 'linear-gradient(140deg,#4ADE80,#15803D)',
  time:  'linear-gradient(140deg,#93C5FD,#3B82F6)',
  money: 'linear-gradient(140deg,#FBBF24,#B45309)',
  mem:   'linear-gradient(140deg,#FB7185,#E11D48)',
  eq:    'linear-gradient(140deg,#A78BFA,#6D28D9)',
  task:  'linear-gradient(140deg,#2DD4BF,#0D9488)',
  frac:  'linear-gradient(140deg,#FB923C,#EA580C)',
  meas:  'linear-gradient(140deg,#FDE68A,#CA8A04)'
};

/* -------------------------------------------------------------------------
   ПРЕДШКОЛЬНАЯ ГРУППА — 13 тем
   ------------------------------------------------------------------------- */
const PRE = [
  { id:'count', title:'Счёт', em:'🔢', bg:TC.num, desc:'Числа 1–20, прямой и обратный счёт', skills:[
    { id:'c5',    title:'Числа 1–5',        gen:'countObjects', p:{max:5} },
    { id:'c10',   title:'Числа 1–10',       gen:'countObjects', p:{max:10} },
    { id:'c20',   title:'Числа 1–20',       gen:'countObjects', p:{max:20} },
    { id:'cfwd',  title:'Прямой счёт',      gen:'countOrder',   p:{max:20, dir:1} },
    { id:'cback', title:'Обратный счёт',    gen:'countOrder',   p:{max:20, dir:-1} },
    { id:'cmiss', title:'Пропущенное число',gen:'countMissing', p:{max:20} },
    { id:'ctake', title:'Отсчитай столько же',gen:'countTake',  p:{max:10} }
  ]},

  { id:'compare', title:'Сравнение', em:'⚖️', bg:TC.cmp, desc:'Больше, меньше, поровну', skills:[
    { id:'more',  title:'Где больше',        gen:'compareGroups', p:{max:10, ask:'more'} },
    { id:'less',  title:'Где меньше',        gen:'compareGroups', p:{max:10, ask:'less'} },
    { id:'equal', title:'Поровну или нет',   gen:'compareEqual',  p:{max:10} },
    { id:'signs', title:'Знаки > < =',       gen:'compareSigns',  p:{max:10} },
    { id:'diff',  title:'На сколько больше', gen:'compareDiff',   p:{max:10} }
  ]},

  { id:'compose', title:'Состав числа', em:'🧱', bg:TC.comp, desc:'Число как сумма двух частей', skills:[
    { id:'cmp5',  title:'Состав числа 5',  gen:'composeNum', p:{n:5} },
    { id:'cmp7',  title:'Состав чисел до 7',gen:'composeNum',p:{n:7} },
    { id:'cmp10', title:'Состав числа 10', gen:'composeNum', p:{n:10} },
    { id:'part',  title:'Найди вторую часть',gen:'composePart',p:{max:10} }
  ]},

  { id:'add', title:'Сложение', em:'➕', bg:TC.add, desc:'Объединяем предметы и считаем', skills:[
    { id:'aobj',  title:'Складываем предметы', gen:'addObjects', p:{max:5} },
    { id:'a5',    title:'Сложение до 5',       gen:'addSimple',  p:{max:5} },
    { id:'a10',   title:'Сложение до 10',      gen:'addSimple',  p:{max:10} },
    { id:'aplus1',title:'Прибавь 1 и 2',       gen:'addSimple',  p:{max:10, fixed:[1,2]} }
  ]},

  { id:'sub', title:'Вычитание', em:'➖', bg:TC.sub, desc:'Убираем предметы и считаем', skills:[
    { id:'sobj',  title:'Убираем предметы', gen:'subObjects', p:{max:6} },
    { id:'s5',    title:'Вычитание до 5',   gen:'subSimple',  p:{max:5} },
    { id:'s10',   title:'Вычитание до 10',  gen:'subSimple',  p:{max:10} },
    { id:'sminus1',title:'Вычти 1 и 2',     gen:'subSimple',  p:{max:10, fixed:[1,2]} }
  ]},

  { id:'shapes', title:'Фигуры', em:'📐', bg:TC.geom, desc:'Круг, квадрат, треугольник и другие', skills:[
    { id:'sname', title:'Назови фигуру',     gen:'shapeName',  p:{} },
    { id:'sfind', title:'Найди фигуру',      gen:'shapeFind',  p:{} },
    { id:'scount',title:'Сколько фигур',     gen:'shapeCount', p:{} },
    { id:'ssame', title:'Одинаковые фигуры', gen:'shapeOdd',   p:{} }
  ]},

  { id:'space', title:'Пространство', em:'🧭', bg:TC.space, desc:'Справа, слева, между, внутри', skills:[
    { id:'lr',   title:'Справа и слева',    gen:'spaceRel', p:{kind:'lr'} },
    { id:'ud',   title:'Сверху и снизу',    gen:'spaceRel', p:{kind:'ud'} },
    { id:'inout',title:'Внутри и снаружи',  gen:'spaceRel', p:{kind:'inout'} },
    { id:'btw',  title:'Между и рядом',     gen:'spaceRel', p:{kind:'btw'} },
    { id:'ord',  title:'Первый и последний',gen:'spaceRel', p:{kind:'ord'} }
  ]},

  { id:'size', title:'Величины', em:'📏', bg:TC.size, desc:'Большой, длинный, тяжёлый', skills:[
    { id:'bigsm', title:'Большой и маленький', gen:'sizeCompare', p:{kind:'big'} },
    { id:'longsh',title:'Длинный и короткий',  gen:'sizeCompare', p:{kind:'long'} },
    { id:'tall',  title:'Высокий и низкий',    gen:'sizeCompare', p:{kind:'tall'} },
    { id:'wide',  title:'Широкий и узкий',     gen:'sizeCompare', p:{kind:'wide'} },
    { id:'heavy', title:'Тяжёлый и лёгкий',    gen:'sizeCompare', p:{kind:'heavy'} }
  ]},

  { id:'seq', title:'Закономерности', em:'🔁', bg:TC.seq, desc:'Что будет следующим', skills:[
    { id:'qcol',  title:'Цветные ряды',   gen:'seqPattern', p:{kind:'color'} },
    { id:'qsh',   title:'Ряды фигур',     gen:'seqPattern', p:{kind:'shape'} },
    { id:'qsz',   title:'Ряды по размеру',gen:'seqPattern', p:{kind:'size'} },
    { id:'qnum',  title:'Числовые ряды',  gen:'seqNumber',  p:{max:20} }
  ]},

  { id:'logic', title:'Логика', em:'🧠', bg:TC.logic, desc:'Лишнее, группы, изменения', skills:[
    { id:'odd',   title:'Найди лишнее',     gen:'logicOdd',     p:{} },
    { id:'group', title:'Раздели на группы',gen:'logicGroup',   p:{} },
    { id:'chg',   title:'Что изменилось',   gen:'logicChanged', p:{} },
    { id:'pair',  title:'Что к чему подходит',gen:'logicPair',  p:{} }
  ]},

  { id:'time', title:'Время', em:'⏰', bg:TC.time, desc:'Части суток, неделя, времена года', skills:[
    { id:'part',  title:'Утро, день, вечер, ночь', gen:'timeDayPart', p:{} },
    { id:'week',  title:'Дни недели',              gen:'timeWeek',    p:{} },
    { id:'seas',  title:'Времена года',            gen:'timeSeason',  p:{} },
    { id:'rel',   title:'Вчера, сегодня, завтра',  gen:'timeRelative',p:{} }
  ]},

  { id:'money', title:'Деньги', em:'💰', bg:TC.money, desc:'Магазин: покупаем и считаем сдачу', skills:[
    { id:'mcount',title:'Сколько монет',  gen:'moneyCount',  p:{max:10} },
    { id:'mbuy',  title:'Хватит ли монет',gen:'moneyBuy',    p:{max:10} },
    { id:'mchg',  title:'Сколько останется',gen:'moneyChange',p:{max:10} }
  ]},

  { id:'memory', title:'Память', em:'✨', bg:TC.mem, desc:'Запомни и вспомни', skills:[
    { id:'gone',  title:'Что исчезло',        gen:'memGone',   p:{} },
    { id:'howm',  title:'Сколько было',       gen:'memHowMany',p:{} },
    { id:'order', title:'Повтори по порядку', gen:'memOrder',  p:{} }
  ]}
];

/* -------------------------------------------------------------------------
   1 КЛАСС
   ------------------------------------------------------------------------- */
const G1 = [
  { id:'numbers', title:'Числа', em:'🔢', bg:TC.num, desc:'Числа до 20, разряды, соседи', skills:[
    { id:'n10',   title:'Числа до 10',      gen:'countObjects',  p:{max:10} },
    { id:'n20',   title:'Числа до 20',      gen:'numNeighbors',  p:{max:20} },
    { id:'ncmp',  title:'Сравнение чисел',  gen:'compareSigns',  p:{max:20} },
    { id:'norder',title:'Числовой ряд',     gen:'countMissing',  p:{max:20} },
    { id:'ncomp', title:'Состав числа 10',  gen:'composeNum',    p:{n:10} },
    { id:'ndec',  title:'Десяток и единицы',gen:'placeValue',    p:{max:20} }
  ]},
  { id:'add', title:'Сложение', em:'➕', bg:TC.add, desc:'Сложение в пределах 20', skills:[
    { id:'a10',  title:'Сложение до 10',      gen:'addSimple', p:{max:10} },
    { id:'a20',  title:'Сложение до 20',      gen:'addSimple', p:{max:20} },
    { id:'acar', title:'Переход через десяток',gen:'addCarry', p:{max:20} },
    { id:'a3',   title:'Три слагаемых',       gen:'addThree',  p:{max:20} }
  ]},
  { id:'sub', title:'Вычитание', em:'➖', bg:TC.sub, desc:'Вычитание в пределах 20', skills:[
    { id:'s10',  title:'Вычитание до 10',      gen:'subSimple', p:{max:10} },
    { id:'s20',  title:'Вычитание до 20',      gen:'subSimple', p:{max:20} },
    { id:'sbor', title:'Переход через десяток',gen:'subBorrow', p:{max:20} },
    { id:'schk', title:'Проверка вычитания',   gen:'subCheck',  p:{max:20} }
  ]},
  { id:'eq', title:'Уравнения', em:'🧩', bg:TC.eq, desc:'Найди неизвестное число', skills:[
    { id:'blank',title:'Заполни пропуск', gen:'blankOp',  p:{max:20} },
    { id:'ex',   title:'Найди x',         gen:'equation', p:{max:20, ops:['+','-']} }
  ]},
  { id:'tasks', title:'Задачи', em:'📚', bg:TC.task, desc:'Короткие текстовые задачи', skills:[
    { id:'t1',   title:'Стало больше',   gen:'wordProblem', p:{max:20, type:'add'} },
    { id:'t2',   title:'Стало меньше',   gen:'wordProblem', p:{max:20, type:'sub'} },
    { id:'t3',   title:'На сколько больше',gen:'wordProblem',p:{max:20, type:'diff'} }
  ]},
  { id:'meas', title:'Величины', em:'📏', bg:TC.meas, desc:'Сантиметр, дециметр, килограмм', skills:[
    { id:'len',  title:'Сантиметр и дециметр', gen:'measure', p:{kind:'len1'} },
    { id:'cmp',  title:'Сравни величины',      gen:'measure', p:{kind:'cmp1'} }
  ]},
  { id:'time', title:'Время', em:'⏰', bg:TC.time, desc:'Часы, неделя, месяцы', skills:[
    { id:'clock',title:'Который час',  gen:'timeClock', p:{step:60} },
    { id:'half', title:'Полчаса',      gen:'timeClock', p:{step:30} },
    { id:'week', title:'Дни недели',   gen:'timeWeek',  p:{} }
  ]},
  { id:'money', title:'Деньги', em:'💰', bg:TC.money, desc:'Тенге: покупки и сдача', skills:[
    { id:'buy',  title:'Покупки',  gen:'moneyChange', p:{max:20} },
    { id:'cnt',  title:'Сколько денег', gen:'moneyCount', p:{max:20} }
  ]},
  { id:'geom', title:'Геометрия', em:'📐', bg:TC.geom, desc:'Фигуры, отрезки, длина', skills:[
    { id:'fig',  title:'Фигуры',      gen:'shapeName',  p:{} },
    { id:'cnt',  title:'Сколько фигур',gen:'shapeCount',p:{} },
    { id:'seg',  title:'Длина отрезка',gen:'segment',   p:{max:20} }
  ]},
  { id:'logic', title:'Логика', em:'🧠', bg:TC.logic, desc:'Закономерности и рассуждения', skills:[
    { id:'seq',  title:'Числовые ряды', gen:'seqNumber', p:{max:20} },
    { id:'odd',  title:'Найди лишнее',  gen:'logicOdd',  p:{} },
    { id:'err',  title:'Найди ошибку',  gen:'findError', p:{max:20} }
  ]}
];

/* -------------------------------------------------------------------------
   2 КЛАСС
   ------------------------------------------------------------------------- */
const G2 = [
  { id:'numbers', title:'Числа', em:'🔢', bg:TC.num, desc:'Числа до 100, разряды', skills:[
    { id:'n100', title:'Числа до 100',   gen:'numNeighbors', p:{max:100} },
    { id:'plc',  title:'Десятки и единицы',gen:'placeValue', p:{max:100} },
    { id:'cmp',  title:'Сравнение чисел', gen:'compareSigns', p:{max:100} },
    { id:'rnd',  title:'Круглые числа',   gen:'roundTen',     p:{max:100} }
  ]},
  { id:'add', title:'Сложение', em:'➕', bg:TC.add, desc:'Сложение в пределах 100', skills:[
    { id:'a100', title:'Сложение до 100',   gen:'addSimple', p:{max:100} },
    { id:'acar', title:'С переходом',       gen:'addCarry',  p:{max:100} },
    { id:'acol', title:'Сложение столбиком',gen:'addColumn', p:{max:100} }
  ]},
  { id:'sub', title:'Вычитание', em:'➖', bg:TC.sub, desc:'Вычитание в пределах 100', skills:[
    { id:'s100', title:'Вычитание до 100',   gen:'subSimple', p:{max:100} },
    { id:'sbor', title:'С переходом',        gen:'subBorrow', p:{max:100} },
    { id:'scol', title:'Вычитание столбиком',gen:'subColumn', p:{max:100} }
  ]},
  { id:'mul', title:'Умножение', em:'✖️', bg:TC.mul, desc:'Смысл умножения и таблица', skills:[
    { id:'sense',title:'Что такое умножение',gen:'mulSense', p:{} },
    { id:'t23',  title:'Таблица на 2 и 3',  gen:'mulTable', p:{a:[2,3]} },
    { id:'t45',  title:'Таблица на 4 и 5',  gen:'mulTable', p:{a:[4,5]} },
    { id:'t67',  title:'Таблица на 6 и 7',  gen:'mulTable', p:{a:[6,7]} },
    { id:'t89',  title:'Таблица на 8 и 9',  gen:'mulTable', p:{a:[8,9]} }
  ]},
  { id:'div', title:'Деление', em:'➗', bg:TC.div, desc:'Деление на равные части', skills:[
    { id:'sense',title:'Что такое деление', gen:'divSense', p:{} },
    { id:'d25',  title:'Деление на 2–5',    gen:'divTable', p:{a:[2,3,4,5]} },
    { id:'d69',  title:'Деление на 6–9',    gen:'divTable', p:{a:[6,7,8,9]} }
  ]},
  { id:'expr', title:'Выражения', em:'🧮', bg:TC.eq, desc:'Порядок действий и скобки', skills:[
    { id:'ord',  title:'Порядок действий', gen:'orderOps', p:{max:100} },
    { id:'par',  title:'Скобки',           gen:'orderOps', p:{max:100, par:true} },
    { id:'eq',   title:'Уравнения',        gen:'equation', p:{max:100, ops:['+','-']} }
  ]},
  { id:'tasks', title:'Задачи', em:'📚', bg:TC.task, desc:'Задачи в два действия', skills:[
    { id:'t1',   title:'Больше и меньше', gen:'wordProblem', p:{max:100, type:'add'} },
    { id:'t2',   title:'Осталось',        gen:'wordProblem', p:{max:100, type:'sub'} },
    { id:'t3',   title:'Задачи на умножение',gen:'wordProblem',p:{max:100, type:'mul'} },
    { id:'t4',   title:'Задачи на деление',  gen:'wordProblem',p:{max:100, type:'div'} }
  ]},
  { id:'meas', title:'Величины', em:'📏', bg:TC.meas, desc:'Метр, сантиметр, литр, килограмм', skills:[
    { id:'len',  title:'Длина', gen:'measure', p:{kind:'len2'} },
    { id:'mass', title:'Масса и объём', gen:'measure', p:{kind:'mass2'} }
  ]},
  { id:'time', title:'Время', em:'⏰', bg:TC.time, desc:'Часы, минуты', skills:[
    { id:'clock',title:'Который час', gen:'timeClock', p:{step:5} },
    { id:'unit', title:'Часы и минуты',gen:'measure',  p:{kind:'time2'} }
  ]},
  { id:'geom', title:'Геометрия', em:'📐', bg:TC.geom, desc:'Периметр и фигуры', skills:[
    { id:'per',  title:'Периметр',  gen:'perimeter', p:{max:20} },
    { id:'fig',  title:'Фигуры',    gen:'shapeName', p:{} }
  ]},
  { id:'logic', title:'Логика', em:'🧠', bg:TC.logic, desc:'Ряды, ошибки, рассуждения', skills:[
    { id:'seq',  title:'Числовые ряды', gen:'seqNumber', p:{max:100} },
    { id:'err',  title:'Найди ошибку',  gen:'findError', p:{max:100} }
  ]}
];

/* -------------------------------------------------------------------------
   3 КЛАСС
   ------------------------------------------------------------------------- */
const G3 = [
  { id:'numbers', title:'Числа', em:'🔢', bg:TC.num, desc:'Числа до 1000', skills:[
    { id:'n1000',title:'Числа до 1000',  gen:'numNeighbors', p:{max:1000} },
    { id:'plc',  title:'Разряды',        gen:'placeValue',   p:{max:1000} },
    { id:'cmp',  title:'Сравнение чисел',gen:'compareSigns', p:{max:1000} }
  ]},
  { id:'add', title:'Сложение', em:'➕', bg:TC.add, desc:'Сложение до 1000', skills:[
    { id:'a1000',title:'Сложение до 1000',gen:'addSimple', p:{max:1000} },
    { id:'acol', title:'Столбиком',       gen:'addColumn', p:{max:1000} }
  ]},
  { id:'sub', title:'Вычитание', em:'➖', bg:TC.sub, desc:'Вычитание до 1000', skills:[
    { id:'s1000',title:'Вычитание до 1000',gen:'subSimple', p:{max:1000} },
    { id:'scol', title:'Столбиком',        gen:'subColumn', p:{max:1000} }
  ]},
  { id:'mul', title:'Умножение', em:'✖️', bg:TC.mul, desc:'Внетабличное умножение', skills:[
    { id:'tab',  title:'Вся таблица',       gen:'mulTable',  p:{a:[2,3,4,5,6,7,8,9]} },
    { id:'x10',  title:'Умножение на 10 и 100',gen:'mulRound',p:{max:1000} },
    { id:'out',  title:'Внетабличное',      gen:'mulOuter',  p:{max:1000} }
  ]},
  { id:'div', title:'Деление', em:'➗', bg:TC.div, desc:'Деление с остатком', skills:[
    { id:'tab',  title:'Вся таблица',      gen:'divTable', p:{a:[2,3,4,5,6,7,8,9]} },
    { id:'rem',  title:'Деление с остатком',gen:'divRem',  p:{max:100} },
    { id:'out',  title:'Внетабличное',     gen:'divOuter', p:{max:1000} }
  ]},
  { id:'expr', title:'Выражения', em:'🧮', bg:TC.eq, desc:'Порядок действий, уравнения', skills:[
    { id:'ord',  title:'Порядок действий', gen:'orderOps', p:{max:100, mul:true} },
    { id:'par',  title:'Скобки',           gen:'orderOps', p:{max:100, mul:true, par:true} },
    { id:'eq',   title:'Уравнения',        gen:'equation', p:{max:100, ops:['+','-','*','/']} }
  ]},
  { id:'frac', title:'Доли и дроби', em:'🍕', bg:TC.frac, desc:'Половина, треть, четверть', skills:[
    { id:'sh',   title:'Доли фигуры',  gen:'fracShare', p:{} },
    { id:'of',   title:'Доля от числа',gen:'fracOf',    p:{max:100} }
  ]},
  { id:'geom', title:'Геометрия', em:'📐', bg:TC.geom, desc:'Периметр и площадь', skills:[
    { id:'per',  title:'Периметр', gen:'perimeter', p:{max:40} },
    { id:'area', title:'Площадь',  gen:'area',      p:{max:20} }
  ]},
  { id:'meas', title:'Величины', em:'📏', bg:TC.meas, desc:'Метры, граммы, литры', skills:[
    { id:'len',  title:'Длина',  gen:'measure', p:{kind:'len3'} },
    { id:'mass', title:'Масса',  gen:'measure', p:{kind:'mass3'} },
    { id:'time', title:'Время',  gen:'measure', p:{kind:'time3'} }
  ]},
  { id:'tasks', title:'Задачи', em:'📚', bg:TC.task, desc:'Задачи в два–три действия', skills:[
    { id:'t1',   title:'Умножение и деление',gen:'wordProblem', p:{max:100, type:'mul'} },
    { id:'t2',   title:'В несколько раз',    gen:'wordProblem', p:{max:100, type:'times'} },
    { id:'t3',   title:'Цена, количество, стоимость',gen:'wordProblem',p:{max:100, type:'price'} }
  ]},
  { id:'logic', title:'Логика', em:'🧠', bg:TC.logic, desc:'Ряды, ошибки, рассуждения', skills:[
    { id:'seq',  title:'Числовые ряды', gen:'seqNumber', p:{max:200} },
    { id:'err',  title:'Найди ошибку',  gen:'findError', p:{max:200} }
  ]}
];

/* -------------------------------------------------------------------------
   4 КЛАСС
   ------------------------------------------------------------------------- */
const G4 = [
  { id:'numbers', title:'Числа', em:'🔢', bg:TC.num, desc:'Многозначные числа', skills:[
    { id:'big',  title:'Многозначные числа',gen:'numNeighbors', p:{max:100000} },
    { id:'plc',  title:'Разряды и классы',  gen:'placeValue',   p:{max:100000} },
    { id:'cmp',  title:'Сравнение чисел',   gen:'compareSigns', p:{max:100000} }
  ]},
  { id:'addsub', title:'Сложение и вычитание', em:'➕', bg:TC.add, desc:'Многозначные числа столбиком', skills:[
    { id:'a',    title:'Сложение', gen:'addColumn', p:{max:10000} },
    { id:'s',    title:'Вычитание',gen:'subColumn', p:{max:10000} }
  ]},
  { id:'mul', title:'Умножение', em:'✖️', bg:TC.mul, desc:'Умножение многозначных чисел', skills:[
    { id:'x1',   title:'На однозначное', gen:'mulOuter', p:{max:10000} },
    { id:'x10',  title:'На 10, 100, 1000',gen:'mulRound',p:{max:100000} },
    { id:'x2',   title:'На двузначное',  gen:'mulTwo',   p:{max:10000} }
  ]},
  { id:'div', title:'Деление', em:'➗', bg:TC.div, desc:'Деление многозначных чисел', skills:[
    { id:'d1',   title:'На однозначное', gen:'divOuter', p:{max:10000} },
    { id:'rem',  title:'С остатком',     gen:'divRem',   p:{max:1000} },
    { id:'d10',  title:'На 10, 100, 1000',gen:'divRound',p:{max:100000} }
  ]},
  { id:'frac', title:'Дроби', em:'🍕', bg:TC.frac, desc:'Обыкновенные дроби', skills:[
    { id:'read', title:'Читаем дроби',   gen:'fracShare', p:{} },
    { id:'of',   title:'Дробь от числа', gen:'fracOf',    p:{max:1000} },
    { id:'cmp',  title:'Сравнение дробей',gen:'fracCmp',  p:{} },
    { id:'add',  title:'Сложение дробей',gen:'fracAdd',   p:{} }
  ]},
  { id:'expr', title:'Выражения и уравнения', em:'🧩', bg:TC.eq, desc:'Порядок действий, уравнения', skills:[
    { id:'ord',  title:'Порядок действий',gen:'orderOps', p:{max:1000, mul:true, par:true} },
    { id:'eq',   title:'Уравнения',       gen:'equation', p:{max:1000, ops:['+','-','*','/']} }
  ]},
  { id:'speed', title:'Движение', em:'🚗', bg:TC.task, desc:'Скорость, время, расстояние', skills:[
    { id:'s',    title:'Найди скорость',    gen:'speed', p:{find:'v'} },
    { id:'t',    title:'Найди время',       gen:'speed', p:{find:'t'} },
    { id:'d',    title:'Найди расстояние',  gen:'speed', p:{find:'s'} }
  ]},
  { id:'geom', title:'Геометрия', em:'📐', bg:TC.geom, desc:'Периметр, площадь, объём', skills:[
    { id:'per',  title:'Периметр', gen:'perimeter', p:{max:100} },
    { id:'area', title:'Площадь',  gen:'area',      p:{max:40} },
    { id:'vol',  title:'Объём',    gen:'volume',    p:{max:20} },
    { id:'ang',  title:'Углы',     gen:'angles',    p:{} }
  ]},
  { id:'meas', title:'Величины', em:'📏', bg:TC.meas, desc:'Единицы длины, массы, времени, площади', skills:[
    { id:'len',  title:'Длина',   gen:'measure', p:{kind:'len4'} },
    { id:'mass', title:'Масса',   gen:'measure', p:{kind:'mass4'} },
    { id:'time', title:'Время',   gen:'measure', p:{kind:'time4'} },
    { id:'area', title:'Площадь', gen:'measure', p:{kind:'area4'} }
  ]},
  { id:'tasks', title:'Задачи', em:'📚', bg:TC.task, desc:'Составные задачи', skills:[
    { id:'t1',   title:'Цена, количество, стоимость',gen:'wordProblem',p:{max:1000, type:'price'} },
    { id:'t2',   title:'В несколько раз',   gen:'wordProblem', p:{max:1000, type:'times'} },
    { id:'t3',   title:'На части',          gen:'wordProblem', p:{max:1000, type:'share'} }
  ]},
  { id:'logic', title:'Логика', em:'🧠', bg:TC.logic, desc:'Закономерности и ошибки', skills:[
    { id:'seq',  title:'Числовые ряды', gen:'seqNumber', p:{max:1000} },
    { id:'err',  title:'Найди ошибку',  gen:'findError', p:{max:1000} }
  ]}
];

const CURRICULUM = { pre:PRE, g1:G1, g2:G2, g3:G3, g4:G4 };

/* -------------------------------------------------------------------------
   Типы ошибок — для разбора и для родительского отчёта
   ------------------------------------------------------------------------- */
const MISTAKES = {
  count:     { name:'Ошибка счёта',            hint:'Считаем вслух и по одному' },
  off_one:   { name:'Сбился на единицу',       hint:'Последний предмет тоже считаем' },
  sign:      { name:'Перепутал знак',          hint:'Смотрим: прибавляем или убираем' },
  carry:     { name:'Переход через десяток',   hint:'Сначала дополняем до 10' },
  borrow:    { name:'Занимаем десяток',        hint:'Разбиваем десяток на единицы' },
  table:     { name:'Таблица умножения',       hint:'Считаем группами' },
  order:     { name:'Порядок действий',        hint:'Сначала × и ÷, потом + и −' },
  condition: { name:'Не понял условие',        hint:'Перечитываем: что известно, что ищем' },
  formula:   { name:'Не та формула',           hint:'Вспоминаем правило' },
  units:     { name:'Перепутал единицы',       hint:'Сначала приводим к одной мерке' },
  attention: { name:'Невнимательность',        hint:'Проверяем ответ ещё раз' },
  place:     { name:'Разряды',                 hint:'Единицы под единицами, десятки под десятками' },
  compare:   { name:'Сравнение',               hint:'Клювик смотрит на большее' },
  logic:     { name:'Рассуждение',             hint:'Ищем общий признак' },
  space:     { name:'Пространство',            hint:'Показываем рукой, где это' },
  time:      { name:'Время',                   hint:'Вспоминаем порядок' }
};

/* -------------------------------------------------------------------------
   Достижения
   ------------------------------------------------------------------------- */
const ACHIEVEMENTS = [
  { id:'first',  em:'🎉', name:'Первый шаг',        desc:'Первая тренировка',            test:s=>s.totalSessions>=1 },
  { id:'ten',    em:'🔟', name:'Десяточка',         desc:'10 правильных ответов',        test:s=>s.totalRight>=10 },
  { id:'fifty',  em:'💪', name:'Полста',            desc:'50 правильных ответов',        test:s=>s.totalRight>=50 },
  { id:'hundred',em:'🏆', name:'Сотня',             desc:'100 правильных ответов',       test:s=>s.totalRight>=100 },
  { id:'streak3',em:'🔥', name:'Три дня подряд',    desc:'Серия 3 дня',                  test:s=>s.bestStreak>=3 },
  { id:'streak7',em:'⚡', name:'Неделя без пропусков',desc:'Серия 7 дней',               test:s=>s.bestStreak>=7 },
  { id:'combo5', em:'🎯', name:'Пять подряд',       desc:'5 правильных ответов подряд',  test:s=>s.bestCombo>=5 },
  { id:'combo10',em:'🌟', name:'Десять подряд',     desc:'10 правильных ответов подряд', test:s=>s.bestCombo>=10 },
  { id:'perfect',em:'💎', name:'Без единой ошибки', desc:'Тренировка на 100%',           test:s=>s.perfectSessions>=1 },
  { id:'master1',em:'⭐', name:'Первый навык освоен',desc:'Навык на 5 звёзд',            test:s=>s.masteredSkills>=1 },
  { id:'master5',em:'👑', name:'Пять навыков',      desc:'5 навыков на 5 звёзд',         test:s=>s.masteredSkills>=5 },
  { id:'coins50',em:'🪙', name:'Копилка',           desc:'50 монет накоплено',           test:s=>s.totalCoins>=50 },
  { id:'diag',   em:'🧭', name:'Знаю свой уровень', desc:'Пройдена диагностика',         test:s=>s.diagDone },
  { id:'ready',  em:'🎒', name:'Готов к школе',     desc:'Пройден выпускной тест',       test:s=>s.readyDone }
];

/* ==========================================================================
   ОТДЕЛЬНАЯ ТРЕНИРОВКА ТАБЛИЦЫ УМНОЖЕНИЯ
   Свой раздел: не привязан к классу и к маршруту на карте, поэтому и уровень
   у него собственный — прогресс по числам не смешивается с темами класса.
   ========================================================================== */
const MUL_LEVEL = 'mult';
const MUL_TOPIC = { id:'tab', title:'Таблица умножения', em:'✖️', bg:TC.mul,
                    desc:'Тренировка по каждому числу' };
const MUL_SKILLS = [2,3,4,5,6,7,8,9].map(n=>(
  { id:'x'+n, n, title:'Таблица на '+n, gen:'mulTable', p:{ a:[n] } }
));
const MUL_ALL = { id:'all', title:'Вся таблица', gen:'mulTable', p:{ a:[2,3,4,5,6,7,8,9] } };
