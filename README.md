Actúa como un desarrollador Frontend experto y educador en biología celular. Tu tarea es generar un simulador web interactivo y educativo sobre el mecanismo de acción de la digoxina en la membrana celular. 

El proyecto debe ser estructurado exclusivamente en 3 archivos independientes (index.html, style.css, script.js) utilizando HTML5, CSS3 y JavaScript vanilla (ES6), sin frameworks externos (ni React, ni Angular, ni Vue, ni librerías de gráficos como Chart.js). Debe funcionar abriéndose directamente en el navegador.

Por favor, genera el código completo para cada uno de los siguientes archivos basándote en las especificaciones detalladas:

---

### ARCHIVO 1: index.html
Debe contener la estructura semántica básica:
1. Una sección de control superior/lateral con los botones: "Iniciar simulación", "Pausar", "Reiniciar", y un interruptor/botón para "Velocidad ×1 / ×2".
2. El control deslizante (slider) para "Digoxina" (Rango 0 - 100%).
3. Un panel de variables/métricas en tiempo real que muestre:
   - Na⁺ intracelular y extracelular.
   - K⁺ intracelular y extracelular.
   - Ca²⁺ intracelular.
   - Número de ATPasas activas y bloqueadas.
   - Velocidad promedio del NCX (en %).
4. El contenedor principal de la simulación visual (puedes usar un <canvas> de HTML5 o un contenedor DOM flexible para las animaciones).
5. Una zona inferior para el gráfico interactivo nativo (dibujado mediante Canvas o divs dinámicos).

### ARCHIVO 2: style.css
Estilos limpios, modernos y scannables:
- Layout dividido en tres zonas verticales claras (Controles/Métricas, Membrana/Animación, Gráfico).
- La membrana plasmática debe ser una franja horizontal de color Gris claro que ocupe todo el ancho de la pantalla, dividiendo claramente el Espacio Extracelular (arriba) del Citoplasma (abajo).
- Paleta cromática estricta para los elementos:
  * Na⁺ (Sodio): Esfera Azul.
  * K⁺ (Potasio): Esfera Violeta.
  * Ca²⁺ (Calcio): Esfera Roja.
  * ATP: Pequeño círculo Amarillo.
  * Digoxina: Molécula Verde.
  * ATPasa Activa: Celeste.
  * ATPasa Bloqueada: Gris oscuro con una pequeña 'X' roja encima.
  * Intercambiador NCX: Naranja.

### ARCHIVO 3: script.js
Lógica de la simulación y modelo fisiológico. Implementa un bucle de animación suave (`requestAnimationFrame`) que maneje las siguientes reglas:

1. **Configuración Inicial:**
   - Renderizar de forma alterna a lo largo de la membrana 10 bombas Na⁺/K⁺-ATPasa y 10 intercambiadores NCX (en total 20 proteínas transmembrana funcionando en paralelo).

2. **Com
