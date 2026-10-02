# 可莉站姿立绘生成记录

日期：2026-10-02。工具：内置 image_gen；透明背景开启。

输出：`assets/klee-standing.png`，965 × 1630 PNG，保留透明 alpha。

参考图：[官方 CDN 经典红衣可莉人物图](https://webstatic.hoyoverse.com/upload/uploadstatic/contentweb/20200103/2020010311014850622.png)，仅用于服装、人物比例与画风参考，不沿用动作姿态。生成输出为非官方同人图，角色设计权利归原权利人。

## 1.0.1 原始站姿生成提示词

```text
Use case: stylized-concept
Asset type: transparent full-body character illustration for a Genshin Impact Klee desktop theme.
Input image 1 is ONLY a reference for Klee's identity, classic costume, proportions and painted anime style; do NOT copy its jumping action pose.
Primary request: create a SINGLE Klee in a quiet, natural standing pose. Both boots resting at the same level, body upright, relaxed shoulders, hands gently holding the straps of her own backpack at chest level, warm small smile, looking slightly toward the viewer. Show whole person from hat feather to boot soles, centered on a portrait canvas with modest transparent padding. Klee is the canonical petite child character: blonde twin tails, elf ears, red eyes, red beret with clover emblem and feather, red clover coat, white collar and trim, brown gloves, backpack and boots. Faithful nonsexual original costume and proportions.
Style: polished clean anime illustration, fine painted linework and soft cel shading close to the reference; NOT a 3D model or super-deformed chibi. Lighting: restrained warm golden sunlight from upper left, soft peach ambient shadows, suitable for Mondstadt sunset backdrop. No environment: genuinely transparent alpha background.
Constraints: ONLY the single standing character and her worn backpack. No airborne pose, no running, no stretched-out arms, no floating bombs, no explosions, no floating books, no magic effects, no additional creatures, no scenery, no ground plate, no text, no logo, no watermark, no checkerboard painted into background. Keep silhouette compact and full boots visible.
```

## 1.0.2 夕阳融合编辑提示词

输入 1 为 1.0.1 站姿图，输入 2 为随包 `assets/mondstadt.jpg`；使用内置 image_gen 编辑，透明背景开启。输出保持 965 × 1630 与透明 alpha，覆盖 `assets/klee-standing.png`。

```text
Use case: lighting-weather
Asset type: transparent full-body Klee character layer to integrate into an existing Mondstadt sunset wallpaper.
Input image 1: EDIT TARGET, the current standing Klee cutout. Input image 2: lighting, palette, atmospheric softness REFERENCE ONLY; do not include any of its scenery or text in the output.
Primary request: repaint the shading and rendering of image 1 so Klee feels immersed in the hazy sunset of image 2 rather than a sharp sticker. Preserve Klee's identity, exact full-body standing pose, backpack straps held by both hands, petite canonical child proportions, red beret and classic clover coat, elf ears, twin tails, costume details, gentle expression and complete boots.
Change only rendering and lighting: much thinner low-contrast warm brown contours, gently painterly edges and softly blended shading, softly lit amber/coral rim light from upper right behind the character, warm cream highlights instead of hard white, desaturated rose/terracotta red fabric, hazy mauve-brown shadows instead of black. Reduce contrast and saturation moderately so it agrees with the orange-pink ambient palette; allow subtle golden reflected light on face, coat and backpack. Preserve readable face and crisp-enough eyes, but avoid glossy studio highlights or hyper-detailed sharp fabric outlines. Warm sunset ambient air, serene mood. Make the feet/lower boots subtly softer than the face for atmospheric depth.
Composition: preserve one single compact standing character, head to toe, centered portrait canvas, modest transparent margin on all sides including feather and boots. Background must remain genuinely transparent with clean alpha; no colored backdrop, no opaque glow rectangle, no painted checkerboard, no scenery and no ground plate. The character should remain solid within the silhouette; only anti-aliased edge softness, not overall semitransparency.
Avoid: extra characters or objects, bombs, magic effects, flowers, action pose, floating props, changing clothes or anatomy, giant bloom halo, outline stroke, sticker border, logo, watermark or text. This is an edit to the existing quiet standing illustration, not an entirely new character.
```
