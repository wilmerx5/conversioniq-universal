/**
 * Ejemplo de integración con Next.js
 * 
 * Opción 1: Usar _app.tsx (recomendado para tracking global)
 * Opción 2: Usar _document.tsx (si necesitas más control)
 * 
 * Este ejemplo muestra ambas opciones.
 */

// ============================================
// OPCIÓN 1: _app.tsx (Recomendado)
// ============================================
// Archivo: pages/_app.tsx

import { AppProps } from 'next/app';
import Script from 'next/script';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Script de tracking - se carga después de que la página sea interactiva */}
      <Script
        src="https://cdn.wp-conversion-monitor.com/tracker.js"
        data-api-key="wpcm_tu_api_key_aqui"
        strategy="afterInteractive"
      />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;

// ============================================
// OPCIÓN 2: _document.tsx (Alternativa)
// ============================================
// Archivo: pages/_document.tsx
/*
import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

export default function Document() {
  return (
    <Html>
      <Head>
        <Script
          src="https://cdn.wp-conversion-monitor.com/tracker.js"
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
*/

// ============================================
// OPCIÓN 3: Hook personalizado (Para más control)
// ============================================
// Archivo: hooks/useWPCM.ts
/*
import { useEffect } from 'react';

export function useWPCM(apiKey: string) {
  useEffect(() => {
    if (!apiKey) return;

    // Verificar si ya existe
    if (document.querySelector('script[data-api-key]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.wp-conversion-monitor.com/tracker.js';
    script.setAttribute('data-api-key', apiKey);
    script.async = true;
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[data-api-key]');
      if (existingScript?.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, [apiKey]);
}

// Uso en _app.tsx:
import { useWPCM } from '../hooks/useWPCM';

function MyApp({ Component, pageProps }: AppProps) {
  useWPCM('wpcm_tu_api_key_aqui');
  return <Component {...pageProps} />;
}
*/

// ============================================
// Ejemplo de página con contenido
// ============================================
// Archivo: pages/index.tsx
/*
import { NextPage } from 'next';

const HomePage: NextPage = () => {
  return (
    <div>
      <header>
        <h1>Mi Sitio Next.js</h1>
        <nav>
          <a href="/">Inicio</a>
          <a href="/about">Acerca</a>
          <a href="/contact">Contacto</a>
        </nav>
      </header>

      <main>
        <section>
          <h2>Bienvenido</h2>
          <p>Este es un ejemplo de Next.js con WP Conversion Monitor.</p>
          <button onClick={() => alert('Click tracked!')}>
            Botón de Ejemplo
          </button>
        </section>

        <section style={{ height: '2000px', padding: '20px' }}>
          <p>Desplázate para ver el tracking de scroll funcionando.</p>
        </section>

        <section>
          <h2>Formulario de Contacto</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            alert('Formulario enviado');
          }}>
            <div>
              <label htmlFor="name">Nombre:</label>
              <input type="text" id="name" name="name" required />
            </div>
            <div>
              <label htmlFor="email">Email:</label>
              <input type="email" id="email" name="email" required />
            </div>
            <button type="submit">Enviar</button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
*/
