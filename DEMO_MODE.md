# 🎭 Modo Demo - Zentro Credit

## 📋 Descripción General

El **Modo Demo** de Zentro Credit permite a los usuarios explorar todas las funcionalidades de la plataforma sin necesidad de registrarse o proporcionar información real. Es ideal para:

- ✅ Probar la plataforma antes de crear una cuenta real
- ✅ Realizar demostraciones comerciales
- ✅ Testing y QA de funcionalidades
- ✅ Capacitación de usuarios nuevos
- ✅ Pruebas de concepto (PoC)

## 🚀 Acceso Rápido

### Para Usuarios Finales

1. Ve a la página de autenticación
2. Haz clic en el botón **"Demo Login"**
3. ¡Listo! Acceso instantáneo sin formularios

### Credenciales Demo

Si prefieres iniciar sesión manualmente:

```
📧 Email:    demo@zentrocredit.com
🔐 Password: Demo2024!Zentro
🔢 OTP:      123456 (cuando sea requerido)
```

## 🎯 Comportamiento Especial en Modo Demo

### Comparación: Modo Demo vs. Modo Real

| Característica | Modo Demo | Modo Real |
|----------------|-----------|-----------|
| **Email de Notificaciones** | ❌ No se envían (simulado) | ✅ Se envían vía Resend |
| **SMS/OTP** | ❌ No se envían (código hardcoded) | ✅ Se envían vía Twilio |
| **Código OTP** | `123456` (fijo) | 🔐 Aleatorio de 6 dígitos |
| **Datos Pre-cargados** | ✅ Aplicaciones y contratos de ejemplo | ❌ Base de datos vacía |
| **Banner Informativo** | ✅ Visible en Dashboard | ❌ No visible |
| **Registro en Blockchain** | ✅ Funcional (Testnet) | ✅ Funcional (Testnet/Mainnet) |
| **Firma de Contratos** | ✅ Proceso completo simulado | ✅ Proceso completo real |
| **Conexión de Wallet** | ✅ Funcional | ✅ Funcional |

## 📊 Funcionalidades Disponibles

### ✅ Completamente Funcionales

- **Dashboard**: Visualización de estadísticas y aplicaciones
- **Solicitud de Crédito**: Formulario completo con validación
- **Evaluación de Riesgo**: Algoritmo de scoring funcional
- **Revisión de Contratos**: Visualización de términos y condiciones
- **Firma Digital**: Proceso completo de firma con OTP
- **Registro en Blockchain**: Transacciones reales en testnet
- **Historial de Pagos**: Visualización de cuotas y estado
- **Conexión de Wallet**: Integración con Polkadot/Ethereum

### ⚠️ Con Comportamiento Simulado

- **Envío de Emails**: Se registran pero no se envían
- **Envío de SMS**: Se simula (OTP fijo en pantalla)
- **Notificaciones**: Se muestran en UI pero no vía email/SMS

## 📦 Datos Pre-cargados

El usuario demo tiene acceso a datos de ejemplo que incluyen:

### Aplicaciones de Crédito

```javascript
// Ejemplo de datos que verás
{
  client_name: "Juan Pérez Demo",
  credit_amount: 50000,
  status: "approved",
  risk_score: 720,
  monthly_income: 45000,
  employment_type: "permanent"
}
```

### Contratos

```javascript
{
  status: "pending_signature",
  contract_hash: "0x1234...abcd",
  created_at: "2024-01-15",
  expires_at: "2024-01-17"
}
```

### Pagos Simulados

```javascript
{
  payment_number: 1,
  due_date: "2024-02-15",
  amount: 8500,
  status: "paid"
}
```

## 🔄 Flujo Completo de Usuario Demo

### 1️⃣ Acceso

```
Usuario → Página Auth → Click "Demo Login" → Dashboard
```

### 2️⃣ Exploración

```
Dashboard → Ver Estadísticas → Ver Aplicaciones Existentes
```

### 3️⃣ Nueva Solicitud

```
"Nueva Solicitud" → Formulario → Evaluación de Riesgo → Revisión
```

### 4️⃣ Firma de Contrato

```
Ver Contrato → Enviar Email → Recibir Link → Ingresar OTP (123456) → Firmar
```

### 5️⃣ Registro Blockchain

```
Firma Completada → Transacción Automática → Confirmación en Red
```

### 6️⃣ Seguimiento

```
Dashboard → Historial de Pagos → Ver Estado de Cuotas
```

## 🛠️ Configuración Técnica

### Arquitectura del Modo Demo

```
┌─────────────────────────────────────────┐
│         AuthContext                      │
│  ┌───────────────────────────────┐      │
│  │ signInAsDemo()                │      │
│  │   ↓                            │      │
│  │ supabase.functions.invoke()   │      │
│  │   ↓                            │      │
│  │ ensure-demo-user              │      │
│  └───────────────────────────────┘      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Edge Function: ensure-demo-user       │
│  ┌───────────────────────────────┐      │
│  │ 1. Check if user exists       │      │
│  │ 2. Create or update user      │      │
│  │ 3. Confirm email              │      │
│  │ 4. Set password               │      │
│  └───────────────────────────────┘      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         Application Layer                │
│  ┌───────────────────────────────┐      │
│  │ isDemo = email.includes('demo')│     │
│  │   ↓                            │      │
│  │ if (isDemo) → Special behavior │      │
│  └───────────────────────────────┘      │
└─────────────────────────────────────────┘
```

### Detección de Modo Demo

**En el Frontend:**

```typescript
// src/contexts/AuthContext.tsx
const isDemo = user?.email?.toLowerCase().includes('demo') || false;
```

**En Edge Functions:**

```typescript
// supabase/functions/send-otp/index.ts
const isDemo = clientEmail?.toLowerCase().includes('demo');
const TEST_MODE = isDemo || Deno.env.get("TEST_MODE") === "true";

if (TEST_MODE) {
  otp = "123456"; // Hardcoded OTP
  console.log(`[DEMO MODE] Using hardcoded OTP: ${otp}`);
}
```

### Edge Functions Involucradas

| Edge Function | Comportamiento Demo |
|---------------|---------------------|
| `ensure-demo-user` | Crea/actualiza usuario demo automáticamente |
| `send-otp` | Usa OTP hardcoded `123456` |
| `send-contract-email` | Registra envío pero no envía email real |
| `verify-otp` | Acepta `123456` como válido |
| `register-signature-blockchain` | Funciona normalmente (usa testnet) |

### Variables de Entorno

```bash
# No requiere configuración adicional
# El modo demo funciona con las credenciales estándar
DEMO_EMAIL=demo@zentrocredit.com
DEMO_PASSWORD=Demo2024!Zentro
```

### Base de Datos

El usuario demo se almacena en:

```sql
-- Tabla: auth.users
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'demo@zentrocredit.com';

-- Perfil asociado
SELECT * FROM public.profiles 
WHERE email = 'demo@zentrocredit.com';
```

## 🚫 Limitaciones del Modo Demo

### No Disponible

- ❌ Envío real de emails
- ❌ Envío real de SMS
- ❌ Modificación de credenciales demo
- ❌ Eliminación de datos demo pre-cargados
- ❌ Registro en Mainnet (solo Testnet)

### Restricciones de Seguridad

- 🔒 Los datos demo son visibles solo para la sesión demo
- 🔒 No se pueden modificar las credenciales del usuario demo
- 🔒 Las transacciones blockchain se realizan en testnet

## 🔄 Conversión a Cuenta Real

### Desde el Banner del Dashboard

1. Haz clic en **"Crear cuenta real"** en el banner amarillo
2. Serás redirigido a la página de registro
3. Completa el formulario con tus datos reales
4. Confirma tu email
5. Inicia sesión con tu nueva cuenta

### Desde la Página de Autenticación

1. Cierra sesión del modo demo
2. Haz clic en la pestaña **"Sign Up"**
3. Completa el formulario de registro
4. Confirma tu email
5. ¡Listo! Ahora tienes una cuenta real

## 🔧 Troubleshooting

### Problema: No puedo acceder al modo demo

**Solución:**
```
1. Verifica que estés en la página de autenticación
2. Busca el botón "Demo Login" debajo del formulario
3. Si no aparece, recarga la página
```

### Problema: El OTP no funciona

**Solución:**
```
En modo demo, SIEMPRE usa: 123456
Si usas otro código, no funcionará.
```

### Problema: No veo datos pre-cargados

**Solución:**
```
1. Cierra sesión
2. Vuelve a entrar con "Demo Login"
3. Espera a que cargue el Dashboard
4. Si persiste, contacta al administrador
```

### Problema: El email de firma no llega

**Solución:**
```
En modo demo, los emails NO se envían realmente.
El link de firma se muestra directamente en pantalla.
Copia el link manualmente o usa el botón proporcionado.
```

### Problema: La transacción blockchain falla

**Solución:**
```
1. Verifica que estés en la red Testnet
2. Asegúrate de tener fondos de prueba en la wallet
3. Revisa los logs de la consola
4. El wallet corporativo debe tener saldo en testnet
```

### Problema: No puedo crear nuevas solicitudes

**Solución:**
```
El modo demo permite crear solicitudes.
Si falla:
1. Verifica que todos los campos estén completos
2. Revisa la consola del navegador
3. Intenta recargar la página
```

## 👨‍💻 Para Desarrolladores

### Agregar Datos Demo Adicionales

```typescript
// En el componente Dashboard o mediante SQL
const createDemoData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user?.email === 'demo@zentrocredit.com') {
    await supabase.from('credit_applications').insert({
      user_id: user.id,
      client_name: 'Nuevo Cliente Demo',
      credit_amount: 75000,
      status: 'pending'
    });
  }
};
```

### Testing del Modo Demo

```typescript
// Ejemplo de test
describe('Demo Mode', () => {
  it('should login with demo credentials', async () => {
    const result = await signInAsDemo();
    expect(result.data?.user?.email).toBe('demo@zentrocredit.com');
  });

  it('should use hardcoded OTP', async () => {
    const otp = await getOTP('demo@zentrocredit.com');
    expect(otp).toBe('123456');
  });
});
```

### Extender Funcionalidad Demo

```typescript
// src/contexts/AuthContext.tsx
const signInAsDemo = async () => {
  // 1. Ensure demo user exists
  await supabase.functions.invoke('ensure-demo-user');
  
  // 2. Sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'demo@zentrocredit.com',
    password: 'Demo2024!Zentro',
  });
  
  // 3. Load demo-specific data
  if (!error) {
    await loadDemoData();
  }
  
  return { data, error };
};
```

## 📚 Referencias

- [Configuración de Blockchain](./BLOCKCHAIN_SETUP.md)
- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Edge Functions](./supabase/functions/)

## 📞 Soporte

¿Tienes problemas con el modo demo?

- 📧 Email: support@zentrocredit.com
- 💬 Chat: Disponible en la plataforma
- 📖 Documentación: [docs.zentrocredit.com](https://docs.zentrocredit.com)

---

**Última actualización:** 2025-10-13  
**Versión:** 1.0.0
