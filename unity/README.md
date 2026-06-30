# Unity 移植包

這個資料夾是把目前網頁原型搬到 Unity 用的第一版資料。目標不是一次重做完整遊戲，而是先把核心方向固定：

- 視角：俯視但鏡頭往下斜看，接近 Doorkickers 2 / CQB 沙盤感。
- 地圖：沿用目前房間戰的大型 CQB 平面配置，用 Unity cube 建出地板、外框與牆。
- 角色：先用自動 waypoint 移動，之後再接上更完整的戰術 AI、射擊、視線判定。

## 使用方式

1. 用 Unity Hub 建立一個 3D 專案。
2. 把這個 `unity/Assets` 資料夾複製到 Unity 專案根目錄。
3. 建立空場景，新增一個空物件 `CQB Prototype`。
4. 掛上 `CqbPrototypeMapBuilder`，按 Play 後會產生地圖。
5. 場景 Camera 掛上 `CqbTopDownCamera`。
6. 若要測試角色移動，建立 Capsule 或簡單角色物件，掛上 `CqbWaypointAgent`，並指定 waypoint。

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

- 把現有四隊出生點轉成 Unity spawner。
- 把網頁版視線判定搬成 Unity raycast。
- 把武器射擊改成 Unity projectile 或 hitscan。
- 把 waypoint 移動升級成 NavMesh 或自製格點尋路，避免角色撞牆卡住。
