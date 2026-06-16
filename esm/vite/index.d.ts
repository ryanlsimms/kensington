export type KensingtonHmrInclude =
  | string
  | string[]
  | ((server: unknown) => string | string[] | null | undefined);

export interface KensingtonHmrOptions {
  include: KensingtonHmrInclude;
}

export interface KensingtonHmrPlugin {
  name: string;
  apply: 'serve';
  configureServer(server: unknown): void;
  transform(code: string, id: string): { code: string; map: object } | null | undefined;
}

export function kensingtonHmr(options: KensingtonHmrOptions): KensingtonHmrPlugin;
