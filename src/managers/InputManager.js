import { ActionManager } from '@babylonjs/core/Actions/actionManager';
import { ExecuteCodeAction } from '@babylonjs/core/Actions/directActions';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Ray } from '@babylonjs/core/Culling/ray';
import { Matrix } from '@babylonjs/core/Maths/math';
import { CURSOR_BLUE_ARROW } from '../utils/constants.js';

export class InputManager {
    constructor(scene, gameManager) {
        this.scene = scene;
        this.gameManager = gameManager;
        this.inputMap = {};
        this.isMouseDown = false;
        this.isShiftPressed = false;
        this.spacePressed = false;
        this.CURSOR_BLUE_ARROW = CURSOR_BLUE_ARROW;

        this.setupInput();
    }

    setupInput() {
        // Mouse input
        this.scene.onPointerObservable.add((pi) => {
            if (pi.type === PointerEventTypes.POINTERDOWN) {
                this.isMouseDown = true;
            }
            if (pi.type === PointerEventTypes.POINTERUP) {
                this.isMouseDown = false;
            }
        });

        // Keyboard input - use window events for better compatibility
        window.addEventListener("keydown", (ev) => {
            const key = ev.key.toLowerCase();
            this.inputMap[key] = true;

            // Track shift key separately
            if (ev.key === "Shift" || ev.shiftKey) {
                this.isShiftPressed = true;
            }

            // Handle space key for jumping (only once per press)
            if (ev.key === " " || ev.key === "Space" || ev.code === "Space") {
                if (!this.spacePressed) {
                    this.spacePressed = true;
                    this.gameManager.player.jump();
                }
            }

            this.handleKeyDown(ev.key);

            if (ev.key === "Escape") {
                this.gameManager.toggleShop();
            }
        });

        window.addEventListener("keyup", (ev) => {
            const key = ev.key.toLowerCase();
            this.inputMap[key] = false;

            // Track shift key separately
            if (ev.key === "Shift") {
                this.isShiftPressed = false;
            }

            // Reset space key
            if (ev.key === " " || ev.key === "Space" || ev.code === "Space") {
                this.spacePressed = false;
            }
        });
    }

    handleKeyDown(key) {
        const keyLower = key.toLowerCase();

        // Reload
        if (keyLower === 'r') {
            this.gameManager.weaponSystem.reload();
        }

        // Weapon switching
        if (key === '1' && this.gameManager.weaponSystem.unlockedWeapons[1]) {
            this.gameManager.weaponSystem.setWeapon(1);
        }
        if (key === '2' && this.gameManager.weaponSystem.unlockedWeapons[2]) {
            this.gameManager.weaponSystem.setWeapon(2);
        }
        if (key === '3' && this.gameManager.weaponSystem.unlockedWeapons[3]) {
            this.gameManager.weaponSystem.setWeapon(3);
        }
        if (key === '4' && this.gameManager.weaponSystem.unlockedWeapons[4]) {
            this.gameManager.weaponSystem.setWeapon(4);
        }
        if (key === '5' && this.gameManager.weaponSystem.unlockedWeapons[5]) {
            this.gameManager.weaponSystem.setWeapon(5);
        }

        // Grenade
        if (keyLower === 'g') {
            this.gameManager.weaponSystem.throwGrenade();
        }

        // Drop Weapon
        if (keyLower === 'h') {
            this.gameManager.weaponSystem.dropCurrentWeapon();
        }

        // Inventory
        if (keyLower === 'i') {
            this.gameManager.uiManager.toggleInventory(this.gameManager);
        }

        // Editor Toggle
        if (keyLower === 'o') {
            if (this.gameManager.editorManager) {
                // Ensure shop is closed when opening editor
                if (this.gameManager.shopManager.shopContainer.isVisible) {
                    this.gameManager.toggleShop();
                }
                this.gameManager.editorManager.toggleEditorMode();
            }
        }
    }

    update(dt) {
        if (this.gameManager.isPaused) return;

        const player = this.gameManager.player;
        const scene = this.scene;

        // Mouse look - use raycast from camera for more reliable aiming
        const camera = this.gameManager.sceneSetup?.camera;
        const ground = this.gameManager.sceneSetup?.ground;

        if (camera && ground) {
            // Get mouse coordinates relative to canvas
            const pointerX = scene.pointerX;
            const pointerY = scene.pointerY;

            // Create a ray from the camera through the mouse position
            const ray = scene.createPickingRay(pointerX, pointerY, Matrix.Identity(), camera);

            // Pick with the ray, filtering only the ground
            const pick = scene.pickWithRay(ray, (mesh) => mesh === ground);

            let targetPoint = null;

            if (pick && pick.hit && pick.pickedPoint) {
                // Direct hit on ground
                targetPoint = pick.pickedPoint;
            } else {
                // If ray doesn't hit ground, calculate intersection with ground plane
                // This ensures the player always rotates toward the mouse direction
                const rayOrigin = ray.origin;
                const rayDirection = ray.direction;

                // Get ground's Y position (ground is at y=0 by default, but check to be sure)
                const groundY = ground.position.y;

                // Calculate where ray intersects the ground plane
                if (rayDirection.y !== 0) {
                    const t = (groundY - rayOrigin.y) / rayDirection.y;
                    if (t > 0) {
                        targetPoint = rayOrigin.add(rayDirection.scale(t));
                    }
                }
            }

            if (targetPoint) {
                player.lookAt(targetPoint);
            }
        }

        // Movement
        let v = new Vector3(0, 0, 0);
        if (this.inputMap["w"]) v.z = 1;
        if (this.inputMap["s"]) v.z = -1;
        if (this.inputMap["a"]) v.x = -1;
        if (this.inputMap["d"]) v.x = 1;

        // Check if running (shift key)
        const isRunning = this.isShiftPressed || this.inputMap["shift"] || false;
        player.move(v, dt, isRunning);

        // Camera follow
        if (this.gameManager.sceneSetup?.camera) {
            this.gameManager.sceneSetup.camera.target.x = player.mesh.position.x;
            this.gameManager.sceneSetup.camera.target.z = player.mesh.position.z;
        }

        // Shooting
        if (this.isMouseDown) {
            this.gameManager.weaponSystem.fire();
        }
    }
}

