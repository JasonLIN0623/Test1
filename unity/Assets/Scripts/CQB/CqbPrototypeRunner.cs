using UnityEngine;

namespace CqbPrototype
{
    public sealed class CqbPrototypeRunner : MonoBehaviour
    {
        private const float RoomScale = 1.1f;
        private const float WorldScale = 0.08f;
        private static readonly Vector2 PrototypeCenter = new Vector2(450f, 450f);

        [SerializeField] private CqbPrototypeMapBuilder mapBuilder;
        [SerializeField] private float agentMoveSpeed = 4.2f;

        private static readonly Color[] TeamColors =
        {
            new Color(1f, 0.23f, 0.3f),
            new Color(0.18f, 0.49f, 1f),
            new Color(0.24f, 0.86f, 0.59f),
            new Color(1f, 0.82f, 0.4f),
        };

        private static readonly Vector2[][] TeamRoutes =
        {
            new[]
            {
                new Vector2(240f, 160f),
                new Vector2(400f, 160f),
                new Vector2(400f, 240f),
                new Vector2(340f, 360f),
                new Vector2(240f, 450f),
                new Vector2(440f, 545f),
                new Vector2(600f, 560f),
                new Vector2(720f, 780f),
            },
            new[]
            {
                new Vector2(720f, 160f),
                new Vector2(600f, 160f),
                new Vector2(600f, 280f),
                new Vector2(640f, 360f),
                new Vector2(680f, 470f),
                new Vector2(640f, 545f),
                new Vector2(360f, 560f),
                new Vector2(240f, 760f),
            },
            new[]
            {
                new Vector2(240f, 760f),
                new Vector2(360f, 560f),
                new Vector2(340f, 540f),
                new Vector2(240f, 450f),
                new Vector2(340f, 360f),
                new Vector2(400f, 240f),
                new Vector2(720f, 160f),
            },
            new[]
            {
                new Vector2(720f, 780f),
                new Vector2(600f, 760f),
                new Vector2(680f, 640f),
                new Vector2(640f, 545f),
                new Vector2(680f, 470f),
                new Vector2(640f, 360f),
                new Vector2(600f, 280f),
                new Vector2(240f, 160f),
            },
        };

        private void Start()
        {
            EnsureMap();
            SpawnAgents();
        }

        private void EnsureMap()
        {
            if (mapBuilder == null)
            {
                GameObject mapObject = new GameObject("CQB Generated Map");
                mapObject.transform.SetParent(transform, false);
                mapBuilder = mapObject.AddComponent<CqbPrototypeMapBuilder>();
            }

            mapBuilder.BuildMap();
        }

        private void SpawnAgents()
        {
            for (int teamIndex = 0; teamIndex < TeamRoutes.Length; teamIndex += 1)
            {
                Vector3[] route = ConvertRoute(TeamRoutes[teamIndex]);

                for (int memberIndex = 0; memberIndex < 3; memberIndex += 1)
                {
                    Vector3 startPosition = route[0] + new Vector3(memberIndex * 0.55f, 0.7f, memberIndex * -0.45f);
                    GameObject agentObject = GameObject.CreatePrimitive(PrimitiveType.Capsule);
                    agentObject.name = $"Team {teamIndex + 1} Agent {memberIndex + 1}";
                    agentObject.transform.SetParent(transform, false);
                    agentObject.transform.position = startPosition;
                    agentObject.transform.localScale = new Vector3(0.75f, 0.75f, 0.75f);

                    Renderer renderer = agentObject.GetComponent<Renderer>();
                    renderer.sharedMaterial = CreateTeamMaterial(TeamColors[teamIndex]);

                    CqbWaypointAgent agent = agentObject.AddComponent<CqbWaypointAgent>();
                    agent.SetRoute(OffsetRoute(route, memberIndex));
                    agent.SetMoveSpeed(agentMoveSpeed + memberIndex * 0.15f);

                    CqbCombatAgent combatAgent = agentObject.AddComponent<CqbCombatAgent>();
                    combatAgent.Initialize(teamIndex);
                }
            }
        }

        private static Vector3[] ConvertRoute(Vector2[] prototypeRoute)
        {
            Vector3[] route = new Vector3[prototypeRoute.Length];

            for (int index = 0; index < prototypeRoute.Length; index += 1)
            {
                route[index] = PrototypeToWorld(prototypeRoute[index], 0.7f);
            }

            return route;
        }

        private static Vector3[] OffsetRoute(Vector3[] route, int memberIndex)
        {
            Vector3[] shiftedRoute = new Vector3[route.Length];
            Vector3 offset = new Vector3((memberIndex - 1) * 0.55f, 0f, memberIndex * -0.32f);

            for (int index = 0; index < route.Length; index += 1)
            {
                shiftedRoute[index] = route[index] + offset;
            }

            return shiftedRoute;
        }

        private static Vector3 PrototypeToWorld(Vector2 prototypePoint, float y)
        {
            float scaledX = PrototypeCenter.x + (prototypePoint.x - PrototypeCenter.x) * RoomScale;
            float scaledY = PrototypeCenter.y + (prototypePoint.y - PrototypeCenter.y) * RoomScale;
            float worldX = (scaledX - PrototypeCenter.x) * WorldScale;
            float worldZ = (scaledY - PrototypeCenter.y) * WorldScale;
            return new Vector3(worldX, y, worldZ);
        }

        private static Material CreateTeamMaterial(Color color)
        {
            Material material = new Material(Shader.Find("Standard"));
            material.color = color;
            return material;
        }
    }
}
