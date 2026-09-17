import type { ContentRecord } from './types';

export const officeContent: ContentRecord = {
  id: 'office-cv',
  label: 'Office workstation',
  roomId: 'office',
  roomLabel: 'Office',
  title: 'Curriculum vitae',
  eyebrow: 'PLACEHOLDER CONTENT',
  description: 'This dummy CV will be replaced with the owner\'s CV later. The PDF action is connected in PORT-13.',
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
};
