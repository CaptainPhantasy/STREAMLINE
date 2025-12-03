# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-27

### Added
- Role-based authentication system with owner, admin, dispatcher, tech, and sales roles
- Mobile-first PWA support with dedicated `/m/` routes for field technicians and sales
- Role impersonation feature for owner accounts to view system from different perspectives
- Solaris theme as default with multiple theme options (Opus, Latte, Ops Pro)
- ElevenLabs React SDK integration for white-label voice agent control
- MCP server integration with Docker support
- Comprehensive monitoring and deployment tools

### Changed
- Migrated deployment from Vercel to Railway for better environment variable handling
- Updated mobile routing to use `/m/` prefix to avoid path conflicts
- Enhanced authentication security using `getUser()` instead of `getSession()`
- Improved UI/UX across inbox, profile dropdown, and sidebar
- Disabled GitHub Actions CI/CD (migrated to Railway auto-deploy)

### Fixed
- Authentication configuration and admin access restoration
- Profile dropdown opacity rendering
- Card layout and hover interactions in inbox
- Voice agent persistence across page navigation
- TypeScript build errors
- Webhook initialization errors

### Security
- Replaced insecure session handling with authenticated user validation
- Updated Supabase API configuration for enhanced security
- Removed exposed credentials from client-side code

## [0.1.0] - Initial Development

### Added
- Core CRM functionality
- Real-time messaging and conversations
- Contact management
- Job tracking and dispatch
- Analytics dashboard
- Email integration
- Voice agent capabilities

---

For detailed commit history, see: https://github.com/CaptainPhantasy/crm-ai-pro/commits
