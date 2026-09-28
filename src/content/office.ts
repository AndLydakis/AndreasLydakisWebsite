import type { ContentRecord } from './types';

export const officeContent: ContentRecord = {
  id: 'office-cv',
  label: 'Office workstation',
  roomId: 'office',
  roomLabel: 'Office',
  title: 'Curriculum vitae',
  eyebrow: 'PLACEHOLDER CONTENT',
  description: 'This dummy CV and downloadable PDF will be replaced with the owner\'s approved CV later.',
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
  actions: [
    {
      label: 'Download placeholder CV (PDF)',
      assetPath: 'cv.pdf',
      downloadName: 'placeholder-cv.pdf',
    },
  ],
};
