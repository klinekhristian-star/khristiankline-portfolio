(function () {
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

  var MEDIA_BASE =
    /khristiankline|vercel\.app/.test(location.hostname)
      ? "https://cdn.jsdelivr.net/gh/klinekhristian-star/khristiankline-portfolio@main"
      : "";

  var DECKS = [
    {
      id: "exp-pdf",
      title: "How a live moment holds",
      note: "Sample PDF brief · 6 slides",
      kind: "pdf",
      src: MEDIA_BASE + "/media/decks/experience-design.pdf",
    },
    {
      id: "exp-pptx",
      title: "Sample PowerPoint brief",
      note: "Sample PPTX · 3 slides",
      kind: "pptx",
      src: MEDIA_BASE + "/media/decks/sample-brief.pptx",
    },
  ];

  var VIDEOS = [
    {
      id: "showreel",
      title: "Experience, on camera",
      note: "Sample MP4 · replace with event footage",
      src: MEDIA_BASE + "/media/videos/showreel.mp4",
      poster: MEDIA_BASE + "/media/videos/showreel.jpg",
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

  var deckList = document.getElementById("deckList");
  if (deckList && window.KKTheater) {
    DECKS.forEach(function (d) {
      deckList.appendChild(
        card(d, d.kind.toUpperCase(), function () {
          if (d.kind === "pdf") window.KKTheater.openPdf(d.src, d.title);
          else window.KKTheater.openPptxFromUrl(d.src, d.title);
        })
      );
    });
  }

  var videoList = document.getElementById("videoList");
  if (videoList && window.KKTheater) {
    VIDEOS.forEach(function (v) {
      videoList.appendChild(
        card(v, "MP4", function () {
          window.KKTheater.openVideo(v.src, v.title);
        })
      );
    });
  }
})();
