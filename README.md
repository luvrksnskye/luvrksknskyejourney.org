# Skye Journey!

[English](#english) · [Español](#español)

---

## English

Hiya! This is the repository of my personal website, [luvrksknskyejourney.org](https://luvrksknskyejourney.org/).

Skye Journey is my little corner of the internet. Part digital journal, part creative playground, part archive of the things I love: space, music, games, my cats, drawing, and way too many late nights writing code. It started on Neocities, moved to GitHub Pages, and has been growing (and breaking, and getting fixed again) since September 1, 2023.

It's not a product and it was never meant to be one. It's a home for me.

### Feel free to take code

Yes, really. If you like something here, a music player, a menu, an animation, a layout, take it and make it yours. Credit is appreciated but not required, and if you build something cool with it I'd honestly love to see it.

The **code** is mine to share, but not every **asset** is. Some icons, sprites, sounds, fonts and wallpapers come from games and other artists (Honkai: Star Rail, Genshin Impact, Wuthering Waves and more). Those belong to their owners, so please don't reuse them as if they were free. Everything is listed on the [credits page](https://luvrksknskyejourney.org/filesystem/credits/index.html). If something of yours is here and you want it removed, just tell me.

### What's inside

- **Home**: the main hub, with navigation, updates and webrings.
- **Filesystem**: everything about the site itself. About, blog, changelog, credits, resources, sitemap, social, support and my workstation.
- **Personal**: the heart of it. About me, journal, music, gallery, friends, guestbook, FAQ, safe space, special events and my boyfriend diary.
- **Stellar Hunter**: a small encyclopedia of stars and characters, like a mini videogame inside the site, with its own progress system.

### How it's built

Plain HTML, CSS and JavaScript. No frameworks, no bundler, no package.json, no build step. Every file is exactly what the browser gets, so you can open any of them and learn from it (or laugh at it, that's fine too). A few libraries load from CDNs, pinned to exact versions.

```
index.html              the landing page
assets/                 shared css, js, images, audio, video, fonts
home/                   the main hub
filesystem/<section>/   about, blogs, credits, resources...
personal/<section>/     about-me, journal, gallery, music...
stellar-hunter/         the encyclopedia
workers/now-playing/    the small backend for live music, the echo wall and comments
```

Every section follows the same pattern: its `index.html` next to `css/`, `js/`, `data/` and `assets/`. Shared files use root paths like `/assets/...`.

### The backend

The live "now playing" feed, the listening clock, the echo wall, the visit counter and blog comments run on a tiny Cloudflare Worker in `workers/now-playing/`. No keys live in this repo, they're stored as secrets on Cloudflare. I'm a little paranoid about data security lol, so there's captcha, rate limits, moderation, and nobody's IP gets stored.

### ASTRA

ASTRA is the system behind the station: a private place where I keep my notes, what I study and pieces of memory, all linked together. When a note about science or art is ready, ASTRA checks it and publishes it here as a blog post (those land in `filesystem/blogs/notes/` and `filesystem/astra/data/`). Everything else stays inside.

ASTRA lives in its own private repository. Maybe someday it'll be public. Not yet.

### Running it locally

The site uses root paths, so serve it from the project root instead of double clicking files:

```
python -m http.server 8765
```

Then visit `http://localhost:8765`. VS Code's Live Server works too.

### A small note

This project has gone through a lot of changes. It's not perfect, some pages are unfinished, and you'll find old code next to new code. I'm still learning (backend especially, I'm really bad at it), so if you spot a bug or something that could be better, I'm happy to hear it.

### Contact

- E-mail: [luvrksnskyedev@icloud.com](mailto:luvrksnskyedev@icloud.com)
- Discord: luvrksnskyedev
- GitHub: [@luvrksnskye](https://github.com/luvrksnskye)
- Or leave a message on the [guestbook](https://luvrksknskyejourney.org/personal/guestbook/index.html)

Thank you for stopping by, and happy coding!

---

## Español

¡Holi! Este es el repositorio de mi sitio web personal, [luvrksknskyejourney.org](https://luvrksknskyejourney.org/).

Skye Journey es mi pequeño rincón de internet. Parte diario digital, parte patio de juegos creativo, parte archivo de las cosas que amo: el espacio, la música, los juegos, mis gatos, dibujar y demasiadas noches escribiendo código. Empezó en Neocities, se mudó a GitHub Pages y ha ido creciendo (y rompiéndose, y arreglándose otra vez) desde el 1 de septiembre de 2023.

No es un producto y nunca quiso serlo. Es un hogar para mí.

### Toma el código que quieras

Sí, en serio. Si algo de aquí te gusta, un reproductor, un menú, una animación, un layout, tómalo y hazlo tuyo. Dar crédito se agradece pero no es obligatorio, y si construyes algo bonito con eso me encantaría verlo.

El **código** es mío para compartir, pero no todos los **recursos** lo son. Algunos íconos, sprites, sonidos, fuentes y fondos vienen de juegos y de otros artistas (Honkai: Star Rail, Genshin Impact, Wuthering Waves y más). Pertenecen a sus dueños, así que por favor no los reutilices como si fueran libres. Todo está en la [página de créditos](https://luvrksknskyejourney.org/filesystem/credits/index.html). Si algo tuyo está aquí y quieres que lo quite, solo dime.

### Qué hay adentro

- **Home**: el centro principal, con la navegación, novedades y webrings.
- **Filesystem**: todo sobre el sitio en sí. About, blog, changelog, créditos, recursos, mapa del sitio, redes, apoyo y mi estación de trabajo.
- **Personal**: el corazón. Sobre mí, diario, música, galería, amigos, libro de visitas, FAQ, safe space, eventos especiales y el diario de mi novio.
- **Stellar Hunter**: una pequeña enciclopedia de estrellas y personajes, como un mini videojuego dentro del sitio, con su propio sistema de progreso.

### Cómo está hecho

HTML, CSS y JavaScript puros. Sin frameworks, sin bundler, sin package.json, sin paso de build. Cada archivo es exactamente lo que recibe el navegador. Algunas librerías cargan desde CDNs con versiones fijas. La estructura de carpetas está arriba, en la sección en inglés.

Cada sección sigue el mismo patrón: su `index.html` junto a `css/`, `js/`, `data/` y `assets/`. Lo compartido usa rutas desde la raíz como `/assets/...`.

### El backend

El "now playing" en vivo, el reloj de escucha, el echo wall, el contador de visitas y los comentarios del blog corren en un Cloudflare Worker pequeñito en `workers/now-playing/`. Ninguna clave vive en este repo, están guardadas como secretos en Cloudflare. Soy un poco paranoica con la seguridad lol, así que hay captcha, límites, moderación y no se guarda la IP de nadie.

### ASTRA

ASTRA es el sistema detrás de la estación: un lugar privado donde guardo mis notas, lo que estudio y pedazos de memoria, todo conectado. Cuando una nota de ciencia o arte está lista, ASTRA la revisa y la publica aquí como entrada del blog (terminan en `filesystem/blogs/notes/` y `filesystem/astra/data/`). Todo lo demás se queda adentro.

ASTRA vive en su propio repositorio privado. Quizás algún día sea público. Todavía no.

### Correrlo localmente

El sitio usa rutas desde la raíz, así que sírvelo desde la carpeta del proyecto en vez de abrir los archivos con doble clic:

```
python -m http.server 8765
```

Luego abre `http://localhost:8765`. Live Server de VS Code también funciona.

### Una notita

Este proyecto ha pasado por muchos cambios. No es perfecto, hay páginas sin terminar y vas a encontrar código viejo al lado de código nuevo. Sigo aprendiendo (sobre todo backend, soy malísima), así que si ves un bug o algo que podría estar mejor, me encanta saberlo.

### Contacto

- Correo: [luvrksnskyedev@icloud.com](mailto:luvrksnskyedev@icloud.com)
- Discord: luvrksnskyedev
- GitHub: [@luvrksnskye](https://github.com/luvrksnskye)
- O deja un mensaje en el [libro de visitas](https://luvrksknskyejourney.org/personal/guestbook/index.html)

¡Gracias por pasar, y feliz código!

Made with love and probably too much caffeine cuz I didn't sleep again.
