import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Every user-facing string in the data files is written in both languages. */
const localized = z.object({ es: z.string(), en: z.string() });

/** Year-month dates ("2025-07"). Durations are always computed from these, never written by hand. */
const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM');

const link = z.object({ label: z.string(), url: z.url() });

const profile = defineCollection({
  loader: file('src/content/profile.yaml'),
  schema: z.object({
    name: z.string(),
    fullName: z.string(),
    role: localized,
    company: z.object({ name: z.string(), url: z.url() }),
    location: localized,
    /** "leading": shows the current role. "open": shows "open to conversations". */
    status: z.enum(['leading', 'open']),
    headline: localized,
    intro: localized,
    email: z.email(),
    links: z.array(link),
  }),
});

const experience = defineCollection({
  loader: file('src/content/experience.yaml'),
  schema: z.object({
    company: z.string(),
    url: z.url().optional(),
    role: localized,
    start: yearMonth,
    end: yearMonth.nullable(),
    mode: z.enum(['remote', 'hybrid', 'onsite']),
    location: localized,
    summary: localized.optional(),
    /** Technologies used in the role; shown as a mono line in the CV. */
    stack: z.array(z.string()).default([]),
    highlights: z.array(localized).default([]),
  }),
});

const education = defineCollection({
  loader: file('src/content/education.yaml'),
  schema: z.object({
    kind: z.enum(['degree', 'certification']),
    title: localized,
    institution: z.string(),
    start: yearMonth.optional(),
    end: yearMonth,
    detail: localized.optional(),
  }),
});

const principles = defineCollection({
  loader: file('src/content/principles.yaml'),
  schema: z.object({
    order: z.number(),
    title: localized,
    body: localized,
  }),
});

const stack = defineCollection({
  loader: file('src/content/stack.yaml'),
  schema: z.object({
    order: z.number(),
    group: localized,
    items: z.array(z.object({ name: z.string(), note: localized.optional() })),
  }),
});

/**
 * Case studies live in `src/content/projects/{es,en}/<slug>.mdx`; the entry id is "<locale>/<slug>".
 * `draft: true` entries are visible in dev only and never reach a production build.
 * `externalUrl` entries have no case-study page: their row links straight to that site.
 * Covers are 16:9 everywhere (work-list preview and case-study hero), so an image is never cropped.
 */
const projects = defineCollection({
  loader: glob({ pattern: '{es,en}/*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      tagline: z.string(),
      summary: z.string(),
      category: z.string(),
      role: z.string(),
      start: yearMonth,
      end: yearMonth.nullable(),
      stack: z.array(z.string()).default([]),
      links: z.array(link).default([]),
      externalUrl: z.url().optional(),
      order: z.number(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      /**
       * Project cover (16:9). `fit: cover` is a designed image that fills it (ideally 2400×1350);
       * `fit: contain` is a logo centred on `background`. `srcDark`/`backgroundDark` are used with
       * the dark theme. Without a cover, the project title is shown instead.
       */
      cover: z
        .object({
          src: image(),
          srcDark: image().optional(),
          alt: z.string(),
          fit: z.enum(['cover', 'contain']).default('cover'),
          /** Any CSS colour; shown behind the image (and while it loads). */
          background: z.string(),
          backgroundDark: z.string().optional(),
        })
        .optional(),
    }),
});

export const collections = { profile, experience, education, principles, stack, projects };
