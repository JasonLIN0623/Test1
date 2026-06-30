#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNITY_EDITOR="${UNITY_EDITOR:-/Applications/Unity/Hub/Editor/6000.5.1f1/Unity.app/Contents/MacOS/Unity}"
LOG_FILE="${TMPDIR:-/tmp}/unity-cqb-create-scene.log"
SCENE_FILE="$PROJECT_DIR/Assets/Scenes/CQBPrototype.unity"

if [[ ! -x "$UNITY_EDITOR" ]]; then
  echo "Unity executable was not found. Set UNITY_EDITOR to the installed Unity executable."
  exit 1
fi

if ! "$UNITY_EDITOR" -version >/dev/null 2>&1; then
  echo "Unity cannot start in this environment. Try opening Unity Hub once, checking license/sign-in, and freeing disk space."
  echo "Expected Unity executable: $UNITY_EDITOR"
  exit 1
fi

"$UNITY_EDITOR" \
  -quit \
  -batchmode \
  -nographics \
  -projectPath "$PROJECT_DIR" \
  -executeMethod CqbPrototype.EditorTools.CqbSceneCreator.CreateAndSavePrototypeScene \
  -logFile "$LOG_FILE"

if [[ ! -f "$SCENE_FILE" ]]; then
  echo "Scene file was not created: $SCENE_FILE"
  echo "Unity log: $LOG_FILE"
  exit 1
fi

echo "Created Unity scene: $SCENE_FILE"
echo "Unity log: $LOG_FILE"
