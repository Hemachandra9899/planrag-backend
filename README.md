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
```
Environment

Create a .env file in the project root:

PORT=3000

PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX_NAME=planrag   # or the name of your Pinecone index

GROQ_API_KEY=your-groq-key


3. Ingesting docs

Use this to push your docs (runbooks, FAQs, KB articles, etc.) into PlanRAG.

Endpoint
POST /ingest
x-api-key: prg_live_skyscale_demo
Content-Type: application/json

