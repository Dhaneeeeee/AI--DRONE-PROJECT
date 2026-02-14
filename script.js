document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.form');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons and forms
            tabButtons.forEach(b => b.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));

            // Add active class to clicked button and corresponding form
            this.classList.add('active');
            const tab = this.getAttribute('data-tab');
            document.getElementById(tab + '-form').classList.add('active');
        });
    });

    // Password eye toggle
    document.querySelectorAll('.password-toggle').forEach(function(eye) {
        eye.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input[type="password"], input[type="text"]');
            if (input) {
                if (input.type === 'password') {
                    input.type = 'text';
                    this.classList.remove('fa-eye');
                    this.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    this.classList.remove('fa-eye-slash');
                    this.classList.add('fa-eye');
                }
            }
        });
    });

    // Social login button handlers (TEMP LOGIN)
    document.querySelectorAll('.social-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (btn.textContent.includes('GOOGLE')) {
                // Simulate login and redirect
                window.location.href = 'dashboard.html';
            } else if (btn.textContent.includes('GITHUB')) {
                // Simulate login and redirect
                window.location.href = 'dashboard.html';
            }
        });
    });

    // Login form submit handler
    var loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            try {
                const response = await fetch('http://localhost:3001/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                if (response.ok) {
                    window.location.href = 'dashboard.html';
                } else {
                    alert(data.message || 'Login failed.');
                }
            } catch (err) {
                alert('Could not connect to server.');
            }
        });
    }
    // Password strength meter for signup
    var passwordInput = document.getElementById('signup-password');
    var strengthMsg = document.getElementById('password-strength-message');
    if (passwordInput && strengthMsg) {
        passwordInput.addEventListener('input', function() {
            const val = passwordInput.value;
            let score = 0;
            if (val.length >= 8) score++;
            if (/[A-Z]/.test(val)) score++;
            if (/[a-z]/.test(val)) score++;
            if (/[0-9]/.test(val)) score++;
            if (/[^A-Za-z0-9]/.test(val)) score++;
            let msg = '';
            let cls = '';
            if (val.length === 0) {
                strengthMsg.style.display = 'none';
                msg = '';
                cls = '';
            } else {
                strengthMsg.style.display = 'block';
                if (score <= 2) {
                    msg = 'Weak';
                    cls = 'password-strength-weak';
                } else if (score === 3) {
                    msg = 'Medium';
                    cls = 'password-strength-medium';
                } else if (score === 4) {
                    msg = 'Strong';
                    cls = 'password-strength-strong';
                } else if (score >= 5) {
                    msg = 'Very Strong';
                    cls = 'password-strength-very-strong';
                }
            }
            strengthMsg.textContent = msg;
            strengthMsg.className = 'password-strength-message ' + cls;
        });
    }

    // Signup form submit handler
    var signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('signup-username').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirm = document.getElementById('signup-confirm').value;
            if (password !== confirm) {
                strengthMsg.textContent = 'Passwords do not match.';
                strengthMsg.className = 'password-strength-message password-strength-weak';
                return;
            }
            // Require at least Medium strength
            let score = 0;
            if (password.length >= 8) score++;
            if (/[A-Z]/.test(password)) score++;
            if (/[a-z]/.test(password)) score++;
            if (/[0-9]/.test(password)) score++;
            if (/[^A-Za-z0-9]/.test(password)) score++;
            if (score < 3) {
                strengthMsg.textContent = 'Password too weak.';
                strengthMsg.className = 'password-strength-message password-strength-weak';
                return;
            }
            try {
                const response = await fetch('http://localhost:3001/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                const data = await response.json();
                if (response.ok) {
                    strengthMsg.textContent = 'Registration successful!';
                    strengthMsg.className = 'password-strength-message password-strength-very-strong';
                    setTimeout(() => {
                        strengthMsg.textContent = '';
                        document.querySelector('.tab-btn[data-tab="login"]').click();
                    }, 1200);
                } else {
                    strengthMsg.textContent = data.message || 'Registration failed.';
                    strengthMsg.className = 'password-strength-message password-strength-weak';
                }
            } catch (err) {
                strengthMsg.textContent = 'Could not connect to server.';
                strengthMsg.className = 'password-strength-message password-strength-weak';
            }
        });
    }
});

// Background video helper: replace src and attempt to play (useful for network streams)
function setBackgroundVideo(src, type = 'video/mp4') {
    const vid = document.querySelector('#bg-video');
    if (!vid) return;
    // replace source(s)
    while (vid.firstChild) vid.removeChild(vid.firstChild);
    const srcElem = document.createElement('source');
    srcElem.src = src;
    srcElem.type = type;
    vid.appendChild(srcElem);

    // try to play, handle autoplay policies
    vid.muted = true;
    const playPromise = vid.play();
    if (playPromise !== undefined) {
        playPromise.catch(() => {
            // autoplay blocked, leave muted and try again when user interacts
            document.addEventListener('click', function once() {
                vid.play().catch(()=>{});
                document.removeEventListener('click', once);
            });
        });
    }
}

// Adaptive container contrast: sample a frame from the background video and set
// CSS variables so the card contrasts with the current video content.
function adaptContainerToVideo(options = {}) {
    const vid = document.querySelector('#bg-video');
    if (!vid) return Promise.resolve(false);

    const attempts = options.attempts || 6;
    const intervalMs = options.intervalMs || 1200;

    let tries = 0;
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        function trySample() {
            if (tries++ >= attempts) return resolve(false);
            // ensure video has dimensions
            const w = vid.videoWidth || 160;
            const h = vid.videoHeight || 90;
            canvas.width = w;
            canvas.height = h;
            try {
                ctx.drawImage(vid, 0, 0, w, h);
                const data = ctx.getImageData(0, 0, w, h).data;
                // sample average luminance
                let total = 0;
                const step = 4 * Math.max(1, Math.floor((w*h)/2000));
                for (let i = 0; i < data.length; i += step) {
                    const r = data[i], g = data[i+1], b = data[i+2];
                    // Rec. 709 luma
                    const y = 0.2126*r + 0.7152*g + 0.0722*b;
                    total += y;
                }
                const count = data.length / step;
                const avg = (total / count) / 255; // 0..1

                // choose contrast: if video is dark (avg < 0.55) use light card; else use dark translucent card
                if (avg < 0.55) {
                    document.documentElement.style.setProperty('--card-bg', '#ffffff');
                    document.documentElement.style.setProperty('--text', '#0b1220');
                    document.documentElement.style.setProperty('--card-border', 'rgba(16,24,40,0.06)');
                } else {
                    document.documentElement.style.setProperty('--card-bg', 'rgba(8,12,20,0.78)');
                    document.documentElement.style.setProperty('--text', '#f7f9fb');
                    document.documentElement.style.setProperty('--card-border', 'rgba(255,255,255,0.06)');
                }
                resolve(true);
            } catch (err) {
                // likely CORS blocked or video not ready
                setTimeout(trySample, intervalMs);
            }
        }

        // If the video is not yet ready, wait for play or loadeddata
        if (vid.readyState >= 2) {
            trySample();
        } else {
            const onLoaded = function() {
                vid.removeEventListener('loadeddata', onLoaded);
                trySample();
            };
            vid.addEventListener('loadeddata', onLoaded);
            // also attempt when play starts
            vid.addEventListener('play', trySample, { once: true });
        }
    });
}

// Auto-run adaptContainerToVideo on load for the background video if present
document.addEventListener('DOMContentLoaded', function() {
    const vid = document.querySelector('#bg-video');
    if (!vid) return;
    // try initially and then periodically to adapt as video content changes
    adaptContainerToVideo().then(ok => {
        if (!ok) {
            // silent fallback: leave default vars
        }
    });
    // re-run every 8 seconds to adapt to changing scenes
    setInterval(() => adaptContainerToVideo(), 8000);
});

// Neon mouse trail effect
(function() {
    const colors = [
        'rgba(30,144,255,0.96)', // dodger blue
        'rgba(124,77,255,0.96)', // purple
        'rgba(255,183,77,0.96)', // warm orange
        'rgba(0,255,150,0.96)',  // neon green
        'rgba(255,75,160,0.96)',  // pink
        'rgba(0,240,255,0.96)',   // cyan
        'rgba(255,60,100,0.96)',  // coral
        'rgba(255,240,90,0.96)',  // bright yellow
        'rgba(160,255,200,0.96)', // mint
        'rgba(200,120,255,0.96)', // lavender
        'rgba(120,255,240,0.96)', // aqua
        'rgba(255,120,200,0.96)'  // rose
    ];
    let last = 0;

    // spawn a small cluster of spreadable neon streaks around x,y
    function spawnSpreadStreaks(x, y, count = 6) {
        // uniform angular distribution around the pointer: step through full circle
        const step = (Math.PI * 2) / count;
        for (let i = 0; i < count; i++) {
            // angle evenly spaced plus small jitter
            const angle = i * step + (Math.random() - 0.5) * (step * 0.25);
            // length and thickness vary a bit per streak
            const length = 48 + Math.random() * 120; // 48..168 px
            const thickness = 5 + Math.random() * 14; // 5..19 px
            // radial offset so streaks are arranged in a ring around cursor
            const radius = 6 + Math.random() * 28; // 6..34 px
            const offsetX = Math.cos(angle) * radius;
            const offsetY = Math.sin(angle) * radius;

            // convert angle radians to degrees for rotation
            const deg = angle * (180 / Math.PI);

            const el = document.createElement('div');
            el.className = 'trail spread';
            el.style.width = length + 'px';
            el.style.height = thickness + 'px';
            el.style.left = (x + offsetX) + 'px';
            el.style.top = (y + offsetY) + 'px';
            // start compressed along X for grow animation
            el.style.transform = `translate(-50%, -50%) rotate(${deg}deg) scaleX(0.12)`;

            const col = colors[Math.floor(Math.random()*colors.length)];
            el.style.background = `linear-gradient(90deg, ${col}, rgba(255,255,255,0.06))`;
            el.style.boxShadow = `0 0 ${Math.floor(thickness*2)}px ${col}, 0 0 ${Math.floor(thickness*3)}px ${col}`;
            el.style.filter = 'blur(6px)';
            el.style.pointerEvents = 'none';

            // duration randomized per element for organic motion
            const dur = 360 + Math.floor(Math.random() * 640); // 360..1000ms
            el.style.transition = `transform ${dur}ms cubic-bezier(.2,.8,.2,1), opacity ${dur}ms ease-out, filter ${dur}ms ease-out`;

            document.body.appendChild(el);
            // animate: expand along X and fade out
            requestAnimationFrame(() => {
                el.style.transform = `translate(-50%, -50%) rotate(${deg}deg) scaleX(${0.85 + Math.random()*0.8})`;
                el.style.opacity = '0';
                el.style.filter = 'blur(14px)';
            });

            setTimeout(() => el.remove(), dur + 80);
        }
    }

    // throttle spawn to ~40ms
    function isPointerOverUI(x, y) {
        // elementFromPoint may return the trail itself; walk up to find a meaningful element
        const el = document.elementFromPoint(x, y);
        if (!el) return false;
        // treat these selectors as UI; if pointer is over them, don't spawn trail
        const uiSelectors = [
            '.container', '.small-container', '.dashboard-panel', '.auth-container',
            '.header-container', '.minimal-footer', '.tab-btn', '.submit-btn', '.social-btn',
            'button', 'a', 'input', 'textarea', 'select', 'label', '.form'
        ];
        for (const sel of uiSelectors) {
            if (el.closest && el.closest(sel)) return true;
        }
        return false;
    }

    // Canvas-based desktop-style cursor trail (optional, default: enabled)
    let useCanvasTrail = true;

    if (useCanvasTrail) {
        // create canvas overlay
        const canvas = document.createElement('canvas');
        canvas.className = 'cursor-trail-canvas';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        function resizeCanvas() {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.floor(window.innerWidth * dpr);
            canvas.height = Math.floor(window.innerHeight * dpr);
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // particle system for smooth trailing
        const particles = [];
        const maxParticles = 120;

        function addParticle(x, y, vx = 0, vy = 0) {
            if (particles.length >= maxParticles) particles.shift();
            particles.push({ x, y, vx, vy, life: 1, size: 6 + Math.random()*10, color: colors[Math.floor(Math.random()*colors.length)] });
        }

        // sample pointer movement to create velocity-based particles
        let lastPos = null;
        window.addEventListener('mousemove', (e) => {
            if (isPointerOverUI(e.clientX, e.clientY)) return;
            const now = Date.now();
            if (lastPos) {
                const dx = e.clientX - lastPos.x;
                const dy = e.clientY - lastPos.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                // spawn more particles when moving faster
                const spawnCount = Math.min(6, 1 + Math.floor(dist / 8));
                for (let i=0;i<spawnCount;i++) {
                    // jittered start along segment between lastPos and e
                    const t = Math.random();
                    const px = lastPos.x + dx * t;
                    const py = lastPos.y + dy * t;
                    // velocity scaled from movement
                    const vx = dx * (0.03 + Math.random()*0.06);
                    const vy = dy * (0.03 + Math.random()*0.06);
                    addParticle(px, py, vx, vy);
                }
            } else {
                addParticle(e.clientX, e.clientY, 0,0);
            }
            lastPos = { x: e.clientX, y: e.clientY };
        }, { passive: true });

        // touch support
        window.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            if (!t) return;
            if (isPointerOverUI(t.clientX, t.clientY)) return;
            addParticle(t.clientX, t.clientY, 0, 0);
        }, { passive: true });

        // animation loop
        let lastTime = performance.now();
        function tick(now) {
            const dt = Math.min(40, now - lastTime) / 1000; // cap dt
            lastTime = now;

            // fade the canvas slightly for trailing effect
            ctx.clearRect(0,0,canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'lighter';

            for (let i = particles.length-1; i >= 0; i--) {
                const p = particles[i];
                // integrate
                p.vx *= 0.96;
                p.vy *= 0.96;
                p.x += p.vx * (dt * 60);
                p.y += p.vy * (dt * 60);
                p.life -= 0.02 + Math.random()*0.03;
                if (p.life <= 0) { particles.splice(i,1); continue; }

                const alpha = Math.max(0, Math.min(1, p.life));
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size*2);
                grad.addColorStop(0, p.color.replace(/,[^,]+\)$/, `,${alpha})`));
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
                ctx.fill();
            }

            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    } else {
        // Fallback: keep DOM streaks active (existing behavior)
        window.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - last > 36) {
                if (!isPointerOverUI(e.clientX, e.clientY)) {
                    const count = 2 + Math.floor(Math.random()*5);
                    spawnSpreadStreaks(e.clientX, e.clientY, count);
                    last = now;
                }
            }
        });
        window.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            if (t && !isPointerOverUI(t.clientX, t.clientY)) {
                const count = 1 + Math.floor(Math.random()*4);
                spawnSpreadStreaks(t.clientX, t.clientY, count);
            }
        }, { passive: true });
    }
})();