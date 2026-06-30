using CqbPrototype;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace CqbPrototype.EditorTools
{
    public static class CqbSceneCreator
    {
        [MenuItem("CQB Prototype/Create Playable Prototype Scene")]
        public static void CreatePlayablePrototypeScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            scene.name = "CQB Prototype";

            GameObject runnerObject = new GameObject("CQB Prototype Runner");
            runnerObject.AddComponent<CqbPrototypeRunner>();

            GameObject cameraObject = new GameObject("Top Down Tactical Camera");
            Camera camera = cameraObject.AddComponent<Camera>();
            cameraObject.AddComponent<CqbTopDownCamera>();
            camera.backgroundColor = new Color(0.48f, 0.22f, 0.2f);
            camera.clearFlags = CameraClearFlags.SolidColor;
            cameraObject.tag = "MainCamera";

            GameObject lightObject = new GameObject("Key Light");
            Light light = lightObject.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.35f;
            light.transform.rotation = Quaternion.Euler(58f, -24f, 0f);

            RenderSettings.ambientLight = new Color(0.68f, 0.61f, 0.5f);
            EditorSceneManager.MarkSceneDirty(scene);
            Selection.activeGameObject = runnerObject;
        }
    }
}
