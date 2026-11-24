// SkillSwap — browser app. All data in localStorage; no server, no tracking.
(function () {
  "use strict";
  var LS = window.SkillSwap;
  var STORE_KEY = "skillswap.posts.v1";
  var SHOW_SAMPLES_KEY = "skillswap.showSamples.v1";

  // Clearly labelled sample posts — NOT real people. Shown by default so a
  // first-time visitor can see how matching works.
  var SAMPLE_POSTS = [
    { id: "sample-1", sample: true, name: "Asha (sample)", category: "Academics", teach: "Basic Excel", learn: "Spoken English", mode: "Online", contact: "—", note: "Free after 5 pm on weekdays." },
    { id: "sample-2", sample: true, name: "Rohan (sample)", category: "Language", teach: "Spoken English", learn: "Basic Excel", mode: "Online", contact: "—", note: "Happy to practise on video call." },
    { id: "sample-3", sample: true, name: "Meera (sample)", category: "Music", teach: "Guitar basics", learn: "Hindi songs on harmonium", mode: "In person", contact: "—", note: "Shirur area, weekends." },
    { id: "sample-4", sample: true, name: "Kabir (sample)", category: "Coding", teach: "Python basics", learn: "Web design (HTML/CSS)", mode: "Either", contact: "—", note: "College student, learning by doing." },
    { id: "sample-5", sample: true, name: "Anaya (sample)", category: "Art & Design", teach: "Sketching & doodling", learn: "Video editing", mode: "Online", contact: "—", note: "Can share reference sheets." },
    { id: "sample-6", sample: true, name: "Dev (sample)", category: "Sports & Fitness", teach: "Yoga for beginners", learn: "Chess strategy", mode: "In person", contact: "—", note: "Morning sessions work best." },
  ];

  function loadMine() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }
  function saveMine(posts) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(posts)); } catch (e) { /* storage full/blocked */ }
  }
  function showSamples() {
    try { return localStorage.getItem(SHOW_SAMPLES_KEY) !== "0"; } catch (e) { return true; }
  }
  function setShowSamples(v) {
    try { localStorage.setItem(SHOW_SAMPLES_KEY, v ? "1" : "0"); } catch (e) { /* ignore */ }
  }
  function allPosts() {
    var mine = loadMine();
    return showSamples() ? SAMPLE_POSTS.concat(mine) : mine;
  }
  function uid() {
    return "u-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var $ = function (id) { return document.getElementById(id); };
  var boardEl = $("board");
  var emptyEl = $("empty-state");
  var countEl = $("board-count");
  var matchEl = $("match-results");

  function fillSelect(el, items, first) {
    el.innerHTML = "";
    if (first) {
      var o0 = document.createElement("option");
      o0.textContent = first;
      el.appendChild(o0);
    }
    items.forEach(function (it) {
      var o = document.createElement("option");
      o.textContent = it;
      el.appendChild(o);
    });
  }

  function currentFilters() {
    return {
      query: $("q").value,
      category: $("q-category").value,
      mode: $("q-mode").value,
      onlySamples: undefined,
    };
  }

  function render() {
    var posts = allPosts();
    var filters = currentFilters();
    var onlyMutual = $("q-mutual").checked;
    var visible = LS.filterPosts(posts, filters);
    if (onlyMutual) {
      visible = visible.filter(function (p) {
        return LS.findMutualMatches(posts, p).length > 0;
      });
    }
    boardEl.innerHTML = "";
    visible.forEach(function (p) { boardEl.appendChild(cardEl(p, posts)); });
    emptyEl.hidden = visible.length > 0;
    var mineCount = loadMine().length;
    countEl.textContent = visible.length + " of " + posts.length + " post" +
      (posts.length === 1 ? "" : "s") + " shown" +
      (mineCount ? " · " + mineCount + " " + (mineCount === 1 ? "is yours" : "are yours") : "");
  }

  function cardEl(p, posts) {
    var li = document.createElement("li");
    li.className = "card" + (p.sample ? "" : " mine");
    var mutual = LS.findMutualMatches(posts, p);
    var badges = "";
    if (p.sample) badges += '<span class="badge sample">Sample</span>';
    else badges += '<span class="badge mine">Your post</span>';
    badges += '<span class="badge">' + esc(p.category) + '</span>';
    badges += '<span class="badge">' + esc(p.mode) + '</span>';
    if (mutual.length) badges += '<span class="badge mutual">🤝 ' + mutual.length + ' mutual match' + (mutual.length > 1 ? "es" : "") + '</span>';

    li.innerHTML =
      '<div class="card-head"><h3>' + esc(p.name) + '</h3>' + badges + '</div>' +
      '<div class="swap"><span class="skill">💡 ' + esc(p.teach) + '</span><span class="arrow">⇄</span><span class="skill">🎯 ' + esc(p.learn) + '</span></div>' +
      (p.note ? "<p>" + esc(p.note) + "</p>" : "") +
      '<p class="meta">Contact: ' + esc(p.contact || "—") + '</p>' +
      '<div class="card-actions">' +
        '<button type="button" class="btn small" data-find="' + esc(p.id) + '">Find matches</button>' +
        (p.sample ? "" : '<button type="button" class="btn small danger" data-del="' + esc(p.id) + '">Delete</button>') +
      "</div>";
    return li;
  }

  function showMatches(mine) {
    var posts = allPosts();
    var s = LS.matchSummary(posts, mine);
    var html = "<h3>Matches for “" + esc(mine.teach) + " ⇄ " + esc(mine.learn) + "”</h3>";
    if (s.mutual.length) {
      html += "<p><strong>🤝 Mutual matches (" + s.mutual.length + "):</strong> you can teach each other.</p><ul>";
      s.mutual.forEach(function (p) {
        html += "<li><strong>" + esc(p.name) + "</strong> — teaches <em>" + esc(p.teach) + "</em>, wants <em>" + esc(p.learn) + "</em> (" + esc(p.mode) + (p.sample ? ", sample" : "") + ")</li>";
      });
      html += "</ul>";
    } else {
      html += "<p>No mutual match yet — nobody on the board wants exactly what you teach <em>and</em> teaches what you want. Try a one-way match below, or check back later.</p>";
    }
    if (s.oneWay.length) {
      html += "<p><strong>One-way (" + s.oneWay.length + "):</strong> they can teach you “" + esc(mine.learn) + "”.</p><ul>";
      s.oneWay.forEach(function (p) {
        html += "<li><strong>" + esc(p.name) + "</strong> — teaches <em>" + esc(p.teach) + "</em>, wants <em>" + esc(p.learn) + "</em> (" + esc(p.mode) + (p.sample ? ", sample" : "") + ")</li>";
      });
      html += "</ul>";
    }
    matchEl.innerHTML = html;
    matchEl.hidden = false;
    matchEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Form submit
  $("post-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var post = {
      id: uid(),
      sample: false,
      name: $("f-name").value.trim(),
      category: $("f-category").value,
      teach: $("f-teach").value.trim(),
      learn: $("f-learn").value.trim(),
      mode: $("f-mode").value,
      contact: $("f-contact").value.trim(),
      note: $("f-note").value.trim(),
    };
    var errors = LS.validatePost(post);
    var errEl = $("form-errors");
    if (errors.length) {
      errEl.textContent = errors.join(" ");
      errEl.hidden = false;
      return;
    }
    errEl.hidden = true;
    var mine = loadMine();
    mine.push(post);
    saveMine(mine);
    ev.target.reset();
    matchEl.hidden = true;
    render();
    showMatches(post);
  });

  // Board clicks (delegated)
  boardEl.addEventListener("click", function (ev) {
    var btn = ev.target.closest("button");
    if (!btn) return;
    var findId = btn.getAttribute("data-find");
    var delId = btn.getAttribute("data-del");
    if (findId) {
      var p = allPosts().filter(function (x) { return x.id === findId; })[0];
      if (p) showMatches(p);
    } else if (delId) {
      if (window.confirm("Delete this post?")) {
        saveMine(loadMine().filter(function (x) { return x.id !== delId; }));
        matchEl.hidden = true;
        render();
      }
    }
  });

  // Filters
  ["q", "q-category", "q-mode", "q-mutual"].forEach(function (id) {
    $(id).addEventListener("input", function () { matchEl.hidden = true; render(); });
    $(id).addEventListener("change", function () { matchEl.hidden = true; render(); });
  });

  $("btn-samples").addEventListener("click", function () {
    setShowSamples(true); matchEl.hidden = true; render();
  });
  $("btn-clear-samples").addEventListener("click", function () {
    setShowSamples(false); matchEl.hidden = true; render();
  });
  $("btn-clear-mine").addEventListener("click", function () {
    if (window.confirm("Delete ALL your posts from this browser?")) {
      saveMine([]); matchEl.hidden = true; render();
    }
  });

  fillSelect($("f-category"), LS.CATEGORIES);
  fillSelect($("f-mode"), LS.MODES);
  fillSelect($("q-category"), LS.CATEGORIES, "All");
  render();
})();
