declare module 'simple-wappalyzer' {
  interface WappalyzerCategory {
    id: number;
    slug: string;
    name: string;
    groups?: number[];
    priority?: number;
  }

  interface WappalyzerResult {
    name: string;
    description?: string;
    slug: string;
    categories: WappalyzerCategory[];
    confidence: number;
    version: string;
    icon: string;
    website: string;
    pricing?: string[];
    cpe: string | null;
  }

  interface WappalyzerInput {
    url: string;
    html: string;
    headers: Record<string, string>;
    statusCode: number;
  }

  function simpleWappalyzer(input: WappalyzerInput): Promise<WappalyzerResult[]>;

  export default simpleWappalyzer;
}
