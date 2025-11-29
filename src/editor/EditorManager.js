import { GizmoManager } from '@babylonjs/core/Gizmos/gizmoManager';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { EditorUI } from './EditorUI.js';
import { EditorStorage } from './EditorStorage.js';

export class EditorManager {
    constructor(scene, gameManager) {
        this.scene = scene;
        this.gameManager = gameManager;

        // State
        this.isEditorMode = false;
        this.editorModeAction = "move";
        this.selectedEditorObject = null;
        this.selectedEnemyTypeForSpawn = "alien";
        this.isMiddleMouseDown = false;
        this.editorInputMap = {}; // Track editor keys manually

        this.lightIntensityMultiplier = 1;
        this.baseHemiIntensity = 0.5; // Increased from 0.1
        this.baseDirIntensity = 0.5; // Increased from 0.2

        this.currentPaintColor = new Color3(1, 0, 0);
        this.currentPaintTexture = null;

        // Collections
        this.editorObjects = [];
        this.spawnPoints = [];
        this.levelEnemies = [];

        // Systems
        this.ui = new EditorUI(scene, this);
        this.storage = new EditorStorage(scene);
        this.gizmoManager = new GizmoManager(scene);

        // Materials
        this.materials = {};

        this.init();
    }

    init() {
        this.setupMaterials();
        this.setupGizmos();
        this.setupInputs();
        this.setupCamera();

        // Load default map or create new one
        this.createMap({
            width: 200,
            depth: 200,
            texture: null, // Default
            mapName: "Default Map",
            lightIntensity: 1
        });
    }

    createMap(config) {
        this.currentMapConfig = config;

        // Clear existing objects
        this.spawnPoints.forEach(sp => sp.dispose());
        this.spawnPoints = [];
        this.editorObjects.forEach(eo => eo.dispose());
        this.editorObjects = [];
        this.levelEnemies.forEach(le => le.dispose());
        this.levelEnemies = [];

        const pStart = this.scene.getMeshByName("playerStartMarker");
        if (pStart) pStart.dispose();

        // Update Ground
        if (this.gameManager.sceneSetup) {
            this.gameManager.sceneSetup.updateGround(config.width, config.depth, config.texture);
        }

        // Reset Player Start (Default center)
        const playerStartMarker = MeshBuilder.CreateBox("playerStartMarker", { size: 1 }, this.scene);
        playerStartMarker.position = new Vector3(0, 0.9, 0);
        playerStartMarker.material = this.materials.playerStartMat;
        playerStartMarker.isPickable = true;
        playerStartMarker.visibility = 0;

        // Reset Lighting
        this.setLightIntensity(config.lightIntensity || 1);

        console.log(`Map '${config.mapName}' created.`);
    }

    saveCurrentMap(mapName) {
        const pStart = this.scene.getMeshByName("playerStartMarker");
        this.storage.saveMap(
            mapName,
            this.currentMapConfig.width,
            this.currentMapConfig.depth,
            this.currentMapConfig.texture,
            this.spawnPoints,
            pStart ? pStart.position : null,
            this.editorObjects,
            this.editorObjects,
            this.levelEnemies,
            this.lightIntensityMultiplier
        );
    }

    loadMapFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const mapData = this.storage.loadMap(
                content,
                this.spawnPoints,
                this.editorObjects,
                this.materials,
                this.levelEnemies
            );

            if (mapData) {
                this.currentMapConfig = {
                    width: mapData.width,
                    depth: mapData.depth,
                    texture: mapData.groundTexture,
                    mapName: "Loaded Map"
                };

                // Update ground to match loaded map
                if (this.gameManager.sceneSetup) {
                    this.gameManager.sceneSetup.updateGround(mapData.width, mapData.depth, mapData.groundTexture);
                }

                // Apply lighting
                this.setLightIntensity(mapData.lightIntensity || 1);
            }
        };
        reader.readAsText(file);
    }

    setupGizmos() {
        this.gizmoManager.positionGizmoEnabled = false;
        this.gizmoManager.rotationGizmoEnabled = false;
        this.gizmoManager.scaleGizmoEnabled = false;
        this.gizmoManager.usePointerToAttachGizmos = false;
    }

    setupMaterials() {
        const spawnPointMat = new StandardMaterial("spawnPointMat", this.scene);
        spawnPointMat.diffuseColor = new Color3(0, 1, 0);
        spawnPointMat.emissiveColor = new Color3(0, 0.5, 0);
        spawnPointMat.alpha = 0.5;
        this.materials.spawnPointMat = spawnPointMat;

        const playerStartMat = new StandardMaterial("playerStartMat", this.scene);
        playerStartMat.diffuseColor = new Color3(1, 0, 0);
        playerStartMat.emissiveColor = new Color3(0.5, 0, 0);
        playerStartMat.alpha = 0.5;
        this.materials.playerStartMat = playerStartMat;

        const editorCubeMat = new StandardMaterial("editorCubeMat", this.scene);
        editorCubeMat.diffuseColor = new Color3(0.5, 0.5, 0.5);
        this.materials.editorCubeMat = editorCubeMat;

        // Enemy Markers
        const alienMarkerMat = new StandardMaterial("alienMarkerMat", this.scene);
        alienMarkerMat.diffuseColor = new Color3(1, 0, 1); // Purple
        this.materials.alienMarkerMat = alienMarkerMat;

        const wormMarkerMat = new StandardMaterial("wormMarkerMat", this.scene);
        wormMarkerMat.diffuseColor = new Color3(0.8, 0.5, 0.2); // Brownish
        this.materials.wormMarkerMat = wormMarkerMat;

        const bruteMarkerMat = new StandardMaterial("bruteMarkerMat", this.scene);
        bruteMarkerMat.diffuseColor = new Color3(0.8, 0, 0); // Red
        this.materials.bruteMarkerMat = bruteMarkerMat;
    }

    setupCamera() {
        this.editorCamera = new FreeCamera("EditorCamera", new Vector3(0, 10, -10), this.scene);
        this.editorCamera.setTarget(Vector3.Zero());

        // Configure inputs
        this.editorCamera.keysUp = [87];    // W
        this.editorCamera.keysDown = [83];  // S
        this.editorCamera.keysLeft = [65];  // A
        this.editorCamera.keysRight = [68]; // D
        this.editorCamera.speed = 50.0; // Significantly increased speed
        this.editorCamera.inertia = 0.5;
        this.editorCamera.minZ = 0.1;

        // Explicitly set keys for WASD
        this.editorCamera.keysUp = [87];    // W
        this.editorCamera.keysDown = [83];  // S
        this.editorCamera.keysLeft = [65];  // A
        this.editorCamera.keysRight = [68]; // D

        // Ensure checkCollisions is false for editor camera so it doesn't get stuck
        this.editorCamera.checkCollisions = false;

        // Remove default mouse input to prevent left-click rotation
        this.editorCamera.inputs.clear();

        // We will handle WASD manually in setupInputs/update loop
        // to avoid conflicts and ensure it works.

        // Disable default mouse rotation by setting high sensibility or not adding mouse input
        // We handle rotation manually in setupInputs
    }

    setupInputs() {
        this.scene.onPointerObservable.add((pi) => {
            if (!this.isEditorMode) return;

            // Zoom (Mouse Wheel)
            if (pi.type === PointerEventTypes.POINTERWHEEL) {
                if (this.editorCamera) {
                    const delta = pi.event.wheelDelta || -pi.event.detail;
                    const zoomSpeed = 2.0;
                    const direction = this.editorCamera.getForwardRay().direction;
                    if (delta > 0) {
                        this.editorCamera.position.addInPlace(direction.scale(zoomSpeed));
                    } else {
                        this.editorCamera.position.subtractInPlace(direction.scale(zoomSpeed));
                    }
                }
            }

            // Pointer Down
            if (pi.type === PointerEventTypes.POINTERDOWN) {
                if (pi.event.button === 0) { // Left Click
                    this.handleEditorClick(pi.pickInfo);
                }
                if (pi.event.button === 1) { // Middle Click
                    this.isMiddleMouseDown = true;

                    // Check if we clicked an editable object
                    const mesh = pi.pickInfo.pickedMesh;
                    const isEditable = mesh && (this.editorObjects.includes(mesh) || this.spawnPoints.includes(mesh) || this.levelEnemies.includes(mesh) || mesh.name === "playerStartMarker");

                    if (isEditable && this.selectedEditorObject === mesh) {
                        this.isRotatingObject = true;
                        // Disable drag while rotating object
                        const drag = this.selectedEditorObject.getBehaviorByName("PointerDrag");
                        if (drag) drag.enabled = false;
                    } else {
                        this.isRotatingObject = false;
                    }
                }
            }

            // Pointer Up
            if (pi.type === PointerEventTypes.POINTERUP) {
                if (pi.event.button === 1) {
                    this.isMiddleMouseDown = false;
                    if (this.isRotatingObject && this.selectedEditorObject) {
                        // Re-enable drag
                        const drag = this.selectedEditorObject.getBehaviorByName("PointerDrag");
                        if (drag) drag.enabled = true;
                    }
                    this.isRotatingObject = false;
                }
            }

            // Pointer Move (Rotation)
            if (pi.type === PointerEventTypes.POINTERMOVE) {
                if (this.isMiddleMouseDown) {
                    const dx = pi.event.movementX;
                    const dy = pi.event.movementY;
                    const sensitivity = 0.005;

                    if (this.isRotatingObject && this.selectedEditorObject) {
                        // Rotate Object
                        this.selectedEditorObject.rotation.y += dx * sensitivity * 2;
                    } else if (this.editorCamera) {
                        // Rotate Camera
                        this.editorCamera.cameraRotation.y += dx * sensitivity;
                        this.editorCamera.cameraRotation.x += dy * sensitivity;
                    }
                }
            }
        });

        // Keyboard movement for selected object (Arrow Keys) and Camera (WASD)
        window.addEventListener("keydown", (ev) => {
            if (!this.isEditorMode) return;

            const key = ev.key.toLowerCase();
            this.editorInputMap[key] = true;

            if (this.selectedEditorObject) {
                const speed = 0.5;
                if (ev.key === "ArrowUp") this.selectedEditorObject.position.z += speed;
                if (ev.key === "ArrowDown") this.selectedEditorObject.position.z -= speed;
                if (ev.key === "ArrowLeft") this.selectedEditorObject.position.x -= speed;
                if (ev.key === "ArrowRight") this.selectedEditorObject.position.x += speed;
            }
        });

        window.addEventListener("keyup", (ev) => {
            if (!this.isEditorMode) return;
            const key = ev.key.toLowerCase();
            this.editorInputMap[key] = false;
        });

        // Editor Camera Movement Loop
        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.isEditorMode || !this.editorCamera) return;

            const speed = this.editorCamera.speed * (this.scene.getEngine().getDeltaTime() / 1000);

            // Get camera direction vectors
            const forward = this.editorCamera.getForwardRay().direction;
            // Remove Y component for flat movement if desired, or keep it for free flight. 
            // Let's keep it free flight but maybe flatten if user prefers. For now, free flight.

            const right = Vector3.Cross(forward, Vector3.Up()).normalize().scale(-1); // Invert for correct right

            if (this.editorInputMap["w"]) {
                this.editorCamera.position.addInPlace(forward.scale(speed));
            }
            if (this.editorInputMap["s"]) {
                this.editorCamera.position.subtractInPlace(forward.scale(speed));
            }
            if (this.editorInputMap["a"]) {
                this.editorCamera.position.subtractInPlace(right.scale(speed));
            }
            if (this.editorInputMap["d"]) {
                this.editorCamera.position.addInPlace(right.scale(speed));
            }
        });
    }

    toggleEditorMode() {
        this.isEditorMode = !this.isEditorMode;

        // Toggle UI visibility
        if (this.ui) {
            this.ui.setVisible(this.isEditorMode);
        }

        // Toggle Game Pause
        if (this.isEditorMode) {
            if (!this.gameManager.isPaused) this.gameManager.togglePause();

            // Switch to Editor Camera
            this.previousCamera = this.scene.activeCamera;
            this.scene.activeCamera = this.editorCamera;
            console.log("Switched to Editor Camera:", this.scene.activeCamera.name);
            console.log("Editor Camera Position:", this.editorCamera.position);

            // Attach editor camera for WASD
            this.editorCamera.attachControl(this.gameManager.canvas, false); // Prevent default to ensure keys are captured
            console.log("Editor Camera Attached to Canvas");

            // Increase lighting for better visibility
            const hemi = this.scene.getLightByName("hemi");
            const dir = this.scene.getLightByName("dir01");
            if (hemi) hemi.intensity = this.baseHemiIntensity * 2; // Double intensity
            if (dir) dir.intensity = this.baseDirIntensity * 2;
        } else {
            this.gameManager.isPaused = true; // Ensure paused state matches editor
            this.gameManager.togglePause(); // Flip to false (resume)

            // Restore lighting
            const hemi = this.scene.getLightByName("hemi");
            const dir = this.scene.getLightByName("dir01");
            if (hemi) hemi.intensity = this.baseHemiIntensity * this.lightIntensityMultiplier;
            if (dir) dir.intensity = this.baseDirIntensity * this.lightIntensityMultiplier;

            // Restore previous camera
            if (this.previousCamera) {
                this.scene.activeCamera = this.previousCamera;
            }

            // Detach editor camera
            this.editorCamera.detachControl();
        }
        if (this.playerStartMarker) this.playerStartMarker.setEnabled(this.isEditorMode);
        this.levelEnemies.forEach(e => e.setEnabled(this.isEditorMode));
    }

    setEditorAction(action) {
        this.editorModeAction = action;
        this.ui.setActiveButton(action);
    }

    setSelectedEnemyType(type) {
        this.selectedEnemyTypeForSpawn = type;
    }

    handleEditorClick(pickResult) {
        if (!pickResult.hit) return;

        const mesh = pickResult.pickedMesh;
        const pos = pickResult.pickedPoint.clone();
        const ground = this.scene.getMeshByName("ground");

        switch (this.editorModeAction) {
            case "move":
                if (this.editorObjects.includes(mesh) || this.spawnPoints.includes(mesh) || this.levelEnemies.includes(mesh) || mesh.name === "playerStartMarker") {
                    this.selectObject(mesh);
                } else if (mesh === ground) {
                    this.deselectObject();
                }
                break;
            case "paint":
                if (mesh === ground) {
                    const paintDecal = MeshBuilder.CreateDecal("decal", ground, { position: pos, normal: pickResult.getNormal(true), size: new Vector3(2, 2, 2) });
                    const paintMat = new StandardMaterial("paintMat", this.scene);

                    if (this.currentPaintTexture) {
                        paintMat.diffuseTexture = new Texture(this.currentPaintTexture, this.scene);
                        paintMat.diffuseColor = new Color3(1, 1, 1);
                    } else {
                        paintMat.diffuseColor = this.currentPaintColor.clone();
                    }

                    paintMat.zOffset = -1;
                    paintDecal.material = paintMat;
                    this.editorObjects.push(paintDecal);
                }
                break;
            case "addCube":
                if (mesh === ground) {
                    const cube = MeshBuilder.CreateBox("editorCube", { size: 2 }, this.scene);
                    cube.position = pos.add(new Vector3(0, 1, 0));
                    cube.material = this.materials.editorCubeMat;
                    this.editorObjects.push(cube);
                    this.gameManager.sceneSetup.shadowGenerator.addShadowCaster(cube);
                    cube.checkCollisions = true;

                    this.selectObject(cube);
                    this.setEditorAction("move");
                }
                break;
            case "addWall":
                if (mesh === ground) {
                    const wall = MeshBuilder.CreateBox("editorWall", { width: 5, height: 3, depth: 0.5 }, this.scene);
                    wall.position = pos.add(new Vector3(0, 1.5, 0));
                    wall.material = this.materials.editorCubeMat;
                    this.editorObjects.push(wall);
                    this.gameManager.sceneSetup.shadowGenerator.addShadowCaster(wall);
                    wall.checkCollisions = true;

                    this.selectObject(wall);
                    this.setEditorAction("move");
                }
                break;
            case "setSpawn":
                if (mesh === ground) {
                    const spawnMarker = MeshBuilder.CreateBox("spawnPoint", { size: 1 }, this.scene);
                    spawnMarker.position = pos.add(new Vector3(0, 0.5, 0));
                    spawnMarker.material = this.materials.spawnPointMat;
                    spawnMarker.isPickable = true;
                    spawnMarker.visibility = 1;
                    spawnMarker.metadata = { type: "spawnPoint", enemyType: this.selectedEnemyTypeForSpawn };
                    this.spawnPoints.push(spawnMarker);

                    this.selectObject(spawnMarker);
                    this.setEditorAction("move");
                }
                break;
            case "setPlayerStart":
                if (mesh === ground) {
                    let playerStartMarker = this.scene.getMeshByName("playerStartMarker");
                    if (!playerStartMarker) {
                        playerStartMarker = MeshBuilder.CreateBox("playerStartMarker", { size: 1 }, this.scene);
                        playerStartMarker.material = this.materials.playerStartMat;
                        playerStartMarker.isPickable = true;
                    }
                    playerStartMarker.position = pos.add(new Vector3(0, 0.5, 0));
                    playerStartMarker.visibility = 1;
                }
                break;
            case "placeAlien":
            case "placeWorm":
            case "placeBrute":
                if (mesh === ground) {
                    let type = "alien";
                    let mat = this.materials.alienMarkerMat;
                    let size = 1;

                    if (this.editorModeAction === "placeWorm") {
                        type = "worm";
                        mat = this.materials.wormMarkerMat;
                    } else if (this.editorModeAction === "placeBrute") {
                        type = "brute";
                        mat = this.materials.bruteMarkerMat;
                        size = 1.5;
                    }

                    const enemyMarker = MeshBuilder.CreateBox("levelEnemy_" + type, { size: size }, this.scene);
                    enemyMarker.position = pos.add(new Vector3(0, size / 2, 0));
                    enemyMarker.material = mat;
                    enemyMarker.isPickable = true;
                    enemyMarker.visibility = 1;
                    enemyMarker.metadata = { type: "levelEnemy", enemyType: type };
                    this.levelEnemies.push(enemyMarker);

                    this.selectObject(enemyMarker);
                    this.setEditorAction("move");
                }
                break;
        }
    }

    selectObject(mesh) {
        // Remove behavior from previous selection if any
        if (this.selectedEditorObject && this.selectedEditorObject.getBehaviorByName("PointerDrag")) {
            this.selectedEditorObject.removeBehavior(this.selectedEditorObject.getBehaviorByName("PointerDrag"));
        }

        this.selectedEditorObject = mesh;
        this.gizmoManager.attachToMesh(this.selectedEditorObject);
        this.gizmoManager.positionGizmoEnabled = true;

        // Add Drag Behavior
        const dragBehavior = new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 1, 0) });
        dragBehavior.moveAttached = true;
        mesh.addBehavior(dragBehavior);
    }

    deselectObject() {
        if (this.selectedEditorObject && this.selectedEditorObject.getBehaviorByName("PointerDrag")) {
            this.selectedEditorObject.removeBehavior(this.selectedEditorObject.getBehaviorByName("PointerDrag"));
        }
        this.gizmoManager.attachToMesh(null);
        this.selectedEditorObject = null;
    }

    saveScene() {
        let playerStartPos = new Vector3(0, 0.9, 0);
        const pMarker = this.scene.getMeshByName("playerStartMarker");
        if (pMarker) {
            playerStartPos = pMarker.position.clone();
            playerStartPos.y = 0.9;
        }

        this.storage.saveSceneData(this.spawnPoints, playerStartPos, this.editorObjects, this.levelEnemies);
    }

    setLightIntensity(value) {
        this.lightIntensityMultiplier = value;
        const hemi = this.scene.getLightByName("hemi");
        const dir = this.scene.getLightByName("dir01");

        // Apply multiplier to base intensity
        // Note: In editor mode we might already have a 2x boost, so we should respect that or just override it dynamically.
        // Let's make it simple: The slider controls the multiplier on top of the base.

        let currentBaseHemi = this.baseHemiIntensity;
        let currentBaseDir = this.baseDirIntensity;

        if (this.isEditorMode) {
            currentBaseHemi *= 2; // The editor boost
            currentBaseDir *= 2;
        }

        if (hemi) hemi.intensity = currentBaseHemi * this.lightIntensityMultiplier;
        if (dir) dir.intensity = currentBaseDir * this.lightIntensityMultiplier;
    }
}
