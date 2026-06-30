# Unity 移植包

這個資料夾是把目前網頁原型搬到 Unity 用的第一版專案骨架。目標不是一次重做完整遊戲，而是先把核心方向固定：

- 視角：俯視但鏡頭往下斜看，接近 Doorkickers 2 / CQB 沙盤感。
- 地圖：沿用目前房間戰的大型 CQB 平面配置，用 Unity cube 建出地板、外框與牆。
- 角色：四隊會從不同角落出發，沿 waypoint 自動推進。
- 交戰：角色看見敵人時會停下、轉向並射擊，牆壁會阻擋視線。

## 使用方式

1. 開啟 Unity Hub。
2. 選擇 Add project from disk。
3. 選這個資料夾：`unity/`
4. 開啟場景：`Assets/Scenes/CQBPrototype.unity`
5. 按 Play。

這個場景已經包含：

- `CQB Prototype Runner`
- `Top Down Tactical Camera`
- `Key Light`

按 Play 後 Runner 會自動產生 CQB 地圖與角色。

如果想把場景存進專案，請點：

```text
CQB Prototype > Create And Save Prototype Scene
```

這會儲存到：

```text
Assets/Scenes/CQBPrototype.unity
```

如果想先確認基本物件是否有建立，請點：

```text
CQB Prototype > Run Prototype Smoke Test
```

## 終端機檢查

不用啟動 Unity、只檢查 C#、asmdef 和 `.meta`：

```bash
cd /Users/linchuanxuan/Desktop/個人資料整理/11_程式開發專案/game-2-unity-work/unity
bash tools/check-unity-scripts.sh
```

用 Unity batch mode 產生並儲存場景：

```bash
cd /Users/linchuanxuan/Desktop/個人資料整理/11_程式開發專案/game-2-unity-work/unity
bash tools/create-unity-scene.sh
```

如果 Unity 不在預設位置，可以指定：

```bash
UNITY_EDITOR="/Applications/Unity/Hub/Editor/你的版本/Unity.app/Contents/MacOS/Unity" bash tools/create-unity-scene.sh
```

按 Play 後會自動建立：

- CQB 房間地圖
- 俯視斜角 Camera
- 主要光源
- 四隊自動移動角色，每隊三名
- 基礎 CQB 交火：角色看見敵人會停止移動、轉向、射擊，並顯示短暫彈道線

## 專案檔案注意

- `Assets` 內的 `.meta` 檔請保留，這是 Unity 用來固定素材與腳本 GUID 的檔案。
- `CqbPrototype.Runtime.asmdef` 放遊戲執行腳本。
- `CqbPrototype.Editor.asmdef` 放 Unity Editor 選單與測試工具。
- `Library/`、`Temp/`、`Logs/` 不需要提交，已由 `.gitignore` 排除。

## 視角設定

目前建議值：

- Camera Projection：Orthographic
- Position Offset：`X 22 / Y 92 / Z 38`
- Orthographic Size：`41`
- Target：世界座標 `0, 0, 0`

這個角度會比原本網頁 3D 更俯視，角色移動方向比較容易看清楚，也比較接近戰術遊戲視角。

## 座標比例

網頁原型使用 900x900 像素座標，Unity 這邊用：

- `1 prototype pixel = 0.08 Unity unit`
- 以原型中心點 `450,450` 當 Unity 世界中心
- 原型的 `x,y` 會轉成 Unity 的 `x,z`

## 下一步

- 把目前的 waypoint 角色升級成 NavMesh 或自製格點尋路。
- 把目前簡化版 hitscan 射擊升級成不同槍種。
- 補上槍聲、命中特效與更清楚的死亡狀態。
- 把四隊交戰升級成更完整的 CQB 小隊戰術。
