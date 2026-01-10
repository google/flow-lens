/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview This file contains the D2Generator class which generates
 * D2 diagram syntax with Salesforce Lightning Flow Builder styling.
 */

import {
  type DiagramNode,
  Icon,
  type InnerNode,
  UmlGenerator,
} from "./uml_generator.ts";
import type { Transition } from "./flow_parser.ts";
import * as flowTypes from "./flow_types.ts";

/**
 * Generates D2 diagram syntax with Salesforce Lightning Design System styling.
 * D2 is a modern diagram scripting language that produces high-quality diagrams.
 */
export class D2Generator extends UmlGenerator {
  // Salesforce Lightning Flow Builder authentic color scheme
  private static readonly SALESFORCE_COLORS: Record<string, string> = {
    // Logic Elements (Purple/Indigo)
    "Assignment": "#5867E8",
    "Decision": "#5867E8",
    "Loop": "#5867E8",
    "Collection Processor": "#5867E8",

    // Data Elements (Pink/Magenta)
    "Record Create": "#E3066A",
    "Record Update": "#E3066A",
    "Record Delete": "#E3066A",
    "Record Lookup": "#E3066A",
    "Record Rollback": "#E3066A",

    // Action Elements (Teal/Cyan)
    "Action Call": "#06AED5",
    "Apex Plugin Call": "#06AED5",
    "Subflow": "#06AED5",

    // Screen Elements (Blue)
    "Screen": "#1B96FF",

    // Wait/Pause Elements (Orange)
    "Wait": "#FF9A3C",

    // Transform Elements (Green)
    "Transform": "#3BA755",

    // Orchestration Elements (Dark Blue)
    "Orchestrated Stage": "#0B5CAB",
    "Step": "#0B5CAB",

    // Error Elements (Red)
    "Custom Error": "#EA001E",

    // Start/Default (Gray)
    "Flow Start": "#706E6B",
  };

  // Salesforce-style icons for each element type
  private static readonly SALESFORCE_ICONS: Record<string, string> = {
    // Logic Icons
    "Assignment": "=",
    "Decision": "◇",
    "Loop": "↻",
    "Collection Processor": "⚙",

    // Data Icons
    "Record Create": "+",
    "Record Update": "✎",
    "Record Delete": "×",
    "Record Lookup": "🔍",
    "Record Rollback": "↶",

    // Action Icons
    "Action Call": "⚡",
    "Apex Plugin Call": "{ }",
    "Subflow": "→",

    // Screen Icons
    "Screen": "☰",

    // Other Icons
    "Wait": "⏱",
    "Transform": "⚙",
    "Orchestrated Stage": "▶",
    "Step": "▶",
    "Custom Error": "⚠",
    "Flow Start": "▶",
  };

  // Icon enum to D2-compatible icon mapping
  private static readonly ICON_TO_ICON: Record<Icon, string> = {
    [Icon.ASSIGNMENT]: "=",
    [Icon.CODE]: "⚡",
    [Icon.CREATE_RECORD]: "+",
    [Icon.DECISION]: "◇",
    [Icon.DELETE]: "×",
    [Icon.LOOKUP]: "🔍",
    [Icon.LOOP]: "↻",
    [Icon.RIGHT]: "→",
    [Icon.SCREEN]: "☰",
    [Icon.STAGE_STEP]: "▶",
    [Icon.UPDATE]: "✎",
    [Icon.WAIT]: "⏱",
    [Icon.NONE]: "",
    [Icon.ERROR]: "⚠",
  };

  // Diff status symbols for Salesforce-style change tracking
  private static readonly DIFF_STATUS_TO_SYMBOL: Record<
    flowTypes.DiffStatus,
    string
  > = {
    [flowTypes.DiffStatus.ADDED]: "[+]",
    [flowTypes.DiffStatus.DELETED]: "[-]",
    [flowTypes.DiffStatus.MODIFIED]: "[Δ]",
  };

  // Diff status to D2 stroke colors (Salesforce colors)
  private static readonly DIFF_STATUS_TO_COLOR: Record<
    flowTypes.DiffStatus,
    string
  > = {
    [flowTypes.DiffStatus.ADDED]: "#3BA755", // Salesforce Green
    [flowTypes.DiffStatus.DELETED]: "#EA001E", // Salesforce Red
    [flowTypes.DiffStatus.MODIFIED]: "#FF9A3C", // Salesforce Orange
  };

  getHeader(label: string): string {
    const sanitizedTitle = this.sanitizeLabel(label);

    return `# ${sanitizedTitle}

direction: down

classes: {
  # Salesforce Lightning Design System node styling
  sf-node: {
    style: {
      border-radius: 4
      stroke-width: 2
      font-size: 14
      font-color: white
      bold: true
    }
  }

  # Diff status styling (matching Salesforce change tracking)
  added: {
    style: {
      stroke: "#3BA755"
      stroke-width: 5
      stroke-dash: 0
    }
  }

  deleted: {
    style: {
      stroke: "#EA001E"
      stroke-width: 5
      stroke-dash: 3
    }
  }

  modified: {
    style: {
      stroke: "#FF9A3C"
      stroke-width: 5
      stroke-dash: 0
    }
  }
}

`;
  }

  toUmlString(node: DiagramNode): string {
    const nodeId = this.sanitizeId(node.id);
    const icon = this.getIconForNode(node);
    const color = this.getColorForType(node.type);

    // Build node label with icon and type (matching Flow Builder display)
    let nodeLabel = `${icon} ${node.type}`;

    // Add diff indicator prefix if present (matching Salesforce version control)
    if (node.diffStatus) {
      const diffSymbol = D2Generator.DIFF_STATUS_TO_SYMBOL[node.diffStatus];
      nodeLabel = `${diffSymbol} ${nodeLabel}`;
    }

    const lines: string[] = [];

    // Main node definition with label
    lines.push(`${nodeId}: {`);
    lines.push(`  label: ${this.escapeD2String(nodeLabel)}`);
    lines.push(`  class: sf-node`);

    // Apply Salesforce color
    lines.push(`  style: {`);
    lines.push(`    fill: "${color}"`);
    lines.push(`  }`);

    // Add node's display label as a nested element (matching Flow Builder's two-line display)
    if (node.label) {
      const labelId = `${nodeId}_label`;
      lines.push(`  ${labelId}: {`);
      lines.push(`    label: ${this.escapeD2String(node.label)}`);
      lines.push(`    shape: text`);
      lines.push(`    style: {`);
      lines.push(`      font-size: 12`);
      lines.push(`      font-color: white`);
      lines.push(`      italic: true`);
      lines.push(`    }`);
      lines.push(`  }`);
    }

    // Handle inner nodes (decisions, lookups, etc.)
    if (node.innerNodes && node.innerNodes.length > 0) {
      node.innerNodes.forEach((innerNode, idx) => {
        const innerLabel = this.formatInnerNode(innerNode);
        lines.push(`  detail_${idx}: {`);
        lines.push(`    label: ${this.escapeD2String(innerLabel)}`);
        lines.push(`    shape: text`);
        lines.push(`    style: {`);
        lines.push(`      font-size: 11`);
        lines.push(`      font-color: "#FFFFFF"`);
        lines.push(`    }`);
        lines.push(`  }`);
      });
    }

    lines.push(`}`);

    // Apply diff class if present
    if (node.diffStatus) {
      const diffClass = this.getDiffClassName(node.diffStatus);
      lines.push(`${nodeId}.class: ${diffClass}`);
    }

    return lines.join("\n");
  }

  getTransition(transition: Transition): string {
    const fromId = this.sanitizeId(transition.from);
    const toId = this.sanitizeId(transition.to);

    const lines: string[] = [];

    // Build transition with optional label
    if (transition.label) {
      lines.push(
        `${fromId} -> ${toId}: ${this.escapeD2String(transition.label)} {`,
      );
    } else {
      lines.push(`${fromId} -> ${toId}: {`);
    }

    // Apply Salesforce connector styling
    lines.push(`  style: {`);

    if (transition.fault) {
      // Fault paths use red dashed lines (Salesforce standard)
      lines.push(`    stroke: "#EA001E"`);
      lines.push(`    stroke-width: 2`);
      lines.push(`    stroke-dash: 5`);
    } else {
      // Normal paths use gray solid lines
      lines.push(`    stroke: "#706E6B"`);
      lines.push(`    stroke-width: 2`);
    }

    lines.push(`  }`);
    lines.push(`}`);

    return lines.join("\n");
  }

  getFooter(): string {
    return "";
  }

  // Helper methods

  private sanitizeId(id: string): string {
    // D2 identifiers must be alphanumeric with underscores
    // Also avoid starting with a number
    let sanitized = id.replace(/[^a-zA-Z0-9_]/g, "_");
    if (/^[0-9]/.test(sanitized)) {
      sanitized = "_" + sanitized;
    }
    return sanitized;
  }

  private sanitizeLabel(label: string): string {
    return label.replace(/"/g, '\\"').replace(/\n/g, " ");
  }

  private escapeD2String(text: string): string {
    // Escape for D2 string literals
    const escaped = text
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n");
    return `"${escaped}"`;
  }

  private getIconForNode(node: DiagramNode): string {
    // First try to get icon from type mapping
    const typeIcon = D2Generator.SALESFORCE_ICONS[node.type];
    if (typeIcon) {
      return typeIcon;
    }

    // Fall back to Icon enum mapping
    return D2Generator.ICON_TO_ICON[node.icon] || "";
  }

  private getColorForType(type: string): string {
    return D2Generator.SALESFORCE_COLORS[type] || "#706E6B";
  }

  private getDiffClassName(diffStatus: flowTypes.DiffStatus): string {
    const classMap: Record<flowTypes.DiffStatus, string> = {
      [flowTypes.DiffStatus.ADDED]: "added",
      [flowTypes.DiffStatus.DELETED]: "deleted",
      [flowTypes.DiffStatus.MODIFIED]: "modified",
    };
    return classMap[diffStatus];
  }

  private formatInnerNode(innerNode: InnerNode): string {
    const parts: string[] = [];

    if (innerNode.type) {
      parts.push(innerNode.type);
    }

    if (innerNode.label) {
      parts.push(innerNode.label);
    }

    if (innerNode.content.length > 0) {
      parts.push(...innerNode.content);
    }

    return parts.join("\\n");
  }
}
