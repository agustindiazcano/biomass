// Configuración del juego
export const GameConfig = {
    // Player
    player: {
        initialHealth: 100,
        initialMaxHealth: 100,
        initialArmor: 0,
        initialXP: 0,
        initialMaxXP: 100,
        initialLevel: 1,
        moveSpeed: 12,
        runSpeedMultiplier: 1.8,
        jumpForce: 8,
        gravity: -30
    },

    // Weapons
    weapons: {
        rifle: {
            damage: 35,
            fireRate: 100,
            ammo: 100,
            reloadTime: 1500
        },
        pistol: {
            damage: 25,
            fireRate: 250, // Semi-auto feel
            ammo: 50,
            reloadTime: 1000
        },
        shockGrenade: {
            damage: 50,
            radius: 10,
            duration: 10000, // 10 seconds slow
            speedReduction: 0.5, // 50% speed
            cooldown: 3000,
            throwForce: 15
        },
        gatling: {
            damage: 15,
            fireRate: 30, // Very fast
            ammo: 500,
            reloadTime: 4000
        },
        sniper: {
            damage: 200,
            fireRate: 1500, // Slow
            ammo: 10,
            reloadTime: 3000
        },
        pulse: {
            damage: 30,
            fireRate: 80, // Fast
            ammo: 80,
            reloadTime: 1500
        },
        railgun: {
            damage: 500,
            fireRate: 2000, // Very slow
            ammo: 5,
            reloadTime: 4000
        },
        laserCannon: {
            damage: 10, // Per tick
            fireRate: 0, // Continuous
            maxHeat: 100,
            heatPerTick: 1,
            coolDownRate: 2
        },
        plasmaPistol: {
            damage: 45,
            fireRate: 200,
            ammo: 40,
            reloadTime: 1200
        },
        machineGun: {
            damage: 40,
            fireRate: 90,
            ammo: 150,
            reloadTime: 2000
        },
        flamethrower: {
            damage: 5,
            fireRate: 50
        },
        plasma: { // Old plasma, maybe keep or replace? Let's keep for compatibility
            damage: 80,
            fireRate: 500
        },
        laser: { // Old laser rifle
            damage: 70,
            fireRate: 350
        },
        shotgun: {
            damage: 25,
            pellets: 8,
            fireRate: 800,
            spread: 0.15
        },
        grenade: {
            damage: 150,
            radius: 8,
            cooldown: 2000,
            throwForce: 15
        }
    },

    // Waves
    waves: {
        maxWaves: 100,
        initialEnemiesRequired: 100,
        enemiesPerWaveIncrease: 10,
        baseSpawnRate: 2500,
        spawnRateMultiplier: 0.9,
        baseEnemyDamage: 3,
        enemyDamageMultiplier: 1.05
    },

    // Enemies
    enemies: {
        maxEnemies: 200,
        spawnDistance: { min: 35, max: 50 },
        baseAlienHP: 50,
        baseWormHP: 30,
        baseBruteHP: 1000,
        hpPerLevel: { alien: 10, worm: 5, brute: 1 },
        moveSpeed: { alien: 6, worm: 6, brute: 2.5 }
    },

    // Drones
    drones: {
        healAmount: 5,
        attackDamage: 20,
        actionCooldown: 2000,
        orbitRadius: 2,
        orbitSpeed: 1
    },

    // Loot
    loot: {
        goldValue: 10,
        xpValue: 20,
        pickupDistance: 2.5
    },

    // Shop
    shop: {
        rifleDamageUpgrade: { cost: 100, damageIncrease: 5 },
        rifleFireRateUpgrade: { cost: 150, rateDecrease: 10 },
        medkit: { cost: 50, healAmount: 50 },
        armor: { cost: 80, armorIncrease: 10, maxArmor: 80 },
        droneHeal: { cost: 300 },
        droneAttack: { cost: 300 },
        newDrone: { cost: 500 },

        // Weapons (All 10 coins for testing)
        pistol: { cost: 10 },
        shockGrenade: { cost: 10 }, // Pack
        gatling: { cost: 10 },
        sniper: { cost: 10 },
        pulse: { cost: 10 },
        railgun: { cost: 10 },
        laserCannon: { cost: 10 },
        plasmaPistol: { cost: 10 },
        machineGun: { cost: 10 },

        flamethrower: { cost: 10 },
        plasmaGun: { cost: 10 },
        laserRifle: { cost: 10 },
        shotgun: { cost: 10 },
        grenade: { cost: 10 }
    },

    // Visual
    visual: {
        fogDensity: 0.01,
        glowIntensity: 0.5,
        bloomThreshold: 0.2,
        bloomWeight: 0.5,
        bloomKernel: 64,

        // Ground texture configuration - Sistema de texturas variadas
        // Puedes usar múltiples texturas que se alternarán en el piso
        groundTextures: [
            '/assets/textures/ground.jpg',
            'assets/textures/ground2.jpg',
        ],

        // Probabilidades de cada textura (deben sumar 100 o menos)
        // Si no se especifica, todas tienen la misma probabilidad
        groundTextureWeights: [], // Probabilidades: [60, 15, 15, 10] = 60% base, 15% ventilación, 15% ventana, 10% pantalla
        groundTextureScale: 10, // Cuántas veces se repite cada textura
        groundColor: null, // Color de fallback si no hay texturas

        // Wall configuration
        wallHeight: 20, // Altura de las paredes
        wallThickness: 2, // Grosor de las paredes
        wallTexture: '/assets/textures/wall1.jpg', // "/assets/textures/wall.jpg" - Textura de las paredes (agrega tu archivo)
        wallTextureScale: 2, // Escala de la textura en las paredes
        wallColor: null // Color de fallback si no hay textura (null = Color3(0.3, 0.3, 0.3))
    },

    // Radar
    radar: {
        range: 40,
        size: 150
    },

    // Decorative objects - Objetos decorativos para el mapa
    decorativeObjects: {
        enabled: false, // Activar/desactivar objetos decorativos
        // Tipos de objetos disponibles: 'table', 'panel', 'box', 'crate', 'console', 'barrel', 'column'
        objects: [],
        // Configuración de materiales y colores (RGB 0-1)
        materials: {
            table: { color: [0.4, 0.3, 0.2], emissive: [0, 0, 0] },
            panel: { color: [0.2, 0.2, 0.3], emissive: [0.1, 0.1, 0.2] },
            box: { color: [0.5, 0.4, 0.3], emissive: [0, 0, 0] },
            crate: { color: [0.6, 0.4, 0.2], emissive: [0, 0, 0] },
            console: { color: [0.1, 0.1, 0.15], emissive: [0, 0.3, 0.5] },
            barrel: { color: [0.3, 0.2, 0.1], emissive: [0, 0, 0] },
            column: { color: [0.4, 0.4, 0.4], emissive: [0, 0, 0] }
        }
    }
};

