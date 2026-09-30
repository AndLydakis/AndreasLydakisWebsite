export interface DialogSection {
  heading: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
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
