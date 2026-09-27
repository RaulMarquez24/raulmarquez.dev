import { type CollectionEntry, getCollection, getEntry } from 'astro:content';
import type { Locale } from '../i18n/ui';

export type Project = CollectionEntry<'projects'>;

export async function getProfile() {
  const entry = await getEntry('profile', 'me');
  if (!entry) throw new Error('src/content/profile.yaml must define the "me" entry');
  return entry.data;
}

/** Drafts are visible while developing and never reach a production build. */
export function isPublished(project: Project): boolean {
  return import.meta.env.DEV || !project.data.draft;
}

/** Entry ids look like "es/renterus". */
export function projectSlug(project: Project): string {
  return project.id.split('/')[1];
}

export async function getProjects(locale: Locale): Promise<Project[]> {
  const projects = await getCollection(
    'projects',
    (project) => project.id.startsWith(`${locale}/`) && isPublished(project),
  );
  return projects.sort((a, b) => a.data.order - b.data.order);
}

export async function getExperience() {
  const entries = await getCollection('experience');
  return entries.sort((a, b) => b.data.start.localeCompare(a.data.start));
}

export type Role = CollectionEntry<'experience'>;

/** Consecutive roles at the same company, newest first, like LinkedIn shows a promotion. */
export interface CompanyGroup {
  company: string;
  url?: string;
  location: Role['data']['location'];
  start: string;
  /** null while any role in the company is current. */
  end: string | null;
  roles: Role[];
}

export async function getExperienceByCompany(): Promise<CompanyGroup[]> {
  const groups: CompanyGroup[] = [];
  for (const role of await getExperience()) {
    const last = groups.at(-1);
    if (last && last.company === role.data.company) {
      last.roles.push(role);
      last.start = role.data.start;
    } else {
      groups.push({
        company: role.data.company,
        url: role.data.url,
        location: role.data.location,
        start: role.data.start,
        end: role.data.end,
        roles: [role],
      });
    }
  }
  return groups;
}

export async function getEducation() {
  const entries = await getCollection('education');
  return entries.sort((a, b) => b.data.end.localeCompare(a.data.end));
}

export async function getPrinciples() {
  const entries = await getCollection('principles');
  return entries.sort((a, b) => a.data.order - b.data.order);
}

export async function getStack() {
  const entries = await getCollection('stack');
  return entries.sort((a, b) => a.data.order - b.data.order);
}
