# NeonOps Refactor - Parallel Swarm Execution

**Status**: Executing  
**Strategy**: Maximum parallelization across all remaining components and pages

## Wave 5: Special Components (Parallel)
1. **User Menu** - Dark dropdown with neon accents
2. **Global Search** - Dark search bar with neon glow
3. **Navigation Icons** - Update all icons to neon colors

## Wave 4: Page Refactors (Parallel)

### Core Pages
4. **Inbox Page** - Dark panels, neon conversation highlights
5. **Jobs Page** - Dark cards, neon metrics, dark job list
6. **Contacts Page** - Dark theme, neon contact cards
7. **Analytics Page** - Dark charts, neon data visualization
8. **Finance Dashboard** - Dark financial cards, neon metrics
9. **Finance Payments** - Dark payment list, neon status badges

### Marketing Pages
10. **Campaigns List** - Dark campaign cards, neon status
11. **Campaign Detail** - Dark detail view, neon metrics
12. **Email Templates** - Dark template list, neon previews
13. **Tags Page** - Dark tag management, neon tag badges

### Admin Pages
14. **Admin Settings** - Dark settings form, neon inputs
15. **Admin Users** - Dark user list, neon role badges
16. **Admin Audit** - Dark audit log, neon filters
17. **Admin Automation** - Dark rules list, neon toggles
18. **Admin LLM Providers** - Dark provider cards, neon status

### Tech Pages
19. **Tech Dashboard** - Dark tech view, neon job cards

### Settings Pages
20. **Settings Integrations** - Dark integration cards, neon connect buttons

## Execution Strategy
- All agents work in parallel
- Each agent updates one component/page
- Use shared design tokens from lib/design-tokens.ts
- Maintain consistent dark backgrounds and neon accents
- Update all text colors to white/neon variants
- Add circuit patterns where appropriate

## Success Criteria
- All pages use dark-dark-secondary or dark-panel backgrounds
- All interactive elements have neon glow effects
- All text is white or neon colored
- Consistent use of neon-blue-glow300 and neon-green-glow300
- Circuit patterns visible on feature cards

