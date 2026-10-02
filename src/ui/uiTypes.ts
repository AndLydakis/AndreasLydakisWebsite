export interface DialogItemLink {
  label: string;
  href: string;
  openInNewTab?: boolean;
  notes?: readonly string[];
}

export interface DialogSection {
  heading: string;
  paragraphs?: readonly string[];
  items?: readonly (string | DialogItemLink)[];
  tabbed?: boolean;
}

export interface DialogAction {
  label: string;
  href: string;
  download?: string;
  openInNewTab?: boolean;
}

export interface DialogContent {
  id: string;
  title: string;
  eyebrow?: string;
  description?: string;
  layout?: 'sections' | 'tabs';
  tabbedSectionPlacement?: 'body' | 'header';
  sections: readonly DialogSection[];
  headerActions?: readonly DialogAction[];
  actions?: readonly DialogAction[];
  image?: { src: string; alt: string };
  gallery?: readonly { src: string; alt: string; caption?: string }[];
}

export interface ContentIndexEntry {
  id: string;
  label: string;
  roomLabel?: string;
  content: DialogContent;
}
