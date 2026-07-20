# Visual Design

## 文書の位置づけ

この文書には現在の絵作りに関する設計だけを記載する。過去の案や議論の経緯は含めない。

初期実装を開始している。以下の具体的な数値は絵作りを確認するための仮値であり、最終値ではない。

## 1. 世界観と空間

深海をモチーフとする。

マリンスノーを画面内の視覚要素として採用する。GPU上で沈降、漂流、循環させ、サイズに個体差を持たせる。チューブの動きには追従させない。

## 2. 動きのモチーフ

- 新体操のリボン演技
- 映画『マトリックス』のセンチネルの付属肢に見られるうねり

有機的に見えることは必須条件としない。

## 3. 質感

- メタリックな質感を好む
- チープに見える金属表現は避ける

## 4. 避けたい見え方

- Snakeゲームのような追従運動
- 直線を単純に揺らしただけに見える表現

## 5. 未決事項

金属の種類、最終的な表面仕上げ、反射の性質、具体的な構図は未決定。

### 初期実装の仮値

- 背景色: `#00070c`、フォグ密度: 0.055
- 金属色: `#a9b6bc`、metalness: 0.85、roughness: 0.24
- カメラ: FOV 50°、位置 `(0, 0, 9)`、near 0.1m、far 60m
- OrbitControls: 注視点 `(0, 0, -2)`、距離3–18m、パン無効
- 照明: 冷白色SpotLight（`#d9f5ff`、強度1200、距離30m、角度0.52、penumbra 0.72、decay 1.4）
- 補助光: 青色PointLight 2灯（`#176d91`、強度210、距離20m、および`#5cb8c9`、強度130、距離18m）と弱いAmbientLight
- マリンスノー: 5,000枚のインスタンス化Sprite、OrbitControlsの注視点を中心とする16m × 10m × 20mの範囲、沈降速度0.025m/秒、漂流速度係数0.18、漂流幅0.08m、基準サイズ0.08m、サイズ倍率0.65〜1.8、色`#b9d8df`、不透明度0.56、円形のソフトエッジ。加算合成は一時的に無効
- DPR上限: 2
- ACES Filmic tone mapping、露出1.05
- 外部画像、テクスチャ、envMap、影、ポストプロセス、調整UIは使用しない

## 6. 参考資料

画像自体は保存せず、出典ページを参照する。素材として利用する場合は、各ページのクレジットと権利表記をあらためて確認する。

- [Light — NOAA Ocean Exploration](https://oceanexplorer.noaa.gov/multimedia/okeanos-explorations-ex2103-gallery-media-light/)：深海における探照灯
- [Navigating a Shipwreck — NOAA Ocean Exploration](https://oceanexplorer.noaa.gov/multimedia/navigating-a-shipwreck/)：暗闇で照らされた金属構造物
- [Shipwreck — NOAA Ocean Exploration](https://oceanexplorer.noaa.gov/multimedia/daily-image-media-20210528/)：海底の金属表面
- [Marine Snow — NOAA Ocean Exploration](https://oceanexplorer.noaa.gov/multimedia/explorations-19gulfofalaska-logs-aug1-media-video-marine-snow/)：光の中に現れる浮遊物
