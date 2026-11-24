# SkillSwap — Trade skills, learn together

A free community skill-exchange board for students, built for the
[Peninsula Innovation Hackathon](https://peninsula-innovation-hackathon.devpost.com/).

**Live:** https://devilking7x.github.io/skillswap/

## What it does

- Post **one skill you can teach** and **one skill you want to learn**.
- Browse and filter the board by search, category, and mode (online / in person).
- Click **“Find matches”** on any post:
  - 🤝 **Mutual match** — you can teach each other (a fair swap).
  - One-way match — they can teach you what you want to learn.
- Delete your own posts any time.

## Privacy by design

- **No accounts, no server, no tracking.** Your posts live only in your own
  browser (localStorage).
- The board ships with **6 clearly labelled sample posts** (marked “Sample”)
  so a first-time visitor can see how matching works. Remove them with one
  click; restore them with another. They are not real people.

## Run it

Just open `index.html` — plain HTML/CSS/JS, no build step, no dependencies,
works offline once loaded.

## Tests

```bash
node --test tests/logic.test.js   # 11 unit tests for the matching/filter logic
node tests/smoke.test.mjs        # Playwright smoke test (7 checks, local server)
```

## Built with

HTML, CSS, vanilla JavaScript. No frameworks, no backend.

## License

MIT — see `LICENSE`.
