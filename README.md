<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Luminous Harmonics

Experiment 01 of Luminous Lab — an interactive Fourier series playground that turns simple harmonics into intuitive visuals.

- Built for students, teachers and engineers who want a fast intuition for time vs frequency domain.
- Focused on Fourier **series** / decomposition (periodic signals), with epicycles as a geometric view.
- Shows how stacking sine waves forms classic square/triangle/sawtooth signals with live p5.js renders.
- Doubles as a small interactive textbook page for signals & systems revision.

Notes on scope & structure:
- Hero + labs keep the original visual language; explanatory sections now read as a single scrolling article.
- Terminology aligned to Fourier series (not transform); a quick series-vs-transform primer is included.

View the app in AI Studio: https://ai.studio/apps/drive/1FDf8D3Lc7uezqh14G8WWaKPgwr8Q-XFH

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key
3. Run the app: `npm run dev`

## Luminous Harmonics – v0.2 Roadmap

### 1. React & lifecycle hygiene
- [ ] Add dependency arrays to `useEffect` hooks that only need to run on mount/unmount (e.g. IntersectionObserver in `App.tsx`).
- [ ] Ensure event listeners / observers are always cleaned up properly when components unmount.
- [ ] Consider debouncing `windowResized` calls in p5 sketches for smoother performance on resize.

### 2. Rendering engine & code reuse
- [ ] Extract common canvas drawing utilities (glow circles, gradient grids, connectors, labels) into a shared `luminousRenderer` / `renderUtils` module.
- [ ] Unify color, stroke width and animation parameters through a single theme/config file instead of scattering magic numbers.
- [ ] Prepare the renderer to be reused by future labs (Bode plots, filters, control systems).

### 3. Performance & “low GPU mode”
- [ ] Detect low-power devices (e.g. using `prefers-reduced-motion`, `devicePixelRatio` and/or an initial frame time sample).
- [ ] Add a `lowGpuMode` flag to:
  - reduce particle counts and glow radius,
  - simplify background effects,
  - lower the drawing frame rate when necessary.
- [ ] Optionally expose a simple “Reduce effects” toggle in the UI for users.

### 4. Configuration & presets
- [ ] Move all waveform presets (square / triangle / sawtooth / custom) into a dedicated config module.
- [ ] Allow easy addition of new presets without touching core rendering logic.
- [ ] Add a small JSON-ish schema for saving and loading custom harmonic sets.

### 5. Types & robustness
- [ ] Tighten TypeScript types for p5 instances, canvas refs and interaction state.
- [ ] Add basic runtime guards for unexpected values (e.g. NaNs, extremely large amplitudes).
- [ ] Write a few small unit tests for the Fourier coefficient calculation and epicycle generation logic.

### 6. UX & accessibility
- [ ] Provide keyboard-accessible controls for key interactions (preset switching, play/pause).
- [ ] Add aria-labels / descriptions to main interactive elements where appropriate.
- [ ] Offer a brief “getting started” tooltip for first-time visitors.

### 7. Content & localization
- [ ] Integrate the new Hero / “How to play” / “What you’re seeing” / About / CTA text into dedicated sections.
- [ ] Keep translations in a single `TRANSLATIONS` file and mark which keys are used where.
- [ ] Add a simple language toggle state that’s easy to reuse across future labs.

### 8. Packaging & portfolio
- [ ] Add a short project description at the top of the page and in the README:
  - who this is for (students, teachers, engineers),
  - what problem it solves (understanding Fourier intuitively).
- [ ] Link this project from your personal portfolio / Luminous Lab homepage as “Experiment 01”.
- [ ] Include 2–3 high-quality screenshots / GIFs for quick visual scanning.
