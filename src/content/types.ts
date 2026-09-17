export type ContentId = string;

export interface ContentSection {
  heading: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
}

export interface ContentAction {
  label: string;
  assetPath: string;
  downloadName?: string;
}

export interface ContentRecord {
  id: ContentId;
  label: string;
  roomId: string;
  roomLabel: string;
  title: string;
  eyebrow?: string;
  description?: string;
  sections: readonly ContentSection[];
  actions?: readonly ContentAction[];
}
