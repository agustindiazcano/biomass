import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { GameConfig } from '../config/gameConfig.js';

export class LootManager {
    constructor(scene, glowLayer) {
        this.scene = scene;
        this.glowLayer = glowLayer;
        this.drops = [];
        
        this.setupMaterials();
    }
    
    setupMaterials() {
        this.goldMat = new StandardMaterial("goldM", this.scene);
        this.goldMat.diffuseColor = new Color3(1, 0.8, 0);
        this.goldMat.emissiveColor = new Color3(0.5, 0.4, 0);
        
        this.xpMat = new StandardMaterial("xpM", this.scene);
        this.xpMat.diffuseColor = new Color3(0, 0.5, 1);
        this.xpMat.emissiveColor = new Color3(0, 0.2, 0.5);
    }
    
    spawnLoot(position) {
        this.spawnSpecificItem(position, "gold");
        this.spawnSpecificItem(position, "xp");
    }
    
    spawnSpecificItem(position, type) {
        let mesh;
        if (type === "gold") {
            mesh = MeshBuilder.CreateCylinder("coin", { diameter: 0.5, height: 0.1 }, this.scene);
            mesh.rotation.x = Math.PI / 2;
            mesh.material = this.goldMat;
        } else {
            mesh = MeshBuilder.CreateSphere("orb", { diameter: 0.4 }, this.scene);
            mesh.material = this.xpMat;
        }
        
        mesh.position = position.clone();
        mesh.position.y = 1;
        mesh.position.x += (Math.random() - 0.5);
        mesh.position.z += (Math.random() - 0.5);
        this.glowLayer.addIncludedOnlyMesh(mesh);
        
        this.drops.push({
            mesh: mesh,
            type: type,
            rotationSpeed: Math.random() * 0.1
        });
    }
    
    update(dt, player) {
        this.drops.forEach(drop => {
            drop.mesh.rotation.y += drop.rotationSpeed;
        });
    }
    
    removeDrop(index) {
        if (this.drops[index]) {
            this.drops[index].mesh.dispose();
            this.drops.splice(index, 1);
        }
    }
}

