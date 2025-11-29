import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { GameConfig } from '../config/gameConfig.js';

export class EnemyManager {
    constructor(scene, shadowGenerator, soundManager) {
        this.scene = scene;
        this.shadowGenerator = shadowGenerator;
        this.soundManager = soundManager;
        this.enemies = [];

        // Contenedores para las plantillas de modelos 3D
        this.alienTemplate = null;
        this.wormTemplate = null;
        this.bruteTemplate = null;
        this.modelsLoaded = false;

        this.setupMaterials();
        // Cargar modelos base al iniciar (asíncrono)
        this.loadTemplates();
    }

    setupMaterials() {
        // Alien material
        this.alienMatBase = new StandardMaterial("alienMatBase", this.scene);
        this.alienMatBase.diffuseColor = new Color3(1, 0, 1);
        this.alienMatBase.emissiveColor = new Color3(0, 0, 0);
        this.alienMatBase.specularColor = new Color3(0, 0, 0);
        this.alienMatBase.maxSimultaneousLights = 10;

        // Worm material
        this.wormMatBase = new StandardMaterial("wormMatBase", this.scene);
        this.wormMatBase.diffuseColor = new Color3(1, 0, 1);
        this.wormMatBase.emissiveColor = new Color3(0, 0, 0);
        this.wormMatBase.specularColor = new Color3(0, 0, 0);
        this.wormMatBase.maxSimultaneousLights = 10;

        // Brute material (nuevo enemigo grande)
        this.bruteMatBase = new StandardMaterial("bruteMatBase", this.scene);
        this.bruteMatBase.diffuseColor = new Color3(0.8, 0.2, 0.2); // Rojo oscuro
        this.bruteMatBase.emissiveColor = new Color3(0.1, 0, 0);
        this.bruteMatBase.specularColor = new Color3(0.2, 0.2, 0.2);
        this.bruteMatBase.maxSimultaneousLights = 10;
    }

    async loadTemplates() {
        // Cargar modelos 3D base para clonar después (más eficiente)
        try {
            // Intentar cargar Alien
            try {
                const alienResult = await SceneLoader.ImportMeshAsync("", "/assets/models/", "alien.glb", this.scene);
                if (alienResult && alienResult.meshes && alienResult.meshes.length > 0) {
                    this.alienTemplate = alienResult.meshes[0];
                    this.alienTemplate.setEnabled(false); // Desactivar/Ocultar plantilla
                    this.alienTemplate.scaling = new Vector3(0.8, 0.8, 0.8);
                    console.log("Modelo Alien cargado");
                }
            } catch (e) {
                console.log("No se encontró modelo alien.glb, usando geometría de respaldo");
            }

            // Intentar cargar Worm
            try {
                const wormResult = await SceneLoader.ImportMeshAsync("", "/assets/models/", "worm.glb", this.scene);
                if (wormResult && wormResult.meshes && wormResult.meshes.length > 0) {
                    this.wormTemplate = wormResult.meshes[0];
                    this.wormTemplate.setEnabled(false);
                    console.log("Modelo Worm cargado");
                }
            } catch (e) {
                console.log("No se encontró modelo worm.glb, usando geometría de respaldo");
            }

            // Intentar cargar Brute
            try {
                const bruteResult = await SceneLoader.ImportMeshAsync("", "/assets/models/", "brute.glb", this.scene);
                if (bruteResult && bruteResult.meshes && bruteResult.meshes.length > 0) {
                    this.bruteTemplate = bruteResult.meshes[0];
                    this.bruteTemplate.setEnabled(false);
                    this.bruteTemplate.scaling = new Vector3(1.2, 1.2, 1.2);
                    console.log("Modelo Brute cargado");
                }
            } catch (e) {
                console.log("No se encontró modelo brute.glb, usando geometría de respaldo");
            }

            this.modelsLoaded = true;
        } catch (e) {
            console.error("Error cargando modelos enemigos:", e);
            this.modelsLoaded = true; // Continuar con geometría de respaldo
        }
    }

    spawnEnemy(spawnPoints, playerLevel) {
        if (this.enemies.length > GameConfig.enemies.maxEnemies) return;

        let pos;
        let enemyType = null;

        if (spawnPoints && spawnPoints.length > 0) {
            // Pick random spawn point
            const sp = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
            pos = sp.position.clone();
            // Add some randomness around the point to avoid stacking
            pos.x += (Math.random() - 0.5) * 2;
            pos.z += (Math.random() - 0.5) * 2;

            if (sp.metadata && sp.metadata.enemyType) {
                enemyType = sp.metadata.enemyType;
            }
        } else {
            // Fallback to random circle around player (should be disabled by design but good for safety)
            // Or just return if we strictly want manual spawns
            return;
        }

        this.createEnemy(pos, enemyType, playerLevel);
    }

    spawnEnemyAt(position, type, playerLevel) {
        this.createEnemy(position, type, playerLevel);
    }

    createEnemy(pos, forcedType, playerLevel) {
        // Determinar tipo de enemigo
        let isBrute = false;
        let isWorm = false;

        if (forcedType) {
            isBrute = forcedType === "brute";
            isWorm = forcedType === "worm";
        } else {
            // Random logic if no type specified (fallback)
            const rand = Math.random();
            isBrute = rand < 0.3;
            isWorm = rand >= 0.3 && rand < 0.65;
        }

        let enemyMesh;

        // Intentar usar modelos 3D primero, si están disponibles
        if (isWorm && this.wormTemplate) {
            // CLONAR LA PLANTILLA WORM
            enemyMesh = this.wormTemplate.clone("worm_" + Date.now());
            enemyMesh.position = pos;
            enemyMesh.position.y = 0.5;
            enemyMesh.setEnabled(true); // Hacer visible el clon

            enemyMesh.metadata = {
                type: "worm",
                hp: GameConfig.enemies.baseWormHP + (playerLevel * GameConfig.enemies.hpPerLevel.worm),
                animOffset: Math.random() * 100,
                baseScaleZ: 1
            };
            enemyMesh.checkCollisions = true;
            enemyMesh.ellipsoid = new Vector3(0.4, 0.5, 0.4);
            this.shadowGenerator.addShadowCaster(enemyMesh);
        } else if (!isWorm && !isBrute && this.alienTemplate) {
            // CLONAR ALIEN
            enemyMesh = this.alienTemplate.clone("alien_" + Date.now());
            enemyMesh.position = pos;
            enemyMesh.position.y = 1;
            enemyMesh.setEnabled(true);

            enemyMesh.metadata = {
                type: "alien",
                hp: GameConfig.enemies.baseAlienHP + (playerLevel * GameConfig.enemies.hpPerLevel.alien),
                animOffset: Math.random() * 100
            };
            enemyMesh.checkCollisions = true;
            enemyMesh.ellipsoid = new Vector3(0.4, 1, 0.4);
            this.shadowGenerator.addShadowCaster(enemyMesh);
        } else if (isBrute && this.bruteTemplate) {
            // CLONAR BRUTE
            enemyMesh = this.bruteTemplate.clone("brute_" + Date.now());
            enemyMesh.position = pos;
            enemyMesh.position.y = 1.5;
            enemyMesh.setEnabled(true);

            enemyMesh.metadata = {
                type: "brute",
                hp: GameConfig.enemies.baseBruteHP + (playerLevel * GameConfig.enemies.hpPerLevel.brute),
                animOffset: Math.random() * 100
            };
            enemyMesh.checkCollisions = true;
            enemyMesh.ellipsoid = new Vector3(1, 1.5, 1);
            this.shadowGenerator.addShadowCaster(enemyMesh);
        } else if (isBrute) {
            // FALLBACK: Geometría de respaldo para Brute
            // Brute - Enemigo grande, lento y resistente
            const body = MeshBuilder.CreateBox("bruteBody", { width: 2.5, height: 3, depth: 2.5 }, this.scene);
            body.position = pos;
            body.position.y = 1.5;
            const mat = this.bruteMatBase.clone("bMat" + Date.now());
            body.material = mat;

            // Cabeza grande
            const head = MeshBuilder.CreateBox("bruteHead", { width: 1.5, height: 1.5, depth: 1.5 }, this.scene);
            head.position = new Vector3(0, 2.25, 0);
            head.parent = body;
            head.material = mat;

            // Brazos grandes
            const armL = MeshBuilder.CreateBox("bruteArmL", { width: 0.8, height: 2.5, depth: 0.8 }, this.scene);
            armL.position = new Vector3(1.65, 0.5, 0);
            armL.parent = body;
            armL.material = mat;

            const armR = MeshBuilder.CreateBox("bruteArmR", { width: 0.8, height: 2.5, depth: 0.8 }, this.scene);
            armR.position = new Vector3(-1.65, 0.5, 0);
            armR.parent = body;
            armR.material = mat;

            // Piernas
            const legL = MeshBuilder.CreateBox("bruteLegL", { width: 0.7, height: 1.5, depth: 0.7 }, this.scene);
            legL.position = new Vector3(0.6, -1.25, 0);
            legL.parent = body;
            legL.material = mat;

            const legR = MeshBuilder.CreateBox("bruteLegR", { width: 0.7, height: 1.5, depth: 0.7 }, this.scene);
            legR.position = new Vector3(-0.6, -1.25, 0);
            legR.parent = body;
            legR.material = mat;

            enemyMesh = body;
            enemyMesh.metadata = {
                type: "brute",
                hp: GameConfig.enemies.baseBruteHP + (playerLevel * GameConfig.enemies.hpPerLevel.brute),
                animOffset: Math.random() * 100,
                armL: armL,
                armR: armR,
                legL: legL,
                legR: legR
            };
            enemyMesh.checkCollisions = true;
            enemyMesh.ellipsoid = new Vector3(1.2, 1.5, 1.2);
            this.shadowGenerator.addShadowCaster(body);
        } else if (isWorm) {
            enemyMesh = MeshBuilder.CreateTube(
                "worm",
                {
                    path: [new Vector3(0, 0, -1), new Vector3(0, 0, 1)],
                    radius: 0.4,
                    cap: Mesh.CAP_ALL
                },
                this.scene
            );
            enemyMesh.position = pos;
            enemyMesh.position.y = 0.5;
            enemyMesh.material = this.wormMatBase.clone("wMat" + Date.now());
            enemyMesh.rotation.y = Math.random() * Math.PI * 2;
            enemyMesh.metadata = {
                type: "worm",
                hp: GameConfig.enemies.baseWormHP + (playerLevel * GameConfig.enemies.hpPerLevel.worm),
                animOffset: Math.random() * 100,
                baseScaleZ: 1
            };
            enemyMesh.checkCollisions = true;
            enemyMesh.ellipsoid = new Vector3(0.4, 0.5, 0.4);
            this.shadowGenerator.addShadowCaster(enemyMesh);
        } else {
            // FALLBACK: Geometría de respaldo para Alien
            const body = MeshBuilder.CreateCylinder("eBody", { height: 2, diameter: 0.8 }, this.scene);
            body.rotation.x = Math.PI / 2;
            body.position = pos;
            const mat = this.alienMatBase.clone("aMat" + Date.now());
            body.material = mat;

            const head = MeshBuilder.CreateSphere("head", { diameter: 1 }, this.scene);
            head.scaling = new Vector3(0.8, 1, 2.5);
            head.position = new Vector3(0, 1, -0.5);
            head.parent = body;
            head.material = mat;

            const armL = MeshBuilder.CreateBox("armL", { height: 2.5, width: 0.3, depth: 0.3 }, this.scene);
            armL.position = new Vector3(0.8, 0, 0.5);
            armL.rotation.z = Math.PI / 2;
            armL.parent = body;
            armL.material = mat;

            const armR = MeshBuilder.CreateBox("armR", { height: 2.5, width: 0.3, depth: 0.3 }, this.scene);
            armR.position = new Vector3(-0.8, 0, 0.5);
            armR.rotation.z = Math.PI / 2;
            armR.parent = body;
            armR.material = mat;

            enemyMesh = body;
            enemyMesh.metadata = {
                type: "alien",
                hp: GameConfig.enemies.baseAlienHP + (playerLevel * GameConfig.enemies.hpPerLevel.alien),
                animOffset: Math.random() * 100,
                armL: armL,
                armR: armR
            };
            enemyMesh.checkCollisions = true;
            enemyMesh.ellipsoid = new Vector3(0.5, 1, 0.5);
            this.shadowGenerator.addShadowCaster(body);
        }

        this.enemies.push(enemyMesh);
        return enemyMesh;
    }

    update(dt, player, time) {
        this.enemies.forEach(e => {
            if (!e.metadata || e.isDisposed()) return;

            e.lookAt(player.mesh.position);

            // Separation logic (avoid stacking)
            let separation = Vector3.Zero();
            let count = 0;
            this.enemies.forEach(other => {
                if (other !== e && !other.isDisposed()) {
                    const dist = Vector3.Distance(e.position, other.position);
                    if (dist < 2.5) { // Too close
                        const push = e.position.subtract(other.position).normalize();
                        separation.addInPlace(push.scale(1.5 / dist)); // Stronger push if closer
                        count++;
                    }
                }
            });

            // Surround logic
            const distToPlayer = Vector3.Distance(e.position, player.mesh.position);
            const moveSpeed = GameConfig.enemies.moveSpeed[e.metadata.type] || 6;
            let dir = player.mesh.position.subtract(e.position).normalize();

            if (count > 0) {
                // Apply separation force
                dir.addInPlace(separation.scale(1.5));
                dir.normalize();
            }

            // If close enough, try to move sideways to surround
            if (distToPlayer < 5 && this.enemies.length > 2) {
                const right = Vector3.Cross(dir, new Vector3(0, 1, 0));
                // Randomly choose left or right based on index or ID to avoid jitter
                const sideDir = (this.enemies.indexOf(e) % 2 === 0) ? right : right.scale(-1);
                dir.addInPlace(sideDir.scale(0.8));
                dir.normalize();
            }

            // Move with collision
            // Apply status effects (Slow)
            let currentSpeed = moveSpeed;
            if (e.metadata.statusEffects) {
                const now = Date.now();
                // Shock/Slow
                if (e.metadata.statusEffects.slow) {
                    if (now < e.metadata.statusEffects.slow.endTime) {
                        currentSpeed *= e.metadata.statusEffects.slow.magnitude;
                        // Visual effect for slow (e.g., blue tint or jitter)
                        if (Math.random() < 0.1) {
                            // Maybe spawn a spark?
                        }
                    } else {
                        delete e.metadata.statusEffects.slow;
                    }
                }
            }

            e.moveWithCollisions(dir.scale(currentSpeed * dt));

            if (e.metadata.type === "alien") {
                const swing = Math.sin(time * 15 + e.metadata.animOffset) * 0.8;
                e.metadata.armL.rotation.z = Math.PI / 2 + swing;
                e.metadata.armR.rotation.z = Math.PI / 2 - swing;
                e.position.y = 1 + Math.abs(Math.sin(time * 12)) * 0.2;
            } else if (e.metadata.type === "worm") {
                const stretch = 1 + Math.sin(time * 10 + e.metadata.animOffset) * 0.3;
                e.scaling.z = stretch;
            } else if (e.metadata.type === "brute") {
                // Animación para el brute - movimiento pesado
                const heavySwing = Math.sin(time * 8 + e.metadata.animOffset) * 0.3;
                e.metadata.armL.rotation.z = Math.PI / 2 + heavySwing;
                e.metadata.armR.rotation.z = Math.PI / 2 - heavySwing;

                // Movimiento vertical más pesado
                e.position.y = 1.5 + Math.abs(Math.sin(time * 6)) * 0.15;
            }
        });
    }

    applyStatusEffect(enemy, type, duration, magnitude) {
        if (!enemy.metadata) return;
        if (!enemy.metadata.statusEffects) enemy.metadata.statusEffects = {};

        const now = Date.now();
        if (type === "slow") {
            enemy.metadata.statusEffects.slow = {
                endTime: now + duration,
                magnitude: magnitude
            };
            // Visual feedback
            if (enemy.material) {
                // Flash blue
                const oldEmissive = enemy.material.emissiveColor.clone();
                enemy.material.emissiveColor = new Color3(0, 0.5, 1);
                setTimeout(() => {
                    if (enemy && !enemy.isDisposed() && enemy.material) {
                        enemy.material.emissiveColor = oldEmissive;
                    }
                }, 500);
            }
        }
    }

    applyDamage(enemy, damage) {
        if (!enemy.metadata || enemy.isDisposed()) return;

        enemy.metadata.hp -= damage;

        // Sonido de impacto
        if (this.soundManager) {
            this.soundManager.play('enemy_hit');
        }

        // Flash white on hit (solo si tiene material)
        if (enemy.material) {
            if (!enemy.metadata.originalEmissive) {
                enemy.metadata.originalEmissive = enemy.material.emissiveColor.clone();
            }
            enemy.material.emissiveColor = new Color3(1, 1, 1);
            setTimeout(() => {
                if (enemy && !enemy.isDisposed() && enemy.material && enemy.metadata.originalEmissive) {
                    enemy.material.emissiveColor = enemy.metadata.originalEmissive;
                }
            }, 50);
        } else {
            // Para modelos 3D, hacer un efecto visual de escala
            const originalScale = enemy.scaling.clone();
            enemy.scaling.scaleInPlace(1.1);
            setTimeout(() => {
                if (enemy && !enemy.isDisposed()) {
                    enemy.scaling = originalScale;
                }
            }, 50);
        }

        return enemy.metadata.hp <= 0;
    }

    killEnemy(enemy) {
        const idx = this.enemies.indexOf(enemy);
        if (idx !== -1) {
            this.enemies.splice(idx, 1);
        }
        enemy.dispose();
    }
}
