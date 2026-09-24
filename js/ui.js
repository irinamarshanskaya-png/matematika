/* ==========================================================================
   ui.js — персонаж, картинки заданий, речь, мелкие эффекты
   ========================================================================== */

const $  = (s,r)=> (r||document).querySelector(s);
const $$ = (s,r)=> [...(r||document).querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* -------------------------------------------------------------------------
   Персонаж — математический монстрик
   mood: idle | happy | cheer | think | oops
   ------------------------------------------------------------------------- */
function mascot(mood, size, cls){
  mood = mood || 'idle';
  size = size || 150;
  const mouth = {
    idle:  'M 78 133 Q 100 152 122 133',
    happy: 'M 72 128 Q 100 160 128 128',
    cheer: 'M 70 126 Q 100 166 130 126',
    think: 'M 88 140 Q 100 134 112 140',
    oops:  'M 80 148 Q 100 132 120 148'
  }[mood] || 'M 78 133 Q 100 152 122 133';
  const open = (mood === 'happy' || mood === 'cheer');
  const eyeY = mood === 'think' ? 102 : 105;
  const pupilDX = mood === 'think' ? 6 : 3;

  return `
  <svg class="mascot ${cls||''}" width="${size}" height="${size}" viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#A57BFF"/><stop offset="1" stop-color="#5B3FD1"/>
      </linearGradient>
      <linearGradient id="mb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#C9B3FF" stop-opacity=".55"/><stop offset="1" stop-color="#C9B3FF" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="mglow"><stop offset="0" stop-color="#8B5CF6" stop-opacity=".5"/><stop offset="1" stop-color="#8B5CF6" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="100" cy="120" rx="92" ry="78" fill="url(#mglow)"/>
    <g class="body">
      <path d="M 78 46 L 64 22" stroke="#7C5CE6" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M 122 46 L 136 22" stroke="#7C5CE6" stroke-width="6" stroke-linecap="round" fill="none"/>
      <circle cx="62" cy="18" r="8" fill="#FFD166"/>
      <circle cx="138" cy="18" r="8" fill="#4CC9F0"/>

      <path d="M 100 40 C 148 40 168 76 168 112 C 168 156 136 180 100 180 C 64 180 32 156 32 112 C 32 76 52 40 100 40 Z" fill="url(#mg)"/>
      <ellipse cx="100" cy="146" rx="46" ry="30" fill="url(#mb)"/>

      <ellipse cx="26" cy="126" rx="12" ry="17" fill="#7C5CE6" transform="rotate(-18 26 126)"/>
      <ellipse cx="174" cy="126" rx="12" ry="17" fill="#7C5CE6" transform="rotate(18 174 126)"/>

      <ellipse cx="78" cy="${eyeY}" rx="21" ry="${open?24:22}" fill="#fff"/>
      <ellipse cx="126" cy="${eyeY}" rx="21" ry="${open?24:22}" fill="#fff"/>
      <circle cx="${78+pupilDX}" cy="${eyeY+3}" r="9.5" fill="#241355"/>
      <circle cx="${126+pupilDX}" cy="${eyeY+3}" r="9.5" fill="#241355"/>
      <circle cx="${75+pupilDX}" cy="${eyeY-2}" r="3.6" fill="#fff"/>
      <circle cx="${123+pupilDX}" cy="${eyeY-2}" r="3.6" fill="#fff"/>
      <rect class="eyelid" x="57" y="${eyeY-25}" width="42" height="26" rx="12" fill="#8560EE" style="transform-box:fill-box;transform-origin:center bottom"/>
      <rect class="eyelid" x="105" y="${eyeY-25}" width="42" height="26" rx="12" fill="#8560EE" style="transform-box:fill-box;transform-origin:center bottom"/>

      <ellipse cx="52" cy="134" rx="11" ry="7" fill="#FF6B9D" opacity=".38"/>
      <ellipse cx="148" cy="134" rx="11" ry="7" fill="#FF6B9D" opacity=".38"/>

      <path d="${mouth}" stroke="#241355" stroke-width="6" stroke-linecap="round" fill="${open?'#3B1E63':'none'}"/>
      ${open ? '<ellipse cx="100" cy="146" rx="9" ry="6" fill="#FF6B9D"/>' : ''}
    </g>
  </svg>`;
}

/* -------------------------------------------------------------------------
   Фигуры
   ------------------------------------------------------------------------- */
function shapeSVG(s, c, size){
  size = size || 46;
  const h = size, w = size;
  const inner = {
    circle: `<circle cx="${w/2}" cy="${h/2}" r="${w/2-3}" fill="${c}"/>`,
    square: `<rect x="3" y="3" width="${w-6}" height="${h-6}" rx="6" fill="${c}"/>`,
    tri:    `<polygon points="${w/2},4 ${w-4},${h-5} 4,${h-5}" fill="${c}"/>`,
    rect:   `<rect x="2" y="${h*0.24}" width="${w-4}" height="${h*0.52}" rx="5" fill="${c}"/>`,
    oval:   `<ellipse cx="${w/2}" cy="${h/2}" rx="${w/2-2}" ry="${h/2-9}" fill="${c}"/>`
  }[s] || '';
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;
}

/* -------------------------------------------------------------------------
   Картинка задания
   ------------------------------------------------------------------------- */
function drawVisual(v){
  if(!v) return '';
  switch(v.t){

    case 'items': {
      const cls = v.small ? 'item small' : 'item';
      const st = v.small ? ' style="font-size:30px"' : '';
      return `<div class="items">${v.list.map((e,i)=>
        `<span class="${cls}${v.tap?' tappable':''}"${st} data-i="${i}">${e}</span>`).join('')}</div>`;
    }

    case 'groups': {
      const sep = v.sep ? `<div class="group-sep">${v.sep}</div>` : '';
      return `<div style="display:grid;gap:6px;justify-items:center;margin-bottom:16px">
        <div class="items" style="margin:0">${v.list[0].map(e=>`<span class="item">${e}</span>`).join('')}</div>
        ${sep}
        <div class="items" style="margin:0">${v.list[1].map(e=>`<span class="item">${e}</span>`).join('')}</div>
      </div>`;
    }

    case 'shapes': {
      const big = v.list.length === 1 && v.list[0].big;
      return `<div class="items">${v.list.map(x=>
        x.q ? `<span class="item">❓</span>`
            : `<span class="item" style="font-size:0">${shapeSVG(x.s, x.c, big?110:44)}</span>`).join('')}</div>`;
    }

    case 'row': {
      return `<div class="items" style="gap:10px">${v.list.map((x,i)=>
        `<span style="min-width:${v.em?'auto':'46px'};text-align:center;font-size:${v.em?'36px':'30px'};font-weight:900;
          ${i===v.mark?'color:var(--yellow)':''}">${x}</span>`).join('')}</div>`;
    }

    case 'expr':
      return `<div class="q-expr">${v.html}</div>`;

    case 'column': {
      const pad = Math.max(String(v.a).length, String(v.b).length) + 1;
      const f = n => String(n).padStart(pad,' ').replace(/ /g,'&nbsp;');
      return `<div class="q-expr" style="font-size:36px;line-height:1.15">
        <div style="display:inline-block;text-align:right">
          <div>${f(v.a)}</div>
          <div>${v.op}${f(v.b).slice(6)}</div>
          <div style="border-top:4px solid rgba(255,255,255,.6);margin-top:4px;padding-top:4px">
            <span class="blank">?</span></div>
        </div></div>`;
    }

    case 'clock': {
      const ah = ((v.h % 12) + v.m/60) * 30 - 90;
      const am = v.m * 6 - 90;
      const ticks = Array.from({length:12},(_,i)=>{
        const a = (i*30-90) * Math.PI/180;
        return `<circle cx="${100+Math.cos(a)*74}" cy="${100+Math.sin(a)*74}" r="${i%3===0?5:3}" fill="rgba(255,255,255,.75)"/>`;
      }).join('');
      const hand = (ang,len,wd,col)=>{
        const a = ang*Math.PI/180;
        return `<line x1="100" y1="100" x2="${100+Math.cos(a)*len}" y2="${100+Math.sin(a)*len}"
                stroke="${col}" stroke-width="${wd}" stroke-linecap="round"/>`;
      };
      return `<div style="display:grid;place-items:center;margin-bottom:14px">
        <svg width="190" height="190" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="92" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.28)" stroke-width="4"/>
          ${ticks}
          ${hand(ah,48,9,'#FFD166')}
          ${hand(am,70,6,'#4CC9F0')}
          <circle cx="100" cy="100" r="7" fill="#fff"/>
        </svg></div>`;
    }

    case 'bars': {
      return `<div style="display:grid;gap:14px;justify-items:center;margin-bottom:16px">
        ${v.list.map((b,i)=>`<div style="display:flex;align-items:center;gap:10px">
          <span class="muted" style="font-size:12px;width:56px;text-align:right">${i===0?'Первый':'Второй'}</span>
          <div style="width:${b.w}px;height:${b.h}px;border-radius:8px;background:${b.c}"></div>
          ${b.label?`<span class="muted" style="font-size:12px">${b.label}</span>`:''}
        </div>`).join('')}
      </div>`;
    }

    case 'box': {
      return `<div style="display:grid;place-items:center;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="border:4px solid #FFD166;border-radius:16px;padding:14px 16px;background:rgba(255,209,102,.12);
                      display:flex;gap:8px;font-size:34px">${v.inside.join('')}</div>
          <div style="display:flex;gap:8px;font-size:34px">${v.outside.join('')}</div>
        </div>
        <div class="muted" style="font-size:12px;margin-top:8px">коробка&nbsp;&nbsp;&nbsp;&nbsp;рядом</div>
      </div>`;
    }

    case 'money': {
      return `<div class="items" style="gap:6px">${v.coins.map(c=>
        `<span style="width:52px;height:52px;border-radius:50%;display:grid;place-items:center;
           background:radial-gradient(circle at 35% 30%,#FFE08A,#D99A1E);color:#5B3A00;
           font-weight:900;font-size:18px;border:2px solid #FFF0B8">${c}</span>`).join('')}</div>`;
    }

    case 'shop': {
      return `<div style="display:grid;place-items:center;gap:10px;margin-bottom:16px">
        <div style="font-size:56px">${v.em}</div>
        <div style="display:flex;gap:10px">
          <span class="counter">🪙 у тебя ${v.have}</span>
          <span class="counter">🏷️ цена ${v.price}</span>
        </div></div>`;
    }

    case 'frac': {
      const step = 360 / v.d;
      const arc = i=>{
        const a0 = (i*step-90)*Math.PI/180, a1 = ((i+1)*step-90)*Math.PI/180;
        const x0 = 80+Math.cos(a0)*72, y0 = 80+Math.sin(a0)*72;
        const x1 = 80+Math.cos(a1)*72, y1 = 80+Math.sin(a1)*72;
        return `<path d="M 80 80 L ${x0} ${y0} A 72 72 0 0 1 ${x1} ${y1} Z"
                fill="${i < v.n ? '#FF9F43' : 'rgba(255,255,255,.10)'}" stroke="#fff" stroke-width="2.5"/>`;
      };
      return `<div style="display:grid;place-items:center;margin-bottom:16px">
        <svg width="170" height="170" viewBox="0 0 160 160">
          ${Array.from({length:v.d},(_,i)=>arc(i)).join('')}
        </svg></div>`;
    }

    case 'rect': {
      const k = Math.min(200/v.w, 120/v.h, 22);
      const W = Math.max(60, v.w*k), H = Math.max(40, v.h*k);
      const grid = v.mode === 'area'
        ? Array.from({length:v.h},(_,r)=>Array.from({length:v.w},(_,c)=>
            `<rect x="${c*(W/v.w)}" y="${r*(H/v.h)}" width="${W/v.w}" height="${H/v.h}"
             fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1"/>`).join('')).join('')
        : '';
      return `<div style="display:grid;place-items:center;margin-bottom:16px">
        <svg width="${W+70}" height="${H+54}" viewBox="0 0 ${W+70} ${H+54}">
          <g transform="translate(14,10)">
            <rect width="${W}" height="${H}" fill="rgba(139,92,246,.22)" stroke="#A78BFA" stroke-width="3" rx="4"/>
            ${grid}
            <text x="${W/2}" y="${H+26}" text-anchor="middle" fill="#C9BDF0" font-size="15" font-weight="800">${v.w}</text>
            <text x="${W+22}" y="${H/2+5}" text-anchor="middle" fill="#C9BDF0" font-size="15" font-weight="800">${v.h}</text>
          </g></svg></div>`;
    }

    case 'angle': {
      const a = v.deg*Math.PI/180;
      return `<div style="display:grid;place-items:center;margin-bottom:16px">
        <svg width="190" height="150" viewBox="0 0 190 150">
          <line x1="30" y1="120" x2="175" y2="120" stroke="#4CC9F0" stroke-width="6" stroke-linecap="round"/>
          <line x1="30" y1="120" x2="${30+Math.cos(-a)*140}" y2="${120+Math.sin(-a)*140}"
                stroke="#FF9F43" stroke-width="6" stroke-linecap="round"/>
          <path d="M 66 120 A 36 36 0 0 0 ${30+Math.cos(-a)*36} ${120+Math.sin(-a)*36}"
                fill="none" stroke="rgba(255,255,255,.55)" stroke-width="3"/>
          <circle cx="30" cy="120" r="5" fill="#fff"/>
        </svg></div>`;
    }

    case 'problem':
      return `<div style="text-align:center;font-size:52px;margin-bottom:10px">${v.em}</div>`;
  }
  return '';
}

/* -------------------------------------------------------------------------
   Речь: тренер говорит
   ------------------------------------------------------------------------- */
const Speech = {
  on: true,
  voice: null,
  ready: false,
  init(){
    if(!('speechSynthesis' in window)) return;
    const pickVoice = ()=>{
      const all = speechSynthesis.getVoices().filter(v=>/ru/i.test(v.lang));
      if(!all.length) return;
      // живые нейроголоса Edge звучат заметно лучше системных
      this.voice = all.find(v=>/svetlana|светлана/i.test(v.name) && /natural|online/i.test(v.name))
                || all.find(v=>/natural|online/i.test(v.name))
                || all.find(v=>/svetlana|светлана/i.test(v.name))
                || all[0];
      this.ready = true;
    };
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  },
  say(text, opt){
    if(!this.on || !text || !('speechSynthesis' in window)) return;
    try{
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/[⭐🪙🔑🎯🔥✅❌👋]/g,''));
      u.lang = 'ru-RU';
      if(this.voice) u.voice = this.voice;
      u.rate = (opt && opt.rate) || 0.95;
      u.pitch = (opt && opt.pitch) || 1.0;
      speechSynthesis.speak(u);
    }catch(e){}
  },
  stop(){ try{ speechSynthesis.cancel(); }catch(e){} }
};

/* распознавание речи — только Edge/Chrome */
const Listen = {
  rec: null,
  get available(){ return !!(window.SpeechRecognition || window.webkitSpeechRecognition); },
  start(onResult, onEnd){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR) return false;
    Speech.stop();
    this.stop();
    const r = new SR();
    r.lang = 'ru-RU'; r.interimResults = false; r.maxAlternatives = 3;
    r.onresult = e=>{
      const alts = [...e.results[0]].map(a=>a.transcript);
      onResult(alts[0], alts);
    };
    r.onend = ()=>{ this.rec = null; onEnd && onEnd(); };
    r.onerror = ()=>{ this.rec = null; onEnd && onEnd(); };
    this.rec = r;
    try{ r.start(); return true; }catch(e){ return false; }
  },
  stop(){ if(this.rec){ try{ this.rec.stop(); }catch(e){} this.rec = null; } }
};

/* слова-числа → цифры (для голосовых ответов) */
const NUMWORDS = {
  'ноль':0,'один':1,'одна':1,'два':2,'две':2,'три':3,'четыре':4,'пять':5,'шесть':6,'семь':7,
  'восемь':8,'девять':9,'десять':10,'одиннадцать':11,'двенадцать':12,'тринадцать':13,
  'четырнадцать':14,'пятнадцать':15,'шестнадцать':16,'семнадцать':17,'восемнадцать':18,
  'девятнадцать':19,'двадцать':20,'тридцать':30,'сорок':40,'пятьдесят':50,'шестьдесят':60,
  'семьдесят':70,'восемьдесят':80,'девяносто':90,'сто':100
};
function parseNumber(text){
  if(!text) return null;
  const digits = String(text).match(/-?\d+/);
  if(digits) return Number(digits[0]);
  let sum = 0, found = false;
  String(text).toLowerCase().split(/[^а-яё]+/).forEach(w=>{
    if(NUMWORDS[w] !== undefined){ sum += NUMWORDS[w]; found = true; }
  });
  return found ? sum : null;
}

/* -------------------------------------------------------------------------
   Эффекты
   ------------------------------------------------------------------------- */
let toastTimer = null;
function toast(msg){
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('on'), 1800);
}

function flyReward(em, x, y){
  const el = document.createElement('div');
  el.className = 'fly';
  el.textContent = em;
  el.style.left = (x-13) + 'px';
  el.style.top  = (y-13) + 'px';
  $('#phone').appendChild(el);
  setTimeout(()=>el.remove(), 950);
}

function starRow(n){
  return `<span class="stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(5-n)}</span></span>`;
}
