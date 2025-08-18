# 🔥 Guía de Migración a Stripe Connect - Hoodfy

Esta guía te ayudará a migrar tu proyecto Hoodfy de la cuenta de Stripe actual a la nueva cuenta C-Corp de Stripe Atlas e implementar Stripe Connect para pagos directos a creadores.

## 📋 **Paso 1: Configurar Nueva Cuenta de Stripe Atlas**

### **1.1 Crear Productos y Precios en Stripe Dashboard (Nueva Cuenta)**

1. **Acceder a tu nueva cuenta de Stripe Atlas**
   - Ve a [https://dashboard.stripe.com](https://dashboard.stripe.com)
   - Inicia sesión con tu cuenta C-Corp
   - **¡IMPORTANTE!** Asegúrate de estar en modo **"Live"** (no "Test")

2. **Crear Productos para cada precio:**
   - $1/mes, $3/mes, $5/mes, $7/mes, $10/mes
   - $15/mes, $20/mes, $25/mes, $50/mes, $100/mes

3. **Crear Precios para cada producto:**
   - Tipo: Recurring
   - Intervalo: Monthly
   - Moneda: USD
   - **Guardar los Price IDs** - los necesitarás para actualizar `stripePrices.js`

### **1.2 Configurar Webhook**

1. **Crear Webhook Endpoint:**
   - Ve a **Developers** → **Webhooks**
   - Haz clic en **"Add endpoint"**
   - URL: `https://api.qahood.com/api/stripe/webhook`
   - Descripción: `Hoodfy Payments Webhook`

2. **Seleccionar Eventos:**
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `account.updated` (para Stripe Connect)

3. **Obtener Webhook Secret:**
   - Después de crear el webhook, haz clic en él
   - En **"Signing secret"**, haz clic en **"Reveal"**
   - Copia el secret (comienza con `whsec_...`)

### **1.3 Obtener API Keys**

1. **Ve a Developers** → **API keys**
2. **Publishable key** (comienza con `pk_live_...`)
3. **Secret key** (comienza con `sk_live_...`)

## 🔧 **Paso 2: Configurar Variables de Entorno**

### **2.1 En AWS EC2 (Backend) - archivo .env**

```env
# Stripe Configuration (Nueva Cuenta C-Corp)
STRIPE_SECRET_KEY=sk_live_... # Tu nueva Secret Key
STRIPE_WEBHOOK_SECRET=whsec_... # Tu nuevo Webhook Secret
STRIPE_WEBHOOK_SECRET_HOODFY=whsec_... # Mismo webhook secret para hoodfy.com

# Stripe Connect Configuration
STRIPE_CONNECT_CLIENT_ID=pk_live_... # Tu Publishable Key
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_... # Webhook secret para Connect

# Platform Fee (12% plataforma, 88% creador)
STRIPE_PLATFORM_FEE_PERCENTAGE=12

# URLs
FRONTEND_URL=https://www.qahood.com
FRONTEND_URL_HOODFY=https://www.hoodfy.com
```

### **2.2 En AWS Amplify (Frontend) - Variables de Entorno**

```env
# Stripe Frontend (Nueva Cuenta C-Corp)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... # Tu nueva Publishable Key

# API Backend
NEXT_PUBLIC_API_URL=https://api.qahood.com
```

## 🚀 **Paso 3: Actualizar Precios de Stripe**

### **3.1 Actualizar archivo `backend/config/stripePrices.js`**

Reemplaza los Price IDs antiguos con los nuevos de tu cuenta C-Corp:

```javascript
module.exports = {
  1: 'price_NUEVO_ID_1',      // $1/mes
  3: 'price_NUEVO_ID_3',      // $3/mes
  5: 'price_NUEVO_ID_5',      // $5/mes
  7: 'price_NUEVO_ID_7',      // $7/mes
  10: 'price_NUEVO_ID_10',    // $10/mes
  15: 'price_NUEVO_ID_15',    // $15/mes
  20: 'price_NUEVO_ID_20',    // $20/mes
  25: 'price_NUEVO_ID_25',    // $25/mes
  50: 'price_NUEVO_ID_50',    # $50/mes
  100: 'price_NUEVO_ID_100',  # $100/mes
};
```

## 🔄 **Paso 4: Ejecutar Migración de Base de Datos**

### **4.1 Ejecutar Script de Migración**

```bash
# En el servidor EC2
cd backend
npm run migrate:stripe-connect
```

### **4.2 Verificar Estado de Migración**

```bash
npm run check:migration
```

## 🎯 **Paso 5: Probar Stripe Connect**

### **5.1 Crear Cuenta de Stripe Connect**

1. **Ir a una comunidad que hayas creado**
2. **Hacer clic en "Configurar Pagos"**
3. **Completar onboarding de Stripe Connect**

### **5.2 Verificar Split Payments**

1. **Crear una suscripción de prueba**
2. **Verificar que se cree el registro de Payout**
3. **Confirmar que el 88% va al creador y 12% a la plataforma**

## 📊 **Nuevas Funcionalidades Implementadas**

### **✅ Stripe Connect**
- Cuentas de creadores para recibir pagos directamente
- Onboarding automático con Stripe
- Dashboard de Stripe para creadores

### **✅ Split Payments Automáticos**
- **88%** para el creador de la comunidad
- **12%** para la plataforma Hoodfy
- Transferencias automáticas a cuentas de creadores

### **✅ Tracking de Ganancias**
- Modelo `Payout` para tracking de pagos
- Estadísticas de ganancias por comunidad
- Historial de payouts para creadores

### **✅ Nuevos Endpoints API**
- `/api/stripe-connect/accounts` - Crear cuentas de creadores
- `/api/stripe-connect/accounts/:id/status` - Estado de cuenta
- `/api/stripe-connect/accounts/:id/onboarding` - Link de onboarding
- `/api/stripe-connect/accounts/:id/login` - Link de login
- `/api/stripe-connect/communities/:id/payouts` - Historial de payouts
- `/api/stripe-connect/earnings/overview` - Resumen de ganancias

## 🔍 **Verificación Post-Migración**

### **Checklist de Verificación:**

- [ ] ✅ Nueva cuenta de Stripe configurada
- [ ] ✅ Nuevos Price IDs actualizados
- [ ] ✅ Webhook configurado y funcionando
- [ ] ✅ Variables de entorno actualizadas
- [ ] ✅ Migración de BD ejecutada
- [ ] ✅ Stripe Connect funcionando
- [ ] ✅ Split payments funcionando
- [ ] ✅ Payouts automáticos funcionando

### **Comandos de Verificación:**

```bash
# Verificar estado de migración
npm run check:migration

# Ver logs del backend
pm2 logs

# Verificar webhook en Stripe Dashboard
# Deberías ver eventos llegando
```

## 🚨 **Troubleshooting**

### **Error: "Stripe no está configurado"**
- ✅ Verificar que `STRIPE_SECRET_KEY` esté en `.env`
- ✅ Reiniciar servidor backend: `pm2 restart all`

### **Error en Webhook**
- ✅ Verificar URL del webhook en Stripe Dashboard
- ✅ Confirmar que `STRIPE_WEBHOOK_SECRET` esté configurado
- ✅ Verificar que los eventos estén seleccionados

### **Error: "Price ID not found"**
- ✅ Verificar que los Price IDs en `stripePrices.js` sean de Live mode
- ✅ Confirmar que los productos existan en Stripe Dashboard

### **Error en Stripe Connect**
- ✅ Verificar que `STRIPE_CONNECT_CLIENT_ID` esté configurado
- ✅ Confirmar que la cuenta de Stripe esté en modo Live
- ✅ Verificar que la comunidad tenga precio configurado

## 💡 **Próximos Pasos**

### **Después de la migración:**

1. **Configurar facturación** en Stripe para manejar impuestos
2. **Configurar emails** de recibos en Stripe
3. **Implementar gestión avanzada** de suscripciones
4. **Configurar payouts automáticos** para creadores
5. **Implementar analytics** detallados de ganancias

### **Monitoreo:**

- **Logs del backend** para errores de Stripe
- **Dashboard de Stripe** para eventos de webhook
- **Estadísticas de payouts** en la aplicación
- **Estado de cuentas** de creadores

## 📞 **Soporte**

Si tienes problemas durante la migración:

1. **Revisar logs del backend** para errores específicos
2. **Verificar configuración** en Stripe Dashboard
3. **Confirmar variables de entorno** están correctas
4. **Ejecutar comandos de verificación** para diagnosticar

---

🎉 **¡Una vez completada la migración, tendrás un sistema de pagos completamente funcional con Stripe Connect y split payments automáticos!**
