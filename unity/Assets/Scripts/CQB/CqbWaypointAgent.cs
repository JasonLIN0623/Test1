using UnityEngine;

namespace CqbPrototype
{
    public sealed class CqbWaypointAgent : MonoBehaviour
    {
        [SerializeField] private Transform[] waypoints;
        [SerializeField] private float moveSpeed = 4.2f;
        [SerializeField] private float turnSpeed = 10f;
        [SerializeField] private float arriveDistance = 0.35f;
        [SerializeField] private bool loopRoute = true;

        private int waypointIndex;

        private void Update()
        {
            if (waypoints == null || waypoints.Length == 0)
            {
                return;
            }

            Transform target = waypoints[waypointIndex];
            if (target == null)
            {
                AdvanceWaypoint();
                return;
            }

            Vector3 flatTarget = new Vector3(target.position.x, transform.position.y, target.position.z);
            Vector3 toTarget = flatTarget - transform.position;

            if (toTarget.magnitude <= arriveDistance)
            {
                AdvanceWaypoint();
                return;
            }

            Vector3 direction = toTarget.normalized;
            Quaternion targetRotation = Quaternion.LookRotation(direction, Vector3.up);
            transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, Time.deltaTime * turnSpeed);
            transform.position += direction * moveSpeed * Time.deltaTime;
        }

        private void AdvanceWaypoint()
        {
            if (waypoints.Length == 0)
            {
                return;
            }

            waypointIndex += 1;

            if (waypointIndex >= waypoints.Length)
            {
                waypointIndex = loopRoute ? 0 : waypoints.Length - 1;
            }
        }
    }
}
