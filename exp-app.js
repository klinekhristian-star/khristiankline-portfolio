(function () {
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

  var ON_PROD = /khristiankline|vercel\.app/.test(location.hostname);
  var MEDIA_PIN = "main";
  var CDN_BASE = "https://cdn.jsdelivr.net/gh/klinekhristian-star/khristiankline-portfolio@" + MEDIA_PIN;
  var RAW_BASE = "https://raw.githubusercontent.com/klinekhristian-star/khristiankline-portfolio/" + MEDIA_PIN;

  function mediaUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    var encoded = path.split("/").map(function (seg) {
      return seg ? encodeURIComponent(seg) : "";
    }).join("/");
    if (!ON_PROD) return encoded;
    if (/\.pptx?$/i.test(path) || /\.pdf$/i.test(path)) return RAW_BASE + encoded;
    return CDN_BASE + encoded;
  }

  var EXPERIENCES = [
    {
      id: "resfest",
      title: "RESFEST",
      client: "RES Media Group",
      format: "In-person",
      year: "2002–2006",
      tone: "a",
      summary: "Global touring digital film festival — curation, city operations, and live audience design across dozens of markets.",
      description: "RESFEST was a leading digital film festival that toured internationally at the height of desktop filmmaking and motion graphics culture.\n\nWork spanned program curation, city-level production, sponsorship integration, and the live experience of bringing digital cinema into theaters and parties worldwide.",
      role: "40+ cities · Festival & live",
      images: ["/media/experiences/resfest-home.jpg"],
      slideshows: [],
      videos: []
    },
    {
      id: "brahma",
      title: "Brahma beer launch",
      client: "InBev · Brahma",
      format: "Virtual + In-person",
      year: "Mid-2000s",
      tone: "b",
      summary: "Brand launch activation spanning live presence and digital extension for a global beverage house.",
      description: "Hybrid launch work for Brahma under the InBev umbrella — live activation paired with digital reach during the RES and early Tribeca years.",
      role: "Launch · Hybrid",
      images: ["/media/experiences/brahma-home.jpg"],
      slideshows: [],
      videos: []
    },
    {
      id: "diesel",
      title: "Diesel campaign programs",
      client: "Diesel",
      format: "Virtual + In-person",
      year: "2006–2007",
      tone: "c",
      summary: "Fashion and lifestyle programs under Tribeca Enterprises — hybrid activations for a global apparel brand.",
      description: "Campaign and experience programs for Diesel produced in the Tribeca Enterprises period — live moments coordinated with digital distribution.\n\nOpen the multi-page Diesel book as a full-screen slideshow (swipe or use Prev / Next).",
      role: "Campaign · Hybrid",
      images: ["/media/experiences/diesel-home.jpg"],
      slideshows: [
        {
          kind: "pdf",
          src: "/media/experiences/Diesel Book v8.pdf",
          label: "View Diesel book",
          title: "Diesel Book"
        }
      ],
      videos: []
    },
    {
      id: "nike-ginga",
      title: "Nike Ginga launch",
      client: "Nike",
      format: "Curated content + In-person",
      year: "Mid-2000s",
      tone: "d",
      summary: "Curated original content and live screening events around Nike’s Ginga film — Brazilian football as brand storytelling.",
      description: "Nike Ginga paired original documentary content with live screening events and RES/Nike program stops.",
      role: "Film · Live screening",
      images: ["/media/experiences/nike-ginga-home.jpg"],
      slideshows: [],
      videos: []
    },
    {
      id: "jpmorgan",
      title: "JP Morgan Securities programs",
      client: "JP Morgan Securities",
      format: "Virtual",
      year: "ON24 era",
      tone: "e",
      summary: "Executive virtual programming for institutional audiences — precise run-of-show and controlled delivery.",
      description: "Virtual executive programs for JP Morgan Securities — webcast production with institutional discipline and archive strategy.",
      role: "Executive · Webcast",
      images: ["/media/experiences/jpms-home.jpg"],
      slideshows: [],
      videos: []
    }
  ];

  var LAB_ITEMS = [
    {
      id: "driller-academy",
      title: "Driller Academy — Generative AI video",
      client: "Skilled trades · Workforce",
      format: "Generative AI",
      year: "2026",
      tone: "f",
      summary: "AI-assisted training film for the Driller Academy initiative — generative video for trade education and workforce GTM.",
      description: "Lab piece for the Driller Academy / skilled-trades track: generative AI video as a practical tool for training storytelling and Wisconsin Fast Forward–aligned workforce work.\n\nHost the MP4 at /media/videos/driller-academy.mp4 so Watch film plays in-theater.",
      role: "Training film · Lab",
      images: [],
      slideshows: [],
      videos: [
        {
          id: "driller-main",
          title: "Driller Academy film",
          src: "/media/videos/driller-academy.mp4",
          poster: "/media/videos/driller-academy.jpg"
        }
      ]
    }
  ];

  function openPdfSafe(src, title) {
    if (window.KKTheater && window.KKTheater.openPdf) {
      window.KKTheater.openPdf(src, title);
      return;
    }
    window.open(src, "_blank", "noopener");
  }

  function openProjectShowcase(item) {
    if (!showcase) return;
    document.getElementById("scStatus").textContent =
      (item.format || "") + (item.year ? " · " + item.year : "");
    document.getElementById("scTitle").textContent = item.title || "";
    document.getElementById("scSummary").textContent = item.summary || "";

    var descEl = document.getElementById("scDesc");
    descEl.innerHTML = "";
    String(item.description || "")
      .split(/\n\n+/)
      .filter(Boolean)
      .forEach(function (para) {
        var p = document.createElement("p");
        p.textContent = para;
        descEl.appendChild(p);
      });

    var meta = document.getElementById("scMeta");
    meta.innerHTML = "";
    [item.client, item.year, item.role].filter(Boolean).forEach(function (t) {
      var s = document.createElement("span");
      s.textContent = t;
      meta.appendChild(s);
    });

    var stack = document.getElementById("scStack");
    if (stack) stack.innerHTML = "";

    var shots = document.getElementById("scShots");
    shots.innerHTML = "";
    (item.images || []).forEach(function (src) {
      var img = document.createElement("img");
      img.src = mediaUrl(src);
      img.alt = "";
      img.loading = "lazy";
      shots.appendChild(img);
    });

    var mediaBox = document.getElementById("scMedia");
    if (mediaBox) {
      mediaBox.innerHTML = "";
      (item.slideshows || []).forEach(function (deck) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "panel-play";
        b.textContent = deck.label || "Open slideshow";
        b.addEventListener("click", function (e) {
          e.stopPropagation();
          openPdfSafe(mediaUrl(deck.src), deck.title || item.title);
        });
        mediaBox.appendChild(b);
      });
      (item.videos || []).forEach(function (vid) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "panel-play";
        b.textContent = vid.title ? "Watch: " + vid.title : "Watch film";
        b.addEventListener("click", function (e) {
          e.stopPropagation();
          var src = mediaUrl(vid.src);
          var poster = mediaUrl(vid.poster || "");
          if (window.KKTheater && window.KKTheater.openVideo) {
            window.KKTheater.openVideo(src, vid.title || item.title, poster);
          } else {
            window.open(src, "_blank", "noopener");
          }
        });
        mediaBox.appendChild(b);
      });
      if (!(item.images || []).length && !(item.slideshows || []).length && !(item.videos || []).length) {
        var note = document.createElement("p");
        note.className = "showcase-media-empty";
        note.textContent = "Media coming soon — images, slideshow, or film can be attached to this project.";
        mediaBox.appendChild(note);
      }
    }

    var hero = document.getElementById("scHero");
    if (item.images && item.images[0]) {
      hero.style.backgroundImage = 'url("' + mediaUrl(item.images[0]) + '")';
      hero.style.backgroundSize = "cover";
      hero.style.backgroundPosition = "center top";
    } else {
      hero.style.backgroundImage = "";
      hero.style.background = "linear-gradient(145deg, #141210 0%, #1e1a16 55%, #2a241e 100%)";
    }

    var link = document.getElementById("scLink");
    if (link) {
      link.hidden = true;
      link.removeAttribute("href");
    }

    showcase.hidden = false;
    showcase.setAttribute("aria-hidden", "false");
    document.body.classList.add("showcase-open");
  }

  function makeExpCard(item) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "panel tone-" + (item.tone || "a");
    btn.style.cssText = "width:100%;text-align:left;cursor:pointer;border:none;display:block;font:inherit;color:inherit";
    btn.innerHTML =
      '<div class="panel-deco" aria-hidden="true"></div>' +
      '<div class="panel-inner">' +
      '<p class="panel-client">' + escapeHtml(item.client) + "</p>" +
      '<h3 class="panel-title">' + escapeHtml(item.title) + "</h3>" +
      '<p class="panel-summary">' + escapeHtml(item.summary) + "</p>" +
      '<div class="panel-meta">' +
      (item.format ? "<span>" + escapeHtml(item.format) + "</span>" : "") +
      (item.year ? "<span>" + escapeHtml(item.year) + "</span>" : "") +
      (item.role ? "<span>" + escapeHtml(item.role) + "</span>" : "") +
      "</div>" +
      '<span class="panel-play" style="pointer-events:none">View project</span>' +
      "</div>";
    btn.addEventListener("click", function () {
      openProjectShowcase(item);
    });
    return btn;
  }

  var expList = document.getElementById("expList");
  if (expList) {
    EXPERIENCES.forEach(function (item) {
      expList.appendChild(makeExpCard(item));
    });
  }
  var labList = document.getElementById("labList");
  if (labList) {
    LAB_ITEMS.forEach(function (item) {
      labList.appendChild(makeExpCard(item));
    });
  }

  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
})();
