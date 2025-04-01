/**
 * Copyright 2025 Google LLC
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
 * @fileoverview This file contains the MermaidGenerator class which generates
 * Mermaid syntax for UML diagrams.
 */

import {
  type DiagramNode,
  Icon,
  type InnerNode,
  SkinColor,
  UmlGenerator,
} from "./uml_generator.ts";
import type { Transition } from "./flow_parser.ts";
import * as flowTypes from "./flow_types.ts";

/**
 * Generates Mermaid syntax for UML state diagrams.
 */
export class MermaidGenerator extends UmlGenerator {
  // Static mapping from SkinColor to Mermaid class names
  private static readonly COLOR_TO_STYLE_CLASS: Record<SkinColor, string> = {
    [SkinColor.PINK]: "pink",
    [SkinColor.ORANGE]: "orange",
    [SkinColor.NAVY]: "navy",
    [SkinColor.BLUE]: "blue",
    [SkinColor.NONE]: "",
  };

  // Static mapping from Icon to emoji
  private static readonly ICON_TO_ICON: Record<Icon, string> = {
    [Icon.ASSIGNMENT]: "📝",
    [Icon.CODE]: "⚡",
    [Icon.CREATE_RECORD]: "➕",
    [Icon.DECISION]: "🔹",
    [Icon.DELETE]: "🗑️",
    [Icon.LOOKUP]: "🔍",
    [Icon.LOOP]: "🔄",
    [Icon.RIGHT]: "➡️",
    [Icon.SCREEN]: "💻",
    [Icon.STAGE_STEP]: "📍",
    [Icon.UPDATE]: "✏️",
    [Icon.WAIT]: "⏳",
    [Icon.NONE]: "",
    [Icon.ERROR]: "🚫",
  };

  // Static mapping from DiffStatus to prefix symbol
  private static readonly DIFF_STATUS_TO_SYMBOL: Record<
    flowTypes.DiffStatus,
    string
  > = {
    [flowTypes.DiffStatus.ADDED]: "+",
    [flowTypes.DiffStatus.DELETED]: "-",
    [flowTypes.DiffStatus.MODIFIED]: "Δ",
  };

  // Static mapping from DiffStatus to color
  private static readonly DIFF_STATUS_TO_COLOR: Record<
    flowTypes.DiffStatus,
    string
  > = {
    [flowTypes.DiffStatus.ADDED]: "green",
    [flowTypes.DiffStatus.DELETED]: "red",
    [flowTypes.DiffStatus.MODIFIED]: "#DD7A00",
  };

  private static readonly DIFF_STATUS_TO_CLASS: Record<
    flowTypes.DiffStatus,
    string
  > = {
    [flowTypes.DiffStatus.ADDED]: "added",
    [flowTypes.DiffStatus.DELETED]: "deleted",
    [flowTypes.DiffStatus.MODIFIED]: "modified",
  };

  getHeader(label: string): string {
    const sanitizedTitle = this.sanitizeLabel(label);
    return [
      "---",
      `title: "${sanitizedTitle}"`,
      "---",
      "stateDiagram-v2",
      "",
      "  classDef pink fill:#F9548A, color:white",
      "  classDef orange fill:#DD7A00, color:white",
      "  classDef navy fill:#344568, color:white",
      "  classDef blue fill:#1B96FF, color:white",
      "  classDef modified stroke-width: 5px, stroke: orange",
      "  classDef added stroke-width: 5px, stroke: green",
      "  classDef deleted stroke-width: 5px, stroke: red",
      "",
    ].join("\n");
  }

  toUmlString(node: DiagramNode): string {
    const nodeId = this.sanitizeId(node.id);
    const nodeLabel = this.getNodeLabel(node);
    const styleClass = this.getStyleClass(node);
    const lines: string[] = [];

    if (node.innerNodes && node.innerNodes.length > 0) {
      const content: string[] = [];
      content.push(nodeLabel);
      node.innerNodes.forEach((innerNode) => {
        content.push(this.formatInnerNodeLabel(innerNode));
      });
      lines.push(`  state "${content.join("<hr>")}" as ${nodeId}`);
    } else {
      lines.push(`  state "${nodeLabel}" as ${nodeId}`);
    }
    if (styleClass) {
      lines.push(`  class ${nodeId} ${styleClass}`);
    }

    return lines.join("\n");
  }

  getTransition(transition: Transition): string {
    const fromId = this.sanitizeId(transition.from);
    const toId = this.sanitizeId(transition.to);
    const faultIndicator = transition.fault ? "❌" : "";
    const label = transition.label
      ? ` : ${faultIndicator} ${transition.label} ${faultIndicator}`
      : "";

    return `  ${fromId} --> ${toId}${label}`;
  }

  getFooter(): string {
    return "";
  }

  private sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9]/g, "_");
  }

  private sanitizeLabel(label: string): string {
    return label.replace(/"/g, "'");
  }

  private getNodeLabel(node: DiagramNode): string {
    const icon = MermaidGenerator.ICON_TO_ICON[node.icon] || "";

    // Create diff status indicator that matches GraphVizGenerator
    let diffStatus = "";
    if (node.diffStatus) {
      const symbol = MermaidGenerator.DIFF_STATUS_TO_SYMBOL[node.diffStatus];
      const color = MermaidGenerator.DIFF_STATUS_TO_COLOR[node.diffStatus];
      // Add more horizontal padding around the diff indicator
      diffStatus = `<span style='padding:6px;margin:6px;background-color:#FFFFFF;'><font color="${color}"><b>${symbol}</b></font></span>`;
    }

    const sanitizedLabel = this.sanitizeLabel(node.label);
    return `${diffStatus}<b>${node.type}</b> ${icon}<br> <u>${sanitizedLabel}</u>`;
  }

  private formatInnerNodeLabel(node: InnerNode): string {
    const sanitizedLabel = this.sanitizeLabel(node.label);
    const sanitizedContent = node.content.map((item) =>
      this.sanitizeLabel(item)
    );
    const nodeType = node.type ? `<b>${node.type}</b><br>` : "";
    const nodeLabel = node.label ? `<u>${sanitizedLabel}</u><br>` : "";
    const nodeContent = sanitizedContent.join("<br>");
    return `${nodeType}${nodeLabel}${nodeContent}`;
  }

  private getStyleClass(node: DiagramNode): string {
    const baseStyle = MermaidGenerator.COLOR_TO_STYLE_CLASS[node.color];
    const diffStyle = node.diffStatus
      ? MermaidGenerator.DIFF_STATUS_TO_CLASS[node.diffStatus]
      : "";

    return [baseStyle, diffStyle].filter(Boolean).join(" ");
  }
}
