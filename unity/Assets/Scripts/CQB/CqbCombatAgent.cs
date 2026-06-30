using System.Collections.Generic;
using UnityEngine;

namespace CqbPrototype
{
    [RequireComponent(typeof(CqbWaypointAgent))]
    public sealed class CqbCombatAgent : MonoBehaviour
    {
        private static readonly List<CqbCombatAgent> Agents = new List<CqbCombatAgent>();

        [SerializeField] private int teamIndex;
        [SerializeField] private float maxHealth = 100f;
        [SerializeField] private float sightRange = 18f;
        [SerializeField] private float fireRange = 15f;
        [SerializeField] private float fireCooldown = 0.45f;
        [SerializeField] private float damage = 18f;
        [SerializeField] private float turnSpeed = 14f;
        [SerializeField] private float tracerLifetime = 0.08f;

        private CqbWaypointAgent movementAgent;
        private float health;
        private float nextFireTime;
        private LineRenderer tracer;

        public int TeamIndex => teamIndex;
        public bool IsAlive => health > 0f;

        public void Initialize(int team)
        {
            teamIndex = team;
            health = maxHealth;
        }

        private void Awake()
        {
            movementAgent = GetComponent<CqbWaypointAgent>();
            health = maxHealth;
            CreateTracer();
        }

        private void OnEnable()
        {
            if (!Agents.Contains(this))
            {
                Agents.Add(this);
            }
        }

        private void OnDisable()
        {
            Agents.Remove(this);
        }

        private void Update()
        {
            if (!IsAlive)
            {
                movementAgent.SetMovementPaused(true);
                return;
            }

            CqbCombatAgent target = FindVisibleTarget();
            bool hasTarget = target != null;
            movementAgent.SetMovementPaused(hasTarget);

            if (!hasTarget)
            {
                return;
            }

            AimAt(target.transform.position);

            if (Vector3.Distance(transform.position, target.transform.position) <= fireRange
                && Time.time >= nextFireTime)
            {
                Shoot(target);
            }
        }

        private CqbCombatAgent FindVisibleTarget()
        {
            CqbCombatAgent closest = null;
            float closestDistance = float.MaxValue;

            foreach (CqbCombatAgent candidate in Agents)
            {
                if (candidate == this || !candidate.IsAlive || candidate.TeamIndex == teamIndex)
                {
                    continue;
                }

                float distance = Vector3.Distance(transform.position, candidate.transform.position);
                if (distance > sightRange || distance >= closestDistance || !HasLineOfSight(candidate))
                {
                    continue;
                }

                closest = candidate;
                closestDistance = distance;
            }

            return closest;
        }

        private bool HasLineOfSight(CqbCombatAgent target)
        {
            Vector3 start = GetEyePosition(transform.position);
            Vector3 end = GetEyePosition(target.transform.position);
            Vector3 direction = end - start;
            RaycastHit[] hits = Physics.RaycastAll(start, direction.normalized, direction.magnitude);

            foreach (RaycastHit hit in hits)
            {
                CqbCombatAgent hitAgent = hit.collider.GetComponentInParent<CqbCombatAgent>();

                if (hitAgent == this)
                {
                    continue;
                }

                if (hitAgent == target)
                {
                    return true;
                }

                return false;
            }

            return true;
        }

        private void AimAt(Vector3 targetPosition)
        {
            Vector3 flatDirection = targetPosition - transform.position;
            flatDirection.y = 0f;

            if (flatDirection.sqrMagnitude < 0.001f)
            {
                return;
            }

            Quaternion targetRotation = Quaternion.LookRotation(flatDirection.normalized, Vector3.up);
            transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, Time.deltaTime * turnSpeed);
        }

        private void Shoot(CqbCombatAgent target)
        {
            nextFireTime = Time.time + fireCooldown;
            target.TakeDamage(damage);
            ShowTracer(GetEyePosition(transform.position), GetEyePosition(target.transform.position));
        }

        private void TakeDamage(float amount)
        {
            health = Mathf.Max(0f, health - amount);

            if (health <= 0f)
            {
                movementAgent.SetMovementPaused(true);
                transform.localScale = new Vector3(transform.localScale.x, transform.localScale.y * 0.35f, transform.localScale.z);
            }
        }

        private void CreateTracer()
        {
            tracer = gameObject.AddComponent<LineRenderer>();
            tracer.positionCount = 2;
            tracer.startWidth = 0.05f;
            tracer.endWidth = 0.02f;
            tracer.enabled = false;
            tracer.material = new Material(Shader.Find("Sprites/Default"));
            tracer.startColor = new Color(1f, 0.94f, 0.45f, 0.95f);
            tracer.endColor = new Color(1f, 0.5f, 0.2f, 0.25f);
        }

        private void ShowTracer(Vector3 start, Vector3 end)
        {
            tracer.enabled = true;
            tracer.SetPosition(0, start);
            tracer.SetPosition(1, end);
            CancelInvoke(nameof(HideTracer));
            Invoke(nameof(HideTracer), tracerLifetime);
        }

        private void HideTracer()
        {
            tracer.enabled = false;
        }

        private static Vector3 GetEyePosition(Vector3 position)
        {
            return position + Vector3.up * 0.55f;
        }
    }
}
