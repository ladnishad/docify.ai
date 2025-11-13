declare module 'turndown-plugin-gfm' {
  import TurndownService from 'turndown';

  export function gfm(service: TurndownService): void;
  export const tables: TurndownService.Plugin;
  export const strikethrough: TurndownService.Plugin;
  export const taskListItems: TurndownService.Plugin;
}
