#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNITY_EDITOR="${UNITY_EDITOR:-/Applications/Unity/Hub/Editor/6000.5.1f1/Unity.app/Contents/MacOS/Unity}"
UNITY_APP_DIR="$(cd "$(dirname "$UNITY_EDITOR")/.." && pwd)"
UNITY_SCRIPTING_ROOT="$UNITY_APP_DIR/Resources/Scripting"
UNITY_ENGINE="$UNITY_SCRIPTING_ROOT/Managed/UnityEngine"
MONO="$UNITY_SCRIPTING_ROOT/MonoBleedingEdge/bin/mono"
CSC_DLL="$UNITY_SCRIPTING_ROOT/MonoBleedingEdge/lib/mono/msbuild/Current/bin/Roslyn/csc.exe"
RUNTIME_OUT="${TMPDIR:-/tmp}/CqbRuntimeCheck.dll"
EDITOR_OUT="${TMPDIR:-/tmp}/CqbEditorCheck.dll"
RUNTIME_REFS="${TMPDIR:-/tmp}/cqb-csc-runtime-refs.rsp"
EDITOR_REFS="${TMPDIR:-/tmp}/cqb-csc-editor-refs.rsp"
SCENE_FILE="$PROJECT_DIR/Assets/Scenes/CQBPrototype.unity"
BUILD_SETTINGS="$PROJECT_DIR/ProjectSettings/EditorBuildSettings.asset"
RUNNER_GUID="d0af8f59688c4915b9a8bc1c571be10a"
CAMERA_GUID="72c2f0c23a7a4952b778b14f778cf403"

if [[ ! -x "$MONO" || ! -f "$CSC_DLL" ]]; then
  echo "Unity C# compiler was not found. Set UNITY_EDITOR to the installed Unity executable."
  exit 1
fi

node -e "
  const fs = require('fs');
  JSON.parse(fs.readFileSync('$PROJECT_DIR/Assets/Scripts/CQB/CqbPrototype.Runtime.asmdef', 'utf8'));
  JSON.parse(fs.readFileSync('$PROJECT_DIR/Assets/Editor/CqbPrototype.Editor.asmdef', 'utf8'));
"

duplicate_guid_count="$(
  grep -Rho '^guid: .*' "$PROJECT_DIR/Assets" --include='*.meta' \
    | awk '{print $2}' \
    | sort \
    | uniq -d \
    | wc -l \
    | tr -d ' '
)"

if [[ "$duplicate_guid_count" != "0" ]]; then
  echo "Unity meta GUIDs contain duplicates."
  exit 1
fi

missing_meta_count="$(
  find "$PROJECT_DIR/Assets" -type f ! -name '*.meta' ! -name '.gitkeep' \
    | while read -r asset; do
        [[ -f "$asset.meta" ]] || echo "$asset"
      done \
    | wc -l \
    | tr -d ' '
)"

if [[ "$missing_meta_count" != "0" ]]; then
  echo "Some Unity assets are missing .meta files."
  find "$PROJECT_DIR/Assets" -type f ! -name '*.meta' ! -name '.gitkeep' \
    | while read -r asset; do
        [[ -f "$asset.meta" ]] || echo "missing meta: $asset"
      done
  exit 1
fi

if [[ ! -f "$SCENE_FILE" ]]; then
  echo "Unity scene is missing: $SCENE_FILE"
  exit 1
fi

if ! grep -q "$RUNNER_GUID" "$SCENE_FILE"; then
  echo "Unity scene does not reference CqbPrototypeRunner."
  exit 1
fi

if ! grep -q "$CAMERA_GUID" "$SCENE_FILE"; then
  echo "Unity scene does not reference CqbTopDownCamera."
  exit 1
fi

if [[ ! -f "$BUILD_SETTINGS" ]] || ! grep -q 'Assets/Scenes/CQBPrototype.unity' "$BUILD_SETTINGS"; then
  echo "Unity build settings do not include the prototype scene."
  exit 1
fi

: > "$RUNTIME_REFS"
find "$UNITY_SCRIPTING_ROOT/NetStandard/ref/2.1.0" -name '*.dll' -print \
  | while read -r dll; do printf -- '-reference:%q\n' "$dll" >> "$RUNTIME_REFS"; done

printf -- '-reference:%q\n' "$UNITY_ENGINE/UnityEngine.dll" >> "$RUNTIME_REFS"
printf -- '-reference:%q\n' "$UNITY_ENGINE/UnityEngine.CoreModule.dll" >> "$RUNTIME_REFS"
printf -- '-reference:%q\n' "$UNITY_ENGINE/UnityEngine.PhysicsModule.dll" >> "$RUNTIME_REFS"
printf -- '-reference:%q\n' "$UNITY_ENGINE/UnityEngine.IMGUIModule.dll" >> "$RUNTIME_REFS"

"$MONO" "$CSC_DLL" -nologo -nostdlib+ -target:library -out:"$RUNTIME_OUT" @"$RUNTIME_REFS" \
  "$PROJECT_DIR/Assets/Scripts/CQB/CqbPrototypeMapBuilder.cs" \
  "$PROJECT_DIR/Assets/Scripts/CQB/CqbTopDownCamera.cs" \
  "$PROJECT_DIR/Assets/Scripts/CQB/CqbWaypointAgent.cs" \
  "$PROJECT_DIR/Assets/Scripts/CQB/CqbPrototypeRunner.cs" \
  "$PROJECT_DIR/Assets/Scripts/CQB/CqbCombatAgent.cs"

cp "$RUNTIME_REFS" "$EDITOR_REFS"
printf -- '-reference:%q\n' "$RUNTIME_OUT" >> "$EDITOR_REFS"
printf -- '-reference:%q\n' "$UNITY_ENGINE/UnityEditor.CoreModule.dll" >> "$EDITOR_REFS"

"$MONO" "$CSC_DLL" -nologo -nostdlib+ -target:library -out:"$EDITOR_OUT" @"$EDITOR_REFS" \
  "$PROJECT_DIR/Assets/Editor/CqbSceneCreator.cs"

echo "Unity script checks passed."
