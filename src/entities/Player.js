import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { SpotLight } from '@babylonjs/core/Lights/spotLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { GameConfig } from '../config/gameConfig.js';

export class Player {
    constructor(scene, shadowGenerator, soundManager) {
        this.scene = scene;
        this.shadowGenerator = shadowGenerator;
        this.soundManager = soundManager;

        // Stats
        this.health = GameConfig.player.initialHealth;
        this.maxHealth = GameConfig.player.initialMaxHealth;
        this.armor = GameConfig.player.initialArmor;
        this.xp = GameConfig.player.initialXP;
        this.maxXP = GameConfig.player.initialMaxXP;
        this.level = GameConfig.player.initialLevel;

        // Movement state
        this.velocityY = 0;
        this.isGrounded = false;
        this.isRunning = false;
        this.inputVector = new Vector3(0, 0, 0);

        // Modelo 3D
        this.visualMesh = null;
        this.animations = {};

        // 1. Crear el Collider (la caja física invisible)
        this.createCollider();

        // 2. Cargar el modelo 3D visual (si existe) - asíncrono, no bloquea
        this.loadVisualModel();

        // 3. Luces
        this.setupLights();

        // Debug: Verificar que el mesh esté disponible
        console.log("Player inicializado, mesh position:", this.mesh.position);
    }

    createCollider() {
        // Esta es la caja que realmente se mueve y choca con el mundo.
        // La hacemos invisible pero física.
        this.mesh = MeshBuilder.CreateBox("playerCollider", { height: 1.8, width: 0.8, depth: 0.8 }, this.scene);
        this.mesh.position.y = 0.9;
        this.mesh.isVisible = false; // IMPORTANTE: Invisible
        this.mesh.checkCollisions = true;
        this.mesh.ellipsoid = new Vector3(0.4, 0.9, 0.4);
        this.mesh.ellipsoidOffset = new Vector3(0, 0.9, 0);

        // Fallback: Si no hay modelo 3D, hacer visible la caja con material básico
        this.createFallbackMesh();
    }

    createFallbackMesh() {
        // Crear mesh de respaldo visible (geometría simple) por si no carga el modelo 3D
        const fallbackBody = MeshBuilder.CreateBox("playerBody", { height: 1.8, width: 1, depth: 1 }, this.scene);
        fallbackBody.position = new Vector3(0, 0, 0);
        fallbackBody.parent = this.mesh;
        fallbackBody.isVisible = false; // User requested to hide the white rectangle

        const playerMat = new StandardMaterial("playerMat", this.scene);
        playerMat.diffuseColor = new Color3(1, 1, 1);
        playerMat.emissiveColor = new Color3(0.1, 0.1, 0.1);
        playerMat.maxSimultaneousLights = 10;
        fallbackBody.material = playerMat;

        // Asegurar que las sombras funcionen
        this.shadowGenerator.addShadowCaster(fallbackBody);

        // Head
        const playerHead = MeshBuilder.CreateSphere("pHead", { diameter: 0.7 }, this.scene);
        playerHead.position = new Vector3(0, 1.0, 0);
        playerHead.parent = this.mesh;
        const headMat = new StandardMaterial("headMat", this.scene);
        headMat.diffuseColor = new Color3(0, 0, 0);
        playerHead.isVisible = false; // User requested to hide the head

        // Gun - Better shape and bigger size
        const gunBody = MeshBuilder.CreateBox("gunBody", { width: 0.25, height: 0.15, depth: 1.2 }, this.scene);
        gunBody.parent = this.mesh;
        gunBody.position = new Vector3(0.6, 0.15, 0.6);
        const gunMat = new StandardMaterial("gunMat", this.scene);
        gunMat.diffuseColor = new Color3(0.15, 0.15, 0.15);
        gunMat.specularColor = new Color3(0.3, 0.3, 0.3);
        gunBody.material = gunMat;

        const gunBarrel = MeshBuilder.CreateCylinder("gunBarrel", { height: 1.0, diameter: 0.12 }, this.scene);
        gunBarrel.parent = this.mesh;
        gunBarrel.position = new Vector3(0.6, 0.15, 1.1);
        gunBarrel.rotation.x = Math.PI / 2;
        const barrelMat = new StandardMaterial("barrelMat", this.scene);
        barrelMat.diffuseColor = new Color3(0.2, 0.2, 0.2);
        barrelMat.specularColor = new Color3(0.4, 0.4, 0.4);
        gunBarrel.material = barrelMat;

        const gunStock = MeshBuilder.CreateBox("gunStock", { width: 0.2, height: 0.12, depth: 0.4 }, this.scene);
        gunStock.parent = this.mesh;
        gunStock.position = new Vector3(0.6, 0.1, 0.2);
        const stockMat = new StandardMaterial("stockMat", this.scene);
        stockMat.diffuseColor = new Color3(0.3, 0.2, 0.1);
        gunStock.material = stockMat;

        this.fallbackMesh = fallbackBody;
        this.gunMesh = gunBody;
    }

    async loadVisualModel() {
        try {
            const result = await SceneLoader.ImportMeshAsync("", "/assets/models/", "player.glb", this.scene);
            const root = result.meshes[0];

            // ... (Tu código de posición y escala sigue igual) ...
            root.parent = this.mesh;
            root.position = new Vector3(0, -0.9, 0);
            root.rotation = new Vector3(0, Math.PI, 0); // Rota 180° si mira atrás

            this.visualMesh = root;
            this.shadowGenerator.addShadowCaster(root);

            // --- AQUÍ ESTÁ EL ARREGLO DE ANIMACIONES ---

            // 1. Ver qué animaciones trajo el archivo (Míralo en la consola del navegador - F12)
            console.log("Animaciones disponibles:", result.animationGroups.map(ag => ag.name));

            // 2. Detener todo por seguridad
            result.animationGroups.forEach(ag => ag.stop());

            // 3. Buscar animaciones específicas
            let idleAnim = result.animationGroups.find(ag => ag.name.toLowerCase().includes("idle"));
            let runAnim = result.animationGroups.find(ag => ag.name.toLowerCase().includes("run"));

            // 4. PLAN B: Si no encuentra "idle", usa la PRIMERA animación disponible (índice 0)
            if (!idleAnim && result.animationGroups.length > 0) {
                console.warn("No encontré animación 'Idle', usando la primera disponible.");
                idleAnim = result.animationGroups[0];
            }

            // Guardamos las referencias
            this.animations = {
                idle: idleAnim,
                run: runAnim
            };

            // 5. Arrancar la animación por defecto
            if (this.animations.idle) {
                this.animations.idle.start(true); // true = en bucle (loop)
            }

        } catch (e) {
            console.error("Error fatal cargando modelo:", e);
            this.mesh.isVisible = true; // Si falla, mostramos la caja
        }
    }

    setupLights() {
        const flashlight = new SpotLight("flashlight", new Vector3(0, 3, 0), new Vector3(0, -0.5, 1.5), Math.PI / 2.2, 15, this.scene);
        flashlight.parent = this.mesh;
        flashlight.diffuse = new Color3(1, 1, 1);
        flashlight.intensity = 8.0;
        flashlight.range = 90;

        const haloLight = new PointLight("halo", new Vector3(0, 2, 0), this.scene);
        haloLight.parent = this.mesh;
        haloLight.diffuse = new Color3(0.5, 0.5, 1);
        haloLight.intensity = 2;
        haloLight.range = 10;
    }

    update(dt, scene) {
        // Apply gravity
        this.velocityY += GameConfig.player.gravity * dt;

        // Move vertically
        const verticalMovement = new Vector3(0, this.velocityY * dt, 0);
        const collisionResult = this.mesh.moveWithCollisions(verticalMovement);

        // Check if grounded
        if (collisionResult.collidedMesh && this.velocityY <= 0) {
            this.isGrounded = true;
            this.velocityY = 0;
        } else {
            this.isGrounded = false;
        }

        // Clamp Y position to prevent falling through ground
        if (this.mesh.position.y < 0.9) {
            this.mesh.position.y = 0.9;
            this.velocityY = 0;
            this.isGrounded = true;
        }

        // Gestión de animaciones (si hay modelo 3D con animaciones)
        if (this.animations && Object.keys(this.animations).length > 0) {
            const isMoving = this.inputVector && this.inputVector.length() > 0;

            if (isMoving || this.isRunning) {
                if (this.animations.run && !this.animations.run.isPlaying) {
                    if (this.animations.idle) this.animations.idle.stop();
                    this.animations.run.start(true);
                }
            } else {
                if (this.animations.idle && !this.animations.idle.isPlaying) {
                    if (this.animations.run) this.animations.run.stop();
                    this.animations.idle.start(true);
                }
            }
        }
    }

    jump() {
        if (this.isGrounded) {
            this.velocityY = GameConfig.player.jumpForce;
            this.isGrounded = false;
            if (this.soundManager) {
                this.soundManager.play('player_jump');
            }
        }
    }

    move(direction, dt, isRunning = false) {
        this.isRunning = isRunning;
        this.inputVector = direction; // Guardar para lógica de animación
        if (direction.length() > 0) {
            const speed = GameConfig.player.moveSpeed * (isRunning ? GameConfig.player.runSpeedMultiplier : 1);
            this.mesh.moveWithCollisions(direction.normalize().scale(speed * dt));
        }
    }

    lookAt(target) {
        const t = target.clone();
        t.y = this.mesh.position.y;
        this.mesh.lookAt(t);
    }

    takeDamage(amount) {
        const reducedDmg = amount * (1 - (this.armor / 100));
        this.health -= reducedDmg;
        return reducedDmg;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    addXP(amount) {
        this.xp += amount;
        if (this.xp >= this.maxXP) {
            return this.levelUp();
        }
        return false;
    }

    levelUp() {
        this.xp = 0;
        this.maxXP *= 1.2;
        this.level++;
        this.health = this.maxHealth;
        if (this.soundManager) {
            this.soundManager.play('level_up');
        }
        return true; // Indicates level up occurred
    }

    increaseArmor(amount) {
        this.armor = Math.min(80, this.armor + amount);
    }

    getHealthPercent() {
        return Math.max(0, this.health / this.maxHealth);
    }

    getXPPercent() {
        return this.xp / this.maxXP;
    }

    isDead() {
        return this.health <= 0;
    }
}

