import { GameConfig } from '../config/gameConfig.js';

export class WaveManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.currentWave = 1;
        this.maxWaves = GameConfig.waves.maxWaves;
        this.enemiesKilledInWave = 0;
        this.enemiesRequiredForWave = GameConfig.waves.initialEnemiesRequired;
        this.baseSpawnRate = GameConfig.waves.baseSpawnRate;
        this.currentSpawnRate = this.baseSpawnRate;
        this.lastSpawnTime = 0;
        this.baseEnemyDamage = GameConfig.waves.baseEnemyDamage;
        this.currentEnemyDamage = this.baseEnemyDamage;
    }

    update() {
        if (this.gameManager.isPaused || !this.gameManager.gameStarted) return;

        // Spawn enemies
        const now = Date.now();
        if (now - this.lastSpawnTime > this.currentSpawnRate) {
            this.gameManager.enemyManager.spawnEnemy(
                this.gameManager.spawnPoints,
                this.gameManager.player.level
            );
            this.lastSpawnTime = now;
        }

        // Check wave completion
        if (this.enemiesKilledInWave >= this.enemiesRequiredForWave) {
            this.advanceWave();
        }
    }

    onEnemyKilled() {
        this.enemiesKilledInWave++;
    }

    advanceWave() {
        if (this.currentWave >= this.maxWaves) return;

        this.currentWave++;
        this.enemiesKilledInWave = 0;
        this.enemiesRequiredForWave += GameConfig.waves.enemiesPerWaveIncrease;
        this.currentSpawnRate = this.currentSpawnRate * GameConfig.waves.spawnRateMultiplier;
        this.currentEnemyDamage = this.currentEnemyDamage * GameConfig.waves.enemyDamageMultiplier;

        this.gameManager.isPaused = true;
        this.gameManager.shopManager.setVisible(true);
        this.gameManager.uiManager.updateWaveTitle(this.currentWave);
    }
}

