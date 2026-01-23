# 🚀 Opción Alternativa: Repositorio Separado

Si prefieres tener un repositorio completamente separado para el tracker, sigue estos pasos:

---

## 📋 Pasos

### Paso 1: Crear Repositorio en GitHub

1. Ve a: https://github.com/new
2. **Repository name**: `conversioniq-universal`
3. **Description**: `ConversionIQ Universal Tracking Script`
4. **Visibility**: Public
5. **NO** inicialices con README, .gitignore, o license
6. Click **"Create repository"**

### Paso 2: Copiar Archivos a Ubicación Temporal

```bash
# Crear carpeta temporal
mkdir -p /tmp/conversioniq-universal
cd /tmp/conversioniq-universal

# Copiar archivos necesarios
cp -r /home/levi/Documents/wp-conversion-monitor/universal/* .

# Inicializar git
git init
git branch -M main

# Agregar archivos
git add .

# Commit
git commit -m "Initial release: ConversionIQ Universal Tracker v1.0.0"

# Agregar remote
git remote add origin https://github.com/wilmerx5/conversioniq-universal.git

# Push
git push -u origin main
```

### Paso 3: Crear Release

1. Ve a: https://github.com/wilmerx5/conversioniq-universal
2. Click en **"Releases"** → **"Create a new release"**
3. **Tag**: `v1.0.0`
4. **Title**: `v1.0.0 - ConversionIQ Universal Tracker`
5. **Attach files**: Arrastra `tracker.js`
6. **Publish release**

### Paso 4: Actualizar Dashboard

Si usas esta opción, la URL del CDN será:
```
https://cdn.jsdelivr.net/gh/wilmerx5/conversioniq-universal@latest/tracker.js
```

Ya está configurada en `InstallPage.tsx` (línea 50).

---

## ⚠️ Mantener Sincronizado

Si haces cambios en `/home/levi/Documents/wp-conversion-monitor/universal/`, necesitas copiarlos al repositorio separado:

```bash
# Copiar cambios
cp /home/levi/Documents/wp-conversion-monitor/universal/tracker.js /tmp/conversioniq-universal/

# Commit y push
cd /tmp/conversioniq-universal
git add .
git commit -m "Update tracker to v1.1.0"
git push origin main

# Crear nuevo release
git tag v1.1.0
git push origin v1.1.0
```

---

## ✅ Recomendación

**Usa la Opción del Monorepo** (DEPLOY_MONOREPO.md) - Es más simple y no necesitas mantener dos repositorios sincronizados.
