using UnityEngine;

namespace CqbPrototype
{
    public sealed class CqbPrototypeMapBuilder : MonoBehaviour
    {
        private const float RoomScale = 1.1f;
        private const float WorldScale = 0.08f;
        private static readonly Vector2 PrototypeCenter = new Vector2(450f, 450f);

        [SerializeField] private Material floorMaterial = null;
        [SerializeField] private Material baseMaterial = null;
        [SerializeField] private Material wallMaterial = null;
        [SerializeField] private Material outerWallMaterial = null;
        [SerializeField] private Material spawnMarkerMaterial = null;

        private static readonly RectSpec Bounds = new RectSpec(100f, 80f, 700f, 760f);

        private static readonly RectSpec[] Walls =
        {
            new RectSpec(145f, 80f, 10f, 130f),
            new RectSpec(100f, 210f, 92f, 10f),
            new RectSpec(230f, 210f, 95f, 10f),
            new RectSpec(650f, 80f, 10f, 120f),
            new RectSpec(575f, 210f, 90f, 10f),
            new RectSpec(720f, 210f, 80f, 10f),
            new RectSpec(145f, 710f, 10f, 130f),
            new RectSpec(100f, 690f, 96f, 10f),
            new RectSpec(255f, 690f, 105f, 10f),
            new RectSpec(650f, 720f, 10f, 120f),
            new RectSpec(560f, 690f, 96f, 10f),
            new RectSpec(715f, 690f, 85f, 10f),
            new RectSpec(435f, 88f, 8f, 96f),
            new RectSpec(435f, 232f, 8f, 72f),
            new RectSpec(528f, 150f, 8f, 96f),
            new RectSpec(528f, 246f, 72f, 8f),
            new RectSpec(260f, 250f, 8f, 72f),
            new RectSpec(635f, 250f, 8f, 72f),
            new RectSpec(160f, 320f, 80f, 8f),
            new RectSpec(300f, 320f, 95f, 8f),
            new RectSpec(505f, 320f, 115f, 8f),
            new RectSpec(690f, 320f, 70f, 8f),
            new RectSpec(150f, 360f, 8f, 88f),
            new RectSpec(296f, 360f, 8f, 88f),
            new RectSpec(695f, 360f, 8f, 88f),
            new RectSpec(405f, 370f, 8f, 78f),
            new RectSpec(485f, 370f, 8f, 78f),
            new RectSpec(405f, 448f, 88f, 8f),
            new RectSpec(560f, 400f, 8f, 78f),
            new RectSpec(640f, 400f, 8f, 78f),
            new RectSpec(560f, 400f, 88f, 8f),
            new RectSpec(180f, 500f, 110f, 8f),
            new RectSpec(350f, 500f, 130f, 8f),
            new RectSpec(530f, 500f, 120f, 8f),
            new RectSpec(700f, 500f, 80f, 8f),
            new RectSpec(198f, 520f, 8f, 86f),
            new RectSpec(744f, 548f, 8f, 104f),
            new RectSpec(190f, 590f, 100f, 8f),
            new RectSpec(360f, 590f, 90f, 8f),
            new RectSpec(520f, 590f, 120f, 8f),
            new RectSpec(700f, 590f, 55f, 8f),
            new RectSpec(315f, 555f, 8f, 85f),
            new RectSpec(400f, 620f, 8f, 82f),
            new RectSpec(520f, 620f, 8f, 82f),
        };

        private static readonly RectSpec[] SpawnZones =
        {
            new RectSpec(190f, 126f, 90f, 92f),
            new RectSpec(700f, 110f, 80f, 100f),
            new RectSpec(190f, 730f, 90f, 80f),
            new RectSpec(690f, 760f, 85f, 70f),
        };

        private void Start()
        {
            BuildMap();
        }

        [ContextMenu("Rebuild Map")]
        public void BuildMap()
        {
            ClearChildren();
            BuildFloor();
            BuildOuterWalls();
            BuildInnerWalls();
            BuildSpawnMarkers();
        }

        private void BuildFloor()
        {
            RectSpec scaledBounds = ScaleRect(Bounds);
            Vector3 size = ToWorldSize(scaledBounds, 0.72f);
            Vector3 center = ToWorldCenter(scaledBounds, -0.36f);

            CreateCube("Floor", center, size, ResolveMaterial(floorMaterial, new Color(0.96f, 0.82f, 0.52f)));
            CreateCube("Base", center + Vector3.down * 0.46f, size + new Vector3(0.7f, 0.4f, 0.7f), ResolveMaterial(baseMaterial, new Color(0.62f, 0.28f, 0.32f)));
        }

        private void BuildOuterWalls()
        {
            RectSpec b = ScaleRect(Bounds);
            float thickness = 10f;
            RectSpec[] outerWalls =
            {
                new RectSpec(b.X - 8f, b.Y - 8f, b.Width + 16f, thickness),
                new RectSpec(b.X - 8f, b.Y + b.Height - 2f, b.Width + 16f, thickness),
                new RectSpec(b.X - 8f, b.Y - 8f, thickness, b.Height + 16f),
                new RectSpec(b.X + b.Width - 2f, b.Y - 8f, thickness, b.Height + 16f),
            };

            foreach (RectSpec wall in outerWalls)
            {
                CreateWall("Outer Wall", wall, ResolveMaterial(outerWallMaterial, new Color(0.74f, 0.36f, 0.31f)));
            }
        }

        private void BuildInnerWalls()
        {
            foreach (RectSpec wall in Walls)
            {
                CreateWall("Wall", ScaleRect(wall), ResolveMaterial(wallMaterial, new Color(0.84f, 0.46f, 0.35f)));
            }
        }

        private void BuildSpawnMarkers()
        {
            Material markerMaterial = ResolveMaterial(spawnMarkerMaterial, new Color(0.25f, 0.9f, 0.65f, 0.65f));

            for (int index = 0; index < SpawnZones.Length; index += 1)
            {
                RectSpec zone = ScaleRect(SpawnZones[index]);
                Vector3 center = ToWorldCenter(zone, 0.08f);
                Vector3 size = ToWorldSize(zone, 0.08f);
                CreateCube($"Spawn Zone {index + 1}", center, size, markerMaterial);
            }
        }

        private void CreateWall(string objectName, RectSpec wall, Material material)
        {
            Vector3 size = ToWorldSize(wall, 2.4f);
            Vector3 center = ToWorldCenter(wall, size.y / 2f);
            CreateCube(objectName, center, size, material);
        }

        private GameObject CreateCube(string objectName, Vector3 position, Vector3 scale, Material material)
        {
            GameObject cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
            cube.name = objectName;
            cube.transform.SetParent(transform, false);
            cube.transform.localPosition = position;
            cube.transform.localScale = scale;
            cube.GetComponent<Renderer>().sharedMaterial = material;
            return cube;
        }

        private void ClearChildren()
        {
            for (int index = transform.childCount - 1; index >= 0; index -= 1)
            {
                Transform child = transform.GetChild(index);

                if (Application.isPlaying)
                {
                    Destroy(child.gameObject);
                }
                else
                {
                    DestroyImmediate(child.gameObject);
                }
            }
        }

        private static RectSpec ScaleRect(RectSpec rect)
        {
            return new RectSpec(
                ScaleNumber(rect.X, PrototypeCenter.x),
                ScaleNumber(rect.Y, PrototypeCenter.y),
                rect.Width * RoomScale,
                rect.Height * RoomScale);
        }

        private static float ScaleNumber(float value, float center)
        {
            return center + (value - center) * RoomScale;
        }

        private static Vector3 ToWorldCenter(RectSpec rect, float y)
        {
            float x = ((rect.X + rect.Width / 2f) - PrototypeCenter.x) * WorldScale;
            float z = ((rect.Y + rect.Height / 2f) - PrototypeCenter.y) * WorldScale;
            return new Vector3(x, y, z);
        }

        private static Vector3 ToWorldSize(RectSpec rect, float y)
        {
            return new Vector3(rect.Width * WorldScale, y, rect.Height * WorldScale);
        }

        private static Material ResolveMaterial(Material provided, Color fallbackColor)
        {
            if (provided != null)
            {
                return provided;
            }

            Material material = new Material(Shader.Find("Standard"));
            material.color = fallbackColor;
            return material;
        }

        private readonly struct RectSpec
        {
            public readonly float X;
            public readonly float Y;
            public readonly float Width;
            public readonly float Height;

            public RectSpec(float x, float y, float width, float height)
            {
                X = x;
                Y = y;
                Width = width;
                Height = height;
            }
        }
    }
}
