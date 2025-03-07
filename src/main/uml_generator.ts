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
 * @fileoverview This file contains the UmlGenerator class which is used to
 * generate a UML string representation of a Salesforce flow.
 */

import { ParsedFlow, Transition } from "./flow_parser.ts";
import * as flowTypes from "./flow_types.ts";

const EOL = Deno.build.os === "windows" ? "\r\n" : "\n";

/**
 * The skin color of the node.
 */
export enum SkinColor {
  NONE,
  PINK,
  ORANGE,
  NAVY,
  BLUE,
}

/**
 * The icon of the node.
 */
export enum Icon {
  ASSIGNMENT,
  CODE,
  CREATE_RECORD,
  DECISION,
  DELETE,
  LOOKUP,
  LOOP,
  NONE,
  RIGHT,
  SCREEN,
  STAGE_STEP,
  UPDATE,
  WAIT,
}

/**
 * The content of the node.
 */
export interface DiagramNode {
  id: string;
  label: string;
  type: string;
  color: SkinColor;
  icon: Icon;
  diffStatus?: flowTypes.DiffStatus;
  innerNodes?: InnerNode[];
}

/**
 * The inner node of the node.
 */
export interface InnerNode {
  id: string;
  type: string;
  label: string;
  content: string[];
}

/**
 * The UmlGenerator class is used to generate a UML string representation of a
 * Salesforce flow.
 *
 * This class is abstract and must be extended to provide the specific
 * implementations for each of the flow element types.
 * There will be one instance of the UmlGenerator for each diagramming tool.
 */
export abstract class UmlGenerator {
  constructor(private readonly parsedFlow: ParsedFlow) {}

  generateUml(): string {
    const result = [
      this.getHeader(this.parsedFlow.label!),
      this.processFlowElements<flowTypes.FlowApexPluginCall>(
        this.parsedFlow.apexPluginCalls,
        (node) => this.getFlowApexPluginCall(node)
      ),
      this.processFlowElements<flowTypes.FlowAssignment>(
        this.parsedFlow.assignments,
        (node) => this.getFlowAssignment(node)
      ),
      this.processFlowElements<flowTypes.FlowCollectionProcessor>(
        this.parsedFlow.collectionProcessors,
        (node) => this.getFlowCollectionProcessor(node)
      ),
      this.processFlowElements<flowTypes.FlowDecision>(
        this.parsedFlow.decisions,
        (node) => this.getFlowDecision(node)
      ),
      this.processFlowElements<flowTypes.FlowLoop>(
        this.parsedFlow.loops,
        (node) => this.getFlowLoop(node)
      ),
      this.processFlowElements<flowTypes.FlowOrchestratedStage>(
        this.parsedFlow.orchestratedStages,
        (node) => this.getFlowOrchestratedStage(node)
      ),
      this.processFlowElements<flowTypes.FlowRecordCreate>(
        this.parsedFlow.recordCreates,
        (node) => this.getFlowRecordCreate(node)
      ),
      this.processFlowElements<flowTypes.FlowRecordDelete>(
        this.parsedFlow.recordDeletes,
        (node) => this.getFlowRecordDelete(node)
      ),
      this.processFlowElements<flowTypes.FlowRecordLookup>(
        this.parsedFlow.recordLookups,
        (node) => this.getFlowRecordLookup(node)
      ),
      this.processFlowElements<flowTypes.FlowRecordRollback>(
        this.parsedFlow.recordRollbacks,
        (node) => this.getFlowRecordRollback(node)
      ),
      this.processFlowElements<flowTypes.FlowRecordUpdate>(
        this.parsedFlow.recordUpdates,
        (node) => this.getFlowRecordUpdate(node)
      ),
      this.processFlowElements<flowTypes.FlowScreen>(
        this.parsedFlow.screens,
        (node) => this.getFlowScreen(node)
      ),
      this.processFlowElements<flowTypes.FlowStep>(
        this.parsedFlow.steps,
        (node) => this.getFlowStep(node)
      ),
      this.processFlowElements<flowTypes.FlowSubflow>(
        this.parsedFlow.subflows,
        (node) => this.getFlowSubflow(node)
      ),
      this.processFlowElements<flowTypes.FlowTransform>(
        this.parsedFlow.transforms,
        (node) => this.getFlowTransform(node)
      ),
      this.processFlowElements<flowTypes.FlowWait>(
        this.parsedFlow.waits,
        (node) => this.getFlowWait(node)
      ),
      this.processFlowElements<flowTypes.FlowActionCall>(
        this.parsedFlow.actionCalls,
        (node) => this.getFlowActionCall(node)
      ),
      this.processTransitions(this.parsedFlow.transitions),
      this.getFooter(),
    ].filter((element) => element !== "");
    return result.join(EOL);
  }

  abstract getHeader(label: string): string;
  abstract toUmlString(node: DiagramNode): string;
  abstract getTransition(transition: Transition): string;
  abstract getFooter(): string;

  private getFlowApexPluginCall(node: flowTypes.FlowApexPluginCall): string {
    return this.toUmlString({
      id: node.name,
      label: node.label,
      diffStatus: node.diffStatus,
      type: "Apex Plugin Call",
      color: SkinColor.NONE,
      icon: Icon.CODE,
    });
  }

  private getFlowAssignment(node: flowTypes.FlowAssignment): string {
    return this.toUmlString({
      id: node.name,
      label: node.label,
      diffStatus: node.diffStatus,
      type: "Assignment",
      color: SkinColor.ORANGE,
      icon: Icon.ASSIGNMENT,
    });
  }

  private getFlowCollectionProcessor(
    node: flowTypes.FlowCollectionProcessor
  ): string {
    return this.toUmlString({
      id: node.name,
      label: node.label,
      diffStatus: node.diffStatus,
      type: "Collection Processor",
      color: SkinColor.NONE,
      icon: Icon.LOOP,
    });
  }

  private getFlowDecision(node: flowTypes.FlowDecision): string {
    return this.toUmlString({
      id: node.name,
      label: node.label,
      diffStatus: node.diffStatus,
      type: "Decision",
      color: SkinColor.ORANGE,
      icon: Icon.DECISION,
      innerNodes: this.getFlowDecisionInnerNodes(node), // special case
    });
  }

  private getFlowDecisionInnerNodes(node: flowTypes.FlowDecision): InnerNode[] {
    const result: InnerNode[] = [];
    if (!node.rules) {
      return result;
    }
    for (const rule of node.rules) {
      let conditionCounter = 1;
      const conditions = rule.conditions.map(
        (condition) =>
          `${conditionCounter++}. ${condition.leftValueReference} ${
            condition.operator
          } ${toString(condition.rightValue)}`
      );
      if (conditions.length > 1) {
        const logicLabel = `Logic: ${rule.conditionLogic}`;
        conditions.push(logicLabel);
      }
      result.push({
        id: rule.name,
        type: "Rule",
        label: rule.label,
        content: conditions,
      });
    }
    return result;
  }

  private getFlowLoop(node: flowTypes.FlowLoop): string {
    return this.toUmlString({
      id: node.name,
      label: node.label,
      diffStatus: node.diffStatus,
      type: "Loop",
      color: SkinColor.ORANGE,
      icon: Icon.LOOP,
    });
  }

  private getFlowOrchestratedStage(
    node: flowTypes.FlowOrchestratedStage
  ): string {
    return this.toUmlString({
      id: node.name,
      label: node.label,
      diffStatus: node.diffStatus,
      type: "Orchestrated Stage",
      color: SkinColor.NAVY,
      icon: Icon.RIGHT,
      innerNodes: this.getFlowOrchestratedStageInnerNodes(node), // special case
    });
  }

  private getFlowOrchestratedStageInnerNodes(
    node: flowTypes.FlowOrchestratedStage
  ): InnerNode[] {
    let counter = 1;
    const result: InnerNode[] = [];
    if (!node.stageSteps) {
      return result;
    }
    for (const step of node.stageSteps) {
      result.push({
        id: `${node.name}.${step.actionName}`,
        type: "Step",
        label: `${counter++}. ${step.label}`,
        content: [],
      });
    }
    return result;
  }

  private getFlowRecordCreate(node: flowTypes.FlowRecordCreate): string {
    return this.toUmlString({
      id: node.name,
      label: node.label,
      diffStatus: node.diffStatus,
      type: "Record Create",
      color: SkinColor.PINK,
      icon: Icon.CREATE_RECORD,
    });
  }

  private getFlowRecordDelete(node: flowTypes.FlowRecordDelete): string {
    return this.toUmlString({
      id: node.name,
      label: node.label,
      diffStatus: node.diffStatus,
      type: "Record Delete",
      color: SkinColor.PINK,
      icon: Icon.DELETE,
    });
  }

  private getFlowRecordLookup(node: flowTypes.FlowRecordLookup): string {
    return this.toUmlString({
      id: node.name,
      label: node.label,
      diffStatus: node.diffStatus,
      type: "Record Lookup",
      color: SkinColor.PINK,
      icon: Icon.LOOKUP,
    });
  }

  private getFlowRecordRollback(node: flowTypes.FlowRecordRollback): string {
    return this.toUmlString({
      id: node.name,
      label: node.label,
      diffStatus: node.diffStatus,
      type: "Record Rollback",
      color: SkinColor.PINK,
      icon: Icon.NONE,
    });
  }

  private getFlowRecordUpdate(node: flowTypes.FlowRecordUpdate): string {
    return this.toUmlString({
      id: node.name,
      label: node.label,
      diffStatus: node.diffStatus,
      type: "Record Update",
      color: SkinColor.PINK,
      icon: Icon.UPDATE,
    });
  }

  private getFlowScreen(node: flowTypes.FlowScreen): string {
    return this.toUmlString({
      id: node.name,
      label: node.label,
      diffStatus: node.diffStatus,
      type: "Screen",
      color: SkinColor.BLUE,
      icon: Icon.SCREEN,
    });
  }

  private getFlowStep(node: flowTypes.FlowStep): string {
    return this.toUmlString({
      id: node.name,
      label: node.label,
      diffStatus: node.diffStatus,
      type: "Step",
      color: SkinColor.NONE,
      icon: Icon.STAGE_STEP,
    });
  }

  private getFlowSubflow(node: flowTypes.FlowSubflow): string {
    return this.toUmlString({
      id: node.name,
      label: node.label,
      diffStatus: node.diffStatus,
      type: "Subflow",
      color: SkinColor.NAVY,
      icon: Icon.RIGHT,
    });
  }

  private getFlowTransform(node: flowTypes.FlowTransform): string {
    return this.toUmlString({
      id: node.name,
      label: node.label,
      diffStatus: node.diffStatus,
      type: "Transform",
      color: SkinColor.NONE,
      icon: Icon.CODE,
    });
  }

  private getFlowWait(node: flowTypes.FlowWait): string {
    return this.toUmlString({
      id: node.name,
      label: node.label,
      diffStatus: node.diffStatus,
      type: "Wait",
      color: SkinColor.NONE,
      icon: Icon.WAIT,
    });
  }

  private getFlowActionCall(node: flowTypes.FlowActionCall): string {
    return this.toUmlString({
      id: node.name,
      label: node.label,
      diffStatus: node.diffStatus,
      type: "Action Call",
      color: SkinColor.NAVY,
      icon: Icon.CODE,
    });
  }

  private processFlowElements<T extends flowTypes.FlowNode>(
    elements: T[] | undefined,
    elementProcessor: (element: T) => string
  ): string {
    return elements?.map(elementProcessor).join(EOL) ?? "";
  }

  private processTransitions(transitions: Transition[] | undefined): string {
    return (
      transitions
        ?.map((transition) => this.getTransition(transition))
        .join(EOL) ?? ""
    );
  }
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
