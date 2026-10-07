let highestZ = 10; // starts above the papers' base z-index so the grabbed paper always comes to the front

class Paper {
  holdingPaper = false;
  mouseTouchX = 0;
  mouseTouchY = 0;
  mouseX = 0;
  mouseY = 0;
  prevMouseX = 0;
  prevMouseY = 0;
  velX = 0;
  velY = 0;
  rotation = Math.random() * 30 - 15;
  currentPaperX = 0;
  currentPaperY = 0;
  rotating = false;

  init(paper) {
    paper.style.transform = `translateX(0px) translateY(0px) rotateZ(${this.rotation}deg)`;
    paper.addEventListener('contextmenu', (e) => e.preventDefault()); // right-click rotates

    // --- 💻 Desktop Mouse Events ---
    document.addEventListener('mousemove', (e) => {
      if(!this.rotating) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        this.velX = this.mouseX - this.prevMouseX;
        this.velY = this.mouseY - this.prevMouseY;
      }
        
      const dirX = e.clientX - this.mouseTouchX;
      const dirY = e.clientY - this.mouseTouchY;
      const dirLength = Math.sqrt(dirX*dirX+dirY*dirY);
      const dirNormalizedX = dirX / dirLength;
      const dirNormalizedY = dirY / dirLength;
      const angle = Math.atan2(dirNormalizedY, dirNormalizedX);
      let degrees = 180 * angle / Math.PI;
      degrees = (360 + Math.round(degrees)) % 360;
      
      if(this.rotating) {
        this.rotation = degrees;
      }

      if(this.holdingPaper) {
        if(!this.rotating) {
          this.currentPaperX += this.velX;
          this.currentPaperY += this.velY;
        }
        this.prevMouseX = this.mouseX;
        this.prevMouseY = this.mouseY;

        paper.style.transform = `translateX(${this.currentPaperX}px) translateY(${this.currentPaperY}px) rotateZ(${this.rotation}deg)`;
      }
    });

    paper.addEventListener('mousedown', (e) => {
      if(this.holdingPaper) return; 
      this.holdingPaper = true;
      paper.classList.add('holding');
      paper.style.zIndex = highestZ;
      highestZ += 1;
      
      if(e.button === 0) {
        this.mouseTouchX = this.mouseX;
        this.mouseTouchY = this.mouseY;
        this.prevMouseX = this.mouseX;
        this.prevMouseY = this.mouseY;
      }
      if(e.button === 2) {
        this.rotating = true;
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.holdingPaper) { paper.classList.remove('holding'); burst(this.mouseX, this.mouseY, 14); }
      this.holdingPaper = false;
      this.rotating = false;
    });

    // --- 📱 Mobile Touch Events ---
    paper.addEventListener('touchstart', (e) => {
      if(this.holdingPaper) return; 
      this.holdingPaper = true;
      paper.classList.add('holding');
      paper.style.zIndex = highestZ;
      highestZ += 1;

      this.mouseTouchX = e.touches[0].clientX;
      this.mouseTouchY = e.touches[0].clientY;
      this.prevMouseX = e.touches[0].clientX;
      this.prevMouseY = e.touches[0].clientY;
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if(this.holdingPaper) {
        this.mouseX = e.touches[0].clientX;
        this.mouseY = e.touches[0].clientY;
        this.velX = this.mouseX - this.prevMouseX;
        this.velY = this.mouseY - this.prevMouseY;

        this.currentPaperX += this.velX;
        this.currentPaperY += this.velY;

        this.prevMouseX = this.mouseX;
        this.prevMouseY = this.mouseY;

        paper.style.transform = `translateX(${this.currentPaperX}px) translateY(${this.currentPaperY}px) rotateZ(${this.rotation}deg)`;
      }
    }, { passive: false });

    window.addEventListener('touchend', () => {
      if (this.holdingPaper) { paper.classList.remove('holding'); burst(this.mouseX, this.mouseY, 14); }
      this.holdingPaper = false;
      this.rotating = false;
    });
  }
}

const papers = Array.from(document.querySelectorAll('.paper'));

papers.forEach(paper => {
  const p = new Paper();
  p.init(paper);
});

// 🛑 3. THE SILVER BULLET: Prevents the whole screen from moving natively
document.addEventListener('touchmove', function(e) {
  e.preventDefault();
}, { passive: false });


/* 🎉 ---------- Confetti + cakes background (interactive) ---------- */
const cv = document.getElementById('bg');
const ctx = cv.getContext('2d');
const COLORS = ['#ff5c8a', '#ffb703', '#8ecae6', '#95d5b2', '#b388eb', '#ffffff'];
const CAKES = ['🧁', '🎂', '🍰', '🧁'];
const pointer = { x: -999, y: -999 };
let W, H, parts = [];

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function makePiece(x, y, isBurst) {
  const cake = Math.random() < 0.2;
  return {
    x, y,
    vx: isBurst ? (Math.random() - .5) * 9 : (Math.random() - .5) * .6,
    vy: isBurst ? -Math.random() * 9 - 2 : Math.random() + .4,
    size: cake ? 20 + Math.random() * 14 : 6 + Math.random() * 6,
    rot: Math.random() * 6.28, vr: (Math.random() - .5) * .12,
    color: COLORS[Math.random() * COLORS.length | 0],
    cake: cake ? CAKES[Math.random() * CAKES.length | 0] : null,
    sway: Math.random() * 6.28,
    burst: isBurst
  };
}

function burst(x, y, n = 40) {
  for (let i = 0; i < n; i++) parts.push(makePiece(x, y, true));
}

function setup() {
  resize();
  const count = Math.round(Math.min(90, W * H / 14000));
  parts = Array.from({ length: count }, () => makePiece(Math.random() * W, Math.random() * H, false));
}

function tick() {
  ctx.clearRect(0, 0, W, H);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];

    // finger / mouse pushes pieces away
    const dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx * dx + dy * dy;
    if (d2 < 14000) {
      const d = Math.sqrt(d2) || 1, f = (120 - d) / 120 * 1.4;
      p.vx += dx / d * f; p.vy += dy / d * f;
    }

    p.sway += .03;
    p.vx *= .96;
    if (p.burst) p.vy += .22;                                  // burst pieces fall with gravity
    else p.vy = Math.max(.4, Math.min(p.vy, 1.6));             // ambient pieces drift slowly
    p.x += p.vx + Math.sin(p.sway) * .4; p.y += p.vy; p.rot += p.vr;

    if (p.y > H + 40 || p.x < -60 || p.x > W + 60) {
      if (p.burst) { parts.splice(i, 1); continue; }
      p.y = -40; p.x = Math.random() * W; p.vx = 0;
    }

    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    if (p.cake) {
      ctx.font = p.size + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.cake, 0, 0);
    } else {
      ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    }
    ctx.restore();
  }
  requestAnimationFrame(tick);
}

addEventListener('resize', setup);
addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; });
document.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('.paper')) burst(e.clientX, e.clientY, 45);   // tap the background
});
setup();
tick();
