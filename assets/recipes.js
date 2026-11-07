(function () {
  "use strict";

  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }
  function copy(text, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, function () { fallback(text, okMsg); });
    } else fallback(text, okMsg);
  }
  function fallback(text, okMsg) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast(okMsg); } catch (e) { toast("Couldn't copy. Select the text and copy it yourself."); }
    document.body.removeChild(ta);
  }

  /* ---------- quantities ---------- */
  var UNI = { "½": .5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": .25, "¾": .75, "⅛": .125, "⅜": .375, "⅝": .625, "⅞": .875 };
  var PATTERNS = [
    [/^\s*(\d+)\s+(\d+)\s*\/\s*(\d+)/, function (m) { return (+m[1]) + (+m[2]) / (+m[3]); }],
    [/^\s*(\d+)\s*\/\s*(\d+)/, function (m) { return (+m[1]) / (+m[2]); }],
    [/^\s*(\d+)\s*([½⅓⅔¼¾⅛⅜⅝⅞])/, function (m) { return (+m[1]) + UNI[m[2]]; }],
    [/^\s*([½⅓⅔¼¾⅛⅜⅝⅞])/, function (m) { return UNI[m[1]]; }],
    [/^\s*(\d*\.\d+|\d+)/, function (m) { return +m[1]; }]
  ];
  function parseLead(str) {
    for (var i = 0; i < PATTERNS.length; i++) {
      var m = str.match(PATTERNS[i][0]);
      if (m) {
        var v = PATTERNS[i][1](m);
        return (isFinite(v) && v > 0) ? { value: v, raw: m[0], rest: str.slice(m[0].length) } : null;
      }
    }
    return null;
  }
  function fmtQty(v) {
    if (v >= 10) return String(Math.round(v));
    var whole = Math.floor(v), frac = v - whole;
    var opts = [[0, ""], [.125, "⅛"], [.25, "¼"], [1 / 3, "⅓"], [.375, "⅜"], [.5, "½"], [.625, "⅝"], [2 / 3, "⅔"], [.75, "¾"], [.875, "⅞"], [1, ""]];
    var best = opts[0], d = 9;
    opts.forEach(function (o) { var dd = Math.abs(frac - o[0]); if (dd < d) { d = dd; best = o; } });
    if (d > .04) return String(Math.round(v * 100) / 100);
    var w = best[0] === 1 ? whole + 1 : whole;
    if (!best[1]) return String(w);
    return (w ? w : "") + best[1];
  }
  window.RecipeQty = { parseLead: parseLead, fmtQty: fmtQty };

  /* ---------- home page: search and filter ---------- */
  var grid = document.getElementById("grid");
  if (grid) {
    var q = document.getElementById("q");
    var chips = document.querySelectorAll("#chips .chip");
    var nomatch = document.getElementById("nomatch");
    var filter = "all";
    var apply = function () {
      var words = (q.value || "").toLowerCase().trim().split(/\s+/).filter(Boolean);
      var shown = 0;
      grid.querySelectorAll(".card").forEach(function (c) {
        var hay = c.getAttribute("data-search") || "";
        var ok = (filter === "all" || c.getAttribute("data-cat") === filter) &&
          words.every(function (w) { return hay.indexOf(w) !== -1; });
        c.hidden = !ok;
        if (ok) shown++;
      });
      if (nomatch) nomatch.hidden = shown > 0 || grid.children.length === 0;
    };
    var choose = function (key) {
      var found = null;
      chips.forEach(function (x) { if (x.getAttribute("data-filter") === key) found = x; });
      if (!found) { key = "all"; found = chips[0]; }
      filter = key;
      chips.forEach(function (x) { x.setAttribute("aria-pressed", String(x === found)); });
      apply();
    };
    q.addEventListener("input", apply);
    chips.forEach(function (b) {
      b.addEventListener("click", function () {
        var key = b.getAttribute("data-filter");
        // put the category in the address so the link can be shared, e.g. #ice-cream
        try { history.replaceState(null, "", key === "all" ? location.pathname : "#" + key); } catch (e) {}
        choose(key);
      });
    });
    window.addEventListener("hashchange", function () { choose(location.hash.slice(1) || "all"); });
    if (location.hash.length > 1) choose(location.hash.slice(1));
  }

  /* ---------- recipe page ---------- */
  var recipe = document.getElementById("recipe");
  var body = document.getElementById("recipe-body");
  if (recipe && body) {
    var heads = body.querySelectorAll("h2");
    var ingHead = null;
    heads.forEach(function (h) { if (!ingHead && /^ingredients/i.test(h.textContent.trim())) ingHead = h; });

    var items = [];
    if (ingHead) {
      var panel = document.createElement("section");
      panel.className = "panel";
      var h2 = document.createElement("h2");
      h2.textContent = ingHead.textContent;
      var scale = document.createElement("div");
      scale.className = "scale"; scale.setAttribute("role", "group"); scale.setAttribute("aria-label", "Batch size");
      h2.appendChild(scale);
      panel.appendChild(h2);

      // move everything between "Ingredients" and the next h2 into the panel
      var n = ingHead.nextElementSibling;
      while (n && n.tagName !== "H2") {
        var next = n.nextElementSibling;
        panel.appendChild(n);
        n = next;
      }
      ingHead.remove();

      panel.querySelectorAll("ul").forEach(function (ul) { ul.classList.add("ing"); });
      panel.querySelectorAll("h3, p").forEach(function (el) {
        if (/:\s*$/.test(el.textContent)) el.outerHTML = '<ul class="ing"><li class="sub">' + el.textContent.replace(/:\s*$/, "") + "</li></ul>";
      });

      panel.querySelectorAll("ul.ing > li:not(.sub)").forEach(function (li, i) {
        // find the first text in the line, which is where the amount goes
        var walker = document.createTreeWalker(li, NodeFilter.SHOW_TEXT, null);
        var first = walker.nextNode();
        while (first && !first.nodeValue.trim()) first = walker.nextNode();
        var label = document.createElement("label");
        var cb = document.createElement("input");
        cb.type = "checkbox"; cb.id = "ing-" + i;
        label.htmlFor = cb.id;
        var span = document.createElement("span");
        while (li.firstChild) span.appendChild(li.firstChild);
        if (first) {
          var p = parseLead(first.nodeValue);
          if (p) {
            var qty = document.createElement("span");
            qty.className = "qty";
            qty.textContent = p.raw.trim();
            first.nodeValue = p.rest;
            first.parentNode.insertBefore(qty, first);
            first.parentNode.insertBefore(document.createTextNode(""), first);
            items.push({ el: qty, base: p.value, raw: p.raw.trim() });
          }
        }
        label.appendChild(cb); label.appendChild(span);
        li.appendChild(label);
      });

      var note = document.createElement("p");
      note.className = "note"; note.hidden = true;
      panel.appendChild(note);

      [[.5, "½×"], [1, "1×"], [2, "2×"], [3, "3×"]].forEach(function (pair) {
        var b = document.createElement("button");
        b.type = "button"; b.textContent = pair[1];
        b.setAttribute("aria-pressed", String(pair[0] === 1));
        b.addEventListener("click", function () {
          scale.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          items.forEach(function (it) { it.el.textContent = pair[0] === 1 ? it.raw : fmtQty(it.base * pair[0]); });
          note.hidden = pair[0] === 1;
          note.textContent = "Amounts shown for a " + (pair[0] === .5 ? "half" : pair[0] + "×") + " batch. Make sure your pan, pot or bowl is big enough.";
        });
        scale.appendChild(b);
      });

      recipe.insertBefore(panel, body);
      recipe.classList.add("enhanced");
    }

    var link = document.getElementById("copy-link");
    if (link) link.addEventListener("click", function () { copy(location.href, "Link copied. Paste it in a text or email."); });
    var txt = document.getElementById("copy-text");
    if (txt) txt.addEventListener("click", function () {
      var parts = [];
      var head = recipe.querySelector(".recipe-head");
      ["h1", ".kitchen", ".blurb"].forEach(function (sel) { var e = head.querySelector(sel); if (e) parts.push(e.textContent.trim()); });
      var stats = [].map.call(head.querySelectorAll(".stat"), function (s) { return s.querySelector("span").textContent + " " + s.querySelector("b").textContent; });
      if (stats.length) parts.push(stats.join(" · "));
      var panelEl = recipe.querySelector(".panel");
      if (panelEl) {
        parts.push("INGREDIENTS");
        panelEl.querySelectorAll("ul.ing > li").forEach(function (li) {
          parts.push(li.classList.contains("sub") ? "\n" + li.textContent.trim() + ":" : "• " + li.textContent.replace(/\s+/g, " ").trim());
        });
      }
      parts.push(body.innerText.trim());
      copy(parts.join("\n\n").replace(/\n{3,}/g, "\n\n"), "Recipe copied. Paste it anywhere.");
    });
  }
})();
