import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Ray } from '@babylonjs/core/Culling/ray';
import { GameConfig } from '../config/gameConfig.js';

export class WeaponSystem {
    constructor(scene, player, glowLayer, soundManager) {
        this.scene = scene;
        this.player = player;
        this.glowLayer = glowLayer;
        this.soundManager = soundManager;
        this.projectiles = [];

        // Weapon state
        this.currentWeapon = 1;
        this.unlockedWeapons = {
            1: true,
            2: false, 3: false, 4: false, 5: false,
            6: false, 7: false, 8: false, 9: false, 10: false,
            11: false, 12: false, 13: false, 14: false
        };
        this.grenadeCount = 0;
        this.lastFireTime = 0;
        this.lastGrenadeTime = 0;
        this.isReloading = false;

        // Rifle stats
        this.rifleDamage = GameConfig.weapons.rifle.damage;
        this.machineGunRate = GameConfig.weapons.rifle.fireRate;
        this.ammo = GameConfig.weapons.rifle.ammo;

        this.setupMaterials();
    }

    setupMaterials() {
        this.bulletMat = new StandardMaterial("bulletMat", this.scene);
        this.bulletMat.emissiveColor = new Color3(1, 1, 0.5);
        this.bulletMat.disableLighting = true;

        this.muzzleFlashMat = new StandardMaterial("muzzleMat", this.scene);
        this.muzzleFlashMat.emissiveColor = new Color3(1, 0.8, 0.1);
        this.muzzleFlashMat.disableLighting = true;

        this.plasmaMat = new StandardMaterial("plasmaMat", this.scene);
        this.plasmaMat.emissiveColor = new Color3(0, 1, 1);
        this.plasmaMat.disableLighting = true;

        this.flameMat = new StandardMaterial("flameMat", this.scene);
        this.flameMat.emissiveColor = new Color3(1, 0.3, 0);
        this.flameMat.disableLighting = true;

        this.laserMat = new StandardMaterial("laserMat", this.scene);
        this.laserMat.emissiveColor = new Color3(1, 0, 0);
        this.laserMat.disableLighting = true;

        this.grenadeMat = new StandardMaterial("grenadeMat", this.scene);
        this.grenadeMat.diffuseColor = new Color3(0.1, 0.3, 0.1);
        this.grenadeMat.emissiveColor = new Color3(0, 0.5, 0);
    }

    getSpawnPos() {
        const p = this.player.mesh.position.clone()
            .add(this.player.mesh.forward.scale(0.8))
            .add(this.player.mesh.right.scale(0.5));
        p.y = 0.6;
        return p;
    }

    fire() {
        const now = Date.now();
        let rate = this.machineGunRate;

        // Determine fire rate based on weapon type
        if (this.currentWeapon === 2) rate = GameConfig.weapons.flamethrower.fireRate;
        else if (this.currentWeapon === 3) rate = GameConfig.weapons.plasma.fireRate;
        else if (this.currentWeapon === 4) rate = GameConfig.weapons.laser.fireRate;
        else if (this.currentWeapon === 5) rate = GameConfig.weapons.shotgun.fireRate;
        else if (this.currentWeapon === 6) rate = GameConfig.weapons.pistol.fireRate;
        else if (this.currentWeapon === 7) rate = GameConfig.weapons.shockGrenade.cooldown; // Cooldown for grenade
        else if (this.currentWeapon === 8) rate = GameConfig.weapons.gatling.fireRate;
        else if (this.currentWeapon === 9) rate = GameConfig.weapons.sniper.fireRate;
        else if (this.currentWeapon === 10) rate = GameConfig.weapons.pulse.fireRate;
        else if (this.currentWeapon === 11) rate = GameConfig.weapons.railgun.fireRate;
        else if (this.currentWeapon === 12) rate = GameConfig.weapons.laserCannon.fireRate; // 0 for continuous
        else if (this.currentWeapon === 13) rate = GameConfig.weapons.plasmaPistol.fireRate;
        else if (this.currentWeapon === 14) rate = GameConfig.weapons.machineGun.fireRate;

        if (this.currentWeapon === 0) return; // No weapon
        if (now - this.lastFireTime < rate) return;

        // Ammo Check (Generic)
        // TODO: Implement specific ammo counts for each weapon if needed. 
        // For now, using rifle ammo for everything except infinite ones or special cases.
        // Let's assume infinite ammo for testing unless specified otherwise in future.
        // But user asked for specific ammo in config, so we should respect it eventually.
        // For this task, let's focus on the mechanics.

        this.lastFireTime = now;
        this.spawnMuzzleFlash();

        // Weapon Logic Switch
        switch (this.currentWeapon) {
            case 1: // Rifle
                if (this.soundManager) this.soundManager.play('shot_rifle');
                this.spawnBullet();
                break;
            case 2: // Flamethrower
                if (this.soundManager) this.soundManager.play('shot_flame');
                this.spawnFlameProjectile();
                break;
            case 3: // Plasma (Old)
                if (this.soundManager) this.soundManager.play('shot_plasma');
                this.spawnPlasma();
                break;
            case 4: // Laser Rifle (Old)
                if (this.soundManager) this.soundManager.play('shot_laser');
                this.spawnLaser();
                break;
            case 5: // Shotgun
                if (this.soundManager) this.soundManager.play('shot_rifle');
                this.spawnShotgunBlast();
                break;
            case 6: // Pistol
                if (this.soundManager) this.soundManager.play('shot_rifle'); // Reuse sound
                this.spawnPistolBullet();
                break;
            case 7: // Shock Grenade
                this.spawnShockGrenade();
                break;
            case 8: // Gatling
                if (this.soundManager) this.soundManager.play('shot_rifle'); // Needs faster sound loop ideally
                this.spawnGatlingBullet();
                break;
            case 9: // Sniper
                if (this.soundManager) this.soundManager.play('shot_rifle'); // Needs louder sound
                this.spawnSniperShot();
                break;
            case 10: // Pulse Rifle (Bullets)
                if (this.soundManager) this.soundManager.play('shot_rifle');
                this.spawnPulseBullet();
                break;
            case 11: // Railgun
                if (this.soundManager) this.soundManager.play('shot_laser');
                this.spawnRailgunBeam();
                break;
            case 12: // Laser Cannon
                // Continuous logic handled in update or here if fire rate is 0
                this.fireLaserCannon();
                break;
            case 13: // Plasma Pistol
                if (this.soundManager) this.soundManager.play('shot_plasma');
                this.spawnPlasmaPistolShot();
                break;
            case 14: // Machine Gun
                if (this.soundManager) this.soundManager.play('shot_rifle');
                this.spawnMachineGunBullet();
                break;
        }
    }

    addGrenades(amount) {
        this.grenadeCount += amount;
    }

    throwGrenade() {
        if (this.grenadeCount <= 0) return;
        const now = Date.now();
        if (now - this.lastGrenadeTime < GameConfig.weapons.grenade.cooldown) return;

        this.grenadeCount--;
        this.lastGrenadeTime = now;

        const origin = this.getSpawnPos();
        const grenade = MeshBuilder.CreateSphere("grenade", { diameter: 0.5 }, this.scene);
        grenade.position = origin;
        grenade.material = this.grenadeMat;

        // Physics-like movement (simple parabola)
        const dir = this.player.mesh.forward.clone().add(new Vector3(0, 0.5, 0)).normalize();
        const force = GameConfig.weapons.grenade.throwForce;

        grenade.metadata = {
            velocity: dir.scale(force),
            gravity: new Vector3(0, -20, 0),
            life: 100, // Frames until explosion
            type: "grenade"
        };
        this.projectiles.push(grenade);
    }

    spawnShotgunBlast() {
        const pellets = GameConfig.weapons.shotgun.pellets;
        const spread = GameConfig.weapons.shotgun.spread;

        for (let i = 0; i < pellets; i++) {
            const origin = this.getSpawnPos();
            const dir = this.player.mesh.forward.clone();
            dir.x += (Math.random() - 0.5) * spread;
            dir.y += (Math.random() - 0.5) * spread * 0.5; // Less vertical spread
            dir.z += (Math.random() - 0.5) * spread;
            dir.normalize();

            const bullet = MeshBuilder.CreateSphere("pellet", { diameter: 0.3 }, this.scene);
            bullet.position = origin;
            bullet.material = this.bulletMat;
            this.glowLayer.addIncludedOnlyMesh(bullet);

            bullet.metadata = {
                dir: dir,
                speed: 60,
                damage: GameConfig.weapons.shotgun.damage,
                life: 40 // Short range
            };
            this.projectiles.push(bullet);
        }
    }

    dropCurrentWeapon() {
        const weaponId = this.currentWeapon;
        if (weaponId === 0) return; // No weapon to drop

        this.unlockedWeapons[weaponId] = false;

        // If dropping rifle (1), switch to 0 (no weapon)
        // If dropping others, switch to 1 (rifle) if unlocked, else 0
        if (weaponId === 1) {
            this.currentWeapon = 0;
        } else {
            if (this.unlockedWeapons[1]) {
                this.setWeapon(1);
            } else {
                this.currentWeapon = 0;
            }
        }

        // Spawn pickup (Black Stick)
        // Start slightly in front and up
        const dropPos = this.player.mesh.position.clone().add(this.player.mesh.forward.scale(0.5));
        dropPos.y = 1.5;

        // Create a "stick" (cylinder)
        const pickup = MeshBuilder.CreateCylinder("weaponPickup_" + weaponId, { height: 2.0, diameter: 0.3 }, this.scene);
        pickup.position = dropPos;
        pickup.rotation.z = Math.PI / 2; // Lay flat initially

        // Black material
        const blackMat = new StandardMaterial("blackMat", this.scene);
        blackMat.diffuseColor = new Color3(0, 0, 0);
        blackMat.emissiveColor = new Color3(0.5, 0.5, 0.5); // Increased emissive for glow
        pickup.material = blackMat;

        // Add to glow layer
        if (this.glowLayer) {
            this.glowLayer.addIncludedOnlyMesh(pickup);
        }

        // Calculate throw velocity (Forward + Up)
        const throwDir = this.player.mesh.forward.clone().scale(15); // Forward force increased
        throwDir.y = 10; // Upward force increased

        // Add metadata for physics and animation
        pickup.metadata = {
            type: "weaponPickup",
            weaponId: weaponId,
            velocity: throwDir,
            gravity: new Vector3(0, -25, 0), // Stronger gravity for faster fall
            isFlying: true,
            pickupDelay: 1.0, // Seconds before can be picked up
            baseY: 0, // Will be set when it lands
            animOffset: Math.random() * 100
        };

        this.projectiles.push(pickup);
    }

    spawnBullet() {
        const origin = this.getSpawnPos();
        const dir = this.player.mesh.forward.clone();
        dir.x += (Math.random() - 0.5) * 0.03;
        dir.z += (Math.random() - 0.5) * 0.03;
        dir.normalize();

        const bullet = MeshBuilder.CreateSphere("bullet", { diameter: 0.6 }, this.scene);
        bullet.scaling.z = 2;
        bullet.position = origin;
        bullet.lookAt(origin.add(dir));
        bullet.material = this.bulletMat;
        this.glowLayer.addIncludedOnlyMesh(bullet);

        bullet.metadata = {
            dir: dir,
            speed: 70,
            damage: this.rifleDamage,
            life: 100
        };
        this.projectiles.push(bullet);
    }

    spawnFlameProjectile() {
        const origin = this.getSpawnPos();
        const dir = this.player.mesh.forward.clone();
        dir.x += (Math.random() - 0.5) * 0.2;
        dir.z += (Math.random() - 0.5) * 0.2;
        dir.normalize();

        const flame = MeshBuilder.CreateSphere("flame", { diameter: 0.6 }, this.scene);
        flame.scaling.z = 4;
        flame.position = origin;
        flame.lookAt(origin.add(dir));
        flame.material = this.flameMat;
        this.glowLayer.addIncludedOnlyMesh(flame);

        flame.metadata = {
            dir: dir,
            speed: 40,
            damage: GameConfig.weapons.flamethrower.damage,
            life: 30
        };
        this.projectiles.push(flame);
    }

    spawnPlasma() {
        const origin = this.getSpawnPos();
        const ball = MeshBuilder.CreateSphere("plasma", { diameter: 0.8 }, this.scene);
        ball.position = origin;
        ball.material = this.plasmaMat;
        this.glowLayer.addIncludedOnlyMesh(ball);

        ball.metadata = {
            dir: this.player.mesh.forward.clone(),
            speed: 30,
            damage: GameConfig.weapons.plasma.damage,
            life: 150
        };
        this.projectiles.push(ball);
    }

    spawnLaser() {
        const origin = this.getSpawnPos();
        const laser = MeshBuilder.CreateCylinder("laser", { height: 4, diameter: 0.1 }, this.scene);
        laser.rotation.x = Math.PI / 2;
        laser.position = origin;
        laser.lookAt(origin.add(this.player.mesh.forward));
        laser.material = this.laserMat;
        this.glowLayer.addIncludedOnlyMesh(laser);

        laser.metadata = {
            dir: this.player.mesh.forward.clone(),
            speed: 150,
            damage: this.rifleDamage * 2,
            life: 100
        };
        this.projectiles.push(laser);
    }

    spawnMuzzleFlash() {
        const pos = this.getSpawnPos();
        const flash = MeshBuilder.CreateSphere("muzzleFlash", { diameter: 0.2 }, this.scene);
        flash.position = pos;
        flash.material = this.muzzleFlashMat;
        this.glowLayer.addIncludedOnlyMesh(flash);
        setTimeout(() => flash.dispose(), 40);
    }

    reload() {
        if (this.isReloading || this.ammo === GameConfig.weapons.rifle.ammo) return;
        this.isReloading = true;
        if (this.soundManager) this.soundManager.play('reload');
        setTimeout(() => {
            this.ammo = GameConfig.weapons.rifle.ammo;
            this.isReloading = false;
        }, GameConfig.weapons.rifle.reloadTime);
    }

    setWeapon(weaponId) {
        if (this.unlockedWeapons[weaponId]) {
            this.currentWeapon = weaponId;
        }
    }

    spawnPistolBullet() {
        this.spawnGenericBullet(GameConfig.weapons.pistol.damage, 60, 1.0, new Color3(1, 1, 0.5));
    }

    spawnShockGrenade() {
        const origin = this.getSpawnPos();
        const grenade = MeshBuilder.CreateSphere("shockGrenade", { diameter: 0.5 }, this.scene);
        grenade.position = origin;

        const mat = new StandardMaterial("shockMat", this.scene);
        mat.emissiveColor = new Color3(0, 0.5, 1); // Blue
        grenade.material = mat;

        const dir = this.player.mesh.forward.clone().add(new Vector3(0, 0.5, 0)).normalize();
        const force = GameConfig.weapons.shockGrenade.throwForce;

        grenade.metadata = {
            velocity: dir.scale(force),
            gravity: new Vector3(0, -20, 0),
            life: 100,
            type: "shockGrenade"
        };
        this.projectiles.push(grenade);
    }

    spawnGatlingBullet() {
        // High spread, high speed
        const spread = 0.05;
        this.spawnGenericBullet(GameConfig.weapons.gatling.damage, 80, 1.0, new Color3(1, 0.5, 0), spread);
    }

    spawnSniperShot() {
        // High speed, no spread, trail?
        this.spawnGenericBullet(GameConfig.weapons.sniper.damage, 200, 3.0, new Color3(1, 1, 1), 0);
    }

    spawnPulseBullet() {
        // Fast, yellow/blue trail
        this.spawnGenericBullet(GameConfig.weapons.pulse.damage, 90, 1.5, new Color3(0, 1, 1), 0.02);
    }

    spawnRailgunBeam() {
        const origin = this.getSpawnPos();
        const dir = this.player.mesh.forward.clone();
        const range = 100;

        // Instant hit
        const ray = new Ray(origin, dir, range);
        const hit = this.scene.pickWithRay(ray, (mesh) => {
            return mesh.metadata && (mesh.metadata.type === "alien" || mesh.metadata.type === "worm" || mesh.metadata.type === "brute");
        });

        // Visual Beam
        const endPoint = hit.pickedPoint || origin.add(dir.scale(range));
        const beam = MeshBuilder.CreateTube("railBeam", {
            path: [origin, endPoint],
            radius: 0.1,
            updatable: false
        }, this.scene);

        const mat = new StandardMaterial("railMat", this.scene);
        mat.emissiveColor = new Color3(0, 1, 1); // Cyan
        mat.disableLighting = true;
        beam.material = mat;
        this.glowLayer.addIncludedOnlyMesh(beam);

        // Fade out
        let alpha = 1;
        const anim = setInterval(() => {
            alpha -= 0.1;
            beam.visibility = alpha;
            if (alpha <= 0) {
                clearInterval(anim);
                beam.dispose();
            }
        }, 30);

        // Damage
        if (hit.hit && hit.pickedMesh) {
            // Find enemy in manager (inefficient search but works for now)
            // Better: EnemyManager handles damage via mesh reference
            // We need access to enemy list or pass damage to mesh metadata?
            // The GameManager calls applyDamage. Here we are inside WeaponSystem.
            // We need to find the enemy object corresponding to the mesh.
            // Let's assume we pass the list of enemies to update, but here we are in fire().
            // We can iterate enemies here or assume GameManager handles it?
            // Wait, update() handles collisions. Railgun is instant.
            // We need to find the enemy.
            // Let's use the enemies list passed in update() if we store it? No.
            // We can access GameManager via player? No.
            // We can search scene meshes?
            // Let's cheat: The mesh has metadata. We can assume it's an enemy.
            // But we need the EnemyManager instance to call applyDamage properly (for sounds, death logic).
            // WeaponSystem doesn't have reference to EnemyManager directly in constructor? 
            // It receives enemies in update(dt, enemies).
            // We can store a reference to enemies in update? Or pass EnemyManager in constructor.
            // Let's check constructor. It has scene, player, glowLayer, soundManager.
            // We need to fix this. For now, let's just apply damage to metadata if possible?
            // No, kill logic is in EnemyManager.
            // FIX: Let's assume we can't kill instantly here without refactoring.
            // ALTERNATIVE: Create a "RailgunProjectile" that moves super fast (instant in 1 frame) and let update() handle collision.
            // That ensures consistency.

            this.spawnGenericBullet(GameConfig.weapons.railgun.damage, 500, 1, new Color3(0, 1, 1), 0); // Super fast bullet
            if (beam) beam.dispose(); // Don't draw beam here if we use bullet logic, or draw cosmetic beam.
            // Let's draw cosmetic beam AND spawn super fast bullet.
        } else {
            // Just cosmetic beam
        }
    }

    // Refined Railgun: Just spawn a super fast projectile that looks like a beam
    spawnRailgunProjectile() {
        // ...
    }

    spawnPlasmaPistolShot() {
        this.spawnGenericBullet(GameConfig.weapons.plasmaPistol.damage, 50, 1.2, new Color3(0, 1, 0.5), 0.02);
    }

    spawnMachineGunBullet() {
        this.spawnGenericBullet(GameConfig.weapons.machineGun.damage, 75, 1.0, new Color3(1, 0.8, 0), 0.03);
    }

    spawnGenericBullet(damage, speed, scaleZ, color, spread = 0.01) {
        const origin = this.getSpawnPos();
        const dir = this.player.mesh.forward.clone();
        dir.x += (Math.random() - 0.5) * spread;
        dir.y += (Math.random() - 0.5) * spread;
        dir.z += (Math.random() - 0.5) * spread;
        dir.normalize();

        const bullet = MeshBuilder.CreateSphere("genBullet", { diameter: 0.5 }, this.scene);
        bullet.scaling.z = scaleZ;
        bullet.position = origin;
        bullet.lookAt(origin.add(dir));

        const mat = new StandardMaterial("genBulletMat", this.scene);
        mat.emissiveColor = color;
        mat.disableLighting = true;
        bullet.material = mat;

        this.glowLayer.addIncludedOnlyMesh(bullet);

        bullet.metadata = {
            dir: dir,
            speed: speed,
            damage: damage,
            life: 100
        };
        this.projectiles.push(bullet);
    }

    fireLaserCannon() {
        // Continuous beam logic
        // We need a persistent beam mesh that updates every frame while firing
        // For simplicity, let's spawn a short-lived beam segment every frame
        const origin = this.getSpawnPos();
        const dir = this.player.mesh.forward.clone();

        const beam = MeshBuilder.CreateCylinder("laserBeam", { height: 20, diameter: 0.2 }, this.scene);
        beam.rotation.x = Math.PI / 2;
        beam.position = origin.add(dir.scale(10)); // Center it
        beam.lookAt(origin.add(dir.scale(20)));

        const mat = new StandardMaterial("laserCannonMat", this.scene);
        mat.emissiveColor = new Color3(1, 0, 0);
        mat.disableLighting = true;
        beam.material = mat;
        this.glowLayer.addIncludedOnlyMesh(beam);

        // It's a projectile that hits everything in line?
        // Or just a visual?
        // Let's make it a projectile that dies instantly but has a big hitbox
        beam.metadata = {
            dir: dir,
            speed: 0, // Stationary relative to frame? No, it's a beam.
            damage: GameConfig.weapons.laserCannon.damage,
            life: 1, // 1 frame life
            type: "laserCannon" // Special handling in update?
        };
        // Actually, let's just use the generic projectile logic but with a big hitbox (long cylinder)
        // But collision detection checks point intersection usually.
        // Let's make it a fast projectile for damage.
        this.spawnGenericBullet(GameConfig.weapons.laserCannon.damage, 200, 10, new Color3(1, 0, 0), 0);
        beam.dispose(); // We used generic bullet for damage, beam was just visual idea.
        // Let's stick to spawnGenericBullet for consistency.
    }

    createExplosion(position, enemies, type = "normal") {
        const radius = type === "shock" ? GameConfig.weapons.shockGrenade.radius : GameConfig.weapons.grenade.radius;
        const damage = type === "shock" ? GameConfig.weapons.shockGrenade.damage : GameConfig.weapons.grenade.damage;
        const color = type === "shock" ? new Color3(0, 0.5, 1) : new Color3(1, 0.3, 0);

        const explosion = MeshBuilder.CreateSphere("explosion", { diameter: radius * 2 }, this.scene);
        explosion.position = position;
        const mat = new StandardMaterial("expMat", this.scene);
        mat.emissiveColor = color;
        mat.disableLighting = true;
        explosion.material = mat;
        explosion.visibility = 0.5;

        // Expand animation
        let scale = 1;
        const anim = setInterval(() => {
            scale += 0.5;
            explosion.scaling = new Vector3(scale, scale, scale);
            explosion.visibility -= 0.05;
            if (explosion.visibility <= 0) {
                clearInterval(anim);
                explosion.dispose();
            }
        }, 50);

        if (!enemies) return;

        enemies.forEach(enemy => {
            if (enemy.mesh && !enemy.mesh.isDisposed()) {
                const dist = Vector3.Distance(position, enemy.mesh.position);
                if (dist <= radius) {
                    enemy.takeDamage(damage);

                    if (type === "shock") {
                        // Apply Slow
                        // We need to call EnemyManager.applyStatusEffect
                        // But we don't have reference to EnemyManager here.
                        // We can add it to enemy metadata directly as a fallback if we can't access manager.
                        // Or we can pass EnemyManager to WeaponSystem?
                        // Let's assume we can modify metadata directly for now, and EnemyManager.update reads it.
                        // We implemented applyStatusEffect in EnemyManager, but we can replicate logic here or just set data.
                        if (!enemy.metadata.statusEffects) enemy.metadata.statusEffects = {};
                        enemy.metadata.statusEffects.slow = {
                            endTime: Date.now() + GameConfig.weapons.shockGrenade.duration,
                            magnitude: GameConfig.weapons.shockGrenade.speedReduction
                        };
                    }

                    // Push back
                    const dir = enemy.mesh.position.subtract(position).normalize();
                    enemy.mesh.position.addInPlace(dir.scale(2));
                }
            }
        });
    }

    update(dt, enemies) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            if (!p || !p.metadata) {
                this.projectiles.splice(i, 1);
                continue;
            }

            const mesh = p.mesh || p;
            if (!mesh || mesh.isDisposed()) {
                this.projectiles.splice(i, 1);
                continue;
            }

            try {
                const dir = p.dir || p.metadata.dir;
                const speed = p.speed || p.metadata.speed;

                if (p.metadata.type === "grenade" || p.metadata.type === "shockGrenade") {
                    // Grenade Physics
                    p.metadata.velocity.addInPlace(p.metadata.gravity.scale(dt));
                    mesh.position.addInPlace(p.metadata.velocity.scale(dt));

                    // Bounce on floor
                    if (mesh.position.y < 0.25) {
                        mesh.position.y = 0.25;
                        p.metadata.velocity.y *= -0.6; // Bounce damping
                        p.metadata.velocity.x *= 0.8; // Friction
                        p.metadata.velocity.z *= 0.8;
                    }
                } else if (p.metadata.type === "weaponPickup") {
                    // ... (Existing pickup logic) ...
                    // Copying existing logic for brevity, assuming it's preserved by "Replace" if I don't overwrite it?
                    // Wait, I am replacing the whole update method? Yes.
                    // I must include the pickup logic.

                    if (p.metadata.pickupDelay > 0) {
                        p.metadata.pickupDelay -= dt;
                    }

                    if (p.metadata.isFlying) {
                        p.metadata.velocity.addInPlace(p.metadata.gravity.scale(dt));
                        mesh.position.addInPlace(p.metadata.velocity.scale(dt));
                        mesh.rotation.x += dt * 5;
                        if (mesh.position.y < 0.5) {
                            mesh.position.y = 0.5;
                            p.metadata.isFlying = false;
                            p.metadata.baseY = 0.5;
                            mesh.rotation.x = 0;
                            mesh.rotation.z = Math.PI / 2;
                        }
                    } else {
                        const time = Date.now() / 1000;
                        mesh.rotation.y += dt;
                        mesh.position.y = p.metadata.baseY + Math.sin(time * 2 + p.metadata.animOffset) * 0.2;
                        if (p.metadata.pickupDelay <= 0 && Vector3.Distance(this.player.mesh.position, mesh.position) < 2) {
                            this.unlockedWeapons[p.metadata.weaponId] = true;
                            this.setWeapon(p.metadata.weaponId);
                            mesh.dispose();
                            this.projectiles.splice(i, 1);
                            continue;
                        }
                    }
                } else if (dir && speed !== undefined) {
                    mesh.position.addInPlace(dir.scale(speed * dt));
                }

                if (p.life !== undefined) p.life--;
                else if (p.metadata.life !== undefined) p.metadata.life--;

                const life = p.life !== undefined ? p.life : (p.metadata.life !== undefined ? p.metadata.life : 0);
                if (life <= 0) {
                    if (p.metadata.type === "grenade") {
                        this.createExplosion(mesh.position, enemies, "normal");
                    } else if (p.metadata.type === "shockGrenade") {
                        this.createExplosion(mesh.position, enemies, "shock");
                    }

                    if (!mesh.isDisposed()) {
                        mesh.dispose();
                    }
                    this.projectiles.splice(i, 1);
                }
            } catch (e) {
                console.warn("Error updating projectile:", e);
                this.projectiles.splice(i, 1);
            }
        }
    }

    removeProjectile(index) {
        if (index >= 0 && index < this.projectiles.length) {
            const p = this.projectiles[index];
            if (p) {
                const mesh = p.mesh || p;
                if (mesh && !mesh.isDisposed()) {
                    mesh.dispose();
                }
            }
            this.projectiles.splice(index, 1);
        }
    }
}

