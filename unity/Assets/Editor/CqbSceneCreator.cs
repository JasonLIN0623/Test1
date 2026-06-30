using CqbPrototype;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace CqbPrototype.EditorTools
{
    public static class CqbSceneCreator
    {
        private const string SceneFolder = "Assets/Scenes";
        private const string PrototypeScenePath = SceneFolder + "/CQBPrototype.unity";

        [MenuItem("CQB Prototype/Create Playable Prototype Scene")]
        public static void CreatePlayablePrototypeScene()
        {
            BuildPlayablePrototypeScene();
        }

        [MenuItem("CQB Prototype/Create And Save Prototype Scene")]
        public static void CreateAndSavePrototypeScene()
        {
            Scene scene = BuildPlayablePrototypeScene();
            EnsureSceneFolder();
            EditorSceneManager.SaveScene(scene, PrototypeScenePath);
            AssetDatabase.Refresh();
        }

        [MenuItem("CQB Prototype/Run Prototype Smoke Test")]
        public static void RunPrototypeSmokeTest()
        {
            Scene scene = BuildPlayablePrototypeScene();
            bool hasRunner = Object.FindAnyObjectByType<CqbPrototypeRunner>() != null;
            bool hasCamera = Camera.main != null && Camera.main.GetComponent<CqbTopDownCamera>() != null;
            bool hasLight = Object.FindAnyObjectByType<Light>() != null;

            if (!hasRunner || !hasCamera || !hasLight)
            {
                throw new System.InvalidOperationException(
                    $"CQB prototype smoke test failed. Runner: {hasRunner}, Camera: {hasCamera}, Light: {hasLight}");
            }

            EditorSceneManager.MarkSceneDirty(scene);
        }

        private static Scene BuildPlayablePrototypeScene()
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
            return scene;
        }

        private static void EnsureSceneFolder()
        {
            if (Directory.Exists(SceneFolder))
            {
                return;
            }

            Directory.CreateDirectory(SceneFolder);
        }
    }
}
