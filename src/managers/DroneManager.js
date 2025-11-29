import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { SpotLight } from '@babylonjs/core/Lights/spotLight';
import { GameConfig } from '../config/gameConfig.js';

export class DroneManager {
    constructor(scene, shadowGenerator, glowLayer) {
        this.scene = scene;
        this.shadowGenerator = shadowGenerator;
        this.glowLayer = glowLayer;
        this.drones = [];
        this.droneHealLevel = 0;
        this.droneAttackLevel = 0;
    }
    
    createDrone(offset) {
        const drone = MeshBuilder.CreateSphere("drone", { diameter: 0.5 }, this.scene);
        const dMat = new StandardMaterial("dMat", this.scene);
        dMat.diffuseColor = new Color3(0.1, 0.1, 0.1);
        dMat.emissiveColor = new Color3(0, 0.5, 1);
        drone.material = dMat;
        
        const eye = MeshBuilder.CreateSphere("eye", { diameter: 0.2 }, this.scene);
        eye.parent = drone;
        eye.position.z = 0.2;
        eye.position.y = 0.1;
        const eMat = new StandardMaterial("eMat", this.scene);
        eMat.emissiveColor = new Color3(1, 0, 0);
        eye.material = eMat;
        
        const droneLight = new SpotLight("dL", new Vector3(0, 0, 0), new Vector3(0, -1, 0), Math.PI / 1.5, 5, this.scene);
        droneLight.parent = drone;
        droneLight.diffuse = new Color3(0, 1, 1);
        droneLight.intensity = 3.0;
        droneLight.range = 20;
        
        drone.metadata = {
            offset: offset,
            lastAction: 0,
            angle: Math.random() * Math.PI * 2
        };
        this.shadowGenerator.addShadowCaster(drone);
        this.drones.push(drone);
    }
    
    update(dt, player, enemies) {
        this.drones.forEach((drone, i) => {
            drone.metadata.angle += dt * GameConfig.drones.orbitSpeed;
            const targetPos = player.mesh.position.add(
                new Vector3(
                    Math.cos(drone.metadata.angle + i) * GameConfig.drones.orbitRadius,
                    1.5,
                    Math.sin(drone.metadata.angle + i) * GameConfig.drones.orbitRadius
                )
            );
            drone.position = Vector3.Lerp(drone.position, targetPos, 0.05);
            drone.lookAt(player.mesh.position);
            
            const now = Date.now();
            if (now - drone.metadata.lastAction > GameConfig.drones.actionCooldown) {
                drone.metadata.lastAction = now;
                
                // Heal
                if (this.droneHealLevel > 0 && player.health < player.maxHealth) {
                    player.heal(this.droneHealLevel * GameConfig.drones.healAmount);
                }
                
                // Attack
                if (this.droneAttackLevel > 0 && enemies.length > 0) {
                    let nearest = null;
                    let minDist = 999;
                    enemies.forEach(e => {
                        const dist = Vector3.Distance(drone.position, e.position);
                        if (dist < 20 && dist < minDist) {
                            minDist = dist;
                            nearest = e;
                        }
                    });
                    
                    if (nearest) {
                        const missile = MeshBuilder.CreateBox("missile", { size: 0.3 }, this.scene);
                        missile.position = drone.position.clone();
                        missile.lookAt(nearest.position);
                        const mM = new StandardMaterial("mM", this.scene);
                        mM.emissiveColor = new Color3(1, 0, 0);
                        missile.material = mM;
                        
                        // Add to projectiles (would need to be handled by weapon system or separate)
                        // For now, we'll add it to a projectiles array if available
                    }
                }
            }
        });
    }
    
    upgradeHeal() {
        this.droneHealLevel++;
    }
    
    upgradeAttack() {
        this.droneAttackLevel++;
    }
}

