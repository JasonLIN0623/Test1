using UnityEngine;

namespace CqbPrototype
{
    [RequireComponent(typeof(Camera))]
    public sealed class CqbTopDownCamera : MonoBehaviour
    {
        [SerializeField] private Vector3 target = Vector3.zero;
        [SerializeField] private Vector3 offset = new Vector3(22f, 92f, 38f);
        [SerializeField] private float orthographicSize = 41f;
        [SerializeField] private float followLerp = 12f;

        private Camera viewCamera;

        private void Awake()
        {
            viewCamera = GetComponent<Camera>();
            viewCamera.orthographic = true;
            viewCamera.nearClipPlane = 0.1f;
            viewCamera.farClipPlane = 320f;
        }

        private void LateUpdate()
        {
            viewCamera.orthographic = true;
            viewCamera.orthographicSize = orthographicSize;

            Vector3 desiredPosition = target + offset;
            transform.position = Vector3.Lerp(transform.position, desiredPosition, Time.deltaTime * followLerp);
            transform.LookAt(target, Vector3.up);
        }
    }
}
