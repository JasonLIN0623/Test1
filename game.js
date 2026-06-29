const canvas = document.querySelector("#gameCanvas");
const context = canvas.getContext("2d");
const room3dStage = document.querySelector("#room3dStage");
const redViewCanvas = document.querySelector("#redViewCanvas");
const blueViewCanvas = document.querySelector("#blueViewCanvas");
const greenViewCanvas = document.querySelector("#greenViewCanvas");
const goldViewCanvas = document.querySelector("#goldViewCanvas");
const redViewContext = redViewCanvas.getContext("2d");
const blueViewContext = blueViewCanvas.getContext("2d");
const greenViewContext = greenViewCanvas.getContext("2d");
const goldViewContext = goldViewCanvas.getContext("2d");

const teamStatusElements = {
  red: {
    panel: document.querySelector("#redTeamPanel"),
    count: document.querySelector("#redCount"),
    health: document.querySelector("#redHealth"),
  },
  blue: {
    panel: document.querySelector("#blueTeamPanel"),
    count: document.querySelector("#blueCount"),
    health: document.querySelector("#blueHealth"),
  },
  green: {
    panel: document.querySelector("#greenTeamPanel"),
    count: document.querySelector("#greenCount"),
    health: document.querySelector("#greenHealth"),
  },
  gold: {
    panel: document.querySelector("#goldTeamPanel"),
    count: document.querySelector("#goldCount"),
    health: document.querySelector("#goldHealth"),
  },
};
const roundStatusElement = document.querySelector("#roundStatus");
const timerElement = document.querySelector("#timer");
const winnerBanner = document.querySelector("#winnerBanner");
const winnerText = document.querySelector("#winnerText");
const startButton = document.querySelector("#startButton");
const resetButton = document.querySelector("#resetButton");
const playAgainButton = document.querySelector("#playAgainButton");
const groupModeButton = document.querySelector("#groupModeButton");
const duelModeButton = document.querySelector("#duelModeButton");
const roomModeButton = document.querySelector("#roomModeButton");
const ballCountInput = document.querySelector("#ballCountInput");
const ballCountValue = document.querySelector("#ballCountValue");
const speedInput = document.querySelector("#speedInput");
const speedValue = document.querySelector("#speedValue");

const teamConfig = {
  red: {
    color: "#ff3b4d",
    glow: "rgba(255, 59, 77, 0.42)",
    label: "RED",
    roomAssetTeam: "red",
  },
  blue: {
    color: "#2f7dff",
    glow: "rgba(47, 125, 255, 0.42)",
    label: "BLUE",
    roomAssetTeam: "blue",
  },
  green: {
    color: "#3ddc97",
    glow: "rgba(61, 220, 151, 0.38)",
    label: "GREEN",
    roomAssetTeam: "blue",
  },
  gold: {
    color: "#ffd166",
    glow: "rgba(255, 209, 102, 0.38)",
    label: "GOLD",
    roomAssetTeam: "red",
  },
};

const baseTeams = ["red", "blue"];
const roomTeams = ["red", "blue", "green", "gold"];

const state = {
  balls: [],
  pickups: [],
  projectiles: [],
  particles: [],
  roomDoors: [],
  running: false,
  startedAt: 0,
  elapsedBeforePause: 0,
  lastFrameTime: 0,
  winner: null,
  battleMode: "group",
  nextPickupIn: 1.2,
  arena: {
    x: 450,
    y: 450,
    radius: 330,
    pulse: 0,
  },
};

const room3DState = {
  initialized: false,
  renderer: null,
  scene: null,
  camera: null,
  routeGroup: null,
  actorGroup: null,
  projectileGroup: null,
  actorMeshes: new Map(),
  lastWidth: 0,
  lastHeight: 0,
  failed: false,
  materials: {},
};

const maxHealth = 100;
const damagePerHit = 14;
const hitCooldown = 0.38;
const maxPickups = 7;
const maxRoomPickups = 10;
const pickupLifetime = 10;
const weaponReadyDelay = 1;
const speedBoostDuration = 4;
const speedBoostMultiplier = 1.45;
const roomScale = 1.1;
const roomScaleCenter = { x: 450, y: 450 };
const room3DScale = 0.08;
const showRoomAiRoutes = false;

function scaleRoomNumber(value, axis) {
  return Math.round(roomScaleCenter[axis] + (value - roomScaleCenter[axis]) * roomScale);
}

function scaleRoomRect(rect) {
  const { x, y, width, height, ...rest } = rect;
  return {
    ...rest,
    x: scaleRoomNumber(x, "x"),
    y: scaleRoomNumber(y, "y"),
    width: Math.round(width * roomScale),
    height: Math.round(height * roomScale),
  };
}

function scaleRoomPoint(point) {
  return {
    x: scaleRoomNumber(point.x, "x"),
    y: scaleRoomNumber(point.y, "y"),
  };
}

function scaleRoomMap(map) {
  return {
    bounds: scaleRoomRect(map.bounds),
    walls: map.walls.map(scaleRoomRect),
    doors: map.doors.map(scaleRoomRect),
    spawnZones: Object.fromEntries(
      Object.entries(map.spawnZones).map(([team, zones]) => [team, zones.map(scaleRoomRect)]),
    ),
  };
}

const roomMap = scaleRoomMap({
  bounds: { x: 100, y: 80, width: 700, height: 760 },
  walls: [
    { x: 145, y: 80, width: 10, height: 140, color: "#101010" },
    { x: 100, y: 210, width: 122, height: 10, color: "#101010" },
    { x: 650, y: 80, width: 10, height: 140, color: "#101010" },
    { x: 650, y: 210, width: 150, height: 10, color: "#101010" },
    { x: 145, y: 700, width: 10, height: 140, color: "#101010" },
    { x: 100, y: 690, width: 250, height: 10, color: "#101010" },
    { x: 350, y: 690, width: 10, height: 150, color: "#101010" },
    { x: 650, y: 700, width: 10, height: 140, color: "#101010" },
    { x: 560, y: 690, width: 240, height: 10, color: "#101010" },
    { x: 560, y: 690, width: 10, height: 150, color: "#101010" },
    { x: 175, y: 210, width: 58, height: 8, color: "#1e58c8" },
    { x: 235, y: 210, width: 70, height: 8, color: "#e5df22" },
    { x: 305, y: 210, width: 66, height: 8, color: "#1e58c8" },
    { x: 435, y: 88, width: 8, height: 128, color: "#e5df22" },
    { x: 435, y: 216, width: 8, height: 58, color: "#1e58c8" },
    { x: 443, y: 274, width: 60, height: 8, color: "#ff6f73" },
    { x: 528, y: 176, width: 8, height: 66, color: "#b24aa4" },
    { x: 528, y: 242, width: 54, height: 8, color: "#b05b36" },
    { x: 635, y: 250, width: 8, height: 58, color: "#179b4a" },
    { x: 635, y: 250, width: 62, height: 8, color: "#b24aa4" },
    { x: 742, y: 250, width: 8, height: 62, color: "#ff6f73" },
    { x: 704, y: 312, width: 46, height: 8, color: "#ff6f73" },
    { x: 156, y: 250, width: 8, height: 60, color: "#b24aa4" },
    { x: 156, y: 250, width: 58, height: 8, color: "#b24aa4" },
    { x: 102, y: 342, width: 44, height: 8, color: "#b24aa4" },
    { x: 150, y: 342, width: 8, height: 78, color: "#1e58c8" },
    { x: 205, y: 400, width: 92, height: 8, color: "#b24aa4" },
    { x: 296, y: 342, width: 8, height: 66, color: "#b24aa4" },
    { x: 330, y: 342, width: 8, height: 58, color: "#b24aa4" },
    { x: 330, y: 414, width: 130, height: 8, color: "#b24aa4" },
    { x: 500, y: 414, width: 68, height: 8, color: "#e5322d" },
    { x: 370, y: 472, width: 112, height: 8, color: "#e5322d" },
    { x: 520, y: 472, width: 112, height: 8, color: "#e5322d" },
    { x: 406, y: 306, width: 8, height: 64, color: "#1e58c8" },
    { x: 468, y: 306, width: 8, height: 64, color: "#1e58c8" },
    { x: 406, y: 370, width: 70, height: 8, color: "#ff6f73" },
    { x: 536, y: 308, width: 8, height: 56, color: "#6e6f72" },
    { x: 584, y: 308, width: 8, height: 56, color: "#6e6f72" },
    { x: 536, y: 364, width: 56, height: 8, color: "#6e6f72" },
    { x: 585, y: 400, width: 92, height: 8, color: "#ff6f73" },
    { x: 695, y: 342, width: 8, height: 56, color: "#b24aa4" },
    { x: 696, y: 488, width: 8, height: 76, color: "#b24aa4" },
    { x: 704, y: 500, width: 86, height: 8, color: "#1e58c8" },
    { x: 198, y: 500, width: 96, height: 8, color: "#e5322d" },
    { x: 198, y: 518, width: 8, height: 78, color: "#b24aa4" },
    { x: 102, y: 592, width: 88, height: 8, color: "#b24aa4" },
    { x: 156, y: 600, width: 8, height: 88, color: "#b24aa4" },
    { x: 262, y: 548, width: 118, height: 8, color: "#e5322d" },
    { x: 314, y: 556, width: 8, height: 80, color: "#b24aa4" },
    { x: 400, y: 580, width: 8, height: 68, color: "#1e58c8" },
    { x: 400, y: 580, width: 76, height: 8, color: "#ff6f73" },
    { x: 476, y: 580, width: 8, height: 68, color: "#1e58c8" },
    { x: 536, y: 580, width: 8, height: 58, color: "#6e6f72" },
    { x: 584, y: 580, width: 8, height: 58, color: "#6e6f72" },
    { x: 632, y: 548, width: 96, height: 8, color: "#ff6f73" },
    { x: 744, y: 558, width: 8, height: 88, color: "#ff6f73" },
    { x: 635, y: 638, width: 8, height: 70, color: "#b24aa4" },
    { x: 635, y: 708, width: 58, height: 8, color: "#b24aa4" },
    { x: 740, y: 642, width: 8, height: 92, color: "#ff6f73" },
    { x: 704, y: 734, width: 44, height: 8, color: "#ff6f73" },
    { x: 260, y: 642, width: 8, height: 58, color: "#179b4a" },
    { x: 268, y: 642, width: 54, height: 8, color: "#8a5520" },
    { x: 520, y: 690, width: 8, height: 72, color: "#6e6f72" },
    { x: 520, y: 762, width: 34, height: 8, color: "#6e6f72" },
  ],
  doors: [],
  spawnZones: {
    red: [
      { x: 190, y: 126, width: 90, height: 92 },
    ],
    blue: [
      { x: 700, y: 110, width: 80, height: 100 },
    ],
    green: [
      { x: 190, y: 730, width: 90, height: 80 },
    ],
    gold: [
      { x: 690, y: 760, width: 85, height: 70 },
    ],
  },
});

const roomPickupZones = [
  { x: 190, y: 126, width: 90, height: 92 },
  { x: 700, y: 110, width: 80, height: 100 },
  { x: 190, y: 730, width: 90, height: 80 },
  { x: 690, y: 760, width: 85, height: 70 },
  { x: 190, y: 270, width: 130, height: 100 },
  { x: 580, y: 270, width: 130, height: 100 },
  { x: 190, y: 530, width: 130, height: 100 },
  { x: 580, y: 530, width: 130, height: 100 },
  { x: 380, y: 390, width: 140, height: 120 },
].map(scaleRoomRect);

const roomBlueprintSites = [];

const roomBlueprintLabels = [];

const roomBlueprintEntries = [];

const roomBlueprintRoutes = [];

const roomMazeWaypoints = [
  { x: 240, y: 160 },
  { x: 360, y: 160 },
  { x: 480, y: 160 },
  { x: 600, y: 160 },
  { x: 720, y: 160 },
  { x: 400, y: 240 },
  { x: 480, y: 240 },
  { x: 240, y: 280 },
  { x: 360, y: 280 },
  { x: 560, y: 280 },
  { x: 600, y: 280 },
  { x: 200, y: 320 },
  { x: 320, y: 320 },
  { x: 440, y: 320 },
  { x: 240, y: 360 },
  { x: 640, y: 360 },
  { x: 760, y: 360 },
  { x: 200, y: 440 },
  { x: 280, y: 440 },
  { x: 480, y: 440 },
  { x: 600, y: 440 },
  { x: 680, y: 440 },
  { x: 760, y: 440 },
  { x: 160, y: 520 },
  { x: 320, y: 520 },
  { x: 440, y: 520 },
  { x: 560, y: 520 },
  { x: 640, y: 520 },
  { x: 160, y: 560 },
  { x: 520, y: 560 },
  { x: 240, y: 600 },
  { x: 360, y: 600 },
  { x: 640, y: 600 },
  { x: 680, y: 600 },
  { x: 200, y: 640 },
  { x: 360, y: 640 },
  { x: 440, y: 640 },
  { x: 680, y: 640 },
  { x: 400, y: 720 },
  { x: 480, y: 720 },
  { x: 240, y: 760 },
  { x: 320, y: 760 },
  { x: 440, y: 760 },
  { x: 600, y: 760 },
  { x: 720, y: 780 },
].map(scaleRoomPoint);

const roomBreachRoutes = {
  red: [
    [
      { x: 240, y: 160 },
      { x: 400, y: 160 },
      { x: 400, y: 240 },
      { x: 320, y: 320 },
      { x: 280, y: 440 },
      { x: 440, y: 520 },
      { x: 640, y: 600 },
      { x: 720, y: 780 },
    ],
    [
      { x: 240, y: 160 },
      { x: 360, y: 160 },
      { x: 480, y: 240 },
      { x: 560, y: 280 },
      { x: 640, y: 360 },
      { x: 680, y: 440 },
      { x: 640, y: 520 },
    ],
    [
      { x: 240, y: 160 },
      { x: 240, y: 280 },
      { x: 200, y: 320 },
      { x: 200, y: 440 },
      { x: 160, y: 520 },
      { x: 240, y: 600 },
      { x: 440, y: 720 },
    ],
  ],
  blue: [
    [
      { x: 720, y: 160 },
      { x: 600, y: 160 },
      { x: 600, y: 280 },
      { x: 640, y: 360 },
      { x: 680, y: 440 },
      { x: 640, y: 520 },
      { x: 360, y: 600 },
      { x: 240, y: 760 },
    ],
    [
      { x: 720, y: 160 },
      { x: 600, y: 160 },
      { x: 480, y: 240 },
      { x: 440, y: 320 },
      { x: 480, y: 440 },
      { x: 440, y: 520 },
      { x: 360, y: 640 },
    ],
    [
      { x: 720, y: 160 },
      { x: 760, y: 360 },
      { x: 760, y: 440 },
      { x: 640, y: 520 },
      { x: 520, y: 560 },
      { x: 440, y: 640 },
      { x: 320, y: 760 },
    ],
  ],
  green: [
    [
      { x: 240, y: 760 },
      { x: 360, y: 640 },
      { x: 360, y: 600 },
      { x: 320, y: 520 },
      { x: 280, y: 440 },
      { x: 320, y: 320 },
      { x: 400, y: 240 },
      { x: 720, y: 160 },
    ],
    [
      { x: 240, y: 760 },
      { x: 240, y: 600 },
      { x: 160, y: 520 },
      { x: 200, y: 440 },
      { x: 240, y: 360 },
      { x: 360, y: 280 },
      { x: 480, y: 160 },
    ],
    [
      { x: 240, y: 760 },
      { x: 400, y: 720 },
      { x: 440, y: 640 },
      { x: 520, y: 560 },
      { x: 640, y: 520 },
      { x: 760, y: 440 },
      { x: 720, y: 160 },
    ],
  ],
  gold: [
    [
      { x: 720, y: 780 },
      { x: 600, y: 760 },
      { x: 680, y: 640 },
      { x: 640, y: 520 },
      { x: 680, y: 440 },
      { x: 640, y: 360 },
      { x: 600, y: 280 },
      { x: 240, y: 160 },
    ],
    [
      { x: 720, y: 780 },
      { x: 680, y: 600 },
      { x: 640, y: 520 },
      { x: 560, y: 520 },
      { x: 480, y: 440 },
      { x: 440, y: 320 },
      { x: 400, y: 240 },
    ],
    [
      { x: 720, y: 780 },
      { x: 600, y: 760 },
      { x: 480, y: 720 },
      { x: 440, y: 640 },
      { x: 320, y: 520 },
      { x: 200, y: 440 },
      { x: 240, y: 280 },
    ],
  ],
};
for (const [team, routes] of Object.entries(roomBreachRoutes)) {
  roomBreachRoutes[team] = routes.map((route) => route.map(scaleRoomPoint));
}

const audioState = {
  context: null,
  enabled: false,
  noiseBuffer: null,
  gunshotBuffers: {},
  gunshotLoadPromises: {},
};

const gunshotAudioFiles = {
  pistol: "assets/audio/gunshots/pistol.wav",
  shotgun: "assets/audio/gunshots/shotgun.wav",
  sniper: "assets/audio/gunshots/sniper.wav",
  machineGun: "assets/audio/gunshots/machine-gun.wav",
};

const gunshotPlaybackConfig = {
  pistol: { offset: 0.24, duration: 0.44, volume: 0.34, playbackRate: 1.03 },
  shotgun: { offset: 0.1, duration: 0.55, volume: 0.4, playbackRate: 1 },
  sniper: { offset: 0.42, duration: 0.7, volume: 0.38, playbackRate: 0.96 },
  machineGun: { offset: 2.28, duration: 0.24, volume: 0.26, playbackRate: 1.12 },
};

const roomAssetFiles = {
  weapons: {
    pistol: "assets/images/room/weapons/pistol.png",
    shotgun: "assets/images/room/weapons/shotgun.png",
    sniper: "assets/images/room/weapons/sniper.png",
    machineGun: "assets/images/room/weapons/machine-gun.png",
  },
  characters: {
    red: {
      stand: "assets/images/room/characters/red-stand.png",
      gun: "assets/images/room/characters/red-gun.png",
      sniper: "assets/images/room/characters/red-sniper.png",
      machineGun: "assets/images/room/characters/red-machine.png",
    },
    blue: {
      stand: "assets/images/room/characters/blue-stand.png",
      gun: "assets/images/room/characters/blue-gun.png",
      sniper: "assets/images/room/characters/blue-sniper.png",
      machineGun: "assets/images/room/characters/blue-machine.png",
    },
    green: {
      stand: "assets/images/room/characters/blue-stand.png",
      gun: "assets/images/room/characters/blue-gun.png",
      sniper: "assets/images/room/characters/blue-sniper.png",
      machineGun: "assets/images/room/characters/blue-machine.png",
    },
    gold: {
      stand: "assets/images/room/characters/red-stand.png",
      gun: "assets/images/room/characters/red-gun.png",
      sniper: "assets/images/room/characters/red-sniper.png",
      machineGun: "assets/images/room/characters/red-machine.png",
    },
  },
};

const roomAssets = {
  weapons: {},
  characters: {
    red: {},
    blue: {},
    green: {},
    gold: {},
  },
};

const weaponConfig = {
  pistol: {
    label: "PISTOL",
    icon: "P",
    color: "#f7f7ff",
    damage: 16,
    range: 260,
    cooldown: 0.55,
    projectileSpeed: 520,
    ammo: 3,
    pellets: 1,
    spread: 0,
    accuracySpread: 0.28,
    recoil: 70,
  },
  shotgun: {
    label: "SHOTGUN",
    icon: "S",
    color: "#ff9f1c",
    damage: 10,
    range: 190,
    cooldown: 1.05,
    projectileSpeed: 430,
    ammo: 2,
    pellets: 5,
    spread: 0.44,
    accuracySpread: 0.12,
    recoil: 135,
  },
  sniper: {
    label: "SNIPER",
    icon: "N",
    color: "#7bdff2",
    damage: 54,
    range: 470,
    cooldown: 1.55,
    projectileSpeed: 760,
    ammo: 1,
    pellets: 1,
    spread: 0,
    accuracySpread: 0.015,
    recoil: 210,
  },
  machineGun: {
    label: "MACHINE GUN",
    icon: "M",
    color: "#c77dff",
    damage: 8,
    range: 280,
    cooldown: 0.12,
    projectileSpeed: 560,
    ammo: 5,
    pellets: 1,
    spread: 0,
    accuracySpread: 0.45,
    recoil: 45,
  },
};

const pickupConfig = {
  pistol: {
    label: "手槍",
    icon: "P",
    color: "#f7f7ff",
    weight: 3,
  },
  shotgun: {
    label: "散彈槍",
    icon: "S",
    color: "#ff9f1c",
    weight: 2,
  },
  sniper: {
    label: "狙擊槍",
    icon: "N",
    color: "#7bdff2",
    weight: 1,
  },
  machineGun: {
    label: "機關槍",
    icon: "M",
    color: "#c77dff",
    weight: 2,
  },
  gear: {
    label: "齒輪",
    icon: "G",
    color: "#3ddc97",
    weight: 2,
  },
  speedBoost: {
    label: "加速器",
    icon: "A",
    color: "#ffd166",
    weight: 2,
  },
};

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalizeVector(x, y) {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function colorWithAlpha(hexColor, alpha) {
  const value = hexColor.replace("#", "");
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function loadImageAsset(src) {
  const image = new Image();
  image.onload = () => drawGame();
  image.src = src;
  return image;
}

function loadRoomAssets() {
  for (const [type, src] of Object.entries(roomAssetFiles.weapons)) {
    roomAssets.weapons[type] = loadImageAsset(src);
  }

  for (const [team, variants] of Object.entries(roomAssetFiles.characters)) {
    for (const [variant, src] of Object.entries(variants)) {
      roomAssets.characters[team][variant] = loadImageAsset(src);
    }
  }
}

function isRoomMode() {
  return state.battleMode === "room";
}

function getActiveTeams() {
  return isRoomMode() ? roomTeams : baseTeams;
}

function createRoomDoors() {
  return roomMap.doors.map((door, index) => {
    const orientation = door.height > door.width ? "vertical" : "horizontal";
    const panelLength = orientation === "vertical" ? door.height : door.width;
    const panelThickness = orientation === "vertical" ? door.width : door.height;
    const roomDoor = {
      ...door,
      id: `door-${index}`,
      closedX: door.x,
      closedY: door.y,
      closedWidth: door.width,
      closedHeight: door.height,
      panelLength,
      panelThickness,
      orientation,
      openAmount: 0,
      openVelocity: 0,
      openDirection: index % 2 === 0 ? 1 : -1,
    };

    updateRoomDoorRect(roomDoor);
    return roomDoor;
  });
}

function getRoomDoorGeometry(door) {
  const amount = clamp(door.openAmount, 0, 1);
  const direction = door.openDirection || 1;
  const length = door.panelLength ?? Math.max(door.closedWidth, door.closedHeight);
  const thickness = door.panelThickness ?? Math.min(door.closedWidth, door.closedHeight);
  const halfThickness = thickness / 2;

  if (door.orientation === "vertical") {
    const hinge = {
      x: door.closedX + door.closedWidth / 2,
      y: door.closedY,
    };
    const angle = Math.PI / 2 - direction * (Math.PI / 2) * amount;
    return { hinge, angle, length, thickness, halfThickness };
  }

  const hinge = {
    x: door.closedX,
    y: door.closedY + door.closedHeight / 2,
  };
  const angle = direction * (Math.PI / 2) * amount;
  return { hinge, angle, length, thickness, halfThickness };
}

function getDoorPanelCorners(door) {
  const { hinge, angle, length, halfThickness } = getRoomDoorGeometry(door);
  const forward = { x: Math.cos(angle), y: Math.sin(angle) };
  const side = { x: -forward.y, y: forward.x };
  const end = {
    x: hinge.x + forward.x * length,
    y: hinge.y + forward.y * length,
  };

  return [
    { x: hinge.x + side.x * halfThickness, y: hinge.y + side.y * halfThickness },
    { x: end.x + side.x * halfThickness, y: end.y + side.y * halfThickness },
    { x: end.x - side.x * halfThickness, y: end.y - side.y * halfThickness },
    { x: hinge.x - side.x * halfThickness, y: hinge.y - side.y * halfThickness },
  ];
}

function getDoorPanelBounds(door) {
  const corners = getDoorPanelCorners(door);
  const xs = corners.map((corner) => corner.x);
  const ys = corners.map((corner) => corner.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function updateRoomDoorRect(door) {
  const bounds = getDoorPanelBounds(door);
  door.x = bounds.x;
  door.y = bounds.y;
  door.width = bounds.width;
  door.height = bounds.height;
}

function getRoomDoors() {
  return state.roomDoors.length > 0 ? state.roomDoors : roomMap.doors;
}

function getRoomObstacles() {
  return [...roomMap.walls, ...getRoomDoors()];
}

function getRectCenter(rect) {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

function rectContainsPoint(rect, point, padding = 0) {
  return point.x >= rect.x + padding
    && point.x <= rect.x + rect.width - padding
    && point.y >= rect.y + padding
    && point.y <= rect.y + rect.height - padding;
}

function circleOverlapsRect(circle, rect, padding = 0) {
  const nearestX = clamp(circle.x, rect.x - padding, rect.x + rect.width + padding);
  const nearestY = clamp(circle.y, rect.y - padding, rect.y + rect.height + padding);
  return Math.hypot(circle.x - nearestX, circle.y - nearestY) <= circle.radius;
}

function randomPointInArena(padding = 34) {
  if (isRoomMode()) {
    return randomPointInRoomMap(padding);
  }

  const angle = randomBetween(0, Math.PI * 2);
  const radius = Math.sqrt(Math.random()) * (state.arena.radius - padding);

  return {
    x: state.arena.x + Math.cos(angle) * radius,
    y: state.arena.y + Math.sin(angle) * radius,
  };
}

function isPointInRoomMap(point, padding = 24) {
  if (!rectContainsPoint(roomMap.bounds, point, padding)) {
    return false;
  }

  return !getRoomObstacles().some((obstacle) => {
    return circleOverlapsRect({ ...point, radius: padding }, obstacle);
  });
}

function randomPointInRect(rect, padding = 24) {
  return {
    x: randomBetween(rect.x + padding, rect.x + rect.width - padding),
    y: randomBetween(rect.y + padding, rect.y + rect.height - padding),
  };
}

function getRoomSpawnZone(team, squadIndex = 0) {
  const zones = roomMap.spawnZones[team] ?? [roomMap.bounds];
  return zones[squadIndex % zones.length];
}

function randomPointInRoomMap(padding = 28, team = null, squadIndex = 0) {
  const zones = team ? [getRoomSpawnZone(team, squadIndex)] : null;

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const sourceRects = zones ?? [roomMap.bounds];
    const rect = sourceRects[Math.floor(Math.random() * sourceRects.length)];
    const point = randomPointInRect(rect, padding);

    if (isPointInRoomMap(point, padding)) {
      return point;
    }
  }

  return getRectCenter(team ? roomMap.spawnZones[team][0] : roomMap.bounds);
}

function randomPickupPointInRoom(padding = 42) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const zone = roomPickupZones[Math.floor(Math.random() * roomPickupZones.length)];
    const point = randomPointInRect(zone, padding);

    if (isPointInRoomMap(point, padding)) {
      return point;
    }
  }

  return randomPointInRoomMap(padding);
}

function getRoomPatrolPoints() {
  const doorPoints = getRoomDoors().flatMap((door) => {
    const center = getRectCenter(door);
    const isVertical = door.height > door.width;
    const offset = 58;

    return isVertical
      ? [
        { x: center.x - offset, y: center.y },
        { x: center.x + offset, y: center.y },
      ]
      : [
        { x: center.x, y: center.y - offset },
        { x: center.x, y: center.y + offset },
      ];
  });

  const roomCenters = [
    ...roomPickupZones.map(getRectCenter),
    { x: roomMap.bounds.x + roomMap.bounds.width / 2, y: roomMap.bounds.y + 126 },
    getRectCenter(roomMap.bounds),
    { x: roomMap.bounds.x + roomMap.bounds.width / 2, y: roomMap.bounds.y + roomMap.bounds.height - 126 },
  ];

  return [...doorPoints, ...roomCenters].filter((point) => isPointInRoomMap(point, 28));
}

function chooseRoomPatrolPoint(ball) {
  const patrolPoints = getRoomPatrolPoints().filter((point) => distanceBetween(ball, point) > 80);

  if (patrolPoints.length > 0 && Math.random() < 0.72) {
    return patrolPoints[Math.floor(Math.random() * patrolPoints.length)];
  }

  return randomPointInRoomMap(34);
}

function getRoomCoverPoints() {
  const wallCoverPoints = roomMap.walls.flatMap((wall) => {
    const center = getRectCenter(wall);
    const vertical = wall.height > wall.width;
    const offset = 54;

    return vertical
      ? [
        { x: wall.x - offset, y: center.y - 72 },
        { x: wall.x - offset, y: center.y + 72 },
        { x: wall.x + wall.width + offset, y: center.y - 72 },
        { x: wall.x + wall.width + offset, y: center.y + 72 },
      ]
      : [
        { x: center.x - 82, y: wall.y - offset },
        { x: center.x + 82, y: wall.y - offset },
        { x: center.x - 82, y: wall.y + wall.height + offset },
        { x: center.x + 82, y: wall.y + wall.height + offset },
      ];
  });

  const cornerPoints = roomPickupZones.flatMap((zone) => [
    { x: zone.x + 42, y: zone.y + 42 },
    { x: zone.x + zone.width - 42, y: zone.y + zone.height - 42 },
  ]);

  return [...wallCoverPoints, ...cornerPoints, ...getRoomPatrolPoints()]
    .filter((point) => isPointInRoomMap(point, 30));
}

function getVisibleEnemiesFromPoint(point, team) {
  return state.balls.filter((ball) => {
    return ball.alive
      && ball.team !== team
      && distanceBetween(point, ball) < 360
      && hasLineOfSight(point, ball);
  });
}

function isPointVisibleToEnemies(point, team, maxDistance = 430) {
  return state.balls.some((ball) => {
    return ball.alive
      && ball.team !== team
      && distanceBetween(ball, point) <= maxDistance
      && hasLineOfSight(ball, point);
  });
}

function findPriorityWeaponPickup(ball) {
  const weaponPickups = state.pickups.filter((pickup) => weaponConfig[pickup.type]);

  if (weaponPickups.length === 0) {
    return null;
  }

  return weaponPickups
    .map((pickup) => {
      const distance = distanceBetween(ball, pickup);
      const visibilityPenalty = hasLineOfSight(ball, pickup) ? 0 : 120;
      const enemySightPenalty = isPointVisibleToEnemies(pickup, ball.team, 360) ? 60 : 0;

      return {
        pickup,
        score: distance + visibilityPenalty + enemySightPenalty,
      };
    })
    .sort((a, b) => a.score - b.score)[0].pickup;
}

function getWeaponApproachPoint(ball, pickup) {
  if (hasLineOfSight(ball, pickup)) {
    return pickup;
  }

  const approachPoints = [...getRoomPatrolPoints(), ...getRoomCoverPoints()]
    .filter((point) => hasLineOfSight(point, pickup))
    .map((point) => ({
      point,
      score: distanceBetween(ball, point) * 0.7 + distanceBetween(point, pickup),
    }))
    .sort((a, b) => a.score - b.score);

  return approachPoints[0]?.point ?? chooseRoomEscapePoint(ball);
}

function shouldUnarmedEscape(ball, target, weaponPickup) {
  if (!target) {
    return false;
  }

  const enemyDistance = distanceBetween(ball, target);
  if (!target.weapon && enemyDistance <= 240) {
    return true;
  }

  if (enemyDistance > 170) {
    return false;
  }

  if (!weaponPickup) {
    return true;
  }

  const weaponDistance = distanceBetween(ball, weaponPickup);
  return weaponDistance > enemyDistance || isPointVisibleToEnemies(weaponPickup, ball.team, 300);
}

function setRoomAction(ball, action, point = null, duration = 1) {
  ball.roomAction = action;
  ball.patrolPoint = point;
  ball.awarenessTimer = duration;
}

function shouldRefreshRoomAction(ball, action, point = null, closeDistance = 34) {
  if (ball.roomAction !== action || ball.awarenessTimer <= 0 || !ball.patrolPoint) {
    return true;
  }

  return point ? distanceBetween(ball.patrolPoint, point) > closeDistance : distanceBetween(ball, ball.patrolPoint) < closeDistance;
}

function moveRoomAction(ball, action, point, speed, deltaSeconds, duration = 1) {
  if (shouldRefreshRoomAction(ball, action, point)) {
    setRoomAction(ball, action, point, duration);
  }

  moveRoomBallToward(ball, ball.patrolPoint, speed, deltaSeconds);
  keepRoomSpacing(ball, deltaSeconds);
}

function getRoomRoute(ball) {
  const routes = roomBreachRoutes[ball.team] ?? [];
  return routes[ball.roomRouteIndex % routes.length] ?? routes[0] ?? [];
}

function getRoomSquadEntryPoint(ball) {
  const route = getRoomRoute(ball);
  if (route.length === 0) {
    return getRectCenter(roomMap.bounds);
  }

  const waypointIndex = clamp(ball.roomWaypointIndex ?? 0, 0, route.length - 1);
  const objective = route[waypointIndex];
  const nextObjective = route[Math.min(waypointIndex + 1, route.length - 1)] ?? objective;
  const forward = normalizeVector(nextObjective.x - objective.x, nextObjective.y - objective.y);
  const side = normalizeVector(-forward.y, forward.x);
  const routeMateIndex = Math.floor(ball.squadIndex / Math.max(roomBreachRoutes[ball.team]?.length ?? 1, 1));
  const lane = (routeMateIndex % 3) - 1;
  const file = Math.floor(routeMateIndex / 3);

  const entryPoint = {
    x: objective.x + side.x * lane * 22 - forward.x * file * 28,
    y: objective.y + side.y * lane * 22 - forward.y * file * 28,
  };

  return isPointInRoomMap(entryPoint, ball.radius + 4) ? entryPoint : objective;
}

function updateRoomSquadWaypoint(ball) {
  const route = getRoomRoute(ball);

  if (!route || ball.roomWaypointIndex >= route.length - 1) {
    return;
  }

  const objective = route[ball.roomWaypointIndex];
  if (distanceBetween(ball, objective) < 58) {
    ball.roomWaypointIndex += 1;
    const nextObjective = route[Math.min(ball.roomWaypointIndex, route.length - 1)];
    const scanDirection = normalizeVector(nextObjective.x - ball.x, nextObjective.y - ball.y);
    ball.lookAngle = Math.atan2(scanDirection.y, scanDirection.x);
    ball.stopTimer = Math.max(ball.stopTimer ?? 0, randomBetween(0.18, 0.42));
    ball.awarenessTimer = 0;
  }
}

function getRoomHomeBias(team, point) {
  const spawnCenter = getRectCenter(getRoomSpawnZone(team, 0));
  const horizontalBias = spawnCenter.x < roomMap.bounds.x + roomMap.bounds.width / 2
    ? clamp((roomMap.bounds.x + roomMap.bounds.width - point.x) / roomMap.bounds.width, 0, 1)
    : clamp((point.x - roomMap.bounds.x) / roomMap.bounds.width, 0, 1);
  const verticalBias = spawnCenter.y < roomMap.bounds.y + roomMap.bounds.height / 2
    ? clamp((roomMap.bounds.y + roomMap.bounds.height - point.y) / roomMap.bounds.height, 0, 1)
    : clamp((point.y - roomMap.bounds.y) / roomMap.bounds.height, 0, 1);

  return (horizontalBias + verticalBias) / 2;
}

function chooseRoomCoverPoint(ball) {
  const points = getRoomCoverPoints();
  const scoredPoints = points.map((point) => {
    const visibleEnemies = getVisibleEnemiesFromPoint(point, ball.team).length;
    const distance = distanceBetween(ball, point);
    const homeBias = getRoomHomeBias(ball.team, point);
    const score = visibleEnemies * 220 + distance * 0.45 - homeBias * 55 + Math.random() * 24;

    return { point, score };
  }).sort((a, b) => a.score - b.score);

  return scoredPoints[0]?.point ?? chooseRoomPatrolPoint(ball);
}

function chooseRoomAmbushPoint(ball) {
  const enemies = state.balls.filter((candidate) => candidate.alive && candidate.team !== ball.team);
  const points = getRoomCoverPoints();
  const scoredPoints = points.map((point) => {
    const closestEnemyDistance = enemies.reduce((closest, enemy) => {
      return Math.min(closest, distanceBetween(point, enemy));
    }, Infinity);
    const visibleEnemies = getVisibleEnemiesFromPoint(point, ball.team).length;
    const exposedPenalty = isPointVisibleToEnemies(point, ball.team) ? 800 : 0;
    const midRangeBonus = Math.abs(closestEnemyDistance - 190);
    const score = exposedPenalty + visibleEnemies * 260 + midRangeBonus + distanceBetween(ball, point) * 0.25 + Math.random() * 20;

    return { point, score };
  }).sort((a, b) => a.score - b.score);

  return scoredPoints[0]?.point ?? chooseRoomCoverPoint(ball);
}

function chooseRoomEscapePoint(ball) {
  const sampledPoints = [];
  for (let index = 0; index < 40; index += 1) {
    sampledPoints.push(randomPointInRoomMap(34));
  }

  const points = [...getRoomCoverPoints(), ...sampledPoints];
  const hiddenPoints = points.filter((point) => !isPointVisibleToEnemies(point, ball.team));
  const candidatePoints = hiddenPoints.length > 0 ? hiddenPoints : points;
  const enemies = state.balls.filter((candidate) => candidate.alive && candidate.team !== ball.team);
  const scoredPoints = candidatePoints.map((point) => {
    const visibleToEnemy = isPointVisibleToEnemies(point, ball.team);
    const closestEnemyDistance = enemies.reduce((closest, enemy) => {
      return Math.min(closest, distanceBetween(point, enemy));
    }, Infinity);
    const distanceFromBall = distanceBetween(ball, point);
    const score = (visibleToEnemy ? 1200 : 0)
      + distanceFromBall * 0.45
      - Math.min(closestEnemyDistance, 420) * 0.55
      + Math.random() * 18;

    return { point, score };
  }).sort((a, b) => a.score - b.score);

  return scoredPoints[0]?.point ?? chooseRoomAmbushPoint(ball);
}

function lineIntersectsRect(start, end, rect) {
  if (rectContainsPoint(rect, start) || rectContainsPoint(rect, end)) {
    return true;
  }

  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;
  const edges = [
    [{ x: left, y: top }, { x: right, y: top }],
    [{ x: right, y: top }, { x: right, y: bottom }],
    [{ x: right, y: bottom }, { x: left, y: bottom }],
    [{ x: left, y: bottom }, { x: left, y: top }],
  ];

  return edges.some(([edgeStart, edgeEnd]) => {
    return lineSegmentsIntersect(start, end, edgeStart, edgeEnd);
  });
}

function lineSegmentsIntersect(a, b, c, d) {
  const denominator = ((d.y - c.y) * (b.x - a.x)) - ((d.x - c.x) * (b.y - a.y));

  if (Math.abs(denominator) < 0.00001) {
    return false;
  }

  const ua = (((d.x - c.x) * (a.y - c.y)) - ((d.y - c.y) * (a.x - c.x))) / denominator;
  const ub = (((b.x - a.x) * (a.y - c.y)) - ((b.y - a.y) * (a.x - c.x))) / denominator;
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

function hasLineOfSight(start, end) {
  if (!isRoomMode()) {
    return true;
  }

  return !getRoomObstacles().some((obstacle) => lineIntersectsRect(start, end, obstacle));
}

function getCircleRectCollision(circle, rect) {
  const nearestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const nearestY = clamp(circle.y, rect.y, rect.y + rect.height);
  let dx = circle.x - nearestX;
  let dy = circle.y - nearestY;
  let distance = Math.hypot(dx, dy);

  if (distance >= circle.radius) {
    return null;
  }

  if (distance < 0.001) {
    const distances = [
      { value: Math.abs(circle.x - rect.x), nx: -1, ny: 0 },
      { value: Math.abs(rect.x + rect.width - circle.x), nx: 1, ny: 0 },
      { value: Math.abs(circle.y - rect.y), nx: 0, ny: -1 },
      { value: Math.abs(rect.y + rect.height - circle.y), nx: 0, ny: 1 },
    ].sort((a, b) => a.value - b.value);
    const side = distances[0];
    dx = side.nx;
    dy = side.ny;
    distance = 1;
  }

  const normalX = dx / distance;
  const normalY = dy / distance;
  const overlap = circle.radius - distance;

  return { normalX, normalY, overlap };
}

function resolveBallAgainstRect(ball, rect, options = {}) {
  const { bounce = true } = options;
  const collision = getCircleRectCollision(ball, rect);

  if (!collision) {
    return false;
  }

  const { normalX, normalY, overlap } = collision;
  ball.x += normalX * overlap;
  ball.y += normalY * overlap;

  const dot = ball.vx * normalX + ball.vy * normalY;
  if (dot < 0) {
    if (bounce) {
      ball.vx -= 2 * dot * normalX;
      ball.vy -= 2 * dot * normalY;
      ball.vx *= 0.9;
      ball.vy *= 0.9;
    } else {
      ball.vx -= dot * normalX;
      ball.vy -= dot * normalY;
      ball.vx *= 0.86;
      ball.vy *= 0.86;
    }
  }

  return true;
}

function pushRoomDoorFromBall(ball, door) {
  const collision = getCircleRectCollision(ball, door);

  if (!collision) {
    return false;
  }

  const doorCenter = getRectCenter(door);
  const side = door.orientation === "vertical"
    ? Math.sign(ball.x - doorCenter.x)
    : Math.sign(ball.y - doorCenter.y);
  door.openDirection = side || door.openDirection || 1;
  door.openVelocity = Math.min(3.2, door.openVelocity + 1.35 + collision.overlap * 0.08);
  door.openAmount = clamp(door.openAmount + 0.09, 0, 1);
  updateRoomDoorRect(door);
  return resolveBallAgainstRect(ball, door, { bounce: false });
}

function updateRoomDoors(deltaSeconds) {
  for (const door of state.roomDoors) {
    if (Math.abs(door.openVelocity) < 0.02) {
      door.openVelocity = 0;
      updateRoomDoorRect(door);
      continue;
    }

    door.openAmount = clamp(door.openAmount + door.openVelocity * deltaSeconds, 0, 1);
    door.openVelocity *= 0.78;
    updateRoomDoorRect(door);
  }
}

function resolveBallAgainstRoomMap(ball) {
  const { bounds } = roomMap;
  let touched = false;

  if (ball.x < bounds.x + ball.radius) {
    ball.x = bounds.x + ball.radius;
    ball.vx = Math.max(0, ball.vx) * 0.42;
    touched = true;
  } else if (ball.x > bounds.x + bounds.width - ball.radius) {
    ball.x = bounds.x + bounds.width - ball.radius;
    ball.vx = Math.min(0, ball.vx) * 0.42;
    touched = true;
  }

  if (ball.y < bounds.y + ball.radius) {
    ball.y = bounds.y + ball.radius;
    ball.vy = Math.max(0, ball.vy) * 0.42;
    touched = true;
  } else if (ball.y > bounds.y + bounds.height - ball.radius) {
    ball.y = bounds.y + bounds.height - ball.radius;
    ball.vy = Math.min(0, ball.vy) * 0.42;
    touched = true;
  }

  for (const wall of roomMap.walls) {
    touched = resolveBallAgainstRect(ball, wall, { bounce: false }) || touched;
  }

  for (const door of getRoomDoors()) {
    touched = pushRoomDoorFromBall(ball, door) || touched;
  }

  if (touched) {
    createImpact(ball.x, ball.y, "rgba(255, 255, 255, 0.72)", 2);
  }
}

function pickWeightedType(config) {
  const entries = Object.entries(config);
  const totalWeight = entries.reduce((total, [, item]) => total + item.weight, 0);
  let marker = randomBetween(0, totalWeight);

  for (const [type, item] of entries) {
    marker -= item.weight;
    if (marker <= 0) {
      return type;
    }
  }

  return entries[0][0];
}

function getPickupPool() {
  if (!isRoomMode()) {
    return pickupConfig;
  }

  return Object.fromEntries(
    Object.entries(pickupConfig)
      .filter(([type]) => type !== "speedBoost" && type !== "gear")
      .map(([type, config]) => {
        const weaponWeightBoost = weaponConfig[type] ? 1.45 : 1;
        return [type, { ...config, weight: config.weight * weaponWeightBoost }];
      }),
  );
}

function getAliveTeamCounts() {
  const teams = getActiveTeams();
  return state.balls.reduce((counts, ball) => {
    if (ball.alive) {
      counts[ball.team] += 1;
    }

    return counts;
  }, Object.fromEntries(teams.map((team) => [team, 0])));
}

function isTeamOutnumbered(team) {
  if (isRoomMode()) {
    return false;
  }

  const counts = getAliveTeamCounts();
  const strongestEnemyCount = Math.max(
    ...getActiveTeams()
      .filter((candidateTeam) => candidateTeam !== team)
      .map((candidateTeam) => counts[candidateTeam] ?? 0),
  );
  return strongestEnemyCount - (counts[team] ?? 0) >= 2;
}

function teamHasWeapon(team) {
  return state.balls.some((ball) => ball.alive && ball.team === team && ball.weapon);
}

function bothRoomTeamsHaveWeapons() {
  return getActiveTeams().every((team) => teamHasWeapon(team));
}

function getRoomStartingWeapon(index) {
  const loadout = ["pistol", "shotgun", "machineGun", "sniper"];
  return loadout[index % loadout.length];
}

function unlockAudio() {
  if (!audioState.context) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    audioState.context = new AudioContextClass();
  }

  if (audioState.context.state === "suspended") {
    audioState.context.resume();
  }

  audioState.enabled = true;
  preloadGunshotSounds();
}

function loadGunshotSound(type) {
  if (!audioState.context || !gunshotAudioFiles[type]) {
    return Promise.resolve(null);
  }

  if (audioState.gunshotBuffers[type]) {
    return Promise.resolve(audioState.gunshotBuffers[type]);
  }

  if (audioState.gunshotLoadPromises[type]) {
    return audioState.gunshotLoadPromises[type];
  }

  audioState.gunshotLoadPromises[type] = fetch(gunshotAudioFiles[type])
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load gunshot sound: ${type}`);
      }

      return response.arrayBuffer();
    })
    .then((arrayBuffer) => audioState.context.decodeAudioData(arrayBuffer))
    .then((audioBuffer) => {
      audioState.gunshotBuffers[type] = audioBuffer;
      return audioBuffer;
    })
    .catch(() => {
      delete audioState.gunshotLoadPromises[type];
      return null;
    });

  return audioState.gunshotLoadPromises[type];
}

function preloadGunshotSounds() {
  Object.keys(gunshotAudioFiles).forEach((type) => {
    loadGunshotSound(type);
  });
}

function playTone({ frequency, duration, type = "sine", volume = 0.05, slideTo = null }) {
  if (!audioState.enabled || !audioState.context) {
    return;
  }

  const audioContext = audioState.context;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);

  if (slideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function getNoiseBuffer() {
  const audioContext = audioState.context;

  if (!audioContext) {
    return null;
  }

  if (audioState.noiseBuffer) {
    return audioState.noiseBuffer;
  }

  const length = Math.floor(audioContext.sampleRate * 0.35);
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const output = buffer.getChannelData(0);

  for (let index = 0; index < length; index += 1) {
    output[index] = (Math.random() * 2 - 1) * (1 - index / length);
  }

  audioState.noiseBuffer = buffer;
  return buffer;
}

function playNoiseBurst({ duration, volume, filterFrequency, filterType = "bandpass" }) {
  if (!audioState.enabled || !audioState.context) {
    return;
  }

  const audioContext = audioState.context;
  const noiseBuffer = getNoiseBuffer();

  if (!noiseBuffer) {
    return;
  }

  const now = audioContext.currentTime;
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();

  source.buffer = noiseBuffer;
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFrequency, now);
  filter.Q.setValueAtTime(0.9, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  source.start(now);
  source.stop(now + duration + 0.02);
}

function playSyntheticGunshot(type) {
  const gunshotMap = {
    pistol: {
      crack: { duration: 0.085, volume: 0.16, filterFrequency: 1650 },
      boom: { frequency: 150, slideTo: 70, duration: 0.11, type: "triangle", volume: 0.08 },
    },
    shotgun: {
      crack: { duration: 0.15, volume: 0.22, filterFrequency: 980 },
      boom: { frequency: 95, slideTo: 42, duration: 0.2, type: "sawtooth", volume: 0.12 },
    },
    sniper: {
      crack: { duration: 0.105, volume: 0.2, filterFrequency: 2200 },
      boom: { frequency: 120, slideTo: 38, duration: 0.24, type: "sawtooth", volume: 0.1 },
    },
    machineGun: {
      crack: { duration: 0.055, volume: 0.13, filterFrequency: 1450 },
      boom: { frequency: 180, slideTo: 92, duration: 0.07, type: "square", volume: 0.055 },
    },
  };

  const gunshot = gunshotMap[type] ?? gunshotMap.pistol;
  playNoiseBurst(gunshot.crack);
  playTone(gunshot.boom);
}

function playGunshot(type) {
  if (!audioState.enabled || !audioState.context) {
    return;
  }

  const audioContext = audioState.context;
  const audioBuffer = audioState.gunshotBuffers[type];
  const playbackConfig = gunshotPlaybackConfig[type] ?? gunshotPlaybackConfig.pistol;

  if (!audioBuffer) {
    loadGunshotSound(type);
    playSyntheticGunshot(type);
    return;
  }

  const now = audioContext.currentTime;
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  const offset = Math.min(playbackConfig.offset, Math.max(audioBuffer.duration - 0.05, 0));
  const duration = Math.min(playbackConfig.duration, audioBuffer.duration - offset);

  source.buffer = audioBuffer;
  source.playbackRate.setValueAtTime(playbackConfig.playbackRate, now);
  gain.gain.setValueAtTime(playbackConfig.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.08);

  source.connect(gain);
  gain.connect(audioContext.destination);
  source.start(now, offset, duration);
  source.stop(now + duration + 0.1);
}

function playSound(name) {
  const soundMap = {
    pickup: { frequency: 620, slideTo: 920, duration: 0.08, type: "triangle", volume: 0.04 },
    speed: { frequency: 420, slideTo: 1200, duration: 0.16, type: "sawtooth", volume: 0.045 },
    hit: { frequency: 120, slideTo: 70, duration: 0.08, type: "sawtooth", volume: 0.04 },
    shield: { frequency: 760, slideTo: 460, duration: 0.12, type: "triangle", volume: 0.045 },
    win: { frequency: 520, slideTo: 880, duration: 0.2, type: "sine", volume: 0.045 },
  };

  const sound = soundMap[name];
  if (sound) {
    playTone(sound);
  }
}

function getBallsPerTeam() {
  return state.battleMode === "duel" ? 1 : Number(ballCountInput.value);
}

function getModeLabel() {
  if (state.battleMode === "duel") {
    return "個人戰";
  }

  if (state.battleMode === "room") {
    return "房間戰";
  }

  return "團體戰";
}

function updateRoomTeamPanels() {
  const activeTeams = getActiveTeams();
  for (const [team, elements] of Object.entries(teamStatusElements)) {
    elements.panel.classList.toggle("hidden", !activeTeams.includes(team));
  }
}

function syncModeControls() {
  const isDuel = state.battleMode === "duel";
  const isRoom = isRoomMode();
  groupModeButton.classList.toggle("active", !isDuel && !isRoom);
  duelModeButton.classList.toggle("active", isDuel);
  roomModeButton.classList.toggle("active", isRoom);
  ballCountInput.disabled = isDuel;
  ballCountValue.textContent = String(getBallsPerTeam());
  updateRoomTeamPanels();
  setRoom3DVisibility();
}

function resizeCanvas() {
  const size = 900;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  state.arena = {
    x: size / 2,
    y: size / 2,
    radius: size * 0.37,
    pulse: state.arena.pulse,
  };
}

function createBall(team, index, total) {
  const roomSpawn = isRoomMode() ? randomPointInRoomMap(34, team, index) : null;
  const startingWeaponType = isRoomMode() ? getRoomStartingWeapon(index) : null;
  const angle = (Math.PI * 2 * index) / total + (team === "red" ? 0 : Math.PI);
  const spread = randomBetween(90, 250);
  const x = roomSpawn?.x ?? state.arena.x + Math.cos(angle) * spread;
  const y = roomSpawn?.y ?? state.arena.y + Math.sin(angle) * spread;
  const direction = roomSpawn
    ? normalizeVector(roomMap.bounds.x + roomMap.bounds.width / 2 - x, roomMap.bounds.y + roomMap.bounds.height / 2 - y)
    : normalizeVector(
      state.arena.x - x + randomBetween(-140, 140),
      state.arena.y - y + randomBetween(-140, 140),
    );
  const baseSpeed = isRoomMode() ? randomBetween(72, 112) : randomBetween(145, 205);

  return {
    id: `${team}-${index}-${Date.now()}`,
    team,
    x,
    y,
    vx: direction.x * baseSpeed,
    vy: direction.y * baseSpeed,
    radius: randomBetween(15, 19),
    health: maxHealth,
    hitTimer: randomBetween(0, hitCooldown),
    weapon: startingWeaponType
      ? { type: startingWeaponType, ammo: weaponConfig[startingWeaponType].ammo }
      : null,
    weaponCooldown: isRoomMode() ? weaponReadyDelay : randomBetween(0, 0.5),
    shieldCharges: 0,
    speedBoostTimer: 0,
    alive: true,
    targetId: null,
    lookAngle: Math.atan2(direction.y, direction.x),
    awarenessTimer: randomBetween(0, 0.6),
    ambushMode: false,
    roomAction: "patrol",
    squadIndex: index,
    roomRouteIndex: isRoomMode() ? index % (roomBreachRoutes[team]?.length ?? 1) : 0,
    roomWaypointIndex: 0,
    stuckTimer: 0,
    stopTimer: 0,
    strafeSide: Math.random() < 0.5 ? -1 : 1,
    strafeTimer: randomBetween(0.8, 1.8),
    patrolPoint: roomSpawn ? randomPointInRoomMap(34) : null,
    trail: [],
  };
}

function resetGame() {
  const ballCount = getBallsPerTeam();
  state.balls = [];
  state.pickups = [];
  state.projectiles = [];
  state.particles = [];
  state.roomDoors = isRoomMode() ? createRoomDoors() : [];
  state.running = false;
  state.startedAt = 0;
  state.elapsedBeforePause = 0;
  state.lastFrameTime = 0;
  state.winner = null;
  state.nextPickupIn = 1.2;

  for (const team of getActiveTeams()) {
    for (let index = 0; index < ballCount; index += 1) {
      state.balls.push(createBall(team, index, ballCount));
    }
  }

  startButton.textContent = "開始";
  roundStatusElement.textContent = `${getModeLabel()} / LAST BALL STANDING`;
  winnerBanner.classList.add("hidden");
  syncModeControls();
  updateHud();
  drawGame();
}

function spawnPickup() {
  const pickupLimit = isRoomMode() ? maxRoomPickups : maxPickups;

  if (state.pickups.length >= pickupLimit) {
    return;
  }

  const type = pickWeightedType(getPickupPool());
  const position = isRoomMode() ? randomPickupPointInRoom(42) : randomPointInArena(42);

  state.pickups.push({
    id: `${type}-${Date.now()}-${Math.random()}`,
    type,
    x: position.x,
    y: position.y,
    radius: type === "gear" || type === "speedBoost" ? 20 : 21,
    age: 0,
    ttl: pickupLifetime,
  });
}

function seedRoomPickups() {
  const roomPickupCount = Math.min(maxRoomPickups, 8);

  for (let index = 0; index < roomPickupCount; index += 1) {
    spawnPickup();
  }
}

function updatePickupSpawner(deltaSeconds) {
  if (isRoomMode()) {
    state.pickups = [];
    state.nextPickupIn = 1.2;
    return;
  }

  state.nextPickupIn -= deltaSeconds;

  if (state.nextPickupIn <= 0) {
    spawnPickup();
    state.nextPickupIn = randomBetween(1.6, 3.2);
  }

  if (isRoomMode()) {
    return;
  }

  for (const pickup of state.pickups) {
    pickup.age += deltaSeconds;
  }

  state.pickups = state.pickups.filter((pickup) => pickup.age < (pickup.ttl ?? pickupLifetime));
}

function collectPickups() {
  for (const ball of state.balls) {
    if (!ball.alive) {
      continue;
    }

    const pickup = state.pickups.find((candidate) => {
      return distanceBetween(ball, candidate) <= ball.radius + candidate.radius;
    });

    if (!pickup) {
      continue;
    }

    applyPickup(ball, pickup);
    state.pickups = state.pickups.filter((candidate) => candidate.id !== pickup.id);
  }
}

function applyPickup(ball, pickup) {
  if (pickup.type === "gear") {
    ball.shieldCharges = Math.min(ball.shieldCharges + 1, 2);
    createImpact(ball.x, ball.y, pickupConfig.gear.color, 18);
    playSound("shield");
    return;
  }

  if (pickup.type === "speedBoost" && !isRoomMode()) {
    const speed = Math.hypot(ball.vx, ball.vy);
    const direction = normalizeVector(ball.vx, ball.vy);
    const boostedSpeed = Math.max(speed * 1.45, 300);
    ball.vx = direction.x * boostedSpeed;
    ball.vy = direction.y * boostedSpeed;
    ball.speedBoostTimer = speedBoostDuration;
    createImpact(ball.x, ball.y, pickupConfig.speedBoost.color, 22);
    playSound("speed");
    return;
  }

  if (pickup.type === "speedBoost") {
    return;
  }

  const weapon = weaponConfig[pickup.type];
  ball.weapon = {
    type: pickup.type,
    ammo: weapon.ammo,
  };
  ball.weaponCooldown = weaponReadyDelay;
  createImpact(ball.x, ball.y, weapon.color, 16);
  playSound("pickup");
}

function updateWeapons(deltaSeconds) {
  for (const ball of state.balls) {
    if (!ball.alive || !ball.weapon) {
      continue;
    }

    ball.weaponCooldown = Math.max(0, ball.weaponCooldown - deltaSeconds);
    const weapon = weaponConfig[ball.weapon.type];
    const target = findClosestEnemy(ball);

    if (!target || distanceBetween(ball, target) > weapon.range || ball.weaponCooldown > 0) {
      continue;
    }

    fireWeapon(ball, target, weapon);
    ball.weaponCooldown = weapon.cooldown;

    if (!isRoomMode()) {
      ball.weapon.ammo -= 1;
    }

    if (!isRoomMode() && ball.weapon.ammo <= 0) {
      ball.weapon = null;
    }
  }
}

function fireWeapon(ball, target, weapon) {
  const baseAngle = Math.atan2(target.y - ball.y, target.x - ball.x);
  const aimAngle = baseAngle + randomBetween(-weapon.accuracySpread, weapon.accuracySpread);
  const pelletCount = weapon.pellets;
  if (!isRoomMode()) {
    ball.vx -= Math.cos(baseAngle) * weapon.recoil;
    ball.vy -= Math.sin(baseAngle) * weapon.recoil;
  }

  for (let index = 0; index < pelletCount; index += 1) {
    const offset = pelletCount === 1
      ? 0
      : (index - (pelletCount - 1) / 2) * (weapon.spread / (pelletCount - 1));
    const angle = aimAngle + offset;

    state.projectiles.push({
      x: ball.x + Math.cos(angle) * (ball.radius + 8),
      y: ball.y + Math.sin(angle) * (ball.radius + 8),
      vx: Math.cos(angle) * weapon.projectileSpeed,
      vy: Math.sin(angle) * weapon.projectileSpeed,
      team: ball.team,
      damage: weapon.damage,
      color: weapon.color,
      radius: ball.weapon.type === "sniper" ? 4 : 3,
      life: weapon.range / weapon.projectileSpeed,
    });
  }

  createImpact(ball.x, ball.y, weapon.color, weapon.pellets + 3);
  playGunshot(ball.weapon.type);
}

function updateProjectiles(deltaSeconds) {
  for (const projectile of state.projectiles) {
    projectile.x += projectile.vx * deltaSeconds;
    projectile.y += projectile.vy * deltaSeconds;
    projectile.life -= deltaSeconds;

    if (isRoomMode()) {
      const insideBounds = rectContainsPoint(roomMap.bounds, projectile);
      const hitObstacle = getRoomObstacles().some((obstacle) => rectContainsPoint(obstacle, projectile));

      if (!insideBounds || hitObstacle) {
        projectile.life = 0;
        createImpact(projectile.x, projectile.y, "#ffffff", 3);
        continue;
      }
    } else if (distanceBetween(projectile, state.arena) > state.arena.radius) {
      projectile.life = 0;
      continue;
    }

    const target = state.balls.find((ball) => {
      return ball.alive
        && ball.team !== projectile.team
        && distanceBetween(ball, projectile) <= ball.radius + projectile.radius;
    });

    if (!target) {
      continue;
    }

    damageBall(target, projectile.damage, projectile.color);
    projectile.life = 0;
  }

  state.projectiles = state.projectiles.filter((projectile) => projectile.life > 0);
}

function toggleGame() {
  unlockAudio();

  if (state.winner) {
    resetGame();
  }

  state.running = !state.running;
  startButton.textContent = state.running ? "暫停" : "繼續";

  if (state.running) {
    state.startedAt = performance.now() - state.elapsedBeforePause;
    state.lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
  } else {
    state.elapsedBeforePause = performance.now() - state.startedAt;
  }
}

function updateHud() {
  const maxTeamHealth = getBallsPerTeam() * maxHealth;

  for (const team of getActiveTeams()) {
    const teamBalls = state.balls.filter((ball) => ball.alive && ball.team === team);
    const teamHealth = teamBalls.reduce((total, ball) => total + ball.health, 0);
    const elements = teamStatusElements[team];
    elements.count.textContent = teamBalls.length;
    elements.health.style.width = `${Math.max(0, (teamHealth / maxTeamHealth) * 100)}%`;
  }

  if (state.startedAt) {
    const elapsedMs = state.running
      ? performance.now() - state.startedAt
      : state.elapsedBeforePause;
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    timerElement.textContent = `${minutes}:${seconds}`;
  } else {
    timerElement.textContent = "00:00";
  }
}

function findClosestEnemy(ball) {
  let closest = null;
  let closestDistance = Infinity;

  for (const otherBall of state.balls) {
    if (!otherBall.alive || otherBall.team === ball.team) {
      continue;
    }

    if (!hasLineOfSight(ball, otherBall)) {
      continue;
    }

    const distance = distanceBetween(ball, otherBall);
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = otherBall;
    }
  }

  return closest;
}

function isCircleClearInRoom(circle) {
  if (!rectContainsPoint(roomMap.bounds, circle, circle.radius)) {
    return false;
  }

  return !roomMap.walls.some((wall) => circleOverlapsRect(circle, wall));
}

function rotateVector(vector, radians) {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos,
  };
}

function getRoomSteeringDirection(ball, desiredDirection) {
  const lookAhead = ball.radius + 34;
  const testCircle = (direction) => ({
    x: ball.x + direction.x * lookAhead,
    y: ball.y + direction.y * lookAhead,
    radius: ball.radius + 6,
  });

  if (isCircleClearInRoom(testCircle(desiredDirection))) {
    return desiredDirection;
  }

  const alternatives = [0.55, -0.55, 1.05, -1.05, Math.PI * 0.5, -Math.PI * 0.5]
    .map((angle) => rotateVector(desiredDirection, angle));

  return alternatives.find((direction) => isCircleClearInRoom(testCircle(direction))) ?? {
    x: -desiredDirection.x,
    y: -desiredDirection.y,
  };
}

function chooseRoomMovementPoint(ball, destination) {
  if (hasLineOfSight(ball, destination)) {
    return destination;
  }

  const currentDistance = distanceBetween(ball, destination);
  const navigationPoints = [...roomMazeWaypoints, ...getRoomPatrolPoints()]
    .filter((point) => {
      return distanceBetween(ball, point) > 36
        && isPointInRoomMap(point, ball.radius + 4)
        && hasLineOfSight(ball, point);
    });
  const forwardCandidates = navigationPoints.filter((point) => {
    return distanceBetween(point, destination) < currentDistance + 120;
  });
  const candidates = (forwardCandidates.length > 0 ? forwardCandidates : navigationPoints)
    .map((point) => {
      const enemySightPenalty = isPointVisibleToEnemies(point, ball.team, 340) ? 60 : 0;
      return {
        point,
        score: distanceBetween(point, destination)
          + distanceBetween(ball, point) * 0.38
          + enemySightPenalty
          + Math.random() * 14,
      };
    })
    .sort((a, b) => a.score - b.score);

  return candidates[0]?.point ?? (isPointInRoomMap(destination, ball.radius + 4) ? destination : chooseRoomPatrolPoint(ball));
}

function moveRoomBallToward(ball, point, speed, deltaSeconds) {
  const safePoint = isPointInRoomMap(point, ball.radius + 4) ? point : chooseRoomPatrolPoint(ball);
  const distance = distanceBetween(ball, safePoint);

  if ((ball.stopTimer ?? 0) > 0) {
    ball.vx *= 0.72;
    ball.vy *= 0.72;
    return;
  }

  if (distance < 8) {
    ball.vx *= 0.62;
    ball.vy *= 0.62;
    return;
  }

  const movementPoint = chooseRoomMovementPoint(ball, safePoint);
  const movementDistance = distanceBetween(ball, movementPoint);
  const desiredDirection = normalizeVector(movementPoint.x - ball.x, movementPoint.y - ball.y);
  ball.lookAngle = Math.atan2(desiredDirection.y, desiredDirection.x);
  const steeringDirection = getRoomSteeringDirection(ball, desiredDirection);
  const arrivalSpeed = Math.min(distance, movementDistance) < 70
    ? speed * clamp(Math.min(distance, movementDistance) / 70, 0.28, 1)
    : speed;
  const desiredVelocityX = steeringDirection.x * arrivalSpeed;
  const desiredVelocityY = steeringDirection.y * arrivalSpeed;
  const blend = Math.min(1, deltaSeconds * 4.4);

  ball.vx += (desiredVelocityX - ball.vx) * blend;
  ball.vy += (desiredVelocityY - ball.vy) * blend;
}

function keepRoomSpacing(ball, deltaSeconds) {
  for (const otherBall of state.balls) {
    if (!otherBall.alive || otherBall.id === ball.id) {
      continue;
    }

    const distance = distanceBetween(ball, otherBall);
    const preferredDistance = ball.team === otherBall.team ? 42 : 58;

    if (distance <= 0 || distance > preferredDistance) {
      continue;
    }

    const direction = normalizeVector(ball.x - otherBall.x, ball.y - otherBall.y);
    const spacingForce = (preferredDistance - distance) * 2.2;
    ball.vx += direction.x * spacingForce * deltaSeconds;
    ball.vy += direction.y * spacingForce * deltaSeconds;
  }
}

function applyRoomAwareness(ball, target, deltaSeconds) {
  ball.awarenessTimer = Math.max(0, ball.awarenessTimer - deltaSeconds);
  ball.strafeTimer = Math.max(0, ball.strafeTimer - deltaSeconds);
  ball.ambushMode = false;

  if (!ball.weapon) {
    const weaponPickup = findPriorityWeaponPickup(ball);

    if (shouldUnarmedEscape(ball, target, weaponPickup)) {
      if (
        ball.roomAction !== "escape"
        || ball.awarenessTimer <= 0
        || !ball.patrolPoint
        || isPointVisibleToEnemies(ball.patrolPoint, ball.team)
        || distanceBetween(ball, ball.patrolPoint) < 34
      ) {
        setRoomAction(ball, "escape", chooseRoomEscapePoint(ball), randomBetween(1.1, 1.8));
      }

      moveRoomBallToward(ball, ball.patrolPoint, 142, deltaSeconds);
      keepRoomSpacing(ball, deltaSeconds);
      return;
    }

    if (weaponPickup) {
      const approachPoint = getWeaponApproachPoint(ball, weaponPickup);
      moveRoomAction(ball, "arm", approachPoint, 152, deltaSeconds, 0.9);
      return;
    }

    if (target) {
      if (ball.roomAction !== "escape" || ball.awarenessTimer <= 0 || !ball.patrolPoint) {
        setRoomAction(ball, "escape", chooseRoomEscapePoint(ball), randomBetween(1.1, 1.8));
      }

      moveRoomBallToward(ball, ball.patrolPoint, 128, deltaSeconds);
      keepRoomSpacing(ball, deltaSeconds);
      return;
    }
  }

  if (target) {
    const distance = distanceBetween(ball, target);
    const weapon = ball.weapon ? weaponConfig[ball.weapon.type] : null;
    const preferredDistance = weapon ? weapon.range * 0.56 : 96;
    const direction = normalizeVector(target.x - ball.x, target.y - ball.y);
    const strafeDirection = normalizeVector(-direction.y, direction.x);
    if (ball.strafeTimer <= 0) {
      ball.strafeSide *= -1;
      ball.strafeTimer = randomBetween(1.1, 2.1);
    }

    const anchor = {
      x: ball.x + direction.x * (distance > preferredDistance ? 70 : -58) + strafeDirection.x * ball.strafeSide * 32,
      y: ball.y + direction.y * (distance > preferredDistance ? 70 : -58) + strafeDirection.y * ball.strafeSide * 32,
    };

    setRoomAction(ball, "engage", null, 0.4);
    moveRoomBallToward(ball, anchor, weapon ? 132 : 146, deltaSeconds);
    keepRoomSpacing(ball, deltaSeconds);
    return;
  }

  updateRoomSquadWaypoint(ball);
  moveRoomAction(ball, "breach", getRoomSquadEntryPoint(ball), 126, deltaSeconds, 1.2);
}

function steerTowardTargets(deltaSeconds) {
  const speedModifier = Number(speedInput.value) / 100;

  for (const ball of state.balls) {
    if (!ball.alive) {
      continue;
    }

    const target = findClosestEnemy(ball);
    ball.targetId = (ball.weapon || isRoomMode()) ? target?.id ?? null : null;
    ball.speedBoostTimer = Math.max(0, ball.speedBoostTimer - deltaSeconds);
    ball.stopTimer = Math.max(0, (ball.stopTimer ?? 0) - deltaSeconds);
    ball.vx *= 1 - 0.012 * deltaSeconds;
    ball.vy *= 1 - 0.012 * deltaSeconds;

    if (isRoomMode()) {
      applyRoomAwareness(ball, target, deltaSeconds);
    }

    const boostMultiplier = !isRoomMode() && ball.speedBoostTimer > 0 ? speedBoostMultiplier : 1;
    const maxSpeed = (isRoomMode() ? 168 : 245) * speedModifier * boostMultiplier;
    const minSpeed = (isRoomMode() ? 0 : 105) * speedModifier;
    const updatedSpeed = Math.hypot(ball.vx, ball.vy);

    if (updatedSpeed > maxSpeed) {
      ball.vx = (ball.vx / updatedSpeed) * maxSpeed;
      ball.vy = (ball.vy / updatedSpeed) * maxSpeed;
    } else if (updatedSpeed < minSpeed) {
      const direction = normalizeVector(ball.vx, ball.vy);
      ball.vx = direction.x * minSpeed;
      ball.vy = direction.y * minSpeed;
    }
  }
}

function moveBalls(deltaSeconds) {
  for (const ball of state.balls) {
    if (!ball.alive) {
      continue;
    }

    const previousPosition = { x: ball.x, y: ball.y };
    ball.hitTimer = Math.max(0, ball.hitTimer - deltaSeconds);
    ball.x += ball.vx * deltaSeconds;
    ball.y += ball.vy * deltaSeconds;
    ball.trail.push({ x: ball.x, y: ball.y });

    if (ball.trail.length > 12) {
      ball.trail.shift();
    }

    if (isRoomMode()) {
      resolveBallAgainstRoomMap(ball);
      const targetDistance = ball.patrolPoint ? distanceBetween(ball, ball.patrolPoint) : 0;
      const movedDistance = distanceBetween(previousPosition, ball);

      if (targetDistance > 48 && movedDistance < 1.4) {
        ball.stuckTimer = (ball.stuckTimer ?? 0) + deltaSeconds;
      } else {
        ball.stuckTimer = Math.max(0, (ball.stuckTimer ?? 0) - deltaSeconds * 1.8);
      }

      if (ball.stuckTimer > 0.7) {
        ball.vx = 0;
        ball.vy = 0;
        ball.stopTimer = 0.24;
        ball.awarenessTimer = 0;
        ball.patrolPoint = chooseRoomPatrolPoint(ball);
        ball.stuckTimer = 0;
      }
      continue;
    }

    const fromCenter = normalizeVector(ball.x - state.arena.x, ball.y - state.arena.y);
    const distanceFromCenter = distanceBetween(ball, state.arena);
    const limit = state.arena.radius - ball.radius;

    if (distanceFromCenter > limit) {
      ball.x = state.arena.x + fromCenter.x * limit;
      ball.y = state.arena.y + fromCenter.y * limit;

      const dot = ball.vx * fromCenter.x + ball.vy * fromCenter.y;
      ball.vx -= 2 * dot * fromCenter.x;
      ball.vy -= 2 * dot * fromCenter.y;
      ball.vx *= 0.96;
      ball.vy *= 0.96;
      createImpact(ball.x, ball.y, "#ffffff", 4);
    }
  }
}

function resolveCollisions() {
  if (isRoomMode()) {
    return;
  }

  for (let firstIndex = 0; firstIndex < state.balls.length; firstIndex += 1) {
    const firstBall = state.balls[firstIndex];
    if (!firstBall.alive) {
      continue;
    }

    for (let secondIndex = firstIndex + 1; secondIndex < state.balls.length; secondIndex += 1) {
      const secondBall = state.balls[secondIndex];
      if (!secondBall.alive) {
        continue;
      }

      const dx = secondBall.x - firstBall.x;
      const dy = secondBall.y - firstBall.y;
      const distance = Math.hypot(dx, dy) || 1;
      const minDistance = firstBall.radius + secondBall.radius;

      if (distance >= minDistance) {
        continue;
      }

      const normalX = dx / distance;
      const normalY = dy / distance;
      const overlap = minDistance - distance;
      firstBall.x -= normalX * overlap * 0.5;
      firstBall.y -= normalY * overlap * 0.5;
      secondBall.x += normalX * overlap * 0.5;
      secondBall.y += normalY * overlap * 0.5;

      const relativeVelocityX = secondBall.vx - firstBall.vx;
      const relativeVelocityY = secondBall.vy - firstBall.vy;
      const impactSpeed = relativeVelocityX * normalX + relativeVelocityY * normalY;

      if (impactSpeed < 0) {
        const impulse = impactSpeed * -0.92;
        firstBall.vx -= normalX * impulse;
        firstBall.vy -= normalY * impulse;
        secondBall.vx += normalX * impulse;
        secondBall.vy += normalY * impulse;
      }

      if (firstBall.team !== secondBall.team) {
        handleHit(firstBall, secondBall);
      }
    }
  }

}

function handleHit(firstBall, secondBall) {
  if (firstBall.hitTimer > 0 || secondBall.hitTimer > 0) {
    return;
  }

  firstBall.hitTimer = hitCooldown;
  secondBall.hitTimer = hitCooldown;
  createImpact(firstBall.x, firstBall.y, teamConfig[secondBall.team].color, 4);
  createImpact(secondBall.x, secondBall.y, teamConfig[firstBall.team].color, 4);
}

function damageBall(ball, amount, color) {
  if (ball.shieldCharges > 0) {
    ball.shieldCharges -= 1;
    createImpact(ball.x, ball.y, pickupConfig.gear.color, 18);
    playSound("shield");
    return;
  }

  ball.health -= amount;
  createImpact(ball.x, ball.y, color, 8);
  playSound("hit");

  if (ball.health <= 0) {
    eliminateBall(ball);
  }
}

function eliminateBall(ball) {
  if (!ball.alive) {
    return;
  }

  ball.alive = false;
  createImpact(ball.x, ball.y, teamConfig[ball.team].color, 24);
}

function createImpact(x, y, color, count) {
  for (let index = 0; index < count; index += 1) {
    const angle = randomBetween(0, Math.PI * 2);
    const speed = randomBetween(60, 220);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      life: randomBetween(0.24, 0.62),
      maxLife: 0.62,
      radius: randomBetween(2, 5),
    });
  }
}

function updateParticles(deltaSeconds) {
  for (const particle of state.particles) {
    particle.x += particle.vx * deltaSeconds;
    particle.y += particle.vy * deltaSeconds;
    particle.vx *= 0.96;
    particle.vy *= 0.96;
    particle.life -= deltaSeconds;
  }

  state.particles = state.particles.filter((particle) => particle.life > 0);
}

function checkWinner() {
  const aliveTeams = getActiveTeams().filter((team) => {
    return state.balls.some((ball) => ball.alive && ball.team === team);
  });

  if (aliveTeams.length > 1) {
    return;
  }

  state.running = false;
  state.elapsedBeforePause = performance.now() - state.startedAt;
  state.winner = aliveTeams[0] ?? null;
  startButton.textContent = "開始";
  const winnerLabel = state.winner ? teamConfig[state.winner].label : "NO TEAM";
  roundStatusElement.textContent = `${winnerLabel} WINS`;
  winnerText.textContent = `${winnerLabel} WINS`;
  winnerBanner.classList.remove("hidden");
  playSound("win");
}

function drawRoomDoor(door) {
  const { hinge, angle, length } = getRoomDoorGeometry(door);
  const corners = getDoorPanelCorners(door);
  const closedAngle = door.orientation === "vertical" ? Math.PI / 2 : 0;

  context.save();
  context.strokeStyle = "rgba(255, 209, 102, 0.16)";
  context.lineWidth = 1.5;
  context.setLineDash([5, 7]);
  context.beginPath();
  context.arc(hinge.x, hinge.y, length, closedAngle, angle, angle < closedAngle);
  context.stroke();
  context.setLineDash([]);

  context.beginPath();
  context.moveTo(corners[0].x, corners[0].y);
  for (let index = 1; index < corners.length; index += 1) {
    context.lineTo(corners[index].x, corners[index].y);
  }
  context.closePath();
  context.fillStyle = "#7b8d99";
  context.fill();
  context.strokeStyle = "rgba(28, 56, 72, 0.6)";
  context.lineWidth = 2;
  context.stroke();

  context.beginPath();
  context.arc(hinge.x, hinge.y, 4, 0, Math.PI * 2);
  context.fillStyle = "#2c6075";
  context.fill();
  context.restore();
}

function drawBlueprintGrid(bounds) {
  context.fillStyle = "#f8f8f4";
  context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

  context.save();
  context.beginPath();
  context.rect(bounds.x, bounds.y, bounds.width, bounds.height);
  context.clip();

  for (let stepIndex = 0; stepIndex < 2; stepIndex += 1) {
    const spacing = stepIndex === 0 ? 16 : 80;
    context.strokeStyle = stepIndex === 0
      ? "rgba(80, 80, 80, 0.08)"
      : "rgba(80, 80, 80, 0.16)";
    context.lineWidth = stepIndex === 0 ? 0.8 : 1.1;

    for (let x = bounds.x; x <= bounds.x + bounds.width; x += spacing) {
      context.beginPath();
      context.moveTo(x, bounds.y);
      context.lineTo(x, bounds.y + bounds.height);
      context.stroke();
    }

    for (let y = bounds.y; y <= bounds.y + bounds.height; y += spacing) {
      context.beginPath();
      context.moveTo(bounds.x, y);
      context.lineTo(bounds.x + bounds.width, y);
      context.stroke();
    }
  }

  context.restore();
}

function drawBlueprintSite(site) {
  const { rect } = site;
  context.save();
  context.fillStyle = "rgba(245, 249, 250, 0.72)";
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  context.strokeStyle = "rgba(32, 62, 78, 0.4)";
  context.lineWidth = 2;
  context.setLineDash([8, 6]);
  context.strokeRect(rect.x, rect.y, rect.width, rect.height);
  context.setLineDash([]);

  context.fillStyle = "rgba(28, 56, 72, 0.9)";
  context.font = "900 24px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  const lines = site.label.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    context.fillText(lines[index], rect.x + rect.width / 2, rect.y + rect.height / 2 - 16 + index * 30);
  }
  context.restore();
}

function drawBlueprintArrow(points) {
  if (points.length < 2) {
    return;
  }

  context.save();
  context.strokeStyle = "rgba(40, 136, 86, 0.7)";
  context.fillStyle = "rgba(40, 136, 86, 0.76)";
  context.lineWidth = 5;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const point = points[index];
    const midX = (previous.x + point.x) / 2;
    const midY = (previous.y + point.y) / 2;
    context.quadraticCurveTo(previous.x, previous.y, midX, midY);
  }

  const end = points[points.length - 1];
  context.lineTo(end.x, end.y);
  context.stroke();

  const beforeEnd = points[points.length - 2];
  const angle = Math.atan2(end.y - beforeEnd.y, end.x - beforeEnd.x);
  context.beginPath();
  context.moveTo(end.x, end.y);
  context.lineTo(end.x - Math.cos(angle - 0.52) * 18, end.y - Math.sin(angle - 0.52) * 18);
  context.lineTo(end.x - Math.cos(angle + 0.52) * 18, end.y - Math.sin(angle + 0.52) * 18);
  context.closePath();
  context.fill();
  context.restore();
}

function drawBlueprintAnnotations(bounds) {
  for (const site of roomBlueprintSites) {
    drawBlueprintSite(site);
  }

  for (const route of roomBlueprintRoutes) {
    drawBlueprintArrow(route);
  }

  context.save();
  context.fillStyle = "rgba(32, 62, 78, 0.76)";
  context.font = "800 12px system-ui, sans-serif";
  context.textBaseline = "middle";

  for (const label of roomBlueprintLabels) {
    context.textAlign = "center";
    context.fillText(label.text, label.point.x, label.point.y);
  }

  context.fillStyle = "rgba(158, 57, 57, 0.82)";
  context.font = "900 12px system-ui, sans-serif";
  for (const entry of roomBlueprintEntries) {
    context.textAlign = entry.align;
    context.fillText(entry.text, entry.point.x, entry.point.y);
  }

  context.textAlign = "right";
  context.fillStyle = "rgba(24, 24, 24, 0.72)";
  context.font = "900 11px system-ui, sans-serif";
  context.fillText("CQB GRID ARENA", bounds.x + bounds.width - 18, bounds.y + bounds.height - 18);
  context.restore();
}

function drawRoomTacticalRoutes() {
  if (!showRoomAiRoutes) {
    return;
  }

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  for (const [team, routes] of Object.entries(roomBreachRoutes)) {
    const teamColor = teamConfig[team].color;

    routes.forEach((route, routeIndex) => {
      if (route.length < 2) {
        return;
      }

      context.beginPath();
      route.forEach((point, pointIndex) => {
        if (pointIndex === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });
      context.strokeStyle = colorWithAlpha(teamColor, routeIndex === 0 ? 0.46 : 0.12);
      context.lineWidth = routeIndex === 0 ? 5 : 2;
      context.setLineDash(routeIndex === 0 ? [] : [8, 16]);
      context.stroke();

      context.setLineDash([]);
      if (routeIndex !== 0) {
        return;
      }

      route.forEach((point, pointIndex) => {
        const radius = pointIndex === 0 ? 7 : 5;
        context.beginPath();
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.fillStyle = colorWithAlpha(teamColor, pointIndex === 0 ? 0.68 : 0.42);
        context.fill();
        context.strokeStyle = "rgba(255, 255, 255, 0.52)";
        context.lineWidth = 1;
        context.stroke();
      });
    });
  }

  context.restore();
}

function drawRoomMap() {
  context.clearRect(0, 0, 900, 900);
  const { bounds } = roomMap;

  context.save();
  drawBlueprintGrid(bounds);
  drawBlueprintAnnotations(bounds);
  drawRoomTacticalRoutes();

  context.lineWidth = 6;
  context.strokeStyle = "#101010";
  context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

  for (const wall of roomMap.walls) {
    context.fillStyle = wall.color ?? "#101010";
    context.fillRect(wall.x, wall.y, wall.width, wall.height);
    context.strokeStyle = "rgba(0, 0, 0, 0.18)";
    context.lineWidth = 1;
    context.strokeRect(wall.x, wall.y, wall.width, wall.height);
  }

  for (const door of getRoomDoors()) {
    drawRoomDoor(door);
  }

  context.restore();
}

function getThree() {
  return window.THREE;
}

function hasRoom3DSupport() {
  return Boolean(room3dStage && getThree() && !room3DState.failed);
}

function canCreateWebGLContext() {
  const testCanvas = document.createElement("canvas");
  const contextOptions = { antialias: false, alpha: false };
  const gl = testCanvas.getContext("webgl2", contextOptions)
    ?? testCanvas.getContext("webgl", contextOptions)
    ?? testCanvas.getContext("experimental-webgl", contextOptions);

  if (!gl) {
    return false;
  }

  gl.getExtension("WEBGL_lose_context")?.loseContext();
  return true;
}

function setRoom3DVisibility() {
  const isRoom = isRoomMode();
  const useRoom3D = isRoom && hasRoom3DSupport();

  document.body.classList.toggle("room-mode", isRoom);
  room3dStage?.classList.toggle("hidden", !useRoom3D);
  canvas.classList.toggle("hidden", useRoom3D);
}

function roomPointTo3D(point) {
  return {
    x: (point.x - roomScaleCenter.x) * room3DScale,
    z: (point.y - roomScaleCenter.y) * room3DScale,
  };
}

function roomRectTo3D(rect) {
  const center = roomPointTo3D(getRectCenter(rect));

  return {
    x: center.x,
    z: center.z,
    width: Math.max(0.45, rect.width * room3DScale),
    depth: Math.max(0.45, rect.height * room3DScale),
  };
}

function createRoom3DBox(rect, height, material, yOffset = 0) {
  const THREE = getThree();
  const box = roomRectTo3D(rect);
  const geometry = new THREE.BoxGeometry(box.width, height, box.depth);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(box.x, yOffset + height / 2, box.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addRoom3DWall(sceneGroup, rect, material) {
  const THREE = getThree();
  const wall = createRoom3DBox(rect, 4.2, material);
  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(wall.geometry),
    room3DState.materials.edge,
  );

  edge.position.copy(wall.position);
  sceneGroup.add(wall, edge);
}

function createRoom3DRouteGroup() {
  const THREE = getThree();
  const routeGroup = new THREE.Group();

  if (!showRoomAiRoutes) {
    return routeGroup;
  }

  for (const [team, routes] of Object.entries(roomBreachRoutes)) {
    const color = new THREE.Color(teamConfig[team].color);

    routes.forEach((route, routeIndex) => {
      if (route.length < 2) {
        return;
      }

      const linePoints = route.map((point) => {
        const position = roomPointTo3D(point);
        return new THREE.Vector3(position.x, 0.16 + routeIndex * 0.018, position.z);
      });
      const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: routeIndex === 0 ? 0.8 : 0.42,
      });
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePoints), material);
      routeGroup.add(line);

      route.forEach((point, pointIndex) => {
        const position = roomPointTo3D(point);
        const marker = new THREE.Mesh(
          new THREE.CylinderGeometry(pointIndex === 0 ? 0.36 : 0.24, pointIndex === 0 ? 0.36 : 0.24, 0.06, 18),
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: pointIndex === 0 ? 0.82 : 0.56,
          }),
        );

        marker.position.set(position.x, 0.2 + routeIndex * 0.02, position.z);
        routeGroup.add(marker);
      });
    });
  }

  return routeGroup;
}

function createRoom3DActor(ball) {
  const THREE = getThree();
  const group = new THREE.Group();
  const teamColor = new THREE.Color(teamConfig[ball.team].color);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: teamColor,
    roughness: 0.62,
    metalness: 0.04,
  });
  const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x29303a,
    roughness: 0.74,
    metalness: 0.08,
  });
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: teamColor,
    transparent: true,
    opacity: 0.5,
  });
  const radius = Math.max(0.9, ball.radius * room3DScale * 0.78);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.3, 0.055, 8, 32), ringMaterial);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.92, 0.7, 28), bodyMaterial);
  const head = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.35, 0.42, radius * 0.86), darkMaterial);
  const weapon = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.55, 0.16, 0.16), darkMaterial);

  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.06;
  body.position.y = 0.48;
  body.castShadow = true;
  body.receiveShadow = true;
  head.position.set(radius * 0.16, 0.96, 0);
  head.castShadow = true;
  weapon.position.set(radius * 1.12, 0.82, 0);
  weapon.castShadow = true;

  group.add(ring, body, head, weapon);
  group.userData.bodyMaterial = bodyMaterial;
  group.userData.ringMaterial = ringMaterial;
  return group;
}

function ensureRoom3DScene() {
  if (!hasRoom3DSupport()) {
    return false;
  }

  if (room3DState.initialized) {
    return true;
  }

  const THREE = getThree();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc75a50);

  if (!canCreateWebGLContext()) {
    room3DState.failed = true;
    setRoom3DVisibility();
    return false;
  }

  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  } catch (error) {
    room3DState.failed = true;
    setRoom3DVisibility();
    return false;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ("outputColorSpace" in renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  room3dStage.textContent = "";
  room3dStage.appendChild(renderer.domElement);

  const camera = new THREE.OrthographicCamera(-44, 44, 34, -34, 0.1, 300);
  camera.position.set(46, 56, 62);
  camera.lookAt(0, 0, 0);

  const ambient = new THREE.HemisphereLight(0xfff0cf, 0x803b39, 2.2);
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.25);
  keyLight.position.set(22, 42, 28);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 110;
  keyLight.shadow.camera.left = -48;
  keyLight.shadow.camera.right = 48;
  keyLight.shadow.camera.top = 48;
  keyLight.shadow.camera.bottom = -48;
  scene.add(ambient, keyLight);

  room3DState.materials = {
    floor: new THREE.MeshStandardMaterial({ color: 0xf6d889, roughness: 0.72, metalness: 0.02 }),
    floorSide: new THREE.MeshStandardMaterial({ color: 0xa14a58, roughness: 0.78, metalness: 0.02 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xd77559, roughness: 0.7, metalness: 0.02 }),
    outerWall: new THREE.MeshStandardMaterial({ color: 0xbf5b4f, roughness: 0.72, metalness: 0.02 }),
    edge: new THREE.LineBasicMaterial({ color: 0x8e3f45, transparent: true, opacity: 0.32 }),
    projectile: new THREE.MeshBasicMaterial({ color: 0xfff2a3 }),
  };

  const mapGroup = new THREE.Group();
  const routeGroup = createRoom3DRouteGroup();
  const actorGroup = new THREE.Group();
  const projectileGroup = new THREE.Group();
  const floorBox = roomRectTo3D(roomMap.bounds);
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(floorBox.width + 5.2, 0.72, floorBox.depth + 5.2),
    room3DState.materials.floor,
  );
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(floorBox.width + 6.5, 1.1, floorBox.depth + 6.5),
    room3DState.materials.floorSide,
  );
  const grid = new THREE.GridHelper(Math.max(floorBox.width, floorBox.depth) + 4.8, 32, 0xd6bd82, 0xeed99d);
  const boundary = [
    { x: roomMap.bounds.x - 8, y: roomMap.bounds.y - 8, width: roomMap.bounds.width + 16, height: 10 },
    { x: roomMap.bounds.x - 8, y: roomMap.bounds.y + roomMap.bounds.height - 2, width: roomMap.bounds.width + 16, height: 10 },
    { x: roomMap.bounds.x - 8, y: roomMap.bounds.y - 8, width: 10, height: roomMap.bounds.height + 16 },
    { x: roomMap.bounds.x + roomMap.bounds.width - 2, y: roomMap.bounds.y - 8, width: 10, height: roomMap.bounds.height + 16 },
  ];

  base.position.y = -0.82;
  base.receiveShadow = true;
  floor.position.y = -0.36;
  floor.receiveShadow = true;
  grid.position.y = 0.04;
  grid.material.transparent = true;
  grid.material.opacity = 0.32;
  mapGroup.add(base, floor, grid);

  for (const wall of boundary) {
    addRoom3DWall(mapGroup, wall, room3DState.materials.outerWall);
  }

  for (const wall of roomMap.walls) {
    addRoom3DWall(mapGroup, wall, room3DState.materials.wall);
  }

  scene.add(mapGroup, routeGroup, actorGroup, projectileGroup);

  room3DState.initialized = true;
  room3DState.renderer = renderer;
  room3DState.scene = scene;
  room3DState.camera = camera;
  room3DState.routeGroup = routeGroup;
  room3DState.actorGroup = actorGroup;
  room3DState.projectileGroup = projectileGroup;
  resizeRoom3DRenderer();
  return true;
}

function resizeRoom3DRenderer() {
  if (!room3DState.initialized || !room3dStage) {
    return;
  }

  const width = Math.max(2, Math.floor(room3dStage.clientWidth));
  const height = Math.max(2, Math.floor(room3dStage.clientHeight));

  if (width === room3DState.lastWidth && height === room3DState.lastHeight) {
    return;
  }

  const aspect = width / height;
  const viewHeight = 74;
  room3DState.lastWidth = width;
  room3DState.lastHeight = height;
  room3DState.renderer.setSize(width, height, false);
  room3DState.camera.left = -viewHeight * aspect / 2;
  room3DState.camera.right = viewHeight * aspect / 2;
  room3DState.camera.top = viewHeight / 2;
  room3DState.camera.bottom = -viewHeight / 2;
  room3DState.camera.updateProjectionMatrix();
}

function updateRoom3DActors() {
  const liveIds = new Set();

  for (const ball of state.balls) {
    if (!ball.alive) {
      continue;
    }

    liveIds.add(ball.id);
    let actor = room3DState.actorMeshes.get(ball.id);
    if (!actor) {
      actor = createRoom3DActor(ball);
      room3DState.actorMeshes.set(ball.id, actor);
      room3DState.actorGroup.add(actor);
    }

    const point = roomPointTo3D(ball);
    actor.position.set(point.x, 0, point.z);
    actor.rotation.y = -getWeaponAimAngle(ball);
    actor.visible = true;
  }

  for (const [id, actor] of room3DState.actorMeshes.entries()) {
    if (liveIds.has(id)) {
      continue;
    }

    room3DState.actorGroup.remove(actor);
    room3DState.actorMeshes.delete(id);
  }
}

function updateRoom3DProjectiles() {
  const THREE = getThree();
  const group = room3DState.projectileGroup;

  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  for (const projectile of state.projectiles) {
    const point = roomPointTo3D(projectile);
    const angle = Math.atan2(projectile.vy, projectile.vx);
    const shot = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.12, 0.12),
      room3DState.materials.projectile,
    );

    shot.position.set(point.x, 1.2, point.z);
    shot.rotation.y = -angle;
    group.add(shot);
  }
}

function renderRoom3D() {
  if (!ensureRoom3DScene()) {
    return false;
  }

  resizeRoom3DRenderer();
  updateRoom3DActors();
  updateRoom3DProjectiles();
  room3DState.renderer.render(room3DState.scene, room3DState.camera);
  return true;
}

function drawArena() {
  if (isRoomMode()) {
    drawRoomMap();
    return;
  }

  context.clearRect(0, 0, 900, 900);
  context.save();
  context.translate(state.arena.x, state.arena.y);

  const pulseRadius = state.arena.radius + Math.sin(state.arena.pulse) * 4;
  context.beginPath();
  context.arc(0, 0, pulseRadius, 0, Math.PI * 2);
  context.strokeStyle = "rgba(255, 255, 255, 0.78)";
  context.lineWidth = 5;
  context.stroke();

  context.beginPath();
  context.arc(0, 0, pulseRadius + 45, 0, Math.PI * 2);
  context.strokeStyle = "rgba(255, 255, 255, 0.12)";
  context.lineWidth = 18;
  context.stroke();

  context.beginPath();
  context.arc(0, 0, pulseRadius - 82, 0, Math.PI * 2);
  context.strokeStyle = "rgba(255, 209, 102, 0.18)";
  context.setLineDash([12, 16]);
  context.lineWidth = 2;
  context.stroke();
  context.setLineDash([]);

  context.restore();
}

function drawTargetLines() {
  if (isRoomMode()) {
    return;
  }

  context.save();
  context.lineWidth = 1;

  for (const ball of state.balls) {
    if (!ball.alive || !ball.targetId) {
      continue;
    }

    const target = state.balls.find((candidate) => candidate.id === ball.targetId);
    if (!target || !target.alive) {
      continue;
    }

    context.beginPath();
    context.moveTo(ball.x, ball.y);
    context.lineTo(target.x, target.y);
    context.strokeStyle = colorWithAlpha(teamConfig[ball.team].color, 0.16);
    context.stroke();
  }

  context.restore();
}

function drawWeaponIcon(type, x, y, size, color, rotation = 0) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.scale(size / 24, size / 24);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 1.8;

  const outline = "#34384a";
  const slide = "#5d6273";
  const slideDark = "#444a5d";
  const barrel = "#3a4052";
  const grip = "#b66a3e";
  const gripLight = "#d17b43";
  const trigger = "#202433";

  function fillAndStroke(fillColor = slide, strokeColor = outline) {
    context.fillStyle = fillColor;
    context.fill();
    context.strokeStyle = strokeColor;
    context.stroke();
  }

  function drawPistolFrame(length = 22, gripLean = 2) {
    context.beginPath();
    context.moveTo(-10, -7);
    context.lineTo(length - 9, -7);
    context.quadraticCurveTo(length - 5, -7, length - 5, -3);
    context.lineTo(length - 5, 0);
    context.lineTo(-5, 0);
    context.quadraticCurveTo(-8, 0, -9, 3);
    context.lineTo(-12, 9);
    context.lineTo(-15, 9);
    context.quadraticCurveTo(-17, 5, -15, 0);
    context.quadraticCurveTo(-12, -2, -10, -7);
    fillAndStroke(slide);

    context.fillStyle = slideDark;
    context.fillRect(-5, -7, 10, 4);

    context.fillStyle = barrel;
    context.fillRect(length - 13, -4, 8, 3);

    for (let offset = -7; offset <= -1; offset += 3) {
      context.beginPath();
      context.moveTo(offset, -5.5);
      context.lineTo(offset - 2, -1.2);
      context.strokeStyle = outline;
      context.lineWidth = 1.1;
      context.stroke();
    }

    context.beginPath();
    context.moveTo(-9, 0);
    context.lineTo(-3, 0);
    context.lineTo(-5 + gripLean, 12);
    context.quadraticCurveTo(-6 + gripLean, 15, -10, 15);
    context.lineTo(-16, 15);
    context.quadraticCurveTo(-18, 14, -17, 11);
    context.closePath();
    fillAndStroke(grip);

    context.fillStyle = gripLight;
    context.fillRect(-13.5, 2.2, 5, 10);

    context.beginPath();
    context.arc(-2.4, 3.2, 4.2, Math.PI * 0.1, Math.PI * 1.55);
    context.strokeStyle = outline;
    context.lineWidth = 2;
    context.stroke();

    context.beginPath();
    context.moveTo(-3, 2);
    context.quadraticCurveTo(-1, 5, -3, 7);
    context.strokeStyle = trigger;
    context.lineWidth = 1.8;
    context.stroke();
  }

  if (type === "pistol") {
    drawPistolFrame(22, 1.5);
  } else if (type === "shotgun") {
    context.beginPath();
    context.moveTo(-13, -6);
    context.lineTo(17, -6);
    context.lineTo(17, -2);
    context.lineTo(-7, -2);
    context.lineTo(-10, 2);
    context.lineTo(-15, 2);
    context.closePath();
    fillAndStroke(slide);

    context.fillStyle = barrel;
    context.fillRect(0, -3, 17, 3);
    context.fillStyle = slideDark;
    context.fillRect(-2, 0, 9, 5);

    context.beginPath();
    context.moveTo(-13, -2);
    context.lineTo(-19, 5);
    context.lineTo(-15, 8);
    context.lineTo(-7, 1);
    context.closePath();
    fillAndStroke(grip);

    context.beginPath();
    context.moveTo(-5, 2);
    context.lineTo(0, 2);
    context.lineTo(-1, 12);
    context.lineTo(-6, 12);
    context.closePath();
    fillAndStroke(gripLight);

    context.beginPath();
    context.arc(3, 3.5, 4, Math.PI * 0.15, Math.PI * 1.55);
    context.strokeStyle = outline;
    context.lineWidth = 1.8;
    context.stroke();
  } else if (type === "sniper") {
    context.beginPath();
    context.moveTo(-15, -5);
    context.lineTo(14, -5);
    context.lineTo(16, -2);
    context.lineTo(-4, -2);
    context.lineTo(-8, 2);
    context.lineTo(-15, 2);
    context.closePath();
    fillAndStroke(slide);

    context.fillStyle = barrel;
    context.fillRect(13, -4.3, 10, 2.8);

    context.beginPath();
    context.moveTo(-5, -9);
    context.lineTo(9, -9);
    context.lineWidth = 2.2;
    context.strokeStyle = outline;
    context.stroke();

    context.beginPath();
    context.rect(-2, -12, 8, 4);
    fillAndStroke(slideDark);

    context.beginPath();
    context.moveTo(-15, 0);
    context.lineTo(-21, 7);
    context.lineTo(-16, 10);
    context.lineTo(-8, 1);
    context.closePath();
    fillAndStroke(grip);

    context.beginPath();
    context.moveTo(-2, 1);
    context.lineTo(3, 1);
    context.lineTo(2, 12);
    context.lineTo(-3, 12);
    context.closePath();
    fillAndStroke(gripLight);
  } else if (type === "machineGun") {
    context.beginPath();
    context.moveTo(-15, -6);
    context.lineTo(13, -6);
    context.lineTo(16, -3);
    context.lineTo(16, 0);
    context.lineTo(-7, 0);
    context.lineTo(-10, 3);
    context.lineTo(-16, 3);
    context.closePath();
    fillAndStroke(slide);

    context.fillStyle = barrel;
    context.fillRect(12, -4.5, 10, 3);

    for (let offset = -9; offset <= 2; offset += 4) {
      context.beginPath();
      context.moveTo(offset, -5);
      context.lineTo(offset - 2, -1);
      context.strokeStyle = outline;
      context.lineWidth = 1.1;
      context.stroke();
    }

    context.beginPath();
    context.moveTo(-14, 1);
    context.lineTo(-20, 7);
    context.lineTo(-16, 10);
    context.lineTo(-8, 2);
    context.closePath();
    fillAndStroke(grip);

    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(7, 0);
    context.lineTo(5, 12);
    context.lineTo(0, 12);
    context.closePath();
    fillAndStroke(gripLight);

    context.beginPath();
    context.arc(-2, 3.6, 4, Math.PI * 0.1, Math.PI * 1.5);
    context.strokeStyle = outline;
    context.lineWidth = 1.8;
    context.stroke();
  }

  context.restore();
}

function drawRoomWeaponImage(type, x, y, size, rotation = 0) {
  const image = roomAssets.weapons[type];

  if (!image?.complete || image.naturalWidth === 0) {
    drawWeaponIcon(type, x, y, size, weaponConfig[type]?.color ?? "#ffffff", rotation);
    return;
  }

  const drawSizes = {
    pistol: { width: size * 0.9, height: size * 0.48 },
    shotgun: { width: size * 1.18, height: size * 0.48 },
    sniper: { width: size * 1.45, height: size * 0.42 },
    machineGun: { width: size * 1.48, height: size * 0.46 },
  };
  const drawSize = drawSizes[type] ?? { width: size, height: size * 0.48 };

  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.imageSmoothingEnabled = false;
  context.drawImage(
    image,
    -drawSize.width / 2,
    -drawSize.height / 2,
    drawSize.width,
    drawSize.height,
  );
  context.restore();
}

function drawGearIcon(x, y, size, color) {
  context.save();
  context.translate(x, y);
  context.strokeStyle = color;
  context.lineWidth = Math.max(1.6, size * 0.1);

  for (let index = 0; index < 8; index += 1) {
    const angle = (Math.PI * 2 * index) / 8;
    context.save();
    context.rotate(angle);
    context.strokeRect(size * 0.28, -size * 0.06, size * 0.2, size * 0.12);
    context.restore();
  }

  context.beginPath();
  context.arc(0, 0, size * 0.32, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.arc(0, 0, size * 0.12, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawAcceleratorIcon(x, y, size, color) {
  context.save();
  context.translate(x, y);
  context.fillStyle = color;
  context.strokeStyle = "#2f3446";
  context.lineWidth = Math.max(1.6, size * 0.08);

  context.beginPath();
  context.moveTo(size * 0.05, -size * 0.48);
  context.lineTo(-size * 0.28, size * 0.02);
  context.lineTo(-size * 0.05, size * 0.02);
  context.lineTo(-size * 0.18, size * 0.48);
  context.lineTo(size * 0.3, -size * 0.12);
  context.lineTo(size * 0.06, -size * 0.12);
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();
}

function drawPickups() {
  for (const pickup of state.pickups) {
    const config = pickupConfig[pickup.type];
    const bob = Math.sin(pickup.age * 4) * 3;

    context.save();
    context.translate(pickup.x, pickup.y + bob);
    context.shadowColor = config.color;
    context.shadowBlur = 16;

    context.beginPath();
    context.arc(0, 0, pickup.radius, 0, Math.PI * 2);
    context.fillStyle = "rgba(8, 10, 16, 0.88)";
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = config.color;
    context.stroke();

    if (pickup.type === "gear") {
      drawGearIcon(0, 0, 29, config.color);
    } else if (pickup.type === "speedBoost") {
      drawAcceleratorIcon(0, 0, 30, config.color);
    } else if (isRoomMode()) {
      drawRoomWeaponImage(pickup.type, 0, 1, 34, -0.08);
    } else {
      drawWeaponIcon(pickup.type, 0, 1, 32, config.color, -0.08);
    }
    context.restore();
  }
}

function drawProjectiles() {
  for (const projectile of state.projectiles) {
    const angle = Math.atan2(projectile.vy, projectile.vx);

    context.save();
    context.translate(projectile.x, projectile.y);
    context.rotate(angle);
    context.shadowColor = projectile.color;
    context.shadowBlur = 12;
    context.fillStyle = projectile.color;
    context.fillRect(-8, -2, 16, 4);
    context.restore();
  }
}

function getWeaponAimAngle(ball) {
  const target = ball.targetId
    ? state.balls.find((candidate) => candidate.id === ball.targetId && candidate.alive)
    : findClosestEnemy(ball);

  if (target) {
    return Math.atan2(target.y - ball.y, target.x - ball.x);
  }

  if (Number.isFinite(ball.lookAngle)) {
    return ball.lookAngle;
  }

  return Math.atan2(ball.vy, ball.vx);
}

function getRoomCharacterVariant(ball) {
  if (!ball.weapon) {
    return "stand";
  }

  if (ball.weapon.type === "machineGun") {
    return "machineGun";
  }

  if (ball.weapon.type === "sniper") {
    return "sniper";
  }

  return "gun";
}

function drawRoomCharacter(ball) {
  const variant = getRoomCharacterVariant(ball);
  const assetTeam = teamConfig[ball.team].roomAssetTeam ?? ball.team;
  const image = roomAssets.characters[ball.team]?.[variant]
    ?? roomAssets.characters[assetTeam]?.[variant]
    ?? roomAssets.characters[assetTeam]?.stand;
  const aimAngle = getWeaponAimAngle(ball);
  const config = teamConfig[ball.team];

  if (!image?.complete || image.naturalWidth === 0) {
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    context.fillStyle = config.color;
    context.fill();
    return;
  }

  const scale = ball.weapon ? 1.04 : 1.12;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;

  context.save();
  context.translate(ball.x, ball.y);
  context.rotate(aimAngle);
  context.imageSmoothingEnabled = false;

  context.beginPath();
  context.ellipse(-4, 4, width * 0.38, height * 0.34, 0, 0, Math.PI * 2);
  context.fillStyle = "rgba(0, 0, 0, 0.3)";
  context.fill();

  context.drawImage(image, -width / 2, -height / 2, width, height);

  context.fillStyle = colorWithAlpha(config.color, 0.86);
  context.strokeStyle = "rgba(8, 10, 16, 0.72)";
  context.lineWidth = 1.5;
  context.fillRect(-width * 0.22, -height * 0.36, width * 0.44, height * 0.16);
  context.strokeRect(-width * 0.22, -height * 0.36, width * 0.44, height * 0.16);
  context.restore();

  context.beginPath();
  context.arc(ball.x, ball.y, ball.radius + 7, 0, Math.PI * 2);
  context.strokeStyle = colorWithAlpha(config.color, 0.34);
  context.lineWidth = 1.5;
  context.stroke();

  if (ball.weapon && ball.weapon.type === "shotgun") {
    const mountX = ball.x + Math.cos(aimAngle) * 21;
    const mountY = ball.y + Math.sin(aimAngle) * 21;
    drawRoomWeaponImage("shotgun", mountX, mountY, 24, aimAngle);
  }
}

function drawRoomBalls() {
  for (const ball of state.balls) {
    if (!ball.alive) {
      continue;
    }

    drawRoomCharacter(ball);

    if (ball.health < maxHealth) {
      const healthWidth = 38;
      context.fillStyle = "rgba(0, 0, 0, 0.48)";
      context.fillRect(ball.x - healthWidth / 2, ball.y - 30, healthWidth, 4);
      context.fillStyle = ball.health > 34 ? "#3ddc97" : "#ffd166";
      context.fillRect(
        ball.x - healthWidth / 2,
        ball.y - 30,
        healthWidth * Math.max(0, ball.health / maxHealth),
        4,
      );
    }

    if (ball.shieldCharges > 0) {
      context.beginPath();
      context.arc(ball.x, ball.y, ball.radius + 11, 0, Math.PI * 2);
      context.strokeStyle = "rgba(61, 220, 151, 0.72)";
      context.lineWidth = 3;
      context.stroke();
    }

  }
}

function drawBalls() {
  if (isRoomMode()) {
    drawRoomBalls();
    return;
  }

  for (const ball of state.balls) {
    if (!ball.alive) {
      continue;
    }

    const config = teamConfig[ball.team];

    for (let index = 0; index < ball.trail.length; index += 1) {
      const point = ball.trail[index];
      const alpha = index / ball.trail.length;
      context.beginPath();
      context.arc(point.x, point.y, ball.radius * alpha * 0.8, 0, Math.PI * 2);
      context.fillStyle = colorWithAlpha(config.color, alpha * 0.18);
      context.fill();
    }

    context.save();
    context.shadowColor = config.glow;
    context.shadowBlur = 22;
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    context.fillStyle = config.color;
    context.fill();
    context.restore();

    context.beginPath();
    context.arc(ball.x - ball.radius * 0.25, ball.y - ball.radius * 0.28, ball.radius * 0.32, 0, Math.PI * 2);
    context.fillStyle = "rgba(255, 255, 255, 0.5)";
    context.fill();

    const healthWidth = ball.radius * 2.3;
    context.fillStyle = "rgba(0, 0, 0, 0.44)";
    context.fillRect(ball.x - healthWidth / 2, ball.y - ball.radius - 11, healthWidth, 4);
    context.fillStyle = ball.health > 34 ? "#3ddc97" : "#ffd166";
    context.fillRect(
      ball.x - healthWidth / 2,
      ball.y - ball.radius - 11,
      healthWidth * Math.max(0, ball.health / maxHealth),
      4,
    );

    if (ball.weapon) {
      const weapon = weaponConfig[ball.weapon.type];
      const aimAngle = getWeaponAimAngle(ball);
      const mountX = ball.x + Math.cos(aimAngle) * (ball.radius + 9);
      const mountY = ball.y + Math.sin(aimAngle) * (ball.radius + 9);

      context.beginPath();
      context.arc(mountX, mountY, 12, 0, Math.PI * 2);
      context.fillStyle = "rgba(8, 10, 16, 0.9)";
      context.fill();
      context.strokeStyle = weapon.color;
      context.lineWidth = 2;
      context.stroke();

      drawWeaponIcon(
        ball.weapon.type,
        mountX,
        mountY,
        22,
        weapon.color,
        aimAngle,
      );
    }

    if (ball.shieldCharges > 0) {
      context.beginPath();
      context.arc(ball.x, ball.y, ball.radius + 7, 0, Math.PI * 2);
      context.strokeStyle = "rgba(61, 220, 151, 0.72)";
      context.lineWidth = 3;
      context.stroke();
    }

    if (isRoomMode() && ball.ambushMode) {
      context.beginPath();
      context.arc(ball.x, ball.y, ball.radius + 10, 0, Math.PI * 2);
      context.strokeStyle = "rgba(12, 16, 24, 0.78)";
      context.lineWidth = 4;
      context.stroke();
    }

    if (ball.speedBoostTimer > 0) {
      context.beginPath();
      context.arc(ball.x, ball.y, ball.radius + 11, 0, Math.PI * 2);
      context.strokeStyle = "rgba(255, 209, 102, 0.72)";
      context.lineWidth = 3;
      context.setLineDash([6, 6]);
      context.stroke();
      context.setLineDash([]);
    }
  }
}

function drawParticles() {
  if (isRoomMode()) {
    return;
  }

  for (const particle of state.particles) {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius * alpha, 0, Math.PI * 2);
    context.fillStyle = particle.color;
    context.globalAlpha = alpha;
    context.fill();
    context.globalAlpha = 1;
  }
}

function isPointVisibleToTeam(point, team, maxDistance = 430) {
  return state.balls.some((ball) => {
    return ball.alive
      && ball.team === team
      && distanceBetween(ball, point) <= maxDistance
      && hasLineOfSight(ball, point);
  });
}

function drawTeamView(team, viewCanvas, viewContext) {
  const width = viewCanvas.width;
  const height = viewCanvas.height;
  viewContext.clearRect(0, 0, width, height);
  viewContext.fillStyle = "#080b12";
  viewContext.fillRect(0, 0, width, height);

  if (!isRoomMode()) {
    viewContext.fillStyle = "rgba(244, 247, 251, 0.72)";
    viewContext.font = "700 15px system-ui, sans-serif";
    viewContext.textAlign = "center";
    viewContext.fillText("房間戰啟用隊伍視角", width / 2, height / 2);
    return;
  }

  const bounds = roomMap.bounds;
  const padding = 12;
  const scale = Math.min((width - padding * 2) / bounds.width, (height - padding * 2) / bounds.height);
  const offsetX = (width - bounds.width * scale) / 2;
  const offsetY = (height - bounds.height * scale) / 2;
  const toViewX = (x) => offsetX + (x - bounds.x) * scale;
  const toViewY = (y) => offsetY + (y - bounds.y) * scale;
  const drawRect = (rect, fillStyle, strokeStyle = null) => {
    viewContext.fillStyle = fillStyle;
    viewContext.fillRect(toViewX(rect.x), toViewY(rect.y), rect.width * scale, rect.height * scale);

    if (strokeStyle) {
      viewContext.strokeStyle = strokeStyle;
      viewContext.lineWidth = 1;
      viewContext.strokeRect(toViewX(rect.x), toViewY(rect.y), rect.width * scale, rect.height * scale);
    }
  };

  drawRect(bounds, "rgba(17, 22, 34, 0.96)", "rgba(255, 255, 255, 0.32)");

  for (const wall of roomMap.walls) {
    drawRect(wall, "#535b6e", "rgba(255, 255, 255, 0.22)");
  }

  for (const door of getRoomDoors()) {
    drawRect(door, "#9a784a", "rgba(255, 209, 102, 0.52)");
  }

  for (const pickup of state.pickups) {
    if (!isPointVisibleToTeam(pickup, team)) {
      continue;
    }

    const config = pickupConfig[pickup.type];
    viewContext.beginPath();
    viewContext.arc(toViewX(pickup.x), toViewY(pickup.y), 4.8, 0, Math.PI * 2);
    viewContext.fillStyle = config.color;
    viewContext.fill();
  }

  for (const ball of state.balls) {
    if (!ball.alive) {
      continue;
    }

    const isOwnTeam = ball.team === team;
    if (!isOwnTeam && !isPointVisibleToTeam(ball, team)) {
      continue;
    }

    viewContext.beginPath();
    viewContext.arc(toViewX(ball.x), toViewY(ball.y), isOwnTeam ? 6 : 5, 0, Math.PI * 2);
    viewContext.fillStyle = isOwnTeam ? teamConfig[ball.team].color : "rgba(255, 255, 255, 0.88)";
    viewContext.fill();

    if (isOwnTeam && ball.ambushMode) {
      viewContext.beginPath();
      viewContext.arc(toViewX(ball.x), toViewY(ball.y), 8, 0, Math.PI * 2);
      viewContext.strokeStyle = "rgba(0, 0, 0, 0.8)";
      viewContext.lineWidth = 2;
      viewContext.stroke();
    }
  }

  viewContext.fillStyle = teamConfig[team].color;
  viewContext.font = "800 12px system-ui, sans-serif";
  viewContext.textAlign = "left";
  viewContext.fillText(`${teamConfig[team].label} VISION`, 10, 18);
}

function drawTeamViews() {
  drawTeamView("red", redViewCanvas, redViewContext);
  drawTeamView("blue", blueViewCanvas, blueViewContext);
  drawTeamView("green", greenViewCanvas, greenViewContext);
  drawTeamView("gold", goldViewCanvas, goldViewContext);
}

function drawGame() {
  if (isRoomMode() && renderRoom3D()) {
    drawTeamViews();
    return;
  }

  drawArena();
  drawTargetLines();
  drawPickups();
  drawProjectiles();
  drawParticles();
  drawBalls();
  drawTeamViews();
}

function gameLoop(timestamp) {
  if (!state.running) {
    return;
  }

  const deltaSeconds = Math.min((timestamp - state.lastFrameTime) / 1000, 0.033);
  state.lastFrameTime = timestamp;
  state.arena.pulse += deltaSeconds * 3;

  updatePickupSpawner(deltaSeconds);
  steerTowardTargets(deltaSeconds);
  moveBalls(deltaSeconds);
  updateRoomDoors(deltaSeconds);
  collectPickups();
  updateWeapons(deltaSeconds);
  resolveCollisions();
  updateProjectiles(deltaSeconds);
  updateParticles(deltaSeconds);
  checkWinner();
  updateHud();
  drawGame();

  if (state.running) {
    requestAnimationFrame(gameLoop);
  }
}

startButton.addEventListener("click", toggleGame);
resetButton.addEventListener("click", () => {
  unlockAudio();
  resetGame();
});
playAgainButton.addEventListener("click", () => {
  unlockAudio();
  resetGame();
  toggleGame();
});

groupModeButton.addEventListener("click", () => {
  unlockAudio();

  if (state.battleMode === "group") {
    return;
  }

  state.battleMode = "group";
  resetGame();
});

duelModeButton.addEventListener("click", () => {
  unlockAudio();

  if (state.battleMode === "duel") {
    return;
  }

  state.battleMode = "duel";
  resetGame();
});

roomModeButton.addEventListener("click", () => {
  unlockAudio();

  if (state.battleMode === "room") {
    return;
  }

  state.battleMode = "room";
  resetGame();
});

ballCountInput.addEventListener("input", () => {
  ballCountValue.textContent = ballCountInput.value;
  resetGame();
});

speedInput.addEventListener("input", () => {
  speedValue.textContent = `${speedInput.value}%`;
});

window.addEventListener("resize", () => {
  resizeCanvas();
  resizeRoom3DRenderer();
  drawGame();
});

window.addEventListener("three-ready", () => {
  setRoom3DVisibility();
  drawGame();
});

loadRoomAssets();
resizeCanvas();
resetGame();
