import type { ContentRecord } from './types';

export const officeContent: ContentRecord = {
  id: 'office-cv',
  label: 'My Resume',
  roomId: 'office',
  roomLabel: 'Office',
  title: 'Curriculum vitae',
  eyebrow: 'Andreas Lydakis',
  description: 'Engineer with multiple years of experience in the field of autonomous agents, whether those are household robots or autonomous trucks. I take pride being able to pick up new concepts quickly and adapt strategic plans to deployed products.',
  sections: [
    {
      heading: 'Profile',
      paragraphs: ['PLACEHOLDER PROFILE - replace with a real professional summary.'],
    },
    {
      heading: 'Experience',
      items: ['PLACEHOLDER ROLE - replace with a real role and description.'],
    },
    {
      heading: 'Skills',
      items: ['PLACEHOLDER SKILL', 'PLACEHOLDER SKILL'],
    },
  ],
  headerActions: [
    {
      label: 'Legacy Portfolio',
      href: 'https://andlydakis.github.io/',
      openInNewTab: true,
    },
  ],
  actions: [
    {
      label: 'Download CV (PDF)',
      assetPath: 'lydakis_cv_nolink.pdf',
      downloadName: 'lydakis-cv.pdf',
    },
  ],
};
