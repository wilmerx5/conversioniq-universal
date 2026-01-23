# 🚀 Guía Paso a Paso: Deploy del CDN

## 📋 Resumen

Vas a subir el tracker a GitHub Releases para que jsDelivr lo sirva automáticamente como CDN.

**Tu usuario de GitHub**: `wilmerx5`  
**URL del CDN**: `https://cdn.jsdelivr.net/gh/wilmerx5/conversioniq-universal@latest/tracker.js`

---

## 🎯 Opción 1: Repositorio Separado (Recomendado)

### Paso 1: Crear Repositorio en GitHub

1. Ve a https://github.com/new
2. **Repository name**: `conversioniq-universal`
3. **Description**: `ConversionIQ Universal Tracking Script`
4. **Visibility**: Public (necesario para jsDelivr)
5. **NO** inicialices con README, .gitignore, o license
6. Click **"Create repository"**

### Paso 2: Subir el Código

```bash
# 1. Ve a la carpeta universal
cd /home/levi/Documents/wp-conversion-monitor/universal

# 2. Inicializa git (si no está inicializado)
git init

# 3. Agrega todos los archivos
git add .

# 4. Commit inicial
git commit -m "Initial release: ConversionIQ Universal Tracker v1.0.0"

# 5. Agrega el remote de GitHub
git remote add origin https://github.com/wilmerx5/conversioniq-universal.git

# 6. Push a GitHub
git branch -M main
git push -u origin main
```

### Paso 3: Crear el Primer Release

**Opción A: Manual (Más Fácil)**

1. Ve a https://github.com/wilmerx5/conversioniq-universal
2. Click en **"Releases"** (lado derecho)
3. Click en **"Create a new release"**
4. **Choose a tag**: Escribe `v1.0.0` y presiona Enter (creará el tag)
5. **Release title**: `v1.0.0 - ConversionIQ Universal Tracker`
6. **Description**:
   ```
   ## ConversionIQ Universal Tracker v1.0.0
   
   First release of the universal tracking script.
   
   **CDN URL:**
   ```
   https://cdn.jsdelivr.net/gh/wilmerx5/conversioniq-universal@v1.0.0/tracker.js
   ```
   
   **Latest (always up to date):**
   ```
   https://cdn.jsdelivr.net/gh/wilmerx5/conversioniq-universal@latest/tracker.js
   ```
   ```
7. **Attach binaries**: Arrastra el archivo `tracker.js` desde tu carpeta `universal/`
8. Click **"Publish release"**

**Opción B: Automático (Con GitHub Actions)**

El workflow ya está configurado. Solo necesitas:

```bash
cd /home/levi/Documents/wp-conversion-monitor/universal

# 1. Asegúrate de estar en main y todo está commiteado
git checkout main
git add .
git commit -m "Prepare v1.0.0 release"

# 2. Crea el tag
git tag v1.0.0

# 3. Push el tag (esto activará el workflow automáticamente)
git push origin v1.0.0
git push origin main
```

El workflow automáticamente:
- ✅ Creará el release
- ✅ Subirá `tracker.js` como asset
- ✅ Generará las URLs del CDN

### Paso 4: Verificar que Funciona

Después de crear el release, espera 1-2 minutos y verifica:

```bash
# Verificar versión específica
curl https://cdn.jsdelivr.net/gh/wilmerx5/conversioniq-universal@v1.0.0/tracker.js

# Verificar latest
curl https://cdn.jsdelivr.net/gh/wilmerx5/conversioniq-universal@latest/tracker.js
```

Deberías ver el contenido del archivo `tracker.js`.

---

## 🎯 Opción 2: Usar el Repositorio Principal (Subcarpeta)

Si prefieres usar el mismo repositorio `wp-conversion-monitor`:

### Paso 1: Commit y Push de la carpeta universal

```bash
cd /home/levi/Documents/wp-conversion-monitor

# Agregar la carpeta universal
git add universal/
git commit -m "Add ConversionIQ universal tracker"
git push origin main
```

### Paso 2: Crear Release

1. Ve a https://github.com/wilmerx5/wp-conversion-monitor
2. Click en **"Releases"** → **"Create a new release"**
3. **Tag**: `v1.0.0`
4. **Title**: `v1.0.0 - ConversionIQ Universal Tracker`
5. **Description**: Similar a la Opción 1
6. **Attach files**: Sube `universal/tracker.js`
7. **Publish release**

### Paso 3: URL del CDN

La URL será diferente (incluye la subcarpeta):

```
https://cdn.jsdelivr.net/gh/wilmerx5/wp-conversion-monitor@v1.0.0/universal/tracker.js
```

**⚠️ IMPORTANTE**: Si usas esta opción, necesitas actualizar `InstallPage.tsx` para incluir `/universal/` en la ruta.

---

## ✅ Verificación Final

Después del deploy, verifica:

1. **CDN funciona**:
   ```bash
   curl https://cdn.jsdelivr.net/gh/wilmerx5/conversioniq-universal@latest/tracker.js | head -20
   ```

2. **Dashboard usa la URL correcta**:
   - Ve a tu dashboard → `/install`
   - Verifica que el código generado use la URL correcta

3. **Probar en un sitio**:
   - Copia el código de instalación
   - Pégalo en un HTML de prueba
   - Abre la consola del navegador (F12)
   - Verifica que no haya errores
   - Verifica que los eventos lleguen al dashboard

---

## 🔄 Actualizar el Workflow de GitHub Actions

Si usas la Opción 1 (repositorio separado), actualiza el workflow:

**Archivo**: `universal/.github/workflows/release.yml`

Reemplaza `TU-USUARIO` con `wilmerx5` en las líneas 33, 47, 48.

O déjalo como está y el workflow mostrará las URLs correctas en los logs.

---

## 📝 Notas Importantes

1. **jsDelivr Cache**: jsDelivr cachea los archivos por ~7 días. Si haces cambios, puede tardar en actualizarse. Usa versiones específicas para evitar problemas.

2. **Latest Tag**: `@latest` apunta a la última release publicada. Si creas un tag pero no publicas release, `@latest` no funcionará.

3. **Repositorio Público**: jsDelivr solo funciona con repositorios públicos. Asegúrate de que el repositorio sea público.

4. **Actualizaciones Futuras**: Para nuevas versiones:
   ```bash
   git tag v1.1.0
   git push origin v1.1.0
   ```

---

## 🆘 Troubleshooting

### El CDN no carga el archivo

- Verifica que el repositorio sea público
- Verifica que el release esté publicado (no draft)
- Espera 1-2 minutos después de crear el release
- Verifica la URL en el navegador directamente

### Error 404 en jsDelivr

- Verifica que el tag exista: `https://github.com/wilmerx5/conversioniq-universal/releases`
- Verifica que el archivo `tracker.js` esté en la raíz del repositorio
- Si usas subcarpeta, incluye la ruta: `/universal/tracker.js`

---

**¿Listo para hacer el deploy?** Sigue los pasos de la Opción 1 (recomendada) o la Opción 2 según prefieras.
