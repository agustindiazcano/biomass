# Assets Directory

Esta carpeta contiene los recursos del juego (modelos 3D y sonidos).

## Estructura de Carpetas

### `/assets/models/`
Coloca aquí los modelos 3D en formato `.glb` o `.gltf`:

- `player.glb` - Modelo 3D del jugador (opcional, si no existe se usa geometría de respaldo)
- `alien.glb` - Modelo 3D del enemigo alien (opcional)
- `worm.glb` - Modelo 3D del enemigo gusano (opcional)
- `brute.glb` - Modelo 3D del enemigo brute (opcional)

**Nota:** Si no colocas estos archivos, el juego usará automáticamente geometría de respaldo (cajas y esferas).

### `/assets/sounds/`
Coloca aquí los archivos de audio en formato `.wav` o `.mp3`:

- `rifle_shot.wav` - Sonido de disparo del rifle
- `plasma_shot.wav` - Sonido de disparo de plasma
- `flame_shot.wav` - Sonido de disparo de lanzallamas
- `laser_shot.wav` - Sonido de disparo láser
- `enemy_hit.mp3` - Sonido cuando un enemigo recibe daño
- `enemy_attack.wav` - Sonido cuando un enemigo ataca
- `jump.wav` - Sonido del salto del jugador
- `reload.wav` - Sonido de recarga
- `game_over.mp3` - Sonido de game over
- `level_up.wav` - Sonido de subir de nivel

**Nota:** Si no colocas estos archivos, el juego funcionará sin sonidos (no habrá errores).

## Dónde conseguir recursos gratuitos

### Modelos 3D:
- **Sketchfab** (https://sketchfab.com) - Busca modelos con licencia CC0 o CC-BY
- **Mixamo** (https://www.mixamo.com) - Modelos de personajes animados (gratis con cuenta Adobe)
- **Poly Haven** (https://polyhaven.com/models) - Modelos gratuitos

### Sonidos:
- **Freesound** (https://freesound.org) - Sonidos gratuitos con licencia CC0
- **OpenGameArt** (https://opengameart.org) - Recursos de audio para juegos
- **Zapsplat** (https://www.zapsplat.com) - Sonidos gratuitos (requiere registro)

## Formato recomendado

- **Modelos:** `.glb` (formato binario, más eficiente que `.gltf`)
- **Sonidos:** `.wav` para efectos cortos, `.mp3` para sonidos más largos

