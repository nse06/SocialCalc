/** Copy-ready replies for common brand-deal moments. [Brackets] are placeholders. */
export interface EmailTemplate {
  id: string;
  title: string;
  when: string;
  body: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "quote",
    title: "Reply with your rate",
    when: "The brand sent a brief or asked for your rates.",
    body: `Hi [Name],

Thanks for reaching out — I love what [Brand] is doing with [product], and I think it'd be a great fit for my audience.

For [deliverables, e.g. one Instagram Reel], my rate is [$X]. That includes [terms, e.g. posting on my account only].

If you'd like to reuse the content in ads or on your own channels, I'm happy to add usage rights — just let me know the platforms and timeframe.

Looking forward to it,
[Your name]`,
  },
  {
    id: "budget-first",
    title: "Ask for their budget first",
    when: "The request is vague, or you want to hear their number before quoting yours.",
    body: `Hi [Name],

Thanks so much for thinking of me — this sounds like a great fit.

Before I send a quote, could you share a bit more?
• Which deliverables and platforms you have in mind
• Your timeline and posting window
• Whether you'd like usage rights (and for how long) or any exclusivity
• The budget you've set aside for this campaign

That'll help me put together the right package for you.

Best,
[Your name]`,
  },
  {
    id: "counter",
    title: "Counter a low offer",
    when: "Their budget is below your rate. Trade scope before you drop your price.",
    body: `Hi [Name],

Thanks for the offer — I'd love to make this work. For the full scope, my rate is [$X], which reflects [the usage / exclusivity / production involved].

If [$their budget] is firm, here's what I can do at that price:
• [Option A, e.g. one Reel without paid usage]
• [Option B, e.g. 30 days of usage instead of 90]

Happy to go with whichever works best for you.

Best,
[Your name]`,
  },
  {
    id: "usage",
    title: "Add a usage rights or whitelisting fee",
    when: "The brand asks to run your content as ads after you've agreed on the content.",
    body: `Hi [Name],

Great to hear you'd like to put paid media behind the content! Usage is priced separately from the content itself.

For [30 / 90] days of [paid usage / whitelisting through my account], the fee is [$X]. Extending later is easy — just let me know before the period ends.

I'll send an updated agreement with the usage terms.

Best,
[Your name]`,
  },
  {
    id: "gifted",
    title: "Turn a gifted offer into a paid one",
    when: "The brand offers free product but expects specific deliverables.",
    body: `Hi [Name],

Thank you for thinking of me — I'd genuinely love to try [product].

For sponsored content with specific deliverables and deadlines, I work on a paid basis. For [one Reel], my rate is [$X]. If you'd prefer to send the product with no posting requirements, I'm happy to share it if I love it, but I can't guarantee coverage.

Let me know which works best!
[Your name]`,
  },
  {
    id: "follow-up",
    title: "Follow up when they go quiet",
    when: "You sent a quote and haven't heard back in about a week.",
    body: `Hi [Name],

Just following up on my note from [day] about [campaign]. I'm still keen to work together and have availability in [month].

If the budget or scope has changed, I'm happy to adjust the package — just let me know what you have in mind.

Best,
[Your name]`,
  },
  {
    id: "decline",
    title: "Decline politely",
    when: "The fit, timing, or budget doesn't work — but you want to keep the door open.",
    body: `Hi [Name],

Thank you for reaching out — I really appreciate you thinking of me.

Unfortunately, this one isn't the right fit for me right now [because the timeline / budget doesn't work]. I'd love to stay in touch for future campaigns.

All the best,
[Your name]`,
  },
];
