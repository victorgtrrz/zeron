# Design: Wishlist Persistence, Newsletter System & Card Height Fix

**Date:** 2026-03-17
**Status:** Approved

---

## 1. Wishlist — Persistencia con Hook + Contexto

### Problema
Los botones de corazón en las cards de `/shop` y en la página de detalle usan `useState(false)` local. Al refrescar, el estado se pierde. Las funciones de Firestore (`getWishlist`, `toggleWishlistItem`) ya existen pero no están conectadas a la UI.

### Solución
Crear un `WishlistContext` + `useWishlist` hook, siguiendo el mismo patrón que `CartContext`/`useCart`.

### Archivos nuevos
- `src/lib/wishlist-context.tsx` — Provider que mantiene un `Set<string>` de product IDs
- `src/hooks/use-wishlist.ts` — Hook que expone `{ wishlistIds, toggle, isWished, loading }`

### Flujo
1. `WishlistProvider` se monta en el layout raíz (`[locale]/layout.tsx`), al mismo nivel que `CartProvider`
2. Si hay usuario autenticado → llama `getWishlist(user.uid)` y carga los IDs en un `Set`
3. Si no hay usuario → `wishlistIds` queda vacío, `toggle` no hace nada
4. `toggle(productId)` llama a `toggleWishlistItem(userId, productId)` en Firestore y actualiza el `Set` local simultáneamente

### Cambios en componentes existentes
- `product-card.tsx`: Reemplazar `useState(false)` por `useWishlist()`. El corazón llama `toggle(product.id)`. Estado visual derivado de `isWished(product.id)`.
- `product-detail-client.tsx`: Mismo cambio.
- Layout raíz (`[locale]/layout.tsx`): Envolver con `<WishlistProvider>`.

### API existente (sin cambios)
- `getWishlist(userId)` y `toggleWishlistItem(userId, productId)` en `src/lib/firebase/firestore.ts` ya funcionan correctamente.

### Restricción
- Solo para usuarios logueados. Sin localStorage fallback para anónimos.

---

## 2. Newsletter — Fase 1: Suscriptores + Admin

### Problema
El formulario de newsletter en la homepage solo hace `setSubmitted(true)` sin guardar nada. No hay colección en Firestore, ni API, ni sección en el panel admin.

### Modelo de datos — Colección `newsletter_subscribers`
```typescript
interface NewsletterSubscriber {
  email: string;
  locale: Locale;          // idioma en el que se suscribió
  subscribedAt: Date;
  source: string;          // "homepage_footer" (para futuro tracking)
}
// Document ID: hash del email (para evitar duplicados)
```

### Reglas Firestore
Solo lectura/escritura desde server (admin SDK). El cliente nunca accede directamente.

### API routes nuevas
- `POST /api/newsletter/subscribe` — Recibe `{ email, locale }`, valida formato, guarda en Firestore. Pública.
- `GET /api/admin/newsletter/subscribers` — Lista suscriptores con paginación. Protegida (admin).
- `GET /api/admin/newsletter/subscribers/export` — Devuelve CSV. Protegida (admin).

### Cambios en componentes existentes
- `src/components/home/newsletter.tsx`: `handleSubmit` pasa a llamar `POST /api/newsletter/subscribe`. Mantiene feedback visual existente en éxito, muestra error si falla.

### Panel admin — `/zr-ops/newsletter`
- Tabla: email, idioma, fecha de suscripción
- Botón "Export CSV"
- Contador total de suscriptores
- Paginación
- Enlace en navegación lateral de `/zr-ops`

---

## 3. Newsletter — Fase 2: Campañas básicas

### Modelo de datos — Colección `campaigns`
```typescript
interface Campaign {
  subject: string;
  body: string;              // HTML del email
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  scheduledAt: Date | null;  // null = envío manual
  sentAt: Date | null;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### API routes nuevas
- `GET /api/admin/newsletter/campaigns` — Lista campañas con paginación
- `POST /api/admin/newsletter/campaigns` — Crear campaña (status: draft)
- `PUT /api/admin/newsletter/campaigns/[id]` — Editar borrador (solo si status = draft)
- `POST /api/admin/newsletter/campaigns/[id]/send` — Enviar ahora vía AWS SES
- `POST /api/admin/newsletter/campaigns/[id]/schedule` — Programar envío

### Envío programado
- API route `/api/cron/newsletter` invocada periódicamente (Vercel Cron o similar)
- Busca campañas con `status: "scheduled"` y `scheduledAt <= now`
- Las procesa igual que el envío manual

### Envío de emails
- Reutiliza `src/lib/ses.ts`
- Nueva función `sendCampaignEmail(to, subject, htmlBody)`
- Envío secuencial con throttling para respetar límites de SES

### Panel admin — `/zr-ops/newsletter/campaigns`
- Lista de campañas con badge de estado, asunto, fecha
- Botón "New Campaign" → formulario: asunto, textarea HTML con preview, botones "Save Draft" / "Send Now" / "Schedule"
- Vista detalle con resultados (enviados, fallidos)

### Navegación
Sección "Newsletter" en sidebar con sub-páginas: "Subscribers" y "Campaigns".

---

## 4. Newsletter — Fase 3: Plantillas + Vista previa

### Modelo de datos — Colección `campaign_templates`
```typescript
interface CampaignTemplate {
  name: string;
  subject: string;
  body: string;              // HTML del email
  createdAt: Date;
  updatedAt: Date;
}
```

### Cambio en Campaign
Campo opcional `templateId: string | null` — referencia, no vínculo vivo. El HTML se copia al crear la campaña.

### API routes nuevas
- `GET /api/admin/newsletter/templates` — Lista plantillas
- `POST /api/admin/newsletter/templates` — Crear
- `PUT /api/admin/newsletter/templates/[id]` — Editar
- `DELETE /api/admin/newsletter/templates/[id]` — Eliminar

### Vista previa
- Botón "Preview" en formulario de campaña/plantilla
- Abre modal/panel lateral con `<iframe sandbox>` que renderiza el HTML
- Sin dependencias externas

### Flujo de plantillas
1. Admin crea/edita plantillas en `/zr-ops/newsletter/templates`
2. Al crear campaña, puede elegir "Start from template" que precarga subject + body
3. Contenido modificable libremente — la plantilla es solo punto de partida

### Panel admin — `/zr-ops/newsletter/templates`
- Lista con nombre y fecha de última edición
- CRUD completo + preview
- Editor igual al de campañas

### Navegación actualizada
"Newsletter" en sidebar: "Subscribers", "Campaigns", "Templates".

---

## 5. Cards de Related Products — Altura constante

### Problema
La altura de las cards varía porque el botón "Add to Cart" se renderiza condicionalmente (`availableSizes.length > 0`). Cards sin stock son más bajas.

### Solución
Mostrar siempre el botón. Si no hay stock, renderizar "Out of stock" deshabilitado.

### Cambio en `src/components/product/product-card.tsx`
```tsx
// Antes: condicional
{availableSizes.length > 0 && (<button>Add to Cart</button>)}

// Después: siempre presente
{availableSizes.length > 0 ? (
  <button>Add to Cart</button>
) : (
  <button disabled className="opacity-50 cursor-not-allowed border-border text-muted">
    Out of stock
  </button>
)}
```

### Estilo del botón deshabilitado
- Misma estructura y padding que el botón activo
- Clases adicionales: `opacity-50 cursor-not-allowed border-border text-muted`
- Sin hover effects

### Traducciones
Añadir clave `"outOfStock"` en `en.json`, `es.json` y `zh-HK.json`.

### Alcance
Cambio global en `ProductCard` — aplica tanto en related products como en el grid del shop.
