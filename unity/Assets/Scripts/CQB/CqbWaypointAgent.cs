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

        private Vector3[] runtimeWaypoints;
        private int waypointIndex;
        private bool movementPaused;

        public void SetRoute(Vector3[] route)
        {
            runtimeWaypoints = route;
            waypointIndex = 0;
        }

        public void SetMoveSpeed(float speed)
        {
            moveSpeed = speed;
        }

        public void SetMovementPaused(bool paused)
        {
            movementPaused = paused;
        }

        private void Update()
        {
            if (movementPaused)
            {
                return;
            }

            int routeLength = GetRouteLength();
            if (routeLength == 0)
            {
                return;
            }

            Vector3 targetPosition = GetWaypointPosition(waypointIndex);
            Vector3 flatTarget = new Vector3(targetPosition.x, transform.position.y, targetPosition.z);
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

        private int GetRouteLength()
        {
            if (runtimeWaypoints != null && runtimeWaypoints.Length > 0)
            {
                return runtimeWaypoints.Length;
            }

            return waypoints == null ? 0 : waypoints.Length;
        }

        private Vector3 GetWaypointPosition(int index)
        {
            if (runtimeWaypoints != null && runtimeWaypoints.Length > 0)
            {
                return runtimeWaypoints[index];
            }

            Transform target = waypoints[index];
            return target == null ? transform.position : target.position;
        }

        private void AdvanceWaypoint()
        {
            int routeLength = GetRouteLength();
            if (routeLength == 0)
            {
                return;
            }

            waypointIndex += 1;

            if (waypointIndex >= routeLength)
            {
                waypointIndex = loopRoute ? 0 : routeLength - 1;
            }
        }
    }
}
