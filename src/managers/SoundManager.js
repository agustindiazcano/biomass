import "@babylonjs/core/Audio/audioSceneComponent";
import { Sound } from '@babylonjs/core/Audio/sound';

export class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.sounds = {};
        this.soundsLoaded = {};
        
        // Capturar errores de promesas no capturadas relacionadas con audio
        this.setupErrorHandling();
        
        // Cargar sonidos de forma asíncrona y manejar errores
        this.loadSounds();
    }
    
    setupErrorHandling() {
        // Capturar errores de promesas no capturadas relacionadas con audio
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && (
                event.reason.message?.includes('decode audio') ||
                event.reason.message?.includes('EncodingError') ||
                event.reason.name === 'EncodingError'
            )) {
                // Silenciar errores de decodificación de audio
                event.preventDefault();
            }
        });
    }
    
    loadSounds() {
        // Lista de sonidos a cargar
        const soundList = [
            { key: 'shot_rifle', path: "/assets/sounds/rifle_shot.mp3", volume: 0.5 },
            { key: 'shot_plasma', path: "/assets/sounds/plasma_shot.wav", volume: 0.6 },
            { key: 'shot_flame', path: "/assets/sounds/flame_shot.wav", volume: 0.5 },
            { key: 'shot_laser', path: "/assets/sounds/laser_shot.wav", volume: 0.4 },
            { key: 'enemy_hit', path: "/assets/sounds/enemy_hit.mp3", volume: 0.4 },
            { key: 'enemy_attack', path: "/assets/sounds/enemy_attack.wav", volume: 0.3 },
            { key: 'player_jump', path: "/assets/sounds/jump.wav", volume: 0.5 },
            { key: 'reload', path: "/assets/sounds/reload.wav", volume: 0.4 },
            { key: 'game_over', path: "/assets/sounds/game_over.mp3", volume: 0.6 },
            { key: 'level_up', path: "/assets/sounds/level_up.wav", volume: 0.5 }
        ];
        
        // Cargar cada sonido con manejo de errores
        soundList.forEach(soundConfig => {
            this.loadSound(soundConfig.key, soundConfig.path, soundConfig.volume);
        });
    }
    
    loadSound(name, url, volume) {
        try {
            const sound = new Sound(
                name, 
                url, 
                this.scene, 
                null, 
                { 
                    volume: volume, 
                    loop: false,
                    autoplay: false,
                    streaming: false
                }, 
                () => {
                    // Callback de éxito - sonido cargado correctamente
                    this.soundsLoaded[name] = true;
                }, 
                (error) => {
                    // Callback de error - capturar y silenciar
                    this.soundsLoaded[name] = false;
                }
            );
            
            this.sounds[name] = sound;
            this.soundsLoaded[name] = undefined; // undefined = cargando
        } catch (e) {
            // Si falla la creación del sonido, simplemente no lo agregamos
            this.soundsLoaded[name] = false;
            this.sounds[name] = null;
        }
    }
    
    play(name) {
        // Intentar reproducir si el sonido existe
        if (this.sounds[name]) {
            try {
                // Intentar reproducir - Babylon.js manejará la carga automáticamente
                // Si el sonido aún no está cargado, play() simplemente no hará nada
                this.sounds[name].play();
            } catch (e) {
                // Silenciar errores de reproducción - no romper el juego
            }
        }
        // Si el sonido no existe, simplemente no hacer nada
    }
    
    stop(name) {
        if (this.sounds[name] && this.soundsLoaded[name]) {
            try {
                this.sounds[name].stop();
            } catch (e) {
                // Silenciar errores
            }
        }
    }
}

