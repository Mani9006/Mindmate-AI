# MindMate AI Service

A production-ready AI pipeline service for mental health companionship, featuring Claude API integration, emotion-aware responses, vector-based memory retrieval, and text-to-speech synthesis.

## Features

- **FastAPI Server**: High-performance async API with middleware, CORS, and security
- **Claude API Client**: Retry logic, token counting, context management
- **Hume AI Integration**: Emotion detection webhook handler
- **Pinecone RAG**: Vector-based memory retrieval for context-aware responses
- **Prompt Assembly**: Dynamic system prompts with emotion and memory context
- **Response Parsing**: Task extraction and crisis signal detection
- **ElevenLabs TTS**: High-quality voice synthesis

## Architecture

```
mindmate-ai/
├── main.py                 # FastAPI application entry point
├── config/
│   ├── settings.py         # Environment-based configuration
│   └── logging_config.py   # Structured JSON logging
├── src/
│   ├── models.py           # Pydantic data models
│   ├── claude_client.py    # Anthropic Claude API client
│   ├── memory_store.py     # Pinecone vector store
│   ├── emotion_handler.py  # Hume AI webhook handler
│   ├── prompt_assembler.py # Prompt assembly with context
│   ├── response_parser.py  # Response parsing & task extraction
│   ├── tts_service.py      # ElevenLabs TTS integration
│   └── chat_service.py     # Main chat orchestration
└── tests/                  # Test suite
```

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Run the Server

```bash
# Development
python main.py

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 4. Docker

```bash
docker-compose up -d
```

## API Endpoints

### Chat
```http
POST /chat
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "message": "I'm feeling anxious today",
  "user_id": "user123",
  "session_id": "session456",
  "include_voice_response": true
}
```

### Health Check
```http
GET /health
```

### Text-to-Speech
```http
POST /tts
Content-Type: application/json

{
  "text": "Hello, how can I help you today?"
}
```

### Hume AI Webhook
```http
POST /webhooks/hume
X-Hume-Signature: sha256=SIGNATURE

{
  "job_id": "job123",
  "status": "completed",
  "user_id": "user123",
  "predictions": [...]
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Claude API key | Required |
| `PINECONE_API_KEY` | Pinecone API key | Required |
| `OPENAI_API_KEY` | OpenAI API key (embeddings) | Required |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | Required |
| `HUME_API_KEY` | Hume AI API key | Optional |
| `API_KEY` | Service API key for authentication | Required |
| `REDIS_URL` | Redis connection URL | redis://localhost:6379/0 |

## Component Details

### Claude Client (`src/claude_client.py`)

- **Retry Logic**: Exponential backoff with jitter for rate limits and timeouts
- **Token Counting**: Context management to stay within model limits
- **Streaming**: Support for streaming responses
- **Usage Tracking**: Cumulative token and cost tracking

```python
from src.claude_client import get_claude_client

client = get_claude_client()
response = await client.generate_response(
    messages=[{"role": "user", "content": "Hello"}],
    system_prompt="You are a helpful assistant."
)
```

### Memory Store (`src/memory_store.py`)

- **Vector Search**: Semantic similarity search using Pinecone
- **Embedding Generation**: OpenAI embeddings with caching
- **Recency Boosting**: Recent memories weighted higher
- **Emotion Filtering**: Search by emotion tags

```python
from src.memory_store import get_memory_store
from src.models import Memory

store = get_memory_store()

# Store memory
memory = Memory(user_id="user123", content="User loves hiking")
await store.store_memory(memory)

# Retrieve memories
memories = await store.retrieve_memories(
    user_id="user123",
    query="outdoor activities"
)
```

### Emotion Handler (`src/emotion_handler.py`)

- **Webhook Verification**: HMAC signature validation
- **Emotion Mapping**: Hume emotions to internal types
- **Aggregation**: Multi-source emotion fusion
- **Session Context**: Emotion history per session

### Prompt Assembler (`src/prompt_assembler.py`)

- **Dynamic Prompts**: Context-aware system prompts
- **Emotion Guidance**: Tone adaptation based on emotions
- **Memory Integration**: Relevant memories in context
- **Crisis Protocol**: Special handling for crisis situations

### Response Parser (`src/response_parser.py`)

- **Task Extraction**: Parse [TASK:type] markers
- **Crisis Detection**: Keyword-based crisis identification
- **Implicit Tasks**: Detect task suggestions in text
- **Response Cleaning**: Remove markers from final output

### TTS Service (`src/tts_service.py`)

- **Voice Synthesis**: ElevenLabs API integration
- **Caching**: Avoid redundant API calls
- **Streaming**: Support for audio streaming
- **Voice Selection**: Multiple voice options

## Crisis Detection

The service includes built-in crisis detection with configurable keywords and severity levels:

- **Critical**: Immediate attention required (suicide, self-harm)
- **High**: Serious concern (hopelessness, worthlessness)
- **Medium**: Monitor closely (giving up, no point)
- **Low**: General concern (depressed, anxious)

Crisis resources are automatically included in responses when detected.

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_claude_client.py
```

## Deployment

### Docker

```bash
# Build image
docker build -t mindmate-ai:latest .

# Run container
docker run -p 8000:8000 --env-file .env mindmate-ai:latest
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mindmate-ai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mindmate-ai
  template:
    metadata:
      labels:
        app: mindmate-ai
    spec:
      containers:
      - name: mindmate-ai
        image: mindmate-ai:latest
        ports:
        - containerPort: 8000
        envFrom:
        - secretRef:
            name: mindmate-ai-secrets
```

## Monitoring

The service exposes:

- `/health` - Health check endpoint
- `/stats` - Usage statistics and metrics
- Structured JSON logs for log aggregation

## License

MIT License - See LICENSE file for details
