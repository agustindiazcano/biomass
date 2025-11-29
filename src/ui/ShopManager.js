import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { GameConfig } from '../config/gameConfig.js';

export class ShopManager {
    constructor(scene, gameManager) {
        this.scene = scene;
        this.gameManager = gameManager;
        this.setupShop();
    }

    setupShop() {
        const advancedTexture = this.gameManager.uiManager.advancedTexture;

        this.shopContainer = new Rectangle();
        this.shopContainer.width = "700px";
        this.shopContainer.height = "800px";
        this.shopContainer.background = "#0f0f15";
        this.shopContainer.color = "cyan";
        this.shopContainer.thickness = 2;
        this.shopContainer.isVisible = false;
        this.shopContainer.horizontalAlignment = 2;
        this.shopContainer.verticalAlignment = 2;
        advancedTexture.addControl(this.shopContainer);

        this.shopHeader = new TextBlock();
        this.shopHeader.text = "TIENDA - PAUSA";
        this.shopHeader.color = "cyan";
        this.shopHeader.fontSize = 24;
        this.shopHeader.top = "-260px";
        this.shopContainer.addControl(this.shopHeader);

        this.statsText = new TextBlock();
        this.statsText.text = "";
        this.statsText.color = "white";
        this.statsText.fontSize = 16;
        this.statsText.top = "-220px";
        this.shopContainer.addControl(this.statsText);

        // Next wave button
        const btnNextWave = Button.CreateSimpleButton("btnNext", "COMENZAR SIGUIENTE OLEADA");
        btnNextWave.width = "400px";
        btnNextWave.height = "60px";
        btnNextWave.color = "white";
        btnNextWave.background = "green";
        btnNextWave.top = "450px";
        btnNextWave.onPointerUpObservable.add(() => {
            this.gameManager.isPaused = false;
            this.shopContainer.isVisible = false;
            this.gameManager.canvas.style.cursor = "crosshair";
        });
        this.shopContainer.addControl(btnNextWave);

        // Settings Button
        const btnSettings = Button.CreateSimpleButton("btnSettings", "CONFIGURACIÓN");
        btnSettings.width = "400px";
        btnSettings.height = "60px";
        btnSettings.color = "white";
        btnSettings.background = "gray";
        btnSettings.top = "520px";
        btnSettings.onPointerUpObservable.add(() => {
            this.toggleSettingsPanel();
        });
        this.shopContainer.addControl(btnSettings);

        // Shop buttons
        this.createShopButtons();

        this.createSettingsPanel();
    }

    createSettingsPanel() {
        const advancedTexture = this.gameManager.uiManager.advancedTexture;

        this.settingsPanel = new Rectangle();
        this.settingsPanel.width = "500px";
        this.settingsPanel.height = "400px";
        this.settingsPanel.background = "#1a1a1a";
        this.settingsPanel.color = "white";
        this.settingsPanel.thickness = 2;
        this.settingsPanel.isVisible = false;
        this.settingsPanel.horizontalAlignment = 2;
        this.settingsPanel.verticalAlignment = 2;
        advancedTexture.addControl(this.settingsPanel);

        const header = new TextBlock();
        header.text = "CONFIGURACIÓN";
        header.color = "white";
        header.fontSize = 24;
        header.top = "-150px";
        this.settingsPanel.addControl(header);

        // Graphics Toggle
        const btnGraphics = Button.CreateSimpleButton("btnGraphics", "Gráficos Avanzados: ON");
        btnGraphics.width = "300px";
        btnGraphics.height = "50px";
        btnGraphics.color = "white";
        btnGraphics.background = "green";
        btnGraphics.top = "-50px";
        btnGraphics.onPointerUpObservable.add(() => {
            const isEnabled = this.gameManager.toggleGraphics();
            btnGraphics.textBlock.text = "Gráficos Avanzados: " + (isEnabled ? "ON" : "OFF");
            btnGraphics.background = isEnabled ? "green" : "red";
        });
        this.settingsPanel.addControl(btnGraphics);

        // Close Button
        const btnClose = Button.CreateSimpleButton("btnCloseSettings", "CERRAR");
        btnClose.width = "300px";
        btnClose.height = "50px";
        btnClose.color = "white";
        btnClose.background = "gray";
        btnClose.top = "100px";
        btnClose.onPointerUpObservable.add(() => {
            this.settingsPanel.isVisible = false;
            this.shopContainer.isVisible = true;
        });
        this.settingsPanel.addControl(btnClose);
    }

    toggleSettingsPanel() {
        this.shopContainer.isVisible = false;
        this.settingsPanel.isVisible = true;
    }

    createShopButtons() {
        const config = GameConfig.shop;
        const gameManager = this.gameManager;

        // Rifle upgrades
        this.createShopBtn(
            "Daño Rifle (+5)",
            config.rifleDamageUpgrade.cost,
            () => {
                gameManager.weaponSystem.rifleDamage += config.rifleDamageUpgrade.damageIncrease;
            },
            "-150px",
            "-220px"
        );

        this.createShopBtn(
            "Cadencia Rifle",
            config.rifleFireRateUpgrade.cost,
            () => {
                gameManager.weaponSystem.machineGunRate = Math.max(20,
                    gameManager.weaponSystem.machineGunRate - config.rifleFireRateUpgrade.rateDecrease);
            },
            "-150px",
            "0px"
        );

        // Health & Armor
        this.createShopBtn(
            "Botiquin (+50HP)",
            config.medkit.cost,
            () => {
                gameManager.player.heal(config.medkit.healAmount);
            },
            "-150px",
            "220px"
        );

        this.createShopBtn(
            "Armadura (+10%)",
            config.armor.cost,
            () => {
                gameManager.player.increaseArmor(config.armor.armorIncrease);
            },
            "-70px",
            "-220px"
        );

        // Drones
        this.createShopBtn(
            "Drone: Curacion",
            config.droneHeal.cost,
            () => {
                gameManager.droneManager.upgradeHeal();
            },
            "-70px",
            "0px"
        );

        this.createShopBtn(
            "Drone: Misiles",
            config.droneAttack.cost,
            () => {
                gameManager.droneManager.upgradeAttack();
            },
            "-70px",
            "220px"
        );

        this.createShopBtn(
            "+1 DRON",
            config.newDrone.cost,
            () => {
                gameManager.droneManager.createDrone(new Vector3(-1.5, 1.5, -1.5));
            },
            "10px",
            "0px"
        );

        // Weapons
        this.btnFlame = this.createShopBtn(
            "Lanzallamas",
            config.flamethrower.cost,
            () => {
                gameManager.weaponSystem.unlockedWeapons[2] = true;
            },
            "90px",
            "-220px",
            () => gameManager.weaponSystem.unlockedWeapons[2]
        );

        this.btnPlasma = this.createShopBtn(
            "Plasma Gun",
            config.plasmaGun.cost,
            () => {
                gameManager.weaponSystem.unlockedWeapons[3] = true;
            },
            "90px",
            "0px",
            () => gameManager.weaponSystem.unlockedWeapons[3]
        );

        this.btnLaser = this.createShopBtn(
            "Laser Rifle",
            config.laserRifle.cost,
            () => {
                gameManager.weaponSystem.unlockedWeapons[4] = true;
            },
            "90px",
            "220px",
            () => gameManager.weaponSystem.unlockedWeapons[4]
        );

        this.btnShotgun = this.createShopBtn(
            "Escopeta",
            config.shotgun.cost,
            () => {
                gameManager.weaponSystem.unlockedWeapons[5] = true;
            },
            "160px",
            "-220px",
            () => gameManager.weaponSystem.unlockedWeapons[5]
        );

        this.btnPistol = this.createShopBtn(
            "Pistola",
            config.pistol.cost,
            () => { gameManager.weaponSystem.unlockedWeapons[6] = true; },
            "160px", "220px",
            () => gameManager.weaponSystem.unlockedWeapons[6]
        );

        this.btnShock = this.createShopBtn(
            "Shock Grenade",
            config.shockGrenade.cost,
            () => { gameManager.weaponSystem.unlockedWeapons[7] = true; },
            "230px", "-220px",
            () => gameManager.weaponSystem.unlockedWeapons[7]
        );

        this.btnGatling = this.createShopBtn(
            "Gatling Gun",
            config.gatling.cost,
            () => { gameManager.weaponSystem.unlockedWeapons[8] = true; },
            "230px", "0px",
            () => gameManager.weaponSystem.unlockedWeapons[8]
        );

        this.btnSniper = this.createShopBtn(
            "Sniper Rifle",
            config.sniper.cost,
            () => { gameManager.weaponSystem.unlockedWeapons[9] = true; },
            "230px", "220px",
            () => gameManager.weaponSystem.unlockedWeapons[9]
        );

        this.btnPulse = this.createShopBtn(
            "Pulse Rifle",
            config.pulse.cost,
            () => { gameManager.weaponSystem.unlockedWeapons[10] = true; },
            "300px", "-220px",
            () => gameManager.weaponSystem.unlockedWeapons[10]
        );

        this.btnRailgun = this.createShopBtn(
            "Railgun",
            config.railgun.cost,
            () => { gameManager.weaponSystem.unlockedWeapons[11] = true; },
            "300px", "0px",
            () => gameManager.weaponSystem.unlockedWeapons[11]
        );

        this.btnLaserCannon = this.createShopBtn(
            "Laser Cannon",
            config.laserCannon.cost,
            () => { gameManager.weaponSystem.unlockedWeapons[12] = true; },
            "300px", "220px",
            () => gameManager.weaponSystem.unlockedWeapons[12]
        );

        this.btnPlasmaPistol = this.createShopBtn(
            "Plasma Pistol",
            config.plasmaPistol.cost,
            () => { gameManager.weaponSystem.unlockedWeapons[13] = true; },
            "370px", "-220px",
            () => gameManager.weaponSystem.unlockedWeapons[13]
        );

        this.btnMachineGun = this.createShopBtn(
            "Machine Gun",
            config.machineGun.cost,
            () => { gameManager.weaponSystem.unlockedWeapons[14] = true; },
            "370px", "0px",
            () => gameManager.weaponSystem.unlockedWeapons[14]
        );
    }

    createShopBtn(text, price, action, top, left, checkBuy) {
        const btn = Button.CreateSimpleButton("btn", text + "\nCost: " + price);
        btn.width = "200px";
        btn.height = "60px";
        btn.color = "white";
        btn.background = "#222";
        btn.top = top;
        btn.left = left;
        btn.fontSize = 14;
        btn.onPointerUpObservable.add(() => {
            if (this.gameManager.gold >= price) {
                if (checkBuy && checkBuy()) return;
                this.gameManager.spendGold(price);
                action();
                this.updateShopUI();
            }
        });
        this.shopContainer.addControl(btn);
        return btn;
    }

    updateShopUI() {
        const gameManager = this.gameManager;
        this.statsText.text = `ORO: ${gameManager.gold} | Daño: ${gameManager.weaponSystem.rifleDamage} | Armor: ${gameManager.player.armor}%`;

        if (gameManager.weaponSystem.unlockedWeapons[2]) {
            this.btnFlame.background = "green";
            this.btnFlame.children[0].text = "LANZALLAMAS (LISTO)";
        }
        if (gameManager.weaponSystem.unlockedWeapons[3]) {
            this.btnPlasma.background = "green";
            this.btnPlasma.children[0].text = "PLASMA (LISTO)";
        }
        if (gameManager.weaponSystem.unlockedWeapons[4]) {
            this.btnLaser.background = "green";
            this.btnLaser.children[0].text = "LASER (LISTO)";
        }
        if (gameManager.weaponSystem.unlockedWeapons[5]) {
            this.btnShotgun.background = "green";
            this.btnShotgun.children[0].text = "ESCOPETA (LISTO)";
        }
        if (gameManager.weaponSystem.unlockedWeapons[6]) {
            this.btnPistol.background = "green";
            this.btnPistol.children[0].text = "PISTOLA (LISTO)";
        }
        if (gameManager.weaponSystem.unlockedWeapons[7]) {
            this.btnShock.background = "green";
            this.btnShock.children[0].text = "SHOCK (LISTO)";
        }
        if (gameManager.weaponSystem.unlockedWeapons[8]) {
            this.btnGatling.background = "green";
            this.btnGatling.children[0].text = "GATLING (LISTO)";
        }
        if (gameManager.weaponSystem.unlockedWeapons[9]) {
            this.btnSniper.background = "green";
            this.btnSniper.children[0].text = "SNIPER (LISTO)";
        }
        if (gameManager.weaponSystem.unlockedWeapons[10]) {
            this.btnPulse.background = "green";
            this.btnPulse.children[0].text = "PULSE (LISTO)";
        }
        if (gameManager.weaponSystem.unlockedWeapons[11]) {
            this.btnRailgun.background = "green";
            this.btnRailgun.children[0].text = "RAILGUN (LISTO)";
        }
        if (gameManager.weaponSystem.unlockedWeapons[12]) {
            this.btnLaserCannon.background = "green";
            this.btnLaserCannon.children[0].text = "LASER C. (LISTO)";
        }
        if (gameManager.weaponSystem.unlockedWeapons[13]) {
            this.btnPlasmaPistol.background = "green";
            this.btnPlasmaPistol.children[0].text = "PLASMA P. (LISTO)";
        }
        if (gameManager.weaponSystem.unlockedWeapons[14]) {
            this.btnMachineGun.background = "green";
            this.btnMachineGun.children[0].text = "MACHINE G. (LISTO)";
        }
    }

    setVisible(visible) {
        this.shopContainer.isVisible = visible;
        if (visible) {
            this.updateShopUI();
        }
    }
}

