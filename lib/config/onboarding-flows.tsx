/**
 * Onboarding Flow Configurations
 *
 * Defines role-specific onboarding flows with step configurations.
 * Can be customized for different projects or roles.
 */

import {
  Building2,
  Users,
  UserPlus,
  Briefcase,
  Mail,
  Calendar,
  Settings,
  Smartphone,
  MapPin,
  Camera,
  MessageSquare,
  FileText,
  Brain,
  Sparkles,
  DollarSign,
  Zap,
} from 'lucide-react'
import type { UserRole, OnboardingFlowConfig, OnboardingStepConfig } from '@/lib/types/onboarding'

/**
 * Owner Onboarding Flow (7 steps)
 * Complete system setup for business owner
 */
export const ownerOnboardingSteps: OnboardingStepConfig[] = [
  {
    id: 'owner-welcome',
    title: 'Welcome to CRM-AI Pro',
    description: 'Let\'s get your business set up',
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p>Welcome! We'll guide you through setting up your CRM system in just a few steps.</p>
        <p>This will take about 10 minutes and will help you:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Configure your company information</li>
          <li>Add your first team member</li>
          <li>Create your first customer</li>
          <li>Set up integrations</li>
          <li>Configure AI features</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'owner-company-setup',
    title: 'Company Setup',
    description: 'Set your company name, logo, and business hours',
    icon: Building2,
    skippable: false,
    content: (
      <div className="space-y-4">
        <p>First, let's set up your company information.</p>
        <p>You can configure:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Company name and logo</li>
          <li>Business hours</li>
          <li>Contact information</li>
          <li>Service areas</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Go to Settings → Company to complete this step.
        </p>
      </div>
    ),
  },
  {
    id: 'owner-add-team',
    title: 'Add Team Member',
    description: 'Invite your first admin or technician',
    icon: UserPlus,
    skippable: true,
    content: (
      <div className="space-y-4">
        <p>Add team members to help manage your business.</p>
        <p>User roles include:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li><strong>Admin:</strong> Full system access</li>
          <li><strong>Dispatcher:</strong> Job assignment and tracking</li>
          <li><strong>Tech:</strong> Mobile field operations</li>
          <li><strong>Sales:</strong> Lead management and estimates</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Go to Settings → Users to invite team members.
        </p>
      </div>
    ),
  },
  {
    id: 'owner-add-customer',
    title: 'Create First Customer',
    description: 'Add your first customer contact',
    icon: Users,
    skippable: false,
    content: (
      <div className="space-y-4">
        <p>Let's add your first customer to the system.</p>
        <p>Customer profiles include:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Contact information</li>
          <li>Service addresses</li>
          <li>Communication history</li>
          <li>Tags and notes</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Go to Contacts → Add Contact to create your first customer.
        </p>
      </div>
    ),
  },
  {
    id: 'owner-create-job',
    title: 'Create First Job',
    description: 'Create and assign your first job',
    icon: Briefcase,
    skippable: true,
    content: (
      <div className="space-y-4">
        <p>Create a job and assign it to a technician.</p>
        <p>Jobs can include:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Service details and requirements</li>
          <li>Scheduled date and time</li>
          <li>Assigned technician</li>
          <li>Photos and documentation</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Go to Jobs → Create Job to get started.
        </p>
      </div>
    ),
  },
  {
    id: 'owner-setup-integrations',
    title: 'Setup Integrations',
    description: 'Connect Gmail and Calendar (optional)',
    icon: Mail,
    skippable: true,
    content: (
      <div className="space-y-4">
        <p>Connect your email and calendar for seamless communication.</p>
        <p>Available integrations:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li><strong>Gmail:</strong> Sync emails with customers</li>
          <li><strong>Google Calendar:</strong> Sync job schedules</li>
          <li><strong>Microsoft 365:</strong> Email and calendar</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Go to Settings → Integrations to connect services.
        </p>
      </div>
    ),
  },
  {
    id: 'owner-configure-ai',
    title: 'Configure AI',
    description: 'Select LLM provider and enter API key',
    icon: Brain,
    skippable: true,
    content: (
      <div className="space-y-4">
        <p>Enable AI-powered features for your business.</p>
        <p>AI features include:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Meeting briefings and talking points</li>
          <li>Automated email responses</li>
          <li>Voice transcription and summaries</li>
          <li>Pricing suggestions</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Go to Settings → LLM Providers to configure AI.
        </p>
      </div>
    ),
  },
]

/**
 * Tech Onboarding Flow (5 steps)
 * Mobile-first onboarding for field technicians
 */
export const techOnboardingSteps: OnboardingStepConfig[] = [
  {
    id: 'tech-welcome',
    title: 'Welcome, Technician!',
    description: 'Mobile-first CRM for field operations',
    icon: Smartphone,
    content: (
      <div className="space-y-4">
        <p>Welcome to your mobile field operations system!</p>
        <p>This app is designed for use in the field with:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Large touch targets for easy use</li>
          <li>Offline mode for unreliable connections</li>
          <li>GPS tracking for job routes</li>
          <li>Quick photo and note capture</li>
        </ul>
        <p className="font-medium">Tip: Add this app to your home screen for quick access!</p>
      </div>
    ),
  },
  {
    id: 'tech-view-jobs',
    title: 'View Assigned Jobs',
    description: 'See your scheduled jobs and routes',
    icon: MapPin,
    content: (
      <div className="space-y-4">
        <p>Your assigned jobs appear on the Jobs page.</p>
        <p>For each job, you can see:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Customer name and address</li>
          <li>Service details and requirements</li>
          <li>Scheduled time</li>
          <li>Directions via GPS</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Tap any job to view full details.
        </p>
      </div>
    ),
  },
  {
    id: 'tech-start-job',
    title: 'Start a Job',
    description: 'Clock in and enable GPS tracking',
    icon: Zap,
    content: (
      <div className="space-y-4">
        <p>When you arrive at a job site:</p>
        <ol className="list-decimal space-y-2 pl-6">
          <li>Tap "Start Job" to clock in</li>
          <li>Enable GPS tracking (optional)</li>
          <li>Review job details</li>
          <li>Begin work</li>
        </ol>
        <p className="font-medium">
          Your location is tracked only while working on a job.
        </p>
      </div>
    ),
  },
  {
    id: 'tech-add-photos',
    title: 'Add Photos & Notes',
    description: 'Document your work with photos and voice notes',
    icon: Camera,
    content: (
      <div className="space-y-4">
        <p>Document your work as you go:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li><strong>Photos:</strong> Before/after shots, issues found</li>
          <li><strong>Voice Notes:</strong> Speak instead of typing</li>
          <li><strong>Text Notes:</strong> Add details and observations</li>
        </ul>
        <p className="font-medium">
          All photos sync automatically when back online.
        </p>
      </div>
    ),
  },
  {
    id: 'tech-complete-job',
    title: 'Complete a Job',
    description: 'Finish job, get signature, clock out',
    icon: FileText,
    content: (
      <div className="space-y-4">
        <p>When work is complete:</p>
        <ol className="list-decimal space-y-2 pl-6">
          <li>Tap "Complete Job"</li>
          <li>Review photos and notes</li>
          <li>Get customer signature (optional)</li>
          <li>Submit completion report</li>
        </ol>
        <p className="text-sm text-muted-foreground">
          The dispatcher will be notified automatically.
        </p>
      </div>
    ),
  },
]

/**
 * Sales Onboarding Flow (5 steps)
 * Mobile CRM with AI-powered features
 */
export const salesOnboardingSteps: OnboardingStepConfig[] = [
  {
    id: 'sales-welcome',
    title: 'Welcome to Mobile CRM',
    description: 'AI-powered sales tools in your pocket',
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p>Welcome to your AI-powered mobile CRM!</p>
        <p>This system helps you:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Manage leads and pipeline</li>
          <li>Get AI meeting briefings</li>
          <li>Create estimates on the go</li>
          <li>Track customer interactions</li>
        </ul>
        <p className="font-medium">Tip: Add this app to your home screen for quick access!</p>
      </div>
    ),
  },
  {
    id: 'sales-view-pipeline',
    title: 'View Leads & Pipeline',
    description: 'Visual sales funnel and lead tracking',
    icon: Briefcase,
    content: (
      <div className="space-y-4">
        <p>Your sales pipeline is organized by stage:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>New Leads</li>
          <li>Contacted</li>
          <li>Qualified</li>
          <li>Proposal Sent</li>
          <li>Closed Won/Lost</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Drag leads between stages to update their status.
        </p>
      </div>
    ),
  },
  {
    id: 'sales-ai-briefing',
    title: 'AI Meeting Briefing',
    description: 'Get AI-powered meeting prep and talking points',
    icon: Brain,
    content: (
      <div className="space-y-4">
        <p>Before each meeting, tap the AI briefing button to get:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Customer history summary</li>
          <li>Suggested talking points</li>
          <li>Pricing recommendations</li>
          <li>Past interactions recap</li>
        </ul>
        <p className="font-medium">
          AI helps you show up prepared to every meeting!
        </p>
      </div>
    ),
  },
  {
    id: 'sales-create-estimate',
    title: 'Create Estimate',
    description: 'Quick estimate builder with pricing suggestions',
    icon: DollarSign,
    content: (
      <div className="space-y-4">
        <p>Create professional estimates on the go:</p>
        <ol className="list-decimal space-y-2 pl-6">
          <li>Select customer</li>
          <li>Add line items</li>
          <li>Apply AI pricing suggestions</li>
          <li>Send via email/SMS</li>
        </ol>
        <p className="text-sm text-muted-foreground">
          Track when customers view and accept estimates.
        </p>
      </div>
    ),
  },
  {
    id: 'sales-meeting-notes',
    title: 'Meeting Notes & Follow-up',
    description: 'Voice notes and AI meeting summaries',
    icon: MessageSquare,
    content: (
      <div className="space-y-4">
        <p>Capture meeting details effortlessly:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li><strong>Voice Notes:</strong> Record instead of typing</li>
          <li><strong>AI Summary:</strong> Get automatic meeting recap</li>
          <li><strong>Follow-up Tasks:</strong> Create next steps</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          All notes sync to the customer's profile.
        </p>
      </div>
    ),
  },
]

/**
 * Dispatcher Onboarding Flow (4 steps)
 * Simplified for experienced desktop users
 */
export const dispatcherOnboardingSteps: OnboardingStepConfig[] = [
  {
    id: 'dispatcher-welcome',
    title: 'Welcome, Dispatcher!',
    description: 'Real-time job dispatch and tracking',
    icon: MapPin,
    content: (
      <div className="space-y-4">
        <p>Welcome to the dispatch center!</p>
        <p>Your primary tools:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Real-time dispatch map</li>
          <li>Technician tracking</li>
          <li>Job assignment</li>
          <li>Route optimization</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'dispatcher-map',
    title: 'Dispatch Map',
    description: 'Track technicians and assign jobs visually',
    icon: MapPin,
    content: (
      <div className="space-y-4">
        <p>The dispatch map shows:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Technician locations in real-time</li>
          <li>Job locations and markers</li>
          <li>Traffic and route information</li>
          <li>Drag-and-drop job assignment</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Access the map from Dispatch → Map in the sidebar.
        </p>
      </div>
    ),
  },
  {
    id: 'dispatcher-assign-jobs',
    title: 'Assign Jobs',
    description: 'Drag jobs to technicians or use auto-assign',
    icon: Zap,
    content: (
      <div className="space-y-4">
        <p>Two ways to assign jobs:</p>
        <ol className="list-decimal space-y-2 pl-6">
          <li><strong>Manual:</strong> Drag job markers to technicians</li>
          <li><strong>Auto-assign:</strong> AI suggests best technician</li>
        </ol>
        <p>Auto-assign considers:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Distance to job</li>
          <li>Current workload</li>
          <li>Skills and certifications</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'dispatcher-monitor',
    title: 'Monitor Progress',
    description: 'Track job status and technician availability',
    icon: Settings,
    content: (
      <div className="space-y-4">
        <p>Monitor all active jobs from the dashboard:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Job status (en route, in progress, completed)</li>
          <li>Technician status (idle, on job, offline)</li>
          <li>Real-time notifications</li>
          <li>Performance metrics</li>
        </ul>
      </div>
    ),
  },
]

/**
 * Admin Onboarding Flow (3 steps)
 * Simplified for power users
 */
export const adminOnboardingSteps: OnboardingStepConfig[] = [
  {
    id: 'admin-welcome',
    title: 'Welcome, Admin!',
    description: 'Full system administration access',
    icon: Settings,
    content: (
      <div className="space-y-4">
        <p>Welcome! As an admin, you have full access to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>User management</li>
          <li>System settings</li>
          <li>Integrations</li>
          <li>Automation rules</li>
          <li>Audit logs</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'admin-users',
    title: 'Manage Users',
    description: 'Add, edit, and manage team members',
    icon: Users,
    content: (
      <div className="space-y-4">
        <p>From Settings → Users, you can:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Invite new users</li>
          <li>Assign roles and permissions</li>
          <li>Deactivate accounts</li>
          <li>Reset passwords</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'admin-settings',
    title: 'System Settings',
    description: 'Configure company-wide settings',
    icon: Settings,
    content: (
      <div className="space-y-4">
        <p>Key admin settings:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li><strong>Company:</strong> Business info and branding</li>
          <li><strong>Integrations:</strong> Email, calendar, and more</li>
          <li><strong>Automation:</strong> Workflow rules</li>
          <li><strong>LLM Providers:</strong> AI configuration</li>
        </ul>
      </div>
    ),
  },
]

/**
 * Get onboarding flow for a specific role
 */
export function getOnboardingFlowForRole(role: UserRole): OnboardingFlowConfig {
  switch (role) {
    case 'owner':
      return { role, steps: ownerOnboardingSteps }
    case 'admin':
      return { role, steps: adminOnboardingSteps }
    case 'dispatcher':
      return { role, steps: dispatcherOnboardingSteps }
    case 'tech':
      return { role, steps: techOnboardingSteps }
    case 'sales':
      return { role, steps: salesOnboardingSteps }
    default:
      return { role, steps: [] }
  }
}

/**
 * Get onboarding checklist items for a role
 */
export function getOnboardingChecklistForRole(role: UserRole) {
  switch (role) {
    case 'owner':
      return [
        {
          id: 'add-customer',
          title: 'Add first customer',
          description: 'Create your first customer contact',
          link: '/contacts',
          completed: false,
        },
        {
          id: 'create-job',
          title: 'Create first job',
          description: 'Schedule and assign a job',
          link: '/jobs',
          completed: false,
        },
        {
          id: 'setup-email',
          title: 'Setup email integration',
          description: 'Connect Gmail or Microsoft 365',
          link: '/settings/integrations',
          completed: false,
        },
        {
          id: 'invite-team',
          title: 'Invite team member',
          description: 'Add your first employee',
          link: '/settings/users',
          completed: false,
        },
      ]
    case 'tech':
      return [
        {
          id: 'view-first-job',
          title: 'View your first job',
          description: 'Check your assigned jobs',
          link: '/m/tech/jobs',
          completed: false,
        },
        {
          id: 'add-to-homescreen',
          title: 'Add app to home screen',
          description: 'Quick access from your phone',
          completed: false,
        },
      ]
    case 'sales':
      return [
        {
          id: 'view-pipeline',
          title: 'View sales pipeline',
          description: 'See your leads and opportunities',
          link: '/m/sales/leads',
          completed: false,
        },
        {
          id: 'create-estimate',
          title: 'Create first estimate',
          description: 'Build and send an estimate',
          link: '/m/sales/estimates',
          completed: false,
        },
        {
          id: 'add-to-homescreen',
          title: 'Add app to home screen',
          description: 'Quick access from your phone',
          completed: false,
        },
      ]
    default:
      return []
  }
}
