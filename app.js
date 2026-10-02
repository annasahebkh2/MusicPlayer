(() => {
  "use strict";

  const audio = document.getElementById("audio");
  const fileInput = document.getElementById("fileInput");
  const uploadButton = document.getElementById("uploadButton");
  const demoButton = document.getElementById("demoButton");
  const emptyUploadButton = document.getElementById("emptyUploadButton");
  const queue = document.getElementById("queue");
  const emptyState = document.getElementById("emptyState");
  const queueCount = document.getElementById("queueCount");
  const searchInput = document.getElementById("searchInput");
  const progress = document.getElementById("progress");
  const volume = document.getElementById("volume");
  const volumeLabel = document.getElementById("volumeLabel");
  const currentTimeEl = document.getElementById("currentTime");
  const durationEl = document.getElementById("duration");
  const trackTitle = document.getElementById("trackTitle");
  const trackArtist = document.getElementById("trackArtist");
  const artwork = document.getElementById("artwork");
  const playButton = document.getElementById("playButton");
  const previousButton = document.getElementById("previousButton");
  const nextButton = document.getElementById("nextButton");
  const shuffleButton = document.getElementById("shuffleButton");
  const repeatButton = document.getElementById("repeatButton");
  const muteButton = document.getElementById("muteButton");
  const clearButton = document.getElementById("clearButton");
  const favoriteButton = document.getElementById("favoriteButton");
  const statusText = document.getElementById("statusText");
  const moodText = document.getElementById("moodText");
  const modeButtons = [...document.querySelectorAll(".mode-button")];

  let tracks = [];
  let currentIndex = -1;
  let shuffle = loadSetting("aural-shuffle", false);
  let repeatMode = loadSetting("aural-repeat", "off"); // off | all | one
  let previousVolume = loadSetting("aural-volume", 0.8);
  let objectUrls = [];
  let favorites = new Set(loadSetting("aural-favorites", []));
  let currentMode = "Focus";

  const demoPlaylistMap = {
    Focus: [],
    Build: [],
    Debug: [],
    Chill: [],
    "God Mode": []
  };

  const modeLabels = {
    Focus: "deep work",
    Build: "build mode",
    Debug: "debug cycle",
    Chill: "chill coding",
    "God Mode": "legend status"
  };

  audio.volume = Number(previousVolume);
  volume.value = Number(previousVolume);

  function loadSetting(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function saveSetting(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const total = Math.floor(seconds);
    const mins = Math.floor(total / 60);
    const secs = String(total % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  }

  function titleFromFilename(name) {
    return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || "Untitled";
  }

  function makeTrack(file) {
    const src = URL.createObjectURL(file);
    objectUrls.push(src);
    return {
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      title: titleFromFilename(file.name),
      artist: "Local file",
      album: "Your Library",
      src,
      file
    };
  }

  function updateEmptyState() {
    emptyState.hidden = tracks.length > 0;
    queue.hidden = tracks.length === 0;
    if (queueCount) queueCount.textContent = String(tracks.length);
  }

  function renderQueue() {
    const query = searchInput.value.trim().toLowerCase();

    const visible = tracks
      .map((track, index) => ({ track, index }))
      .filter(({ track }) => !query ||
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query));

    queue.innerHTML = "";

    visible.forEach(({ track, index }) => {
      const item = document.createElement("div");
      item.className = `queue-item${index === currentIndex ? " active" : ""}`;
      item.setAttribute("role", "listitem");
      item.tabIndex = 0;

      const art = document.createElement("div");
      art.className = "queue-art";
      art.textContent = "♫";

      const info = document.createElement("div");
      info.innerHTML = `
        <div class="queue-title">${escapeHtml(track.title)}</div>
        <div class="queue-artist">${escapeHtml(track.artist)}</div>
      `;

      const more = document.createElement("button");
      more.className = "queue-more";
      more.type = "button";
      more.setAttribute("aria-label", `Remove ${track.title}`);
      more.textContent = "×";
      more.addEventListener("click", (event) => {
        event.stopPropagation();
        removeTrack(index);
      });

      item.append(art, info, more);
      item.addEventListener("click", () => loadTrack(index, true));
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          loadTrack(index, true);
        }
      });

      queue.appendChild(item);
    });

    updateEmptyState();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[char]));
  }

  function updateNowPlaying() {
    const track = tracks[currentIndex];

    if (!track) {
      trackTitle.textContent = "No track loaded";
      trackArtist.textContent = "Add your music to begin";
      artwork.querySelector(".artwork-letter").textContent = "A";
      artwork.querySelector(".artwork-caption").textContent = "YOUR MUSIC";
      favoriteButton.classList.remove("active");
      favoriteButton.textContent = "♡";
      document.title = "Aural — Premium Audio Player";
      return;
    }

    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    artwork.querySelector(".artwork-letter").textContent =
      track.title.trim().charAt(0).toUpperCase() || "♫";
    artwork.querySelector(".artwork-caption").textContent = "NOW PLAYING";
    favoriteButton.classList.toggle("active", favorites.has(track.id));
    favoriteButton.textContent = favorites.has(track.id) ? "♥" : "♡";
    document.title = `${track.title} — Aural`;
  }

  function resetTrackLibrary() {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();

    objectUrls.forEach((url) => {
      try { URL.revokeObjectURL(url); } catch {}
    });
    objectUrls = [];
    tracks = [];
    currentIndex = -1;
  }

  function loadDemoPlaylist(modeName) {
    const items = demoPlaylistMap[modeName] || demoPlaylistMap.Focus;
    resetTrackLibrary();

    tracks = items.map((item, index) => ({
      id: `${modeName}-${index}-${item.title}`,
      title: item.title,
      artist: item.artist,
      album: modeName,
      src: item.src,
      file: null
    }));

    updateModeSelection(modeName);
    updateEmptyState();
    updateNowPlaying();
    renderQueue();

    if (tracks.length) {
      loadTrack(0, false);
      updateControls();
    } else {
      trackTitle.textContent = "No demo tracks loaded";
      trackArtist.textContent = "Use Add tracks to select your music.";
      updateControls();
    }
  }

  function updateModeSelection(modeName) {
    currentMode = modeName;
    modeButtons.forEach((button) => {
      const active = button.textContent.trim() === modeName;
      button.classList.toggle("active", active);
    });

    if (moodText) {
      moodText.textContent = modeLabels[modeName] || modeName.toLowerCase();
    }
  }

  function updateControls() {
    const playing = !audio.paused && !audio.ended && currentIndex >= 0;
    playButton.textContent = playing ? "Ⅱ" : "▶";
    playButton.setAttribute("aria-label", playing ? "Pause" : "Play");

    if (statusText) {
      statusText.textContent = tracks.length === 0 ? "ready" : playing ? "playing" : "paused";
    }

    shuffleButton.classList.toggle("active", shuffle);
    shuffleButton.setAttribute("aria-pressed", String(shuffle));

    repeatButton.classList.toggle("active", repeatMode !== "off");
    repeatButton.setAttribute("aria-pressed", String(repeatMode !== "off"));
    repeatButton.textContent = repeatMode === "one" ? "↻¹" : "↻";

    const percent = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    progress.value = Number.isFinite(percent) ? percent : 0;

    currentTimeEl.textContent = formatTime(audio.currentTime);
    durationEl.textContent = formatTime(audio.duration);

    volumeLabel.textContent = `${Math.round(audio.volume * 100)}%`;
    muteButton.textContent = audio.muted || audio.volume === 0 ? "◌" : "◖";
  }

  function loadTrack(index, autoplay = false) {
    if (!tracks.length) return;

    currentIndex = ((index % tracks.length) + tracks.length) % tracks.length;
    const track = tracks[currentIndex];

    audio.src = track.src;
    audio.load();
    updateNowPlaying();
    renderQueue();

    if (autoplay) {
      audio.play().catch(() => {});
    }

    updateControls();
  }

  function playPause() {
    if (!tracks.length) {
      trackTitle.textContent = "No tracks loaded";
      trackArtist.textContent = "Use Add tracks to load music";
      updateControls();
      return;
    }

    if (currentIndex < 0) {
      loadTrack(0, true);
      return;
    }

    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }

  function nextTrack() {
    if (!tracks.length) return;

    let nextIndex;
    if (shuffle && tracks.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * tracks.length);
      } while (nextIndex === currentIndex);
    } else {
      nextIndex = currentIndex + 1;
    }

    if (nextIndex >= tracks.length) {
      if (repeatMode === "all") nextIndex = 0;
      else {
        audio.pause();
        audio.currentTime = 0;
        updateControls();
        return;
      }
    }

    loadTrack(nextIndex, true);
  }

  function previousTrack() {
    if (!tracks.length) return;

    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    let previousIndex = currentIndex - 1;
    if (previousIndex < 0) {
      previousIndex = repeatMode === "all" ? tracks.length - 1 : 0;
    }

    loadTrack(previousIndex, true);
  }

  function handleFiles(fileList) {
    const files = [...fileList].filter(file => file.type.startsWith("audio/"));

    if (!files.length) {
      alert("Please choose supported audio files.");
      return;
    }

    const newTracks = files.map(makeTrack);
    tracks.push(...newTracks);

    if (currentIndex < 0) loadTrack(0, false);
    else renderQueue();

    updateEmptyState();
  }

  function removeTrack(index) {
    if (index < 0 || index >= tracks.length) return;

    const wasCurrent = index === currentIndex;
    const removed = tracks[index];

    tracks.splice(index, 1);

    if (removed.src) {
      try { URL.revokeObjectURL(removed.src); } catch {}
    }

    if (!tracks.length) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      currentIndex = -1;
      updateNowPlaying();
    } else if (wasCurrent) {
      currentIndex = Math.min(index, tracks.length - 1);
      loadTrack(currentIndex, true);
    } else if (index < currentIndex) {
      currentIndex -= 1;
      renderQueue();
    } else {
      renderQueue();
    }

    updateEmptyState();
    updateControls();
  }

  function clearLibrary() {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();

    objectUrls.forEach(url => {
      try { URL.revokeObjectURL(url); } catch {}
    });
    objectUrls = [];
    tracks = [];
    currentIndex = -1;
    updateNowPlaying();
    renderQueue();
    updateControls();
  }

  uploadButton.addEventListener("click", () => fileInput.click());
  emptyUploadButton.addEventListener("click", () => fileInput.click());

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      loadDemoPlaylist(button.textContent.trim());
    });
  });

  demoButton.addEventListener("click", () => loadDemoPlaylist(currentMode));

  fileInput.addEventListener("change", () => {
    handleFiles(fileInput.files);
    fileInput.value = "";
  });

  playButton.addEventListener("click", playPause);
  nextButton.addEventListener("click", nextTrack);
  previousButton.addEventListener("click", previousTrack);

  shuffleButton.addEventListener("click", () => {
    shuffle = !shuffle;
    saveSetting("aural-shuffle", shuffle);
    updateControls();
  });

  repeatButton.addEventListener("click", () => {
    repeatMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
    saveSetting("aural-repeat", repeatMode);
    updateControls();
  });

  muteButton.addEventListener("click", () => {
    if (audio.muted || audio.volume === 0) {
      audio.muted = false;
      audio.volume = Number(previousVolume) || 0.8;
      volume.value = audio.volume;
    } else {
      previousVolume = audio.volume;
      saveSetting("aural-volume", previousVolume);
      audio.muted = true;
    }
    updateControls();
  });

  volume.addEventListener("input", () => {
    audio.volume = Number(volume.value);
    audio.muted = false;
    previousVolume = audio.volume;
    saveSetting("aural-volume", previousVolume);
    updateControls();
  });

  progress.addEventListener("input", () => {
    if (!Number.isFinite(audio.duration)) return;
    audio.currentTime = (Number(progress.value) / 100) * audio.duration;
  });

  clearButton.addEventListener("click", clearLibrary);

  favoriteButton.addEventListener("click", () => {
    const track = tracks[currentIndex];
    if (!track) return;

    if (favorites.has(track.id)) favorites.delete(track.id);
    else favorites.add(track.id);

    saveSetting("aural-favorites", [...favorites]);
    updateNowPlaying();
  });

  searchInput.addEventListener("input", renderQueue);

  audio.addEventListener("play", updateControls);
  audio.addEventListener("pause", updateControls);
  audio.addEventListener("timeupdate", updateControls);
  audio.addEventListener("loadedmetadata", updateControls);

  audio.addEventListener("ended", () => {
    if (repeatMode === "one") {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return;
    }
    nextTrack();
  });

  audio.addEventListener("error", () => {
    trackArtist.textContent = "This audio file could not be played by your browser";
    updateControls();
  });

  document.addEventListener("keydown", event => {
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea") return;

    if (event.code === "Space") {
      event.preventDefault();
      playPause();
    } else if (event.key === "ArrowRight") {
      if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
    } else if (event.key === "ArrowLeft") {
      if (Number.isFinite(audio.duration)) audio.currentTime = Math.max(0, audio.currentTime - 5);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      audio.muted = false;
      audio.volume = Math.min(1, audio.volume + 0.05);
      volume.value = audio.volume;
      previousVolume = audio.volume;
      saveSetting("aural-volume", previousVolume);
      updateControls();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      audio.muted = false;
      audio.volume = Math.max(0, audio.volume - 0.05);
      volume.value = audio.volume;
      previousVolume = audio.volume;
      saveSetting("aural-volume", previousVolume);
      updateControls();
    } else if (event.key.toLowerCase() === "m") {
      muteButton.click();
    }
  });

  ["dragenter", "dragover"].forEach(type => {
    document.addEventListener(type, event => {
      if ([...event.dataTransfer.types].includes("Files")) {
        event.preventDefault();
        document.body.classList.add("dragging");
      }
    });
  });

  ["dragleave", "drop"].forEach(type => {
    document.addEventListener(type, event => {
      event.preventDefault();
      if (type === "drop") {
        document.body.classList.remove("dragging");
        if (event.dataTransfer?.files?.length) handleFiles(event.dataTransfer.files);
      } else if (event.target === document.documentElement || event.target === document.body) {
        document.body.classList.remove("dragging");
      }
    });
  });

  // Media Session support for compatible browsers/devices.
  if ("mediaSession" in navigator) {
    const setAction = (action, handler) => {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch {}
    };

    setAction("play", () => audio.play());
    setAction("pause", () => audio.pause());
    setAction("previoustrack", previousTrack);
    setAction("nexttrack", nextTrack);
    setAction("seekbackward", () => audio.currentTime = Math.max(0, audio.currentTime - 10));
    setAction("seekforward", () => audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + 10));

    audio.addEventListener("loadedmetadata", () => {
      const track = tracks[currentIndex];
      if (!track) return;

      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist,
          album: track.album
        });
      } catch {}
    });
  }

  window.addEventListener("beforeunload", () => {
    objectUrls.forEach(url => {
      try { URL.revokeObjectURL(url); } catch {}
    });
  });

  updateModeSelection("Focus");
  updateEmptyState();
  renderQueue();
  updateNowPlaying();
  updateControls();
})();
