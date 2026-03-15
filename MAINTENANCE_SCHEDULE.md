# 📅 Programación de Mantenimiento Semanal

## Configuración Automática

### Opción 1: Cron Job (Linux/Mac)

Para programar el mantenimiento automático todos los domingos a las 12:00 AM:

```bash
# Editar crontab
crontab -e

# Agregar esta línea:
0 0 * * 0 cd /ruta/a/astruxo && bash scripts/weekly-maintenance.sh

# Guardar y salir
```

**Explicación del cron:**
- `0` - Minuto (12:00)
- `0` - Hora (medianoche)
- `*` - Día del mes (cualquiera)
- `*` - Mes (cualquiera)
- `0` - Día de la semana (0 = Domingo)

### Opción 2: Ejecución Manual

Si prefieres ejecutar el mantenimiento manualmente:

```bash
# Dar permisos de ejecución al script
chmod +x scripts/weekly-maintenance.sh

# Ejecutar manualmente
bash scripts/weekly-maintenance.sh
```

### Opción 3: GitHub Actions (Recomendado para proyectos en GitHub)

Crear archivo `.github/workflows/weekly-maintenance.yml`:

```yaml
name: Weekly Maintenance

on:
  schedule:
    # Ejecutar todos los domingos a las 12:00 AM UTC
    - cron: '0 0 * * 0'
  workflow_dispatch: # Permitir ejecución manual

jobs:
  maintenance:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run maintenance script
        run: bash scripts/weekly-maintenance.sh
      
      - name: Upload maintenance logs
        uses: actions/upload-artifact@v3
        with:
          name: maintenance-logs
          path: maintenance-logs/
          retention-days: 90
      
      - name: Notify on failure
        if: failure()
        run: echo "⚠️ Maintenance check failed! Review the logs."
```

---

## 📊 Logs de Mantenimiento

Los logs se guardan automáticamente en:
```
maintenance-logs/weekly-YYYY-MM-DD.log
```

### Estructura de Logs

Cada log contiene:
1. ✅ Verificación de estado del sistema
2. 🔍 Análisis de TypeScript
3. 🧹 Análisis de linting
4. 📦 Verificación de dependencias
5. 🔒 Auditoría de seguridad
6. 📏 Análisis de tamaño del proyecto
7. 🐛 Verificación de console.logs
8. 🏗️ Verificación de build
9. 📋 Resumen y recomendaciones

### Ejemplo de Output

```
🔍 ============================================
🔍 astruXo - Mantenimiento Semanal
🔍 Fecha: Sun Mar 16 00:00:00 EST 2026
🔍 ============================================

📊 1. VERIFICACIÓN DE ESTADO DEL SISTEMA
----------------------------------------
✅ Node.js: v22.22.0
✅ npm: 10.9.2

🔍 2. ANÁLISIS DE TYPESCRIPT
----------------------------------------
⚠️  Encontrados 37 errores de TypeScript

🧹 3. ANÁLISIS DE LINTING
----------------------------------------
✅ No hay errores de linting
⚠️  Encontradas 12 advertencias de linting

📦 4. VERIFICACIÓN DE DEPENDENCIAS
----------------------------------------
⚠️  Encontradas 19 dependencias desactualizadas

🔒 5. AUDITORÍA DE SEGURIDAD
----------------------------------------
✅ No se encontraron vulnerabilidades

📏 6. ANÁLISIS DE TAMAÑO DEL PROYECTO
----------------------------------------
📦 node_modules: 450M
📦 dist: 15M
📦 public: 8M
📄 Archivos TypeScript: 229

🐛 7. VERIFICACIÓN DE CONSOLE.LOGS
----------------------------------------
⚠️  Encontrados console.logs en 8 archivos

🏗️ 8. VERIFICACIÓN DE BUILD
----------------------------------------
✅ Build exitoso

📋 9. RESUMEN Y RECOMENDACIONES
========================================

🎯 SCORE DE SALUD DEL SISTEMA: 75/100
⚠️  Estado: BUENO (requiere atención menor)

📝 RECOMENDACIONES:
  • Corregir 37 errores de TypeScript
  • Revisar y actualizar dependencias desactualizadas
  • Considerar eliminar console.logs de producción

✅ Mantenimiento semanal completado
📄 Log guardado en: maintenance-logs/weekly-2026-03-16.log
🕐 Próxima ejecución: Próximo domingo a las 12:00 AM
```

---

## 🔔 Notificaciones

### Configurar Notificaciones por Email

Agregar al final del script `weekly-maintenance.sh`:

```bash
# Enviar email si el health score es bajo
if [ $HEALTH_SCORE -lt 70 ]; then
    echo "⚠️ astruXo Health Score: $HEALTH_SCORE/100" | \
    mail -s "astruXo Maintenance Alert" admin@astruxo.net
fi
```

### Configurar Notificaciones por Slack

```bash
# Webhook de Slack
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Enviar notificación
curl -X POST -H 'Content-type: application/json' \
--data "{\"text\":\"🔍 astruXo Maintenance: Health Score $HEALTH_SCORE/100\"}" \
$SLACK_WEBHOOK
```

---

## 📈 Métricas Históricas

### Tracking de Health Score

Crear archivo `maintenance-logs/history.csv` para tracking:

```csv
Date,Health_Score,TypeScript_Errors,Lint_Errors,Vulnerabilities,Outdated_Deps
2026-03-10,85,37,0,0,19
2026-03-17,90,0,0,0,15
2026-03-24,95,0,0,0,8
```

### Visualización de Tendencias

Usar herramientas como:
- **Grafana** - Para dashboards en tiempo real
- **Google Sheets** - Para análisis manual
- **Excel** - Para reportes semanales

---

## 🛠️ Mantenimiento Manual

### Checklist Rápido (5 minutos)

```bash
# 1. Verificar TypeScript
npm run type-check

# 2. Verificar Linting
npm run lint

# 3. Verificar Seguridad
npm audit

# 4. Verificar Build
npm run build

# 5. Ver dependencias desactualizadas
npm outdated
```

### Acciones Correctivas Comunes

```bash
# Corregir linting automáticamente
npm run lint:fix

# Actualizar dependencias menores
npm update

# Corregir vulnerabilidades
npm audit fix

# Limpiar y reinstalar
npm run clean
npm install
```

---

## 📞 Contacto y Soporte

**Responsable de Mantenimiento:** [Tu Nombre]
**Email:** admin@astruxo.net
**Horario de Revisión:** Domingos 12:00 AM - 2:00 AM EST

**En caso de emergencia:**
- Health Score < 50: Atención inmediata
- Build fallido: Revisar logs y corregir
- Vulnerabilidades críticas: Actualizar inmediatamente

---

## 📝 Historial de Cambios

### 2026-03-10
- ✅ Creado sistema de mantenimiento semanal
- ✅ Implementado script automatizado
- ✅ Configurado logging estructurado
- ✅ Definido health score system

### Próximas Mejoras
- [ ] Integración con sistema de alertas
- [ ] Dashboard de métricas en tiempo real
- [ ] Automatización de correcciones menores
- [ ] Backup automático de base de datos

---

**Última actualización:** 10 de Marzo, 2026
**Próxima revisión:** 16 de Marzo, 2026 - 12:00 AM EST
