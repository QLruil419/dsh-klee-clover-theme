# 素材来源与版权 / Asset notice

本项目为非官方粉丝主题。源代码沿用 Doro Paradise 的 MIT 许可与版权声明；**MIT 不覆盖第三方游戏图像、角色设计、名称或商标**。

## 随包素材

| 文件 | 内容 / 原始资源名 | 来源 |
| --- | --- | --- |
| `assets/mondstadt.jpg` | 蒙德城夕照，米哈游角色介绍页背景，1920 × 1080；原图具有柔焦与 Mondstadt 字样 | [官方 CDN 原图](https://uploadstatic-sea.mihoyo.com/contentweb/20200211/2020021114281985438.jpg) |
| `assets/klee-standing.png` | 单人自然站姿可莉，AI 生成的非官方同人立绘；保留夕阳光照，1.0.3 重新平衡头身比和五官，减少夸张大头与圆脸 | 内置 image_gen，最后编辑 2026-10-03；[完整提示词](docs/klee-standing-prompt.md) |
| `assets/klee-blossoming-starlight.png` | 琪花星烛服装图 `UI_Costume_KleeCostumeWitch` | [Enka 游戏资源镜像](https://enka.network/ui/UI_Costume_KleeCostumeWitch.png) |
| `assets/klee-icon.svg`, `assets/clover-frame.svg`, `assets/klee-clover-wordmark.svg` | 为主题编写的四叶草 UI 图形和字标 | 本项目源码绘制 |
| `assets/jumpy-dumpty.svg` | 蹦蹦炸弹主题的简化矢量同人装饰 | 本项目源码绘制；原作角色设计权利仍属于原权利人 |
| `docs/preview-*.jpg` | 本项目测试实例或开发预览截图 | 本项目截取，含上述原作素材 |

素材检索日期：2026-10-02。立绘标识交叉核对：[genshin-db 角色图片索引](https://github.com/theBowja/genshin-db/blob/main/src/data/image/characters.json)、[服装图片索引](https://github.com/theBowja/genshin-db/blob/main/src/data/image/outfits.json)。Enka 为托管镜像，并非图像版权人。

背景和侧栏 PNG 与 JPG 保留下载原件。右侧站姿图为生成的透明 PNG，保留生成输出的 alpha；客户端通过 CSS 定位、缩放、透明度和玻璃效果排版。`assets/sources.json` 记录来源和 SHA-256，便于核对。右侧站姿图不是官方立绘，原作角色设计权利仍归原权利人。

## 权利边界

《原神》、可莉、琪花星烛、蹦蹦炸弹及相关图像、设计与名称归米哈游 / HoYoverse 等原权利人所有。公开可访问的资源地址不等于开放素材授权，本仓库不声称这些图像为公有领域，也不授予其商业使用或再许可权。

源代码开源与素材权利是不同事项。使用或再分发素材时须遵守适用的原作政策；不得冒充官方或暗示官方认可。权利人如需调整或移除特定素材，请通过仓库 Issue 指明文件与依据。

DeepSeek Harness 名称归其相应权利人所有。本主题不是官方产品。

## 草稿说明

1.0.0 使用经典可莉祈愿动作图；1.0.1 改为站姿同人图；1.0.2 按蒙德夕阳重绘光照；1.0.3 以原作人物图为比例参考，再次调整站姿图的头身比与五官。旧版本的图像可在对应标签中查看。

早期田园背景与其他生成草稿未纳入发行包；当前发行只纳入选定的 `klee-standing.png`。背景继续使用原作蒙德城场景，侧栏继续使用原作琪花星烛图。
