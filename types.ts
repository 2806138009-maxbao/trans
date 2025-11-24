export interface FourierConfig {
  waveType: "square" | "sawtooth";
  numCircles: number;
  speed: number;
}

// Linear.app / Interstellar Aesthetic
export const COLORS = {
  background: "#0B0C0E", // Linear Gunmetal / Deep Space
  cardBg: "rgba(255, 255, 255, 0.03)",
  primary: "#5E6AD2", // Linear Purple/Indigo
  primaryDim: "rgba(94, 106, 210, 0.2)",
  primaryBright: "#FFFFFF",
  accent: "#479CFF", // Electric Blue
  grid: "#222326", // Subtle separators
  textMain: "#F7F8F8", // Bright White
  textDim: "#8A8F98", // Muted Grey-Blue

  // Linear specific gradients
  textGradient:
    "linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.7) 100%)",
};

export type Language = "en" | "zh";

export interface TooltipContent {
  title: string;
  body: string;
}

export const TRANSLATIONS = {
  en: {
    heroHeading: "Luminous Harmonics — Fourier Series Lab",
    heroSubheading: "Build a Fourier series with your hands.",
    heroStart: "Start the Lab",
    heroWhy: "Why should I care?",
    titleMain: "Fourier",
    titleSuffix: "Series",
    description: "Deconstructing waveforms into pure frequencies.",
    harmonics: "Harmonics",
    dragInstruction: "Adjust approximation",
    output: "Result",
    timeDomain: "Time Domain",
    input: "Input",
    rotational: "Phasors",
    version: "v2.0",
    tooltipEpicyclesTitle: "Epicycles",
    tooltipEpicyclesBody:
      "Visualizing signal decomposition through rotating vectors. Each circle represents a harmonic frequency.",
    tooltipWaveformTitle: "Time Domain",
    tooltipWaveformBody:
      "The resulting composite wave. As N increases, it approaches a perfect square shape.",
    tooltipHarmonicsTitle: "Harmonic Series",
    tooltipHarmonicsBody:
      "A mathematical method to represent a periodic wave as a sum of simple sine waves. Increasing terms (N) improves precision.",
    lblAmplitude: "Amplitude",
    lblTime: "Time",
    lblFrequency: "Frequency Domain",
    lblSignal: "Output Signal",
    // Storytelling & Content
    heroBadge: "Experiment 01 · Luminous Lab",
    heroTitle: "Luminous Harmonics",
    heroSubtitle:
      "Play with Fourier series and see how simple waves build complex signals.",
    howToTitle: "How to play",
    howToItems: [
      "Move the sliders to change the amplitude of each harmonic.",
      "Watch how the blue curve in the time domain changes as you add more harmonics.",
      "Switch presets (square / triangle / sawtooth) to see classic Fourier examples.",
      "Toggle the frequency view to see the spectrum behind the waveform.",
    ],
    seeingTitle: "What you’re seeing",
    seeingParagraphs: [
      "Fourier’s idea is simple but powerful: many complicated signals can be built from a stack of very simple sine waves. Each harmonic is just a sine wave with its own amplitude and frequency.",
      "In the time-domain view, you are looking at the signal as it changes over time. When you move a slider, you’re turning one harmonic up or down, and the blue curve reacts in real time.",
      "In the frequency-domain view, the bars show how much of each frequency is present in the signal. A “spiky” spectrum usually means a sharp, edgy waveform (like a square wave). A smoother, concentrated spectrum usually means a smoother-looking signal.",
      "Engineers, physicists and signal processing people use this idea everywhere: audio, image compression, communications, control systems and more. This small lab is a visual playground for that idea.",
    ],
    aboutTitle: "About this lab",
    aboutParagraphs: [
      "Luminous Harmonics is Experiment 01 of Luminous Lab — a long-term project about redesigning the interface of engineering.",
      "I’m an undergraduate EEE student at UCL, obsessed with making hard engineering concepts feel visual, playful and precise at the same time. This Fourier lab started as my own way to survive signals and systems, and it slowly evolved into a small interactive textbook page.",
      "In the next experiments, I’ll extend this idea to Bode plots, filters and control systems, and eventually to more advanced topics like electromagnetics and EDA front-ends.",
    ],
    ctaStudentsTitle: "For students",
    ctaStudentsLead:
      "If this lab helped you see Fourier series a bit more clearly, you can:",
    ctaStudentsActions: [
      "bookmark this page for revision, and",
      "leave your email to get the next experiments (Bode plots, filters, control systems) when they go live.",
    ],
    ctaTeachersTitle: "For teachers & researchers",
    ctaTeachersBody:
      "If you’d like to use this lab in your course or internal training, or if you want a similar interactive explanation for another topic, I’d be very happy to collaborate.",
    ctaEmailLabel: "Email",
    ctaEmailPlaceholder: "luminous.lab@example.com", // TODO: Replace with real author email
    nextTitle: "Next in the series",
    nextSubtitle:
      "Luminous Harmonics is part of a bigger “Frequency & Control” series.",
    nextItems: [
      "Bode Lab – make gain and phase margins visible and interactive",
      "Filter Lab – design low-pass / high-pass / band-pass filters and hear the difference",
      "Control Lab – play with step responses, stability and root loci",
    ],
    nextPrompt:
      "If you’re interested in any of these, tell me which one you want to see first.",
    scrollPrompt: "Scroll to Explore",
    // Explorable Sections
    signalDrawingTitle: "A signal is drawing over time",
    signalDrawingLead:
      "Think of a signal as a pen that moves as time flows. The canvas is the timeline; the stroke is the value.",
    signalDrawingNote:
      "Sketch a curve and imagine the pen tip gliding left to right.",
    sineLegoTitle: "Sine waves are the Lego bricks",
    sineLegoLead:
      "Every sine looks the same, only its height (amplitude) and speed (frequency) change.",
    sineLegoAmp: "Amplitude",
    sineLegoFreq: "Frequency",
    buildTitle: "Build waves from harmonics",
    buildLead:
      "Start with a square or triangle preset, then push N higher and watch the edges sharpen.",
    buildBullets: [
      "Lower harmonics sketch the silhouette; higher ones polish the corners.",
      "N = 1 gives you a soft sine; N = 9 already feels squarish; N = 21 almost clicks.",
      "Try different presets to see how the spectrum rearranges.",
    ],
    seriesFormulaTitle: "From sliders to the Σ formula",
    seriesFormulaLead:
      "The slider you just moved is the same as choosing coefficients aₙ in the Fourier sum.",
    seriesFormulaPoints: [
      "f(x): the messy wave you see on the screen.",
      "Σ: a big “add them all up” sign — exactly what stacking harmonics does.",
      "aₙ: the volume knobs for each sine. Turn them up or down and the shape follows.",
    ],
    timeFreqTitle: "Time vs frequency views",
    timeFreqLead:
      "One graph shows shape over time, the other shows how much of each pitch lives inside.",
    timeFreqBullets: [
      "Sharp corners need plenty of high-frequency energy.",
      "Smooth curves hide most energy in low frequencies.",
      "Changing presets reshapes the spectrum instantly.",
    ],
    epicycleTitle: "Drawing with circles (epicycles)",
    epicycleLead:
      "Each circle spins at its own speed. Stack them and the tip traces your drawing.",
    epicycleNote:
      "Front circles carve the outline; tiny circles whisper the details.",
    engineeringTitle: "Where engineers use this daily",
    engineeringLead: "Fourier tools are everywhere once you start looking.",
    engineeringItems: [
      {
        title: "Audio",
        desc: "EQ, noise reduction, synthesis, and spectral fingerprints.",
      },
      {
        title: "Wireless",
        desc: "Spectrum allocation, modulation, channel shaping.",
      },
      {
        title: "Control & EEE",
        desc: "Bode plots, filters, stability margins, power systems.",
      },
      {
        title: "Imaging",
        desc: "Blur/sharpen, MRI reconstruction, compression tricks.",
      },
    ],
    recapTitle: "Recap & next steps",
    recapBullets: [
      "Complex signals = stacks of sines.",
      "Harmonic counts and amplitudes decide the silhouette.",
      "Frequency view is the fingerprint behind the waveform.",
      "Epicycles are the complex-plane version of the same idea.",
    ],
    recapStudentsTitle: "For students",
    recapStudentsLead:
      "How to use this lab for revision and building intuition:",
    recapStudentsBullets: [
      "Before exams, play with square / triangle / sawtooth presets and observe how changing harmonic count affects waveform and spectrum.",
      "Try explaining in your own words: why do the first few harmonics already look so close to the target waveform?",
      "Map each slider move to the Σ formula — understand how aₙ coefficients control the shape.",
      "Use epicycles to visualize the same idea in the complex plane.",
    ],
    recapTeachersTitle: "For teachers & educators",
    recapTeachersLead: "How to use this lab in your classroom:",
    recapTeachersBullets: [
      "Give students 5 minutes to freely explore the page before class.",
      "Use it during lectures to demonstrate harmonic superposition and spectrum changes in real time.",
      'Assign 1–2 reflection questions as homework (e.g., "design a target waveform and try to approximate it with only a few harmonics").',
      "Discuss spectra together: why do sharp edges need high-frequency energy?",
    ],
    recapStudents:
      "Students: revisit presets, watch how early harmonics steer the form, and map each slider move to the Σ formula.",
    recapTeachers:
      "Teachers: warm up with presets before lectures, let students trace shapes with epicycles, and discuss spectra together.",
    recapContact: "Email to collaborate or request a custom explorable.",
    teacherTeaserTitle: "For teachers & teams",
    teacherTeaserLead:
      "Want a classroom-ready version or a new topic (filters, control, EM)?",
    teacherTeaserBullets: [
      "Embed this lab as a warm-up or homework sandbox.",
      "Pair live spectra with lecture slides for intuition.",
      "Request a tailored explorable for your syllabus.",
    ],
    seriesVsTransformTitle: "Series vs Transform (what you see here)",
    seriesVsTransformLead:
      "This page is about Fourier series: expressing a periodic signal as a stack of sines. The Fourier transform is the continuous-spectrum cousin — different, but related.",
    seriesVsTransformPoints: [
      "Series: for periodic signals; gives discrete harmonics (1st, 3rd, 5th...).",
      "Transform: for general signals; gives a continuous spectrum.",
      "Epicycles are a geometric way to picture the same series coefficients.",
    ],
    definitionTitle: "What you are learning",
    definitionBody:
      "Fourier decomposition says any periodic signal can be expressed as a sum of scaled sine waves. Lower-order harmonics shape the silhouette; higher ones refine edges.",
    historyTitle: "Where it came from",
    historyBody:
      "Joseph Fourier formalized the idea in 1822 while studying heat. Today it underpins signal processing, communications, imaging, and control.",
    roleTitleShort: "Why it matters",
    roleBodyShort:
      "Time-domain pictures show shape; frequency-domain pictures show ingredients. Toggling between them is core to modern engineering.",
    learningTakeawayBuild:
      "After this block you should be able to say: adding more odd harmonics sharpens a square wave; odd terms alone already reconstruct it because of symmetry.",
    learningTakeawaySpectrum:
      "After this block you should know: more high-frequency energy means sharper edges; removing highs makes the wave rounder/blurrier.",
    nextSectionTitle: "Next in the series",
    nextSectionLead: "What comes after this Fourier series lab.",
    nextSectionItems: [
      "Bode Lab — interactive gain/phase intuition.",
      "Filter Lab — design LP/HP/BP filters and hear the differences.",
      "Control Lab — stability, root loci, and step responses.",
    ],
    // High-Order Section
    dftTitle: "Complex Reconstruction",
    dftSubtitle: "High-Order Application",
    dftInstruction: "Draw a continuous loop on the screen.",
    dftComputing: "Calculating DFT Coefficients...",
    dftReset: "Clear & Redraw",
    dftEpicycles: "Vectors",
  },
  zh: {
    heroHeading: "光之谐波 — 傅里叶级数实验室",
    heroSubheading: "用手“拼”出的傅里叶级数",
    heroStart: "进入实验",
    heroWhy: "为什么要学这个？",
    titleMain: "傅里叶",
    titleSuffix: "级数",
    description: "将波形解构为纯净的频率。",
    harmonics: "谐波数量",
    dragInstruction: "调整逼近程度",
    output: "输出",
    timeDomain: "时域",
    input: "输入",
    rotational: "旋转矢量",
    version: "v2.0",
    tooltipEpicyclesTitle: "本轮 (Epicycles)",
    tooltipEpicyclesBody:
      "通过旋转矢量可视化信号分解。每个圆代表一个独立的谐波频率。",
    tooltipWaveformTitle: "时域波形",
    tooltipWaveformBody:
      "合成的最终波形。随着 N (圆的数量) 增加，它越来越接近完美的方波。",
    tooltipHarmonicsTitle: "谐波级数",
    tooltipHarmonicsBody:
      "一种将周期性波形分解为简单正弦波叠加的数学方法。项数 (N) 越多，对方波的逼近就越精确。",
    lblAmplitude: "振幅",
    lblTime: "时间",
    lblFrequency: "频域",
    lblSignal: "输出信号",
    // Storytelling & Content
    heroBadge: "实验 01 · Luminous Lab",
    heroTitle: "Luminous Harmonics（光之谐波）",
    heroSubtitle:
      "用可视化和交互，亲手“拼”出傅里叶级数，看到复杂信号是如何由简单正弦波组合而成。",
    howToTitle: "怎么玩",
    howToItems: [
      "拖动滑块，改变每一阶谐波（正弦波）的幅度。",
      "观察时域中的蓝色波形，随着谐波数量和强度的变化而变形。",
      "切换预设（方波 / 三角波 / 锯齿波），看看经典的傅里叶例子。",
      "打开频域视图，看看波形背后隐藏的频谱。",
    ],
    seeingTitle: "你现在看到的是什么？",
    seeingParagraphs: [
      "傅里叶的核心思想其实很直白：很多看起来很复杂的信号，其实可以由一堆非常简单的正弦波叠加生成。每一个谐波，就是一个有自己幅度和频率的正弦波。",
      "在「时域视图」中，你看到的是信号随时间的变化。当你拖动某一个滑块时，你其实是在给对应的谐波“调音量”，蓝色的波形会实时对这些变化做出反应。",
      "在「频域视图」中，这些竖条表示每个频率在信号中占了多少份额。频谱越“尖锐”、分布越广，波形看起来就越锋利（比如方波）；频谱越平滑、越集中，波形看起来就越柔和。",
      "工程师、物理学家和信号处理工程师几乎到处在用这个思想：音频处理、图像压缩、通讯、控制系统…… 这个小实验，就是为这个伟大想法准备的一块可视化游乐场。",
    ],
    aboutTitle: "关于这个实验",
    aboutParagraphs: [
      "Luminous Harmonics 是 Luminous Lab 的第一个实验 —— 这是一个「重新设计工程学界面」的长期项目。",
      "我是 UCL 的电子电气工程本科生，执着于把那些又硬又抽象的工程概念，做成既好看、又好玩、还能保持严谨的交互界面。这个傅里叶实验最开始只是我为了撑过去《信号与系统》而做的“小自救工具”，后来慢慢演化成这样一页小型的交互式教科书。",
      "在接下来的实验中，我会把同样的思路扩展到 Bode 图、滤波器、控制系统，甚至更高阶的电磁场与 EDA 前端界面。",
    ],
    ctaStudentsTitle: "给学生",
    ctaStudentsLead: "如果这个小实验让你对傅里叶级数稍微不那么害怕了，你可以：",
    ctaStudentsActions: [
      "把这个页面收藏起来，作为期中 / 期末复习的小工具；",
      "留下你的邮箱，等下一批实验（Bode 图、滤波器、控制系统）上线时第一时间收到通知。",
    ],
    ctaTeachersTitle: "给老师和研究者",
    ctaTeachersBody:
      "如果你想在课堂或内部培训中使用这个实验，或者希望为某个特定知识点开发类似的交互式可视化，我非常乐意合作。",
    ctaEmailLabel: "邮箱",
    ctaEmailPlaceholder: "luminous.lab@example.com", // TODO: 请替换为真实作者邮箱
    nextTitle: "系列预告",
    nextSubtitle: "Luminous Harmonics 只是「频率与控制宇宙」的一部分。",
    nextItems: [
      "Bode 实验室：把增益裕度、相位裕度做成一眼能看懂、能拖动的图",
      "滤波器实验室：自己设计低通 / 高通 / 带通滤波器，看看也“听听”它们的差异",
      "控制实验室：通过交互方式理解阶跃响应、稳定性和根轨迹",
    ],
    nextPrompt: "如果你对其中某一个特别感兴趣，可以告诉我你最想先看到哪一个。",
    scrollPrompt: "向下滚动探索",
    // Explorable Sections
    signalDrawingTitle: "信号 = 在时间轴上的画画",
    signalDrawingLead:
      "把信号想成一支笔：时间往右流动，笔尖沿着时间轴留下轨迹。",
    signalDrawingNote: "随便勾一条线，再想象时间推进时，笔尖怎么走。",
    sineLegoTitle: "正弦波是最基础的积木",
    sineLegoLead: "所有正弦波长得一样，只是高低（幅度）和快慢（频率）不同。",
    sineLegoAmp: "幅度",
    sineLegoFreq: "频率",
    buildTitle: "用谐波拼出方波 / 三角波",
    buildLead: "从方波或三角波预设开始，把 N 往上推，边缘会越来越锋利。",
    buildBullets: [
      "低阶谐波定轮廓，高阶谐波在打磨细节。",
      "N = 1 是光滑的正弦，N = 9 已经像方波，N = 21 基本到位。",
      "换个预设看看频谱怎么重新排布。",
    ],
    seriesFormulaTitle: "从滑块到 Σ 公式",
    seriesFormulaLead: "你刚刚推的滑块，本质就是在给 Σ 公式里的 aₙ 设定大小。",
    seriesFormulaPoints: [
      "f(x)：屏幕上那条复杂波形。",
      "Σ：把很多东西加在一起的符号，本质就是“叠加谐波”。",
      "aₙ：每一阶正弦的音量旋钮，拧它们，形状就跟着变。",
    ],
    timeFreqTitle: "时间视图 vs 频率视图",
    timeFreqLead: "一张看形状随时间变化，另一张看每个频率含量多少。",
    timeFreqBullets: [
      "棱角分明 → 需要很多高频成分。",
      "平滑圆润 → 主要是低频在发力。",
      "切换预设，频谱会立刻换个模样。",
    ],
    epicycleTitle: "用圆圈画线（本轮）",
    epicycleLead: "每个圆按自己的频率旋转，叠在一起，指尖轨迹就是你的涂鸦。",
    epicycleNote: "大圈画轮廓，小圈补细节。",
    engineeringTitle: "工程领域怎么用",
    engineeringLead: "只要涉及波形和频率，几乎都绕不开傅里叶。",
    engineeringItems: [
      { title: "音频", desc: "均衡、降噪、合成、频谱指纹。" },
      { title: "无线通信", desc: "频谱分配、调制、滤波和整形。" },
      { title: "控制 / 电气", desc: "Bode 图、滤波器、稳定裕度、电力系统。" },
      { title: "成像", desc: "模糊/锐化、MRI 重建、压缩。" },
    ],
    recapTitle: "总结 & 下一步",
    recapBullets: [
      "复杂信号 = 一堆正弦叠加。",
      "谐波数量和幅度决定轮廓。",
      "频域 = 波形的频率指纹。",
      "本轮 = 同一想法的复数/几何版。",
    ],
    recapStudentsTitle: "给学生",
    recapStudentsLead: "如何用这个实验复习和建立直觉：",
    recapStudentsBullets: [
      "考前先用方波 / 三角波 / 锯齿波预设玩一遍，观察谐波数量变化对波形 / 频谱的影响。",
      "尝试用自己的话总结：为什么只要前几阶就已经看起来很像目标波形。",
      "把每一次滑块移动对应到 Σ 公式 —— 理解 aₙ 系数怎么控制形状。",
      "用本轮可视化同一思想在复平面上的表现。",
    ],
    recapTeachersTitle: "给老师 / 教学者",
    recapTeachersLead: "如何在课堂上使用本网站：",
    recapTeachersBullets: [
      "课前 5 分钟让学生自由探索页面。",
      "课中用它实时演示谐波叠加和频谱变化。",
      "课后布置 1–2 个基于本页面的思考题（例如「设计一个目标波形并尝试用少数谐波逼近」）。",
      "一起讨论频谱：为什么棱角分明的波形需要很多高频能量？",
    ],
    recapStudents:
      "学生：多切换预设，观察低阶如何定形，高阶如何修边，再把它对应到 Σ 公式里。",
    recapTeachers:
      "老师：课前用预设热身；课堂让学生用本轮描图，再一起讨论频谱。",
    recapContact: "想合作或定制交互式页面，发邮件给我。",
    teacherTeaserTitle: "给老师和团队",
    teacherTeaserLead: "需要课堂版本或想要新的主题（滤波、控制、电磁）？",
    teacherTeaserBullets: [
      "把这个实验嵌进课堂热身或课后练习。",
      "把频谱演示和讲义一起用，直观很多。",
      "想要匹配你课程的专属 explorable？告诉我。",
    ],
    seriesVsTransformTitle: "级数 vs 变换（本页聚焦级数）",
    seriesVsTransformLead:
      "本页讲的是傅里叶级数：把周期信号拆成一堆正弦。傅里叶变换是它的“连续谱”亲戚，概念相连但对象更广。",
    seriesVsTransformPoints: [
      "级数：针对周期信号，结果是离散的谐波（1阶、3阶、5阶……）。",
      "变换：针对一般信号，结果是连续的频谱。",
      "本轮是几何化的级数系数，把正弦叠加画成旋转圆圈。",
    ],
    definitionTitle: "你在这里学什么",
    definitionBody:
      "傅里叶分解：任何周期信号都能拆成多条正弦波的叠加。低阶谐波定出轮廓，高阶谐波打磨边缘。",
    historyTitle: "它从哪里来",
    historyBody:
      "约瑟夫·傅里叶 1822 年提出，用来研究热传导，如今支撑着信号处理、通信、成像和控制。",
    roleTitleShort: "为什么重要",
    roleBodyShort:
      "时域看形状，频域看“配方”。在它们之间切换，是现代工程的基本技能。",
    learningTakeawayBuild:
      "玩完这一块，你应该能解释：为什么只用奇次谐波就能逼近方波，以及 N 越大边缘越锋利。",
    learningTakeawaySpectrum:
      "玩完时频对照，你应该知道：高频越多，边缘越尖；去掉高频，波形就变圆/模糊。",
    nextSectionTitle: "系列预告",
    nextSectionLead: "在这个傅里叶级数实验之后的计划。",
    nextSectionItems: [
      "Bode 实验室：交互式理解增益/相位。",
      "滤波器实验室：设计低通/高通/带通并听区别。",
      "控制实验室：稳定性、根轨迹和阶跃响应。",
    ],
    // High-Order Section
    dftTitle: "复杂信号重构",
    dftSubtitle: "高阶应用",
    dftInstruction: "在屏幕上绘制任意闭合回路。",
    dftComputing: "正在计算 DFT 系数...",
    dftReset: "清除重绘",
    dftEpicycles: "矢量数量",
  },
};
