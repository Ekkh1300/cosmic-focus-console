# Keshan · Cosmic Focus Console

<div align="center">

[فارسی](README.md) · **English**

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![three.js](https://img.shields.io/badge/three.js-r186-000000?style=flat-square&logo=three.js&logoColor=white)

</div>

> **[⬇ Download the single-file build v1.0.0](https://github.com/Ekkh1300/cosmic-focus-console/releases/download/v1.0.0/keshan.html)** — one file, nothing to install, no internet; just double-click.

A productivity / focus-timer app with a cosmic “liquid glass” interface — a floating
space console with a rotating 3D planet behind it.

**Persian (RTL) by default**; English is available from the settings.

---

## Single-file build (for sharing)

```bash
npm run build:single
```

Output: **`کیهان.html`** (`keshan.html`) — a single file, about 1.2 MB (≈390 KB gzipped).

Just **double-click** it to open it in a browser. No server, no install, no internet
required:

- The entire JavaScript (including three.js), the CSS and the **Vazirmatn font** are
  inlined into the HTML as base64
- No external `src`/`href`, no runtime `import()`, no side-car files
- Scripts are `inline type="module"`, so the `file://` CORS restriction for modules
  does not apply
- If a browser blocks `localStorage` on `file://`, the app starts with a short notice
  and **everything still works in that session** (only persistence between runs is lost)

The file produced by `npm run build` (normal, multi-file mode) does not conflict with it.

---

## Getting started

```bash
npm install
npm run dev           # dev server
npm run build         # multi-file build into dist/
npm run build:single  # single-file build → کیهان.html
npm run preview       # preview the production build
npm run lint          # oxlint
```

No backend. Everything is stored in `localStorage` and the app works fully offline
after the first load.

---

## Features

**Timer**
- Five productivity modes: Pomodoro, deep work, study, short task, custom
- Three phases — focus / short break / long break — with a floating split bar
- **Custom duration** next to the phase picker: a stepper plus quick chips, applied to
  the current phase and the current template (and it resets the timer if one is running)
- **Live clock** in the top bar: `HH:MM:SS` + Persian (Jalali) date in Persian mode, or
  Gregorian in English — built with `Intl` and no date library; can be turned off from
  the settings (`show clock`) and only re-renders itself once per second
- Scheduling engine based on `timestamp` — it does not break when the tab is closed or
  the browser is throttled, and elapsed time is recovered on reopen
- Runs on `requestAnimationFrame` **and** a backup 250 ms interval, so the countdown stays
  correct even when the browser pauses rAF
- Circular energy ring, orbital particles, panel breathing while running, session-end animation

**Tasks**
- Create / edit / delete / check off, estimated time, categories
- Search + status and category filters
- Clicking a task links it to the timer; the play button starts it
- Real focused minutes are recorded per task

**Statistics**
- Today / weekly focus, sessions, completed tasks, day streak, focus score
- Weekly chart, category distribution, recent session list

**Presets**
- Five editable default presets + custom preset creation (persisted across reloads)

**Settings**
- Theme (dark / light / system), accent color, glass intensity, motion (full / reduced / off)
- Background (planet / nebula / minimal / particles), language, sound, browser notifications
- Timer behaviour, daily goal, shortcuts, data cleanup

**Shortcuts:** `Space` start/pause · `R` reset · `N` next session ·
`T/S/P/G` go to pages · `/` search · `Esc` close modal

---

## Architecture

```
src/
  components/
    glass/          liquid-glass material (GlassSurface, GlassButton, Segmented, Modal, Field, Toggle, EmptyState)
    background/     the cosmos: Planet (Three.js + procedural shader), Starfield, CosmicBackground, SvgDefs
    timer/          TimerOrb, ProgressRing, EnergyRing, TimerControls, PhaseSegments, ModeSelector, CompletionOverlay
    tasks/          TaskItem, TaskPanel, TaskComposer
    statistics/     StatCard, WeekChart, ScoreRing, CategoryBars, SessionList
    navigation/     BottomNav
    common/         PageHeader, NoticeBanner
  pages/            TimerPage, TasksPage, StatisticsPage, PresetsPage, SettingsPage
  hooks/            useClock, useAppearance, useShortcuts, usePointer, useLocalStorage, useDocumentTitle, useCopy
  store/            appStore (useSyncExternalStore + localStorage), stats (derived)
  utils/            timerEngine, format, storage, sound (WebAudio), notify, webgl, id
  i18n/             bilingual fa/en
  styles/           glass.css (material), animations.css (motion), components.css (layout)
  types/
```

### The liquid-glass material

Every surface is built from five light layers, not just `rgba + blur`:

1. **Coloured underlay** — multi-layer gradient + a white halo at the top of the panel
2. **Mouse reflection** — a `radial-gradient` that follows the pointer via `--gx/--gy`
3. **Refraction ring** — a `::before` with `backdrop-filter`, masked with `mask-composite`
   so the edge actually bends the world behind it
4. **Luminous border** — a `::after` with a masked gradient plus chromatic aberration at
   the corners
5. **Depth** — layered `box-shadow` plus an inner glow

Three material depths — `--primary` (the timer orb), `--panel`, `--control`, `--ghost` —
scaled by `data-glass="subtle|balanced|strong"`.

### The planet

A sphere with a custom `ShaderMaterial` (no textures): fbm noise for the topography,
a soft orbital grid, a day/night terminator, a violet atmospheric fresnel, orbital
particles and two rings. It rotates roughly once every 70 s (≈50 s while running), with
light that gently follows the pointer. If WebGL is unavailable it automatically falls
back to a pure-CSS sphere.

---

## Accessibility & performance

- Semantic HTML, full `role`/`aria`, keyboard navigation and a visible focus state
- `prefers-reduced-motion` on top of the user’s reduced/off motion level
- Text contrast tuned for WCAG (`--text-2/3` on the dark background)
- Timer ring updates without React re-rendering (direct DOM writes in rAF)
- Text-only data re-renders only when the second changes
- `three.js` is lazily loaded and only when the “planet” background is selected
- Animations and WebGL stop while the tab is hidden
- Chunk split: `three` (528 KB) · `motion` (135 KB) · `vendor` (210 KB) · `index` (105 KB)