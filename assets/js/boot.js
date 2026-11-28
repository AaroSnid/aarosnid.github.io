/* Terminal boot / nav transition.
   - Full boot sequence plays ONCE per session, and ONLY on the home page
     (<body data-home="1">): compile lines, a flash progress bar, an ASCII
     banner, then content comes online.
   - Every other page load (and home after the first boot) gets a short
     typed command built from <body data-navpath> and <body data-navcmd>.
     The finished command stays on screen briefly, then the page reveals.
   - Instant Skip (button / Enter / Esc / Space) and hard time caps so the
     visitor is never trapped. prefers-reduced-motion: no overlay at all. */
(function () {
  "use strict";

  var STORAGE_KEY = "portfolio_booted";
  var body = document.body;

  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var isHome = body.getAttribute("data-home") === "1";
  var navCmd = body.getAttribute("data-navcmd") || "cd ~/portfolio && ls -la";
  var navPath = body.getAttribute("data-navpath") || "~";

  var booted = false;
  try { booted = sessionStorage.getItem(STORAGE_KEY) === "1"; } catch (e) {}

  function markBooted() {
    try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch (e) {}
  }

  if (reduce || !body.classList.contains("booting")) {
    body.classList.remove("booting");
    markBooted();
    return;
  }

  // ---- overlay scaffold ----
  var overlay = document.createElement("div");
  overlay.id = "boot";
  var inner = document.createElement("div");
  inner.className = "wrap";
  inner.setAttribute("aria-hidden", "true"); // decorative output only
  overlay.appendChild(inner);

  var skip = document.createElement("button");
  skip.className = "skip";
  skip.type = "button";
  skip.textContent = "skip \u23ce";
  skip.setAttribute("aria-label", "Skip intro animation");
  overlay.appendChild(skip);
  body.appendChild(overlay);

  var timers = [];
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }

  var done = false;
  function onKey(e) {
    if (e.key === "Enter" || e.key === "Escape" || e.key === " ") {
      e.preventDefault();
      finish();
    }
  }
  function finish() {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    document.removeEventListener("keydown", onKey);
    markBooted();
    body.classList.remove("booting");
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }
  skip.addEventListener("click", finish);
  document.addEventListener("keydown", onKey);

  function addLine(text, cls) {
    var p = document.createElement("p");
    p.className = "line" + (cls ? " " + cls : "");
    if (text != null) p.textContent = text;
    inner.appendChild(p);
    return p;
  }

  function okLine(text, status) {
    var p = addLine(text + " ");
    var s = document.createElement("span");
    s.className = "ok";
    s.textContent = "[ " + status + " ]";
    p.appendChild(s);
    return p;
  }

  function type(el, prefix, text, speed, cb) {
    var i = 0;
    (function step() {
      if (done) return;
      el.textContent = prefix + text.slice(0, i);
      if (i >= text.length) { if (cb) cb(); return; }
      i++;
      later(step, speed);
    })();
  }

  // Animate a block progress bar in `el` from 0..100, then cb.
  function progress(el, label, width, stepMs, cb) {
    var pct = 0;
    (function tick() {
      if (done) return;
      var filled = Math.round((pct / 100) * width);
      var bar = "";
      for (var k = 0; k < width; k++) bar += (k < filled ? "\u2588" : "\u2591");
      el.textContent = label + " [" + bar + "] " + pct + "%";
      if (pct >= 100) { if (cb) cb(); return; }
      pct += Math.floor(Math.random() * 14) + 9; // 9..22 per tick
      if (pct > 100) pct = 100;
      later(tick, stepMs);
    })();
  }

  var BANNER =
    "    _    _    ____   ___  _   _\n" +
    "   / \\  / \\  |  _ \\ / _ \\| \\ | |\n" +
    "  / _ \\/ _ \\ | |_) | | | |  \\| |\n" +
    " / ___ \\ ___\\|  _ <| |_| | |\\  |\n" +
    "/_/   \\_\\   \\|_| \\_\\\\___/|_| \\_|   S N I D E R";

  if (isHome && !booted) {
    // ---------- FULL BOOT (first home load per session) ----------
    var cmd = addLine("");
    type(cmd, "$ ", "make flash && ./portfolio", 34, function () {
      later(function () {
        addLine("cc    -Wall -Os  src/profile.c   -o build/profile.o");
        later(function () {
          addLine("cc    -Wall -Os  src/skills.c    -o build/skills.o");
          later(function () {
            addLine("cc    -Wall -Os  src/projects.c  -o build/projects.o");
            later(function () {
              var ld = addLine("ld    build/*.o  -o portfolio.elf");
              later(function () {
                inner.removeChild(ld);
                okLine("ld    build/*.o  -o portfolio.elf      ", "OK");
                var flash = addLine("");
                progress(flash, "flash", 22, 95, function () {
                  inner.removeChild(flash);
                  okLine("flash write 0x08000000 .................", "DONE");
                  addLine("");
                  addLine(BANNER, "banner");
                  addLine("");
                  okLine("boot: reset vector @ 0x08000000 .......", "OK");
                  later(function () {
                    okLine("boot: peripherals up (SPI I2C UART DMA) ..", "OK");
                    later(function () {
                      okLine("boot: loading ontology map .............", "OK");
                      later(function () {
                        addLine("");
                        var online = addLine("");
                        type(online, "", "[ ONLINE ]  portfolio ready \u2014 entering shell", 16, function () {
                          later(finish, 420);
                        });
                      }, 220);
                    }, 220);
                  }, 220);
                });
              }, 260);
            }, 150);
          }, 150);
        }, 150);
      }, 160);
    });
    later(finish, 4800); // hard cap
  } else {
    // ---------- SHORT NAV TRANSITION ----------
    // aaron@portfolio:<path>$ <command>, typed, then held briefly.
    var HOLD_MS = 420;
    var prompt = "aaron@portfolio:" + navPath + "$ ";
    // Keep typing under ~0.9s even for long project paths.
    var speed = Math.max(10, Math.min(20, Math.floor(900 / Math.max(1, navCmd.length))));
    var l = addLine("");
    type(l, prompt, navCmd, speed, function () {
      later(finish, HOLD_MS);
    });
    later(finish, navCmd.length * speed + HOLD_MS + 800); // hard cap
  }
})();
