export type ContentId = string;

export interface GalleryPicture {
  /** Relative to public/assets; add as many entries as needed, in display order. */
  assetPath: string;
  alt: string;
  caption?: string;
}

export interface ContentSection {
  heading: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
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
  sections: readonly ContentSection[];
  headerActions?: readonly ContentAction[];
  actions?: readonly ContentAction[];
  /** Optional standalone picture; paths stay relative to public/assets. */
  image?: { assetPath: string; alt: string };
  gallery?: readonly GalleryPicture[];
}
