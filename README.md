# raulmarquez.dev

Portfolio de Raúl Márquez, Tech Lead & Lead Developer en Renterus.

Hecho para durar: el contenido vive en ficheros de datos validados, el diseño en tokens y el resultado es HTML estático en la red de Cloudflare.

## Stack

- **Astro 7**, estático, con TypeScript strict
- **Tailwind CSS 4**, con tokens OKLCH y tema claro/oscuro
- **MDX** y content collections validadas con Zod
- **i18n** nativo: español en `/`, inglés en `/en/`
- **Biome**, **Playwright** + **axe**, GitHub Actions
- **Cloudflare Workers**, solo ficheros estáticos

## Desarrollo

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm check      # tipos + lint
pnpm build && pnpm test
```

## Contenido

Todo lo que se lee en la web está en `src/content/`:

| Fichero | Qué contiene |
|---|---|
| `profile.yaml` | nombre, titular, estado y enlaces |
| `experience.yaml` | trayectoria (las duraciones se calculan solas) |
| `education.yaml` | formación |
| `principles.yaml` | cómo trabajo |
| `stack.yaml` | herramientas |
| `projects/{es,en}/*.mdx` | casos de estudio (`draft: true` = no se publica) |
