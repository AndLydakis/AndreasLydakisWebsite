export type ContentId = string;

export interface GalleryPicture {
  /** Relative to public/assets; add as many entries as needed, in display order. */
  assetPath: string;
  alt: string;
  caption?: string;
}

export interface ContentItemLink {
  label: string;
  href: string;
  openInNewTab?: boolean;
  notes?: readonly string[];
}

export interface ContentSection {
  heading: string;
  paragraphs?: readonly string[];
  items?: readonly (string | ContentItemLink)[];
  tabbed?: boolean;
}

interface ContentActionBase {
  label: string;
  downloadName?: string;
  openInNewTab?: boolean;
}

export type ContentAction = ContentActionBase & (
  | { assetPath: string; href?: never }
  | { assetPath?: never; href: string }
);

export interface ContentRecord {
  id: ContentId;
  label: string;
  roomId: string;
  roomLabel: string;
  title: string;
  eyebrow?: string;
  description?: string;
  layout?: 'sections' | 'tabs';
  tabbedSectionPlacement?: 'body' | 'header';
  sections: readonly ContentSection[];
  headerActions?: readonly ContentAction[];
  actions?: readonly ContentAction[];
  /** Optional standalone picture; paths stay relative to public/assets. */
  image?: { assetPath: string; alt: string };
  gallery?: readonly GalleryPicture[];
}
