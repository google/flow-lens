/**
 * Copyright 2024 Google LLC
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
 * @fileoverview A Graphviz generator for Salesforce flows.
 */

import type { Transition } from "./flow_parser.ts";
import * as flowTypes from "./flow_types.ts";
import {
  UmlGenerator,
  type DiagramNode,
  type InnerNode,
  SkinColor as UmlSkinColor,
  Icon as UmlIcon,
} from "./uml_generator.ts";

const EOL = "\n";
const TABLE_BEGIN = `<
<TABLE CELLSPACING="0" CELLPADDING="0" BORDER="0" CELLBORDER="0">`;
const TABLE_END = `</TABLE>
>`;

/**
 * Skin colors used to represent the type of node.
 */
export enum SkinColor {
  NONE = "",
  PINK = "#F9548A",
  ORANGE = "#DD7A00",
  NAVY = "#344568",
  BLUE = "#1B96FF",
}

/**
 * Icons used to represent the type of node.
 */
export enum Icon {
  ASSIGNMENT = " ⬅️",
  CODE = " ⚡",
  CREATE_RECORD = " ➕",
  DECISION = " 🔷",
  DELETE = " 🗑️",
  LOOKUP = " 🔍",
  LOOP = " 🔄",
  NONE = "",
  RIGHT = " ➡️",
  SCREEN = " 🖥️",
  STAGE_STEP = " 🔃",
  UPDATE = " ✏️",
  WAIT = " ⏲️",
  ERROR = " 🚫",
}

/**
 * Font colors used to represent the type of node.
 */
export enum FontColor {
  BLACK = "black",
  WHITE = "white",
}

const DIFF_STATUS_TO_STYLE: Record<flowTypes.DiffStatus, string> = {
  [flowTypes.DiffStatus.ADDED]: `
  color="green",
  penwidth=5,`,
  [flowTypes.DiffStatus.DELETED]: `
  color="red",
  penwidth=5,`,
  [flowTypes.DiffStatus.MODIFIED]: `
  color="orange",
  penwidth=5,`,
};

/**
 * A GraphViz generator for Salesforce flows.
 */
export class GraphVizGenerator extends UmlGenerator {
  // Static mapping from UmlGenerator SkinColor to GraphViz SkinColor
  private static readonly SKIN_COLOR_MAP: Record<number, SkinColor> = {
    [UmlSkinColor.NONE]: SkinColor.NONE,
    [UmlSkinColor.PINK]: SkinColor.PINK,
    [UmlSkinColor.ORANGE]: SkinColor.ORANGE,
    [UmlSkinColor.NAVY]: SkinColor.NAVY,
    [UmlSkinColor.BLUE]: SkinColor.BLUE,
  };

  // Static mapping from UmlGenerator Icon to GraphViz Icon
  private static readonly ICON_MAP: Record<number, Icon> = {
    [UmlIcon.ASSIGNMENT]: Icon.ASSIGNMENT,
    [UmlIcon.CODE]: Icon.CODE,
    [UmlIcon.CREATE_RECORD]: Icon.CREATE_RECORD,
    [UmlIcon.DECISION]: Icon.DECISION,
    [UmlIcon.DELETE]: Icon.DELETE,
    [UmlIcon.LOOKUP]: Icon.LOOKUP,
    [UmlIcon.LOOP]: Icon.LOOP,
    [UmlIcon.NONE]: Icon.NONE,
    [UmlIcon.RIGHT]: Icon.RIGHT,
    [UmlIcon.SCREEN]: Icon.SCREEN,
    [UmlIcon.STAGE_STEP]: Icon.STAGE_STEP,
    [UmlIcon.UPDATE]: Icon.UPDATE,
    [UmlIcon.WAIT]: Icon.WAIT,
    [UmlIcon.ERROR]: Icon.ERROR,
  };

  getHeader(label: string): string {
    return `digraph {
label=<<B>${getLabel(label)}</B>>
title = "${label}";
labelloc = "t";
node [shape=box, style="filled, rounded"]`;
  }

  toUmlString(node: DiagramNode): string {
    const graphvizSkinColor =
      GraphVizGenerator.SKIN_COLOR_MAP[node.color] || SkinColor.NONE;
    const graphvizIcon = GraphVizGenerator.ICON_MAP[node.icon] || Icon.NONE;

    return getNodeBody(
      node,
      node.type,
      graphvizIcon,
      graphvizSkinColor,
      this.generateInnerNodeBodyFromInnerNodes(node, node.innerNodes)
    );
  }

  // Helper method to generate inner node body from DiagramNode's innerNodes
  generateInnerNodeBodyFromInnerNodes(
    parentNode: DiagramNode,
    innerNodes?: InnerNode[]
  ): string {
    if (!innerNodes || innerNodes.length === 0) {
      return "";
    }

    const result: string[] = [];

    for (const innerNode of innerNodes) {
      const innerNodeBody = getInnerNodeBody(
        parentNode,
        FontColor.WHITE,
        getLabel(innerNode.type),
        getLabel(innerNode.label),
        innerNode.content
      );
      result.push(innerNodeBody);
    }

    return result.join(EOL);
  }

  getTransition(transition: Transition): string {
    const label = transition.label ? getLabel(transition.label) : "";
    const metadata = `[label="${label}" color="${
      transition.fault ? "red" : "black"
    }" style="${transition.fault ? "dashed" : ""}"]`;
    return `${transition.from} -> ${transition.to} ${metadata}`;
  }

  getFooter(): string {
    return "}";
  }
}

function getNodeBody(
  node: DiagramNode,
  type: string,
  icon: Icon,
  skinColor: SkinColor,
  innerNodeBody?: string
): string {
  const formattedInnerNodeBody = innerNodeBody
    ? `${EOL}${innerNodeBody}${EOL}`
    : "";
  const fontColor =
    skinColor === SkinColor.NONE ? FontColor.BLACK : FontColor.WHITE;
  const diffStyle = node.diffStatus
    ? DIFF_STATUS_TO_STYLE[node.diffStatus]
    : "";
  const htmlLabel = `${TABLE_BEGIN}
${getTableHeader(type, icon, node)}${formattedInnerNodeBody}
${TABLE_END}`;
  return `${node.id} [
  label=${htmlLabel}
  style="filled, rounded",
  fillcolor="${skinColor}",${diffStyle}
  fontcolor="${fontColor}"
];`;
}

function getInnerNodeBody(
  parentNode: DiagramNode,
  color: FontColor,
  type: string,
  label: string,
  content: string[]
) {
  const formattedLabel = getLabel([type, label].join(" "));
  return `  <TR>
    <TD${getColSpan(
      parentNode
    )} BORDER="1" COLOR="${color}" ALIGN="LEFT" CELLPADDING="6">
      <B>${formattedLabel}</B>
      ${content.map((content) => `<BR ALIGN="LEFT"/>${content}`).join("")}
    </TD>
  </TR>`;
}

function getColSpan(node: DiagramNode) {
  return node.diffStatus ? ' COLSPAN="2"' : "";
}

function getTableHeader(type: string, icon: Icon, node: DiagramNode) {
  return `  <TR>${getDiffIndicator(node.diffStatus)}
    <TD>
      <B>${type}${icon}</B>
    </TD>
  </TR>
  <TR>
    <TD${getColSpan(node)}><U>${getLabel(node.label)}</U></TD>
  </TR>`;
}

function getDiffIndicator(diffStatus: flowTypes.DiffStatus | undefined) {
  let diffIndicator = "";
  let color = "";
  switch (diffStatus) {
    case flowTypes.DiffStatus.ADDED:
      diffIndicator = "+";
      color = "green";
      break;
    case flowTypes.DiffStatus.DELETED:
      diffIndicator = "-";
      color = "red";
      break;
    case flowTypes.DiffStatus.MODIFIED:
      diffIndicator = "Δ";
      color = "#DD7A00";
      break;
    default:
      return "";
  }
  return `<TD BGCOLOR="WHITE" WIDTH="20"><FONT COLOR="${color}"><B>${diffIndicator}</B></FONT></TD>`;
}

function getLabel(label: string) {
  return label
    .replaceAll('"', "'")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
