import type { ContentRecord } from './types';

export const officeContent: ContentRecord = {
  id: 'office-cv',
  label: 'My Resume',
  roomId: 'office',
  roomLabel: 'Office',
  title: 'Curriculum vitae',
  eyebrow: 'Andreas Lydakis',
  description: 'Hello, I am Andreas, and this is my resume. Thanks for dropping by :D. \nIf you don\'t want to explore, you can download my CV from the link at the bottom and see a more conventional (and maybe a bit outdated) portfolio by clicking "Legacy Portfolio"',
  tabbedSectionPlacement: 'header',
  sections: [
    {
      heading: 'Profile',
      paragraphs: ['Engineer with multiple years of experience in the field of autonomous agents, whether those are household robots or autonomous trucks. I take pride being able to pick up new concepts quickly and adapt strategic plans to deployed products. I am confortable as an individual contributor, or as part of/leading a team.'],
    },
    {
      heading: 'Experience',
      items: [
          'Scania Group - Simulation Team Product Owner/SW Architect.',
          'Scania Group - Simulation Team, Senior Software Engineer',
          'Dyson Technology - Robotics Engineer, simulation & HRI',
          'Innotec UK - Robotics Engineer',
          'NCSR Demokritos - Research Engineer, HRI & Robotics'
        ],
    },
    {
      heading: 'Skills',
      items: ['C++, Python, ROS/ROS2/DDS', 'PyTorch/Tensorflow experience', 'Databricks, AWS', 'Unity/Unreal (some)'],
    },
    {
      heading: 'Projects',
      tabbed: true,
      paragraphs: ['Short overview of individual projects - WIP'],
      items: [
        {
          label: 'WIP',
          href: 'http://localhost:4173/',
          openInNewTab: true,
          notes: ['WIP'],
        },
      ],
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
