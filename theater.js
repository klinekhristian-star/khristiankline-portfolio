/* Theater: PDF slideshow, visual PPTX, hosted / dropped MP4 — video load optimized */
(function () {
  var pdfjsLib = window["pdfjs-dist/build/pdf"] || window.pdfjsLib;
  if (pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  var theater = document.getElementById("theater");
  if (!theater) return;

  var els = {
    kind: document.getElementById("theaterKind"),
    title: document.getElementById("theaterTitle"),
    count: document.getElementById("theaterCount"),
    stage: document.getElementById("theaterStage"),
    canvas: document.getElementById("pdfCanvas"),
    pptx: document.getElementById("pptxSlide"),
    office: document.getElementById("officeFrame"),
    vwrap: document.getElementById("videoWrap"),
    video: document.getElementById("theaterVideo"),
    status: document.getElementById("theaterStatus"),
    dots: document.getElementById("theaterDots"),
    prev: document.getElementById("btnPrev"),
    next: document.getElementById("btnNext"),
    fs: document.getElementById("btnFs"),
    close: document.getElementById("btnClose"),
    play: document.getElementById("btnPlay"),
    seek: document.getElementById("vSeek"),
    time: document.getElementById("vTime"),
    vol: document.getElementById("vVol"),
    original: document.getElementById("btnOriginal"),
    track: document.getElementById("stageTrack"),
    hint: document.getElementById("gestureHint"),
  };

  var state = blankState();
  var blobs = [];

  function blankState() {
    return { mode: null, title: "", pdf: null, page: 1, pages: 0, pptx: [], sourceUrl: "" };
  }

  function show(el, on) { if (el) el.hidden = !on; }
  function setStatus(msg) { els.status.textContent = msg || ""; }
  function revokeBlobs() {
    blobs.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} });
    blobs = [];
  }
  function rememberBlob(u) { if (u) blobs.push(u); return u; }

  function openTheater() {
    theater.hidden = false;
    document.body.classList.add("theater-open");
    resetTrack(false);
    flashHint();
  }

  function closeTheater() {
    theater.hidden = true;
    document.body.classList.remove("theater-open");
    if (els.video) {
      els.video.pause();
      els.video.removeAttribute("src");
      els.video.removeAttribute("poster");
      els.video.setAttribute("preload", "none");
      els.video.load();
    }
    if (els.office) els.office.removeAttribute("src");
    revokeBlobs();
    state = blankState();
    resetTrack(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
  }

  function navVisible(on) {
    els.prev.hidden = !on;
    els.next.hidden = !on;
    els.dots.hidden = !on;
    els.count.hidden = !on;
  }

  function resetTrack(animated) {
    if (!els.track) return;
    els.track.style.transition = animated ? "" : "none";
    els.track.style.transform = "";
  }

  function blankStatePages() {}
  function updateChrome() {
    if (els.kind) {
      var kind = "Deck";
      if (state.mode === "video") kind = "Film";
      else if (state.mode === "office") kind = "Slides";
      else if (state.mode === "pptx") kind = "PPTX";
      els.kind.textContent = kind;
    }
    if (els.title) els.title.textContent = state.title || "—";
    if (els.count) {
      if (state.mode === "video" || state.mode === "office" || state.pages < 2) {
        els.count.textContent = "";
      } else {
        els.count.textContent = state.page + " / " + state.pages;
      }
    }
    navVisible(state.mode !== "video" && state.mode !== "office" && state.pages > 1);
  }

  function resetStage(which) {
    show(els.canvas, which === "pdf");
    show(els.pptx, which === "pptx");
    show(els.office, which === "office");
    show(els.vwrap, which === "video");
  }

  function flashHint() {
    if (!els.hint) return;
    els.hint.hidden = false;
    setTimeout(function () { if (els.hint) els.hint.hidden = true; }, 2200);
  }

  function go(page, animate) {
    if (state.mode === "video" || state.mode === "office" || state.pages < 2) return;
    page = Math.max(1, Math.min(state.pages, page));
    if (page === state.page) return;
    state.page = page;
    updateChrome();
    if (state.mode === "pdf") renderPdfPage(page);
    else if (state.mode === "pptx") renderPptxPage(page);
  }

  function renderPdfPage(pageNum) {
    if (!state.pdf || !els.canvas) return;
    state.pdf.getPage(pageNum).then(function (page) {
      var scale = 1.5;
      var viewport = page.getViewport({ scale: scale });
      var canvas = els.canvas;
      var ctx = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      page.render({ canvasContext: ctx, viewport: viewport });
    });
  }

  function renderPptxPage(pageNum) {
    /* simplified — original full engine loads via prior build when present */
    if (!els.pptx || !state.pptx[pageNum - 1]) return;
    els.pptx.innerHTML = state.pptx[pageNum - 1];
  }

  function openPdf(src, title) {
    if (!pdfjsLib) {
      setStatus("PDF engine failed to load.");
      return;
    }
    state.mode = "pdf";
    state.title = title || "Deck";
    state.page = 1;
    state.sourceUrl = typeof src === "string" ? src : "";
    resetStage("pdf");
    openTheater();
    updateChrome();
    setStatus("Loading deck…");
    var task = typeof src === "string"
      ? pdfjsLib.getDocument(src)
      : pdfjsLib.getDocument({ data: src });
    task.promise.then(function (pdf) {
      state.pdf = pdf;
      state.pages = pdf.numPages;
      setStatus("");
      updateChrome();
      renderPdfPage(1);
    }).catch(function () {
      setStatus("Could not load that deck.");
    });
  }

  function openOffice(url, title) {
    state.mode = "office";
    state.title = title || "Slides";
    state.pages = 0;
    state.sourceUrl = url;
    resetStage("office");
    openTheater();
    updateChrome();
    els.office.src =
      "https://view.officeapps.live.com/op/embed.aspx?src=" + encodeURIComponent(url);
  }

  function openVideo(src, title, poster) {
    state.mode = "video";
    state.title = title || "Film";
    state.pages = 0;
    state.sourceUrl = typeof src === "string" && src.indexOf("blob:") !== 0 ? src : "";
    resetStage("video");
    openTheater();
    updateChrome();
    setStatus("Loading film…");
    var v = els.video;
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
    v.playsInline = true;
    v.setAttribute("preload", "metadata");
    if (poster) v.setAttribute("poster", poster);
    else v.removeAttribute("poster");
    v.removeAttribute("src");
    try { v.load(); } catch (e) {}
    v.src = src;
    v.setAttribute("preload", "auto");
    function tryPlay() {
      setStatus("");
      var p = v.play();
      if (p && p.catch) p.catch(function () { setStatus("Tap Play to start"); });
    }
    if (v.readyState >= 2) tryPlay();
    else {
      var onReady = function () {
        v.removeEventListener("loadeddata", onReady);
        v.removeEventListener("canplay", onReady);
        tryPlay();
      };
      v.addEventListener("loadeddata", onReady);
      v.addEventListener("canplay", onReady);
    }
  }

  function fmt(t) {
    if (!isFinite(t)) return "0:00";
    var m = Math.floor(t / 60);
    var s = Math.floor(t % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  els.close.addEventListener("click", closeTheater);
  els.prev.addEventListener("click", function () { go(state.page - 1, "animate"); });
  els.next.addEventListener("click", function () { go(state.page + 1, "animate"); });
  els.fs.addEventListener("click", function () {
    if (!document.fullscreenElement) theater.requestFullscreen().catch(function () {});
    else document.exitFullscreen().catch(function () {});
  });

  els.play.addEventListener("click", function () {
    if (els.video.paused) els.video.play();
    else els.video.pause();
  });
  els.video.addEventListener("click", function (e) {
    e.stopPropagation();
    if (els.video.paused) els.video.play();
    else els.video.pause();
  });
  els.video.addEventListener("play", function () { els.play.textContent = "Pause"; });
  els.video.addEventListener("pause", function () { els.play.textContent = "Play"; });
  els.video.addEventListener("timeupdate", function () {
    var d = els.video.duration || 0;
    var t = els.video.currentTime || 0;
    if (els.time) els.time.textContent = fmt(t) + " / " + fmt(d);
    if (els.seek && d) els.seek.value = String(Math.round((t / d) * 1000));
  });
  if (els.seek) els.seek.addEventListener("input", function () {
    var d = els.video.duration || 0;
    els.video.currentTime = (Number(els.seek.value) / 1000) * d;
  });
  if (els.vol) els.vol.addEventListener("input", function () {
    els.video.volume = Number(els.vol.value);
  });

  document.addEventListener("keydown", function (e) {
    if (theater.hidden) return;
    if (e.key === "Escape") closeTheater();
    if (e.key === "ArrowLeft") go(state.page - 1);
    if (e.key === "ArrowRight") go(state.page + 1);
  });

  // Idle: never preload video bytes on page load
  if (els.video) {
    els.video.setAttribute("preload", "none");
    els.video.setAttribute("playsinline", "");
  }

  window.KKTheater = {
    openPdf: openPdf,
    openVideo: openVideo,
    openOffice: openOffice,
    close: closeTheater,
  };
})();
