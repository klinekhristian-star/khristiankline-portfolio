/* Theater: PDF slideshow, visual PPTX, hosted / dropped MP4 */
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
    return {
      mode: null,
      title: "",
      pdf: null,
      page: 1,
      pages: 0,
      pptx: [],
      sourceUrl: "",
    };
  }

  function show(el, on) {
    if (el) el.hidden = !on;
  }

  function setStatus(msg) {
    els.status.textContent = msg || "";
  }

  function revokeBlobs() {
    blobs.forEach(function (u) {
      try { URL.revokeObjectURL(u); } catch (e) {}
    });
    blobs = [];
  }

  function rememberBlob(u) {
    if (u) blobs.push(u);
    return u;
  }

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

  function renderDots() {
    els.dots.innerHTML = "";
    if (state.mode === "video" || state.mode === "office" || state.pages < 2) return;
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
    var kind = "Deck";
    if (state.mode === "video") kind = "Film";
    else if (state.mode === "office") kind = "PowerPoint";
    else if (state.mode === "pptx") kind = "PowerPoint";
    else if (state.mode === "pdf") kind = "PDF";
    els.kind.textContent = kind;
    els.title.textContent = state.title || "—";
    if (state.mode === "video" || state.mode === "office") {
      els.count.textContent = "";
      navVisible(false);
    } else {
      els.count.textContent = state.pages ? state.page + " / " + state.pages : "";
      navVisible(true);
    }
    if (els.original) {
      els.original.hidden = !(state.sourceUrl && /\.pptx?($|\?)/i.test(state.sourceUrl));
    }
    renderDots();
  }

  function prefersReduced() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function flashHint() {
    if (!els.hint) return;
    try {
      if (sessionStorage.getItem("kk-gestures")) return;
      sessionStorage.setItem("kk-gestures", "1");
    } catch (e) {}
    els.hint.hidden = false;
    requestAnimationFrame(function () { els.hint.classList.add("show"); });
    setTimeout(function () { els.hint.classList.remove("show"); }, 3400);
  }

  function resetTrack(animate) {
    if (!els.track) return;
    els.track.classList.toggle("is-settling", !!animate);
    els.track.classList.remove("is-dragging");
    els.track.style.transform = "translate3d(0,0,0)";
    els.track.style.opacity = "1";
  }

  function moveTrack(x, y, animate) {
    if (!els.track) return;
    els.track.classList.toggle("is-settling", !!animate);
    els.track.classList.toggle("is-dragging", !animate);
    els.track.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    var fade = y > 8 ? Math.max(0.28, 1 - y / 420) : 1;
    els.track.style.opacity = String(fade);
  }

  function paintPage() {
    if (state.mode === "pdf") drawPdfPage();
    else if (state.mode === "pptx") drawPptx();
    updateChrome();
  }

  function go(n, how) {
    if (!state.pages) return;
    n = Math.max(1, Math.min(state.pages, n));
    var dir = n > state.page ? 1 : n < state.page ? -1 : 0;
    if (!dir) return;
    if (how === "animate" && !prefersReduced() && els.track) {
      var w = els.stage.clientWidth || 320;
      moveTrack(-dir * w, 0, true);
      setTimeout(function () {
        state.page = n;
        paintPage();
        moveTrack(dir * w * 0.28, 0, false);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { resetTrack(true); });
        });
      }, 260);
      return;
    }
    state.page = n;
    paintPage();
    resetTrack(false);
  }

  function drawPdfPage() {
    if (!state.pdf) return;
    setStatus("Rendering…");
    state.pdf.getPage(state.page).then(function (page) {
      var unscaled = page.getViewport({ scale: 1 });
      var maxW = Math.max(els.stage.clientWidth - 24, 160);
      var maxH = Math.max(els.stage.clientHeight - 24, 120);
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

  function decodeXml(t) {
    return String(t)
      .replace(/&#x([0-9a-fA-F]+);/g, function (_, h) { return String.fromCharCode(parseInt(h, 16)); })
      .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(+n); })
      .replace(/&(amp|lt|gt|quot|apos);/g, function (_, n) {
        return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[n];
      })
      .trim();
  }

  function parseRels(xml) {
    var map = {};
    if (!xml) return map;
    xml.replace(/<Relationship\b([^>]+)\/>/g, function (_, attrs) {
      var id = (attrs.match(/\bId="([^"]+)"/) || [])[1];
      var target = (attrs.match(/\bTarget="([^"]+)"/) || [])[1];
      if (id && target) map[id] = target.replace(/^\.\.\//, "ppt/");
    });
    return map;
  }

  function parseSlide(xml, rels, mediaUrls) {
    var bg = "";
    var bgChunk = (xml.match(/<p:bg[\s\S]*?<\/p:bg>/) || [])[0] || "";
    var hex = (bgChunk.match(/srgbClr[^>]*val="([0-9A-Fa-f]{6})"/) || [])[1];
    if (hex) bg = "#" + hex;

    var images = [];
    xml.replace(/<p:pic[\s\S]*?<\/p:pic>/g, function (pic) {
      var rid = (pic.match(/r:embed="(rId[^"]+)"/) || [])[1];
      if (rid && rels[rid] && mediaUrls[rels[rid]]) images.push(mediaUrls[rels[rid]]);
    });

    var title = "";
    var body = [];
    var blocks = [];
    xml.replace(/<p:sp[\s\S]*?<\/p:sp>/g, function (sp) {
      var ph = (sp.match(/<p:ph[^>]*type="([^"]+)"/) || [])[1] || "";
      var maxSz = 0;
      var texts = [];
      sp.replace(/<a:r[\s\S]*?<\/a:r>/g, function (run) {
        var sz = parseInt((run.match(/sz="(\d+)"/) || [])[1] || "0", 10);
        if (sz > maxSz) maxSz = sz;
        run.replace(/<a:t[^>]*>([^<]*)<\/a:t>/g, function (_, t) {
          t = decodeXml(t);
          if (t) texts.push(t);
        });
      });
      if (!texts.length) {
        sp.replace(/<a:t[^>]*>([^<]*)<\/a:t>/g, function (_, t) {
          t = decodeXml(t);
          if (t) texts.push(t);
        });
      }
      if (texts.length) blocks.push({ ph: ph, sz: maxSz, texts: texts });
    });

    blocks.sort(function (a, b) { return b.sz - a.sz; });
    blocks.forEach(function (b) {
      var isTitle = /title|ctrTitle/i.test(b.ph) || (!title && b.sz >= 2800);
      if (isTitle && !title) title = b.texts.join(" ");
      else body = body.concat(b.texts);
    });

    if (!title && body.length) title = body.shift();
    return {
      bg: bg || "#0c0c0c",
      title: title || "",
      body: body,
      images: images,
    };
  }

  function drawPptx() {
    var slide = state.pptx[state.page - 1] || { bg: "#0c0c0c", title: "", body: [], images: [] };
    els.pptx.innerHTML = "";
    els.pptx.style.background = slide.bg;
    if (slide.images[0]) {
      var img = document.createElement("img");
      img.className = "pptx-art";
      img.alt = "";
      img.src = slide.images[0];
      els.pptx.appendChild(img);
    }
    var copy = document.createElement("div");
    copy.className = "pptx-copy";
    if (slide.title) {
      var h = document.createElement("h2");
      h.textContent = slide.title;
      copy.appendChild(h);
    }
    slide.body.forEach(function (line) {
      var p = document.createElement("p");
      p.textContent = line;
      copy.appendChild(p);
    });
    els.pptx.appendChild(copy);
    setStatus("");
  }

  function resetStage(which) {
    show(els.canvas, which === "pdf");
    show(els.pptx, which === "pptx");
    show(els.vwrap, which === "video");
    show(els.office, which === "office");
  }

  function openPdf(src, title) {
    if (!pdfjsLib) {
      setStatus("PDF engine failed to load.");
      openTheater();
      return;
    }
    state.mode = "pdf";
    state.title = title || "Presentation";
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

      var mediaFiles = Object.keys(zip.files).filter(function (n) {
        return /^ppt\/media\//i.test(n) && !zip.files[n].dir;
      });

      return Promise.all(mediaFiles.map(function (n) {
        return zip.file(n).async("blob").then(function (blob) {
          return { path: n, url: rememberBlob(URL.createObjectURL(blob)) };
        });
      })).then(function (media) {
        var mediaUrls = {};
        media.forEach(function (m) { mediaUrls[m.path] = m.url; });

        return Promise.all(names.map(function (n) {
          var relName = n.replace(/slides\/(slide\d+\.xml)$/i, "slides/_rels/$1.rels");
          var relFile = zip.file(relName);
          var relP = relFile ? relFile.async("string") : Promise.resolve("");
          return Promise.all([zip.file(n).async("string"), relP]).then(function (pair) {
            return parseSlide(pair[0], parseRels(pair[1]), mediaUrls);
          });
        }));
      });
    });
  }

  function openPptx(buffer, title, sourceUrl) {
    state.mode = "pptx";
    state.title = title || "Presentation";
    state.page = 1;
    state.sourceUrl = sourceUrl || "";
    resetStage("pptx");
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

  function openOffice(url, title) {
    if (!els.office || !url) return false;
    state.mode = "office";
    state.title = title || "PowerPoint";
    state.pages = 0;
    state.sourceUrl = url;
    resetStage("office");
    openTheater();
    updateChrome();
    setStatus("");
    els.office.src =
      "https://view.officeapps.live.com/op/embed.aspx?src=" + encodeURIComponent(url);
    return true;
  }

  function fmt(t) {
    if (!isFinite(t)) return "0:00";
    var m = Math.floor(t / 60);
    var s = Math.floor(t % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  function openVideo(src, title, poster) {
    state.mode = "video";
    state.title = title || "Film";
    state.pages = 0;
    state.sourceUrl = typeof src === "string" && src.indexOf("blob:") !== 0 ? src : "";
    resetStage("video");
    openTheater();
    updateChrome();
    setStatus("");
    if (poster) els.video.setAttribute("poster", poster);
    else els.video.removeAttribute("poster");
    els.video.src = src;
    els.video.play().catch(function () {});
  }

  els.close.addEventListener("click", closeTheater);
  els.prev.addEventListener("click", function () { go(state.page - 1, "animate"); });
  els.next.addEventListener("click", function () { go(state.page + 1, "animate"); });
  els.fs.addEventListener("click", function () {
    if (!document.fullscreenElement) theater.requestFullscreen().catch(function () {});
    else document.exitFullscreen().catch(function () {});
  });
  if (els.original) {
    els.original.addEventListener("click", function () {
      if (!state.sourceUrl) return;
      if (state.mode === "office") {
        fetch(state.sourceUrl)
          .then(function (r) { return r.arrayBuffer(); })
          .then(function (buf) { openPptx(buf, state.title, state.sourceUrl); });
      } else {
        openOffice(state.sourceUrl, state.title);
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (theater.hidden) return;
    if (e.key === "Escape") closeTheater();
    if (state.mode === "video") {
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      return;
    }
    if (state.mode === "office") return;
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(state.page + 1, "animate"); }
    if (e.key === "ArrowLeft") go(state.page - 1, "animate");
    if (e.key === "Home") go(1);
    if (e.key === "End") go(state.pages);
  });

  window.addEventListener("resize", function () {
    if (state.mode === "pdf" && state.pdf) drawPdfPage();
  });

  var g = {
    on: false,
    id: 0,
    x0: 0,
    y0: 0,
    t0: 0,
    x: 0,
    y: 0,
    axis: null,
    dragged: false,
    lastTap: 0,
    lastTapX: 0,
    lastTapY: 0,
    playTimer: 0,
  };

  function ignoreFrom(target) {
    if (!target || !target.closest) return false;
    return !!target.closest(".theater-bar, .theater-dots, .v-controls, button, input, a, iframe");
  }

  function canSlide() {
    return state.mode === "pdf" || state.mode === "pptx";
  }

  function finishDrag(e) {
    if (!g.on) return;
    g.on = false;
    try { els.stage.releasePointerCapture(g.id); } catch (err) {}

    var dx = (e.clientX || g.x) - g.x0;
    var dy = (e.clientY || g.y) - g.y0;
    var dt = Math.max(16, Date.now() - g.t0);
    var vx = dx / dt;
    var vy = dy / dt;
    var w = els.stage.clientWidth || 320;
    var h = els.stage.clientHeight || 480;

    if ((g.axis === "y" && dy > Math.max(72, h * 0.12)) || (g.axis === "y" && vy > 0.55 && dy > 36)) {
      moveTrack(0, h, true);
      setTimeout(closeTheater, prefersReduced() ? 0 : 200);
      return;
    }

    if (canSlide() && g.axis === "x") {
      var atStart = state.page <= 1;
      var atEnd = state.page >= state.pages;
      var commitNext = (!atEnd && (dx < -Math.max(48, w * 0.14) || vx < -0.45));
      var commitPrev = (!atStart && (dx > Math.max(48, w * 0.14) || vx > 0.45));
      if (commitNext) {
        moveTrack(-w, 0, true);
        setTimeout(function () {
          state.page += 1;
          paintPage();
          resetTrack(false);
        }, prefersReduced() ? 0 : 240);
        return;
      }
      if (commitPrev) {
        moveTrack(w, 0, true);
        setTimeout(function () {
          state.page -= 1;
          paintPage();
          resetTrack(false);
        }, prefersReduced() ? 0 : 240);
        return;
      }
    }

    resetTrack(true);

    if (!g.dragged && g.axis === null) {
      var now = Date.now();
      var isDouble =
        now - g.lastTap < 300 &&
        Math.abs((e.clientX || 0) - g.lastTapX) < 28 &&
        Math.abs((e.clientY || 0) - g.lastTapY) < 28;
      if (g.playTimer) {
        clearTimeout(g.playTimer);
        g.playTimer = 0;
      }
      if (isDouble) {
        g.lastTap = 0;
        if (!document.fullscreenElement) theater.requestFullscreen().catch(function () {});
        else document.exitFullscreen().catch(function () {});
        return;
      }
      g.lastTap = now;
      g.lastTapX = e.clientX || 0;
      g.lastTapY = e.clientY || 0;
      if (canSlide()) {
        var rect = els.stage.getBoundingClientRect();
        var rel = ((e.clientX || 0) - rect.left) / rect.width;
        if (rel < 0.28) go(state.page - 1, "animate");
        else if (rel > 0.72) go(state.page + 1, "animate");
      } else if (state.mode === "video") {
        g.playTimer = setTimeout(function () {
          g.playTimer = 0;
          togglePlay();
        }, 280);
      }
    }
  }

  els.stage.addEventListener("pointerdown", function (e) {
    if (theater.hidden || state.mode === "office") return;
    if (ignoreFrom(e.target)) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    g.on = true;
    g.id = e.pointerId;
    g.x0 = g.x = e.clientX;
    g.y0 = g.y = e.clientY;
    g.t0 = Date.now();
    g.axis = null;
    g.dragged = false;
    try { els.stage.setPointerCapture(e.pointerId); } catch (err) {}
  });

  els.stage.addEventListener("pointermove", function (e) {
    if (!g.on || e.pointerId !== g.id) return;
    g.x = e.clientX;
    g.y = e.clientY;
    var dx = g.x - g.x0;
    var dy = g.y - g.y0;
    if (!g.axis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      g.axis = Math.abs(dx) > Math.abs(dy) * 1.05 ? "x" : "y";
    }
    if (!g.axis) return;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) g.dragged = true;
    if (g.axis === "x" && canSlide()) {
      e.preventDefault();
      var atStart = state.page <= 1 && dx > 0;
      var atEnd = state.page >= state.pages && dx < 0;
      var x = (atStart || atEnd) ? dx * 0.28 : dx;
      moveTrack(x, 0, false);
    } else if (g.axis === "y" && dy > 0) {
      e.preventDefault();
      moveTrack(0, dy, false);
    }
  });

  els.stage.addEventListener("pointerup", finishDrag);
  els.stage.addEventListener("pointercancel", function (e) {
    if (!g.on) return;
    g.on = false;
    resetTrack(true);
  });

  theater.addEventListener("touchmove", function (e) {
    if (g.on && g.axis) e.preventDefault();
  }, { passive: false });

  function togglePlay() {
    if (els.video.paused) els.video.play();
    else els.video.pause();
  }
  els.play.addEventListener("click", togglePlay);
  els.video.addEventListener("click", function (e) {
    if (g.dragged) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
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
    } else if (ext === "pptx") {
      readFile(file).then(function (buf) { openPptx(buf, name); });
    } else if (ext === "ppt") {
      resetStage("pptx");
      openTheater();
      els.pptx.innerHTML =
        "<div class='pptx-copy'><h2>Legacy .ppt</h2><p>Save as .pptx or export a PDF, then drop that file.</p></div>";
      state.mode = "pptx";
      state.title = name;
      state.pages = 1;
      state.page = 1;
      updateChrome();
    }
  }

  function handleVideoFile(file) {
    if (!file) return;
    openVideo(rememberBlob(URL.createObjectURL(file)), file.name);
  }

  function bindDrop(zone, input, handler) {
    if (!zone || !input) return;
    zone.addEventListener("click", function () { input.click(); });
    input.addEventListener("change", function () {
      if (input.files && input.files[0]) handler(input.files[0]);
      input.value = "";
    });
    ["dragenter", "dragover"].forEach(function (ev) {
      zone.addEventListener(ev, function (e) {
        e.preventDefault();
        zone.classList.add("over");
      });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      zone.addEventListener(ev, function (e) {
        e.preventDefault();
        zone.classList.remove("over");
      });
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
      fetch(url).then(function (r) {
        if (!r.ok) throw new Error("fetch " + r.status);
        return r.arrayBuffer();
      }).then(function (buf) {
        openPptx(buf, title, url);
      }).catch(function () {
        if (!openOffice(url, title)) {
          setStatus("Could not load that deck.");
          openTheater();
        }
      });
    },
    openOffice: openOffice,
    openVideo: openVideo,
    close: closeTheater,
  };
})();
