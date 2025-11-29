import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Ellipse } from '@babylonjs/gui/2D/controls/ellipse';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { ScrollViewer } from '@babylonjs/gui/2D/controls/scrollViewers/scrollViewer';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { WEAPON_NAMES, COLORS } from '../utils/constants.js';
import { GameConfig } from '../config/gameConfig.js';
import { VisualEffects } from '../utils/VisualEffects.js';

export class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.radarDots = [];
        this.gameOverMenu = null;

        this.setupHUD();
        this.setupWavePanel();
        this.setupRadar();
        this.createInventory();

        this.visualEffects = new VisualEffects(scene, this.advancedTexture, null);
    }

    setupHUD() {
        this.hudPanel = new StackPanel();
        this.hudPanel.width = "250px";
        this.hudPanel.horizontalAlignment = 0;
        this.hudPanel.verticalAlignment = 0;
        this.hudPanel.top = "20px";
        this.hudPanel.left = "20px";
        this.advancedTexture.addControl(this.hudPanel);

        this.hpUI = this.createBar("SALUD", COLORS.health);
        this.armorUI = this.createBar("ARMADURA: 0%", COLORS.armor);
        this.xpUI = this.createBar("XP (Nivel 1)", COLORS.xp);

        this.goldText = new TextBlock();
        this.goldText.text = "ORO: 0";
        this.goldText.color = COLORS.gold;
        this.goldText.fontSize = 20;
        this.goldText.height = "30px";
        this.goldText.textHorizontalAlignment = 0;
        this.hudPanel.addControl(this.goldText);

        this.weaponText = new TextBlock();
        this.weaponText.text = "RIFLE (1)";
        this.weaponText.color = "white";
        this.weaponText.fontSize = 18;
        this.weaponText.height = "30px";
        this.weaponText.textHorizontalAlignment = 0;
        this.hudPanel.addControl(this.weaponText);
    }

    createBar(label, color) {
        const txt = new TextBlock();
        txt.text = label;
        txt.color = "white";
        txt.fontSize = 14;
        txt.height = "20px";
        txt.textHorizontalAlignment = 0;
        this.hudPanel.addControl(txt);

        const cont = new Rectangle();
        cont.width = "200px";
        cont.height = "10px";
        cont.color = "white";
        cont.background = "black";
        cont.horizontalAlignment = 0;
        this.hudPanel.addControl(cont);

        const bar = new Rectangle();
        bar.width = "0px";
        bar.height = "10px";
        bar.color = "transparent";
        bar.background = color;
        bar.horizontalAlignment = 0;
        cont.addControl(bar);

        return { text: txt, bar: bar };
    }

    setupWavePanel() {
        this.wavePanel = new StackPanel();
        this.wavePanel.verticalAlignment = 0;
        this.wavePanel.horizontalAlignment = 2;
        this.wavePanel.top = "10px";
        this.advancedTexture.addControl(this.wavePanel);

        this.waveTitle = new TextBlock();
        this.waveTitle.text = "WAVE 1";
        this.waveTitle.color = "orange";
        this.waveTitle.fontSize = 30;
        this.waveTitle.fontWeight = "bold";
        this.waveTitle.height = "40px";
        this.wavePanel.addControl(this.waveTitle);

        this.waveProgressContainer = new Rectangle();
        this.waveProgressContainer.width = "400px";
        this.waveProgressContainer.height = "20px";
        this.waveProgressContainer.background = "black";
        this.waveProgressContainer.color = "white";
        this.wavePanel.addControl(this.waveProgressContainer);

        this.waveProgressBar = new Rectangle();
        this.waveProgressBar.width = "0px";
        this.waveProgressBar.height = "20px";
        this.waveProgressBar.background = "#00BFFF";
        this.waveProgressBar.horizontalAlignment = 0;
        this.waveProgressContainer.addControl(this.waveProgressBar);

        this.waveProgressText = new TextBlock();
        this.waveProgressText.text = "0%";
        this.waveProgressText.color = "white";
        this.waveProgressText.fontSize = 14;
        this.waveProgressContainer.addControl(this.waveProgressText);
    }

    setupRadar() {
        this.radarContainer = new Ellipse();
        this.radarContainer.width = GameConfig.radar.size + "px";
        this.radarContainer.height = GameConfig.radar.size + "px";
        this.radarContainer.color = "green";
        this.radarContainer.thickness = 2;
        this.radarContainer.background = "black";
        this.radarContainer.alpha = 0.7;
        this.radarContainer.horizontalAlignment = 0;
        this.radarContainer.verticalAlignment = 1;
        this.radarContainer.left = "20px";
        this.radarContainer.top = "-20px";
        this.advancedTexture.addControl(this.radarContainer);

        const radarCenter = new Ellipse();
        this.radarContainer.addControl(radarCenter);
        radarCenter.width = "4px";
        radarCenter.height = "4px";
        radarCenter.background = "white";
    }

    update(gameManager) {
        this.gameManager = gameManager;
        const player = gameManager.player;
        const waveManager = gameManager.waveManager;
        const weaponSystem = gameManager.weaponSystem;

        // Health
        const hpP = player.getHealthPercent();
        this.hpUI.bar.width = (hpP * 200) + "px";
        this.hpUI.bar.background = hpP < 0.3 ? "red" : COLORS.health;

        // XP
        const xpP = player.getXPPercent();
        this.xpUI.bar.width = (xpP * 200) + "px";
        this.xpUI.text.text = "XP (Nivel " + player.level + ")";

        // Armor
        this.armorUI.bar.width = (Math.min(1, player.armor / 50) * 200) + "px";
        this.armorUI.text.text = "ARMADURA: " + player.armor + "%";

        // Gold
        this.goldText.text = "ORO: " + gameManager.gold;

        // Wave progress
        const wavePct = Math.min(1, waveManager.enemiesKilledInWave / waveManager.enemiesRequiredForWave);
        this.waveProgressBar.width = (wavePct * 400) + "px";
        this.waveProgressText.text = Math.floor(wavePct * 100) + "% (Matar " +
            (waveManager.enemiesRequiredForWave - waveManager.enemiesKilledInWave) + ")";

        // Weapon
        let wName = "SIN ARMA";
        if (weaponSystem.currentWeapon !== 0) {
            wName = WEAPON_NAMES[weaponSystem.currentWeapon] || "RIFLE";
            this.weaponText.text = wName + " (" + weaponSystem.currentWeapon + ")";
            if (weaponSystem.isReloading && weaponSystem.currentWeapon === 1) {
                this.weaponText.text = "RECARGANDO...";
            }
        } else {
            this.weaponText.text = "SIN ARMA";
        }

        // Radar
        this.updateRadar(gameManager);
    }

    updateRadar(gameManager) {
        // Clear old dots
        this.radarDots.forEach(d => d.dispose());
        this.radarDots = [];

        const player = gameManager.player;
        const enemies = gameManager.enemyManager.enemies;
        const radarRange = GameConfig.radar.range;

        enemies.forEach(e => {
            const dist = Vector3.Distance(player.mesh.position, e.position);
            if (dist < radarRange) {
                const dot = new Ellipse();
                dot.width = "6px";
                dot.height = "6px";
                dot.background = "red";
                dot.horizontalAlignment = 2;
                dot.verticalAlignment = 2;

                const scale = 75 / radarRange;
                dot.left = (e.position.x - player.mesh.position.x) * scale + "px";
                dot.top = (e.position.z - player.mesh.position.z) * -scale + "px";

                this.radarContainer.addControl(dot);
                this.radarDots.push(dot);
            }
        });
    }

    updateWaveTitle(waveNumber) {
        this.waveTitle.text = "WAVE " + waveNumber;
    }

    showFloatingText(position, message, color) {
        this.visualEffects.createFloatingText(position, message, color);
    }

    showGameOver(gameManager) {
        // Remove existing game over menu if it exists
        if (this.gameOverMenu) {
            this.gameOverMenu.dispose();
        }

        // Create game over container
        this.gameOverMenu = new Rectangle();
        this.gameOverMenu.width = "600px";
        this.gameOverMenu.height = "400px";
        this.gameOverMenu.background = "rgba(0, 0, 0, 0.8)";
        this.gameOverMenu.color = "red";
        this.gameOverMenu.thickness = 3;
        this.gameOverMenu.horizontalAlignment = 2;
        this.gameOverMenu.verticalAlignment = 2;
        this.advancedTexture.addControl(this.gameOverMenu);

        // Game over title
        const title = new TextBlock();
        title.text = "MISIÓN FALLIDA";
        title.fontSize = 60;
        title.color = "red";
        title.fontWeight = "bold";
        title.top = "-120px";
        this.gameOverMenu.addControl(title);

        // Play again button
        const playAgainBtn = Button.CreateSimpleButton("playAgain", "JUGAR DE NUEVO");
        playAgainBtn.width = "300px";
        playAgainBtn.height = "70px";
        playAgainBtn.color = "white";
        playAgainBtn.background = "#4CAF50";
        playAgainBtn.fontSize = 24;
        playAgainBtn.fontWeight = "bold";
        playAgainBtn.top = "50px";
        playAgainBtn.onPointerUpObservable.add(() => {
            this.hideGameOver();
            if (gameManager) {
                gameManager.restart();
            }
        });
        this.gameOverMenu.addControl(playAgainBtn);
    }

    hideGameOver() {
        if (this.gameOverMenu) {
            this.gameOverMenu.dispose();
            this.gameOverMenu = null;
        }
    }


    createInventory() {
        this.inventoryPanel = new Rectangle();
        this.inventoryPanel.width = "400px";
        this.inventoryPanel.height = "500px";
        this.inventoryPanel.background = "#0f0f15";
        this.inventoryPanel.color = "gold";
        this.inventoryPanel.thickness = 2;
        this.inventoryPanel.isVisible = false;
        this.inventoryPanel.horizontalAlignment = 2;
        this.inventoryPanel.verticalAlignment = 2;
        this.advancedTexture.addControl(this.inventoryPanel);

        const header = new TextBlock();
        header.text = "INVENTARIO";
        header.color = "gold";
        header.fontSize = 24;
        header.height = "50px";
        header.top = "-220px";
        this.inventoryPanel.addControl(header);

        // Scroll Viewer for list
        this.invScrollViewer = new ScrollViewer();
        this.invScrollViewer.width = "380px";
        this.invScrollViewer.height = "430px";
        this.invScrollViewer.top = "30px";
        this.invScrollViewer.thickness = 0;
        this.invScrollViewer.barColor = "gold";
        this.inventoryPanel.addControl(this.invScrollViewer);

        // StackPanel for items
        this.invStackPanel = new StackPanel();
        this.invStackPanel.width = "100%";
        this.invStackPanel.verticalAlignment = 0; // Top
        this.invScrollViewer.addControl(this.invStackPanel);
    }

    toggleInventory(gameManager) {
        if (gameManager) this.gameManager = gameManager;

        this.inventoryPanel.isVisible = !this.inventoryPanel.isVisible;
        if (this.inventoryPanel.isVisible) {
            this.updateInventory();
        }
    }

    updateInventory() {
        if (!this.inventoryPanel.isVisible || !this.gameManager) return;

        const gm = this.gameManager;
        const ws = gm.weaponSystem;

        // Clear existing items
        this.invStackPanel.clearControls();

        // Gold Display
        const goldText = new TextBlock();
        goldText.text = `ORO: ${gm.gold}`;
        goldText.color = "yellow";
        goldText.fontSize = 20;
        goldText.height = "40px";
        this.invStackPanel.addControl(goldText);

        const grenadesText = new TextBlock();
        grenadesText.text = `GRANADAS: ${ws.grenadeCount}`;
        grenadesText.color = "white";
        grenadesText.fontSize = 18;
        grenadesText.height = "30px";
        this.invStackPanel.addControl(grenadesText);

        // Separator
        const sep = new Rectangle();
        sep.height = "2px";
        sep.width = "90%";
        sep.color = "gray";
        sep.background = "gray";
        this.invStackPanel.addControl(sep);

        // List Weapons
        for (let i = 1; i <= 14; i++) {
            if (ws.unlockedWeapons[i]) {
                const isEquipped = ws.currentWeapon === i;
                const name = WEAPON_NAMES[i] || `ARMA ${i}`;

                const btn = Button.CreateSimpleButton(`invBtn_${i}`, name);
                btn.width = "100%";
                btn.height = "50px";
                btn.color = isEquipped ? "lime" : "white";
                btn.background = isEquipped ? "#003300" : "#222";
                btn.thickness = isEquipped ? 2 : 1;
                btn.fontSize = 18;
                btn.paddingTop = "5px";
                btn.paddingBottom = "5px";

                btn.onPointerUpObservable.add(() => {
                    ws.setWeapon(i);
                    this.updateInventory(); // Refresh to show new selection
                });

                this.invStackPanel.addControl(btn);
            }
        }
    }
}
