/* Theater: PDF slideshow, PPTX slides, hosted / dropped MP4 */
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
  };

  var state = {
    mode: null,
    title: "",
    pdf: null,
    page: 1,
    pages: 0,
    pptx: [],
  };

  function show(el, on) {
    if (el) el.hidden = !on;
  }

  function setStatus(msg) {
    els.status.textContent = msg || "";
  }

  function openTheater() {
    theater.hidden = false;
    document.body.classList.add("theater-open");
  }

  function closeTheater() {
    theater.hidden = true;
    document.body.classList.remove("theater-open");
    if (els.video) {
      els.video.pause();
      els.video.removeAttribute("src");
      els.video.load();
    }
    state = { mode: null, title: "", pdf: null, page: 1, pages: 0, pptx: [] };
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
  }

  function navVisible(on) {
    els.prev.hidden = !on;
    els.next.hidden = !on;
    els.dots.hidden = !on;
    els.count.hidden = !on;
  }

  function renderDots() {
    els.dots.innerHTML = "";
    if (state.mode === "video" || state.pages < 2) return;
    for (var i = 1; i <= state.pages; i++) {
      var b = document.createElement("button");
      b.type = "button";
      if (i === state.page) b.className = "on";
      b.setAttribute("aria-label", "Slide " + i);
      b.addEventListener("click", (function (n) {
        return function () { go(n); };
      })(i));
      els.dots.appendChild(b);
    }
  }

  function updateChrome() {
    els.kind.textContent = state.mode === "video" ? "Film" : "Deck";
    els.title.textContent = state.title || "—";
    if (state.mode === "video") {
      els.count.textContent = "";
      navVisible(false);
    } else {
      els.count.textContent = state.pages ? state.page + " / " + state.pages : "";
      navVisible(true);
    }
    renderDots();
  }

  function go(n) {
    if (!state.pages) return;
    state.page = Math.max(1, Math.min(state.pages, n));
    if (state.mode === "pdf") drawPdfPage();
    else if (state.mode === "pptx") drawPptx();
    updateChrome();
  }

  function drawPdfPage() {
    if (!state.pdf) return;
    setStatus("Rendering…");
    state.pdf.getPage(state.page).then(function (page) {
      var unscaled = page.getViewport({ scale: 1 });
      var maxW = els.stage.clientWidth - 24;
      var maxH = els.stage.clientHeight - 24;
      var scale = Math.min(maxW / unscaled.width, maxH / unscaled.height, 2.4);
      var vp = page.getViewport({ scale: scale });
      var canvas = els.canvas;
      var ctx = canvas.getContext("2d");
      var dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(vp.width * dpr);
      canvas.height = Math.floor(vp.height * dpr);
      canvas.style.width = vp.width + "px";
      canvas.style.height = vp.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return page.render({ canvasContext: ctx, viewport: vp }).promise;
    }).then(function () {
      setStatus("");
    }).catch(function (err) {
      setStatus("Could not render this page.");
      console.error(err);
    });
  }

  function drawPptx() {
    var slide = state.pptx[state.page - 1] || [];
    els.pptx.innerHTML = "";
    slide.forEach(function (line, i) {
      var el = document.createElement(i === 0 ? "h2" : "p");
      el.textContent = line;
      els.pptx.appendChild(el);
    });
    setStatus("");
  }

  function openPdf(src, title) {
    if (!pdfjsLib) {
      setStatus("PDF engine failed to load.");
      return;
    }
    state.mode = "pdf";
    state.title = title || "Presentation";
    state.page = 1;
    show(els.canvas, true);
    show(els.pptx, false);
    show(els.vwrap, false);
    openTheater();
    updateChrome();
    setStatus("Loading deck…");
    var task = typeof src === "string"
      ? pdfjsLib.getDocument(src)
      : pdfjsLib.getDocument({ data: src });
    task.promise.then(function (pdf) {
      state.pdf = pdf;
      state.pages = pdf.numPages;
      updateChrome();
      drawPdfPage();
    }).catch(function (err) {
      setStatus("Could not open this PDF.");
      console.error(err);
    });
  }

  function parsePptx(buffer) {
    if (!window.JSZip) return Promise.reject(new Error("JSZip missing"));
    return JSZip.loadAsync(buffer).then(function (zip) {
      var names = Object.keys(zip.files)
        .filter(function (n) { return /ppt\/slides\/slide\d+\.xml$/i.test(n); })
        .sort(function (a, b) {
          var na = parseInt((a.match(/slide(\d+)/) || [0, 0])[1], 10);
          var nb = parseInt((b.match(/slide(\d+)/) || [0, 0])[1], 10);
          return na - nb;
        });
      return Promise.all(names.map(function (n) {
        return zip.file(n).async("string").then(function (xml) {
          var texts = [];
          xml.replace(/<a:t[^>]*>([^<]*)<\/a:t>/g, function (_, t) {
            t = t.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").trim();
            if (t) texts.push(t);
          });
          return texts.length ? texts : ["(Empty slide)"];
        });
      }));
    });
  }

  function openPptx(buffer, title) {
    state.mode = "pptx";
    state.title = title || "Presentation";
    state.page = 1;
    show(els.canvas, false);
    show(els.pptx, true);
    show(els.vwrap, false);
    openTheater();
    updateChrome();
    setStatus("Reading PowerPoint…");
    parsePptx(buffer).then(function (slides) {
      if (!slides.length) throw new Error("No slides");
      state.pptx = slides;
      state.pages = slides.length;
      updateChrome();
      drawPptx();
    }).catch(function (err) {
      setStatus("Could not read this PPTX. Export as PDF for a pixel-perfect deck.");
      console.error(err);
    });
  }

  function fmt(t) {
    if (!isFinite(t)) return "0:00";
    var m = Math.floor(t / 60);
    var s = Math.floor(t % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  function openVideo(src, title) {
    state.mode = "video";
    state.title = title || "Film";
    state.pages = 0;
    show(els.canvas, false);
    show(els.pptx, false);
    show(els.vwrap, true);
    openTheater();
    updateChrome();
    setStatus("");
    els.video.src = src;
    els.video.play().catch(function () {});
  }

  els.close.addEventListener("click", closeTheater);
  els.prev.addEventListener("click", function () { go(state.page - 1); });
  els.next.addEventListener("click", function () { go(state.page + 1); });
  els.fs.addEventListener("click", function () {
    if (!document.fullscreenElement) theater.requestFullscreen().catch(function () {});
    else document.exitFullscreen().catch(function () {});
  });

  document.addEventListener("keydown", function (e) {
    if (theater.hidden) return;
    if (e.key === "Escape") closeTheater();
    if (state.mode === "video") {
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      return;
    }
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(state.page + 1); }
    if (e.key === "ArrowLeft") go(state.page - 1);
    if (e.key === "Home") go(1);
    if (e.key === "End") go(state.pages);
  });

  window.addEventListener("resize", function () {
    if (state.mode === "pdf" && state.pdf) drawPdfPage();
  });

  function togglePlay() {
    if (els.video.paused) els.video.play();
    else els.video.pause();
  }
  els.play.addEventListener("click", togglePlay);
  els.video.addEventListener("play", function () { els.play.textContent = "Pause"; });
  els.video.addEventListener("pause", function () { els.play.textContent = "Play"; });
  els.video.addEventListener("timeupdate", function () {
    var d = els.video.duration || 0;
    var t = els.video.currentTime || 0;
    if (d) els.seek.value = String(Math.round((t / d) * 1000));
    els.time.textContent = fmt(t) + " / " + fmt(d);
  });
  els.seek.addEventListener("input", function () {
    var d = els.video.duration || 0;
    els.video.currentTime = (Number(els.seek.value) / 1000) * d;
  });
  els.vol.addEventListener("input", function () {
    els.video.volume = Number(els.vol.value);
  });

  function readFile(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(r.result); };
      r.onerror = rej;
      r.readAsArrayBuffer(file);
    });
  }

  function handleDeckFile(file) {
    if (!file) return;
    var name = file.name || "Deck";
    var ext = name.split(".").pop().toLowerCase();
    if (ext === "pdf") {
      readFile(file).then(function (buf) { openPdf(new Uint8Array(buf), name); });
    } else if (ext === "pptx" || ext === "ppt") {
      if (ext === "ppt") {
        openTheater();
        show(els.canvas, false); show(els.pptx, true); show(els.vwrap, false);
        els.pptx.innerHTML = "<h2>Legacy .ppt</h2><p>Save as .pptx or export a PDF, then drop that file.</p>";
        state.mode = "pptx"; state.title = name; state.pages = 1; state.page = 1; updateChrome();
        return;
      }
      readFile(file).then(function (buf) { openPptx(buf, name); });
    }
  }

  function handleVideoFile(file) {
    if (!file) return;
    var url = URL.createObjectURL(file);
    openVideo(url, file.name);
  }

  function bindDrop(zone, input, handler) {
    if (!zone || !input) return;
    zone.addEventListener("click", function () { input.click(); });
    input.addEventListener("change", function () {
      if (input.files && input.files[0]) handler(input.files[0]);
      input.value = "";
    });
    ["dragenter", "dragover"].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add("over"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove("over"); });
    });
    zone.addEventListener("drop", function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handler(f);
    });
  }

  bindDrop(document.getElementById("deckDrop"), document.getElementById("deckFile"), handleDeckFile);
  bindDrop(document.getElementById("videoDrop"), document.getElementById("videoFile"), handleVideoFile);

  window.KKTheater = {
    openPdf: openPdf,
    openPptxFromUrl: function (url, title) {
      fetch(url).then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
        openPptx(buf, title);
      }).catch(function () { setStatus("Could not load that deck."); openTheater(); });
    },
    openVideo: openVideo,
    close: closeTheater,
  };
})();
