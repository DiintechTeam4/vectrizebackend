# RAG System API Documentation

## Overview
This RAG (Retrieval-Augmented Generation) system provides a multi-tenant gRPC service that combines document storage, vector similarity search, and LLM-powered intelligent responses. The system supports client isolation, ensuring each client's data remains separate.

## Key Features Implemented
- ✅ **Multi-tenant Architecture**: Complete client isolation using `client_id`
- ✅ **Vector Embeddings**: Amazon Bedrock Titan embeddings (1024 dimensions)
- ✅ **LLM Integration**: OpenAI GPT-3.5-turbo for intelligent responses
- ✅ **Document Processing**: URL-based document chunking and storage
- ✅ **Conversation History**: Context-aware responses with conversation tracking
- ✅ **Performance Monitoring**: Detailed latency tracking (RAG, LLM, Total)
- ✅ **Smart Response Logic**: Returns empty response if no client data exists

---

## API Endpoints

### 1. StoreData - Store Individual Text Data
Store individual text chunks with metadata for a specific client.

#### Request Format
```json
{
  "text": "Your text content here",
  "metadata": {
    "key1": "value1",
    "key2": "value2"
  },
  "client_id": "unique-client-identifier"
}
```

#### Field Details
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | ✅ **Required** | The text content to store |
| `metadata` | map<string,string> | ❌ Optional | Key-value pairs for additional information |
| `client_id` | string | ✅ **Required** | Unique identifier for client data isolation |

#### Response Format
```json
{
  "success": true,
  "message": "stored",
  "latency": "45.123ms"
}
```

#### Example Request
```json
{
  "text": "Machine learning is a subset of artificial intelligence that focuses on algorithms.",
  "metadata": {
    "topic": "AI",
    "source": "textbook",
    "chapter": "1"
  },
  "client_id": "client-123"
}
```

---

### 2. ProcessDocument - Process Document from URL
Download, chunk, and store a document from a URL with automatic text extraction and embedding generation.

#### Request Format
```json
{
  "url": "https://example.com/document.pdf",
  "book_name": "Document Title",
  "chapter_name": "Chapter Title",
  "client_id": "unique-client-identifier"
}
```

#### Field Details
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | ✅ **Required** | URL of the document to process |
| `book_name` | string | ✅ **Required** | Name/title of the document |
| `chapter_name` | string | ❌ Optional | Specific chapter or section name |
| `client_id` | string | ✅ **Required** | Unique identifier for client data isolation |

#### Response Format
```json
{
  "success": true,
  "message": "Document processed successfully",
  "total_batches": 5,
  "processed_chunks": 45,
  "total_latency": "12456.789ms",
  "chunking_latency": "8234.567ms",
  "embedding_latency": "4222.222ms"
}
```

#### Example Request
```json
{
  "url": "https://example.com/financial-report.pdf",
  "book_name": "Annual Financial Report 2024",
  "chapter_name": "Revenue Analysis",
  "client_id": "finance-team-001"
}
```

---

### 3. QueryData - Query with RAG and LLM
Search for relevant documents and optionally generate intelligent responses using LLM.

#### Request Format
```json
{
  "query_id": "unique-query-id",
  "session_id": "session-identifier",
  "history": [
    {
      "user": "Previous user message",
      "ai": "Previous AI response"
    }
  ],
  "query": "Your question here",
  "book_name": "Target document/book",
  "chapter_name": "Specific chapter",
  "client_id": "unique-client-identifier",
  "llm": "openai",
  "top_k": 5,
  "tts": false
}
```

#### Field Details
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query_id` | string | ✅ **Required** | Unique identifier for this query |
| `session_id` | string | ✅ **Required** | Session identifier for conversation tracking |
| `history` | array | ❌ Optional | Conversation history for context |
| `query` | string | ✅ **Required** | The question/search query |
| `book_name` | string | ✅ **Required** | Target document name for filtering |
| `chapter_name` | string | ❌ Optional | Specific chapter for filtering |
| `client_id` | string | ✅ **Required** | Client identifier for data isolation |
| `llm` | string | ✅ **Required** | LLM type: `"openai"`, `"rag_only"`, `"gemini"`, `"other"` |
| `top_k` | int32 | ✅ **Required** | Number of top results to retrieve (e.g., 5) |
| `tts` | bool | ❌ Optional | Text-to-speech flag (default: false) |

#### LLM Options
- `"openai"`: Uses OpenAI GPT-3.5-turbo for intelligent responses
- `"rag_only"`: Returns only RAG results without LLM processing
- `"gemini"`: Google Gemini (not implemented yet)
- `"other"`: Custom LLM (not implemented yet)

#### Response Format
```json
{
  "results": [
    {
      "text": "Relevant document chunk",
      "metadata": {
        "source": "document.pdf",
        "page": "5"
      },
      "score": 0.85
    }
  ],
  "latency": "774.118ms",
  "query_id": "test_001",
  "session_id": "session_a",
  "client_id": "1123564",
  "llm_response": "Generated intelligent answer from LLM",
  "rag_response": "Summary of RAG results",
  "rag_latency": "234.567ms",
  "llm_latency": "539.551ms"
}
```

#### Response Behavior
- **If no data exists for client**: Returns empty response immediately without LLM processing
- **If llm="rag_only"**: Returns `rag_response` and `results` array, `llm_response` is empty
- **If llm="openai"**: Returns `llm_response` with intelligent answer, `results` array is empty
- **Error handling**: If LLM fails, falls back to RAG-only response

#### Example Requests

**OpenAI LLM Query:**
```json
{
  "query_id": "query-001",
  "session_id": "session-abc",
  "query": "What are the key financial metrics for Q4?",
  "book_name": "Financial Report",
  "client_id": "finance-client-123",
  "llm": "openai",
  "top_k": 5
}
```

**RAG-Only Query:**
```json
{
  "query_id": "query-002",
  "session_id": "session-abc",
  "query": "Show me revenue data",
  "book_name": "Financial Report",
  "client_id": "finance-client-123",
  "llm": "rag_only",
  "top_k": 3
}
```

**Query with Conversation History:**
```json
{
  "query_id": "query-003",
  "session_id": "session-abc",
  "history": [
    {
      "user": "What is machine learning?",
      "ai": "Machine learning is a subset of AI that enables systems to learn from data."
    }
  ],
  "query": "Can you give me more examples?",
  "book_name": "AI Handbook",
  "client_id": "ai-team-456",
  "llm": "openai",
  "top_k": 5
}
```

---

## System Architecture

### Client Isolation
- Each client's data is completely isolated using `client_id`
- Database queries automatically filter by client ID
- No cross-client data leakage possible

### Embedding Strategy
- **Primary**: Amazon Bedrock Titan embeddings (1024 dimensions)
- **Fallback**: OpenAI embeddings (if Bedrock fails)
- Consistent vector dimensions ensure reliable similarity search

### LLM Integration
- **OpenAI GPT-3.5-turbo**: For intelligent, context-aware responses
- **Context-aware prompting**: Includes RAG results and conversation history
- **Graceful degradation**: Falls back to RAG-only if LLM fails

### Performance Monitoring
- **RAG Latency**: Time for embedding generation + vector search
- **LLM Latency**: Time for LLM processing (0ms if not used)
- **Total Latency**: End-to-end request processing time

---

## Environment Configuration

Required environment variables in `.env` file:
```bash
# OpenAI Configuration
OPENAI_API_KEY="sk-proj-your-openai-key-here"

# AWS Configuration (for Bedrock embeddings)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"

# Database Configuration
DATABASE_URL="your-postgresql-connection-string"
```

---

## Error Responses

All endpoints return appropriate error messages:

```json
{
  "error": "Descriptive error message",
  "latency": "12.345ms"
}
```

Common error scenarios:
- Missing required fields
- Invalid client_id
- Database connection issues
- LLM API failures (graceful degradation)
- Document processing failures

---

## Usage Examples

### Complete Workflow Example

1. **Store some data:**
```bash
curl -X POST localhost:50051/store \
  -d '{"text": "AI is transforming industries", "client_id": "demo-client", "metadata": {"topic": "AI"}}'
```

2. **Process a document:**
```bash
curl -X POST localhost:50051/process \
  -d '{"url": "https://example.com/ai-report.pdf", "book_name": "AI Report", "client_id": "demo-client"}'
```

3. **Query with OpenAI:**
```bash
curl -X POST localhost:50051/query \
  -d '{"query": "How is AI transforming industries?", "client_id": "demo-client", "llm": "openai", "top_k": 5, "query_id": "q1", "session_id": "s1", "book_name": "AI Report"}'
```

---

## Current Implementation Status

### ✅ Completed Features
- Multi-tenant client isolation
- Vector embeddings with Bedrock Titan
- OpenAI LLM integration
- Document processing from URLs
- Conversation history support
- Detailed latency tracking
- Empty response optimization
- Error handling and graceful degradation

### 🚧 Future Enhancements
- Google Gemini LLM support
- Custom LLM provider support
- Text-to-speech integration
- Advanced metadata filtering
- Caching layer for improved performance
- Rate limiting and authentication

---

## Testing

Use the provided test files:
- `test_grpc_client.go` - Go client examples
- `test.py` - Python client examples
- Postman collection available in project root

Server runs on `localhost:50051` by default.
