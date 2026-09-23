import type { Graph, Thing, WithContext } from "schema-dts";
export type StructuredData = Graph | WithContext<Thing>;
export function serializeJsonLd(data: StructuredData): string {
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
}
