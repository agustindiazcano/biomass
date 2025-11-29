# 🎨 INSTRUCCIONES PARA TEXTURAS

## 📁 Dónde colocar las texturas

Coloca todas tus imágenes de textura en esta carpeta:
```
public/assets/textures/
```

## 🏗️ CONFIGURACIÓN DE PAREDES

### 1. Agregar textura de pared

1. Coloca tu imagen de pared en `public/assets/textures/`
   - Ejemplo: `wall.jpg`, `wall.png`, `pared.jpg`

2. Abre `src/config/gameConfig.js`

3. Busca la sección `visual` y configura:
   ```javascript
   wallTexture: "/assets/textures/wall.jpg",  // Cambia a tu archivo
   wallTextureScale: 2,  // Ajusta el tamaño (mayor = más pequeña)
   wallHeight: 20,        // Altura de las paredes
   wallThickness: 2       // Grosor de las paredes
   ```

### 2. Ajustar altura y grosor

- `wallHeight: 10` → Paredes más bajas
- `wallHeight: 30` → Paredes más altas
- `wallThickness: 1` → Paredes más delgadas
- `wallThickness: 5` → Paredes más gruesas

## 🎲 SISTEMA DE TEXTURAS VARIADAS PARA EL PISO

El sistema permite usar múltiples texturas que se intercalan automáticamente para evitar repetición monótona.

### 1. Preparar tus texturas

Crea diferentes texturas para diferentes elementos:
- **Textura base**: El piso principal (más común)
- **Ventilaciones**: Rejillas de ventilación (menos frecuente)
- **Ventanas**: Ventanas o paneles (menos frecuente)
- **Pantallas**: Pantallas o displays (menos frecuente)

Ejemplo de nombres:
- `ground.jpg` (textura base)
- `ventilation.jpg` (ventilaciones)
- `window.jpg` (ventanas)
- `screen.jpg` (pantallas)

### 2. Configurar en gameConfig.js

En `src/config/gameConfig.js`, busca `visual` y configura:

```javascript
groundTextures: [
    "/assets/textures/ground.jpg",        // Textura base (más común)
    "/assets/textures/ventilation.jpg",     // Ventilaciones
    "/assets/textures/window.jpg",         // Ventanas
    "/assets/textures/screen.jpg"          // Pantallas
],
// Probabilidades: 60% base, 15% ventilación, 15% ventana, 10% pantalla
groundTextureWeights: [60, 15, 15, 10],
groundTextureScale: 10  // Tamaño de repetición
```

### 3. Ajustar probabilidades

Los números en `groundTextureWeights` determinan qué tan frecuente es cada textura:

```javascript
// Ejemplo 1: Más textura base, menos decorativos
groundTextureWeights: [80, 10, 5, 5]

// Ejemplo 2: Más balanceado
groundTextureWeights: [50, 20, 20, 10]

// Ejemplo 3: Muchos decorativos
groundTextureWeights: [40, 20, 20, 20]
```

**Importante**: Los números no necesitan sumar 100, se normalizan automáticamente.

### 4. Usar solo una textura (simple)

Si solo quieres una textura que se repita:

```javascript
groundTextures: [
    "/assets/textures/ground.jpg"
],
groundTextureWeights: [100],  // Solo una opción
groundTextureScale: 10
```

## 📐 AJUSTES DE ESCALA

### Textura del piso
- `groundTextureScale: 5` → Textura más grande, menos repeticiones
- `groundTextureScale: 20` → Textura más pequeña, más repeticiones

### Textura de paredes
- `wallTextureScale: 1` → Textura más grande
- `wallTextureScale: 5` → Textura más pequeña, más repeticiones

## 🎯 EJEMPLO COMPLETO

```javascript
visual: {
    // ... otras configuraciones
    
    // PISO - Sistema variado
    groundTextures: [
        "/assets/textures/ground.jpg",
        "/assets/textures/ventilation.jpg",
        "/assets/textures/window.jpg",
        "/assets/textures/screen.jpg"
    ],
    groundTextureWeights: [60, 15, 15, 10],
    groundTextureScale: 10,
    
    // PAREDES
    wallTexture: "/assets/textures/wall.jpg",
    wallTextureScale: 2,
    wallHeight: 20,
    wallThickness: 2
}
```

## 💡 CONSEJOS

1. **Texturas sin costuras**: Usa texturas que se vean bien cuando se repiten (tileable)
2. **Tamaños similares**: Mantén todas las texturas en resoluciones similares para mejor resultado
3. **Contraste**: Usa texturas con buen contraste para que se distingan bien
4. **Optimización**: No uses texturas muy grandes (>2048px) para mejor rendimiento

## 🔄 RECARGAR

Después de cambiar las configuraciones:
1. Guarda `gameConfig.js`
2. Recarga el juego en el navegador
3. Las nuevas texturas se aplicarán automáticamente

