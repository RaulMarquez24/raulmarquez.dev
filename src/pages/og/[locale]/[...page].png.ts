import type { APIRoute, GetStaticPaths } from 'astro';
import { type Locale, locales, pick, t } from '../../../i18n/ui';
import { getProfile, getProjects, projectSlug } from '../../../lib/content';
import { type OgCard, renderOgImage } from '../../../lib/og-card';

/** One preview image per indexable page and locale. Keys match `ogImagePath()`. */
export const getStaticPaths = (async () => {
  const profile = await getProfile();

  const cardsFor = async (locale: Locale): Promise<[string, OgCard][]> => {
    const role = pick(profile.role, locale);
    const caseStudies = (await getProjects(locale)).filter((project) => !project.data.externalUrl);
    return [
      ['home', { eyebrow: `${profile.name} · ${role}`, title: pick(profile.headline, locale) }],
      ['about', { eyebrow: profile.name, title: t(locale, 'about.title') }],
      [
        'cv',
        {
          eyebrow: t(locale, 'cv.title'),
          title: profile.fullName,
          lead: `${role} · ${profile.company.name}`,
        },
      ],
      [
        'uses',
        { eyebrow: profile.name, title: t(locale, 'uses.title'), lead: t(locale, 'uses.intro') },
      ],
      ['now', { eyebrow: profile.name, title: t(locale, 'now.title') }],
      ...caseStudies.map((project): [string, OgCard] => [
        `work/${projectSlug(project)}`,
        {
          eyebrow: project.data.category,
          title: project.data.title,
          lead: project.data.tagline,
          cover: project.data.cover && {
            src: project.data.cover.src,
            background: project.data.cover.background,
          },
        },
      ]),
    ];
  };

  const byLocale = await Promise.all(
    locales.map(async (locale) => ({ locale, cards: await cardsFor(locale) })),
  );
  return byLocale.flatMap(({ locale, cards }) =>
    cards.map(([page, card]) => ({ params: { locale, page }, props: { card } })),
  );
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ card: OgCard }> = async ({ props }) =>
  new Response(await renderOgImage(props.card), { headers: { 'Content-Type': 'image/png' } });
