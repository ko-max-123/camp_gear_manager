# 道具を広げる画面の生成素材

2026-10-05 に内蔵の `image_gen` ツールで生成。

- `assets/unpack-ground.png`: 1536 × 1024、実写風の木の床とキャンバス地の布。
- `assets/unpack-gear-atlas.png`: 1254 × 1254、透過PNG。4列 × 4行の道具素材をCSSで個別表示。

道具素材は種類を表すイメージで、特定ブランドの製品写真ではありません。登録済みの写真がある道具には、その写真を優先して表示します。

## 2026-10-06 の表示用素材

容量を抑えるため、表示用画像をWebPへエンコードしました。元の生成PNG・商品JPEGは資料として保持しています。

| ファイル | サイズ | 内容 |
| --- | --- | --- |
| `assets/storage-scene.webp` | 1586×992 / 239,560 bytes | PCの収納棚 |
| `assets/storage-scene.jpg` | 1586×992 / 282,855 bytes | PCの棚のJPEGフォールバック |
| `assets/storage-cards.webp` | 1000×625 / 128,012 bytes | 写真カード用の棚 |
| `assets/unpack-ground.webp` | 1536×1024 / 163,896 bytes | 布と木の共通背景 |
| `assets/unpack-gear-atlas.webp` | 1254×1254 / 368,732 bytes | 透明部分を保った道具素材 |
| `assets/owned-gear/titanmania-v-pegs-cutout.webp` | 1000×1289 / 286,312 bytes | 所持ペグの透過写真 |

## 所持ペグの背景除去

内蔵 `image_gen.imagegen` を `transparent_background: true` で使用。元写真 `assets/owned-gear/titanmania-v-pegs.jpg` を参照し、初回の切り抜きをもう一度参照して周辺の色のにじみを減らしました。選択した生成画像をWebPへエンコードし、透明部分を保っています。

生成元：`exec-6c62e6dd-ce95-4567-a0af-1ceeaca06be2.png`。保存先：`assets/owned-gear/titanmania-v-pegs-cutout.webp`。

### 初回プロンプト

Use case: background-extraction. Edit target: the attached existing product photograph of SIX TITAN MANIA metal V-shaped camping tent pegs with orange braided pull cords. Primary request: remove ONLY the white background and produce a true transparent cutout for an outdoor gear website. Invariants: preserve all six exact pegs, their relative positions, the fifth straight and rightmost tilted pose, exact metal body shape, every elongated slot and hole, brand engravings, orange cord knots, proportions, colors and photographic texture. Keep the original portrait composition and framing. Make all white background including spaces between pegs, empty holes and cord loops transparent with clean natural edges. No paper, no white rectangular plate, no checkerboard painted into the image, no new elements, no restyling, no new lighting. Preserve the objects exactly; change only their background to alpha transparency.

### 採用した修正プロンプト

Use case: background-extraction refinement. Edit the FIRST reference, the original product photo, into a clean transparent cutout. The SECOND reference is a previous cutout attempt showing undesirable detached bright red/orange pixel speckles between and around the cords: remove those artifacts entirely. Preserve the SIX existing TITAN MANIA titanium V-shaped tent pegs and their orange braided pull cords exactly as photographed: same framing, poses, dimensions, six metal bodies, brand engravings, long holes, knots, and color. Only change the background mask. Fully remove every white background area, white in holes and loops, and all isolated flecks or halos outside the genuine object boundaries. There must be absolutely no red/orange floating speckles, no stray pixels, no colored fringe, no new detail, no repainting or rebuilding of the product. Retain the natural orange cord texture strictly INSIDE the true cord silhouettes and sharp metal edges. True alpha transparent background, clean professional ecommerce product clipping, original portrait arrangement of five vertical pegs and one slanted peg on the right.

## 背景の最終プロンプト

Create a photorealistic background asset for an interactive camping gear unpacking website. Landscape 1536x1024. A perfectly overhead flat lay photograph of a large empty weathered khaki / olive waxed canvas groundsheet, with natural fabric wrinkles, stitching and slightly folded edges, spread across a warm rustic wooden floor inside a sunlit Japanese camping equipment storage room. An empty open olive canvas duffel bag is partly visible beyond the top left corner of the groundsheet. A softly folded cream wool blanket and coiled tan webbing sit OUTSIDE the groundsheet along the far top right edge; mostly cropped. Real afternoon sunlight from left, warm muted tones, tactile fabric and wood texture, authentic outdoor equipment editorial photography. CRITICAL: the entire central 85 percent of the frame is unobstructed EMPTY canvas, no gear, no objects, no writing, no brand labels, no UI or borders. The camera is directly overhead, all canvas is in focus. This is a realistic empty stage onto which individual gear cutout assets will be overlaid in code.

## 道具素材の最終プロンプト

Create ONE sprite atlas of 16 individual photorealistic camping equipment cutouts, exactly a 4-column by 4-row REGULAR GRID of 16 equal square cells, canvas 2048x2048, TRUE transparent alpha background. This will be used as individual interactive objects placed on a canvas tarp in a realistic web app. Each object is separately centered inside its own cell, with at least 12 percent empty transparent padding on every side; NO object crosses cell boundaries, no items touching. All shot from directly overhead on the same plane, subtle natural contact shadow, warm sunlight from upper left, muted earthy olive, charcoal, beige, brushed steel. Real tactile photographic materials, no cartoon or 3D-render style, no labels, no typography, no logos, no grid lines, absolutely NO floor / tabletop / paper / checkerboard baked in. CELL ORDER left to right and top to bottom exactly: Row 1: (1) compact black cylindrical rechargeable LED camping lantern with small olive hanging loop; (2) brushed titanium camping mug with folding handles; (3) set of nested silver camping pots and a small black frying pan; (4) tightly packed olive large tent carry duffel with black webbing handles. Row 2: (5) rolled sage green sleeping bag with two charcoal compression straps; (6) beige hard-sided rectangular cooler box with dark latches; (7) neatly coiled orange guy rope with small tensioners; (8) large olive hiking backpack with tan straps. Row 3: (9) wooden-handled steel tent peg hammer; (10) small bundle of black forged camping tent pegs neatly parallel; (11) zippered red first aid pouch; (12) compact silver camping gas burner mounted on a squat dark green gas canister. Row 4: (13) charcoal portable power station with a sturdy handle; (14) rolled beige inflatable sleeping mat with straps; (15) olive outdoor jacket folded neatly with visible zipper and sleeves; (16) small closed olive canvas storage pouch. Keep each object large enough to see clearly inside its equal square cell and fully inside the cell. All backgrounds must be TRANSPARENT, including the spaces between objects.
