# 💰 Configuración de Fees Dinámicos - Stripe Connect

## 🎯 **Resumen**

Hemos implementado un **sistema inteligente** que ajusta automáticamente los porcentajes de comisión según si estás en el primer año de Stripe Atlas o no.

## 📅 **Configuración de Fechas**

### **1. Variable de Entorno Requerida:**

```bash
# En tu archivo .env
STRIPE_ATLAS_CREATION_DATE=2025-01-01
```

**⚠️ IMPORTANTE:** Ajusta esta fecha a la fecha real cuando creaste tu cuenta con Stripe Atlas.

## 🔄 **Cómo Funciona el Sistema**

### **Primer Año (Sin Fees de Stripe):**
- **Plataforma Hoodfy**: 12%
- **Creador**: 88%
- **Stripe**: $0 (gratis el primer año)

### **Después del Primer Año (Con Fees de Stripe):**
- **Plataforma Hoodfy**: 14.9% (12% + 2.9%)
- **Creador**: 85.1%
- **Stripe**: 2.9% + $0.30 por transacción

## 📊 **Ejemplos de Cálculo**

### **Suscripción de $10.00:**

#### **Primer Año:**
```
Total: $10.00
├── Stripe: $0.00 (gratis)
├── Plataforma: $1.20 (12%)
└── Creador: $8.80 (88%)
```

#### **Después del Primer Año:**
```
Total: $10.00
├── Stripe: $0.29 (2.9% + $0.30)
├── Plataforma: $1.49 (14.9%)
└── Creador: $8.51 (85.1%)
```

## 🔧 **Configuración Automática**

### **El sistema detecta automáticamente:**
1. **Fecha actual** vs **fecha de creación de Atlas**
2. **Calcula dinámicamente** los porcentajes
3. **Ajusta automáticamente** sin intervención manual

### **Funciones disponibles:**
```javascript
// Obtener fee de plataforma actual
const platformFee = getPlatformFeePercentage();

// Obtener fee del creador actual
const creatorFee = getCreatorFeePercentageValue();

// Calcular split de pagos
const split = calculatePaymentSplit(amount);
```

## 🚨 **Cuándo Ajustar la Fecha**

### **1. Al crear la cuenta:**
```bash
STRIPE_ATLAS_CREATION_DATE=2025-08-23  # Fecha de hoy
```

### **2. Al terminar el primer año:**
```bash
# NO cambiar nada - el sistema se ajusta automáticamente
# Los porcentajes cambiarán de 12%/88% a 14.9%/85.1%
```

## 📋 **Verificación de Configuración**

### **Comando para verificar:**
```bash
cd backend
node -e "
const config = require('./config/stripeConnect');
console.log('Fecha Atlas:', config.STRIPE_CONNECT_CONFIG.ATLAS_CREATION_DATE);
console.log('Fee Plataforma Actual:', config.getPlatformFeePercentage() + '%');
console.log('Fee Creador Actual:', config.getCreatorFeePercentageValue() + '%');
"
```

## 💡 **Ventajas del Sistema**

1. **✅ Automático**: No necesitas cambiar nada manualmente
2. **✅ Transparente**: Los creadores ven los porcentajes reales
3. **✅ Flexible**: Se adapta a cambios futuros de Stripe
4. **✅ Predecible**: Sabes exactamente cuándo cambiarán los porcentajes

## 🔍 **Monitoreo**

### **Logs del sistema:**
```bash
# Ver logs del backend
pm2 logs hoodfy-backend

# Buscar mensajes de fees
grep "Fee" logs/backend.log
```

### **Dashboard de Stripe:**
- **No necesitas cambiar nada** en el dashboard de Stripe
- Los porcentajes se manejan **internamente** en tu aplicación
- Stripe solo cobra sus fees estándar (2.9% + $0.30)

## 🎉 **Resumen**

**Con este sistema:**
- ✅ **No tocas nada** en Stripe Dashboard
- ✅ **Los porcentajes se ajustan automáticamente**
- ✅ **Los creadores siempre reciben el porcentaje correcto**
- ✅ **Tu plataforma mantiene la rentabilidad esperada**

**Solo configura la fecha de creación de Atlas y ¡listo!** 🚀
