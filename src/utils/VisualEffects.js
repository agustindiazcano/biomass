import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';

export class VisualEffects {
    constructor(scene, advancedTexture, glowLayer) {
        this.scene = scene;
        this.advancedTexture = advancedTexture;
        this.glowLayer = glowLayer;
        
        this.goreMat = new StandardMaterial("goreMat", scene);
        this.goreMat.diffuseColor = new Color3(0.2, 1, 0.2);
        this.goreMat.emissiveColor = new Color3(0.2, 1, 0.2);
        this.goreMat.disableLighting = true;
    }
    
    createFloatingText(position, message, color) {
        const anchor = new TransformNode("textAnchor", this.scene);
        anchor.position = position.clone();
        anchor.position.y += 2;
        
        const rect = new Rectangle();
        rect.width = "200px";
        rect.height = "40px";
        rect.thickness = 0;
        this.advancedTexture.addControl(rect);
        rect.linkWithMesh(anchor);
        rect.linkOffsetY = -50;
        
        const txt = new TextBlock();
        txt.text = message;
        txt.color = color;
        txt.fontWeight = "bold";
        txt.fontSize = 24;
        rect.addControl(txt);
        
        let frame = 0;
        const obs = this.scene.onBeforeRenderObservable.add(() => {
            frame++;
            anchor.position.y += 0.05;
            rect.alpha -= 0.02;
            if (frame > 50) {
                rect.dispose();
                anchor.dispose();
                this.scene.onBeforeRenderObservable.remove(obs);
            }
        });
    }
    
    spawnGore(position) {
        for (let i = 0; i < 6; i++) {
            const drop = MeshBuilder.CreateSphere("gore", { diameter: 0.15 }, this.scene);
            drop.material = this.goreMat;
            drop.position = position.clone();
            const vel = new Vector3(
                (Math.random() - 0.5) * 0.5,
                Math.random() * 0.5,
                (Math.random() - 0.5) * 0.5
            );
            this.glowLayer.addIncludedOnlyMesh(drop);
            
            let life = 0;
            const anim = this.scene.onBeforeRenderObservable.add(() => {
                life++;
                vel.y -= 0.02;
                drop.position.addInPlace(vel);
                if (drop.position.y < 0) drop.position.y = 0;
                if (life > 30) {
                    drop.dispose();
                    this.scene.onBeforeRenderObservable.remove(anim);
                }
            });
        }
    }
    
    spawnDeathExplosion(position) {
        for (let i = 0; i < 30; i++) {
            const drop = MeshBuilder.CreateSphere("explosion", {
                diameter: Math.random() * 0.15 + 0.05
            }, this.scene);
            drop.material = this.goreMat;
            drop.position = position.clone();
            const vel = new Vector3(
                (Math.random() - 0.5),
                Math.random() * 0.8,
                (Math.random() - 0.5)
            ).scale(0.8);
            this.glowLayer.addIncludedOnlyMesh(drop);
            
            let life = 0;
            const anim = this.scene.onBeforeRenderObservable.add(() => {
                life++;
                vel.y -= 0.02;
                drop.position.addInPlace(vel);
                if (drop.position.y < 0) {
                    drop.position.y = 0;
                    vel.x *= 0.8;
                    vel.z *= 0.8;
                }
                if (life > 60) {
                    drop.dispose();
                    this.scene.onBeforeRenderObservable.remove(anim);
                }
            });
        }
    }
}

