import {
  Experimental_Agent as Agent,
  stepCountIs,
  tool,
  generateObject,
  generateText
} from 'ai';
import {
  FormSchema,
  QualificationSchema,
  qualificationSchema
} from '@/lib/types';
import { sendSlackMessageWithButtons } from '@/lib/slack';
import { z } from 'zod';
import { exa } from '@/lib/exa';

/**
 * Qualify the lead
 */
export async function qualify(
  lead: FormSchema,
  research: string
): Promise<QualificationSchema> {
  const { object } = await generateObject({
    model: 'openai/gpt-5',
    schema: qualificationSchema,
    prompt: `Qualify the lead and give a reason for the qualification based on the following information: LEAD DATA: ${JSON.stringify(
      lead
    )} and RESEARCH: ${research}`
  });

  return object;
}

/**
 * Write an email
 */
export async function writeEmail(
  research: string,
  qualification: QualificationSchema
) {
  const { text } = await generateText({
    model: 'openai/gpt-5',
    prompt: `Write an email for a ${
      qualification.category
    } lead based on the following information: ${JSON.stringify(research)}`
  });

  return text;
}

/**
 * Send the research and qualification to the human for approval in slack
 */
export async function humanFeedback(
  research: string,
  email: string,
  qualification: QualificationSchema,
  workflowId: string
) {
  const message = `*New Lead Qualification*\n\n*Email:* ${email}\n*Category:* ${
    qualification.category
  }\n*Reason:* ${qualification.reason}\n\n*Research:*\n${research.slice(
    0,
    500
  )}...\n\n*Please review and approve or reject this email*`;

  const slackChannel = process.env.SLACK_CHANNEL_ID || '';

  return await sendSlackMessageWithButtons(slackChannel, message, workflowId);
}

/**
 * Send an email using Resend
 */
export async function sendEmail(
  to: string,
  subject: string,
  content: string,
  from?: string
) {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: from || 'Lead Agent <onboarding@resend.dev>', // Update with your verified domain
      to: [to],
      subject: subject,
      html: content,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * ------------------------------------------------------------
 * Agent & Tools
 * ------------------------------------------------------------
 */

/**
 * Fetch tool
 */
export const fetchUrl = tool({
  description: 'Return visible text from a public URL as Markdown.',
  inputSchema: z.object({
    url: z.string().describe('Absolute URL, including http:// or https://')
  }),
  execute: async ({ url }) => {
    const result = await exa.getContents(url, {
      text: true
    });
    return result;
  }
});

/**
 * CRM Search tool
 */
export const crmSearch = tool({
  description:
    'Search existing Vercel CRM for opportunities by company name or domain',
  inputSchema: z.object({
    name: z
      .string()
      .describe('The name of the company to search for (e.g. "Vercel")')
  }),
  execute: async ({ name }) => {
    // fetch from CRM like Salesforce, Hubspot, or Snowflake, etc.
    return [];
  }
});

/**
 * Tech-stack analysis tool using simple-wappalyzer
 */

// Import simple-wappalyzer
let simpleWappalyzer: any = null;

async function getWappalyzer() {
  if (!simpleWappalyzer) {
    simpleWappalyzer = (await import('simple-wappalyzer')).default;
  }
  return simpleWappalyzer;
}

export const techStackAnalysis = tool({
  description: 'Analyze the tech stack of a website domain. Returns detected technologies with categories, versions, and confidence scores.',
  inputSchema: z.object({
    domain: z.string().describe('Domain, e.g. "vercel.com" or full URL "https://vercel.com"')
  }),
  execute: async ({ domain }) => {
    try {
      // Normalize URL
      const url = domain.startsWith('http') ? domain : `https://${domain}`;

      // Fetch the website with proper headers
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        return `Failed to fetch ${url}: HTTP ${response.status}`;
      }

      const html = await response.text();
      const headers = Object.fromEntries(response.headers);

      // Get wappalyzer function and analyze
      const wappalyzer = await getWappalyzer();
      const result = await wappalyzer({
        url,
        html,
        headers,
        statusCode: response.status
      });

      // Format results for AI agent consumption
      // Result is an array of technology objects
      if (!result || result.length === 0) {
        return `No technologies detected for ${domain}. The site may use custom-built solutions or technologies not in the detection database.`;
      }

      // Extract and format technologies
      const technologies = result.map((app: any) => {
        // Get primary category name
        const categoryName = app.categories?.[0]?.name || 'Unknown';

        return {
          name: app.name,
          category: categoryName,
          version: app.version || 'N/A',
          confidence: app.confidence || 100
        };
      });

      // Group by category for better readability
      const grouped = technologies.reduce((acc: any, tech: any) => {
        const category = tech.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(tech);
        return acc;
      }, {});

      // Format as a readable report
      let report = `Tech Stack Analysis for ${domain}:\n\n`;

      for (const [category, techs] of Object.entries(grouped)) {
        report += `${category}:\n`;
        (techs as any[]).forEach(tech => {
          const versionInfo = tech.version !== 'N/A' ? ` (v${tech.version})` : '';
          const confidenceInfo = tech.confidence !== 100 ? ` [${tech.confidence}% confidence]` : '';
          report += `  - ${tech.name}${versionInfo}${confidenceInfo}\n`;
        });
        report += '\n';
      }

      report += `Total technologies detected: ${technologies.length}`;

      return report;

    } catch (error: any) {
      console.error('Tech stack analysis error:', error);

      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return `Timeout while analyzing ${domain}. The website may be slow or unreachable.`;
      }

      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return `Cannot reach ${domain}. The domain may not exist or is not accessible.`;
      }

      return `Error analyzing ${domain}: ${error.message}`;
    }
  }
});

/**
 * Search tool
 */
const search = tool({
  description: 'Search the web for information',
  inputSchema: z.object({
    keywords: z
      .string()
      .describe(
        'The entity to search for (e.g. "Apple") — do not include any Vercel specific keywords'
      ),
    resultCategory: z
      .enum([
        'company',
        'research paper',
        'news',
        'pdf',
        'github',
        'tweet',
        'personal site',
        'linkedin profile',
        'financial report'
      ])
      .describe('The category of the result you are looking for')
  }),
  execute: async ({ keywords, resultCategory }) => {
    /**
     * Deep research using exa.ai
     * Return the results in markdown format
     */
    const result = await exa.searchAndContents(keywords, {
      numResults: 2,
      type: 'keyword',
      category: resultCategory,
      summary: true
    });
    return result;
  }
});

/**
 * Query the knowledge base
 */
const queryKnowledgeBase = tool({
  description: 'Query the organization knowledge base for relevant information using semantic search.',
  inputSchema: z.object({
    query: z.string().describe('The question or topic to search for in the knowledge base'),
    orgId: z.string().describe('The organization ID to search within')
  }),
  execute: async ({ query, orgId }: { query: string; orgId: string }) => {
    const { searchKnowledgeBase } = await import('@/lib/knowledge-base');

    // Search for top 3 most relevant chunks
    const results = await searchKnowledgeBase(orgId, query, 3);

    if (results.length === 0) {
      return 'No relevant information found in the knowledge base.';
    }

    // Format results as context
    const context = results
      .map((result, i) => {
        return `[${i + 1}] From "${result.title}" (relevance: ${(result.similarity * 100).toFixed(1)}%)\n${result.content}`;
      })
      .join('\n\n');

    return `Found ${results.length} relevant knowledge base entries:\n\n${context}`;
  }
});

/**
 * Research agent
 *
 * This agent is used to research the lead and return a comprehensive report
 */
export const researchAgent = new Agent({
  model: 'openai/gpt-5',
  system: `
  You are a researcher to find information about a lead. You are given a lead and you need to find information about the lead.
  
  You can use the tools provided to you to find information about the lead: 
  - search: Searches the web for information
  - queryKnowledgeBase: Queries the knowledge base for the given query
  - fetchUrl: Fetches the contents of a public URL
  - crmSearch: Searches the CRM for the given company name
  - techStackAnalysis: Analyzes the tech stack of the given domain
  
  Synthesize the information you find into a comprehensive report.
  `,
  tools: {
    search,
    queryKnowledgeBase,
    fetchUrl,
    crmSearch,
    techStackAnalysis
    // add other tools here
  },
  stopWhen: [stepCountIs(20)] // stop after max 20 steps
});
