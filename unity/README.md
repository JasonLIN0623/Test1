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
4. 開啟後，在 Unity 上方選單點：`CQB Prototype > Create Playable Prototype Scene`
5. 按 Play。

按 Play 後會自動建立：

- CQB 房間地圖
- 俯視斜角 Camera
- 主要光源
- 四隊自動移動角色，每隊三名
- 基礎 CQB 交火：角色看見敵人會停止移動、轉向、射擊，並顯示短暫彈道線

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
