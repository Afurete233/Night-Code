# Night-Code · 动态文字与视觉动画编辑器

<p align="center">
  <img src="./src/assets/hero.png" alt="Night-Code Banner" width="720" />
</p>

<p align="center">
  <strong>基于 Vue 3 + TypeScript + Pixi.js + Tauri 的现代化矢量运动图形与电影级动态歌词 (Kinetic Typography / 文字 PV) 创作工作台</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.5-42b883.svg?style=flat-square&logo=vuedotjs" alt="Vue 3" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178c6.svg?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Pixi.js-v8-e72264.svg?style=flat-square" alt="Pixi.js" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg?style=flat-square&logo=tailwindcss" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Tauri-v2-24c8db.svg?style=flat-square&logo=tauri" alt="Tauri" />
  <img src="https://img.shields.io/badge/JIZURA-850+_Presets-8b5cf6.svg?style=flat-square" alt="JIZURA Engine" />
</p>

---

## 📸 界面预览

<p align="center">
  <img src="./src/assets/hero.png" alt="Night-Code UI Screenshot" width="100%" />
</p>

---

## 📖 简介

**Night-Code** 是一款面向下一代短视频创作者、Motion Designer 与二次元/音乐视频（MV）制作者的高性能动画编辑器。项目深度集成了开源动态歌词引擎 [**JIZURA (字面)**](https://github.com/852wa/JIZURA) 的 **850+ 表现部件** 与 **27 套电影级风格配色**，并与自由时间轴多图层堆叠、关键帧缓动曲线、图片/色块标准矢量动画引擎进行了融合。

无论是一键导入 LRC 歌词批量生成丝滑转场的动态歌词 MV，还是为图片素材、几何图形制作物理回弹与关键帧动画，Night-Code 都能提供极速的离线渲染与高质量视频输出。

---

## ✨ 核心特性

### 1. 🎭 深度融合 JIZURA 8 大核心表现要素 (850+ 预设)
- **布局排版 (Layout · 186 种)**：大字夹排、出框巨字、十字排、日式竖排、字级递增、断字错位、胶囊字块、漫画气泡、剪报拼贴、卡拉OK高亮等。
- **进场动效 (Enter · 112 种)**：粒子分解聚合 (`assemble`)、网格切片 (`slice`)、Q弹 (`pop`)、上浮 (`riseMask`)、跌落弹跳 (`drop`)、橡皮筋 (`rubber`)、打字机 (`type`)、逐词重击 (`knWordSlam`) 等。
- **持续保持微动 (Hold · 46 种)**：物理呼吸 (`breathe`)、悬浮漂移 (`float`/`drift`)、轻柔摇曳 (`sway`)、高频微抖 (`jitter`)、随拍心跳 (`beatHop`)、缓慢自转 (`rotateSlow`)、果冻微动 (`jelly`) 等。
- **退场动效 (Exit · 98 种)**：粒子爆散 (`explode`)、重力崩落 (`fall`)、吸入黑洞 (`shrink`)、雾散 (`drift`)、切片掉落 (`vSliceDrop`)、故障崩解 (`glitch`)、退格删除 (`backspace`)、逐词踢飞 (`knWordKick`) 等。
- **装饰图元 (Decor · 130 种)**：坐标圆、引线、十字准星、时间码、边缘尺规、家纹、青海波、暗色科技角标、网格等原生 Canvas2D 绘制图元。
- **文字处理 (Treat · 62 种)**：3D 挤出立体字、双层描边、空心镂空、错位硬阴影、荧光笔底色、霓虹发光、RGB 色彩错位、贴纸粗白边等。
- **运镜控制 (Camera · 36 种)**：推近 (`push`/`dollyIn`)、环绕 (`orbitDrift`)、桶滚 (`barrelRoll`)、地震颤抖 (`earthquake`)、镜头下摇 (`tiltDown`) 等 3D 视角变换。
- **镜头转场 (Transition · 27 种)**：时钟擦除、光圈开启、对开门、百叶窗、方块崩解、磁砖崩落、急甩横摇等。

### 2. 🎬 前后歌词连贯无缝切换与转场流
- 自动按时间轴先后顺序将多句歌词编排为连续多镜头流（Cuts Stream）；
- 上一句歌词与下一句歌词在交接时，自动触发 JIZURA 原生转场动效、连续运镜跟踪与平滑出入场交替，告别生硬突变。

### 3. 🎨 背景图层素材化 (66 种 JIZURA 原生背景)
- 背景不再受限于单一全局底色，而是作为时间轴上的独立素材片段存在；
- 支持在不同时间区间放置多个背景片段（极光、网格渐变、80s 透视地平线、点状网格、扫描线带、青海波、宣纸水墨等）；
- 内置 **影视合成专用模式**：一键切换纯绿幕背景 (`#00FF00`) 或纯黑滤色背景 (`#000000`)，导出后可在剪映、AE、PR 中一键色度键抠像做透明叠加。

### 4. 🗄️ 视觉预设实时抽屉面板 (`PresetDrawerPanel`)
- **自由伸缩宽度**：在属性检查器与预设抽屉之间提供垂直拖拽手柄，支持在 `280px ~ 800px` 之间自由调节；
- **全量 JIZURA 原生绘图预览**：卡片直连 JIZURA 官方 `J.previewPlan` 编译函数与 `Renderer.prototype.frame()`，在 16:9 宫格画布中实时呈现真实的排版与动态视效；
- **左右滑动导航与滚轮支持**：顶部分类条配备导航箭头与 `@wheel` 横向鼠标滚轮滑动监听；
- **多选批量应用**：按住 `Shift` 或 `Ctrl/Command` 多选图层，点击任意卡片即可一次性批量应用至选中的所有图层。

### 5. 🖼️ 图片与色块标准矢量 MG 动效引擎
- **物理尺寸精确管理**：所有图层具备精确的 `width`、`height`、`naturalWidth`、`naturalHeight`，图片自动按原始分辨率无损导入；
- **8 点自由变换控制手柄**：画布缩放拉伸时实时更新像素级尺寸，属性面板提供锁定等比放缩与一键“居中原大”；
- **独立动效引擎**：图片与色块专属使用标准矢量 MG 变换预设，与文字动态排版解耦。

### 6. 📝 智能歌词与 LRC 导入生成器
- 支持粘贴带 `[00:12.34]` 时间戳的 LRC 歌词或纯多行文本；
- 智能解析 `// 翻译小字`、`（副标题）` 与 `*重点词强调*`，一键生成对齐时间轴的歌词视频片段。

### 7. 📤 高清视频与工程源文件导出
- **视频导出**：支持 1080P/720P 分辨率、30/60 FPS 帧率、MP4 (H.264) 与 WebM (VP9) 格式离线逐帧高清导出；
- **工程备份**：支持一键导出/导入包含全部图层、JIZURA 预设与关键帧参数的工程 JSON 文件。

---

## 🛠️ 技术栈

| 模块 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **UI 框架** | Vue 3 + Vite | 现代化响应式组件化开发 |
| **编程语言** | TypeScript | 全流程严格静态类型约束 |
| **画布渲染** | Pixi.js (v8) + Canvas 2D | 2D/WebGL 硬件加速渲染与图层合成 |
| **动效核心** | JIZURA Core Runtime (850+ 部件) | 电影级动态排版、出入场插值与背景绘制 |
| **状态管理** | Pinia | 响应式状态流、多选与撤销/重做快照 (Undo/Redo) |
| **样式体系** | TailwindCSS v4 | 原子化暗色现代工作台界面 |
| **桌面端打包** | Tauri v2 + Rust | 极轻量级跨平台桌面应用外壳 |

---

## 📂 项目目录结构

```text
Night-Code/
├── JIZURA/                     # [Git Submodule] 官方 JIZURA (字面) 核心引擎上游子模块
├── scripts/
│   ├── build_engine.cjs        # JIZURA 引擎模块化打包脚本
│   └── sync_jizura.js          # JIZURA 官方预设库与渲染引擎一键全自动同步脚本
├── src/
│   ├── assets/                 # 静态图标与视觉资源
│   ├── components/
│   │   ├── common/             # 通用面板与容器组件 (EditorPanel 等)
│   │   ├── inspector/          # 属性检查器面板组件
│   │   │   ├── canvas/         # 背景与画布设置 (BackgroundSection 等)
│   │   │   ├── common/         # 空间变换、关键帧与预设抽屉 (PresetDrawerPanel 等)
│   │   │   ├── image/          # 图片素材属性 (ImageSection 等)
│   │   │   ├── shape/          # 几何色块属性 (ShapeSection 等)
│   │   │   └── text/           # 歌词排版与动效配置 (TextContentSection 等)
│   │   ├── ui/                 # 基础 UI 控件 (Select, ScrubInput, Dialog 等)
│   │   ├── AssetPanel.vue      # 左侧图层与素材管理面板 (支持折叠收起)
│   │   ├── CanvasStage.vue     # 主画布视口 (Pixi.js + JIZURA 分层渲染管线)
│   │   ├── EditorHeader.vue    # 顶部导航工具栏
│   │   ├── ExportModal.vue     # 高清视频与工程离线逐帧导出弹窗
│   │   ├── LyricImportModal.vue# JIZURA 智能歌词/LRC 排版生成器
│   │   └── TimelinePanel.vue   # 底部多轨时间轴 (关键帧、片段裁剪、多选)
│   ├── engine/
│   │   ├── jizura/             # JIZURA 核心子系统
│   │   │   ├── backgrounds.ts  # 66 种背景预设定义与映射
│   │   │   ├── data.json       # 850+ 表现部件与 27 套风格元数据
│   │   │   ├── index.ts        # 预设查询与分类检索接口
│   │   │   ├── jizuraEngine.js # JIZURA 原生全量 Canvas2D 执行与动效引擎
│   │   │   ├── lyrics.ts       # LRC 歌词解析器与排版定义
│   │   │   ├── renderer.ts     # JIZURA Plan 编译与透明多层渲染桥接器
│   │   │   └── styles.ts       # 27 套电影级风格配色定义
│   │   ├── animation.ts        # 图层变换与标准 MG 预设求值器
│   │   ├── audio.ts            # Web Audio 音频波形解析与同步播放引擎
│   │   ├── easing.ts           # 缓动曲线插值函数库 (EaseInOut, Bounce, Elastic...)
│   │   └── types.ts            # 核心图层与动画 TypeScript 类型定义
│   ├── stores/
│   │   └── editor.ts           # Pinia 核心状态树 (图层、选区、历史记录、时间轴)
│   ├── App.vue                 # 主应用视口与弹性布局拖拽调度
│   └── main.ts                 # 应用程序入口
├── src-tauri/                  # Tauri 桌面端配置与 Rust 后端
├── package.json
└── vite.config.ts
```

---

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0 (推荐) 或 npm / yarn

### 1. 安装依赖
```bash
pnpm install
```

### 2. 启动本地开发服务
```bash
pnpm dev
```
启动后在浏览器打开终端提示的地址（如 `http://localhost:5173`）即可进入编辑器。

### 3. 构建生产包
```bash
pnpm build
```

### 4. 运行桌面客户端 (Tauri)
```bash
pnpm tauri dev
```

---

## 🔄 一键同步 JIZURA 官方最新预设

当 [**JIZURA 官方仓库**](https://github.com/852wa/JIZURA) 发布新预设、新布局或新动效时，无需手动编写任何代码，只需在项目根目录执行：

```bash
node scripts/sync_jizura.js
```

该脚本将自动拉取官方最新源码，重新解析并编译 `src/engine/jizura/data.json` 与 `src/engine/jizura/jizuraEngine.js`，全项目的属性面板、实时预览库与导出引擎将自动同步所有最新预设。

---

## 📄 开源许可与致谢

- 动效与排版核心理念源自 [852wa/JIZURA](https://github.com/852wa/JIZURA)，遵循 MIT 开源许可协议。
- 本项目生成的输出物（视频、图片与工程文件）完全归使用者所有，支持商用与自由创作。
