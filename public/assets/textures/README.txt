INSTRUCCIONES PARA AGREGAR TU TEXTURA:

1. Coloca tu imagen en esta carpeta (public/assets/textures/)
   - Formatos soportados: .jpg, .png, .gif, .webp
   - Ejemplo: mi_textura.jpg

2. Abre el archivo: src/config/gameConfig.js

3. Busca la sección "visual" y cambia:
   groundTexture: null
   
   Por:
   groundTexture: "/assets/textures/NOMBRE_DE_TU_IMAGEN.jpg"
   
   (Reemplaza NOMBRE_DE_TU_IMAGEN.jpg con el nombre real de tu archivo)

4. Ajusta el tamaño de repetición:
   groundTextureScale: 10
   
   - Número más pequeño (ej: 5) = textura más grande, menos repeticiones
   - Número más grande (ej: 20) = textura más pequeña, más repeticiones

5. Guarda el archivo y recarga el juego

EJEMPLO:
Si tu imagen se llama "pasto.jpg", la configuración sería:
groundTexture: "/assets/textures/pasto.jpg"
groundTextureScale: 10

