# 🔥 Guía de Configuración de Stripe - Qahood

Esta guía te ayudará a completar la configuración de Stripe para habilitar los pagos en tu aplicación.

## 📋 Variables de Entorno Requeridas

### **Backend (.env)**
Agrega estas variables a tu archivo `.env` del backend:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_... # Tu Stripe Secret Key (LIVE para producción)
STRIPE_WEBHOOK_SECRET=whsec_... # Se obtiene después de configurar el webhook
FRONTEND_URL=https://qahood.com # URL de tu frontend en producción

# Existing variables...
MONGODB_URI=mongodb://...
JWT_SECRET=...
# etc.
```

### **Frontend (Amplify Environment Variables)**
En AWS Amplify, agrega estas variables de entorno:

```bash
# Stripe Frontend
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... # Tu Stripe Publishable Key (LIVE)

# API Backend
NEXT_PUBLIC_API_URL=https://api.qahood.com

# Existing variables...
```

## 🔑 Obtener las Keys de Stripe

### **1. Acceder al Dashboard de Stripe**
1. Ve a [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Inicia sesión en tu cuenta
3. **¡IMPORTANTE!** Asegúrate de estar en modo **"Live"** (no "Test") en la esquina superior izquierda

### **2. Obtener API Keys**
1. Ve a **Developers** → **API keys**
2. Copia tu **"Publishable key"** (comienza con `pk_live_...`)
3. Haz clic en **"Reveal"** en la **"Secret key"** y cópiala (comienza con `sk_live_...`)

⚠️ **NUNCA** compartas tu Secret Key públicamente.

## 🔗 Configurar Webhook

### **1. Crear Webhook Endpoint**
1. En Stripe Dashboard, ve a **Developers** → **Webhooks**
2. Haz clic en **"Add endpoint"**
3. URL del endpoint: `https://api.qahood.com/api/stripe/webhook`
4. Descripción: `Qahood Payments Webhook`

### **2. Seleccionar Eventos**
Marca estos eventos que tu aplicación necesita:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

### **3. Obtener Webhook Secret**
1. Después de crear el webhook, haz clic en él
2. En la sección **"Signing secret"**, haz clic en **"Reveal"**
3. Copia el secret (comienza con `whsec_...`)
4. Agrégalo a tu `.env` como `STRIPE_WEBHOOK_SECRET`

## 🚀 Configuración de Precios

### **Precios Predefinidos**
Tu aplicación ya tiene estos precios configurados:

| Precio | Price ID |
|--------|----------|
| $1/mes | `price_1RgtxfQUJIiEzpqAMBbszFOi` |
| $3/mes | `price_1RgtzrQUJIiEzpqAK2EhWQgm` |
| $5/mes | `price_1Rgu00QUJIiEzpqAWsBcqkCR` |
| $7/mes | `price_1Rgu07QUJIiEzpqAK8bP6v6i` |
| $10/mes | `price_1Rgu0LQUJIiEzpqAo64ycGND` |
| $15/mes | `price_1Rgu0TQUJIiEzpqAYNMDauNP` |
| $20/mes | `price_1Rgu0aQUJIiEzpqAlvTbF9vi` |
| $25/mes | `price_1Rgu0nQUJIiEzpqAUsEuvUXD` |
| $50/mes | `price_1Rgu0tQUJIiEzpqANcva8DeM` |
| $100/mes | `price_1Rgu19QUJIiEzpqAGzzClTwi` |

⚠️ **NOTA**: Estos Price IDs son de tu entorno de **prueba**. Para producción, necesitarás crear nuevos productos y precios en el modo **Live** de Stripe.

### **Crear Productos en Live Mode**
1. Ve a **Products** en tu Stripe Dashboard (modo Live)
2. Crea productos para cada precio que ofrecerás
3. Actualiza los Price IDs en `backend/config/stripePrices.js`

## 🔧 Configuración de Amplify

### **1. Variables de Entorno**
En tu console de AWS Amplify:
1. Ve a tu app
2. **App settings** → **Environment variables**
3. Agrega las variables del frontend listadas arriba

### **2. Rebuild**
Después de agregar las variables:
1. Ve a la pestaña **"Hosting"**
2. Haz clic en **"Redeploy this version"** o espera el próximo deployment

## ✅ Checklist de Configuración

### **Antes de ir a producción:**
- [ ] ✅ Ya tienes - Stripe Secret Key configurada en backend
- [ ] ✅ Ya tienes - Stripe Publishable Key configurada en Amplify
- [ ] ⚠️ **PENDIENTE** - Webhook configurado y secret agregado
- [ ] ⚠️ **PENDIENTE** - FRONTEND_URL configurada en backend
- [ ] ⚠️ **PENDIENTE** - Productos creados en Stripe Live mode
- [ ] ⚠️ **PENDIENTE** - Price IDs actualizados para producción
- [ ] ⚠️ **PENDIENTE** - Prueba de pago de extremo a extremo

### **Test de Funcionalidad:**
1. [ ] Usuario puede ver modal de suscripción
2. [ ] Se redirige correctamente a Stripe Checkout  
3. [ ] Pago exitoso redirige a `/success`
4. [ ] Pago cancelado redirige a `/cancel`
5. [ ] Webhook procesa pago y activa suscripción
6. [ ] Usuario aparece como suscrito en la comunidad
7. [ ] Usuario puede acceder al chat de la comunidad

## 🚨 Troubleshooting

### **Error: "Stripe no está configurado"**
- ✅ Verifica que `STRIPE_SECRET_KEY` esté en el `.env` del backend
- ✅ Reinicia el servidor backend después de agregar la variable

### **Error en Webhook**
- ✅ Verifica que la URL del webhook sea correcta
- ✅ Confirma que `STRIPE_WEBHOOK_SECRET` esté configurado
- ✅ Verifica que los eventos estén seleccionados correctamente

### **Error: "Price ID not found"**
- ✅ Verifica que los Price IDs en `stripePrices.js` sean de Live mode
- ✅ Confirma que los productos existan en Stripe Dashboard

## 💡 Próximos Pasos

Una vez configurado todo:
1. **Prueba con tarjeta real** (usa cantidades pequeñas como $1)
2. **Configura facturación** en Stripe para manejar impuestos
3. **Configura emails** de recibos en Stripe
4. **Implementa gestión de suscripciones** (cancelar, actualizar, etc.)

## 📞 Soporte

Si tienes problemas con esta configuración:
1. Revisa los logs del backend para errores específicos
2. Usa las herramientas de desarrollo de Stripe
3. Verifica el webhook está recibiendo eventos en Stripe Dashboard

---

🎉 **¡Una vez configurado, tendrás un sistema de pagos completamente funcional!** 