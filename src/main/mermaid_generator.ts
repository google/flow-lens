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
  DiagramNode,
  Icon,
  InnerNode,
  SkinColor,
  UmlGenerator,
} from "./uml_generator.ts";
import { Transition } from "./flow_parser.ts";
import * as flowTypes from "./flow_types.ts";

/**
 * Generates Mermaid syntax for UML state diagrams.
 */
export class MermaidGenerator extends UmlGenerator {
  // Static mapping from SkinColor to Mermaid class names
  private static readonly STYLE_CLASS_MAP: Record<SkinColor, string> = {
    [SkinColor.PINK]: "pink",
    [SkinColor.ORANGE]: "orange",
    [SkinColor.NAVY]: "navy",
    [SkinColor.BLUE]: "blue",
    [SkinColor.NONE]: "",
  };

  // Static mapping from Icon to emoji
  private static readonly ICON_MAP: Record<Icon, string> = {
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
  };

  // Static mapping from DiffStatus to prefix
  private static readonly DIFF_STATUS_PREFIX_MAP: Record<
    flowTypes.DiffStatus,
    string
  > = {
    [flowTypes.DiffStatus.ADDED]: "➕",
    [flowTypes.DiffStatus.DELETED]: "❌",
    [flowTypes.DiffStatus.MODIFIED]: "✏️",
  };

  getHeader(label: string): string {
    return [
      "---",
      `title: ${label}`,
      "---",
      "stateDiagram-v2",
      "",
      "  classDef pink fill:#F9548A, color:white",
      "  classDef orange fill:#DD7A00, color:white",
      "  classDef navy fill:#344568, color:white",
      "  classDef blue fill:#1B96FF, color:white",
      "",
    ].join("\n");
  }

  toUmlString(node: DiagramNode): string {
    const nodeId = this.sanitizeId(node.id);
    const nodeLabel = this.getNodeLabel(node);
    const styleClass = MermaidGenerator.STYLE_CLASS_MAP[node.color];
    const lines: string[] = [];

    if (node.innerNodes && node.innerNodes.length > 0) {
      const content: string[] = [];
      content.push(nodeLabel);
      node.innerNodes.forEach((innerNode, index) => {
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
    let label = transition.label
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
    const icon = MermaidGenerator.ICON_MAP[node.icon] || "";
    const diffStatus = node.diffStatus
      ? `<span style='background-color:#FFFFFF;'> ${
          MermaidGenerator.DIFF_STATUS_PREFIX_MAP[node.diffStatus]
        }</span> `
      : "";
    const sanitizedLabel = this.sanitizeLabel(node.label);
    return `${diffStatus}${icon} <b>${node.type}</b> <br> <u>${sanitizedLabel}</u>`;
  }

  private formatInnerNodeLabel(node: InnerNode): string {
    const sanitizedLabel = this.sanitizeLabel(node.label);
    const sanitizedContent = node.content.map((item) =>
      this.sanitizeLabel(item)
    );
    return `<b>${
      node.type
    }</b> <br ><u>${sanitizedLabel}</u> <br>${sanitizedContent.join("<br>")}`;
  }
}
