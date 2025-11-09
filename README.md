````md
# PlanRAG AI – Backend

PlanRAG is a small RAG backend that turns each question into an explicit plan:

> **FIND → FILTER → JOIN → VERIFY**

This repo exposes a simple HTTP API so **your app / company** can:

- **Ingest** your internal docs into a vector DB  
- **Ask** questions and get:
  - A final **answer**
  - A **plan trace** (what steps ran)
  - **Evidence** (which doc chunks were used)

---

## 1. Setup

### Requirements

- Node.js **18+**
- npm
- A [Pinecone](https://www.pinecone.io/) account with an index:
  - Dimension: **384**
  - Example name: `planrag`
- A [Groq](https://groq.com/) API key (for answer generation)

### Install

```bash
git clone https://github.com/your-org/planrag-backend.git
cd planrag-backend

npm install
````

### Environment

Create a `.env` file in the project root:

```bash
PORT=3000

PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX_NAME=planrag   # or the name of your Pinecone index

GROQ_API_KEY=your-groq-key

# Optional: override if you change the demo key/org in code
# DEMO_API_KEY=prg_live_skyscale_demo
# DEMO_ORG_ID=org_skyscale_demo
```

The backend uses a simple demo auth layer that checks:

```http
x-api-key: prg_live_skyscale_demo
```

You can remove or replace this in `ingestController` / `askController` if you want real auth.

---

## 2. Running the server

From the project root:

```bash
npm run dev     # if you use nodemon, or
npm start       # plain node
```

By default the API listens on:

```text
http://localhost:3000
```

Health check:

```http
GET /
→ { "status": "ok", "service": "planrag-backend" }
```

---

## 3. Ingesting docs

Use this to push your docs (runbooks, FAQs, KB articles, postmortems, etc.) into PlanRAG.

### 3.1 JSON ingest (pasted or text-like content)

**Endpoint**

```http
POST /ingest
x-api-key: prg_live_skyscale_demo
Content-Type: application/json
```

**Request body (recommended shape)**

```jsonc
{
  "tenant_id": "skyscale-prod",
  "service_name": "checkout",
  "region": "us-east-1",
  "document": {
    "title": "P1 – Checkout latency in us-east-1",
    "tags": ["p1", "checkout", "latency", "us-east-1"],
    "content": "# P1 Runbook: Checkout latency in us-east-1\n\n1. Open Grafana dashboard ...",
    "original_filename": "p1-checkout-latency-us-east-1-runbook.md"
  }
}
```

The backend maps this into its internal ingestion shape and calls the `ingestDocument` pipeline, which:

* Chunks the text
* Embeds each chunk
* Writes into Pinecone with metadata such as `tenant_id`, `service_name`, `region`, `tags`, etc.

### 3.2 File / PDF ingest (multipart)

If you send **multipart/form-data** with a `file` field, the same `/ingest` endpoint can handle uploads:

**Endpoint**

```http
POST /ingest
x-api-key: prg_live_skyscale_demo
Content-Type: multipart/form-data
```

**Form fields**

* `tenant_id` (required)
* `service_name` (optional but recommended)
* `region` (optional but recommended)
* `title` (optional – falls back to filename)
* `tags` (optional, comma-separated string like `"p1, checkout, us-east-1"`)
* `file` (required) – `.txt`, `.md`, `.log`, `.json`, `.pdf`, etc.

For **PDFs**, the backend parses the PDF to text (using `pdf-parse`) before ingesting into Pinecone.

---

## 4. Asking questions

Use this to query the ingested docs. PlanRAG does:

1. **FIND**: retrieve top-k chunks from Pinecone
2. **FILTER**: keep only relevant snippets
3. **JOIN**: assemble context & call LLM
4. **VERIFY**: return answer + evidence

**Endpoint**

```http
POST /ask
x-api-key: prg_live_skyscale_demo
Content-Type: application/json
```

**Example request**

```jsonc
{
  "tenant_id": "skyscale-prod",
  "question": "Users say checkout is slow in us-east-1. What should I check first?",
  "context": {
    "service_name": "checkout",
    "region": "us-east-1"
  }
}
```

**Example response shape (simplified)**

```jsonc
{
  "answer": "High-level answer text from LLM",
  "plan_trace": [
    "FIND: retrieved top 10 chunks for checkout + us-east-1",
    "FILTER: kept 5 chunks highly related to latency runbook",
    "JOIN: built context and generated answer",
    "VERIFY: checked that at least one P1 runbook snippet was used"
  ],
  "evidence": [
    {
      "doc_id": "checkout_p1_latency_2025",
      "snippet": "Open Grafana dashboard checkout/core-us-east-1 ...",
      "metadata": {
        "service_name": "checkout",
        "region": "us-east-1",
        "doc_type": "runbook",
        "tags": ["p1", "latency"]
      }
    }
  ]
}
```

The exact response structure can be extended with additional debug info, trace steps, or raw chunks.

---

## 5. Demo frontend

A simple demo frontend wired to this backend lives here:

> **Demo:** [https://hackathon1-main.vercel.app/](https://hackathon1-main.vercel.app/)

The demo talks to the same `/ask` and `/ingest` endpoints using the demo API key:

```http
x-api-key: prg_live_skyscale_demo
```

You can:

* Inject runbooks / postmortems / guides for services like `search`, `checkout`, `notifications`
* Ask natural-language questions and see:

  * A large ANSWER block
  * An EVIDENCE panel showing where the answer came from (doc + chunk info)
  * A RESOURCES section listing the documents / links used

---

## 6. Test questions

Once you’ve ingested the example docs (especially the checkout + notifications markdowns), you can use these questions to verify that PlanRAG is pulling the right evidence.

### 6.1 Checkout – DB connection exhaustion postmortem

*(doc: `postmortem-2025-05-02-checkout-db-connection-exhaustion.md`)*
Use with context: `service_name = "checkout"`, `region = "us-east-1"`

1. **“Did we have any past incidents where checkout in us-east-1 exhausted the DB connection pool? What was the root cause?”**

2. **“In the previous checkout DB connection exhaustion incident, what were the main action items we agreed on?”**

3. **“What went wrong in the last checkout incident related to tenant_sync_worker, and how are we supposed to prevent that now?”**

Expected behavior:

* Answer should reference the **postmortem** doc, including:

  * Background job `tenant_sync_worker`
  * Connection pool exhaustion
  * High-level timeline and the action items section

---

### 6.2 Notifications – delivery failures

*(doc: `notifications-delivery-failures-runbook.md`)*
Use with context: `service_name = "notifications"`

4. **“Merchants report that order confirmation emails are not being delivered. How do I triage notifications delivery failures?”**

5. **“If SMS delivery rate drops below 95% for a few tenants, what checks and mitigations should I follow?”**

6. **“How do I decide whether a notifications delivery incident is provider-related or misconfiguration on our side?”**

Expected behavior:

* RAG should pull from the **notifications delivery runbook**, including:

  * Dashboards: `notifications/delivery-overview`
  * Channel-specific checks (email / SMS / push)
  * Provider status vs configuration issues
  * Escalation rules and post-incident steps

---

### 6.3 Notifications – rate limits & retries

*(doc: `notifications-rate-limits-and-retries-guide.md`)*
Use with context: `service_name = "notifications"`

7. **“During a big marketing campaign, how can I safely raise notifications rate limits without causing provider throttling?”**

8. **“What’s our retry behavior for transient vs permanent notification errors, and how should I tune it during provider incidents?”**

9. **“If the notifications retry queue is growing a lot during a provider outage, what steps should I take to protect critical flows?”**

Expected behavior:

* Answers should be grounded in the **rate limits & retries guide**, mentioning:

  * Per-tenant vs global limits
  * Retry behavior for transient vs permanent errors
  * Protecting critical flows (order confirmation, password reset, 2FA)
  * Adjusting limits and backoff during provider incidents

---

## 7. Notes & customization

* You can change the demo API key / org ID in:

  * `src/controllers/ingestController.js`
  * `src/controllers/askController.js`
* The LLM layer lives in `src/services/llmService.js` and:

  * Receives the top evidence chunks from Pinecone
  * Produces an answer + plan style explanation
  * Is prompted to always use **only** your internal docs

This backend is intentionally small so you can:

* Swap out Pinecone for another vector DB,
* Switch models (e.g., different Groq model or OpenAI),
* Extend the plan trace logic with more detailed pipeline steps.

```
::contentReference[oaicite:0]{index=0}
```
