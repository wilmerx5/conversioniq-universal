/**
 * Ejemplo de integración con React / Create React App
 * 
 * Instrucciones:
 * 1. Copia este código en tu App.js o crea un componente separado
 * 2. Reemplaza 'wpcm_tu_api_key_aqui' con tu API key real
 * 3. El script se cargará automáticamente cuando el componente se monte
 */

import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Verificar si el script ya existe
    if (document.querySelector('script[data-api-key]')) {
      return; // Ya está cargado
    }

    // Crear y cargar el script
    const script = document.createElement('script');
    script.src = 'https://cdn.wp-conversion-monitor.com/tracker.js';
    script.setAttribute('data-api-key', 'wpcm_tu_api_key_aqui');
    script.async = true;
    document.head.appendChild(script);

    // Cleanup (opcional, pero buena práctica)
    return () => {
      const existingScript = document.querySelector('script[data-api-key]');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, []); // Solo ejecutar una vez al montar

  return (
    <div className="App">
      <header>
        <h1>Mi App React</h1>
        <nav>
          <a href="/">Inicio</a>
          <a href="/about">Acerca</a>
          <a href="/contact">Contacto</a>
        </nav>
      </header>

      <main>
        <section>
          <h2>Bienvenido</h2>
          <p>Este es un ejemplo de React con WP Conversion Monitor.</p>
          <button onClick={() => alert('Click tracked!')}>
            Botón de Ejemplo
          </button>
        </section>

        <section style={{ height: '2000px', padding: '20px' }}>
          <p>Desplázate para ver el tracking de scroll funcionando.</p>
          <p style={{ marginTop: '500px' }}>25% de scroll</p>
          <p style={{ marginTop: '500px' }}>50% de scroll</p>
          <p style={{ marginTop: '500px' }}>75% de scroll</p>
          <p style={{ marginTop: '500px' }}>100% de scroll</p>
        </section>

        <section>
          <h2>Formulario de Contacto</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            alert('Formulario enviado (tracking funcionando)');
          }}>
            <div>
              <label htmlFor="name">Nombre:</label>
              <input type="text" id="name" name="name" required />
            </div>
            <div>
              <label htmlFor="email">Email:</label>
              <input type="email" id="email" name="email" required />
            </div>
            <div>
              <label htmlFor="message">Mensaje:</label>
              <textarea id="message" name="message" rows="4" required />
            </div>
            <button type="submit">Enviar</button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default App;
