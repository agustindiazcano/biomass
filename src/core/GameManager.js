import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import '@babylonjs/core/Collisions/collisionCoordinator';
import "@babylonjs/loaders/glTF"; // Importante para cargar modelos .glb
import { Player } from '../entities/Player.js';
import { EnemyManager } from '../managers/EnemyManager.js';
import { WeaponSystem } from '../weapons/WeaponSystem.js';
import { UIManager } from '../ui/UIManager.js';
import { ShopManager } from '../ui/ShopManager.js';
import { WaveManager } from '../managers/WaveManager.js';
import { SceneSetup } from '../core/SceneSetup.js';
import { InputManager } from '../managers/InputManager.js';
import { LootManager } from '../managers/LootManager.js';
import { DroneManager } from '../managers/DroneManager.js';
import { SoundManager } from '../managers/SoundManager.js';
import { EditorManager } from '../editor/EditorManager.js';
import { GameConfig } from '../config/gameConfig.js';

export class GameManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = new Engine(canvas, true);
        this.scene = null;
        this.isPaused = false;
        this.time = 0;

        // Managers
        this.player = null;
        this.enemyManager = null;
        this.weaponSystem = null;
        this.uiManager = null;
        this.shopManager = null;
        this.waveManager = null;
        this.inputManager = null;
        this.lootManager = null;
        this.droneManager = null;
        this.editorManager = null;

        // Game state
        this.gold = 0;
        this.gameOver = false;
        this.gameStarted = false;

        this.spawnPoints = []; // Exposed for WaveManager

        this.init();
    }

    init() {
        this.scene = new Scene(this.engine);
        this.sceneSetup = new SceneSetup(this.scene);
        this.sceneSetup.setup();

        // Initialize SoundManager first
        this.soundManager = new SoundManager(this.scene);

        // Initialize managers
        this.player = new Player(this.scene, this.sceneSetup.shadowGenerator, this.soundManager);
        this.enemyManager = new EnemyManager(this.scene, this.sceneSetup.shadowGenerator, this.soundManager);
        this.weaponSystem = new WeaponSystem(this.scene, this.player, this.sceneSetup.glowLayer, this.soundManager);
        this.uiManager = new UIManager(this.scene);
        this.shopManager = new ShopManager(this.scene, this);
        this.waveManager = new WaveManager(this);
        this.inputManager = new InputManager(this.scene, this);
        this.lootManager = new LootManager(this.scene, this.sceneSetup.glowLayer);
        this.droneManager = new DroneManager(this.scene, this.sceneSetup.shadowGenerator, this.sceneSetup.glowLayer);
        this.editorManager = new EditorManager(this.scene, this);

        // Setup camera (asegurar que el jugador tenga posición válida)
        if (this.player && this.player.mesh) {
            const playerPos = this.player.mesh.position.clone();
            console.log("Creando cámara en posición del jugador:", playerPos);
            this.sceneSetup.createCamera(playerPos);
            this.sceneSetup.setupPostProcessing(this.scene);
        } else {
            console.error("Error: Player mesh no está disponible para la cámara");
            // Crear cámara con posición por defecto
            this.sceneSetup.createCamera(new Vector3(0, 0, 0));
            this.sceneSetup.setupPostProcessing(this.scene);
        }

        // Connect visual effects
        this.uiManager.visualEffects.glowLayer = this.sceneSetup.glowLayer;

        // Setup game loop
        this.setupGameLoop();

        // Handle window resize
        window.addEventListener("resize", () => this.engine.resize());
    }

    setupGameLoop() {
        this.scene.registerBeforeRender(() => {
            if (this.isPaused) return;

            const dt = this.engine.getDeltaTime() / 1000;
            this.time += dt;

            // Update systems
            this.inputManager.update(dt);
            this.player.update(dt, this.scene);
            this.enemyManager.update(dt, this.player, this.time);
            this.weaponSystem.update(dt, this.enemyManager.enemies);
            this.lootManager.update(dt, this.player);
            this.droneManager.update(dt, this.player, this.enemyManager.enemies);

            // Check collisions
            this.checkCollisions();

            // Update UI
            this.uiManager.update(this);

            // Check wave progression
            this.waveManager.update();

            // Check game over
            if (this.player.isDead() && !this.gameOver) {
                this.gameOver = true;
                this.isPaused = true;
                this.uiManager.showGameOver(this);
                if (this.soundManager) this.soundManager.play('game_over');
            }
        });
    }

    checkCollisions() {
        // Enemy-player collisions
        this.enemyManager.enemies.forEach(enemy => {
            if (!enemy || enemy.isDisposed() || !enemy.metadata) return;
            try {
                const dist = Vector3.Distance(enemy.position, this.player.mesh.position);
                if (dist < 2.5) {
                    const now = Date.now();
                    if (!enemy.metadata.lastHit || now - enemy.metadata.lastHit > 1000) {
                        const damage = this.player.takeDamage(this.waveManager.currentEnemyDamage);
                        enemy.metadata.lastHit = now;
                        if (this.showDamage) this.showDamage();
                    }
                }
            } catch (e) {
                console.warn("Error in enemy-player collision:", e);
            }
        });

        // Projectile-enemy collisions
        for (let i = this.weaponSystem.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.weaponSystem.projectiles[i];
            if (!projectile || !projectile.metadata) {
                this.weaponSystem.removeProjectile(i);
                continue;
            }

            const mesh = projectile.mesh || projectile;
            if (!mesh || mesh.isDisposed()) {
                this.weaponSystem.removeProjectile(i);
                continue;
            }

            let hit = false;
            for (let j = this.enemyManager.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemyManager.enemies[j];
                if (!enemy || enemy.isDisposed() || !enemy.metadata) {
                    this.enemyManager.enemies.splice(j, 1);
                    continue;
                }

                try {
                    if (mesh.intersectsMesh(enemy, true)) {
                        const wasAlive = enemy.metadata.hp > 0;
                        const isDead = this.enemyManager.applyDamage(enemy, projectile.metadata.damage);
                        if (wasAlive && isDead) {
                            // Enemy died, spawn loot and effects
                            this.lootManager.spawnLoot(enemy.position.clone());
                            this.uiManager.visualEffects.spawnDeathExplosion(enemy.position.clone());
                            this.waveManager.onEnemyKilled();
                            this.enemyManager.killEnemy(enemy);
                        } else if (!isDead) {
                            // Just damage, show gore
                            this.uiManager.visualEffects.spawnGore(enemy.position.clone());
                            this.uiManager.showFloatingText(enemy.position.clone(), projectile.metadata.damage, "#FF1493");
                            // Sonido de impacto
                            if (this.soundManager) this.soundManager.play('enemy_hit');
                        }
                        hit = true;
                        break;
                    }
                } catch (e) {
                    console.warn("Error in projectile-enemy collision:", e);
                }
            }
            if (hit) {
                this.weaponSystem.removeProjectile(i);
            }
        }

        // Loot pickup
        for (let i = this.lootManager.drops.length - 1; i >= 0; i--) {
            const drop = this.lootManager.drops[i];
            const dist = drop.mesh.position.subtract(this.player.mesh.position).length();
            if (dist < GameConfig.loot.pickupDistance) {
                if (drop.type === "gold") {
                    this.gold += GameConfig.loot.goldValue;
                    this.uiManager.showFloatingText(this.player.mesh.position, `+${GameConfig.loot.goldValue} Gold`, "#FFD700");
                } else if (drop.type === "xp") {
                    const leveledUp = this.player.addXP(GameConfig.loot.xpValue);
                    this.uiManager.showFloatingText(this.player.mesh.position, `+${GameConfig.loot.xpValue} XP`, "cyan");
                    if (leveledUp) {
                        this.uiManager.showFloatingText(this.player.mesh.position, "LEVEL UP!", "white");
                    }
                }
                this.lootManager.removeDrop(i);
            }
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        // Shop visibility is now handled separately or via specific calls
        // this.shopManager.setVisible(this.isPaused); 

        if (this.isPaused) {
            this.canvas.style.cursor = this.inputManager.CURSOR_BLUE_ARROW;
        } else {
            this.canvas.style.cursor = "crosshair";
        }
    }

    toggleShop() {
        // Only allow toggling shop if not in editor mode
        if (this.editorManager && this.editorManager.isEditorMode) return;

        const isShopVisible = this.shopManager.shopContainer.isVisible;

        if (isShopVisible) {
            // Close shop
            this.shopManager.setVisible(false);
            this.isPaused = false;
            this.canvas.style.cursor = "crosshair";
        } else {
            // Open shop
            this.shopManager.setVisible(true);
            this.isPaused = true;
            this.canvas.style.cursor = this.inputManager.CURSOR_BLUE_ARROW;
        }
    }

    toggleGraphics() {
        // Toggle advanced graphics (Glow, Pipeline)
        const sceneSetup = this.sceneSetup;
        if (!sceneSetup) return false;

        const isEnabled = sceneSetup.glowLayer.isEnabled;
        sceneSetup.glowLayer.isEnabled = !isEnabled;

        if (sceneSetup.pipeline) {
            if (sceneSetup.pipeline.isSupported) {
                if (isEnabled) {
                    this.scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline("StandardPipeline", this.scene.cameras);
                } else {
                    this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("StandardPipeline", this.scene.cameras);
                }
            }
        }

        return !isEnabled;
    }

    addGold(amount) {
        this.gold += amount;
    }

    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }

    start() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    restart() {
        // Clear all enemies
        this.enemyManager.enemies.forEach(enemy => {
            if (enemy && !enemy.isDisposed()) {
                enemy.dispose();
            }
        });
        this.enemyManager.enemies = [];

        // Clear all projectiles
        this.weaponSystem.projectiles.forEach(projectile => {
            const mesh = projectile.mesh || projectile;
            if (mesh && !mesh.isDisposed()) {
                mesh.dispose();
            }
        });
        this.weaponSystem.projectiles = [];

        // Clear all loot
        this.lootManager.drops.forEach(drop => {
            if (drop.mesh && !drop.mesh.isDisposed()) {
                drop.mesh.dispose();
            }
        });
        this.lootManager.drops = [];

        // Clear all drones
        this.droneManager.drones.forEach(drone => {
            if (drone && !drone.isDisposed()) {
                drone.dispose();
            }
        });
        this.droneManager.drones = [];

        // Reset player
        this.player.health = GameConfig.player.initialHealth;
        this.player.maxHealth = GameConfig.player.initialMaxHealth;
        this.player.armor = GameConfig.player.initialArmor;
        this.player.xp = GameConfig.player.initialXP;
        this.player.maxXP = GameConfig.player.initialMaxXP;
        this.player.level = GameConfig.player.initialLevel;
        this.player.velocityY = 0;
        this.player.isGrounded = false;
        this.player.mesh.position.set(0, 0.9, 0);

        // Update spawn points from editor
        this.spawnPoints = this.editorManager.spawnPoints;

        // Spawn Level Enemies (placed manually)
        if (this.editorManager.levelEnemies) {
            this.editorManager.levelEnemies.forEach(le => {
                this.enemyManager.spawnEnemyAt(le.position.clone(), le.metadata.enemyType, 1);
            });
        }

        // Reset wave manager
        this.waveManager.currentWave = 1;
        this.waveManager.enemiesKilledInWave = 0;
        this.waveManager.enemiesRequiredForWave = GameConfig.waves.initialEnemiesRequired;
        this.waveManager.currentSpawnRate = this.waveManager.baseSpawnRate;
        this.waveManager.lastSpawnTime = 0;
        this.waveManager.currentEnemyDamage = this.waveManager.baseEnemyDamage;
        this.uiManager.updateWaveTitle(1);

        // Reset weapon system
        this.weaponSystem.currentWeapon = 1;
        this.weaponSystem.unlockedWeapons = { 1: true, 2: false, 3: false, 4: false };
        this.weaponSystem.rifleDamage = GameConfig.weapons.rifle.damage;
        this.weaponSystem.machineGunRate = GameConfig.weapons.rifle.fireRate;
        this.weaponSystem.ammo = GameConfig.weapons.rifle.ammo;
        this.weaponSystem.isReloading = false;
        this.weaponSystem.lastFireTime = 0;

        // Reset game state
        this.gold = 0;
        this.gameOver = false;
        this.gameStarted = true; // Game starts on restart
        this.isPaused = false;
        this.time = 0;

        // Reset camera position and angles
        if (this.sceneSetup && this.sceneSetup.camera) {
            this.sceneSetup.camera.setTarget(this.player.mesh.position);
            // Reset camera angles to initial values
            this.sceneSetup.camera.alpha = -Math.PI / 2;  // Rotación horizontal inicial
            this.sceneSetup.camera.beta = Math.PI / 3.2;  // Ángulo vertical inicial
            this.sceneSetup.camera.radius = 30;  // Distancia inicial
        }

        // Reset cursor
        this.canvas.style.cursor = "crosshair";

        // Hide shop
        this.shopManager.setVisible(false);
    }
}

