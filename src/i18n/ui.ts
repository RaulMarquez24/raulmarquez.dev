export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';

/** BCP 47 tags used for <html lang>, og:locale and Intl formatting. */
export const localeTags: Record<Locale, string> = {
  es: 'es-ES',
  en: 'en-US',
};

export const ui = {
  es: {
    'meta.description':
      'Raúl Márquez, Tech Lead en Renterus. Construyo producto y los equipos que lo sostienen: arquitectura, web, móvil y tiempo real.',
    'nav.work': 'Trabajo',
    'nav.about': 'Sobre mí',
    'nav.cv': 'CV',
    'nav.uses': 'Uses',
    'nav.home': 'Inicio',
    'nav.primary': 'Navegación principal',
    'lang.switch': 'English',
    'lang.switchLabel': 'Read this page in English',
    'theme.toggle': 'Cambiar tema',
    'skip.content': 'Saltar al contenido',
    'status.leading': 'Tech Lead en {company}',
    'status.open': 'Abierto a conversar',
    'home.selectedWork': 'Trabajo seleccionado',
    'home.principles': 'Cómo trabajo',
    'home.experience': 'Trayectoria',
    'home.fullCv': 'Ver CV completo',
    'contact.title': 'Hablemos',
    'contact.text': 'Si quieres hablar de producto, arquitectura o equipos, escríbeme.',
    'contact.copy': 'Copiar',
    'contact.copyLabel': 'Copiar el email',
    'contact.copied': 'Copiado',
    'work.role': 'Rol',
    'work.period': 'Periodo',
    'work.stack': 'Stack',
    'work.draft': 'Borrador · no se publica',
    'work.external': '(abre su web en una pestaña nueva)',
    'link.newTab': '(se abre en una pestaña nueva)',
    'work.back': 'Volver al trabajo',
    'diagram.own': 'Hecho para el proyecto',
    'diagram.data': 'Datos',
    'diagram.external': 'Externo',
    'cv.title': 'Currículum',
    'cv.experience': 'Experiencia',
    'cv.education': 'Formación',
    'cv.download': 'Descargar PDF',
    'uses.title': 'Uses',
    'uses.intro': 'Las herramientas con las que trabajo a diario y por qué.',
    'date.present': 'hoy',
    'mode.remote': 'En remoto',
    'mode.hybrid': 'Híbrido',
    'mode.onsite': 'Presencial',
    'footer.source': 'Código de esta web',
    'notFound.title': 'Página no encontrada',
    'notFound.text': 'Esta ruta no existe o se ha movido.',
  },
  en: {
    'meta.description':
      'Raúl Márquez, Tech Lead at Renterus. I build products and the teams that sustain them: architecture, web, mobile and real-time.',
    'nav.work': 'Work',
    'nav.about': 'About',
    'nav.cv': 'CV',
    'nav.uses': 'Uses',
    'nav.home': 'Home',
    'nav.primary': 'Main navigation',
    'lang.switch': 'Español',
    'lang.switchLabel': 'Leer esta página en español',
    'theme.toggle': 'Toggle theme',
    'skip.content': 'Skip to content',
    'status.leading': 'Tech Lead at {company}',
    'status.open': 'Open to conversations',
    'home.selectedWork': 'Selected work',
    'home.principles': 'How I work',
    'home.experience': 'Experience',
    'home.fullCv': 'Full CV',
    'contact.title': "Let's talk",
    'contact.text': 'If you want to talk about product, architecture or teams, drop me a line.',
    'contact.copy': 'Copy',
    'contact.copyLabel': 'Copy the email address',
    'contact.copied': 'Copied',
    'work.role': 'Role',
    'work.period': 'Period',
    'work.stack': 'Stack',
    'work.draft': 'Draft · not published',
    'work.external': '(opens its website in a new tab)',
    'link.newTab': '(opens in a new tab)',
    'work.back': 'Back to work',
    'diagram.own': 'Built for the project',
    'diagram.data': 'Data',
    'diagram.external': 'External',
    'cv.title': 'Résumé',
    'cv.experience': 'Experience',
    'cv.education': 'Education',
    'cv.download': 'Download PDF',
    'uses.title': 'Uses',
    'uses.intro': 'The tools I work with every day, and why.',
    'date.present': 'now',
    'mode.remote': 'Remote',
    'mode.hybrid': 'Hybrid',
    'mode.onsite': 'On-site',
    'footer.source': 'Source of this site',
    'notFound.title': 'Page not found',
    'notFound.text': "This page doesn't exist or has moved.",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UIKey = keyof (typeof ui)['es'];

export function t(locale: Locale, key: UIKey, vars: Record<string, string> = {}): string {
  const template: string = ui[locale][key] ?? ui[defaultLocale][key];
  return template.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
}

/** Localized content value: every user-facing string in the data files is `{ es, en }`. */
export type Localized<T = string> = Record<Locale, T>;

export function pick<T>(value: Localized<T>, locale: Locale): T {
  return value[locale] ?? value[defaultLocale];
}

/**
 * Builds a URL for a locale from a locale-agnostic path ("/about", "/work/renterus").
 * Spanish lives at the root, English under /en. Always ends in "/" (trailingSlash: 'always').
 */
export function localizePath(path: string, locale: Locale): string {
  const segments = path.split('/').filter(Boolean);
  if (locale !== defaultLocale) segments.unshift(locale);
  return segments.length > 0 ? `/${segments.join('/')}/` : '/';
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'es' ? 'en' : 'es';
}

/** getStaticPaths entries for pages under `src/pages/[...lang]/`. */
export function localeStaticPaths() {
  return locales.map((locale) => ({
    params: { lang: locale === defaultLocale ? undefined : locale },
    props: { locale },
  }));
}
