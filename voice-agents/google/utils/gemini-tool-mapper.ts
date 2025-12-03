/**
 * Maps standard MCP/JSON Schema tools to Google Gemini FunctionDeclarations.
 *
 * Key Transformations:
 * 1. Renames 'inputSchema' -> 'parameters'
 * 2. Converts type values to UPPERCASE (e.g., 'string' -> 'STRING')
 * 3. Removes unsupported fields for Gemini compatibility
 */

interface MCPTool {
  name: string;
  description: string;
  inputSchema?: any;
}

interface GeminiTool {
  name: string;
  description: string;
  parameters?: any;
}

export function mapMcpToolsToGemini(mcpTools: MCPTool[]): GeminiTool[] {
  return mcpTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: mapSchemaToGemini(tool.inputSchema || {}),
  }));
}

function mapSchemaToGemini(schema: any): any {
  if (!schema) return undefined;

  // Create a shallow copy to avoid mutating the original
  const newSchema = { ...schema };

  // 1. Convert type to UPPERCASE
  if (newSchema.type) {
    if (typeof newSchema.type === 'string') {
      newSchema.type = newSchema.type.toUpperCase();
    } else if (Array.isArray(newSchema.type)) {
      // Handle array of types
      newSchema.type = newSchema.type.map(t => t.toUpperCase());
    }
  }

  // 2. Handle Properties Recursively
  if (newSchema.properties) {
    const newProps: any = {};
    for (const [key, prop] of Object.entries(newSchema.properties)) {
      newProps[key] = mapSchemaToGemini(prop);
    }
    newSchema.properties = newProps;
  }

  // 3. Handle Arrays (items) Recursively
  if (newSchema.items) {
    newSchema.items = mapSchemaToGemini(newSchema.items);
  }

  // 4. Handle anyOf/oneOf schemas
  if (newSchema.anyOf) {
    newSchema.anyOf = newSchema.anyOf.map(mapSchemaToGemini);
  }
  if (newSchema.oneOf) {
    newSchema.oneOf = newSchema.oneOf.map(mapSchemaToGemini);
  }

  // 5. Cleanup unsupported fields for Gemini
  // Gemini sometimes rejects 'additionalProperties', 'title', '$schema', etc.
  delete newSchema.additionalProperties;
  delete newSchema.title;
  delete newSchema.$schema;
  delete newSchema.examples;
  delete newSchema.default;
  delete newSchema.$id;
  delete newSchema.definitions;

  return newSchema;
}

/**
 * Create client-side navigation tool in Gemini format
 */
export function createNavigationTool(): GeminiTool {
  return {
    name: 'navigate',
    description: 'Navigate to a different page within the CRM application. Supports intelligent aliases for mobile routes.',
    parameters: {
      type: 'OBJECT',
      properties: {
        route: {
          type: 'STRING',
          description: 'The route or page name to navigate to. Examples: "dashboard", "jobs", "tech dashboard", "sales leads", "dispatch map", "calendar", "meetings", "reports", "settings"'
        }
      },
      required: ['route']
    }
  };
}

/**
 * Create get current page tool for Gemini
 */
export function createGetCurrentPageTool(): GeminiTool {
  return {
    name: 'get_current_page',
    description: 'Get the current page/route the user is currently viewing',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  };
}

/**
 * Create scroll to section tool for Gemini
 */
export function createScrollToSectionTool(): GeminiTool {
  return {
    name: 'scroll_to_section',
    description: 'Scroll to a specific section on the current page by its HTML ID',
    parameters: {
      type: 'OBJECT',
      properties: {
        sectionId: {
          type: 'STRING',
          description: 'The HTML ID of the section to scroll to (e.g., "job-details", "contact-info")'
        }
      },
      required: ['sectionId']
    }
  };
}

/**
 * Create trigger UI action tool for Gemini
 */
export function createTriggerUIActionTool(): GeminiTool {
  return {
    name: 'trigger_ui_action',
    description: 'Trigger a UI action like opening a modal, showing a tooltip, or interacting with page elements',
    parameters: {
      type: 'OBJECT',
      properties: {
        action: {
          type: 'STRING',
          description: 'The UI action to trigger (e.g., "open_create_job_modal", "show_notifications", "refresh_page", "click_submit_button")'
        },
        payload: {
          type: 'OBJECT',
          description: 'Optional payload data for the action'
        }
      },
      required: ['action']
    }
  };
}

/**
 * Create open new tab tool for Gemini
 */
export function createOpenNewTabTool(): GeminiTool {
  return {
    name: 'open_new_tab',
    description: 'Open a URL in a new browser tab',
    parameters: {
      type: 'OBJECT',
      properties: {
        url: {
          type: 'STRING',
          description: 'The URL to open in a new tab'
        }
      },
      required: ['url']
    }
  };
}

/**
 * Get all client-side tools for Gemini
 */
export function getClientSideGeminiTools(): GeminiTool[] {
  return [
    createNavigationTool(),
    createGetCurrentPageTool(),
    createScrollToSectionTool(),
    createTriggerUIActionTool(),
    createOpenNewTabTool()
  ];
}