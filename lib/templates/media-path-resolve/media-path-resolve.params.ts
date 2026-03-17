export type MediaType = 'photo' | 'video' | 'audio' | 'document';

export interface MediaPathResolveTemplateParams {
  mediaType: MediaType;
  urlVar: string;
  indentLevel?: string;
}
