CRM AI PRO - Comprehensive File Tree Diagram~***

  **📁 Project Structure Overview**

  CRM-AI-PRO/
  ├── 🏗️ ****app/****                          # Next.js 14 App Router application
  │   ├── 📁 (auth)/                       # Authentication layout group
  │   │   ├── layout.tsx
  │   │   └── 📁 login/
  │   │       └── page.tsx
  │   │
  │   ├── 📁 (dashboard)/                  # Main dashboard layout (19 modules)
  │   │   ├── admin/                       # 🛠️ Admin management
  │   │   ├── analytics/                   # 📊 Analytics & reporting
  │   │   ├── calendar/                    # 📅 Calendar integration
  │   │   ├── contacts/                    # 👥 Customer management
  │   │   ├── csr/                         # 📞 Customer service representative
  │   │   ├── dispatch/                    # 🚗 Technician dispatch
  │   │   ├── estimates/                   # 💰 Job estimates
  │   │   ├── finance/                     # 💳 Financial management
  │   │   ├── inbox/                       # 📧 Message center
  │   │   ├── jobs/                        # 🔧 Work order management
  │   │   ├── marketing/                   # 📈 Marketing campaigns
  │   │   ├── messages/                    # 💬 Direct messaging
  │   │   ├── office/                      # 🏢 Office operations
  │   │   ├── owner/                       # 👑 Owner dashboard
  │   │   ├── parts/                       # 🔩 Parts inventory
  │   │   ├── reports/                     # 📋 Business reports
  │   │   ├── sales/                       # 🎯 Sales pipeline
  │   │   ├── settings/                    # ⚙️ System settings
  │   │   └── tech/                        # 👷 Technician view
  │   │
  │   ├── 📁 ****api/****                      # 🌐 241 API endpoints
  │   │   ├── account/                     # Account management
  │   │   ├── admin/                       # Admin operations
  │   │   ├── ai/                          # AI integration
  │   │   ├── analytics/                   # Analytics data
  │   │   ├── audit/                       # Audit logging
  │   │   ├── auth/                        # Authentication
  │   │   ├── automation-rules/            # Business automation
  │   │   ├── calendar/                    # Calendar operations
  │   │   ├── call-logs/                   # Communication tracking
  │   │   ├── campaigns/                   # Marketing campaigns
  │   │   ├── contact-tags/                 # Contact tagging
  │   │   ├── contacts/                    # Customer management
  │   │   ├── conversations/               # Messaging system
  │   │   ├── cron/                        # Scheduled tasks
  │   │   ├── dispatch/                    # Dispatch operations
  │   │   ├── documents/                   # File management
  │   │   ├── email/                       # Email integration
  │   │   ├── email-templates/             # Email template management
  │   │   ├── estimates/                   # Estimate management
  │   │   ├── export/                      # Data export
  │   │   ├── finance/                     # Financial APIs
  │   │   ├── geofencing/                  # Geofencing operations
  │   │   ├── gps/                         # GPS tracking
  │   │   ├── inbox/                       # Inbox management
  │   │   ├── integrations/                # Third-party integrations
  │   │   ├── inventory/                  # Inventory management
  │   │   ├── invoices/                    # Invoice management
  │   │   ├── job-materials/               # Parts tracking
  │   │   ├── job-photos/                  # Job documentation
  │   │   ├── jobs/                        # Work order APIs
  │   │   ├── leads/                       # Lead management
  │   │   ├── llm/                         # LLM router system
  │   │   ├── llm-providers/               # AI provider config
  │   │   ├── marketing/                   # Marketing operations
  │   │   ├── mcp/                         # Model Context Protocol
  │   │   ├── meetings/                    # Meeting management
  │   │   ├── messages/                    # Direct messaging
  │   │   ├── notifications/               # Alert system
  │   │   ├── office/                      # Office operations
  │   │   ├── onboarding/                  # User onboarding
  │   │   ├── owner/                       # Owner-specific APIs
  │   │   ├── parts/                       # Parts management
  │   │   ├── payments/                    # Payment processing
  │   │   ├── photos/                      # Photo management
  │   │   ├── reports/                     # Report generation
  │   │   ├── review-requests/             # Review requests
  │   │   ├── sales/                       # Sales operations
  │   │   ├── schedule/                    # Scheduling system
  │   │   ├── search/                      # Search functionality
  │   │   ├── seed/                        # Database seeding
  │   │   ├── send-message/                # Message sending
  │   │   ├── settings/                    # Settings management
  │   │   ├── signatures/                  # Signature capture
  │   │   ├── suppliers/                    # Supplier management
  │   │   ├── tech/                        # Technician APIs
  │   │   ├── techs/                       # Technician management
  │   │   ├── templates/                   # Template system
  │   │   ├── test/                        # Testing endpoints
  │   │   ├── time-entries/                # Time tracking
  │   │   ├── users/                       # User management
  │   │   ├── voice-command/               # Voice navigation
  │   │   └── webhooks/                    # External integrations
  │   │
  │   ├── 📁 error.tsx                        # Global error boundary
  │   ├── 📁 favicon.ico                      # Application icon
  │   ├── 📁 global-error.tsx                 # Root error handler
  │   ├── 📁 globals.css                      # Global styles
  │   ├── 📁 layout.tsx                       # Root layout
  │   ├── 📁 loading.tsx                      # Loading component
  │   └── 📁 page.tsx                         # Landing page
  │
  ├── 📁 ****components/****                   # React component library (35 modules)
  │   ├── 📁 admin/                        # Admin components
  │   ├── 📁 analytics/                    # Analytics components
  │   ├── 📁 calendar/                     # Calendar components
  │   ├── 📁 contacts/                     # Customer management UI
  │   ├── 📁 conversations/                # Messaging interface
  │   ├── 📁 dashboard/                    # Dashboard components
  │   ├── 📁 dispatch/                     # Dispatch management UI
  │   ├── 📁 documents/                    # File management UI
  │   ├── 📁 email-templates/              # Email template components
  │   ├── 📁 estimates/                    # Estimate components
  │   ├── 📁 export/                       # Data export tools
  │   ├── 📁 filters/                      # Advanced filtering
  │   ├── 📁 inbox/                        # Message inbox UI
  │   ├── 📁 integrations/                 # Integration components
  │   ├── 📁 inventory/                    # Inventory management UI
  │   ├── 📁 jobs/                         # Work order components
  │   ├── 📁 layout/                       # Layout components
  │   ├── 📁 marketing/                    # Marketing campaign UI
  │   ├── 📁 messaging/                     # Direct messaging UI
  │   ├── 📁 mobile/                       # Mobile-optimized components
  │   ├── 📁 notifications/                # Alert system UI
  │   ├── 📁 onboarding/                   # User onboarding flow
  │   ├── 📁 parts/                        # Parts management UI
  │   ├── 📁 photos/                       # Photo management UI
  │   ├── 📁 profile/                      # User profile components
  │   ├── 📁 reports/                      # Report generation UI
  │   ├── 📁 sales/                        # Sales pipeline components
  │   ├── 📁 scheduling/                   # Scheduling components
  │   ├── 📁 search/                       # Search interface
  │   ├── 📁 settings/                     # Settings components
  │   ├── 📁 tech/                         # Technician interface
  │   ├── 📁 templates/                    # Template management UI
  │   ├── 📁 ui/                           # 🎨 shadcn/ui component library (34 components)
  │   ├── 📁 voice/                        # Voice components
  │   └── 📁 voice-agent/                  # Voice AI interface
  │
  │   # Standalone voice-related components
  │   ├── conditional-voice-navigation-bridge.tsx
  │   ├── conditional-voice-widget.tsx
  │   ├── dual-voice-widget.tsx
  │   ├── voice-agent-overlay.tsx
  │   ├── voice-conversation-provider.tsx
  │   ├── voice-error-boundary.tsx
  │   ├── voice-navigation-bridge-simple.tsx
  │   ├── voice-navigation-bridge.tsx
  │   ├── voice-provider-selector.tsx
  │   └── voice-provider-wrapper.tsx
  │
  ├── 📁 ****lib/****                          # Core application libraries
  │   ├── 📁 api/                          # API utilities
  │   ├── 📁 auth/                         # Authentication helpers
  │   ├── 📁 calendar/                     # Calendar integration
  │   ├── 📁 config/                       # Configuration management
  │   ├── 📁 contexts/                     # React contexts
  │   ├── 📁 dispatch/                     # Dispatch logic
  │   ├── 📁 email/                        # Email integration
  │   ├── 📁 gmail/                        # Gmail API integration
  │   ├── 📁 gps/                          # Location services
  │   ├── 📁 hooks/                        # Custom React hooks
  │   ├── 📁 ****llm/****                        # 🤖 AI/LLM router system (11 modules)
  │   │   ├── audit/                       # AI usage tracking
  │   │   ├── cache/                       # Response caching
  │   │   ├── cost/                        # Cost optimization
  │   │   ├── errors/                      # Error handling
  │   │   ├── health/                      # System health checks
  │   │   ├── integration/                 # Provider integrations
  │   │   ├── metrics/                     # Performance metrics
  │   │   ├── rate-limiting/               # Usage limits
  │   │   ├── resilience/                  # Error recovery
  │   │   ├── security/                    # API key encryption
  │   │   ├── startup/                     # Startup validation
  │   │   ├── intent-mapper.ts            # Intent mapping system
  │   │   ├── api-executor.ts              # API execution engine
  │   │   └── types.ts                      # TypeScript definitions
  │   │
  │   ├── 📁 ****mcp/****                        # Model Context Protocol tools
  │   │   ├── llm/                         # MCP LLM integration
  │   │   ├── prompts/                     # MCP prompt library
  │   │   ├── resources/                   # MCP resource handlers
  │   │   └── tools/                       # MCP tool implementations
  │   │
  │   ├── 📁 microsoft/                    # Microsoft integration
  │   ├── 📁 offline/                      # Offline functionality
  │   ├── 📁 reports/                      # Report generation logic
  │   ├── 📁 security/                     # Security utilities
  │   ├── 📁 supabase/                     # Database client
  │   ├── 📁 types/                        # TypeScript definitions
  │   └── 📁 utils/                        # Utility functions
  │
  ├── 📁 ****scripts/****                      # 🛠️ Automation & utilities (76 scripts)
  │   ├── 📄 apply-**.ts                    # Apply configurations*
  *│   ├── 📄 check-**.ts                     # Validation scripts
  │   ├── 📄 create-**.ts                    # Data creation*
  *│   ├── 📄 deploy-**.sh                    # Deployment automation
  │   ├── 📄 fix-**.ts/.sh                   # Bug fix scripts*
  *│   ├── 📄 import-**.ts                    # Data import utilities
  │   ├── 📄 seed-**.ts/.sh                   # Test data generation*
  *│   ├── 📄 setup-**.ts/.sh                   # Environment setup
  │   ├── 📄 test-**.ts/.js                    # Testing utilities*
  *│   └── 📄 verify-**.ts/.sh                  # System verification
  │
  ├── 📁 ****supabase/****                     # 🐘 Database & Edge Functions
  │   ├── 📁 functions/                    # Edge Functions (12 functions)
  │   │   ├── assign-tech/                 # Auto-assignment
  │   │   ├── automation-engine/           # Business automation
  │   │   ├── create-contact/              # Contact creation
  │   │   ├── create-job/                  # Job creation
  │   │   ├── generate-reply/              # AI email generation
  │   │   ├── handle-inbound-email/        # Email processing
  │   │   ├── llm-router/                  # AI model routing
  │   │   ├── mcp-server/                  # MCP server
  │   │   ├── provision-tenant/            # Tenant provisioning
  │   │   ├── rag-search/                  # RAG search functionality
  │   │   ├── update-job-status/           # Job status updates
  │   │   └── voice-command/                # Voice command processing
  │   │
  │   └── 📁 migrations/                   # Database schema migrations (47 SQL files)
  │       ├── 20240128_email_queue_and_analytics.sql
  │       ├── 20250127_add_estimates_system.sql
  │       ├── 20251127_add_job_documents.sql
  │       ├── 20251127_add_job_locations_and_geocoding.sql
  │       ├── 20251127_add_notifications_system.sql
  │       ├── 20251127_add_parts_and_calendar.sql
  │       ├── 20251127_add_user_impersonation.sql
  │       ├── 20251127_create_user_onboarding.sql
  │       ├── 20251127_remove_user_impersonation.sql
  │       ├── 20251128_add_tags_and_notes.sql
  │       ├── 20251128_create_agent_memory.sql
  │       ├── 20251128_create_voice_navigation_commands.sql.applied
  │       ├── 20251129_create_estimates_table.sql
  │       ├── 20251129_enable_realtime_voice_navigation.sql
  │       ├── 20251129_performance_fixes.sql
  │       ├── 20251129010548_fix_cutting_edge_tools_schema.sql
  │       ├── 20251129020000_create_pricebook.sql
  │       ├── 20251201_add_direct_messages.sql
  │       ├── 20251201_add_resource_scheduling.sql
  │       ├── 20251201_create_ryan_galbraith_owner.sql
  │       ├── 20251203101053_fix_critical_database_issues.sql
  │       ├── 20251203101523_fix_login_rls_circular_dependency.sql
  │       ├── 20251203101647_restore_superadmin_and_fix_nulls.sql
  │       ├── 20251203102251_fix_recovery_token_null.sql
  │       ├── 20251203142135_auth_fix.sql
  │       ├── 20251203144128_fix_auth_null_values.sql
  │       └── [Additional migration files]
  ├── 📁 ****tests/****                        # 🧪 Testing infrastructure
  │   ├── 📁 api/                          # API endpoint tests
  │   ├── 📁 e2e/                          # End-to-end tests
  │   ├── 📁 helpers/                      # Test helper utilities
  │   ├── 📁 setup/                        # Test setup and configuration
  │   ├── 📁 ui/                           # UI component tests
  │   ├── playwright.config.ts             # Playwright configuration
  │   └── vitest.config.ts                 # Vitest configuration
  │
  ├── 📁 ****types/****                        # 📝 TypeScript definitions (17 files)
  │   ├── admin.ts                         # Admin types
  │   ├── analytics.ts                     # Analytics types
  │   ├── automation.ts                    # Automation rules
  │   ├── call-logs.ts                     # Call log types
  │   ├── campaigns.ts                     # Campaign types
  │   ├── contact-tags.ts                  # Contact tag types
  │   ├── dispatch.ts                      # Dispatch types
  │   ├── email-templates.ts                # Email template types
  │   ├── index.ts                         # Type exports
  │   ├── invoices.ts                      # Invoice types
  │   ├── job-materials.ts                 # Job material types
  │   ├── job-photos.ts                    # Job photo types
  │   ├── notifications.ts                 # Notification types
  │   ├── payments.ts                      # Payment types
  │   ├── reports.ts                       # Report types
  │   ├── search.ts                        # Search types
  │   └── tech.ts                          # Technician types
  │
  ├── 📁 ****hooks/****                        # Custom React hooks (5 hooks)
  │   ├── use-account.ts                   # Account management hook
  │   ├── use-debounce.ts                  # Debounce utility hook
  │   ├── use-modal-state.ts               # Modal state management
  │   ├── use-query-param.ts               # URL query parameter hook
  │   └── use-voice-navigation.ts          # Voice navigation hook
  │
  ├── 📁 ****public/****                       # 🌐 Static assets (85 files)
  │   └── [Images, videos, and static assets]
  │
  ├── 📁 ****Documentation*****                # 📖 Documentation files (25+ files)
  │   ├── README.md                         # Project overview
  │   ├── QUICK_START_GUIDE.md              # Getting started
  │   ├── IMPLEMENTATION_CHECKLIST.md       # Development checklist
  │   ├── CLAUDE.md                         # Development guidelines
  │   ├── CLAUDE_CODE_HANDOFF.md            # Code handoff documentation
  │   ├── COMMANDS.md                       # Command reference
  │   ├── START_HERE.md                     # Quick start guide
  │   ├── QUICK_TEST_REFERENCE.md           # Testing reference
  │   ├── MCP_TOOLS_VERIFICATION_REPORT.md  # MCP tools verification
  │   ├── MCPFeats.md                       # MCP features documentation
  │   ├── PERFORMANCE_ANALYSIS_REPORT.md     # Performance analysis
  │   ├── PROJECT_ANALYSIS.md                # Project analysis
  │   ├── PROJECT_ASSESSMENT.md              # Project assessment
  │   ├── REALTIME_SUBSCRIPTION_ANALYSIS.md  # Realtime analysis
  │   ├── SUPERADMIN_DOCUMENTATION.md        # Superadmin docs
  │   ├── SUPERADMIN_RESTORED.md             # Superadmin restoration
  │   ├── VOICE_AGENT_COMPONENT_ANALYSIS.md  # Voice agent analysis
  │   ├── VOICE_AGENT_UUID_IMPLEMENTATION_GUIDE.md # Voice UUID guide
  │   ├── MIGRATION_COMPLETE.md              # Migration completion
  │   ├── MIGRATION_PROGRESS.md              # Migration progress
  │   ├── MOBILE_TO_DESKTOP_MIGRATION.md     # Mobile migration docs
  │   ├── LOCAL_IMPLEMENTATION.md            # Local implementation guide
  │   ├── CUTTING_EDGE_TOOLS_IMPLEMENTATION.md # Tools implementation
  │   ├── CUTTING_EDGE_TOOLS_IMPLEMENTATION_COMPLETE.md # Tools completion
  │   └── [Additional documentation files]
  │
  ├── 🔧 ****Configuration Files*****
  │   ├── package.json                      # Dependencies & scripts
  │   ├── tsconfig.json                     # TypeScript configuration
  │   ├── next.config.mjs                   # Next.js configuration
  │   ├── tailwind.config.js                 # Tailwind CSS config
  │   ├── postcss.config.mjs                # PostCSS configuration
  │   ├── eslint.config.mjs                 # ESLint configuration
  │   ├── components.json                   # shadcn/ui configuration
  │   ├── middleware.ts                      # Next.js middleware
  │   └── [Additional config files]
  │
  └── 📁 ****Additional Directories*****
      ├── 📁 archive/                        # Archived code (quarantined files)
      │   ├── quarantine-debug-sql/          # Debug SQL files
      │   ├── quarantine-debug-ts/            # Debug TypeScript files
      │   ├── quarantine-docs/                # Archived documentation
      │   ├── quarantine-scripts/            # Archived scripts
      │   └── quarantine-test-files/         # Archived test files
      │
      ├── 📁 Bugs and Features/              # Feature planning documents
      ├── 📁 docker/                         # Docker configuration
      │   ├── docker-compose.yml             # Docker Compose config
      │   └── nginx.conf                     # Nginx configuration
      │
      ├── 📁 logs/                           # Application logs
      │   └── openai/                        # OpenAI API logs (301 files)
      │
      ├── 📁 playwright/                    # Playwright test configuration
      ├── 📁 prompts/                       # AI prompt templates
      │   └── fixes/                         # Fix prompts
      │
      ├── 📁 SignalWire/                    # SignalWire integration docs
      ├── 📁 SingleSources/                  # Architecture documentation (27 files)
      ├── 📁 Voice Agent/                    # Voice agent documentation (2 files)
      └── 📁 voice-agents/                   # Voice agent implementations (17 files)

  **🎯 Key Features & Architecture**

  **🏛️ Multi-Role System**

- **5 User Roles**: Owner, Admin, Dispatcher, Tech, Sales
- **Role-based UI** with 87+ permission types
- **Dashboard-specific interfaces** for each role

  **🤖 AI-First Integration**

- **LLM Router** with cost optimization (95% savings potential)
- **Multi-provider support**: OpenAI, Anthropic, Google Gemini
- **Voice AI Agent** with ElevenLabs integration
- **MCP Server** with 59 tools

  **📱 Business Management Modules**

- **19 Dashboard Modules** for complete business operations
- **241 API Endpoints** covering all business functions
- **Real-time subscriptions** with Supabase
- **Comprehensive reporting** and analytics

  **🛡️ Enterprise Security**

- **Row Level Security (RLS)** throughout
- **API key encryption** using pgcrypto
- **JWT authentication** with role permissions
- **Audit logging** for compliance

  **⚡ Performance Features**

- **Database optimization** with 80+ strategic indexes
- **Response caching** for AI responses
- **Rate limiting** and resilience patterns
- **Health monitoring** and metrics

  **📊 Scale & Complexity**

- **~2,000+ source files** across all modules
- **76 automation scripts** for development (60 TypeScript, 15 Shell, 1 JavaScript)
- **12 Edge Functions** for serverless operations
- **47 database migrations** with comprehensive schema evolution
- **35 component modules** with 200+ React components
- **25+ documentation files** with technical specs

  This represents a **mature, production-ready CRM platform** specifically designed for service industry businesses with
   sophisticated AI integration, comprehensive role-based access control, and modern web architecture patterns.

---

**Last Updated**: 11:47:34 Dec 03, 2025 (America/Indiana/Indianapolis)
**Verified Against**: Actual codebase structure and file counts
**Status**: ✅ Verified and accurate