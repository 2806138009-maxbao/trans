export type Language = "en" | "zh";

export interface TooltipContent {
  title: string;
  body: string;
}

// Linear.app / Interstellar Aesthetic
export const COLORS = {
  background: "#0B0C0E",
  cardBg: "rgba(255, 255, 255, 0.03)",
  primary: "#FFC700", // Electric Gold
  primaryDim: "rgba(255, 199, 0, 0.2)",
  primaryBright: "#FFFFFF",
  accent: "#479CFF", // Electric Blue (Cyan)
  grid: "#222326",
  textMain: "#F7F8F8",
  textDim: "hsl(40, 5%, 55%)",  // Warm taupe, not cold grey
  textGradient:
    "linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.7) 100%)",
};

export const TRANSLATIONS = {
  en: {
    // Hero Section — Apple Style: Bold. Simple. Confident.
    heroBadge: "Luminous Lab · Experiment 02",
    heroHeading: "Smith Chart",
    heroTitleSecondary: "Impedance. Visualized.",
    heroSubheading: "The geometry of RF, in your hands.",
    heroStart: "Start",
    heroWhy: "Learn More",
    heroSubtitle: "Drag. See. Understand.",

    // Intro Narrative Section — Poetic, Confident
    chapterTitle: "Chapter 1 · Intuition",
    introTitle: "See the Invisible",
    introLead: "Forget the formulas. Feel the physics.",
    
    definitionTitle: "Infinity, Folded",
    definitionBody:
      "The entire complex plane. Compressed into a single circle. Every impedance has a home. Every reflection tells a story.",
    
    historyTitle: "1939",
    historyBody:
      "Before computers, engineers drew their answers. This is that drawing. Still unmatched.",
    
    roleTitleShort: "Zero Waste",
    roleBodyShort:
      "Mismatch is loss. Visualize it. Fix it. By hand.",
    
    seriesVsTransformTitle: "Two Views. One Truth.",
    seriesVsTransformLead:
      "Z for series. Y for parallel. Same circle. Different perspective.",
    seriesVsTransformPoints: [
      "Series L → Clockwise on constant-r.",
      "Parallel C → Clockwise on constant-g.",
      "Design: Alternate between Z and Y.",
      "Y = 1/Z. Point-symmetric about center.",
    ],

    // Step Timeline — Minimal, Action-Oriented
    roadmapTitle: "The Path",
    roadmapSubtitle: "Five Steps",
    roadmapLead: "Start anywhere. Go everywhere.",
    
    steps: [
      {
        id: "prerequisites",
        label: "Foundation",
        description: "Three concepts. That's all you need.",
      },
      {
        id: "intuition",
        label: "Intuition",
        description: "Why a circle? Why the center?",
      },
      {
        id: "experiment",
        label: "Lab",
        description: "Touch it. Move it. Know it.",
      },
      {
        id: "application",
        label: "Apply",
        description: "Antennas. Amplifiers. Filters.",
      },
      {
        id: "recap",
        label: "Master",
        description: "The essentials. Nothing more.",
      },
    ],
    startStep: "Begin",

    // Build Section (Experiment) — Direct, Inviting
    experimentTitle: "The Lab",
    experimentLead: "Physics at your fingertips.",
    
    howToTitle: "Controls",
    howToItems: [
      "Hover → Read",
      "Drag → Adjust",
      "Toggle → Y-view",
      "Center → Match",
    ],

    // Dynamic Hints — Crisp, Immediate
    hintCenter: "Center. Perfect match.",
    hintLeft: "Left → Short circuit.",
    hintRight: "Right → Open circuit.",
    hintTop: "Top → Inductive.",
    hintBottom: "Bottom → Capacitive.",
    hintVSWR: "Edge → Infinite VSWR.",

    // Info Cards — Elegant Brevity
    impedanceTitle: "Impedance",
    impedanceValue: "r + jx",
    impedanceDesc: "Real dissipates. Imaginary stores.",
    
    gammaTitle: "Reflection",
    gammaValue: "Γ",
    gammaDesc: "Center: none. Edge: total.",
    
    vswrTitle: "VSWR",
    vswrValue: "(1+|Γ|)/(1−|Γ|)",
    vswrDesc: "1 is perfect. Higher is worse.",
    
    powerTitle: "Efficiency",
    powerValue: "1 − |Γ|²",
    powerDesc: "What reaches the load.",
    
    qFactorTitle: "Q Factor",
    qFactorValue: "|X| / R",
    qFactorDesc: "Higher Q. Narrower band.",
    
    lineTitle: "Line Rotation",
    lineValue: "e^{-j2βl}",
    lineDesc: "λ/4 rotates 180°.",

    // Engineering Applications — Punchy Headlines
    engineeringTitle: "Swiss Army Knife",
    engineeringLead: "One tool. Every RF problem.",
    engineeringItems: [
      { title: "Antennas", desc: "Match. Radiate. Done." },
      { title: "Amplifiers", desc: "Maximum power. Minimum loss." },
      { title: "Filters", desc: "Shape the spectrum." },
      { title: "Transmission", desc: "Walk the circle." },
    ],

    // Recap Section — Memorable, Scannable
    recapTitle: "Remember This",
    recapBullets: [
      "Infinite plane → Finite circle.",
      "Center = Match. Edge = Reflect.",
      "Top = L. Bottom = C.",
      "Series moves on Z. Parallel on Y.",
      "λ/4 = 180° rotation.",
      "Efficiency = 1 − |Γ|².",
    ],
    
    recapStudentsTitle: "Students",
    recapStudentsLead: "Master this:",
    recapStudentsBullets: [
      "Move any load to center.",
      "Explain why center = match.",
      "Design an L-network.",
    ],
    
    recapTeachersTitle: "Teachers",
    recapTeachersLead: "Try this:",
    recapTeachersBullets: [
      "5 minutes free exploration.",
      "Demo: Add L, watch it move.",
      "Assignment: Match without numbers.",
    ],

    // Matching Network Calculator
    matchingCalculator: {
      title: "L-Match",
      designTitle: "L-Section Design",
      condition: "If",
      series: "Series",
      shunt: "Shunt",
      solution: "Then",
      recommended: "Best",
      matched: "Already matched.",
      explanation: "Two elements. Two steps. Done.",
    },
    
    // Instrument Slider
    sliders: {
      resistance: "R",
      reactance: "X",
      transmissionLine: "Line Length",
      inputImpedance: "Z_in",
      rotationInfo: "Rotated {deg}°",
    },

    // CTA — Confident, Minimal
    ctaTitle: "Stay Updated",
    ctaLead: "New experiments. First to know.",
    ctaPlaceholder: "Email",
    ctaButton: "Subscribe",
    ctaSuccess: "Done.",
    ctaCollaborate: "Custom project?",
    ctaEmail: "Let's talk",

    // Next Section
    nextTitle: "Coming",
    nextLead: "The RF series continues.",
    nextItems: [
      "Transmission Lines",
      "Matching Networks",
      "S-Parameters",
    ],

    // Footer
    footerBrand: "Luminous Lab",
    footerCopyright: "© 2024 LuminousZao",
  },
  zh: {
    // Hero Section
    heroBadge: "实验 02 · Luminous Lab",
    heroHeading: "史密斯圆图",
    heroTitleSecondary: "射频阻抗实验室",
    heroSubheading: "用几何直觉，驾驭射频能量。",
    heroStart: "立即体验",
    heroWhy: "了解更多",
    heroSubtitle:
      "无需公式。拖动、观察、理解。",

    // Intro Narrative Section
    chapterTitle: "第一章 · 直觉",
    introTitle: "直觉化史密斯圆图",
    introLead:
      "告别枯燥的公式推导。用几何直觉，驾驭射频能量。",
    
    definitionTitle: "复平面，被「折叠」了",
    definitionBody:
      "这不是魔法，是拓扑学的艺术。我们将无限大的阻抗平面，映射进一个有限的单位圆。一眼看穿阻抗、反射与驻波。",
    
    historyTitle: "1939 年的模拟计算杰作",
    historyBody:
      "在计算机诞生之前，工程师们用它「画」出答案。哪怕在数字时代，它依然是全球射频工程师的通用语言。",
    
    roleTitleShort: "拒绝能量损耗",
    roleBodyShort:
      "不匹配，意味着信号反射与功率浪费。在这里，可视化「回波」，并亲手设计出完美的匹配网络。",
    
    seriesVsTransformTitle: "Z 与 Y，一体两面",
    seriesVsTransformLead:
      "阻抗看串联，导纳看并联。旋转 180°，同一张图，两种视角。",
    seriesVsTransformPoints: [
      "串联电感 +jωL → 阻抗图上沿恒电阻圆顺时针走。",
      "并联电容 +jωC → 导纳图上沿恒电导圆顺时针走。",
      "匹配网络设计：先串后并，在两张图间切换。",
      "Y = 1/Z，导纳图是阻抗图关于圆心的点对称。",
    ],

    // Step Timeline
    roadmapTitle: "实验路线",
    roadmapSubtitle: "5 步，从入门到精通",
    roadmapLead: "按顺序探索，或直接跳转。",
    
    steps: [
      {
        id: "prerequisites",
        label: "先修知识",
        description: "阻抗、匹配、反射——三个基础概念。",
      },
      {
        id: "intuition",
        label: "几何直觉",
        description: "复平面如何折叠进圆？圆心为何是匹配点？",
      },
      {
        id: "experiment",
        label: "动手实验",
        description: "移动、拖拽、观察——物理规律尽在指尖。",
      },
      {
        id: "application",
        label: "工程应用",
        description: "天线、功放、滤波器——设计匹配网络。",
      },
      {
        id: "recap",
        label: "融会贯通",
        description: "核心要点，学习路径，继续探索。",
      },
    ],
    startStep: "开始探索",

    // Build Section (Experiment)
    experimentTitle: "交互式圆图",
    experimentLead:
      "拖动、观察、理解。物理规律，尽在指尖。",
    
    howToTitle: "操作指南",
    howToItems: [
      "悬停光标 → 实时读数",
      "拖动滑块 → 精确控制",
      "切换导纳 → 并联视角",
      "靠近圆心 → 完美匹配",
    ],

    // Dynamic Hints
    hintCenter: "圆心。零反射。完美匹配。",
    hintLeft: "左移 → 反射增大。极限：短路。",
    hintRight: "右移 → 反射增大。极限：开路。",
    hintTop: "上半圆：感性区。加电感，顺时针走。",
    hintBottom: "下半圆：容性区。加电容，逆时针走。",
    hintVSWR: "离圆心越远，驻波比越高。边缘 = ∞。",

    // Info Cards - 核心物理概念
    impedanceTitle: "阻抗 z",
    impedanceValue: "r + jx",
    impedanceDesc: "r = 电阻（耗能），x = 电抗（储能）。归一化后，50Ω → z=1。",
    
    gammaTitle: "反射系数 Γ",
    gammaValue: "(z−1)/(z+1)",
    gammaDesc: "圆心 Γ=0（无反射），边缘 |Γ|=1（全反射）。复数，含相位信息。",
    
    vswrTitle: "驻波比 VSWR",
    vswrValue: "(1+|Γ|)/(1−|Γ|)",
    vswrDesc: "VSWR=1 完美匹配，VSWR=2 反射 11%，VSWR=3 反射 25%。",
    
    // 新增物理概念卡片
    powerTitle: "功率效率",
    powerValue: "1 − |Γ|²",
    powerDesc: "传输到负载的功率比例。|Γ|=0.5 时，仅 75% 功率到达负载。",
    
    qFactorTitle: "Q 因子",
    qFactorValue: "|X| / R",
    qFactorDesc: "Q 越高，带宽越窄。Q=10 时，3dB 带宽约为中心频率的 10%。",
    
    lineTitle: "传输线旋转",
    lineValue: "Γ_in = Γ_L × e^{-j2βl}",
    lineDesc: "沿传输线走 λ/4，阻抗点顺时针旋转 180°。这是匹配网络设计的核心。",

    // Engineering Applications
    engineeringTitle: "工程师的瑞士军刀",
    engineeringLead: "从天线到芯片，无处不在。",
    engineeringItems: [
      { title: "天线匹配", desc: "50Ω 还是 75Ω？一目了然。" },
      { title: "功率放大", desc: "最大功率传输，从匹配开始。" },
      { title: "滤波器", desc: "LC 网络、短截线，可视化设计。" },
      { title: "传输线", desc: "沿线阻抗变换，圆图上走一圈。" },
    ],

    // Recap Section - 完整物理知识点
    recapTitle: "核心要点",
    recapBullets: [
      "复阻抗 z = r + jx → 单位圆。无限变有限。",
      "圆心 z=1 → Γ=0 → VSWR=1 → 完美匹配。",
      "边缘 |Γ|=1 → VSWR=∞ → 全反射（短路或开路）。",
      "上半圆 x>0 感性（电感主导），下半圆 x<0 容性（电容主导）。",
      "串联 +jωL → 沿恒 r 圆顺时针；串联 -j/ωC → 逆时针。",
      "并联元件？切换导纳图，Y = 1/Z。",
      "沿传输线走 λ/4 → 阻抗点旋转 180°。",
      "功率效率 = 1 - |Γ|²。VSWR=2 时，效率 89%。",
    ],
    
    recapStudentsTitle: "学生指南",
    recapStudentsLead: "考前冲刺，这样练：",
    recapStudentsBullets: [
      "给定负载 → 移到圆心。反复练习。",
      "能解释「为什么圆心是匹配点」吗？",
      "尝试设计一个 L 型匹配网络。",
    ],
    
    recapTeachersTitle: "教师指南",
    recapTeachersLead: "课堂这样用：",
    recapTeachersBullets: [
      "先让学生自由探索 5 分钟。",
      "用滑块演示：加 L 或 C，点怎么动？",
      "作业：只用串/并联元件，匹配指定负载。",
    ],

    // Matching Network Calculator
    matchingCalculator: {
      title: "L型匹配网络",
      designTitle: "L型匹配网络设计",
      condition: "条件",
      series: "串联",
      shunt: "并联",
      solution: "方案",
      recommended: "推荐",
      matched: "已匹配，无需匹配网络",
      explanation: "L型网络通过两步完成匹配：先用一个元件将阻抗移动到 r=1 圆上，再用另一个元件消除电抗。",
    },

    // Instrument Slider
    sliders: {
      resistance: "电阻",
      reactance: "电抗",
      transmissionLine: "传输线长度",
      inputImpedance: "输入端阻抗 Z_in (旋转后)",
      rotationInfo: "阻抗点顺时针旋转 {deg}°",
    },

    // CTA
    ctaTitle: "获取更新",
    ctaLead: "Bode 图、滤波器、控制系统——新实验上线时，第一时间通知你。",
    ctaPlaceholder: "邮箱地址",
    ctaButton: "订阅",
    ctaSuccess: "已订阅！",
    ctaCollaborate: "想定制专属交互页面？",
    ctaEmail: "联系我",

    // Next Section
    nextTitle: "系列预告",
    nextLead: "「射频与微波」系列，持续更新。",
    nextItems: [
      "传输线 — 驻波可视化，阻抗变换。",
      "匹配网络 — L、Pi、T 网络，交互设计。",
      "S 参数 — 二端口网络，级联分析。",
    ],

    // Footer
    footerBrand: "LuminousZao Lab",
    footerCopyright: "© 2024 LuminousZao",
  },
};
