# 🚀 Deploy del CDN desde Monorepo

## ✅ Opción Recomendada: Usar el Mismo Repositorio

Como `universal/` es parte del monorepo `wp-conversion-monitor`, puedes usar el mismo repositorio y jsDelivr servirá el archivo desde la subcarpeta.

**URL del CDN:**
```
https://cdn.jsdelivr.net/gh/wilmerx5/wp-conversion-monitor@latest/universal/tracker.js
```

---

## 📋 Pasos para Deploy

### Paso 1: Commit y Push de la carpeta universal

```bash
cd /home/levi/Documents/wp-conversion-monitor

# Agregar la carpeta universal (si no está agregada)
git add universal/

# Commit
git commit -m "Add ConversionIQ universal tracker v1.0.0"

# Push a GitHub
git push origin main
```

### Paso 2: Crear Release en GitHub

1. Ve a: https://github.com/wilmerx5/wp-conversion-monitor
2. Click en **"Releases"** (lado derecho)
3. Click en **"Create a new release"**
4. **Choose a tag**: Escribe `v1.0.0` y presiona Enter
5. **Release title**: `v1.0.0 - ConversionIQ Universal Tracker`
6. **Description** (opcional):
   ```
   ## ConversionIQ Universal Tracker v1.0.0
   
   First release of the universal tracking script.
   
   **CDN URL:**
   ```
   https://cdn.jsdelivr.net/gh/wilmerx5/wp-conversion-monitor@v1.0.0/universal/tracker.js
   ```
   
   **Latest (always up to date):**
   ```
   https://cdn.jsdelivr.net/gh/wilmerx5/wp-conversion-monitor@latest/universal/tracker.js
   ```
   ```
7. **Attach binaries**: Arrastra el archivo `universal/tracker.js`
8. Click **"Publish release"**

### Paso 3: Verificar que Funciona

Espera 1-2 minutos y verifica:

```bash
curl https://cdn.jsdelivr.net/gh/wilmerx5/wp-conversion-monitor@latest/universal/tracker.js | head -20
```

Deberías ver el contenido del archivo JavaScript.

---

## ✅ Ventajas de esta Opción

- ✅ No necesitas crear un repositorio separado
- ✅ Todo está en un solo lugar
- ✅ Más fácil de mantener
- ✅ jsDelivr soporta subcarpetas perfectamente

---

## 🔄 Actualizaciones Futuras

Para nuevas versiones:

```bash
cd /home/levi/Documents/wp-conversion-monitor

# Hacer cambios en universal/tracker.js
# Actualizar versión en el archivo (línea 3)

# Commit
git add universal/tracker.js
git commit -m "Update tracker to v1.1.0"

# Push
git push origin main

# Crear nuevo release
git tag v1.1.0
git push origin v1.1.0
```

O crear el release manualmente desde GitHub.

---

## 🎯 Listo!

Tu dashboard ya está configurado para usar esta URL. Solo necesitas:
1. Commit y push de `universal/`
2. Crear el release en GitHub
3. ¡Listo! El CDN funcionará automáticamente.
