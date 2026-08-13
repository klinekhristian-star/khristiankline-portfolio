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

  var ids = [
    "web-development",
    "experience-design",
    "executive-production",
    "lab",
    "screen",
    "contact",
  ];
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
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5] }
    );
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  }

  // Hosted media: jsDelivr for pdf/mp4/images. GitHub raw for PPTX —
  // jsDelivr returns 403 on .pptx.
  var ON_PROD = /khristiankline|vercel\.app/.test(location.hostname);
  var MEDIA_PIN = "5800f46";
  var CDN_BASE = "https://cdn.jsdelivr.net/gh/klinekhristian-star/khristiankline-portfolio@" + MEDIA_PIN;
  var RAW_BASE = "https://raw.githubusercontent.com/klinekhristian-star/khristiankline-portfolio/" + MEDIA_PIN;

  function mediaUrl(path) {
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
      note: "Hosted MP4 · 6 seconds · replace with event footage",
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
