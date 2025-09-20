# Scripts de MongoDB para Hoodfy

Este directorio contiene scripts para probar y analizar la base de datos de MongoDB.

## 🚀 Scripts Disponibles

### 1. `check-mongodb.js`
Verifica la conexión a MongoDB y muestra información de diagnóstico.

```bash
node scripts/check-mongodb.js
```

**Qué hace:**
- Verifica la conexión a MongoDB
- Muestra información de la conexión
- Prueba consultas simples
- Proporciona diagnósticos de errores

### 2. `reset-rate-limits.js`
Resetea todos los contadores de rate limiting en Redis.

```bash
node scripts/reset-rate-limits.js
```

**Qué hace:**
- Limpia contadores de uploads, API, auth, chat y webhooks
- Útil cuando se exceden límites durante desarrollo
- Requiere conexión a Redis

### 3. `test-deleted-filter.js`
Prueba el filtrado de comunidades eliminadas.

```bash
node scripts/test-deleted-filter.js
```

**Qué hace:**
- Cuenta comunidades por estado
- Prueba filtros de API pública
- Verifica que las eliminadas no aparecen
- Prueba búsqueda por ID

### 4. `simple-health-check.js`
Análisis simple de salud de comunidades.

```bash
node scripts/simple-health-check.js
```

**Qué hace:**
- Analiza distribución por estado
- Detecta comunidades de prueba
- Identifica comunidades inactivas
- Proporciona recomendaciones

### 5. `community-health-check.js`
Análisis completo de salud de comunidades (requiere más tiempo).

```bash
node scripts/community-health-check.js
```

**Qué hace:**
- Análisis detallado de cada comunidad
- Estadísticas de ingresos
- Recomendaciones específicas
- Información del creador

### 5. `run-all-tests.js`
Ejecuta todos los tests en secuencia.

```bash
node scripts/run-all-tests.js
```

## 🔧 Solución de Problemas

### Error: "Operation buffering timed out"

**Causa:** Timeout de conexión a MongoDB

**Soluciones:**
1. Verificar que MongoDB esté ejecutándose:
   ```bash
   sudo systemctl status mongod
   sudo systemctl start mongod
   ```

2. Verificar la URL de conexión en `.env`:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/hoodfy
   ```

3. Verificar conectividad:
   ```bash
   telnet localhost 27017
   ```

### Error: "MongooseServerSelectionError"

**Causa:** No se puede conectar a MongoDB

**Soluciones:**
1. MongoDB no está ejecutándose
2. URL de conexión incorrecta
3. Problemas de red/firewall
4. Credenciales incorrectas

### Error: "MongooseTimeoutError"

**Causa:** Timeout de operación

**Soluciones:**
1. MongoDB está lento o sobrecargado
2. Problemas de red
3. Configuración de timeout muy baja

## 📊 Interpretación de Resultados

### Estados de Comunidades
- 🟢 **ACTIVE**: Comunidades activas y funcionando
- 🟡 **SUSPENDED**: Comunidades suspendidas (no aceptan nuevas suscripciones)
- 🟠 **ARCHIVED**: Comunidades archivadas (mantienen suscripciones existentes)
- ⚫ **DELETED**: Comunidades eliminadas (no visibles públicamente)

### Recomendaciones
- **Comunidades de prueba**: Archivar para producción
- **Comunidades inactivas**: Considerar archivar o eliminar
- **Comunidades con 0 miembros**: Evaluar si son necesarias

## 🚀 Uso Recomendado

1. **Primero**: Ejecutar `check-mongodb.js` para verificar la conexión
2. **Segundo**: Ejecutar `test-deleted-filter.js` para verificar filtros
3. **Tercero**: Ejecutar `simple-health-check.js` para análisis básico
4. **Opcional**: Ejecutar `community-health-check.js` para análisis completo

## 📝 Notas

- Los scripts usan timeouts de 30 segundos para conexión
- Los scripts se cierran automáticamente después de ejecutarse
- Los errores se muestran con sugerencias de solución
- Los scripts son seguros y no modifican datos
