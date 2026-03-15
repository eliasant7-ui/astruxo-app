#!/bin/bash

# ============================================================================
# astruXo - Script de Mantenimiento Semanal
# Ejecutar todos los domingos a las 12:00 AM
# ============================================================================

echo "🔍 ============================================"
echo "🔍 astruXo - Mantenimiento Semanal"
echo "🔍 Fecha: $(date)"
echo "🔍 ============================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directorio del proyecto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# Archivo de log
LOG_FILE="maintenance-logs/weekly-$(date +%Y-%m-%d).log"
mkdir -p maintenance-logs

# Función para logging
log() {
    echo -e "${2}$1${NC}" | tee -a "$LOG_FILE"
}

# ============================================================================
# 1. VERIFICACIÓN DE ESTADO DEL SISTEMA
# ============================================================================
log "\n📊 1. VERIFICACIÓN DE ESTADO DEL SISTEMA" "$BLUE"
log "----------------------------------------" "$BLUE"

# Verificar que Node.js está instalado
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log "✅ Node.js: $NODE_VERSION" "$GREEN"
else
    log "❌ Node.js no está instalado" "$RED"
    exit 1
fi

# Verificar que npm está instalado
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    log "✅ npm: $NPM_VERSION" "$GREEN"
else
    log "❌ npm no está instalado" "$RED"
    exit 1
fi

# ============================================================================
# 2. ANÁLISIS DE TYPESCRIPT
# ============================================================================
log "\n🔍 2. ANÁLISIS DE TYPESCRIPT" "$BLUE"
log "----------------------------------------" "$BLUE"

log "Ejecutando type-check..." "$YELLOW"
TYPE_CHECK_OUTPUT=$(npm run type-check 2>&1)
TYPE_CHECK_ERRORS=$(echo "$TYPE_CHECK_OUTPUT" | grep -c "error TS")

if [ "$TYPE_CHECK_ERRORS" -eq 0 ]; then
    log "✅ No hay errores de TypeScript" "$GREEN"
else
    log "⚠️  Encontrados $TYPE_CHECK_ERRORS errores de TypeScript" "$YELLOW"
    echo "$TYPE_CHECK_OUTPUT" >> "$LOG_FILE"
fi

# ============================================================================
# 3. ANÁLISIS DE LINTING
# ============================================================================
log "\n🧹 3. ANÁLISIS DE LINTING" "$BLUE"
log "----------------------------------------" "$BLUE"

log "Ejecutando ESLint..." "$YELLOW"
LINT_OUTPUT=$(npm run lint 2>&1)
LINT_ERRORS=$(echo "$LINT_OUTPUT" | grep -c "error")
LINT_WARNINGS=$(echo "$LINT_OUTPUT" | grep -c "warning")

if [ "$LINT_ERRORS" -eq 0 ]; then
    log "✅ No hay errores de linting" "$GREEN"
    if [ "$LINT_WARNINGS" -gt 0 ]; then
        log "⚠️  Encontradas $LINT_WARNINGS advertencias de linting" "$YELLOW"
    fi
else
    log "❌ Encontrados $LINT_ERRORS errores de linting" "$RED"
    echo "$LINT_OUTPUT" >> "$LOG_FILE"
fi

# ============================================================================
# 4. VERIFICACIÓN DE DEPENDENCIAS
# ============================================================================
log "\n📦 4. VERIFICACIÓN DE DEPENDENCIAS" "$BLUE"
log "----------------------------------------" "$BLUE"

log "Verificando dependencias desactualizadas..." "$YELLOW"
OUTDATED_OUTPUT=$(npm outdated 2>&1)
OUTDATED_COUNT=$(echo "$OUTDATED_OUTPUT" | tail -n +2 | wc -l)

if [ "$OUTDATED_COUNT" -eq 0 ]; then
    log "✅ Todas las dependencias están actualizadas" "$GREEN"
else
    log "⚠️  Encontradas $OUTDATED_COUNT dependencias desactualizadas" "$YELLOW"
    echo "$OUTDATED_OUTPUT" >> "$LOG_FILE"
fi

# ============================================================================
# 5. AUDITORÍA DE SEGURIDAD
# ============================================================================
log "\n🔒 5. AUDITORÍA DE SEGURIDAD" "$BLUE"
log "----------------------------------------" "$BLUE"

log "Ejecutando npm audit..." "$YELLOW"
AUDIT_OUTPUT=$(npm audit --json 2>&1)
VULNERABILITIES=$(echo "$AUDIT_OUTPUT" | grep -o '"total":[0-9]*' | head -1 | grep -o '[0-9]*')

if [ "$VULNERABILITIES" = "0" ] || [ -z "$VULNERABILITIES" ]; then
    log "✅ No se encontraron vulnerabilidades" "$GREEN"
else
    log "⚠️  Encontradas $VULNERABILITIES vulnerabilidades" "$YELLOW"
    npm audit >> "$LOG_FILE"
fi

# ============================================================================
# 6. ANÁLISIS DE TAMAÑO DEL PROYECTO
# ============================================================================
log "\n📏 6. ANÁLISIS DE TAMAÑO DEL PROYECTO" "$BLUE"
log "----------------------------------------" "$BLUE"

if [ -d "node_modules" ]; then
    NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1)
    log "📦 node_modules: $NODE_MODULES_SIZE" "$YELLOW"
fi

if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
    log "📦 dist: $DIST_SIZE" "$YELLOW"
fi

if [ -d "public" ]; then
    PUBLIC_SIZE=$(du -sh public 2>/dev/null | cut -f1)
    log "📦 public: $PUBLIC_SIZE" "$YELLOW"
fi

# Contar archivos TypeScript
TS_FILES=$(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)
log "📄 Archivos TypeScript: $TS_FILES" "$YELLOW"

# ============================================================================
# 7. VERIFICACIÓN DE CONSOLE.LOGS
# ============================================================================
log "\n🐛 7. VERIFICACIÓN DE CONSOLE.LOGS" "$BLUE"
log "----------------------------------------" "$BLUE"

CONSOLE_LOGS=$(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs grep -l "console\." 2>/dev/null | wc -l)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    log "⚠️  Encontrados console.logs en $CONSOLE_LOGS archivos" "$YELLOW"
else
    log "✅ No se encontraron console.logs en el código" "$GREEN"
fi

# ============================================================================
# 8. VERIFICACIÓN DE BUILD
# ============================================================================
log "\n🏗️  8. VERIFICACIÓN DE BUILD" "$BLUE"
log "----------------------------------------" "$BLUE"

log "Intentando build del proyecto..." "$YELLOW"
BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    log "✅ Build exitoso" "$GREEN"
else
    log "❌ Build falló" "$RED"
    echo "$BUILD_OUTPUT" >> "$LOG_FILE"
fi

# ============================================================================
# 9. RESUMEN Y RECOMENDACIONES
# ============================================================================
log "\n📋 9. RESUMEN Y RECOMENDACIONES" "$BLUE"
log "========================================" "$BLUE"

# Calcular score de salud
HEALTH_SCORE=100
[ "$TYPE_CHECK_ERRORS" -gt 0 ] && HEALTH_SCORE=$((HEALTH_SCORE - 20))
[ "$LINT_ERRORS" -gt 0 ] && HEALTH_SCORE=$((HEALTH_SCORE - 15))
[ "$VULNERABILITIES" -gt 0 ] && HEALTH_SCORE=$((HEALTH_SCORE - 25))
[ "$OUTDATED_COUNT" -gt 10 ] && HEALTH_SCORE=$((HEALTH_SCORE - 10))
[ "$BUILD_EXIT_CODE" -ne 0 ] && HEALTH_SCORE=$((HEALTH_SCORE - 30))

log "\n🎯 SCORE DE SALUD DEL SISTEMA: $HEALTH_SCORE/100" "$BLUE"

if [ $HEALTH_SCORE -ge 90 ]; then
    log "✅ Estado: EXCELENTE" "$GREEN"
elif [ $HEALTH_SCORE -ge 70 ]; then
    log "⚠️  Estado: BUENO (requiere atención menor)" "$YELLOW"
elif [ $HEALTH_SCORE -ge 50 ]; then
    log "⚠️  Estado: REGULAR (requiere atención)" "$YELLOW"
else
    log "❌ Estado: CRÍTICO (requiere atención inmediata)" "$RED"
fi

log "\n📝 RECOMENDACIONES:" "$BLUE"

if [ "$TYPE_CHECK_ERRORS" -gt 0 ]; then
    log "  • Corregir $TYPE_CHECK_ERRORS errores de TypeScript" "$YELLOW"
fi

if [ "$LINT_ERRORS" -gt 0 ]; then
    log "  • Ejecutar 'npm run lint:fix' para corregir errores de linting" "$YELLOW"
fi

if [ "$VULNERABILITIES" -gt 0 ]; then
    log "  • Ejecutar 'npm audit fix' para corregir vulnerabilidades" "$YELLOW"
fi

if [ "$OUTDATED_COUNT" -gt 10 ]; then
    log "  • Revisar y actualizar dependencias desactualizadas" "$YELLOW"
fi

if [ "$CONSOLE_LOGS" -gt 5 ]; then
    log "  • Considerar eliminar console.logs de producción" "$YELLOW"
fi

# ============================================================================
# 10. FINALIZACIÓN
# ============================================================================
log "\n✅ Mantenimiento semanal completado" "$GREEN"
log "📄 Log guardado en: $LOG_FILE" "$BLUE"
log "🕐 Próxima ejecución: Próximo domingo a las 12:00 AM" "$BLUE"
log "\n============================================\n" "$BLUE"

# Retornar código de salida basado en health score
if [ $HEALTH_SCORE -ge 70 ]; then
    exit 0
else
    exit 1
fi
