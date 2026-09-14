# Skye Journey!

Hiya! This is the repository of my personal website, [luvrksknskyejourney.org](https://luvrksknskyejourney.org/).

Skye Journey is my little corner of the internet. It's part digital journal, part creative playground, and part archive of the things I love: space, music, games, my cats, drawing, and way too many late nights writing code. It started on Neocities, moved to GitHub Pages, and has been growing (and breaking, and getting fixed again) ever since.

It's not a product and it was never meant to be one. It's a home for me.

## Feel free to take code

Yes, really. If you find something here you like, a music player, a menu, an animation, a layout, take it and make it yours. That's the whole reason the source is public. Credit is appreciated but not required, and if you build something cool with it I'd honestly love to see it.

Just one thing to keep in mind: the **code** is mine to share, but not every **asset** is. Some icons, sprites, sound effects, fonts and wallpapers come from games and other artists (Honkai: Star Rail, Genshin Impact, Wuthering Waves and more). Those belong to their owners, so please don't reuse them as if they were free to take. Everything is listed on the [credits page](https://luvrksknskyejourney.org/filesystem/credits/index.html). This is a non-profit personal project, and if something of yours is here and you want it removed, just tell me and I'll take it down.

## What's inside

- **Home** is the main hub, with the navigation, updates and the webrings I'm part of.
- **Filesystem** holds the "about the site" stuff: about, blogs, changelog, credits, resources, sitemap, social, support and my workstation.
- **Personal** is the heart of it: about me, journal, music, gallery, friends, guestbook, FAQ, safe space, special events and my boyfriend diary.
- **Stellar Hunter** is a small encyclopedia of stars and characters like a little a mini videogame for the site, with its own progress system.

## How it's built

Plain HTML, CSS and JavaScript. No frameworks, no bundler, no package.json, no build step. Every file you see is exactly what the browser gets, so you can open any of them and learn from it (or laugh at it, that's fine too). A few libraries are loaded from CDNs, pinned to exact versions with integrity hashes.

The folder structure looks like this:

```
index.html              the landing page (press enter to continue)
assets/                 everything shared across the site
  css/                  design tokens, fonts, nav bar, stars, music player
  js/                   shared modules (nav bar, audio, stars, tooltip...)
  images/ audio/ video/ fonts/
home/                   the main hub
filesystem/<section>/   about, blogs, credits, resources...
personal/<section>/     about-me, journal, gallery, music...
stellar-hunter/         the encyclopedia
workers/now-playing/    the small backend for the live music and echo wall
```

Every section follows the same pattern: its `index.html` next to `css/`, `js/`, `data/` and `assets/`. Shared files use root paths like `/assets/...`, and anything that only belongs to one section stays inside that section.

The about-me page has a live "now playing" feed from Last.fm, a listening clock and an echo wall where visitors can leave notes. That part runs on a tiny Cloudflare Worker in `workers/now-playing/`. None of its keys live in this repo, they're stored as secrets on Cloudflare. I might be a little paranoid about data security lol, so the wall has captcha, rate limits, moderation and doesn't store anyone's IP.

## Running it locally

Since the site uses root paths, open it through a local server from the project root instead of double clicking the files:

```
python -m http.server 8765
```

Then visit `http://localhost:8765`. VS Code's Live Server works too.

## A small note

This project has been in development for a long time and it has gone through a lot of changes and improvements. It's not perfect, some pages are still unfinished, and you'll probably find old code sitting next to new code. I'm still learning (backend especially, I'm really bad at it), so if you spot a bug or something that could be better, I'm happy to hear it.

## Contact

- E-mail: [luvrksnskyedev@icloud.com](mailto:luvrksnskyedev@icloud.com)
- Discord: luvrksnskyedev
- GitHub: [@luvrksnskye](https://github.com/luvrksnskye)
- Or leave a message on the [guestbook](https://luvrksknskyejourney.org/personal/guestbook/index.html)

Thank you for stopping by, and happy coding!

Made with love and probably too much caffeine cuz I didn't sleep again.
