# 贡献指南

提交 Issue 时请注明 Harness 版本、使用的 profile、操作系统和相关外观设置。可附截图，但请先遮盖会话内容、API Key、认证 URL 和私人路径。

开发：`npm ci` → `npm run preview`。修改后运行 `npm run check` 与 `npm test`，检查明暗模式、设置滑块与窄屏布局。

接口、存储键和 CSS 必须保留 `klee-clover` / `klee` 命名空间；不要读写其他主题的设置文件。保留 MIT 来源版权声明。增加新图片时同步更新素材说明和来源清单，不将第三方素材声明为 MIT。

预览状态、node_modules、个人配置、认证信息和测试运行目录不得提交。
