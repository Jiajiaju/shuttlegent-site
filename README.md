# Shuttlegent 官网

Shuttlegent 的静态产品展示网站。采用经线背景与梭子滚动动画，介绍插件界面、能力、模型接入、使用和自定义扩展。

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
| `style.css` | 品牌配色、布局与响应式样式 |
| `app.js` | 滚动切换、梭子动画和经线响应 |
| `assets/brand-geometry.js` | 品牌标志几何数据 |
| `assets/panel.png` | 插件界面截图 |
| `.nojekyll` | 关闭 Jekyll 处理 |
| `.gitignore` | 排除本地依赖、环境文件与日志 |

仓库仅包含官网所需文件，不包含 Unreal Engine、插件源码、本地预览服务器或个人配置。

## 本地查看与检查

直接打开 `index.html` 可查看。已安装 Node.js 时，可在本目录执行语法检查：

```powershell
node --check app.js
node --check assets/brand-geometry.js
```

发布后检查：

- 首屏 Logo 和经线可见，图片与脚本没有 404。
- 五项导航均可到达；内容切换与梭子归位同步。
- 下滚播放穿行，上滚梭子保持归位；Logo 整体移动不拨线。
- 主界面大图、接入说明均能打开和关闭。
- 手机无横向溢出，减少动态开关生效。

## 更新

直接维护本仓库的网站文件，提交并推送到发布分支后，GitHub Pages 会重新部署。上线后以本仓库为官网维护入口，避免与原型目录分别修改造成版本不一致。
