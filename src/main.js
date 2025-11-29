import { GameManager } from './core/GameManager.js';

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('renderCanvas');
    const damageDiv = document.getElementById('damage-overlay');
    
    if (!canvas) {
        console.error('Canvas not found!');
        return;
    }
    
    // Initialize game
    const gameManager = new GameManager(canvas);
    
    // Setup damage overlay
    let damageAlpha = 0;
    gameManager.scene.registerBeforeRender(() => {
        if (damageAlpha > 0) {
            damageAlpha -= 0.01;
            if (damageAlpha < 0) damageAlpha = 0;
            damageDiv.style.opacity = damageAlpha;
        }
    });
    
    // Expose damage function
    gameManager.showDamage = () => {
        if (damageAlpha < 0.1) damageAlpha = 0.3;
    };
    
    // Start game loop
    gameManager.start();
    
    // Make gameManager available globally for debugging
    window.gameManager = gameManager;
});

