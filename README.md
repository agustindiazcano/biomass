# Marine Survival - Big Bullets

Un juego de supervivencia en 3D construido con Babylon.js.

## 🎮 Características

- Sistema de oleadas progresivas
- Múltiples armas (Rifle, Lanzallamas, Plasma, Laser)
- Sistema de drones con habilidades
- Tienda entre oleadas
- Sistema de progresión (XP, niveles)
- Radar de enemigos
- Efectos visuales y partículas

## 📁 Estructura del Proyecto

```
juego/
├── src/
│   ├── core/           # Núcleo del juego (GameManager, SceneSetup)
│   ├── entities/       # Entidades (Player)
│   ├── managers/       # Gestores (Enemy, Wave, Input, Loot, Drone)
│   ├── weapons/        # Sistema de armas
│   ├── ui/            # Interfaz de usuario (HUD, Shop)
│   ├── utils/         # Utilidades (VisualEffects, constants)
│   ├── config/        # Configuración del juego
│   ├── styles/        # Estilos CSS
│   └── main.js        # Punto de entrada
├── assets/
│   └── textures/      # Texturas del juego
├── public/            # Archivos estáticos
├── index.html         # HTML principal
├── package.json       # Dependencias
└── vite.config.js     # Configuración de Vite
```

## 🚀 Instalación y Uso

### Prerrequisitos

- Node.js (v16 o superior)
- npm o yarn

### Instalación

```bash
# Instalar dependencias
npm install
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev
```

El juego se abrirá automáticamente en `http://localhost:3000`

### Build para Producción

```bash
# Construir para producción
npm run build

# Previsualizar build de producción
npm run preview
```

## 🎯 Controles

- **WASD**: Movimiento
- **Mouse**: Apuntar
- **Click Izquierdo**: Disparar
- **R**: Recargar (Rifle)
- **1-4**: Cambiar arma
- **ESC**: Pausa/Tienda

## 🛠️ Tecnologías

- **Babylon.js**: Motor 3D
- **Vite**: Build tool y dev server
- **ES6 Modules**: Sistema de módulos moderno

## 📝 Notas

- Las texturas se esperan en `/assets/textures/`
- El juego usa módulos ES6, requiere un servidor (Vite lo proporciona)
- Compatible con navegadores modernos que soporten ES6

## 🔧 Configuración

Puedes modificar los valores del juego en `src/config/gameConfig.js`:

- Stats del jugador
- Daño y cadencia de armas
- Configuración de oleadas
- Precios de la tienda
- Y más...

## 📦 ¿Necesitas un Framework?

**No necesitas un framework pesado** como React o Vue para este juego. La estructura modular con ES6 modules es suficiente. Sin embargo, si quieres:

- **TypeScript**: Mejoraría el desarrollo con tipos
- **Vite**: Ya está configurado (build tool, no framework)
- **Babylon.js**: Ya es el "framework" para 3D

La estructura actual es escalable y mantenible sin frameworks adicionales.

