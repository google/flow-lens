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
 * @fileoverview A PlantUML generator for Salesforce flows.
 */

import type { Transition } from "./flow_parser.ts";
import * as flowTypes from "./flow_types.ts";
import {
  type DiagramNode,
  Icon as UmlIcon,
  UmlGenerator,
} from "./uml_generator.ts";
const EOL = "\n";

enum SkinColor {
  NONE = "",
  PINK = " <<Pink>>",
  ORANGE = " <<Orange>>",
  NAVY = " <<Navy>>",
  BLUE = " <<Blue>>",
}

enum Icon {
  BROWSER = " <&browser>",
  CHEVRON_RIGHT = " <&chevron-right>",
  CODE = " <&code>",
  FORK = " <&fork>",
  JUSTIFY_CENTER = " <&justify-center>",
  LOOP = " <&loop>",
  MAGNIFYING_GLASS = " <&magnifying-glass>",
  MEDICAL_CROSS = " <&medical-cross>",
  MENU = " <&menu>",
  NONE = "",
  PENCIL = " <&pencil>",
  BAN = " <&ban>",
}

/**
 * Icons used to represent diff status
 */
enum DiffIcon {
  ADDED = "**<&plus{scale=2}>** ",
  DELETED = "**<&minus{scale=2}>** ",
  MODIFIED = "**<&pencil{scale=2}>** ",
  NONE = "",
}

/**
 * A PlantUML generator for Salesforce flows.
 */
export class PlantUmlGenerator extends UmlGenerator {
  // Static mapping from UmlGenerator Icon to PlantUML Icon
  private static readonly ICON_MAP: Record<number, Icon> = {
    [UmlIcon.ASSIGNMENT]: Icon.MENU,
    [UmlIcon.CODE]: Icon.CODE,
    [UmlIcon.CREATE_RECORD]: Icon.MEDICAL_CROSS,
    [UmlIcon.DECISION]: Icon.FORK,
    [UmlIcon.DELETE]: Icon.NONE,
    [UmlIcon.LOOKUP]: Icon.MAGNIFYING_GLASS,
    [UmlIcon.LOOP]: Icon.LOOP,
    [UmlIcon.NONE]: Icon.NONE,
    [UmlIcon.RIGHT]: Icon.CHEVRON_RIGHT,
    [UmlIcon.SCREEN]: Icon.BROWSER,
    [UmlIcon.STAGE_STEP]: Icon.JUSTIFY_CENTER,
    [UmlIcon.UPDATE]: Icon.PENCIL,
    [UmlIcon.WAIT]: Icon.NONE,
    [UmlIcon.ERROR]: Icon.BAN,
  };

  // Static mapping from flowTypes.DiffStatus to DiffIcon
  private static readonly DIFF_ICON_MAP: Record<string, DiffIcon> = {
    [flowTypes.DiffStatus.ADDED]: DiffIcon.ADDED,
    [flowTypes.DiffStatus.DELETED]: DiffIcon.DELETED,
    [flowTypes.DiffStatus.MODIFIED]: DiffIcon.MODIFIED,
  };

  private static readonly DIFF_TO_STYLE_CLASS: Record<string, string> = {
    [flowTypes.DiffStatus.ADDED]: " <<Added>>",
    [flowTypes.DiffStatus.DELETED]: " <<Deleted>>",
    [flowTypes.DiffStatus.MODIFIED]: " <<Modified>>",
  };

  getHeader(label: string): string {
    return `skinparam State {
  BackgroundColor<<Pink>> #F9548A
  FontColor<<Pink>> white

  BackgroundColor<<Orange>> #DD7A00
  FontColor<<Orange>> white

  BackgroundColor<<Navy>> #344568
  FontColor<<Navy>> white

  BackgroundColor<<Blue>> #1B96FF
  FontColor<<Blue>> white

  BorderColor<<Deleted>> red
  BorderThickness<<Deleted>> 5

  BorderColor<<Added>> green
  BorderThickness<<Added>> 5

  BorderColor<<Modified>> orange
  BorderThickness<<Modified>> 5
}

title ${label}`;
  }

  toUmlString(node: DiagramNode): string {
    // Map SkinColor enum values from UmlGenerator to PlantUML's SkinColor
    const skinColorMap: Record<number, SkinColor> = {
      0: SkinColor.NONE,
      1: SkinColor.PINK,
      2: SkinColor.ORANGE,
      3: SkinColor.NAVY,
      4: SkinColor.BLUE,
    };

    const plantUmlSkinColor = skinColorMap[node.color] || SkinColor.NONE;
    const plantUmlIcon = PlantUmlGenerator.ICON_MAP[node.icon] || Icon.NONE;
    const diffIcon = node.diffStatus
      ? PlantUmlGenerator.DIFF_ICON_MAP[node.diffStatus]
      : DiffIcon.NONE;
    const diffStyleClass = node.diffStatus
      ? PlantUmlGenerator.DIFF_TO_STYLE_CLASS[node.diffStatus]
      : "";

    let result = generateNode(
      node.label,
      node.id,
      node.type,
      plantUmlIcon,
      plantUmlSkinColor,
      diffIcon,
      diffStyleClass,
    );

    // Handle inner nodes if they exist
    if (node.innerNodes && node.innerNodes.length > 0) {
      result += `${EOL}${this.generateInnerNodesString(node)}`;
    }

    return result;
  }

  private generateInnerNodesString(parentNode: DiagramNode): string {
    if (!parentNode.innerNodes) return "";

    const result: string[] = [];
    parentNode.innerNodes.forEach((innerNode) => {
      const prefix = `${parentNode.id}: `;
      const bold = innerNode.type ? `${prefix}**${innerNode.type}**` : "";
      const label = innerNode.label ? `${prefix}__${innerNode.label}__` : "";
      const content = innerNode.content
        .map((content) => `${prefix}${content}`)
        .join(EOL);
      result.push([bold, label, content].filter(Boolean).join(EOL));
    });

    return result.join(`${EOL}${parentNode.id}: ---${EOL}`);
  }

  getTransition(transition: Transition): string {
    const label = transition.label ? ` : ${transition.label}` : "";
    const arrow = transition.fault ? "-[#red,dashed]->" : "-->";
    return `${
      transition.from === "FLOW_START" ? "[*]" : transition.from
    } ${arrow} ${transition.to}${label}`;
  }

  getFooter(): string {
    return "";
  }
}

function generateNode(
  label: string,
  name: string,
  type: string,
  icon: Icon,
  skinColor: SkinColor,
  diffIcon: DiffIcon = DiffIcon.NONE,
  diffStyleClass: string = "",
): string {
  return `state "${diffIcon}**${type}**${icon} \\n ${
    getLabel(
      label,
    )
  }" as ${name}${skinColor}${diffStyleClass}`;
}

function getLabel(label: string) {
  return label.replaceAll('"', "'");
}
