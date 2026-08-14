(function () {
  var OWNER_KEY = "kk-owner";
  var WEBSITES_KEY = "kk-websites-v3";

  function isOwnerMode() {
    try {
      var params = new URLSearchParams(location.search);
      if (params.get("owner") === "1") {
        localStorage.setItem(OWNER_KEY, "1");
        return true;
      }
      if (params.get("owner") === "0") {
        localStorage.removeItem(OWNER_KEY);
        return false;
      }
      return localStorage.getItem(OWNER_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  var showcase = document.getElementById("showcase");
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
      if (e.key === "Escape" && showcase && !showcase.hidden) closeShowcase();
    });
  }

  function defaultWebsites() {
    return (window.KK_DEFAULT_WEBSITES || []).map(function (w) {
      return Object.assign({}, w, {
        stack: (w.stack || []).slice(),
        screenshots: (w.screenshots || []).slice()
      });
    });
  }

  function loadWebsites() {
    try {
      var raw = localStorage.getItem(WEBSITES_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (e) {}
    return defaultWebsites();
  }

  function saveWebsites(list) {
    try {
      localStorage.setItem(WEBSITES_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  var websites = loadWebsites();

  function mediaUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    if (window.KKMedia && window.KKMedia.mediaUrl) return window.KKMedia.mediaUrl(path);
    var ON_PROD = /khristiankline|vercel\.app/.test(location.hostname);
    if (!ON_PROD) return path;
    var RAW = "https://raw.githubusercontent.com/klinekhristian-star/khristiankline-portfolio/main";
    return RAW + path.split("/").map(function (seg) {
      return seg ? encodeURIComponent(seg) : "";
    }).join("/");
  }

  function resolveHeroShots(w) {
    var shots = w.screenshots || [];
    var hero = w.hero || shots[0] || "";
    var gallery;
    if (w.hero) {
      gallery = shots.filter(function (p) { return p && p !== w.hero; });
    } else {
      gallery = shots.length > 1 ? shots.slice(1) : [];
    }
    return { hero: hero, gallery: gallery };
  }

  function openShowcase(w) {
    if (!showcase) return;
    document.getElementById("scStatus").textContent =
      (w.status === "live" ? "Live" : "In development") +
      (w.category ? " \u00b7 " + w.category : "");
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

    var resolved = resolveHeroShots(w);

    var shots = document.getElementById("scShots");
    shots.innerHTML = "";
    resolved.gallery.forEach(function (src) {
      var img = document.createElement("img");
      img.src = mediaUrl(src);
      img.alt = "";
      img.loading = "lazy";
      shots.appendChild(img);
    });

    var hero = document.getElementById("scHero");
    if (resolved.hero) {
      hero.style.backgroundImage = 'url("' + mediaUrl(resolved.hero) + '")';
      hero.style.backgroundSize = "cover";
      hero.style.backgroundPosition = "center top";
    } else {
      hero.style.backgroundImage = "";
      hero.style.background =
        w.status === "live"
          ? "linear-gradient(145deg, #0c1020 0%, #151a2e 55%, #1a2035 100%)"
          : "linear-gradient(145deg, #141210 0%, #1e1a16 55%, #2a241e 100%)";
    }

    var link = document.getElementById("scLink");
    if (w.url && String(w.url).trim()) {
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

  function closeShowcaseFn() {
    if (!showcase) return;
    showcase.hidden = true;
    showcase.setAttribute("aria-hidden", "true");
    document.body.classList.remove("showcase-open");
  }

  function makeWebCard(w) {
    var card = document.createElement("button");
    card.type = "button";
    card.className = "web-card tone-" + (w.tone || (w.status === "live" ? "live" : "dev"));
    card.setAttribute("data-id", w.id || "");
    card.style.cssText = "width:100%;text-align:left;cursor:pointer;border:none;display:block;font:inherit;color:inherit;background:transparent";
    var cat = w.category ? '<span class="web-card-category">' + escapeHtml(w.category) + "</span>" : "";
    card.innerHTML =
      '<div class="web-card-inner">' +
      cat +
      '<h3 class="web-card-title">' +
      escapeHtml(w.title) +
      "</h3>" +
      '<p class="web-card-summary">' +
      escapeHtml(w.summary) +
      "</p>" +
      '<div class="web-card-meta">' +
      (w.year ? "<span>" + escapeHtml(w.year) + "</span>" : "") +
      (w.role ? "<span>" + escapeHtml(w.role) + "</span>" : "") +
      "</div>" +
      "</div>";
    card.addEventListener("click", function () {
      openShowcase(w);
    });
    return card;
  }

  function renderWebLists() {
    var liveList = document.getElementById("webLiveList");
    var devList = document.getElementById("webDevList");
    if (liveList) liveList.innerHTML = "";
    if (devList) devList.innerHTML = "";
    websites.forEach(function (w) {
      var card = makeWebCard(w);
      if (w.status === "live" && liveList) liveList.appendChild(card);
      else if (devList) devList.appendChild(card);
    });
  }

  renderWebLists();

  // Owner admin (simple prompts)
  if (isOwnerMode()) {
    document.body.classList.add("owner-mode");
    var bar = document.createElement("div");
    bar.className = "owner-bar";
    bar.innerHTML =
      '<button type="button" id="kkAddWeb">Add site</button>' +
      '<button type="button" id="kkResetWeb">Reset defaults</button>' +
      "<span>Owner mode</span>";
    document.body.appendChild(bar);

    document.getElementById("kkResetWeb").addEventListener("click", function () {
      localStorage.removeItem(WEBSITES_KEY);
      websites = defaultWebsites();
      renderWebLists();
      alert("Reset to defaults");
    });

    document.getElementById("kkAddWeb").addEventListener("click", function () {
      var title = prompt("Title");
      if (!title) return;
      var status = prompt("Status: live or development", "development") || "development";
      var category = prompt("Category", "") || "";
      var url = prompt("URL (leave blank if no live site)", "") || "";
      var shots =
        prompt("Screenshot paths comma-separated (first = hero/top; rest = gallery)", "") || "";
      var id =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "site-" + Date.now();
      websites.push({
        id: id,
        title: title,
        status: status === "live" ? "live" : "development",
        client: title,
        year: String(new Date().getFullYear()),
        category: category,
        summary: "",
        description: "",
        role: "",
        stack: [],
        url: url.trim(),
        screenshots: shots
          .split(",")
          .map(function (s) {
            return s.trim();
          })
          .filter(Boolean),
        tone: status === "live" ? "live" : "dev"
      });
      saveWebsites(websites);
      renderWebLists();
    });
  }

  var menuBtn = document.getElementById("menuBtn");
  var mobileNav = document.getElementById("mobileNav");
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
})();
