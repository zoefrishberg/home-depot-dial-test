declare namespace Deno {
  const env: {
    get(key: string): string | undefined;
  };

  function serve(
    handler: (request: Request) => Response | Promise<Response>,
  ): void;
}

declare module "npm:hono" {
  export class Hono {
    fetch: (request: Request) => Response | Promise<Response>;
    use(...args: any[]): void;
    get(...args: any[]): void;
    post(...args: any[]): void;
  }
}

declare module "npm:hono/cors" {
  export function cors(...args: any[]): unknown;
}

declare module "npm:hono/logger" {
  export function logger(...args: any[]): unknown;
}

declare module "npm:uuid" {
  export const v4: () => string;
}

declare module "jsr:@supabase/supabase-js@2.49.8" {
  export function createClient(...args: any[]): any;
}
