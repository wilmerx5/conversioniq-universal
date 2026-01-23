# ConversionIQ - Universal Tracker

Script de tracking universal que funciona en **cualquier sitio web** (WordPress, HTML estático, React, Vue, Next.js, etc.)

## 🚀 Instalación Rápida

### Opción 1: Via data attribute (Recomendado)

```html
<script 
  src="https://cdn.jsdelivr.net/gh/TU-USUARIO/conversioniq-universal@latest/tracker.js"
  data-api-key="ciq_tu_api_key_aqui">
</script>
```

### Opción 2: Via variable global

```html
<script>
  window.CIQ_API_KEY = 'ciq_tu_api_key_aqui';
  // Legacy support (optional)
  window.WPCM_API_KEY = 'ciq_tu_api_key_aqui';
</script>
<script src="https://cdn.jsdelivr.net/gh/TU-USUARIO/conversioniq-universal@latest/tracker.js"></script>
```

### Opción 3: Via localStorage (para configuración dinámica)

```html
<script>
  localStorage.setItem('ciq_api_key', 'ciq_tu_api_key_aqui');
  // Legacy support (optional)
  localStorage.setItem('wpcm_api_key', 'ciq_tu_api_key_aqui');
</script>
<script src="https://cdn.jsdelivr.net/gh/TU-USUARIO/conversioniq-universal@latest/tracker.js"></script>
```

## 📋 Ejemplos por Plataforma

### HTML Estático

```html
<!DOCTYPE html>
<html>
<head>
  <title>Mi Sitio</title>
  <script 
    src="https://cdn.jsdelivr.net/gh/TU-USUARIO/conversioniq-universal@latest/tracker.js"
    data-api-key="ciq_tu_api_key_aqui">
  </script>
</head>
<body>
  <h1>Mi Contenido</h1>
</body>
</html>
```

### React / Create React App

```jsx
// App.js o index.js
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Crear y cargar el script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/TU-USUARIO/conversioniq-universal@latest/tracker.js';
    script.setAttribute('data-api-key', 'wpcm_tu_api_key_aqui');
    script.async = true;
    document.head.appendChild(script);

    // Cleanup
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return <div>Mi App</div>;
}
```

### Next.js

#### Opción A: _app.js (recomendado)

```jsx
// pages/_app.js
import { useEffect } from 'react';
import Script from 'next/script';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/gh/TU-USUARIO/conversioniq-universal@latest/tracker.js"
        data-api-key="wpcm_tu_api_key_aqui"
        strategy="afterInteractive"
      />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
```

#### Opción B: _document.js

```jsx
// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

export default function Document() {
  return (
    <Html>
      <Head>
        <Script
          src="https://cdn.jsdelivr.net/gh/TU-USUARIO/conversioniq-universal@latest/tracker.js"
          data-api-key="wpcm_tu_api_key_aqui"
          strategy="afterInteractive"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

### Vue.js

```vue
<!-- App.vue o main.js -->
<template>
  <div id="app">
    <!-- Tu contenido -->
  </div>
</template>

<script>
export default {
  name: 'App',
  mounted() {
    // Cargar script de tracking
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/TU-USUARIO/conversioniq-universal@latest/tracker.js';
    script.setAttribute('data-api-key', 'wpcm_tu_api_key_aqui');
    script.async = true;
    document.head.appendChild(script);
  }
}
</script>
```

### Nuxt.js

```javascript
// nuxt.config.js
export default {
  head: {
    script: [
      {
        src: 'https://cdn.jsdelivr.net/gh/TU-USUARIO/conversioniq-universal@latest/tracker.js',
        'data-api-key': 'wpcm_tu_api_key_aqui',
        async: true
      }
    ]
  }
}
```

### Angular

```typescript
// app.component.ts
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  ngOnInit() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/TU-USUARIO/conversioniq-universal@latest/tracker.js';
    script.setAttribute('data-api-key', 'wpcm_tu_api_key_aqui');
    script.async = true;
    document.head.appendChild(script);
  }
}
```

### Shopify

1. Ve a **Online Store > Themes > Actions > Edit code**
2. Abre `theme.liquid`
3. Agrega antes de `</head>`:

```liquid
<script 
  src="https://cdn.jsdelivr.net/gh/TU-USUARIO/conversioniq-universal@latest/tracker.js"
  data-api-key="ciq_tu_api_key_aqui">
</script>
```

### WordPress (sin plugin)

Si prefieres no usar el plugin, puedes agregar esto en tu tema:

```php
// functions.php
function add_ciq_tracker() {
    ?>
    <script 
      src="https://cdn.jsdelivr.net/gh/TU-USUARIO/conversioniq-universal@latest/tracker.js"
      data-api-key="ciq_tu_api_key_aqui">
    </script>
    <?php
}
add_action('wp_head', 'add_ciq_tracker');
```

## 🔑 Obtener tu API Key

1. Inicia sesión en tu Dashboard
2. Ve a **Settings > API Keys**
3. Copia la API key de tu sitio
4. Pégala en el código de instalación

## ✅ Verificar Instalación

1. Instala el script en tu sitio
2. Navega por algunas páginas
3. Ve al Dashboard > Tu Sitio
4. Deberías ver eventos llegando en tiempo real

## 🔒 Seguridad

- ✅ La API key se envía de forma segura via headers HTTP
- ✅ El script usa HTTPS para todas las comunicaciones
- ✅ Rate limiting automático en el backend
- ✅ Validación de API key en cada request

## 📊 Eventos que se Trackean

- **Page Views**: Cada vez que se carga una página
- **Clicks**: Clicks en enlaces y botones
- **Scroll Depth**: 25%, 50%, 75%, 100%
- **Form Views**: Cuando un formulario es visible
- **Form Starts**: Primera interacción con un formulario
- **Form Submits**: Envío de formularios
- **Form Abandons**: Abandono de formularios
- **Form Errors**: Errores de validación

## 🛠️ Troubleshooting

### El script no carga eventos

1. Verifica que la API key sea correcta
2. Abre la consola del navegador (F12) y busca errores
3. Verifica que el sitio tenga acceso a internet
4. Asegúrate de que el script esté en todas las páginas

### Error: "API key not found"

- Verifica que hayas configurado la API key correctamente
- Asegúrate de usar una de las 3 opciones de instalación
- Verifica que no haya errores de JavaScript antes del script

### Los eventos no aparecen en el dashboard

- Espera unos segundos (puede haber un pequeño delay)
- Verifica que tu suscripción esté activa
- Verifica que el dominio coincida con el configurado en el dashboard

## 📝 Notas

- El script es **ligero** (< 10KB sin minificar)
- **Sin dependencias** externas
- Compatible con **todos los navegadores modernos**
- **No bloquea** la carga de la página
- Respetuoso con la **privacidad** (no trackea datos personales)

## 🔄 Actualizaciones

El script se actualiza automáticamente cuando usas la URL del CDN. Si necesitas una versión específica:

```
https://cdn.jsdelivr.net/gh/TU-USUARIO/conversioniq-universal@v1.0.0/tracker.js
```

## 📞 Soporte

¿Necesitas ayuda? Contacta soporte desde tu dashboard o revisa la documentación completa.

---

**Versión**: 1.0.0  
**Última actualización**: 2024
