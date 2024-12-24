/**
 * @fileoverview A PlantUML generator for Salesforce flows.
 */

import * as os from "node:os";
import { Transition } from "./flow_parser.ts";
import * as flowTypes from "./flow_types.ts";
import { UmlGenerator } from "./uml_generator.ts";

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
}

/**
 * A PlantUML generator for Salesforce flows.
 */
export class PlantUmlGenerator extends UmlGenerator {
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
}

title ${label}`;
  }

  getFlowApexPluginCall(node: flowTypes.FlowApexPluginCall): string {
    return getHeader(
      node.label,
      node.name,
      "Apex Plugin Call",
      Icon.CODE,
      SkinColor.NONE
    );
  }

  getFlowAssignment(node: flowTypes.FlowAssignment): string {
    return getHeader(
      node.label,
      node.name,
      "Assignment",
      Icon.MENU,
      SkinColor.ORANGE
    );
  }

  getFlowCollectionProcessor(node: flowTypes.FlowCollectionProcessor): string {
    return getHeader(
      node.label,
      node.name,
      "Collection Processor",
      Icon.NONE,
      SkinColor.NONE
    );
  }

  getFlowDecision(node: flowTypes.FlowDecision): string {
    return getHeader(
      node.label,
      node.name,
      "Decision",
      Icon.FORK,
      SkinColor.ORANGE
    );
  }

  getFlowLoop(node: flowTypes.FlowLoop): string {
    return getHeader(
      node.label,
      node.name,
      "Loop",
      Icon.LOOP,
      SkinColor.ORANGE
    );
  }

  getFlowOrchestratedStage(node: flowTypes.FlowOrchestratedStage): string {
    const header = getHeader(
      node.label,
      node.name,
      "Orchestrated Stage",
      Icon.CHEVRON_RIGHT,
      SkinColor.NONE
    );
    const body = getOrchestratedStageBody(node);
    return `${header} {
${body}
}`;
  }

  getFlowRecordCreate(node: flowTypes.FlowRecordCreate): string {
    return getHeader(
      node.label,
      node.name,
      "Record Create",
      Icon.MEDICAL_CROSS,
      SkinColor.PINK
    );
  }

  getFlowRecordDelete(node: flowTypes.FlowRecordDelete): string {
    return getHeader(
      node.label,
      node.name,
      "Record Delete",
      Icon.NONE,
      SkinColor.PINK
    );
  }

  getFlowRecordLookup(node: flowTypes.FlowRecordLookup): string {
    return getHeader(
      node.label,
      node.name,
      "Record Lookup",
      Icon.MAGNIFYING_GLASS,
      SkinColor.PINK
    );
  }

  getFlowRecordRollback(node: flowTypes.FlowRecordRollback): string {
    return getHeader(
      node.label,
      node.name,
      "Record Rollback",
      Icon.NONE,
      SkinColor.PINK
    );
  }

  getFlowRecordUpdate(node: flowTypes.FlowRecordUpdate): string {
    return getHeader(
      node.label,
      node.name,
      "Record Update",
      Icon.NONE,
      SkinColor.PINK
    );
  }

  getFlowScreen(node: flowTypes.FlowScreen): string {
    return getHeader(
      node.label,
      node.name,
      "Screen",
      Icon.BROWSER,
      SkinColor.BLUE
    );
  }

  getFlowStep(node: flowTypes.FlowStep): string {
    return getHeader(node.label, node.name, "Step", Icon.NONE, SkinColor.NONE);
  }

  getFlowSubflow(node: flowTypes.FlowSubflow): string {
    return getHeader(
      node.label,
      node.name,
      "Subflow",
      Icon.NONE,
      SkinColor.NAVY
    );
  }

  getFlowTransform(node: flowTypes.FlowTransform): string {
    return getHeader(
      node.label,
      node.name,
      "Transform",
      Icon.NONE,
      SkinColor.NONE
    );
  }

  getFlowWait(node: flowTypes.FlowWait): string {
    return getHeader(node.label, node.name, "Wait", Icon.NONE, SkinColor.NONE);
  }

  getFlowActionCall(node: flowTypes.FlowActionCall): string {
    return getHeader(
      node.label,
      node.name,
      "Action Call",
      Icon.CODE,
      SkinColor.NAVY
    );
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

function getHeader(
  label: string,
  name: string,
  type: string,
  icon: Icon,
  skinColor: SkinColor
): string {
  return `state "**${type}**${icon} \\n ${getLabel(
    label
  )}" as ${name}${skinColor}`;
}

function getLabel(label: string) {
  return label.replaceAll('"', "'");
}

/**
 * Returns the body of an Orchestrated Stage node.
 * @param node The Orchestrated Stage node.
 */
function getOrchestratedStageBody(
  node: flowTypes.FlowOrchestratedStage
): string {
  if (!node.stageSteps) {
    return "";
  }
  const result: string[] = [];
  for (const step of node.stageSteps) {
    result.push(getStageStepHeader(step, node.name));
  }
  return result.join(os.EOL);
}

/**
 * Returns the header of a Stage Step node.
 * @param stageStep The Stage Step node.
 * @param stageName The name of the Orchestrated Stage node.
 */
function getStageStepHeader(
  stageStep: flowTypes.FlowStageStep,
  stageName: string
): string {
  return getHeader(
    stageStep.label,
    `${stageName}_${stageStep.actionName}`,
    "Stage Step",
    stageStep.actionType === flowTypes.FlowStageStepActionType.STEP_BACKGROUND
      ? Icon.JUSTIFY_CENTER
      : Icon.PENCIL,
    SkinColor.NAVY
  );
}
