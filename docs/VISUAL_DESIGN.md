# Visual Design

## 文書の位置づけ

この文書には現在の絵作りに関する設計だけを記載する。過去の案や議論の経緯は含めない。

初期実装を開始している。以下の具体的な数値は絵作りを確認するための仮値であり、最終値ではない。

## 1. 世界観と空間

深海をモチーフとする。

マリンスノーを画面内の視覚要素として採用する。GPU上で沈降、漂流、循環させ、サイズに個体差を持たせる。チューブの動きには追従させない。

自然光が届く空間は想定しない。観測機器由来の探照灯を主光源とし、AmbientLightは探査機周辺で散乱した光の近似として使う。遠方は吸収されて黒へ消える状態を目指す。半透明のコーンメッシュによる近似は画面を遮るため採用しない。水中散乱の実現方法は未決定とする。

## 2. 動きのモチーフ

- 新体操のリボン演技
- 映画『マトリックス』のセンチネルの付属肢に見られるうねり

有機的に見えることは必須条件としない。

## 3. 質感

- メタリックな質感を好む
- チープに見える金属表現は避ける
- 均一な表面を崩すため、チューブ表面に鱗状の金属薄板を重ねる。生物的な鱗ではなく、装甲片や積層した機械部品として扱う
- 金属薄板はチューブ本体と別マテリアルにし、初期仮値を色 `#ffc0c0`、metalness 1、roughness 0.1とする

## 4. 避けたい見え方

- Snakeゲームのような追従運動
- 直線を単純に揺らしただけに見える表現

## 5. 未決事項

金属の種類、最終的な表面仕上げ、反射の性質、具体的な構図は未決定。

### 初期実装の仮値

- 背景色: `#00070c`、フォグ密度: 0.055
- チューブ本体: 色 `#004080`、metalness 0.3、roughness 0.5
- 金属薄板: 色 `#ffc0c0`、metalness 1、roughness 0.1
- カメラ: FOV 50°、位置 `(0, 0, 5)`、near 0.1m、far 60m
- OrbitControls: 注視点 `(0, 0, -2)`、距離3–18m、パン無効
- 照明: カメラ左上の主SpotLight（`#d9f5ff`、強度76）と右上の補助SpotLight（`#9edff2`、強度52）。距離30m、角度0.46、penumbra 0.72、decay 1.4で、カメラ前方へわずかに収束させる
- 補助光: AmbientLight（`#183947`、強度20）。固定PointLightは使用しない
- マリンスノー: 5,000枚のカメラ正対する平面を `InstancedMesh` とLambert照明で描画する。OrbitControlsの注視点を中心とする16m × 10m × 20mの範囲、沈降速度0.025m/秒、漂流速度係数0.18、漂流幅0.08m、基準サイズ0.04m、サイズ倍率0.65〜1.8、色`#b9d8df`、不透明度0.2、円形のソフトエッジ。加算合成は使用しない
- DPR上限: 2
- ACES Filmic tone mapping、露出1.05
- Bloom: 強度0.28、半径0.3、輝度閾値1.0。明るい反射とマリンスノーをわずかに滲ませ、暗部全体を明るくしない
- 外部画像、テクスチャ、envMap、影、Bloom以外のポストプロセス、調整UIは使用しない

## 6. 参考資料

画像自体は保存せず、出典ページを参照する。素材として利用する場合は、各ページのクレジットと権利表記をあらためて確認する。

- [Light — NOAA Ocean Exploration](https://oceanexplorer.noaa.gov/multimedia/okeanos-explorations-ex2103-gallery-media-light/)：深海における探照灯
- [Navigating a Shipwreck — NOAA Ocean Exploration](https://oceanexplorer.noaa.gov/multimedia/navigating-a-shipwreck/)：暗闇で照らされた金属構造物
- [Shipwreck — NOAA Ocean Exploration](https://oceanexplorer.noaa.gov/multimedia/daily-image-media-20210528/)：海底の金属表面
- [Marine Snow — NOAA Ocean Exploration](https://oceanexplorer.noaa.gov/multimedia/explorations-19gulfofalaska-logs-aug1-media-video-marine-snow/)：光の中に現れる浮遊物
