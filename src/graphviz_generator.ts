/**
 * @fileoverview A Graphviz generator for Salesforce flows.
 */

import * as os from "node:os";
import { Transition } from "./flow_parser.ts";
import * as flowTypes from "./flow_types.ts";
import { UmlGenerator } from "./uml_generator.ts";

const TABLE_BEGIN = `<
<TABLE CELLSPACING="0" CELLPADDING="0">`;
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
  SCREEN = " 🖥️",
  RIGHT = " ➡️",
  CODE = " ⚡",
  DECISION = " 🔷",
  DELETE = " 🗑️",
  STAGE_STEP = " 🔃",
  LOOP = " 🔄",
  LOOKUP = " 🔍",
  CREATE_RECORD = " ➕",
  ASSIGNMENT = " ⬅️",
  NONE = "",
  UPDATE = " ✏️",
  WAIT = " ⏲️",
}

/**
 * Font colors used to represent the type of node.
 */
export enum FontColor {
  BLACK = "black",
  WHITE = "white",
}

/**
 * A GraphViz generator for Salesforce flows.
 */
export class GraphVizGenerator extends UmlGenerator {
  getHeader(label: string): string {
    return `digraph {
label=<<B>${getLabel(label)}</B>>
title = "${label}";
labelloc = "t";
node [shape=box, style=filled]`;
  }

  getFlowApexPluginCall(node: flowTypes.FlowApexPluginCall): string {
    return getNodeBody(node, "Apex Plugin Call", Icon.CODE, SkinColor.NONE);
  }

  getFlowAssignment(node: flowTypes.FlowAssignment): string {
    return getNodeBody(node, "Assignment", Icon.ASSIGNMENT, SkinColor.ORANGE);
  }

  getFlowCollectionProcessor(node: flowTypes.FlowCollectionProcessor): string {
    return getNodeBody(node, "Collection Processor", Icon.NONE, SkinColor.NONE);
  }

  getFlowDecision(node: flowTypes.FlowDecision): string {
    return getNodeBody(
      node,
      "Decision",
      Icon.DECISION,
      SkinColor.ORANGE,
      this.generateInnerNodeBodyForDecisionRules(node, node.rules)
    );
  }

  generateInnerNodeBodyForDecisionRules(
    parentNode: flowTypes.FlowNode,
    rules: flowTypes.FlowRule[]
  ): string {
    const result = [];
    for (const rule of rules) {
      const innerNodeBody = getInnerNodeBody(
        parentNode,
        FontColor.WHITE,
        getLabel(rule.label),
        this.getRuleContent(rule)
      );
      result.push(innerNodeBody);
    }
    return result.join(os.EOL);
  }

  getRuleContent(rule: flowTypes.FlowRule): string[] {
    const result = [];
    let conditionCounter = 1;
    for (const condition of rule.conditions) {
      result.push(
        `${conditionCounter++}. ${condition.leftValueReference} ${
          condition.operator
        } ${toString(condition.rightValue)}`
      );
    }
    const logicLabel =
      result.length > 1 ? `<I>Logic: ${rule.conditionLogic}</I>` : "";
    if (logicLabel) {
      result.push(logicLabel);
    }
    return result;
  }

  getFlowLoop(node: flowTypes.FlowLoop): string {
    return getNodeBody(node, "Loop", Icon.LOOP, SkinColor.ORANGE);
  }

  getFlowOrchestratedStage(node: flowTypes.FlowOrchestratedStage): string {
    return getNodeBody(
      node,
      "Orchestrated Stage",
      Icon.RIGHT,
      SkinColor.NAVY,
      this.getInnerNodeBodyForOrchestratedStage(node, node.stageSteps)
    );
  }

  getInnerNodeBodyForOrchestratedStage(
    parentNode: flowTypes.FlowNode,
    steps: flowTypes.FlowStageStep[]
  ): string {
    if (!steps || steps.length === 0) {
      return "";
    }
    const result = [];
    let counter = 1;
    for (const step of steps) {
      const innerNodeBody = getInnerNodeBody(
        parentNode,
        FontColor.WHITE,
        `${counter++}. ${getLabel(step.label)}`,
        []
      );
      result.push(innerNodeBody);
    }
    return result.join(os.EOL);
  }

  getFlowRecordCreate(node: flowTypes.FlowRecordCreate): string {
    return getNodeBody(
      node,
      "Record Create",
      Icon.CREATE_RECORD,
      SkinColor.PINK
    );
  }

  getFlowRecordDelete(node: flowTypes.FlowRecordDelete): string {
    return getNodeBody(node, "Record Delete", Icon.DELETE, SkinColor.PINK);
  }

  getFlowRecordLookup(node: flowTypes.FlowRecordLookup): string {
    return getNodeBody(node, "Record Lookup", Icon.LOOKUP, SkinColor.PINK);
  }

  getFlowRecordRollback(node: flowTypes.FlowRecordRollback): string {
    return getNodeBody(node, "Record Rollback", Icon.NONE, SkinColor.PINK);
  }

  getFlowRecordUpdate(node: flowTypes.FlowRecordUpdate): string {
    return getNodeBody(node, "Record Update", Icon.UPDATE, SkinColor.PINK);
  }

  getFlowScreen(node: flowTypes.FlowScreen): string {
    return getNodeBody(node, "Screen", Icon.SCREEN, SkinColor.BLUE);
  }

  getFlowStep(node: flowTypes.FlowStep): string {
    return getNodeBody(node, "Step", Icon.NONE, SkinColor.NONE);
  }

  getFlowSubflow(node: flowTypes.FlowSubflow): string {
    return getNodeBody(node, "Subflow", Icon.NONE, SkinColor.NAVY);
  }

  getFlowTransform(node: flowTypes.FlowTransform): string {
    return getNodeBody(node, "Transform", Icon.NONE, SkinColor.NONE);
  }

  getFlowWait(node: flowTypes.FlowWait): string {
    return getNodeBody(node, "Wait", Icon.WAIT, SkinColor.NONE);
  }

  getFlowActionCall(node: flowTypes.FlowActionCall): string {
    return getNodeBody(node, "Action Call", Icon.CODE, SkinColor.NAVY);
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
  node: flowTypes.FlowNode,
  type: string,
  icon: Icon,
  skinColor: SkinColor,
  innerNodeBody?: string
): string {
  const formattedInnerNodeBody = innerNodeBody
    ? `${os.EOL}${innerNodeBody}${os.EOL}`
    : "";
  const fontColor =
    skinColor === SkinColor.NONE ? FontColor.BLACK : FontColor.WHITE;
  const htmlLabel = `${TABLE_BEGIN}
${getTableHeader(type, icon, node)}${formattedInnerNodeBody}
${TABLE_END}`;
  return `${node.name} [
  label=${htmlLabel}
  color="${skinColor}"
  fontcolor="${fontColor}"
];`;
}

function getInnerNodeBody(
  parentNode: flowTypes.FlowNode,
  color: FontColor,
  label: string,
  content: string[]
) {
  return `  <TR>
    <TD${getColSpan(
      parentNode
    )} BORDER="1" COLOR="${color}" ALIGN="LEFT" CELLPADDING="6">
      <B>${getLabel(label)}</B>
      ${content.map((content) => `<BR ALIGN="LEFT"/>${content}`).join("")}
    </TD>
  </TR>`;
}

function getColSpan(node: flowTypes.FlowNode) {
  return node.diffStatus ? ' COLSPAN="2"' : "";
}

function getTableHeader(type: string, icon: Icon, node: flowTypes.FlowNode) {
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

function toString(element: flowTypes.FlowElementReferenceOrValue) {
  if (
    element.apexValue ||
    element.elementReference ||
    element.formulaExpression ||
    element.setupReference ||
    element.sobjectValue ||
    element.stringValue ||
    element.transformValueReference ||
    element.formulaDataType
  ) {
    return (
      element.stringValue ??
      element.sobjectValue ??
      element.apexValue ??
      element.elementReference ??
      element.formulaExpression ??
      element.setupReference ??
      element.transformValueReference ??
      element.formulaDataType
    );
  }
  if (element.dateTimeValue) {
    return new Date(element.dateTimeValue).toLocaleDateString();
  }
  if (element.dateValue) {
    return new Date(element.dateValue).toLocaleDateString();
  }
  if (element.numberValue) {
    return element.numberValue.toString();
  }
  if (element.booleanValue) {
    return element.booleanValue ? "true" : "false";
  }
  return "";
}
