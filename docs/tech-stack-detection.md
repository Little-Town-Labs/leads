# Tech Stack Detection

Implementation of website technology detection using `simple-wappalyzer` for AI-powered lead qualification.

## Overview

The tech stack analysis tool automatically identifies technologies used by a prospect's website during the research phase. This enables:

- **Better lead scoring**: Identify tech-savvy companies vs traditional ones
- **Personalized outreach**: Reference specific technologies in emails
- **Competitive intelligence**: See if they're using competitor products
- **Lead prioritization**: Modern stack = tech-forward company

## Implementation

### Technology: simple-wappalyzer

**Why this choice?**
- ✅ **Free forever** - No API costs or rate limits
- ✅ **Self-hosted** - Runs in your serverless functions
- ✅ **Maintained** - Updates via `pnpm update`
- ✅ **Good accuracy** - 70-80% detection rate

**Location**: [lib/services.ts:145-254](../lib/services.ts#L145-L254)

### How It Works

```typescript
// 1. AI research agent can call this tool
const agent = new Agent({
  tools: {
    techStackAnalysis,  // Automatically available
    // ... other tools
  }
});

// 2. Tool fetches website and analyzes HTML/headers
await techStackAnalysis.execute({ domain: 'example.com' });

// 3. Returns formatted report grouped by category
```

### Example Output

```
Tech Stack Analysis for vercel.com:

PaaS:
  - Amazon Web Services
  - Vercel

JavaScript frameworks:
  - React
  - Next.js (v14.0.0)

Security:
  - HSTS

CDN:
  - Amazon S3

Miscellaneous:
  - Webpack

Total technologies detected: 7
```

## Detection Accuracy

| Technology Type | Detection Rate |
|-----------------|----------------|
| Server-side frameworks (Laravel, Django) | 90-95% ✅ |
| CMS platforms (WordPress, Shopify) | 95%+ ✅ |
| Static frameworks (Bootstrap, Tailwind) | 85-90% ✅ |
| Backend in headers (nginx, Apache) | 90%+ ✅ |
| Analytics in HTML (Google Analytics) | 80-85% ⚠️ |
| JS frameworks in HTML (React, Vue) | 70-80% ⚠️ |
| Dynamically loaded JS | 20-40% ❌ |
| SPA frameworks (Next.js detection) | 60-70% ⚠️ |

## Maintenance

### Quarterly Updates

Run this command every 3 months to get latest technology signatures:

```bash
pnpm update simple-wappalyzer
```

### No Configuration Required

- No API keys needed
- No environment variables
- Works out of the box

## Cost Analysis

| Solution | Monthly Cost | Setup Time | Maintenance |
|----------|--------------|------------|-------------|
| **simple-wappalyzer** (current) | $0 | 30 min | 5 min/quarter |
| Wappalyzer API (free tier) | $0 (50/month) | 10 min | 0 |
| Wappalyzer API (paid) | $250+ | 10 min | 0 |
| WhatRuns Pro | $22 | 1 hour | 0 |

## Upgrade Path

If you outgrow simple-wappalyzer:

### Option A: Wappalyzer Official API
**When**: Need 94%+ accuracy or >1000 lookups/month
```bash
# Add to .env
WAPPALYZER_API_KEY=wap_xxx

# Update lib/services.ts
const result = await fetch(
  `https://api.wappalyzer.com/v2/lookup/?urls=${url}`,
  { headers: { 'x-api-key': process.env.WAPPALYZER_API_KEY } }
);
```

### Option B: Hybrid Approach
**When**: Want free tier + fallback
```typescript
async function detectTechStack(domain: string) {
  try {
    return await wappalyzerAPI(domain); // Try API first
  } catch (error) {
    if (error.code === 'RATE_LIMIT') {
      return await simpleWappalyzer(domain); // Fallback
    }
    throw error;
  }
}
```

## Testing

Test the implementation:

```typescript
// Quick test
import { techStackAnalysis } from '@/lib/services';

const result = await techStackAnalysis.execute({
  domain: 'wordpress.org'
});

console.log(result);
// Output: Tech Stack Analysis for wordpress.org...
```

## Troubleshooting

### No technologies detected

**Cause**: Website uses custom-built solutions or SPAs
**Solution**: This is expected - not all sites are detectable

### Timeout errors

**Cause**: Slow website or network issues
**Solution**: Tool has 10-second timeout, returns error gracefully

### Wrong technologies detected

**Cause**: False positives from similar patterns
**Solution**: Update package or switch to Wappalyzer API

## Usage in Workflows

The tool is automatically available to the AI research agent:

```typescript
// workflows/inbound/steps.ts
export const stepResearch = async (lead: Lead) => {
  'use step';

  const { text: research } = await researchAgent.generate({
    prompt: `Research the lead: ${JSON.stringify(lead)}`
  });

  // AI agent can autonomously call techStackAnalysis
  // during research if it determines it's useful

  return research;
};
```

## AI Agent Prompt

The research agent is instructed:

> You can use the tools provided to you to find information about the lead:
> - techStackAnalysis: Analyzes the tech stack of the given domain

The AI decides when tech stack analysis adds value to qualification.

## Best Practices

1. **Don't force it**: Let AI agent decide when to use the tool
2. **Accept gaps**: 70-80% detection is good enough for most B2B
3. **Update quarterly**: Set calendar reminder for `pnpm update`
4. **Monitor value**: Track if tech stack data improves conversions
5. **Upgrade when ready**: Switch to paid API if you have revenue + high volume

## Cost-Benefit Analysis

**Pre-revenue** (current stage):
- ✅ Use simple-wappalyzer (free, unlimited)
- ❌ Don't pay for APIs yet

**Early revenue** ($1-10k MRR):
- ✅ Keep using simple-wappalyzer
- ✅ Track impact on deal closure
- ❌ Don't upgrade unless proven valuable

**Growth stage** ($10k+ MRR):
- ✅ Consider Wappalyzer API if processing >1000 leads/month
- ✅ Or continue with free version if accuracy is acceptable
- ✅ ROI analysis: Does tech stack data close >$250/month in deals?

## Further Reading

- [simple-wappalyzer GitHub](https://github.com/Kikobeats/simple-wappalyzer)
- [Wappalyzer Official API](https://www.wappalyzer.com/api/)
- [Technology Detection Methods](https://github.com/wappalyzer/wappalyzer)
