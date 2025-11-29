# 🎨 SISTEMA DE OBJETOS DECORATIVOS

Este sistema te permite agregar objetos decorativos al mapa como mesas, paneles, cajas, consolas, etc. para hacer el mapa más interesante y no completamente plano.

## 📋 Tipos de Objetos Disponibles

- **`table`** - Mesa con patas (tiene colisión)
- **`panel`** - Panel vertical (tiene colisión)
- **`box`** - Caja simple (tiene colisión)
- **`crate`** - Caja de madera/cráter (tiene colisión)
- **`console`** - Consola con pantalla (sin colisión por defecto)
- **`barrel`** - Barril cilíndrico (tiene colisión)
- **`column`** - Columna alta (tiene colisión)

## ⚙️ Configuración

Abre `src/config/gameConfig.js` y busca la sección `decorativeObjects`.

### Activar/Desactivar

```javascript
decorativeObjects: {
    enabled: true,  // Cambia a false para desactivar todos los objetos
    // ...
}
```

### Agregar Objetos

En el array `objects`, agrega objetos con esta estructura:

```javascript
{
    type: 'table',              // Tipo de objeto
    position: { x: 20, z: 20 }, // Posición en el mapa
    rotation: 0,                 // Rotación en grados (0-360)
    hasCollision: true           // true = el jugador choca, false = puede pasar
}
```

### Ejemplo Completo

```javascript
decorativeObjects: {
    enabled: true,
    objects: [
        // Mesas
        { type: 'table', position: { x: 20, z: 20 }, rotation: 0, hasCollision: true },
        { type: 'table', position: { x: -30, z: 15 }, rotation: 45, hasCollision: true },
        
        // Paneles
        { type: 'panel', position: { x: -20, z: -30 }, rotation: 0, hasCollision: true },
        { type: 'panel', position: { x: 35, z: 30 }, rotation: 90, hasCollision: true },
        
        // Cajas
        { type: 'box', position: { x: 10, z: -15 }, rotation: 0, hasCollision: true },
        { type: 'crate', position: { x: 15, z: 35 }, rotation: 0, hasCollision: true },
        
        // Consolas (sin colisión para que puedas acercarte)
        { type: 'console', position: { x: -40, z: -20 }, rotation: 180, hasCollision: false },
        
        // Barriles
        { type: 'barrel', position: { x: -15, z: 40 }, rotation: 0, hasCollision: true },
        
        // Columnas
        { type: 'column', position: { x: 0, z: 0 }, rotation: 0, hasCollision: true },
    ],
    // ...
}
```

## 🎨 Personalizar Colores

Puedes cambiar los colores de cada tipo de objeto en la sección `materials`:

```javascript
materials: {
    table: { 
        color: [0.4, 0.3, 0.2],      // Color RGB (0-1)
        emissive: [0, 0, 0]          // Brillo/emisión RGB (0-1)
    },
    panel: { 
        color: [0.2, 0.2, 0.3], 
        emissive: [0.1, 0.1, 0.2] 
    },
    console: { 
        color: [0.1, 0.1, 0.15], 
        emissive: [0, 0.3, 0.5]      // Las consolas brillan más
    },
    // ... etc
}
```

### Valores RGB (0-1)
- `[1, 0, 0]` = Rojo
- `[0, 1, 0]` = Verde
- `[0, 0, 1]` = Azul
- `[0.5, 0.5, 0.5]` = Gris medio
- `[0, 0, 0]` = Negro
- `[1, 1, 1]` = Blanco

## 📍 Coordenadas del Mapa

El mapa tiene un tamaño de 200x200 unidades, centrado en (0, 0):
- **X positivo** = Este (derecha)
- **X negativo** = Oeste (izquierda)
- **Z positivo** = Norte (arriba)
- **Z negativo** = Sur (abajo)

Rango aproximado: -100 a +100 en cada eje.

## 🔄 Rotación

La rotación se especifica en **grados** (0-360):
- `0` = Sin rotación
- `90` = 90 grados (cuarto de vuelta)
- `180` = Media vuelta
- `45` = 45 grados

## 💡 Consejos

1. **Colisiones**: 
   - Usa `hasCollision: true` para objetos que deben bloquear al jugador (mesas, cajas, barriles)
   - Usa `hasCollision: false` para objetos decorativos que el jugador puede atravesar (consolas pequeñas)

2. **Distribución**:
   - No coloques objetos muy cerca del centro (0, 0) donde empieza el jugador
   - Distribuye objetos por todo el mapa para crear variedad
   - Agrupa objetos relacionados (ej: varias mesas juntas)

3. **Variedad**:
   - Mezcla diferentes tipos de objetos
   - Usa diferentes rotaciones para más variedad visual
   - Alterna objetos con y sin colisión

4. **Rendimiento**:
   - No agregues demasiados objetos (máximo ~50-100)
   - Los objetos con colisión tienen más costo computacional

## 🎯 Ejemplo de Mapa Decorado

```javascript
objects: [
    // Zona de trabajo con mesas
    { type: 'table', position: { x: 30, z: 30 }, rotation: 0, hasCollision: true },
    { type: 'table', position: { x: 35, z: 30 }, rotation: 0, hasCollision: true },
    { type: 'console', position: { x: 32.5, z: 28 }, rotation: 0, hasCollision: false },
    
    // Zona de almacenamiento
    { type: 'crate', position: { x: -40, z: 40 }, rotation: 0, hasCollision: true },
    { type: 'crate', position: { x: -38, z: 40 }, rotation: 15, hasCollision: true },
    { type: 'box', position: { x: -42, z: 40 }, rotation: 30, hasCollision: true },
    
    // Barreras con paneles
    { type: 'panel', position: { x: 50, z: 0 }, rotation: 90, hasCollision: true },
    { type: 'panel', position: { x: 50, z: 10 }, rotation: 90, hasCollision: true },
    { type: 'panel', position: { x: 50, z: -10 }, rotation: 90, hasCollision: true },
    
    // Columnas decorativas
    { type: 'column', position: { x: -50, z: -50 }, rotation: 0, hasCollision: true },
    { type: 'column', position: { x: 50, z: -50 }, rotation: 0, hasCollision: true },
    { type: 'column', position: { x: -50, z: 50 }, rotation: 0, hasCollision: true },
    { type: 'column', position: { x: 50, z: 50 }, rotation: 0, hasCollision: true },
]
```

## 🚀 Agregar Nuevos Tipos

Para agregar nuevos tipos de objetos, edita el método `createDecorativeObject` en `src/core/SceneSetup.js` y agrega un nuevo `case` en el `switch`.

