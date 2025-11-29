import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import "@babylonjs/core/Layers/effectLayerSceneComponent";
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { GameConfig } from '../config/gameConfig.js';

export class SceneSetup {
    constructor(scene) {
        this.scene = scene;
        this.shadowGenerator = null;
        this.glowLayer = null;
        this.camera = null;
    }

    setup() {
        // Environment
        this.scene.clearColor = new Color3(0.1, 0.1, 0.1);
        this.scene.fogMode = this.scene.FOGMODE_EXP;
        this.scene.fogDensity = GameConfig.visual.fogDensity;
        this.scene.fogColor = new Color3(0.1, 0.1, 0.1);

        // Lights
        const hemiLight = new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);
        hemiLight.intensity = 0.1;
        hemiLight.diffuse = new Color3(1, 1, 1);
        hemiLight.groundColor = new Color3(0.2, 0.2, 0.2);

        const dirLight = new DirectionalLight("dir01", new Vector3(-1, -2, -1), this.scene);
        dirLight.position = new Vector3(20, 40, 20);
        dirLight.intensity = 0.2;

        this.shadowGenerator = new ShadowGenerator(2048, dirLight);
        this.shadowGenerator.useBlurExponentialShadowMap = true;

        // Ground
        this.setupGround();

        // Walls
        this.setupWalls();

        // Decorative objects
        this.setupDecorativeObjects();

        // Glow layer
        this.glowLayer = new GlowLayer("glow", this.scene);
        this.glowLayer.intensity = GameConfig.visual.glowIntensity;
    }

    setupGround(width = 200, height = 200, texturePath = null) {
        const groundSize = width; // Use width for both if square, or handle rectangular

        // Crear el piso base
        const ground = MeshBuilder.CreateGround("ground", { width: width, height: height }, this.scene);
        const groundMat = new StandardMaterial("groundMat", this.scene);

        // Sistema de texturas variadas
        const textures = texturePath ? [texturePath] : (GameConfig.visual.groundTextures || []);
        const weights = GameConfig.visual.groundTextureWeights || [];
        const textureScale = GameConfig.visual.groundTextureScale || 10;

        if (textures.length > 0) {
            // Usar la primera textura como base principal
            const mainTexture = new Texture(textures[0], this.scene);
            mainTexture.wrapU = Texture.WRAP_REPEAT;
            mainTexture.wrapV = Texture.WRAP_REPEAT;
            mainTexture.uScale = textureScale;
            mainTexture.vScale = textureScale;
            groundMat.diffuseTexture = mainTexture;
        } else {
            // Fallback to solid color if no textures
            groundMat.diffuseColor = GameConfig.visual.groundColor || new Color3(0.2, 0.2, 0.3);
        }

        groundMat.specularColor = new Color3(0, 0, 0);
        groundMat.maxSimultaneousLights = 10;
        ground.material = groundMat;
        ground.receiveShadows = true;
        ground.checkCollisions = true;
        ground.isPickable = true;

        this.ground = ground;

        // Crear tiles decorativos variados después de crear el ground
        // Only if using default config textures and not a custom single texture
        if (!texturePath && textures.length > 1) {
            this.createVariedGroundTiles(groundSize, textures, weights, textureScale);
        }
    }

    updateGround(width, height, texturePath) {
        if (this.ground) {
            this.ground.dispose();
        }
        if (this.decorativeTiles) {
            this.decorativeTiles.forEach(t => t.dispose());
            this.decorativeTiles = [];
        }
        this.setupGround(width, height, texturePath);

        // Update walls to match new size
        if (this.walls) {
            this.walls.forEach(w => w.dispose());
        }
        this.setupWalls(width, height);
    }

    createVariedGroundTiles(groundSize, textures, weights, textureScale) {
        const tileSize = 15; // Tamaño de cada tile decorativo
        const spacing = 25; // Espaciado entre tiles (más espaciado = menos repetición)
        const tilesPerSide = Math.floor(groundSize / spacing);

        // Normalizar pesos
        const totalWeight = weights.length > 0 && weights.reduce((a, b) => a + b, 0) > 0
            ? weights.reduce((a, b) => a + b, 0)
            : textures.length;
        const normalizedWeights = weights.length > 0 && totalWeight > 0
            ? weights.map(w => w / totalWeight)
            : new Array(textures.length).fill(1 / textures.length);

        // Crear acumulador de probabilidades
        const cumulativeWeights = [];
        let sum = 0;
        for (let i = 0; i < normalizedWeights.length; i++) {
            sum += normalizedWeights[i];
            cumulativeWeights.push(sum);
        }

        // Crear tiles decorativos estratégicamente colocados (no todos los espacios)
        this.decorativeTiles = [];
        for (let x = 0; x < tilesPerSide; x++) {
            for (let z = 0; z < tilesPerSide; z++) {
                // Solo crear tile si pasa la probabilidad (para que no sea todo cubierto)
                if (Math.random() > 0.3) continue; // 30% de probabilidad de crear un tile decorativo

                // Decidir qué textura usar (saltar la primera que es la base)
                const rand = Math.random();
                let textureIndex = 0;
                for (let i = 1; i < cumulativeWeights.length; i++) {
                    if (rand <= cumulativeWeights[i]) {
                        textureIndex = i;
                        break;
                    }
                }
                if (textureIndex === 0) textureIndex = 1; // Asegurar que no use la base
                if (textureIndex >= textures.length) continue;

                // Crear tile decorativo
                const tile = MeshBuilder.CreateGround(
                    `decorativeTile_${x}_${z}`,
                    { width: tileSize, height: tileSize },
                    this.scene
                );

                tile.position.x = (x * spacing) - (groundSize / 2) + (spacing / 2);
                tile.position.z = (z * spacing) - (groundSize / 2) + (spacing / 2);
                tile.position.y = 0.01; // Ligeramente arriba para evitar z-fighting

                const tileMat = new StandardMaterial(`decorativeTileMat_${x}_${z}`, this.scene);
                const tileTexture = new Texture(textures[textureIndex], this.scene);
                tileTexture.wrapU = Texture.WRAP_REPEAT;
                tileTexture.wrapV = Texture.WRAP_REPEAT;
                tileTexture.uScale = textureScale / 2; // Más pequeño para más detalle
                tileTexture.vScale = textureScale / 2;
                tileMat.diffuseTexture = tileTexture;
                tileMat.specularColor = new Color3(0, 0, 0);
                tileMat.maxSimultaneousLights = 10;
                tile.material = tileMat;
                tile.receiveShadows = true;
                tile.checkCollisions = false; // Solo el piso base tiene colisiones

                this.decorativeTiles.push(tile);
            }
        }
    }

    setupWalls(width = 200, height = 200) {
        const wallHeight = GameConfig.visual.wallHeight || 20;
        const wallThickness = GameConfig.visual.wallThickness || 2;
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        this.walls = [];

        // Crear 4 paredes alrededor del mapa
        const wallPositions = [
            { pos: new Vector3(0, wallHeight / 2, halfHeight), size: { width: width, height: wallHeight, depth: wallThickness } }, // Norte
            { pos: new Vector3(0, wallHeight / 2, -halfHeight), size: { width: width, height: wallHeight, depth: wallThickness } }, // Sur
            { pos: new Vector3(halfWidth, wallHeight / 2, 0), size: { width: wallThickness, height: wallHeight, depth: height } }, // Este
            { pos: new Vector3(-halfWidth, wallHeight / 2, 0), size: { width: wallThickness, height: wallHeight, depth: height } }  // Oeste
        ];

        const wallTexturePath = GameConfig.visual.wallTexture;
        const wallTextureScale = GameConfig.visual.wallTextureScale || 2;

        wallPositions.forEach((wallData, index) => {
            const wall = MeshBuilder.CreateBox(
                `wall_${index}`,
                wallData.size,
                this.scene
            );
            wall.position = wallData.pos;

            const wallMat = new StandardMaterial(`wallMat_${index}`, this.scene);

            if (wallTexturePath) {
                const wallTexture = new Texture(wallTexturePath, this.scene);
                wallTexture.wrapU = Texture.WRAP_REPEAT;
                wallTexture.wrapV = Texture.WRAP_REPEAT;
                wallTexture.uScale = wallTextureScale;
                wallTexture.vScale = wallTextureScale;
                wallMat.diffuseTexture = wallTexture;
            } else {
                wallMat.diffuseColor = GameConfig.visual.wallColor || new Color3(0.3, 0.3, 0.3);
            }

            wallMat.specularColor = new Color3(0, 0, 0);
            wallMat.maxSimultaneousLights = 10;
            wall.material = wallMat;
            wall.receiveShadows = true;
            wall.checkCollisions = true; // Las paredes tienen colisiones

            this.shadowGenerator.addShadowCaster(wall);
            this.walls.push(wall);
        });
    }

    setupDecorativeObjects() {
        if (!GameConfig.decorativeObjects || !GameConfig.decorativeObjects.enabled) {
            return;
        }

        this.decorativeObjects = [];
        const objects = GameConfig.decorativeObjects.objects || [];
        const materials = GameConfig.decorativeObjects.materials || {};

        objects.forEach((objConfig, index) => {
            const obj = this.createDecorativeObject(
                objConfig.type,
                objConfig.position,
                objConfig.rotation || 0,
                objConfig.hasCollision !== false,
                materials[objConfig.type],
                index
            );

            if (obj) {
                this.decorativeObjects.push(obj);
            }
        });
    }

    createDecorativeObject(type, position, rotation, hasCollision, materialConfig, index) {
        let mesh = null;
        const pos = new Vector3(position.x || 0, 0, position.z || 0);
        const rot = (rotation * Math.PI) / 180; // Convertir grados a radianes

        // Convertir colores de array a Color3
        const color = materialConfig && materialConfig.color
            ? new Color3(materialConfig.color[0], materialConfig.color[1], materialConfig.color[2])
            : new Color3(0.5, 0.5, 0.5);
        const emissive = materialConfig && materialConfig.emissive
            ? new Color3(materialConfig.emissive[0], materialConfig.emissive[1], materialConfig.emissive[2])
            : new Color3(0, 0, 0);

        switch (type) {
            case 'table':
                // Mesa: top plano con patas
                const tableTop = MeshBuilder.CreateBox(`tableTop_${index}`, { width: 2, height: 0.1, depth: 1.5 }, this.scene);
                tableTop.position = pos.clone();
                tableTop.position.y = 0.7;
                tableTop.rotation.y = rot;

                const tableMat = new StandardMaterial(`tableMat_${index}`, this.scene);
                tableMat.diffuseColor = color;
                tableMat.emissiveColor = emissive;
                tableMat.specularColor = new Color3(0.1, 0.1, 0.1);
                tableMat.maxSimultaneousLights = 10;
                tableTop.material = tableMat;
                tableTop.checkCollisions = hasCollision;
                tableTop.receiveShadows = true;
                this.shadowGenerator.addShadowCaster(tableTop);

                // Patas de la mesa
                const legPositions = [
                    { x: -0.8, z: -0.6 },
                    { x: 0.8, z: -0.6 },
                    { x: -0.8, z: 0.6 },
                    { x: 0.8, z: 0.6 }
                ];

                for (let i = 0; i < 4; i++) {
                    const leg = MeshBuilder.CreateBox(`tableLeg_${index}_${i}`, { width: 0.1, height: 0.7, depth: 0.1 }, this.scene);
                    // Calcular posición rotada de la pata
                    const cosRot = Math.cos(rot);
                    const sinRot = Math.sin(rot);
                    const rotatedX = legPositions[i].x * cosRot - legPositions[i].z * sinRot;
                    const rotatedZ = legPositions[i].x * sinRot + legPositions[i].z * cosRot;

                    leg.position = pos.clone();
                    leg.position.x += rotatedX;
                    leg.position.z += rotatedZ;
                    leg.position.y = 0.35;
                    leg.rotation.y = rot;
                    leg.material = tableMat;
                    leg.checkCollisions = hasCollision;
                    leg.receiveShadows = true;
                    this.shadowGenerator.addShadowCaster(leg);
                }

                mesh = tableTop;
                break;

            case 'panel':
                // Panel vertical
                mesh = MeshBuilder.CreateBox(`panel_${index}`, { width: 0.2, height: 2, depth: 1.5 }, this.scene);
                mesh.position = pos.clone();
                mesh.position.y = 1;
                mesh.rotation.y = rot;
                break;

            case 'box':
                // Caja simple
                mesh = MeshBuilder.CreateBox(`box_${index}`, { width: 1, height: 1, depth: 1 }, this.scene);
                mesh.position = pos.clone();
                mesh.position.y = 0.5;
                mesh.rotation.y = rot;
                break;

            case 'crate':
                // Caja de madera con estructura
                mesh = MeshBuilder.CreateBox(`crate_${index}`, { width: 1.2, height: 1.2, depth: 1.2 }, this.scene);
                mesh.position = pos.clone();
                mesh.position.y = 0.6;
                mesh.rotation.y = rot;
                break;

            case 'console':
                // Consola con pantalla
                const consoleBase = MeshBuilder.CreateBox(`consoleBase_${index}`, { width: 1.5, height: 0.8, depth: 0.8 }, this.scene);
                consoleBase.position = pos.clone();
                consoleBase.position.y = 0.4;
                consoleBase.rotation.y = rot;

                const screen = MeshBuilder.CreateBox(`screen_${index}`, { width: 1.2, height: 0.6, depth: 0.1 }, this.scene);
                screen.position = pos.clone();
                screen.position.y = 1.1;
                screen.rotation.y = rot;

                const consoleMat = new StandardMaterial(`consoleMat_${index}`, this.scene);
                consoleMat.diffuseColor = color;
                consoleMat.emissiveColor = emissive;
                consoleBase.material = consoleMat;
                screen.material = consoleMat;

                consoleBase.checkCollisions = hasCollision;
                screen.checkCollisions = false;
                consoleBase.receiveShadows = true;
                screen.receiveShadows = true;
                this.shadowGenerator.addShadowCaster(consoleBase);
                this.shadowGenerator.addShadowCaster(screen);

                mesh = consoleBase;
                break;

            case 'barrel':
                // Barril cilíndrico
                mesh = MeshBuilder.CreateCylinder(`barrel_${index}`, { height: 1.2, diameter: 0.8 }, this.scene);
                mesh.position = pos.clone();
                mesh.position.y = 0.6;
                mesh.rotation.y = rot;
                break;

            case 'column':
                // Columna alta
                mesh = MeshBuilder.CreateCylinder(`column_${index}`, { height: 3, diameter: 0.6 }, this.scene);
                mesh.position = pos.clone();
                mesh.position.y = 1.5;
                mesh.rotation.y = rot;
                break;

            default:
                console.warn(`Tipo de objeto decorativo desconocido: ${type}`);
                return null;
        }

        if (mesh) {
            // Aplicar material si no se aplicó antes
            if (!mesh.material) {
                const mat = new StandardMaterial(`decorativeMat_${index}`, this.scene);
                mat.diffuseColor = color;
                mat.emissiveColor = emissive;
                mat.specularColor = new Color3(0.1, 0.1, 0.1);
                mat.maxSimultaneousLights = 10;
                mesh.material = mat;
            }

            mesh.checkCollisions = hasCollision;
            mesh.receiveShadows = true;
            if (!this.shadowGenerator.getShadowMap().renderList.includes(mesh)) {
                this.shadowGenerator.addShadowCaster(mesh);
            }
        }

        return mesh;
    }

    setupPostProcessing(scene) {
        // This will be called after camera is created
        if (this.camera) {
            const pipeline = new DefaultRenderingPipeline("default", true, scene, [this.camera]);
            pipeline.bloomEnabled = true;
            pipeline.bloomThreshold = GameConfig.visual.bloomThreshold;
            pipeline.bloomWeight = GameConfig.visual.bloomWeight;
            pipeline.bloomKernel = GameConfig.visual.bloomKernel;
            pipeline.fxaaEnabled = true;
        }
    }

    createCamera(target) {
        this.camera = new ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 3.2, 30, target, this.scene);
        this.camera.inputs.clear();
        // ArcRotateCamera se adjunta automáticamente al establecerla como activeCamera
        // No necesitamos attachToCanvas ni attachControls porque ya limpiamos los inputs
        this.scene.activeCamera = this.camera;
        console.log("Cámara creada y activada, target:", target);
        return this.camera;
    }
}

