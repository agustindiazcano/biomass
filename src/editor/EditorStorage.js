import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';

export class EditorStorage {
    constructor(scene) {
        this.scene = scene;
        this.storageKey = "marineSurvivalSceneData";
    }

    saveMap(mapName, width, depth, texture, spawnPoints, playerStartPos, editorObjects, levelEnemies, lightIntensity) {
        const data = {
            version: "1.0",
            mapName: mapName,
            width: width,
            depth: depth,
            groundTexture: texture,
            lightIntensity: lightIntensity || 1,
            spawnPoints: spawnPoints.map(sp => ({
                position: sp.position.asArray(),
                enemyType: sp.metadata ? sp.metadata.enemyType : "alien"
            })),
            playerStart: playerStartPos ? playerStartPos.asArray() : null,
            editorObjects: editorObjects
                .filter(obj => obj.name.startsWith("editor"))
                .map(obj => ({
                    type: obj.name.includes("Cube") ? "cube" : "wall",
                    position: obj.position.asArray(),
                    rotation: obj.rotation.asArray()
                })),
            levelEnemies: levelEnemies ? levelEnemies.map(le => ({
                type: le.metadata.enemyType,
                position: le.position.asArray()
            })) : []
        };

        const jsonString = JSON.stringify(data, null, 2);

        // Download file
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${mapName}.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log(`Map '${mapName}' saved.`);
    }

    loadMap(jsonContent, spawnPoints, editorObjects, materials, levelEnemies) {
        let data;
        try {
            data = JSON.parse(jsonContent);
        } catch (e) {
            console.error("Failed to parse map JSON", e);
            return null;
        }

        // Clear existing
        spawnPoints.forEach(sp => sp.dispose());
        spawnPoints.length = 0;

        editorObjects.forEach(eo => eo.dispose());
        editorObjects.length = 0;

        if (levelEnemies) {
            levelEnemies.forEach(le => le.dispose());
            levelEnemies.length = 0;
        }

        const pStart = this.scene.getMeshByName("playerStartMarker");
        if (pStart) pStart.dispose();

        // Load Spawn Points
        if (data.spawnPoints) {
            data.spawnPoints.forEach(spData => {
                const spawnMarker = MeshBuilder.CreateBox("spawnPoint", { size: 1 }, this.scene);
                spawnMarker.position = Vector3.FromArray(spData.position);
                spawnMarker.material = materials.spawnPointMat;
                spawnMarker.isPickable = true;
                spawnMarker.visibility = 0;
                spawnMarker.metadata = { type: "spawnPoint", enemyType: spData.enemyType };
                spawnPoints.push(spawnMarker);
            });
        }

        // Load Player Start
        let playerStartPos = null;
        if (data.playerStart) {
            playerStartPos = Vector3.FromArray(data.playerStart);
            playerStartPos.y = 0.9;

            const playerStartMarker = MeshBuilder.CreateBox("playerStartMarker", { size: 1 }, this.scene);
            playerStartMarker.position = Vector3.FromArray(data.playerStart);
            playerStartMarker.material = materials.playerStartMat;
            playerStartMarker.isPickable = true;
            playerStartMarker.visibility = 0;
        }

        // Load Editor Objects
        if (data.editorObjects) {
            data.editorObjects.forEach(objData => {
                let mesh;
                if (objData.type === "cube") {
                    mesh = MeshBuilder.CreateBox("editorCube", { size: 2 }, this.scene);
                } else {
                    mesh = MeshBuilder.CreateBox("editorWall", { width: 5, height: 3, depth: 0.5 }, this.scene);
                }
                mesh.position = Vector3.FromArray(objData.position);
                mesh.rotation = Vector3.FromArray(objData.rotation);
                mesh.material = materials.editorCubeMat;
                mesh.checkCollisions = true;
                editorObjects.push(mesh);
            });
        }

        // Load Level Enemies
        if (data.levelEnemies && levelEnemies) {
            data.levelEnemies.forEach(leData => {
                let mat = materials.alienMarkerMat;
                let size = 1;
                if (leData.type === "worm") mat = materials.wormMarkerMat;
                if (leData.type === "brute") {
                    mat = materials.bruteMarkerMat;
                    size = 1.5;
                }

                const enemyMarker = MeshBuilder.CreateBox("levelEnemy_" + leData.type, { size: size }, this.scene);
                enemyMarker.position = Vector3.FromArray(leData.position);
                enemyMarker.material = mat;
                enemyMarker.isPickable = true;
                enemyMarker.visibility = 0;
                enemyMarker.metadata = { type: "levelEnemy", enemyType: leData.type };
                levelEnemies.push(enemyMarker);
            });
        }

        console.log(`Map '${data.mapName}' loaded.`);

        return {
            playerStart: playerStartPos,
            width: data.width || 100,
            depth: data.depth || 100,
            groundTexture: data.groundTexture || null,
            lightIntensity: data.lightIntensity || 1
        };
    }
}
