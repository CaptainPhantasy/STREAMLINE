# 🎤 CRM AI Pro Voice Agent Integration

Complete guide for wiring together and testing the LLM Router, Voice Agent front-end, MCP server, and ElevenLabs integration.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ElevenLabs    │────│    MCP Server   │────│   CRM API       │
│   Voice Agent   │    │   (Node.js)     │    │   (Next.js)     │
│ agent_6501katr- │    │                 │    │                 │
│ be2re0c834kfes3h│    │ • create_job     │    │ • /api/voice-   │
│ vk2d            │    │ • search_contacts│    │   command      │
└─────────────────┘    │ • update_job     │    │ • /api/mcp      │
                       │ • send_email     │    │ • /api/llm      │
┌─────────────────┐    └─────────────────┘    └─────────────────┘
│   Voice Front-  │                              │
│   end (React)   │◄─────────────────────────────┘
│                 │
│ • Voice Demo    │
│ • Command Handler│
│ • Context Mgmt  │
└─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Supabase CLI
- API keys (OpenAI, Anthropic, ElevenLabs, Resend)

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your API keys
# Required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# Required: OPENAI_API_KEY or ANTHROPIC_API_KEY
# Required: ELEVENLABS_API_KEY, RESEND_API_KEY
```

### 2. Development Environment Setup

```bash
# Install all dependencies and setup environment
npm run setup:dev

# This will:
# - Install MCP server dependencies
# - Configure Docker environment
# - Setup ElevenLabs agent integration
# - Deploy Supabase edge functions
```

### 3. Start All Services

```bash
# Start CRM app + MCP server (recommended for development)
npm run dev:full

# Or start everything including local Supabase
npm run dev:production

# Services will be available at:
# - CRM App: http://localhost:3000
# - MCP Server: http://localhost:3001
# - Voice Demo: http://localhost:3000/voice-demo
```

### 4. Health Check

```bash
# Verify all services are running
npm run health-check
```

### 5. Test Voice Agent Integration

```bash
# Run comprehensive integration tests
npm run test:voice-agent
```

## 🔧 Component Details

### LLM Router (`lib/llm/`)
- **Purpose**: Intelligent routing between OpenAI, Anthropic, and other LLM providers
- **Features**: Cost optimization, fallback support, caching, rate limiting
- **API**: `POST /api/llm` with `useCase`, `prompt`, `tools`, etc.
- **Integration**: Used by voice command processing for natural language understanding

### Voice Front-end (`components/voice/`, `app/(dashboard)/voice-demo/`)
- **Purpose**: React components for voice interaction
- **Features**: Speech recognition, text-to-speech, command parsing
- **Components**:
  - `VoiceCommandHandler`: Main coordination component
  - `VoiceNavigator`: Handles navigation commands
  - `VoiceSelectionDialog`: Multiple choice selection
- **Demo**: `/voice-demo` page for testing

### MCP Server (`mcp-server/`)
- **Purpose**: Model Context Protocol server for ElevenLabs voice agent
- **Features**: CRM tool execution (create jobs, search contacts, etc.)
- **Tools**: `create_job`, `search_contacts`, `get_job`, `update_job_status`, `assign_tech`, `send_email`
- **Integration**: Connected to ElevenLabs agent `agent_6501katrbe2re0c834kfes3hvk2d`

### ElevenLabs Integration
- **Agent ID**: `agent_6501katrbe2re0c834kfes3hvk2d`
- **Configuration**: MCP server URL + Bearer token authentication
- **Tools**: All MCP server tools available to voice agent
- **Setup**: Automatic configuration via `npm run elevenlabs:configure`

## 🧪 Testing Strategy

### Unit Tests
```bash
npm run test:unit
```

### E2E Tests
```bash
npm run test:e2e
```

### Voice Agent Integration Tests
```bash
npm run test:voice-agent
```

### LLM Router Tests
```bash
npm run test:llm-router
npm run test:llm-router-comprehensive
```

## 📋 Development Workflow

### 1. Local Development
```bash
# Start services
npm run dev:full

# Make changes to any component
# - CRM app auto-reloads
# - MCP server requires restart: npm run logs:mcp

# Test changes
npm run health-check
npm run test:voice-agent
```

### 2. Testing Voice Commands
1. Open http://localhost:3000/voice-demo
2. Try commands like:
   - "Create a job for John Smith to fix a leaky faucet"
   - "Search for contacts named John"
   - "Update job status to completed"
   - "Send an email to john@example.com"

### 3. Debugging
```bash
# View all logs
npm run logs

# View specific service logs
npm run logs:crm      # CRM app logs
npm run logs:mcp      # MCP server logs

# Stop all services
npm run stop

# Full cleanup and restart
npm run stop:full
npm run dev:full
```

## 🔐 Security & Configuration

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LLM Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Voice Agent
ELEVENLABS_AGENT_ID=agent_6501katrbe2re0c834kfes3hvk2d
ELEVENLABS_API_KEY=your-elevenlabs-key

# Email
RESEND_API_KEY=your-resend-key

# Development
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Authentication
- **CRM App**: Supabase Auth (users, roles: owner/admin/dispatcher/tech)
- **MCP Server**: Bearer token or API key authentication
- **ElevenLabs**: MCP server URL with auth headers

## 🚀 Production Deployment

### Docker Build
```bash
# Build production images
docker-compose -f docker-compose.yml build

# Start production stack
docker-compose --profile production up -d
```

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Update ElevenLabs agent configuration
# Point to production MCP server URL
```

## 🔍 Troubleshooting

### Common Issues

**1. Services won't start**
```bash
# Check Docker
docker-compose ps
docker-compose logs

# Check environment variables
npm run validate-env
```

**2. Voice commands not working**
```bash
# Test MCP server directly
npm run test:mcp-server

# Check LLM router
npm run test:llm-router
```

**3. ElevenLabs connection issues**
```bash
# Verify agent configuration
curl -H "Authorization: Bearer your-token" http://localhost:3000/api/mcp

# Check ElevenLabs dashboard
# Ensure agent points to correct MCP server URL
```

**4. Database connection issues**
```bash
# Test Supabase connection
npm run validate:e2e-flows

# Check Supabase status
# Verify RLS policies are correct
```

### Logs & Debugging
```bash
# All service logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f crm-app
docker-compose logs -f mcp-server

# Application logs
tail -f /app/logs/*.log
```

## 📊 Performance Monitoring

### Health Endpoints
- CRM App: `GET /api/health`
- MCP Server: `GET /health`
- LLM Router: `GET /api/llm/health`

### Metrics
- Response times tracked via LLM router client
- Error rates logged to console/monitoring
- Token usage tracked for cost optimization

## 🎯 Success Criteria

### Functional Tests (98%+ pass rate required)
- ✅ Voice command processing
- ✅ MCP tool execution
- ✅ LLM router fallback
- ✅ ElevenLabs integration
- ✅ End-to-end conversation flow

### Performance Targets
- Voice command response: <3 seconds
- MCP tool execution: <2 seconds
- LLM router fallback: <5 seconds
- System availability: 99.9%

### Security Requirements
- No hardcoded credentials
- Proper authentication on all APIs
- RLS policies enforced
- Input validation and sanitization

---

## 📞 Support

For issues with:
- **CRM App**: Check `/app/api/` routes and Next.js logs
- **MCP Server**: Check `mcp-server/` and stdio logs
- **Voice Agent**: Check ElevenLabs dashboard and agent configuration
- **LLM Router**: Check `lib/llm/` and router client integration

Run `npm run health-check` first, then check specific service logs.
