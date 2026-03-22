// ============================================================
//  GEM QUEST — Retro Action RPG (完全版)
// ============================================================

const canvas  = document.getElementById('gameCanvas');
const ctx     = canvas.getContext('2d');
const TILE    = 32;
const COLS    = 20;
const ROWS    = 14;
const W       = TILE * COLS;   // 640
const H       = TILE * ROWS;   // 448
const HUD_H   = 48;
const GAME_H  = H + HUD_H;

canvas.width  = W;
canvas.height = GAME_H;
const gameContainer = document.getElementById('gameContainer');

function colorWithAlpha(color, alpha) {
  if (typeof color !== 'string') return color;
  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(ch => ch + ch).join('');
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
  }
  return color;
}

function fitGameToViewport() {
  const margin = 24;
  const availableWidth = Math.max(240, window.innerWidth - margin);
  const availableHeight = Math.max(240, window.innerHeight - margin);
  const scale = Math.min(availableWidth / W, availableHeight / GAME_H, 1);
  const width = Math.floor(W * scale);
  const height = Math.floor(GAME_H * scale);
  gameContainer.style.width = width + 'px';
  gameContainer.style.height = height + 'px';
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
}

fitGameToViewport();
window.addEventListener('resize', fitGameToViewport);

// ============================================================
//  パレット / カラー定数
// ============================================================
const C = {
  sand     : '#c8a96e',
  sandDark : '#a8895a',
  sandStar : '#b89a60',
  water    : '#3a7fc1',
  waterL   : '#5aafdf',
  waterD   : '#1a4f8a',
  wood     : '#8b5e3c',
  woodD    : '#6b4a2c',
  stone    : '#888',
  stoneD   : '#666',
  stoneH   : '#aaa',
  rock     : '#555',
  hudBg    : '#0d1117',
  hudBdr   : '#2a4a7a',
  hpFull   : '#3af',
  hpLow    : '#f53',
  expBar   : '#f80',
  gemClr   : '#0ef',
  white    : '#fff',
  black    : '#000',
  yellow   : '#ff0',
  red      : '#f00',
};

// ============================================================
//  タイル定義  0=砂 1=水 2=木桟橋H 3=木桟橋V 4=石ブロック
// ============================================================
const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,4,4,0,0,0,0,4,0,0,0,0,4,4,0,0,0,1],
  [1,0,0,4,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,1],
  [1,0,0,0,0,0,0,4,0,0,0,0,4,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,4,0,0,0,0,0,0,0,0,4,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,1],
  [1,0,0,4,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,4,4,0,0,0,0,0,4,0,0,0,4,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ============================================================
//  入力管理
// ============================================================
const Input = {
  keys: {},
  pressed: {},
  mobile: { up:false, down:false, left:false, right:false, attack:false, skill:false },
  mobilePressed: { attack:false, skill:false },
  startRequested: false,
  init() {
    window.addEventListener('keydown', e => {
      if (!this.keys[e.code]) this.pressed[e.code] = true;
      this.keys[e.code] = true;
      e.preventDefault();
    });
    window.addEventListener('keyup',  e => { this.keys[e.code] = false; });
    this._bindMobile();
    this._bindStartInputs();
  },
  _bindMobile() {
    const map = {
      'btn-up':'up','btn-down':'down','btn-left':'left','btn-right':'right',
      'btn-attack':'attack','btn-skill':'skill'
    };
    Object.entries(map).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', e => {
        if (!this.mobile[key] && key in this.mobilePressed) this.mobilePressed[key] = true;
        this.mobile[key]=true;
        if (e.cancelable) e.preventDefault();
      }, {passive:false});
      el.addEventListener('touchend',   e => {
        this.mobile[key]=false;
        if (e.cancelable) e.preventDefault();
      }, {passive:false});
      el.addEventListener('touchcancel', () => { this.mobile[key]=false; });
      el.addEventListener('mousedown',  () => {
        if (!this.mobile[key] && key in this.mobilePressed) this.mobilePressed[key] = true;
        this.mobile[key]=true;
      });
      el.addEventListener('mouseup',    () => this.mobile[key]=false);
      el.addEventListener('mouseleave', () => this.mobile[key]=false);
    });
  },
  _bindStartInputs() {
    const requestStart = e => {
      if (e && e.cancelable) e.preventDefault();
      this.startRequested = true;
    };
    [document.getElementById('gameCanvas'), document.getElementById('gameContainer')].forEach(el => {
      if (!el) return;
      el.addEventListener('click', requestStart);
      el.addEventListener('touchstart', requestStart, { passive:false });
    });
  },
  isDown(code)    { return !!this.keys[code] || !!this.mobile[code]; },
  wasPressed(code){ const v=!!this.pressed[code]; if(v) delete this.pressed[code]; return v; },
  consumeMobilePressed(key) {
    const v = !!this.mobilePressed[key];
    if (v) this.mobilePressed[key] = false;
    return v;
  },
  consumeStart()  { const v=!!this.startRequested; this.startRequested=false; return v; },
  get left()   { return this.isDown('ArrowLeft')  || this.isDown('KeyA') || this.mobile.left;  },
  get right()  { return this.isDown('ArrowRight') || this.isDown('KeyD') || this.mobile.right; },
  get up()     { return this.isDown('ArrowUp')    || this.isDown('KeyW') || this.mobile.up;    },
  get down()   { return this.isDown('ArrowDown')  || this.isDown('KeyS') || this.mobile.down;  },
  get attack() { return this.isDown('KeyZ') || this.isDown('Space') || this.mobile.attack; },
  get skill()  { return this.isDown('KeyX') || this.mobile.skill; },
  attackPressed() { const v=this.wasPressed('KeyZ')||this.wasPressed('Space'); return v||this.consumeMobilePressed('attack'); },
  skillPressed()  { const v=this.wasPressed('KeyX'); return v||this.consumeMobilePressed('skill'); },
};

// ============================================================
//  パーティクル
// ============================================================
class Particle {
  constructor(x,y,vx,vy,color,life,size=3,gravity=0) {
    Object.assign(this, {x,y,vx,vy,color,life,maxLife:life,size,gravity});
  }
  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.vy += this.gravity * dt;
    this.life -= dt;
  }
  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    const s = this.size * alpha;
    ctx.fillRect(this.x - s/2, this.y - s/2, s, s);
    ctx.globalAlpha = 1;
  }
  get dead() { return this.life <= 0; }
}

const particles = [];
function spawnParticles(x, y, color, count=8, speed=80, size=4, life=0.5, gravity=0) {
  for (let i=0; i<count; i++) {
    const ang = (Math.PI*2 * i / count) + Math.random()*0.5;
    const spd = speed * (0.5 + Math.random()*0.8);
    particles.push(new Particle(x,y, Math.cos(ang)*spd, Math.sin(ang)*spd, color, life*(0.7+Math.random()*0.6), size, gravity));
  }
}
function spawnHitEffect(x, y) {
  spawnParticles(x, y, '#fff', 6, 120, 3, 0.3);
  spawnParticles(x, y, '#f80', 4, 80,  4, 0.4);
}
function spawnGemEffect(x, y) {
  spawnParticles(x, y, '#0ef', 8, 60,  4, 0.6);
  spawnParticles(x, y, '#fff', 4, 40,  2, 0.4);
}
function spawnLevelUpEffect(x, y) {
  spawnParticles(x, y, '#ff0', 16, 150, 5, 1.0);
  spawnParticles(x, y, '#0f8', 12, 100, 4, 0.8);
  spawnParticles(x, y, '#fff',  8,  60, 3, 0.6);
}
function spawnExplosion(x, y) {
  spawnParticles(x, y, '#f53', 12, 160, 6, 0.7, 120);
  spawnParticles(x, y, '#fa0', 10, 100, 5, 0.5, 80);
  spawnParticles(x, y, '#ff0',  6,  60, 3, 0.4);
}

// ============================================================
//  弾丸
// ============================================================
class Bullet {
  constructor(x,y,vx,vy,dmg,owner,color='#4af',size=6,life=1.8) {
    Object.assign(this, {x,y,vx,vy,dmg,owner,color,size,life,dead:false});
    this.trail = [];
    this.glowTimer = 0;
  }
  update(dt) {
    this.trail.push({x:this.x, y:this.y});
    if (this.trail.length > 6) this.trail.shift();
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    this.glowTimer += dt;
    if (this.life <= 0) this.dead = true;
  }
  draw(ctx) {
    // トレイル
    this.trail.forEach((p, i) => {
      const alpha = (i / this.trail.length) * 0.4;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      const s = this.size * (i / this.trail.length) * 0.7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, s, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // 本体グロー
    const glow = 1 + Math.sin(this.glowTimer * 10) * 0.3;
    const g = ctx.createRadialGradient(this.x,this.y,0, this.x,this.y, this.size*2*glow);
    g.addColorStop(0,   this.color);
    g.addColorStop(0.4, colorWithAlpha(this.color, 0.53));
    g.addColorStop(1,   'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size*2*glow, 0, Math.PI*2);
    ctx.fill();
    // コア
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size*0.5, 0, Math.PI*2);
    ctx.fill();
  }
  get rect() { return {x:this.x-this.size, y:this.y-this.size, w:this.size*2, h:this.size*2}; }
}

const bullets = [];

// ============================================================
//  ドロップアイテム（GEM）
// ============================================================
class DropGem {
  constructor(x, y, value=1) {
    this.x = x; this.y = y; this.value = value;
    this.bobTimer = Math.random()*Math.PI*2;
    this.dead = false;
    this.magnetTimer = 0;
  }
  update(dt, player) {
    this.bobTimer += dt * 3;
    const dx = player.cx - this.x;
    const dy = player.cy - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 80) {
      const spd = 200;
      this.x += (dx/dist) * spd * dt;
      this.y += (dy/dist) * spd * dt;
    }
    if (dist < 14) {
      player.collectGem(this.value);
      spawnGemEffect(this.x, this.y);
      this.dead = true;
    }
  }
  draw(ctx) {
    const bob = Math.sin(this.bobTimer) * 3;
    const colors = this.value >= 5 ? ['#f0f','#a0f'] : this.value >= 3 ? ['#fa0','#f60'] : ['#0ef','#08f'];
    const s = this.value >= 5 ? 8 : this.value >= 3 ? 7 : 5;
    ctx.save();
    ctx.translate(this.x, this.y + bob);
    // ダイヤ形
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s*0.7, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s*0.7, 0);
    ctx.closePath();
    const g = ctx.createLinearGradient(0,-s, 0,s);
    g.addColorStop(0, colors[0]);
    g.addColorStop(1, colors[1]);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    // 輝き
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(-1.5, -s*0.5, 1.5, 2);
    ctx.restore();
  }
}

const dropGems = [];

// ============================================================
//  テキストポップアップ
// ============================================================
const popups = [];
function addPopup(x, y, text, color='#fff', size=16) {
  popups.push({x, y, text, color, size, life:1.2, maxLife:1.2, vy:-40});
}

// ============================================================
//  敵クラス
// ============================================================
const ENEMY_TYPES = {
  goblin: {
    name:'Goblin', hp:12, atk:6, spd:55, exp:4, color:'#3b3',
    bodyColor:'#4d4', eyeColor:'#ff0', size:12,
    aiRange:130, attackRange:20, attackCd:1.2,
    gemDrop:{min:1,max:2,chance:0.9}, gemVal:1,
  },
  orc: {
    name:'Orc', hp:28, atk:12, spd:38, exp:10, color:'#595',
    bodyColor:'#6a6', eyeColor:'#f80', size:15,
    aiRange:150, attackRange:22, attackCd:1.8,
    gemDrop:{min:1,max:3,chance:1.0}, gemVal:3,
  },
  shooter: {
    name:'Shooter', hp:16, atk:8, spd:35, exp:7, color:'#a44',
    bodyColor:'#c55', eyeColor:'#f0f', size:12,
    aiRange:200, attackRange:160, attackCd:2.0,
    gemDrop:{min:1,max:2,chance:0.85}, gemVal:2,
    shooter:true,
  },
};

class Enemy {
  constructor(type, x, y) {
    this.type = type;
    const d = ENEMY_TYPES[type];
    Object.assign(this, d);
    this.x = x; this.y = y;
    this.maxHp = d.hp; this.hp = d.hp;
    this.state = 'idle'; // idle / chase / attack
    this.atkTimer = 0;
    this.invTimer = 0;
    this.knockVx = 0; this.knockVy = 0;
    this.bobTimer = Math.random()*Math.PI*2;
    this.dead = false;
    this.deathTimer = -1;
    this.flashTimer = 0;
  }
  get cx() { return this.x; }
  get cy() { return this.y; }
  get rect() {
    const s = this.size;
    return {x:this.x-s, y:this.y-s, w:s*2, h:s*2};
  }
  update(dt, player) {
    if (this.deathTimer >= 0) {
      this.deathTimer += dt;
      return;
    }
    this.bobTimer += dt * 2;
    this.atkTimer  = Math.max(0, this.atkTimer - dt);
    this.invTimer  = Math.max(0, this.invTimer - dt);
    this.flashTimer= Math.max(0, this.flashTimer - dt);
    // ノックバック減衰
    this.knockVx *= Math.pow(0.05, dt);
    this.knockVy *= Math.pow(0.05, dt);
    this.x += this.knockVx * dt;
    this.y += this.knockVy * dt;
    // タイル衝突
    this._clampToMap();

    const dx = player.cx - this.x;
    const dy = player.cy - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < this.aiRange) this.state = 'chase';
    else                     this.state = 'idle';

    if (this.state === 'chase') {
      if (this.shooter) {
        // シューターは一定距離を保って弾を撃つ
        if (dist > 80) {
          this.x += (dx/dist)*this.spd*dt;
          this.y += (dy/dist)*this.spd*dt;
        }
        if (this.atkTimer <= 0 && dist < this.attackRange) {
          this._shootAt(player);
          this.atkTimer = this.attackCd;
        }
      } else {
        this.x += (dx/dist)*this.spd*dt;
        this.y += (dy/dist)*this.spd*dt;
        if (this.atkTimer <= 0 && dist < this.attackRange + this.size + player.size) {
          player.takeDamage(this.atk);
          this.atkTimer = this.attackCd;
          spawnHitEffect(player.cx, player.cy);
        }
      }
    }
    this._clampToMap();
  }
  _shootAt(player) {
    const dx = player.cx - this.x;
    const dy = player.cy - this.y;
    const len = Math.hypot(dx,dy);
    const spd = 160;
    bullets.push(new Bullet(this.x, this.y, (dx/len)*spd, (dy/len)*spd, this.atk, 'enemy', '#f53', 5));
  }
  _clampToMap() {
    const margin = this.size;
    const maxX = (COLS-1)*TILE - margin;
    const maxY = (ROWS-1)*TILE - margin;
    this.x = Math.max(TILE+margin, Math.min(maxX, this.x));
    this.y = Math.max(TILE+margin, Math.min(maxY, this.y));
    // 石ブロック回避
    const tr = this.rect;
    for (let row=0; row<ROWS; row++) {
      for (let col=0; col<COLS; col++) {
        if (MAP[row][col] !== 4) continue;
        const tx=col*TILE, ty=row*TILE;
        if (rectsOverlap(tr, {x:tx,y:ty,w:TILE,h:TILE})) {
          // 押し出し
          const overlapX = Math.min(tr.x+tr.w, tx+TILE) - Math.max(tr.x, tx);
          const overlapY = Math.min(tr.y+tr.h, ty+TILE) - Math.max(tr.y, ty);
          if (overlapX < overlapY) this.x += (this.x < tx+TILE/2 ? -1:1)*overlapX;
          else                      this.y += (this.y < ty+TILE/2 ? -1:1)*overlapY;
        }
      }
    }
  }
  takeDamage(dmg, kx=0, ky=0) {
    if (this.invTimer > 0) return;
    this.hp -= dmg;
    this.invTimer  = 0.25;
    this.flashTimer= 0.25;
    this.knockVx = kx * 280;
    this.knockVy = ky * 280;
    spawnHitEffect(this.x, this.y);
    addPopup(this.x, this.y-this.size, '-'+dmg, '#f88', 14);
    if (this.hp <= 0) this._die();
  }
  _die() {
    this.dead = true;
    this.deathTimer = 0;
    spawnExplosion(this.x, this.y);
    // ドロップ
    const d = ENEMY_TYPES[this.type];
    if (Math.random() < d.gemDrop.chance) {
      const count = d.gemDrop.min + Math.floor(Math.random()*(d.gemDrop.max-d.gemDrop.min+1));
      for (let i=0; i<count; i++) {
        const ox = (Math.random()-0.5)*30;
        const oy = (Math.random()-0.5)*30;
        dropGems.push(new DropGem(this.x+ox, this.y+oy, d.gemVal));
      }
    }
  }
  draw(ctx) {
    if (this.deathTimer >= 0) return;
    const flash = this.flashTimer > 0 && Math.floor(this.flashTimer*20)%2===0;
    ctx.save();
    ctx.translate(this.x, this.y + Math.sin(this.bobTimer)*2);
    if (flash) ctx.globalAlpha = 0.4;

    const s = this.size;
    // 体
    ctx.fillStyle = this.bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s*0.9, 0, 0, Math.PI*2);
    ctx.fill();
    // 輪郭
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (this.type === 'goblin' || this.type === 'orc') {
      // 耳
      ctx.fillStyle = this.bodyColor;
      ctx.beginPath(); ctx.ellipse(-s*0.9, -s*0.3, s*0.35, s*0.5, -0.4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse( s*0.9, -s*0.3, s*0.35, s*0.5,  0.4, 0, Math.PI*2); ctx.fill();
    }
    // 目
    ctx.fillStyle = this.eyeColor;
    ctx.fillRect(-s*0.4, -s*0.2, s*0.25, s*0.2);
    ctx.fillRect( s*0.15,-s*0.2, s*0.25, s*0.2);
    // シューターの帽子
    if (this.type === 'shooter') {
      ctx.fillStyle = '#800';
      ctx.fillRect(-s*0.6, -s*1.1, s*1.2, s*0.4);
      ctx.fillRect(-s*0.4, -s*1.5, s*0.8, s*0.5);
    } else {
      // ゴブリン/オークの角
      ctx.fillStyle = '#ffa';
      ctx.beginPath();
      ctx.moveTo(-s*0.3, -s*0.9); ctx.lineTo(-s*0.1, -s*1.4); ctx.lineTo(0, -s*0.9); ctx.fill();
      ctx.beginPath();
      ctx.moveTo( s*0.1, -s*0.9); ctx.lineTo( s*0.3, -s*1.4); ctx.lineTo(s*0.5,-s*0.9); ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();

    // HPバー
    const bw = s*2.5;
    const bx = this.x - bw/2;
    const by = this.y - s - 14;
    ctx.fillStyle = '#400';
    ctx.fillRect(bx, by, bw, 5);
    ctx.fillStyle = this.hp > this.maxHp*0.5 ? '#4f4' : '#f84';
    ctx.fillRect(bx, by, bw*(this.hp/this.maxHp), 5);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(bx, by, bw, 5);
  }
}

// ============================================================
//  プレイヤー
// ============================================================
class Player {
  constructor() {
    this.x = W/2; this.y = H/2;
    this.size   = 13;
    this.speed  = 115;
    this.maxHp  = 100; this.hp = 100;
    this.level  = 1;  this.exp = 0;
    this.gem    = 0;
    this.atk    = 14;
    this.dir    = 'down';
    this.walkTimer   = 0;
    this.atkTimer    = 0;
    this.skillTimer  = 0;
    this.invTimer    = 0;
    this.flashTimer  = 0;
    this.atkSwing    = 0;
    this.isAttacking = false;
    this.skillCd     = 5.0;
    this.skillActive = 0;
    this.expTable = [0,20,45,80,130,200,300,440,620,850,9999];
    this.levelUpFlash = 0;
    this.score = 0;
    this.kills = 0;
  }
  get cx() { return this.x; }
  get cy() { return this.y; }
  get rect() {
    const s = this.size;
    return {x:this.x-s, y:this.y-s, w:s*2, h:s*2};
  }
  update(dt, enemies) {
    this.atkTimer    = Math.max(0, this.atkTimer   - dt);
    this.skillTimer  = Math.max(0, this.skillTimer - dt);
    this.invTimer    = Math.max(0, this.invTimer   - dt);
    this.flashTimer  = Math.max(0, this.flashTimer - dt);
    this.skillActive = Math.max(0, this.skillActive- dt);
    this.levelUpFlash= Math.max(0, this.levelUpFlash-dt);

    // 移動
    let dx=0, dy=0;
    if (Input.left)  { dx=-1; this.dir='left';  }
    if (Input.right) { dx= 1; this.dir='right'; }
    if (Input.up)    { dy=-1; this.dir='up';    }
    if (Input.down)  { dy= 1; this.dir='down';  }
    if (dx && dy) { dx*=0.707; dy*=0.707; }

    const spd = this.speed * (this.skillActive>0 ? 1.5 : 1);
    this._move(dx*spd*dt, 0);
    this._move(0, dy*spd*dt);

    if (dx !== 0 || dy !== 0) this.walkTimer += dt * 8;

    // 攻撃
    this.isAttacking = false;
    if (Input.attack && this.atkTimer <= 0) {
      this.isAttacking = true;
      this.atkTimer = 0.35;
      this.atkSwing = 0;
      this._doAttack(enemies);
    }
    if (this.isAttacking || this.atkTimer > 0.1) this.atkSwing = Math.min(1, this.atkSwing+dt*6);
    else this.atkSwing = Math.max(0, this.atkSwing-dt*8);

    // スキル（波動弾）
    if (Input.skill && this.skillTimer <= 0) {
      this._doSkill();
      this.skillTimer = this.skillCd;
    }

    // 弾丸との衝突
    bullets.forEach(b => {
      if (b.dead || b.owner !== 'enemy') return;
      if (rectsOverlap(this.rect, b.rect)) {
        this.takeDamage(b.dmg);
        spawnHitEffect(this.cx, this.cy);
        b.dead = true;
      }
    });
  }
  _move(dx, dy) {
    this.x += dx;
    // タイル衝突X
    for (let row=0; row<ROWS; row++) {
      for (let col=0; col<COLS; col++) {
        const t = MAP[row][col];
        if (t !== 1 && t !== 4) continue;
        const tx=col*TILE, ty=row*TILE;
        if (rectsOverlap(this.rect, {x:tx,y:ty,w:TILE,h:TILE})) {
          if (dx > 0) this.x = tx - this.size;
          if (dx < 0) this.x = tx + TILE + this.size;
        }
      }
    }
    this.y += dy;
    for (let row=0; row<ROWS; row++) {
      for (let col=0; col<COLS; col++) {
        const t = MAP[row][col];
        if (t !== 1 && t !== 4) continue;
        const tx=col*TILE, ty=row*TILE;
        if (rectsOverlap(this.rect, {x:tx,y:ty,w:TILE,h:TILE})) {
          if (dy > 0) this.y = ty - this.size;
          if (dy < 0) this.y = ty + TILE + this.size;
        }
      }
    }
  }
  _doAttack(enemies) {
    const DIRS = {
      right:[1,0], left:[-1,0], up:[0,-1], down:[0,1]
    };
    const [fx,fy] = DIRS[this.dir] || [1,0];
    const reach = 38, range = 28;
    let hit = false;
    enemies.forEach(e => {
      if (e.dead) return;
      const ex = e.cx - (this.cx + fx*reach);
      const ey = e.cy - (this.cy + fy*reach);
      if (Math.abs(ex) < range && Math.abs(ey) < range) {
        const bonus = this.skillActive > 0 ? 2 : 1;
        e.takeDamage(this.atk * bonus, fx, fy);
        hit = true;
        this.score += 10;
      }
    });
    if (hit) {
      // ヒットストップ演出
      spawnParticles(this.cx+fx*30, this.cy+fy*30, '#fa0', 6, 80, 3, 0.3);
    }
  }
  _doSkill() {
    // 全方向波動弾
    const count = 8;
    for (let i=0; i<count; i++) {
      const ang = (Math.PI*2*i/count);
      const spd = 220;
      const b = new Bullet(this.cx, this.cy,
        Math.cos(ang)*spd, Math.sin(ang)*spd,
        this.atk*1.5, 'player', '#0ff', 7, 2.0);
      bullets.push(b);
    }
    spawnParticles(this.cx, this.cy, '#0ff', 20, 80, 5, 0.6);
    this.skillActive = 2.0;
    addPopup(this.cx, this.cy-30, 'SKILL!', '#0ff', 18);
  }
  takeDamage(dmg) {
    if (this.invTimer > 0) return;
    const actual = Math.max(1, dmg - Math.floor(this.level*0.5));
    this.hp = Math.max(0, this.hp - actual);
    this.invTimer  = 0.8;
    this.flashTimer= 0.8;
    addPopup(this.cx, this.cy-20, '-'+actual, '#f55', 15);
    if (this.hp <= 0) game.state = 'gameover';
  }
  collectGem(val) {
    this.gem += val;
    this.score += val * 5;
    addPopup(this.cx, this.cy-24, '+'+val+' GEM', '#0ef', 13);
  }
  gainExp(amount) {
    this.exp += amount;
    addPopup(this.cx, this.cy-38, '+'+amount+' EXP', '#fa0', 13);
    while (this.level < 10 && this.exp >= this.expTable[this.level]) {
      this.exp -= this.expTable[this.level];
      this.level++;
      this.atk    += 3;
      this.maxHp  += 20;
      this.hp      = this.maxHp;
      this.levelUpFlash = 2.0;
      spawnLevelUpEffect(this.cx, this.cy);
      addPopup(this.cx, this.cy-55, 'LEVEL UP!', '#ff0', 20);
    }
  }
  draw(ctx) {
    const flash = this.flashTimer > 0 && Math.floor(this.flashTimer*15)%2===0;
    ctx.save();
    ctx.translate(this.x, this.y);

    // スキル発動中のオーラ
    if (this.skillActive > 0) {
      const pulse = 1 + Math.sin(Date.now()*0.01)*0.3;
      ctx.globalAlpha = 0.3 * (this.skillActive / 2);
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.arc(0, 0, this.size*2.5*pulse, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (flash) ctx.globalAlpha = 0.3;

    const walk = Math.sin(this.walkTimer) * 2;
    const s = this.size;

    // ブーツ
    ctx.fillStyle = '#963';
    ctx.fillRect(-s*0.6, s*0.5+walk, s*0.5, s*0.5);
    ctx.fillRect( s*0.1, s*0.5-walk, s*0.5, s*0.5);

    // 胴体（赤マント）
    ctx.fillStyle = '#c33';
    ctx.fillRect(-s*0.65, -s*0.3, s*1.3, s*0.9);
    // ベルト
    ctx.fillStyle = '#a80';
    ctx.fillRect(-s*0.65, s*0.2, s*1.3, s*0.15);

    // 腕
    ctx.fillStyle = '#d44';
    ctx.fillRect(-s*0.9, -s*0.25, s*0.3, s*0.65);
    ctx.fillRect( s*0.6,  -s*0.25, s*0.3, s*0.65);

    // 頭
    ctx.fillStyle = '#f9c';
    ctx.beginPath();
    ctx.arc(0, -s*0.55, s*0.55, 0, Math.PI*2);
    ctx.fill();

    // 紫帽子
    ctx.fillStyle = '#639';
    ctx.fillRect(-s*0.65, -s*1.15, s*1.3, s*0.45);
    ctx.fillStyle = '#84b';
    ctx.fillRect(-s*0.5, -s*1.55, s, s*0.48);
    // 帽子のバックル
    ctx.fillStyle = '#fa0';
    ctx.fillRect(-s*0.12, -s*1.18, s*0.24, s*0.24);

    // 目
    ctx.fillStyle = '#222';
    ctx.fillRect(-s*0.25, -s*0.65, s*0.18, s*0.15);
    ctx.fillRect( s*0.07, -s*0.65, s*0.18, s*0.15);

    // 剣
    const DIRS = { right:[1,0,0], left:[-1,0,Math.PI], up:[0,-1,-Math.PI/2], down:[0,1,Math.PI/2] };
    const [sx,,sang] = DIRS[this.dir] || [1,0,0];
    const swing = this.atkSwing * Math.PI/3;
    ctx.save();
    ctx.rotate(sang + swing * (sx >= 0 ? 1:-1));
    ctx.translate(s*0.6, 0);
    // 刀身
    const g = ctx.createLinearGradient(0,0, s*1.8,0);
    g.addColorStop(0, '#ddf');
    g.addColorStop(0.5, '#fff');
    g.addColorStop(1, '#88a');
    ctx.fillStyle = g;
    ctx.fillRect(0, -s*0.1, s*1.8, s*0.2);
    // ガード
    ctx.fillStyle = '#a80';
    ctx.fillRect(-s*0.05, -s*0.35, s*0.15, s*0.7);
    // グリップ
    ctx.fillStyle = '#642';
    ctx.fillRect(-s*0.35, -s*0.1, s*0.35, s*0.2);
    ctx.restore();

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// ============================================================
//  ユーティリティ
// ============================================================
function rectsOverlap(a, b) {
  return a.x < b.x+b.w && a.x+a.w > b.x &&
         a.y < b.y+b.h && a.y+a.h > b.y;
}

// ============================================================
//  タイル描画
// ============================================================
let waterAnim = 0;
function drawTiles(ctx) {
  for (let row=0; row<ROWS; row++) {
    for (let col=0; col<COLS; col++) {
      const tx = col*TILE, ty = row*TILE;
      const t  = MAP[row][col];

      if (t === 1) {
        // 水
        const wave = Math.sin(waterAnim + col*0.5 + row*0.3) * 0.5 + 0.5;
        const r = Math.floor(30 + wave*30);
        const g = Math.floor(100 + wave*60);
        const b = Math.floor(160 + wave*61);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(tx, ty, TILE, TILE);
        // 波ライン
        ctx.strokeStyle = `rgba(255,255,255,${0.15+wave*0.2})`;
        ctx.lineWidth = 1.5;
        const woff = (waterAnim*20 + col*8) % TILE;
        ctx.beginPath();
        ctx.moveTo(tx + woff, ty + TILE*0.4);
        ctx.bezierCurveTo(
          tx+woff+TILE*0.1, ty+TILE*0.3,
          tx+woff+TILE*0.2, ty+TILE*0.5,
          tx+woff+TILE*0.3, ty+TILE*0.4
        );
        ctx.stroke();
      } else if (t === 0) {
        // 砂
        ctx.fillStyle = C.sand;
        ctx.fillRect(tx, ty, TILE, TILE);
        // テクスチャ点
        const seed = row*100+col;
        for (let i=0; i<4; i++) {
          const px = tx + ((seed*17+i*31)%28)+2;
          const py = ty + ((seed*23+i*13)%28)+2;
          ctx.fillStyle = (i%2===0) ? C.sandDark : C.sandStar;
          ctx.fillRect(px, py, 2, 2);
        }
      } else if (t === 4) {
        // 石ブロック
        ctx.fillStyle = C.stone;
        ctx.fillRect(tx, ty, TILE, TILE);
        // ハイライト
        ctx.fillStyle = C.stoneH;
        ctx.fillRect(tx+1, ty+1, TILE-2, 3);
        ctx.fillRect(tx+1, ty+1, 3, TILE-2);
        // 影
        ctx.fillStyle = C.stoneD;
        ctx.fillRect(tx+1, ty+TILE-4, TILE-2, 3);
        ctx.fillRect(tx+TILE-4, ty+1, 3, TILE-2);
        // 中央マーク
        ctx.fillStyle = '#777';
        ctx.fillRect(tx+TILE/2-4, ty+TILE/2-4, 8, 8);
      }
    }
  }
}

// ============================================================
//  HUD描画
// ============================================================
function drawHUD(ctx, player) {
  const hy = H;
  // 背景
  ctx.fillStyle = C.hudBg;
  ctx.fillRect(0, hy, W, HUD_H);
  ctx.strokeStyle = C.hudBdr;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, hy, W, HUD_H);
  // 上線グロー
  ctx.strokeStyle = '#1a4a8a';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0,hy+2); ctx.lineTo(W,hy+2); ctx.stroke();

  const fnt = (sz) => `bold ${sz}px 'Courier New', monospace`;

  // LV
  ctx.fillStyle = '#8af';
  ctx.font = fnt(11);
  ctx.fillText('LV', 10, hy+14);
  ctx.fillStyle = '#fff';
  ctx.font = fnt(16);
  ctx.fillText(player.level, 30, hy+15);

  // EXPバー
  ctx.fillStyle = '#555';
  ctx.fillRect(10, hy+20, 110, 8);
  const expPct = player.level<10 ? player.exp / player.expTable[player.level] : 1;
  const expGrad = ctx.createLinearGradient(10, 0, 120, 0);
  expGrad.addColorStop(0, '#f80');
  expGrad.addColorStop(1, '#ff4');
  ctx.fillStyle = expGrad;
  ctx.fillRect(10, hy+20, 110*expPct, 8);
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, hy+20, 110, 8);
  ctx.fillStyle = '#fa8';
  ctx.font = fnt(9);
  ctx.fillText('EXP', 12, hy+27);

  // HPバー
  ctx.fillStyle = '#444';
  ctx.fillText('PLAYER', 10, hy+42);
  const hpRatio = player.hp / player.maxHp;
  const segments = 8;
  const segW = 14, segGap = 2;
  const totalSegW = segments*(segW+segGap);
  for (let i=0; i<segments; i++) {
    const filled = (i+1)/segments <= hpRatio + 0.01;
    const partial = !filled && i/segments < hpRatio;
    const bx = 60 + i*(segW+segGap);
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, hy+33, segW, 10);
    if (filled || partial) {
      const pct = partial ? (hpRatio - i/segments)*segments : 1;
      const col = hpRatio > 0.4 ? C.hpFull : C.hpLow;
      ctx.fillStyle = col;
      ctx.fillRect(bx, hy+33, segW*pct, 10);
      // ハイライト
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(bx, hy+33, segW*pct, 2);
    }
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(bx, hy+33, segW, 10);
  }

  // GEM
  ctx.fillStyle = '#0ef';
  ctx.font = fnt(11);
  ctx.fillText('GEM', W/2-20, hy+16);
  ctx.fillStyle = '#fff';
  ctx.font = fnt(18);
  ctx.fillText(player.gem, W/2+18, hy+17);

  // SCORE
  ctx.fillStyle = '#8f8';
  ctx.font = fnt(11);
  ctx.fillText('SCORE', W*0.68, hy+16);
  ctx.fillStyle = '#fff';
  ctx.font = fnt(16);
  ctx.fillText(String(player.score).padStart(6,'0'), W*0.68, hy+34);

  // SKILL CD
  ctx.fillStyle = '#66f';
  ctx.font = fnt(11);
  ctx.fillText('SKILL', W-90, hy+16);
  const cdRatio = 1 - (player.skillTimer / player.skillCd);
  ctx.fillStyle = '#333';
  ctx.fillRect(W-90, hy+20, 80, 8);
  ctx.fillStyle = cdRatio >= 1 ? '#0af' : '#44a';
  ctx.fillRect(W-90, hy+20, 80*Math.min(1,cdRatio), 8);
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.strokeRect(W-90, hy+20, 80, 8);
  if (cdRatio >= 1) {
    ctx.fillStyle = '#0ff';
    ctx.font = fnt(9);
    ctx.fillText('READY', W-82, hy+27);
  }

  // レベルアップフラッシュ
  if (player.levelUpFlash > 0) {
    const alpha = (player.levelUpFlash / 2.0) * 0.4 * (Math.sin(Date.now()*0.02)+1)*0.5;
    ctx.fillStyle = `rgba(255,255,0,${alpha})`;
    ctx.fillRect(0, hy, W, HUD_H);
  }

  // 操作ヒント
  ctx.fillStyle = '#456';
  ctx.font = `10px 'Courier New'`;
  ctx.fillText('WASD/Arrow:移動  Z/Space:攻撃  X:スキル', W*0.35, hy+43);
}

// ============================================================
//  敵スポーン管理
// ============================================================
const enemies = [];
let spawnTimer = 0;
const SPAWN_INTERVAL = 4.0;
const MAX_ENEMIES    = 10;

const SPAWN_POSITIONS = [
  [2,2],[17,2],[2,11],[17,11],
  [9,1],[9,12],[1,6],[18,6],
];

function spawnEnemy() {
  if (enemies.filter(e=>!e.dead).length >= MAX_ENEMIES) return;
  const pos = SPAWN_POSITIONS[Math.floor(Math.random()*SPAWN_POSITIONS.length)];
  const [col,row] = pos;
  const types = ['goblin','goblin','orc','shooter'];
  const wave  = Math.min(3, Math.floor((game.player ? game.player.score : 0)/200));
  const typePool = types.slice(0, 2 + wave);
  const type = typePool[Math.floor(Math.random()*typePool.length)];
  const e = new Enemy(type, col*TILE+TILE/2, row*TILE+TILE/2);
  enemies.push(e);
  spawnParticles(e.x, e.y, '#f00', 6, 40, 3, 0.4);
}

// ============================================================
//  タイトル / ゲームオーバー 画面
// ============================================================
function drawTitleScreen(ctx) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H+HUD_H);

  // 星
  for (let i=0; i<60; i++) {
    const sx = (i*173)%W;
    const sy = (i*97)%H;
    const br = 0.4 + Math.sin(Date.now()*0.003+i)*0.6;
    ctx.fillStyle = `rgba(255,255,255,${br})`;
    ctx.fillRect(sx, sy, 1+(i%2), 1+(i%2));
  }

  // タイトル
  const t = Date.now()*0.001;
  const titleY = H/2 - 80 + Math.sin(t)*5;
  ctx.shadowColor = '#0cf'; ctx.shadowBlur = 30;
  ctx.fillStyle = '#0cf';
  ctx.font = "bold 52px 'Courier New'";
  ctx.textAlign = 'center';
  ctx.fillText('GEM QUEST', W/2, titleY);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#fa0';
  ctx.font = "bold 22px 'Courier New'";
  ctx.fillText('〜 Retro Action RPG 〜', W/2, titleY+36);

  // 説明
  ctx.fillStyle = '#8af';
  ctx.font = "14px 'Courier New'";
  ctx.fillText('WASD / 方向キー : 移動', W/2, H/2+20);
  ctx.fillText('Z / Space : 攻撃', W/2, H/2+40);
  ctx.fillText('X : スキル（全方向弾）', W/2, H/2+60);

  // 点滅スタート
  const blink = Math.sin(t*3) > 0;
  ctx.fillStyle = blink ? '#ff0' : '#880';
  ctx.font = "bold 20px 'Courier New'";
  ctx.fillText('クリック / タップ / Z / Space でスタート', W/2, H/2+110);
  ctx.textAlign = 'left';
}

function drawGameOverScreen(ctx, player) {
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, W, H+HUD_H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f33';
  ctx.shadowColor = '#f00'; ctx.shadowBlur = 30;
  ctx.font = "bold 56px 'Courier New'";
  ctx.fillText('GAME OVER', W/2, H/2-60);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#fa0';
  ctx.font = "bold 20px 'Courier New'";
  ctx.fillText(`SCORE : ${String(player.score).padStart(6,'0')}`, W/2, H/2-10);
  ctx.fillText(`LEVEL : ${player.level}  /  KILLS : ${player.kills}`, W/2, H/2+20);
  ctx.fillText(`GEM : ${player.gem}  /  EXP : ${player.exp}`, W/2, H/2+50);

  const blink = Math.sin(Date.now()*0.005) > 0;
  ctx.fillStyle = blink ? '#fff' : '#888';
  ctx.font = "20px 'Courier New'";
  ctx.fillText('クリック / タップ / Z / Space でリトライ', W/2, H/2+100);
  ctx.textAlign = 'left';
}

// ============================================================
//  ゲームメインオブジェクト
// ============================================================
const game = {
  state : 'title',   // title / play / gameover
  player: null,
  lastTime: 0,

  init() {
    this.player = new Player();
    enemies.length = 0;
    bullets.length = 0;
    particles.length = 0;
    dropGems.length = 0;
    popups.length = 0;
    spawnTimer = 0;
    waterAnim  = 0;
    // 初期敵
    spawnEnemy(); spawnEnemy(); spawnEnemy();
  },

  update(dt) {
    waterAnim += dt * 1.2;
    const startPressed = Input.consumeStart();
    const menuPressed = startPressed || Input.attackPressed() || Input.wasPressed('Enter');

    if (this.state === 'title') {
      if (menuPressed) {
        this.init();
        this.state = 'play';
      }
      return;
    }
    if (this.state === 'gameover') {
      if (menuPressed) {
        this.state = 'title';
      }
      return;
    }

    // PLAY
    const p = this.player;
    p.update(dt, enemies);

    // 敵更新
    enemies.forEach(e => {
      if (!e.dead) {
        e.update(dt, p);
      }
    });

    // プレイヤー弾 vs 敵
    bullets.forEach(b => {
      if (b.dead || b.owner !== 'player') return;
      enemies.forEach(e => {
        if (e.dead) return;
        if (rectsOverlap(b.rect, e.rect)) {
          const dx = e.cx - p.cx, dy = e.cy - p.cy;
          const len = Math.hypot(dx,dy)||1;
          e.takeDamage(Math.floor(p.atk*1.5), dx/len, dy/len);
          b.dead = true;
        }
      });
    });

    // 弾丸更新・削除
    for (let i=bullets.length-1; i>=0; i--) {
      bullets[i].update(dt);
      if (bullets[i].dead) bullets.splice(i,1);
    }

    // ドロップGEM
    for (let i=dropGems.length-1; i>=0; i--) {
      dropGems[i].update(dt, p);
      if (dropGems[i].dead) dropGems.splice(i,1);
    }

    // パーティクル
    for (let i=particles.length-1; i>=0; i--) {
      particles[i].update(dt);
      if (particles[i].dead) particles.splice(i,1);
    }

    // ポップアップ
    for (let i=popups.length-1; i>=0; i--) {
      const pop = popups[i];
      pop.y  += pop.vy * dt;
      pop.life -= dt;
      if (pop.life <= 0) popups.splice(i,1);
    }

    // 死亡敵の経験値・削除
    for (let i=enemies.length-1; i>=0; i--) {
      const e = enemies[i];
      if (e.dead && e.deathTimer > 0.4) {
        p.gainExp(e.exp);
        p.kills++;
        p.score += 50;
        enemies.splice(i,1);
      }
    }

    // スポーン
    spawnTimer += dt;
    if (spawnTimer >= SPAWN_INTERVAL) {
      spawnEnemy();
      spawnTimer = 0;
    }
  },

  render(ctx) {
    ctx.clearRect(0, 0, W, H+HUD_H);

    if (this.state === 'title') {
      drawTitleScreen(ctx);
      return;
    }

    // タイル
    drawTiles(ctx);

    // ドロップ
    dropGems.forEach(g => g.draw(ctx));

    // 弾丸
    bullets.forEach(b => b.draw(ctx));

    // 敵
    enemies.forEach(e => e.draw(ctx));

    // プレイヤー
    this.player.draw(ctx);

    // パーティクル
    particles.forEach(p => p.draw(ctx));

    // ポップアップ
    popups.forEach(pop => {
      const alpha = Math.min(1, pop.life / pop.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pop.color;
      ctx.font = `bold ${pop.size}px 'Courier New'`;
      ctx.textAlign = 'center';
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    });

    // HUD
    drawHUD(ctx, this.player);

    // ゲームオーバーオーバーレイ
    if (this.state === 'gameover') {
      drawGameOverScreen(ctx, this.player);
    }
  },

  loop(ts) {
    const dt = Math.min((ts - this.lastTime)/1000, 0.05);
    this.lastTime = ts;
    this.update(dt);
    this.render(ctx);
    requestAnimationFrame(t => this.loop(t));
  },

  start() {
    Input.init();
    requestAnimationFrame(t => { this.lastTime=t; this.loop(t); });
  }
};

// ============================================================
//  起動
// ============================================================
game.start();
