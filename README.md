# comprehensive-manage-next

Migration scaffold for the Vue project to:

- Next.js
- React + TypeScript
- Recoil
- Tailwind CSS
- pnpm

## Start

```bash
pnpm install
pnpm dev
```

## Migration map

- `Login.vue` -> `app/(auth)/login/page.tsx`
- `Main.vue` -> `app/(dashboard)/layout.tsx`
- `router/routes.js` -> `app/**/page.tsx`
- `store/user.js` -> `state/auth.ts`
- `src/api/*` -> `lib/api/*`
