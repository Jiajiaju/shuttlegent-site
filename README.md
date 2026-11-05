# Shuttlegent 官网

Shuttlegent 的静态产品展示网站与文档站。首页采用经线背景与梭子滚动动画，介绍插件界面、能力、连接模型、使用和自定义扩展；`docs/` 是插件全部文档的阅读页。

视觉与文案以插件仓库的 UI 交互设计指南 `Docs/Design.pdf` 为准：颜色、字重、圆角与动效时长使用与插件 `Resources/Web/tokens.css` 同名同值的令牌（见 `style.css` 开头），品牌红只用于标志与主按钮。

## 发布

- 仓库：https://github.com/Jiajiaju/shuttlegent-site
- 预期发布地址：https://jiajiaju.github.io/shuttlegent-site/
- 无需安装依赖、构建、服务器端运行时或 API 密钥。
- 发布地址需完成提交、推送和 Pages 设置后才生效。

将文件提交并推送到 `main` 后，在仓库 **Settings → Pages → Build and deployment** 中设置：

1. Source：**Deploy from a branch**。
2. Branch：**main**；Folder：**/ (root)**。
3. 保存，等待 Pages 部署完成，再访问上方地址。

`.nojekyll` 保证直接发布静态文件。所有页面资源采用相对路径，支持 `/shuttlegent-site/` 项目子路径。不需要配置自定义域名或 `CNAME`。

## 文件

| 文件 | 用途 |
|---|---|
| `index.html` | 入口、五个内容场景和弹窗 |
| `style.css` | 设计令牌、布局、响应式样式与思考中织动动画 |
| `app.js` | 按几何数据绘制标志、滚动切换、梭子动画、经线响应、界面图切换，以及第 03、04 章的演示循环 |
| `assets/brand-geometry.js` | 品牌标志几何数据（三条经线与梭子），从插件 `Resources/Web/brand-geometry.js` 原样复制 |
| `assets/shots/` | 界面图，见下文“界面图” |
| `assets/fonts/michroma-latin.woff2` | 名字字体 Michroma（拉丁字符子集），取自 Google Fonts，SIL Open Font License 1.1；只有一档字重，页面用描边加粗 |
| `assets/fonts/OFL.txt` | Michroma 的版权声明与许可证原文，随字体发布，不得删除 |

中文名“引纬”不用字体文件：`index.html` 开头的 `#name-zh` 是从寒蝉无机体 Regular（ChillType 与 Adobe，SIL Open Font License 1.1）取出的两个字的轮廓，两字间距 0.3em，首页开场和左侧导航都引用它。要换字或换字体，重新取轮廓替换这两条 `path`。
| `docs/index.html`、`docs/docs.css`、`docs/docs.js` | 文档页：渲染 `docs/md/` 下的 Markdown，左侧文档列表、右侧本页目录 |
| `docs/md/` | 插件文档：六篇只在这里维护，`README.md` 是插件仓库 README 的副本（见下文“文档”） |
| `.nojekyll` | 关闭 Jekyll 处理 |
| `.gitignore` | 排除本地依赖、环境文件与日志 |

仓库仅包含官网所需文件，不包含 Unreal Engine、插件源码、本地预览服务器或个人配置。

## 本地查看与检查

直接打开 `index.html` 可查看首页；文档页要读取 `docs/md/`，需要用任意本地静态服务打开（如 `npx serve`）。已安装 Node.js 时，可在本目录执行语法检查：

```powershell
node --check app.js
node --check assets/brand-geometry.js
```

发布后检查：

- 首屏 Logo 为三条经线，入场时依次落位；背景经线可见，图片与脚本没有 404。
- 五项导航均可到达；内容切换与梭子归位同步。
- 下滚播放穿行，上滚梭子保持归位；Logo 整体移动不拨线。
- 主界面大图、接入说明均能打开和关闭；第 01 章三张界面图能切换。
- 第 03 章连接卡片循环演示（填密钥、检测中、出现模型）；第 04 章确认后视口从改动前过渡到改动后，前后按钮可手动切换。
- 第 04 章运行行的织动标志在播放；手机无横向溢出，减少动态开关生效（织动、梭子与两段演示都停止）。
- 文档页七篇文档都能打开；文档间链接与锚点正确，架构文档的 Mermaid 图渲染为深色。

## 界面图

`assets/shots/` 下是编辑器实机截图，原图宽 3840 左右，缩到宽 1920 后放进来：画面类存 JPEG（质量 90），只有文字和控件的窄条存 PNG。

| 文件 | 画面 | 用在 |
|---|---|---|
| `panel.jpg` | 编辑器全貌：关卡视口加右侧停靠的面板，面板里是改三盏灯强度的结果 | 第 01 章大图；文档页把插件 README 的 `Docs/Images/panel.png` 换成它 |
| `multi-session.jpg` | 两个会话并排停靠在视口右侧 | 第 01 章切换 |
| `content-drag.jpg` | 输入框里拖入的关卡与静态网格体引用 | 第 01 章切换 |
| `toolbar.jpg` | 主工具栏播放按钮右侧的 Shuttlegent 按钮与悬停提示 | 接入步骤弹窗 |
| `viewport-before.jpg`、`viewport-after.jpg` | 同一相机位置，改动前后的关卡视口（三盏灯 5000/5000/1800 → 8000） | 第 04 章前后对比动画 |
| `models.png` | 编辑器偏好设置 › Shuttlegent › Models，一条 Connected 的连接，密钥以掩码显示 | 第 03 章“查看偏好设置” |

换图时文件名不变；扩展名变了，要同步改 `index.html`、`app.js`、`docs/docs.js` 里的引用。第 01 章大图框的宽高比按截图设为 1920/1045（`style.css` 的 `.shot-stage`），截图尺寸变了要一起改。

## 文档

插件文档以本仓库为准：`docs/md/` 下的配置、工具、项目扩展、常见问题、架构、开发六篇只在这里维护，插件仓库不再保留，插件 README 与 `.uplugin` 的 `DocsURL` 都链接到本站文档页。`docs/md/README.md` 是插件仓库 README 的副本，那边改了之后复制过来：

```powershell
Copy-Item <插件>\README.md docs\md\
```

UI 交互设计指南 `Design.pdf` 留在插件仓库 `Docs/`，不放到本站；架构文档里指向它的链接会打开 GitHub 上的文件。

六篇文档里的相对链接仍按插件仓库 `Docs/` 目录的位置写（如 `../Build/Probe/README.md`），页面会换成 GitHub 地址；互相引用写 `Tools.md#锚点` 即可。

文档页按文件名找文档，`docs.js` 的 `DOCS` 列出标题与顺序；新增文档时补一行。文档之间的相对链接自动换成文档页地址，其余仓库内路径链接到 GitHub。Mermaid 图从 jsDelivr 加载（版本固定），加载失败时显示图的源码；文档里为 GitHub 浅色页面写的 `classDef` 颜色会换成深色。

## 更新

直接维护本仓库的网站文件，提交并推送到发布分支后，GitHub Pages 会重新部署。插件的标志几何更新后，把 `assets/brand-geometry.js` 从插件仓库复制过来；思考中动画的关键帧与插件 `app.css` 的 `sg-weave-*` 保持一致。发布新版本时同步首页、文档页与接入弹窗里的版本号。
