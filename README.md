# Aural — Premium Web Audio Player

A polished, responsive, Apple Music-inspired audio player built with plain HTML, CSS and JavaScript.

## Features

- Play / pause
- Previous / next
- Seek bar
- Volume + mute
- Shuffle
- Repeat: off / all / one
- Search your queue
- Favorite button
- Drag & drop audio files
- Multiple local audio files
- Responsive mobile layout
- Keyboard shortcuts
- Media Session API support where available
- No framework or build step
- No backend required for the basic version

## Run locally

### Option 1 — VS Code

Open this folder in VS Code and use a Live Server extension.

### Option 2 — Python

From the project folder:

```bash
python -m http.server 5500
```

Then open:

http://localhost:5500

## Deploy

This is a static website, so it can be deployed to Vercel, Netlify, GitHub Pages, Cloudflare Pages, or any normal static web host.

Upload these files:

- index.html
- style.css
- app.js

The `music` folder is included as a place for your audio files.

## Adding permanent music

For the current version, the easiest approach is to let users select their own audio files using the **Add music** button.

If you want songs bundled with the website, put your audio files inside `music/` and then add them to the JavaScript playlist.

Example:

```js
const tracks = [
  {
    title: "My Song",
    artist: "My Artist",
    src: "music/my-song.mp3"
  }
];
```

Do not publish copyrighted music unless you have the rights or permission to distribute it.

## Next production version

For a real music platform with user accounts, uploads, playlists and streaming, use:

Frontend:
- HTML/CSS/JavaScript or Angular

Backend:
- ASP.NET Core Web API

Database:
- SQL Server or PostgreSQL

Storage:
- Azure Blob Storage / AWS S3 / another object-storage service

Authentication:
- ASP.NET Core Identity / OAuth

Streaming:
- HTTP range requests and CDN delivery

## Project structure

```text
aural-player/
├── index.html
├── style.css
├── app.js
├── README.md
└── music/
    └── README.txt
```
