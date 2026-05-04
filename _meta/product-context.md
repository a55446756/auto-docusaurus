# FiOS — Product Context

> Context for anyone (or any AI) writing wiki/documentation pages for this product.
> Read this before drafting. It defines what FiOS is, who reads our docs, and how we talk about the product.

---

## 1. What FiOS is

FiOS is a business-development platform for consultancies. It takes a consultancy's existing workflow — find opportunities, match the right people to them, write a bid — and removes the manual drudgery from each step.

It is built and operated by **Eolas Solutions**, a Canberra-based consultancy founded by Patrick O'Neill CSC. Eolas built FiOS for itself first (to fix its own admin pain) and now offers it to other consultancies facing the same problem.

The platform has three modules, and they are intentionally ordered as a workflow:

1. **Opportunity Tracker** — pulls opportunities from tender portals, mailing lists, and websites into one dashboard, with each opportunity summarised (location, work type, requirements, deadlines) so the user doesn't have to read 50-page PDFs to triage.
2. **Talent Wall** — a single source of truth for the consultancy's people: skills, experience, security clearances, availability. CVs go in once; structured profiles come out.
3. **Bid Builder** — combines an opportunity from module 1 with selected candidates from module 2 to produce a compliant, formatted bid document ready for finishing touches.

The product promise, in the company's own words: *"See more. Bid more. Win more."*
The mission: *"To take the administrative weight off your shoulders so you can focus on the work that matters — winning opportunities and delivering for your clients."*

---

## 2. Who reads our wiki

Two main audiences. Write for both, but lean toward the first.

**Primary: customers of FiOS — directors, BD leads, and operations people at small-to-mid consultancies.**
- Mostly Australian, often Canberra-based, frequently in the government/defence consulting space.
- Comfortable with technology but not engineers. They care about *what it does for them*, not implementation detail.
- Time-poor. They are reading the wiki because something didn't behave as they expected, or they want to know whether a feature exists.
- Already know the consulting workflow inside out — don't explain what a tender or a panel is.

**Secondary: Eolas's own team (BD, ops, support) — internal reference.**
- They need accurate, current detail. They will notice if something is out of date or contradicts the UI.

We are **not** writing for: developers integrating with FiOS, procurement evaluators, or first-time visitors who don't know what the product is. Marketing/positioning lives on the website; the wiki is reference material.

---

## 3. Voice and tone

FiOS's external voice is plain, direct, and slightly weary on the user's behalf — "we know how this weekend ends." Wiki docs should keep the *plain and direct* part, drop most of the weariness, and stay practical.

- Short sentences. Active voice. Concrete nouns.
- Address the reader as **you**. Refer to FiOS as **FiOS** (or "the platform"); refer to the company as **Eolas** or **Eolas Solutions**.
- Australian English spelling: *organised, analysed, customisable, prioritise, behaviour*. Not *organized, analyzed*.
- It's fine to be a bit dry/wry when describing a pain point the feature solves ("so you're not still logging into AusTender at lunchtime"). It is not fine to be salesy.
- No exclamation marks. No emoji.

---

## 4. Terminology — use these, not those

Consistency matters more than elegance. Pick the term on the left, even if a synonym would read more naturally.

| Use | Don't use |
|---|---|
| Opportunity | Lead, deal, prospect |
| Bid | Proposal *(unless quoting a client)*, submission |
| Tender | RFP, RFQ *(generic terms — fine in passing, but "tender" is the house word)* |
| Candidate / person | Resource, headcount, FTE |
| Talent Wall | Talent pool, talent database |
| Opportunity Tracker | Opportunity dashboard, pipeline tool |
| Bid Builder | Proposal generator, document builder |
| Clearance (NV1 / NV2 / Baseline) | Security level, vetting |
| Panel | Framework, vendor list |
| AusTender | The portal *(when AusTender specifically is meant)* |
| Consultancy | Firm, agency, vendor |
| Match (verb) — "candidates matched to the opportunity" | Recommended, suggested, ranked *(ranked is OK as a secondary term)* |

**Capitalisation:** *FiOS* (lowercase i, uppercase F-O-S — never *Fios*, *FIOS*, or *fios*). *Opportunity Tracker*, *Talent Wall*, *Bid Builder* are proper nouns and stay capitalised. *Eolas Solutions* — both words capitalised.

**Workflow vocabulary** (use consistently when describing the end-to-end flow): *opportunity arrives → candidates matched → team selected → bid generated*.

---

## 5. Things to avoid

- **Don't oversell.** Don't claim FiOS "automates bidding" or "wins work." It removes admin from a process the consultancy still owns. The user still chooses which opportunities to bid on, which people to put forward, and what to write in the bid. FiOS reduces the manual cost of those decisions.
- **Don't promise specific numbers** unless they're in this file or can be cited from product data. No invented "saves 30 hours a week" stats.
- **Don't compare FiOS to named competitors.** If a competitive distinction is genuinely useful in a doc, describe the *category* ("generic CRMs"), not a company.
- **Don't describe the AI as magic.** It does specific things — extracts fields from CVs, summarises tender documents, ranks candidate–opportunity fit. Say what it does, not that it's "powered by AI."
- **Don't describe data handling loosely.** Customers care about this. The accurate framing: each customer gets dedicated infrastructure (their own server and database), hosted under their domain, with role-based access and audit trails. Don't go beyond that without checking.
- **Don't reference customer names** in the wiki unless explicitly cleared. Patrick's defence-and-government background (Defence, Treasury, AEC, ACT Emergency Services, ADF operations) is fine to mention as Eolas's pedigree, since it's already public on the site. Specific FiOS customers are not.
- **Don't assume the user is on a particular plan or tier.** If a feature is configurable per customer (most of them are), say so.
- **Don't use generic SaaS phrases**: "leverage synergies," "best-in-class," "seamlessly," "robust," "world-class," "cutting-edge," "supercharge." If a sentence could appear unchanged on any other B2B SaaS site, rewrite it.

---

## 6. Quick reference — recurring concepts

A few ideas come up across many pages. Use these framings:

- **The "Monday morning" frame.** The product's mental model is "Monday morning, the old way" (logging into portals, chasing CVs in a spreadsheet, finding out about a tender on Friday) versus "Monday morning with FiOS" (opportunities already triaged, candidates already matched, bid already scaffolded). Useful for feature explanations.
- **"Scale without scaling admin."** The growth problem FiOS solves: a consultancy at 5 people can run on spreadsheets; at 20 it's painful; at 50 it's untenable, and the only options are hiring admin staff (margin-killing) or stopping growth. FiOS is the third option.
- **"While competitors are still logging in."** Speed of response is a real competitive edge in tender work. Many features tie back to this.
- **Built by consultants, for consultants.** When explaining *why* something works the way it does, it's often because Eolas hit that exact problem first. This is fine to lean on — it's true and it differentiates the product from tools built by people who've only read about the workflow.

---

*If something in a doc you're writing doesn't fit this guide and the guide seems wrong, flag it — this file should evolve with the product, not constrain it forever.*
