#!/bin/bash
# Script para hacer deploy del tracker a GitHub Releases

echo "🚀 Deploy del ConversionIQ Universal Tracker"
echo ""

# 1. Ir a la carpeta universal
cd "$(dirname "$0")" || exit

# 2. Verificar que estamos en la carpeta correcta
if [ ! -f "tracker.js" ]; then
    echo "❌ Error: No se encontró tracker.js"
    echo "   Asegúrate de ejecutar este script desde la carpeta universal/"
    exit 1
fi

echo "✅ Encontrado tracker.js"

# 3. Inicializar git si no está inicializado
if [ ! -d ".git" ]; then
    echo "📦 Inicializando repositorio git..."
    git init
    git branch -M main
fi

# 4. Agregar todos los archivos
echo "📝 Agregando archivos..."
git add .

# 5. Commit inicial
echo "💾 Creando commit..."
git commit -m "Initial release: ConversionIQ Universal Tracker v1.0.0" || echo "⚠️  Ya hay cambios commiteados"

# 6. Verificar si el remote existe
if ! git remote get-url origin &> /dev/null; then
    echo "🔗 Agregando remote de GitHub..."
    git remote add origin https://github.com/wilmerx5/conversioniq-universal.git
else
    echo "✅ Remote ya configurado"
    git remote set-url origin https://github.com/wilmerx5/conversioniq-universal.git
fi

# 7. Push a GitHub
echo "⬆️  Subiendo a GitHub..."
git push -u origin main || {
    echo ""
    echo "⚠️  Si es la primera vez, puede que necesites crear el repositorio en GitHub primero:"
    echo "   https://github.com/new"
    echo "   Nombre: conversioniq-universal"
    echo "   Público"
    echo ""
    exit 1
}

echo ""
echo "✅ Código subido exitosamente!"
echo ""
echo "📦 Próximo paso: Crear el Release"
echo ""
echo "Opción A - Manual (Más fácil):"
echo "1. Ve a: https://github.com/wilmerx5/conversioniq-universal"
echo "2. Click en 'Releases' → 'Create a new release'"
echo "3. Tag: v1.0.0"
echo "4. Title: v1.0.0 - ConversionIQ Universal Tracker"
echo "5. Arrastra tracker.js como archivo adjunto"
echo "6. Click 'Publish release'"
echo ""
echo "Opción B - Automático (Con tags):"
echo "  git tag v1.0.0"
echo "  git push origin v1.0.0"
echo ""
echo "🌐 URL del CDN después del release:"
echo "   https://cdn.jsdelivr.net/gh/wilmerx5/conversioniq-universal@latest/tracker.js"
echo ""
