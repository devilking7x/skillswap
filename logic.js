// SkillSwap — core logic (pure functions, no DOM, no storage).
// Shared by the browser app (app.js) and the Node test suite.
// Works in both: browser loads it as a classic script, Node requires it.

(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.SkillSwap = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var CATEGORIES = [
    "Language",
    "Coding",
    "Music",
    "Art & Design",
    "Academics",
    "Sports & Fitness",
    "Cooking",
    "Other",
  ];

  var MODES = ["Online", "In person", "Either"];

  function norm(s) {
    return String(s == null ? "" : s)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  // Two skills match if one contains the other (after normalising),
  // so "excel" matches "Basic Excel" and "hindi" matches "spoken hindi".
  function skillMatches(a, b) {
    var x = norm(a);
    var y = norm(b);
    if (!x || !y) return false;
    return x === y || x.indexOf(y) !== -1 || y.indexOf(x) !== -1;
  }

  function validatePost(p) {
    var errors = [];
    if (!p || typeof p !== "object") return ["Post is missing."];
    if (!norm(p.name)) errors.push("Please add a name or nickname.");
    if (!norm(p.teach)) errors.push("Please say what you can teach.");
    if (!norm(p.learn)) errors.push("Please say what you want to learn.");
    if (norm(p.teach).length > 80) errors.push("Teach skill must be 80 characters or fewer.");
    if (norm(p.learn).length > 80) errors.push("Learn skill must be 80 characters or fewer.");
    if (p.category && CATEGORIES.indexOf(p.category) === -1)
      errors.push("Unknown category.");
    if (p.mode && MODES.indexOf(p.mode) === -1) errors.push("Unknown mode.");
    if (p.note && String(p.note).length > 200)
      errors.push("Note must be 200 characters or fewer.");
    return errors;
  }

  // One-way: posts whose TEACH skill matches what `want` asks for.
  function findTeachers(posts, want, excludeId) {
    return (posts || []).filter(function (p) {
      return p.id !== excludeId && skillMatches(p.teach, want);
    });
  }

  // Mutual swap: A teaches what B wants AND B teaches what A wants.
  function findMutualMatches(posts, mine) {
    return (posts || []).filter(function (p) {
      if (p.id === mine.id) return false;
      return skillMatches(p.teach, mine.learn) && skillMatches(p.learn, mine.teach);
    });
  }

  // For a given post, everyone on the board who could swap with them.
  function matchSummary(posts, mine) {
    var mutual = findMutualMatches(posts, mine);
    var teachers = findTeachers(posts, mine.learn, mine.id).filter(function (p) {
      return mutual.indexOf(p) === -1;
    });
    return { mutual: mutual, oneWay: teachers };
  }

  function filterPosts(posts, opts) {
    opts = opts || {};
    var q = norm(opts.query);
    var cat = opts.category || "All";
    var mode = opts.mode || "All";
    var onlySamples = opts.onlySamples;
    return (posts || []).filter(function (p) {
      if (cat !== "All" && p.category !== cat) return false;
      if (mode !== "All" && p.mode !== mode && p.mode !== "Either") return false;
      if (onlySamples === true && !p.sample) return false;
      if (onlySamples === false && p.sample) return false;
      if (q) {
        var hay = [p.name, p.teach, p.learn, p.note, p.category].join(" ");
        if (norm(hay).indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function countByCategory(posts) {
    var counts = {};
    CATEGORIES.forEach(function (c) {
      counts[c] = 0;
    });
    (posts || []).forEach(function (p) {
      if (counts[p.category] !== undefined) counts[p.category] += 1;
      else counts[p.category] = 1;
    });
    return counts;
  }

  return {
    CATEGORIES: CATEGORIES,
    MODES: MODES,
    norm: norm,
    skillMatches: skillMatches,
    validatePost: validatePost,
    findTeachers: findTeachers,
    findMutualMatches: findMutualMatches,
    matchSummary: matchSummary,
    filterPosts: filterPosts,
    countByCategory: countByCategory,
  };
});
