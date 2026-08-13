(function () {
  // Owner mode: drop zones only for you.
  // Open https://khristiankline.com/?owner=1 once to unlock on this device.
  // Use ?owner=0 to lock again.
  try {
    var params = new URLSearchParams(location.search);
    if (params.get("owner") === "1") {
      localStorage.setItem("kk-owner", "1");
    } else if (params.get("owner") === "0") {
      localStorage.removeItem("kk-owner");
    }
    if (localStorage.getItem("kk-owner") === "1" || params.get("owner") === "1") {
      document.body.classList.add("owner-mode");
    }
  } catch (e) {}

  var btn = document.getElementById("menuBtn");
  var nav = document.getElementById("mobileNav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      });
    });
    var swipe = { on: false, x: 0, y: 0 };
    nav.addEventListener("pointerdown", function (e) {
      if (!nav.classList.contains("open")) return;
      swipe = { on: true, x: e.clientX, y: e.clientY };
    });
    nav.addEventListener("pointerup", function (e) {
      if (!swipe.on) return;
      swipe.on = false;
      var dx = e.clientX - swipe.x;
      var dy = e.clientY - swipe.y;
      if (dx < -56 && Math.abs(dx) > Math.abs(dy)) {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }
  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());

  // ——— Websites: Live / In development + owner admin + showcase ———
  var WEBSITES_KEY = "kk-websites-v2";
  var DEFAULT_WEBSITES = (typeof window !== "undefined" && window.KK_DEFAULT_WEBSITES) ? window.KK_DEFAULT_WEBSITES : [];

  function loadWebsites() {
    try {
      var raw = localStorage.getItem(WEBSITES_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (e) {}
    return DEFAULT_WEBSITES.map(function (w) {
      return Object.assign({}, w, { stack: (w.stack || []).slice(), screenshots: (w.screenshots || []).slice() });
    });
  }

  function saveWebsites(list) {
    try {
      localStorage.setItem(WEBSITES_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  var websites = loadWebsites();

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, """);
  }

  function renderWebLists() {
    var liveList = document.getElementById("webLiveList");
    var devList = document.getElementById("webDevList");
    var liveGroup = document.getElementById("webLiveGroup");
    var devGroup = document.getElementById("webDevGroup");
    if (!liveList || !devList) return;

    liveList.innerHTML = "";
    devList.innerHTML = "";

    var live = websites.filter(function (w) { return w.status === "live"; });
    var dev = websites.filter(function (w) { return w.status === "development"; });

    if (liveGroup) liveGroup.style.display = live.length ? "" : "none";
    if (devGroup) devGroup.style.display = dev.length ? "" : "none";

    function makeCard(w) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "web-card tone-" + (w.tone || (w.status === "live" ? "live" : "dev"));
      btn.setAttribute("data-id", w.id);
      var badge = w.status === "live" ? "Live" : "In development";
      btn.innerHTML =
        '<div class="panel-deco" aria-hidden="true"></div>' +
        '<div class="web-card-inner">' +
        '<span class="web-card-badge">' + badge + "</span>" +
        (w.category
          ? '<p class="web-card-category">' + escapeHtml(w.category) + "</p>"
          : "") +
        '<h3 class="web-card-title">' + escapeHtml(w.title) + "</h3>" +
        '<p class="web-card-summary">' + escapeHtml(w.summary) + "</p>" +
        '<div class="web-card-meta">' +
        (w.year ? "<span>" + escapeHtml(w.year) + "</span>" : "") +
        (w.role ? "<span>" + escapeHtml(w.role) + "</span>" : "") +
        "</div></div>";
      btn.addEventListener("click", function () {
        openShowcase(w);
      });
      return btn;
    }

    live.forEach(function (w) { liveList.appendChild(makeCard(w)); });
    dev.forEach(function (w) { devList.appendChild(makeCard(w)); });
  }

  var showcase = document.getElementById("showcase");
  function openShowcase(w) {
    if (!showcase) return;
    document.getElementById("scStatus").textContent =
      (w.status === "live" ? "Live" : "In development") +
      (w.category ? " · " + w.category : "");
    document.getElementById("scTitle").textContent = w.title || "";
    document.getElementById("scSummary").textContent = w.summary || "";
    var descEl = document.getElementById("scDesc");
    descEl.innerHTML = "";
    String(w.description || "")
      .split(/\n\n+/)
      .filter(Boolean)
      .forEach(function (para) {
        var p = document.createElement("p");
        p.textContent = para;
        descEl.appendChild(p);
      });

    var meta = document.getElementById("scMeta");
    meta.innerHTML = "";
    [w.client, w.year, w.role].filter(Boolean).forEach(function (t) {
      var s = document.createElement("span");
      s.textContent = t;
      meta.appendChild(s);
    });

    var stack = document.getElementById("scStack");
    stack.innerHTML = "";
    (w.stack || []).forEach(function (t) {
      var s = document.createElement("span");
      s.textContent = t;
      stack.appendChild(s);
    });

    var shots = document.getElementById("scShots");
    shots.innerHTML = "";
    (w.screenshots || []).forEach(function (src) {
      var img = document.createElement("img");
      img.src = typeof mediaUrl === "function" ? mediaUrl(src) : src;
      img.alt = "";
      shots.appendChild(img);
    });

    var hero = document.getElementById("scHero");
    if (w.screenshots && w.screenshots[0]) {
      var src0 = typeof mediaUrl === "function" ? mediaUrl(w.screenshots[0]) : w.screenshots[0];
      hero.style.backgroundImage = 'url("' + src0 + '")';
    } else {
      hero.style.backgroundImage = "";
      hero.style.background =
        w.status === "live"
          ? "linear-gradient(145deg, #0c1020 0%, #151a2e 55%, #1a2035 100%)"
          : "linear-gradient(145deg, #141210 0%, #1e1a16 55%, #2a241e 100%)";
    }

    var link = document.getElementById("scLink");
    if (w.url) {
      link.href = w.url;
      link.hidden = false;
    } else {
      link.hidden = true;
      link.removeAttribute("href");
    }

    showcase.hidden = false;
    showcase.setAttribute("aria-hidden", "false");
    document.body.classList.add("showcase-open");
  }

  function closeShowcase() {
    if (!showcase) return;
    showcase.hidden = true;
    showcase.setAttribute("aria-hidden", "true");
    document.body.classList.remove("showcase-open");
  }

  if (showcase) {
    showcase.querySelectorAll("[data-close-showcase]").forEach(function (el) {
      el.addEventListener("click", closeShowcase);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !showcase.hidden) closeShowcase();
    });
  }

  function renderAdmin() {
    var admin = document.getElementById("webAdmin");
    var list = document.getElementById("webAdminList");
    if (!admin || !list) return;
    if (!document.body.classList.contains("owner-mode")) {
      admin.hidden = true;
      return;
    }
    admin.hidden = false;
    list.innerHTML = "";
    websites.forEach(function (w, idx) {
      var row = document.createElement("div");
      row.className = "web-admin-row";
      row.innerHTML =
        "<strong>" +
        escapeHtml(w.title) +
        "</strong> <span>" +
        escapeHtml(w.status) +
        '</span> <button type="button" data-edit="' +
        idx +
        '">Edit</button> <button type="button" data-del="' +
        idx +
        '">Delete</button>';
      list.appendChild(row);
    });
    list.querySelectorAll("[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () {
        openWebForm(websites[+b.getAttribute("data-edit")], +b.getAttribute("data-edit"));
      });
    });
    list.querySelectorAll("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (!confirm("Delete this site?")) return;
        websites.splice(+b.getAttribute("data-del"), 1);
        saveWebsites(websites);
        renderWebLists();
        renderAdmin();
      });
    });
  }

  function openWebForm(existing, idx) {
    var title = prompt("Title", existing ? existing.title : "");
    if (title == null) return;
    var status = prompt("Status: live or development", existing ? existing.status : "development");
    if (status == null) return;
    status = status === "live" ? "live" : "development";
    var category = prompt("Category", existing ? existing.category || "" : "") || "";
    var summary = prompt("Summary", existing ? existing.summary : "") || "";
    var description = prompt("Description", existing ? existing.description : "") || "";
    var role = prompt("Role", existing ? existing.role : "") || "";
    var year = prompt("Year", existing ? existing.year : "") || "";
    var stackStr = prompt("Stack (comma-separated)", existing ? (existing.stack || []).join(", ") : "") || "";
    var url = prompt("URL (optional)", existing ? existing.url || "" : "") || "";
    var shots = prompt("Screenshot paths (comma-separated)", existing ? (existing.screenshots || []).join(", ") : "") || "";
    var item = {
      id: existing && existing.id ? existing.id : "site-" + Date.now(),
      title: title.trim(),
      status: status,
      category: category.trim(),
      client: title.trim(),
      year: year.trim(),
      summary: summary.trim(),
      description: description.trim(),
      role: role.trim(),
      stack: stackStr.split(",").map(function (s) { return s.trim(); }).filter(Boolean),
      url: url.trim(),
      screenshots: shots.split(",").map(function (s) { return s.trim(); }).filter(Boolean),
      tone: status === "live" ? "live" : "dev",
    };
    if (idx != null && idx >= 0) websites[idx] = item;
    else websites.push(item);
    saveWebsites(websites);
    renderWebLists();
    renderAdmin();
  }

  var addBtn = document.getElementById("webAdminAdd");
  if (addBtn) addBtn.addEventListener("click", function () { openWebForm(null, null); });
  var resetBtn = document.getElementById("webAdminReset");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (!confirm("Reset websites to defaults?")) return;
      localStorage.removeItem(WEBSITES_KEY);
      websites = loadWebsites();
      renderWebLists();
      renderAdmin();
    });
  }

  renderWebLists();
  renderAdmin();

  var ids = ["web-development", "experience-design", "executive-production", "lab", "screen", "contact"];
  var links = document.querySelectorAll(".side-nav a");
  if ("IntersectionObserver" in window && links.length) {
    var map = {};
    links.forEach(function (a) {
      var id = (a.getAttribute("href") || "").replace("#", "");
      map[id] = a;
    });
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && map[e.target.id]) {
            links.forEach(function (l) { l.classList.remove("active"); });
            map[e.target.id].classList.add("active");
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  }

  var ON_PROD = /khristiankline|vercel\.app/.test(location.hostname);
  var MEDIA_PIN = "1a5f616";
  var CDN_BASE = "https://cdn.jsdelivr.net/gh/klinekhristian-star/khristiankline-portfolio@" + MEDIA_PIN;
  var RAW_BASE = "https://raw.githubusercontent.com/klinekhristian-star/khristiankline-portfolio/" + MEDIA_PIN;

  function mediaUrl(path) {
    if (!path) return path;
    if (/^https?:\/\//i.test(path)) return path;
    if (!ON_PROD) return path;
    if (/\.pptx?$/i.test(path)) return RAW_BASE + path;
    return CDN_BASE + path;
  }

  var DECKS = [
    {
      id: "exp-pdf",
      title: "How a live moment holds",
      note: "PDF slideshow · 6 slides",
      kind: "pdf",
      src: mediaUrl("/media/decks/experience-design.pdf"),
      poster: mediaUrl("/media/decks/experience-design.jpg"),
    },
    {
      id: "exp-pptx",
      title: "Sample PowerPoint brief",
      note: "PPTX slideshow · 5 slides",
      kind: "pptx",
      src: mediaUrl("/media/decks/sample-brief.pptx"),
      poster: mediaUrl("/media/decks/sample-brief.jpg"),
    },
  ];

  var VIDEOS = [
    {
      id: "showreel",
      title: "Experience, on camera",
      note: "Hosted MP4 · replace with event footage",
      src: mediaUrl("/media/videos/showreel.mp4"),
      poster: mediaUrl("/media/videos/showreel.jpg"),
    },
  ];

  function card(item, kindLabel, onOpen) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "media-card";
    b.innerHTML =
      '<span class="media-thumb ' +
      kindLabel.toLowerCase() +
      '" data-kind="' +
      kindLabel +
      '">' +
      (item.poster ? '<img src="' + item.poster + '" alt="" />' : "") +
      "</span>" +
      '<span class="media-copy"><h3>' +
      item.title +
      "</h3><p>" +
      item.note +
      "</p></span>" +
      '<span class="media-go">Open</span>';
    b.addEventListener("click", onOpen);
    return b;
  }

  function openDeck(d) {
    if (!window.KKTheater) return;
    if (d.kind === "pdf") window.KKTheater.openPdf(d.src, d.title);
    else window.KKTheater.openPptxFromUrl(d.src, d.title);
  }

  function openFilm(v) {
    if (!window.KKTheater) return;
    window.KKTheater.openVideo(v.src, v.title, v.poster);
  }

  var deckList = document.getElementById("deckList");
  if (deckList && window.KKTheater) {
    DECKS.forEach(function (d) {
      deckList.appendChild(card(d, d.kind.toUpperCase(), function () { openDeck(d); }));
    });
  }

  var videoList = document.getElementById("videoList");
  if (videoList && window.KKTheater) {
    VIDEOS.forEach(function (v) {
      videoList.appendChild(card(v, "MP4", function () { openFilm(v); }));
    });
  }

  document.querySelectorAll("[data-open]").forEach(function (el) {
    el.addEventListener("click", function () {
      var kind = el.getAttribute("data-open");
      var id = el.getAttribute("data-id");
      if (kind === "pdf" || kind === "pptx") {
        var d = DECKS.filter(function (x) { return x.id === id; })[0];
        if (d) openDeck(d);
      } else if (kind === "video") {
        var v = VIDEOS.filter(function (x) { return x.id === id; })[0];
        if (v) openFilm(v);
      }
    });
  });
})();
