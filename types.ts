
export interface FourierConfig {
  waveType: 'square' | 'sawtooth' | 'triangle'; 
  numCircles: number;
  speed: number;
}

export type WaveType = 'square' | 'sawtooth' | 'triangle';

// Linear.app / Interstellar Aesthetic
export const COLORS = {
  background: '#0B0C0E', // Linear Gunmetal / Deep Space
  cardBg: 'rgba(255, 255, 255, 0.03)',
  primary: '#5E6AD2',    // Linear Purple/Indigo
  primaryDim: 'rgba(94, 106, 210, 0.2)',
  primaryBright: '#FFFFFF', 
  accent: '#479CFF',     // Electric Blue
  grid: '#222326',       // Subtle separators
  textMain: '#F7F8F8',   // Bright White
  textDim: '#8A8F98',    // Muted Grey-Blue
  
  // Linear specific gradients
  textGradient: 'linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.7) 100%)',
};

export type Language = 'en' | 'zh';

export interface TooltipContent {
  title: string;
  body: string;
}

export const TRANSLATIONS = {
  en: {
    titleMain: 'Fourier',
    titleSuffix: 'Series',
    description: 'Deconstructing waveforms into pure frequencies.',
    harmonics: 'Harmonics',
    dragInstruction: 'Adjust approximation',
    output: 'Result',
    timeDomain: 'Time Domain',
    input: 'Input',
    rotational: 'Phasors',
    version: 'v2.0',
    tooltipEpicyclesTitle: 'Epicycles',
    tooltipEpicyclesBody: 'Visualizing signal decomposition through rotating vectors. Each circle represents a harmonic frequency.',
    tooltipWaveformTitle: 'Time Domain',
    tooltipWaveformBody: 'The resulting composite wave. As N increases, it approaches a perfect square shape.',
    tooltipHarmonicsTitle: 'Harmonic Series',
    tooltipHarmonicsBody: 'A mathematical method to represent a periodic wave as a sum of simple sine waves. Increasing terms (N) improves precision.',
    lblAmplitude: 'Amplitude',
    lblTime: 'Time',
    lblFrequency: 'Frequency Domain',
    lblSignal: 'Output Signal',
    // Wave Types
    waveSquare: 'Square',
    waveSawtooth: 'Sawtooth',
    waveTriangle: 'Triangle',
    // Intro Section
    introTitle: 'The Fourier Transform',
    introSubtitle: 'Everything is a wave.',
    defTitle: 'Definition',
    defBody: 'Decomposes a function (signal) into its constituent frequencies, revealing the hidden spectrum within.',
    histTitle: 'History',
    histBody: 'Introduced by Joseph Fourier in 1822. He revolutionized physics by proving heat propagation could be modeled as infinite series of sines.',
    roleTitle: 'The Role',
    roleBody: 'The bridge between Time and Frequency. It transforms amplitude over time into power over frequency.',
    appsTitle: 'Applications',
    appsBody: 'The backbone of the digital world: from JPEG compression and MP3 audio to MRI scans and 5G networks.',
    scrollPrompt: 'Scroll to Explore',
    // High-Order Section
    dftTitle: 'Complex Reconstruction',
    dftSubtitle: 'High-Order Application',
    dftInstruction: 'Draw a continuous loop on the screen.',
    dftComputing: 'Calculating DFT Coefficients...',
    dftReset: 'Clear & Redraw',
    dftEpicycles: 'Vectors'
  },
  zh: {
    titleMain: '傅里叶',
    titleSuffix: '级数',
    description: '将波形解构为纯净的频率。',
    harmonics: '谐波数量',
    dragInstruction: '调整逼近程度',
    output: '输出',
    timeDomain: '时域',
    input: '输入',
    rotational: '旋转矢量',
    version: 'v2.0',
    tooltipEpicyclesTitle: '本轮 (Epicycles)',
    tooltipEpicyclesBody: '通过旋转矢量可视化信号分解。每个圆代表一个独立的谐波频率。',
    tooltipWaveformTitle: '时域波形',
    tooltipWaveformBody: '合成的最终波形。随着 N (圆的数量) 增加，它越来越接近完美的方波。',
    tooltipHarmonicsTitle: '谐波级数',
    tooltipHarmonicsBody: '一种将周期性波形分解为简单正弦波叠加的数学方法。项数 (N) 越多，对方波的逼近就越精确。',
    lblAmplitude: '振幅',
    lblTime: '时间',
    lblFrequency: '频域',
    lblSignal: '输出信号',
    // Wave Types
    waveSquare: '方波',
    waveSawtooth: '锯齿波',
    waveTriangle: '三角波',
    // Intro Section
    introTitle: '傅里叶变换',
    introSubtitle: '万物皆波。',
    defTitle: '定义',
    defBody: '将函数（信号）分解为其构成的频率分量，揭示隐藏在信号内部的频谱结构。',
    histTitle: '历史',
    histBody: '由约瑟夫·傅里叶于1822年提出。他证明热传播可以被模拟为无限正弦级数，彻底改变了物理学。',
    roleTitle: '核心作用',
    roleBody: '连接时域与频域的桥梁。它将随时间变化的振幅转换为随频率变化的功率。',
    appsTitle: '应用领域',
    appsBody: '数字世界的基石：从 JPEG 图像压缩和 MP3 音频，到 MRI 医学扫描和 5G 网络。',
    scrollPrompt: '向下滚动探索',
    // High-Order Section
    dftTitle: '复杂信号重构',
    dftSubtitle: '高阶应用',
    dftInstruction: '在屏幕上绘制任意闭合回路。',
    dftComputing: '正在计算 DFT 系数...',
    dftReset: '清除重绘',
    dftEpicycles: '矢量数量'
  }
};