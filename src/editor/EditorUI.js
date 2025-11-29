import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { InputText } from '@babylonjs/gui/2D/controls/inputText';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { Slider } from '@babylonjs/gui/2D/controls/sliders/slider';
import { Checkbox } from '@babylonjs/gui/2D/controls/checkbox';
import { ColorPicker } from '@babylonjs/gui/2D/controls/colorpicker';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';

export class EditorUI {
    constructor(scene, editorManager) {
        this.scene = scene;
        this.editorManager = editorManager;
        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("EditorUI", true, this.scene);
        // Ensure it draws on top of everything
        this.advancedTexture.layer.zIndex = 1000;
        this.panel = null;
        this.buttons = [];
        this.spawnTypeButtons = [];

        this.createUI();
    }

    createUI() {
        // Editor Panel
        this.panel = new StackPanel();
        this.panel.width = "220px"; // Increased width for better layout
        this.panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this.panel.background = "#000000AA";
        this.panel.paddingRight = "10px";
        this.panel.isVisible = false;
        this.advancedTexture.addControl(this.panel);

        // Map Controls
        this.createMapControls();

        // Tools Group
        this.createSectionHeader("HERRAMIENTAS");
        this.createEditorBtn("Mover/Seleccionar", "move");
        this.createEditorBtn("Pintar Suelo", "paint");
        this.createEditorBtn("Punto Spawn Enemigo", "setSpawn");
        this.createEditorBtn("Posición Inicial Jugador", "setPlayerStart");

        // Props Dropdown
        this.createDropdown("PROPS", (panel) => {
            this.createEditorBtn("Agregar Cubo", "addCube", panel);
            this.createEditorBtn("Agregar Pared", "addWall", panel);
        });

        // Paint Dropdown
        this.createDropdown("PAINT", (panel) => {
            this.createPaintControls(panel);
        });

        // Graphics & Light
        this.createSectionHeader("SETTINGS");
        this.createGraphicsToggle();
        this.createLightSlider();

        // Enemies Dropdown
        this.createDropdown("ENEMIES", (panel) => {
            const spawnTypeLabel = new TextBlock();
            spawnTypeLabel.text = "Tipo de Enemigo Spawn:";
            spawnTypeLabel.color = "white";
            spawnTypeLabel.height = "20px";
            spawnTypeLabel.fontSize = 12;
            panel.addControl(spawnTypeLabel);

            this.createSpawnTypeBtn(panel, "alien", "Alien");
            this.createSpawnTypeBtn(panel, "worm", "Gusano");
            this.createSpawnTypeBtn(panel, "brute", "Cubo Rojo (Brute)");

            // Place Enemy Tool
            const placeEnemyLabel = new TextBlock();
            placeEnemyLabel.text = "Colocar Enemigo (Nivel):";
            placeEnemyLabel.color = "white";
            placeEnemyLabel.height = "20px";
            placeEnemyLabel.fontSize = 12;
            placeEnemyLabel.top = "5px";
            panel.addControl(placeEnemyLabel);

            this.createEditorBtn("Colocar Alien", "placeAlien", panel);
            this.createEditorBtn("Colocar Gusano", "placeWorm", panel);
            this.createEditorBtn("Colocar Brute", "placeBrute", panel);
        });

        // Actions
        const btnStartGame = Button.CreateSimpleButton("btnStart", "START GAME");
        btnStartGame.width = "180px";
        btnStartGame.height = "50px";
        btnStartGame.color = "white";
        btnStartGame.background = "blue";
        btnStartGame.fontSize = 16;
        btnStartGame.top = "20px";
        btnStartGame.onPointerUpObservable.add(() => {
            this.editorManager.toggleEditorMode();
            this.editorManager.gameManager.restart();
        });
        this.panel.addControl(btnStartGame);

        const btnSaveScene = Button.CreateSimpleButton("btnSave", "GUARDAR SCENE & JSON");
        btnSaveScene.width = "180px";
        btnSaveScene.height = "50px";
        btnSaveScene.color = "white";
        btnSaveScene.background = "orange";
        btnSaveScene.fontSize = 16;
        btnSaveScene.top = "40px";
        btnSaveScene.onPointerUpObservable.add(() => {
            this.editorManager.saveScene();
        });
        this.panel.addControl(btnSaveScene);
    }

    createMapControls() {
        this.createSectionHeader("MAPA");

        // New Map
        const btnNew = Button.CreateSimpleButton("btnNewMap", "NUEVO MAPA");
        this.styleButton(btnNew, "green");
        btnNew.onPointerUpObservable.add(() => this.showNewMapModal());
        this.panel.addControl(btnNew);

        // Save Map
        const btnSave = Button.CreateSimpleButton("btnSaveMap", "GUARDAR MAPA");
        this.styleButton(btnSave, "orange");
        btnSave.onPointerUpObservable.add(() => this.showSaveMapModal());
        this.panel.addControl(btnSave);

        // Load Map
        const btnLoad = Button.CreateSimpleButton("btnLoadMap", "CARGAR MAPA");
        this.styleButton(btnLoad, "blue");
        btnLoad.onPointerUpObservable.add(() => {
            this.fileInput.click();
        });
        this.panel.addControl(btnLoad);

        // Hidden File Input
        if (!this.fileInput) {
            this.fileInput = document.createElement("input");
            this.fileInput.type = "file";
            this.fileInput.accept = ".json";
            this.fileInput.style.display = "none";
            this.fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.editorManager.loadMapFromFile(file);
                }
                this.fileInput.value = "";
            };
            document.body.appendChild(this.fileInput);
        }
    }

    styleButton(btn, color) {
        btn.width = "100%";
        btn.height = "30px";
        btn.color = "white";
        btn.background = color;
        btn.fontSize = 12;
        btn.marginBottom = "5px";
    }

    showNewMapModal() {
        if (this.modal) this.modal.dispose();

        const modal = new Rectangle();
        modal.width = "400px";
        modal.height = "350px";
        modal.background = "black";
        modal.color = "white";
        modal.thickness = 2;
        modal.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        modal.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this.advancedTexture.addControl(modal);
        this.modal = modal;

        const panel = new StackPanel();
        modal.addControl(panel);

        const title = new TextBlock();
        title.text = "CREAR NUEVO MAPA";
        title.color = "white";
        title.height = "40px";
        title.fontSize = 20;
        panel.addControl(title);

        // Name Input
        const nameInput = new InputText();
        nameInput.width = "300px";
        nameInput.height = "40px";
        nameInput.text = "Nuevo Mapa";
        nameInput.color = "white";
        nameInput.background = "#333";
        panel.addControl(nameInput);

        // Width Input
        const widthInput = new InputText();
        widthInput.width = "300px";
        widthInput.height = "40px";
        widthInput.text = "200";
        widthInput.placeholderText = "Ancho (200)";
        widthInput.color = "white";
        widthInput.background = "#333";
        widthInput.top = "10px";
        panel.addControl(widthInput);

        // Depth Input
        const depthInput = new InputText();
        depthInput.width = "300px";
        depthInput.height = "40px";
        depthInput.text = "200";
        depthInput.placeholderText = "Largo (200)";
        depthInput.color = "white";
        depthInput.background = "#333";
        depthInput.top = "20px";
        panel.addControl(depthInput);

        // Create Button
        const btnCreate = Button.CreateSimpleButton("btnCreate", "CREAR");
        btnCreate.width = "150px";
        btnCreate.height = "40px";
        btnCreate.color = "white";
        btnCreate.background = "green";
        btnCreate.top = "40px";
        btnCreate.onPointerUpObservable.add(() => {
            const w = parseInt(widthInput.text) || 200;
            const d = parseInt(depthInput.text) || 200;
            this.editorManager.createMap({
                mapName: nameInput.text,
                width: w,
                depth: d,
                texture: null // Default for now, can add selector later
            });
            modal.dispose();
            this.modal = null;
        });
        panel.addControl(btnCreate);

        // Cancel Button
        const btnCancel = Button.CreateSimpleButton("btnCancel", "CANCELAR");
        btnCancel.width = "150px";
        btnCancel.height = "40px";
        btnCancel.color = "white";
        btnCancel.background = "red";
        btnCancel.top = "50px";
        btnCancel.onPointerUpObservable.add(() => {
            modal.dispose();
            this.modal = null;
        });
        panel.addControl(btnCancel);
    }

    showSaveMapModal() {
        if (this.modal) this.modal.dispose();

        const modal = new Rectangle();
        modal.width = "400px";
        modal.height = "200px";
        modal.background = "black";
        modal.color = "white";
        modal.thickness = 2;
        modal.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        modal.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this.advancedTexture.addControl(modal);
        this.modal = modal;

        const panel = new StackPanel();
        modal.addControl(panel);

        const title = new TextBlock();
        title.text = "GUARDAR MAPA";
        title.color = "white";
        title.height = "40px";
        title.fontSize = 20;
        panel.addControl(title);

        // Name Input
        const nameInput = new InputText();
        nameInput.width = "300px";
        nameInput.height = "40px";
        nameInput.text = this.editorManager.currentMapConfig ? this.editorManager.currentMapConfig.mapName : "Mi Mapa";
        nameInput.color = "white";
        nameInput.background = "#333";
        panel.addControl(nameInput);

        // Save Button
        const btnSave = Button.CreateSimpleButton("btnSaveConfirm", "GUARDAR");
        btnSave.width = "150px";
        btnSave.height = "40px";
        btnSave.color = "white";
        btnSave.background = "green";
        btnSave.top = "20px";
        btnSave.onPointerUpObservable.add(() => {
            this.editorManager.saveCurrentMap(nameInput.text);
            modal.dispose();
            this.modal = null;
        });
        panel.addControl(btnSave);

        // Cancel Button
        const btnCancel = Button.CreateSimpleButton("btnCancel", "CANCELAR");
        btnCancel.width = "150px";
        btnCancel.height = "40px";
        btnCancel.color = "white";
        btnCancel.background = "red";
        btnCancel.top = "30px";
        btnCancel.onPointerUpObservable.add(() => {
            modal.dispose();
            this.modal = null;
        });
        panel.addControl(btnCancel);
    }

    createEditorBtn(text, action, parent = null) {
        const btn = Button.CreateSimpleButton("btnEditor" + text, text);
        btn.width = "180px";
        btn.height = "30px";
        btn.color = "white";
        btn.background = "#333";
        btn.fontSize = 12;
        btn.onPointerUpObservable.add(() => {
            this.editorManager.setEditorAction(action);
            this.updateEditorButtons(btn);
        });

        if (parent) {
            parent.addControl(btn);
        } else {
            this.panel.addControl(btn);
        }

        this.buttons.push(btn);
        return btn;
    }

    createDropdown(title, contentCallback) {
        // Header Button
        const header = Button.CreateSimpleButton("header" + title, title + " ▼");
        header.width = "180px";
        header.height = "30px";
        header.color = "yellow";
        header.background = "#444";
        header.fontSize = 14;
        header.fontWeight = "bold";
        this.panel.addControl(header);

        // Content Panel
        const content = new StackPanel();
        content.isVisible = false;
        this.panel.addControl(content);

        // Toggle Logic
        header.onPointerUpObservable.add(() => {
            content.isVisible = !content.isVisible;
            header.textBlock.text = title + (content.isVisible ? " ▲" : " ▼");
        });

        // Populate content
        contentCallback(content);
    }

    createSpawnTypeBtn(parent, type, text) {
        const btn = Button.CreateSimpleButton("btnSpawn" + type, text);
        btn.width = "180px";
        btn.height = "30px";
        btn.color = "white";
        btn.background = type === "alien" ? "green" : "#333"; // Default
        btn.fontSize = 12;
        btn.onPointerUpObservable.add(() => {
            this.editorManager.setSelectedEnemyType(type);
            this.updateSpawnTypeButtons(type);
        });
        parent.addControl(btn);
        this.spawnTypeButtons.push({ btn, type });
        return btn;
    }

    updateEditorButtons(activeBtn) {
        this.buttons.forEach(btn => {
            btn.background = "#333";
        });
        if (activeBtn) activeBtn.background = "green";
    }

    // Helper to update buttons by action name (for when action changes programmatically)
    updateEditorButtonsByAction(action) {
        const targetBtn = this.buttons.find(b => b.name === "btnEditor" + this.getActionNameFromAction(action));
        // Mapping names is tricky, let's just rely on the object reference if possible or simple logic
        // For simplicity, let's iterate and check text content or similar if we needed to.
        // But actually, we can just reset all and let the user click. 
        // Or better, we can store action in metadata.
        // Let's keep it simple: The manager calls this UI update.
    }

    getActionNameFromAction(action) {
        // Simple helper if needed, or just rely on manual mapping
        return action;
    }

    setActiveButton(action) {
        // Map action to button text/name is needed.
        // Simple mapping:
        const map = {
            "move": "Mover/Seleccionar",
            "paint": "Pintar Suelo",
            "addCube": "Agregar Cubo",
            "addWall": "Agregar Pared",
            "setSpawn": "Punto Spawn Enemigo",
            "setPlayerStart": "Posición Inicial Jugador",
            "placeAlien": "Colocar Alien",
            "placeWorm": "Colocar Gusano",
            "placeBrute": "Colocar Brute"
        };
        const text = map[action];
        const btn = this.buttons.find(b => b.textBlock.text === text);
        if (btn) this.updateEditorButtons(btn);
    }

    updateSpawnTypeButtons(selectedType) {
        this.spawnTypeButtons.forEach(item => {
            item.btn.background = item.type === selectedType ? "green" : "#333";
        });
    }

    createGraphicsToggle() {
        const panel = new StackPanel();
        panel.isVertical = false;
        panel.height = "30px";
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.panel.addControl(panel);

        const label = new TextBlock();
        label.text = "Gráficos:";
        label.color = "white";
        label.width = "80px";
        label.fontSize = 14;
        label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        panel.addControl(label);

        const checkbox = new Checkbox();
        checkbox.width = "20px";
        checkbox.height = "20px";
        checkbox.isChecked = true;
        checkbox.color = "green";
        checkbox.onIsCheckedChangedObservable.add((value) => {
            this.editorManager.gameManager.toggleGraphics();
        });
        panel.addControl(checkbox);
    }

    createSectionHeader(text) {
        const header = new TextBlock();
        header.text = text;
        header.color = "yellow";
        header.height = "30px";
        header.fontSize = 16;
        header.fontWeight = "bold";
        header.top = "10px";
        this.panel.addControl(header);
    }

    createPaintControls(parent) {
        const panel = new StackPanel();
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        parent.addControl(panel);

        // Color Picker
        const picker = new ColorPicker();
        picker.value = new Color3(1, 0, 0);
        picker.height = "100px";
        picker.width = "100px";
        picker.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        picker.onValueChangedObservable.add((value) => {
            this.editorManager.currentPaintColor = value;
            this.editorManager.currentPaintTexture = null; // Clear texture when color picked
        });
        panel.addControl(picker);

        // Texture Buttons (Simple placeholders)
        const texturePanel = new StackPanel();
        texturePanel.isVertical = false;
        texturePanel.height = "40px";
        panel.addControl(texturePanel);

        const createTexBtn = (name, color, texturePath) => {
            const btn = Button.CreateSimpleButton("btnTex" + name, name);
            btn.width = "60px";
            btn.height = "30px";
            btn.color = "white";
            btn.background = color;
            btn.fontSize = 10;
            btn.onPointerUpObservable.add(() => {
                this.editorManager.currentPaintTexture = texturePath;
                // Visual feedback could be added here
            });
            texturePanel.addControl(btn);
        };

        createTexBtn("Grass", "green", "assets/textures/grass.png"); // Example path
        createTexBtn("Stone", "grey", "assets/textures/stone.png");
        createTexBtn("Dirt", "brown", "assets/textures/dirt.png");
    }

    createLightSlider() {
        const panel = new StackPanel();
        panel.height = "50px";
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.panel.addControl(panel);

        const label = new TextBlock();
        label.text = "Iluminación";
        label.color = "white";
        label.height = "20px";
        label.fontSize = 14;
        label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        panel.addControl(label);

        const slider = new Slider();
        slider.minimum = 0;
        slider.maximum = 2;
        slider.value = 1; // Default multiplier
        slider.height = "30px"; // Increased height
        slider.width = "180px";
        slider.color = "orange";
        slider.background = "grey";
        slider.thumbWidth = "20px"; // Make thumb easier to grab
        slider.isThumbClamped = true; // Ensure thumb stays within bounds
        slider.onValueChangedObservable.add((value) => {
            this.editorManager.setLightIntensity(value);
        });
        panel.addControl(slider);
    }

    setVisible(visible) {
        console.log("EditorUI setVisible:", visible);
        this.panel.isVisible = visible;
    }
}
