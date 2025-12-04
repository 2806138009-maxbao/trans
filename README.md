<div align="center">
  <img src="[此处替换为你刚才做的黑金Banner图链接]" width="100%" alt="Luminous Harmonics Banner" />
</div>

<div align="center">
  <h1>Luminous Harmonics: The Smith Odyssey</h1>
  <p>
    <strong>Built with AI, Directed by Human.</strong>
    <br/>
    An interactive RF instrument that turns impedance matching into a tactile experience.
  </p>

  <blockquote>
    <em>"Dedicated to the one who grounds my signals."</em>
  </blockquote>

  <p>
    <a href="[你的在线演示链接]"><strong>🔴 Live Demo</strong></a> · 
    <a href="#run-locally"><strong>⚡ Run Locally</strong></a> · 
    <a href="#philosophy"><strong>🧠 Philosophy</strong></a>
  </p>
</div>

---

## 📡 The "Why"

> *"Impedance is not a number. It's a feeling."*

Traditional engineering tools are cold, static, and disconnected from reality. As an EEE student at UCL, I wanted to bridge the gap between abstract microwave engineering and human intuition.

**Luminous Harmonics** is not just a chart. It is a **physics-based instrument**. 

I replaced static data points with a custom **Spring Dynamics Engine**, allowing users to "feel" the resistance and magnetic snap of a 50Ω match. It transforms the Smith Chart from a terrifying grid into a fluid, explorable playground.

---

## 🛠️ The "How" (Technical Arsenal)

This project rejects the "plastic" feel of modern web frameworks. It is built on a custom render loop to achieve **60fps latency-free interaction**.

### 1. Invisible Physics Engine
Instead of linear animations, I implemented a custom physics kernel:
- **Spring Dynamics:** `F = -kx - cv`. The active point reacts to your cursor with mass and damping.
- **Magnetic Snap:** A custom gravity field around the 50Ω center point, providing haptic-visual feedback upon matching.
- **Kalman-lite Prediction:** Input coordinate prediction to eliminate cursor lag during high-speed drags.

### 2. The "Deep Dark" Rendering Protocol
A bespoke aesthetic system designed to reduce eye strain and evoke high-end avionics:
- **Warm Charcoal Background:** `#050505` (Not pure black).
- **Electric Gold Accents:** `#FFC700` for active signal paths.
- **Film Grain Injection:** A subtle SVG noise overlay to remove the "digital coldness".
- **Zero-Allocation Loop:** Canvas rendering logic is optimized to reuse object references, preventing Garbage Collection (GC) stutters.

---

## 📸 The Experience

| **Phase 1: The Void** | **Phase 2: The Fold** |
|:---:|:---:|
| <img src="[放一张初始化/虚空的截图]" width="100%" /> | <img src="[放一张Genesis动画的截图]" width="100%" /> |
| *System Initialization* | *Conformal Mapping Animation* |

| **Phase 3: The Instrument** | **Phase 4: The Lab** |
|:---:|:---:|
| <img src="[放一张特写/操作的截图]" width="100%" /> | <img src="[放一张完整界面的截图]" width="100%" /> |
| *Spring-loaded Interaction* | *Full Impedance Control* |

---

## ⚡ Run Locally

**Prerequisites:** Node.js (v16+)

```bash
# 1. Clone the repository
git clone [https://github.com/maxbao/trans.git](https://github.com/maxbao/trans.git)

# 2. Install dependencies
npm install

# 3. Ignite the engine
npm run dev
