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

import type { ParsedFlow, Transition } from "./flow_parser.ts";
import * as flowTypes from "./flow_types.ts";
import { EOL } from "./constants.ts";

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
  ERROR,
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
      this.getFlowStart(),
      this.processFlowElements<flowTypes.FlowApexPluginCall>(
        this.parsedFlow.apexPluginCalls,
        (node) => this.getFlowApexPluginCall(node),
      ),
      this.processFlowElements<flowTypes.FlowAssignment>(
        this.parsedFlow.assignments,
        (node) => this.getFlowAssignment(node),
      ),
      this.processFlowElements<flowTypes.FlowCollectionProcessor>(
        this.parsedFlow.collectionProcessors,
        (node) => this.getFlowCollectionProcessor(node),
      ),
      this.processFlowElements<flowTypes.FlowDecision>(
        this.parsedFlow.decisions,
        (node) => this.getFlowDecision(node),
      ),
      this.processFlowElements<flowTypes.FlowLoop>(
        this.parsedFlow.loops,
        (node) => this.getFlowLoop(node),
      ),
      this.processFlowElements<flowTypes.FlowOrchestratedStage>(
        this.parsedFlow.orchestratedStages,
        (node) => this.getFlowOrchestratedStage(node),
      ),
      this.processFlowElements<flowTypes.FlowRecordCreate>(
        this.parsedFlow.recordCreates,
        (node) => this.getFlowRecordCreate(node),
      ),
      this.processFlowElements<flowTypes.FlowRecordDelete>(
        this.parsedFlow.recordDeletes,
        (node) => this.getFlowRecordDelete(node),
      ),
      this.processFlowElements<flowTypes.FlowRecordLookup>(
        this.parsedFlow.recordLookups,
        (node) => this.getFlowRecordLookup(node),
      ),
      this.processFlowElements<flowTypes.FlowRecordRollback>(
        this.parsedFlow.recordRollbacks,
        (node) => this.getFlowRecordRollback(node),
      ),
      this.processFlowElements<flowTypes.FlowRecordUpdate>(
        this.parsedFlow.recordUpdates,
        (node) => this.getFlowRecordUpdate(node),
      ),
      this.processFlowElements<flowTypes.FlowScreen>(
        this.parsedFlow.screens,
        (node) => this.getFlowScreen(node),
      ),
      this.processFlowElements<flowTypes.FlowStep>(
        this.parsedFlow.steps,
        (node) => this.getFlowStep(node),
      ),
      this.processFlowElements<flowTypes.FlowSubflow>(
        this.parsedFlow.subflows,
        (node) => this.getFlowSubflow(node),
      ),
      this.processFlowElements<flowTypes.FlowTransform>(
        this.parsedFlow.transforms,
        (node) => this.getFlowTransform(node),
      ),
      this.processFlowElements<flowTypes.FlowWait>(
        this.parsedFlow.waits,
        (node) => this.getFlowWait(node),
      ),
      this.processFlowElements<flowTypes.FlowActionCall>(
        this.parsedFlow.actionCalls,
        (node) => this.getFlowActionCall(node),
      ),
      this.processFlowElements<flowTypes.FlowCustomError>(
        this.parsedFlow.customErrors,
        (node) => this.getFlowCustomError(node),
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

  private getFlowStart(): string {
    if (!this.parsedFlow.start) {
      return "";
    }

    const start = this.parsedFlow.start;
    const entryCriteria: string[] = [];

    // Add process type information from the flow
    if (this.parsedFlow.processType) {
      entryCriteria.push(`Process Type: ${this.parsedFlow.processType}`);
    }

    // Add trigger type information
    if (start.triggerType) {
      entryCriteria.push(`Trigger Type: ${start.triggerType}`);
    }

    // Add object information for record-triggered flows
    if (start.object) {
      entryCriteria.push(`Object: ${start.object}`);
    }

    // Add record trigger type information
    if (start.recordTriggerType) {
      entryCriteria.push(`Record Trigger: ${start.recordTriggerType}`);
    }

    // Add entry type information
    if (start.entryType) {
      entryCriteria.push(`Entry Type: ${start.entryType}`);
    }

    // Add filter information
    if (start.filterLogic && start.filters && start.filters.length > 0) {
      entryCriteria.push(`Filter Logic: ${start.filterLogic}`);
      start.filters.forEach((filter, index) => {
        entryCriteria.push(
          `${index + 1}. ${filter.field} ${filter.operator} ${
            toString(
              filter.value,
            )
          }`,
        );
      });
    }

    // Add filter formula if present
    if (start.filterFormula) {
      entryCriteria.push(`Filter Formula: ${start.filterFormula}`);
    }

    // Add schedule information for scheduled flows
    if (start.schedule) {
      entryCriteria.push(
        `Schedule: ${start.schedule.frequency} starting ${start.schedule.startDate} at ${start.schedule.startTime}`,
      );
    }

    // Add capability information
    if (start.capabilityTypes && start.capabilityTypes.length > 0) {
      start.capabilityTypes.forEach((capability, index) => {
        entryCriteria.push(
          `Capability ${index + 1}: ${capability.capabilityName}`,
        );
      });
    }

    // Add form information for form-triggered flows
    if (start.form) {
      entryCriteria.push(`Form: ${start.form}`);
    }

    // Add segment information
    if (start.segment) {
      entryCriteria.push(`Segment: ${start.segment}`);
    }

    // Add flow run as user information
    if (start.flowRunAsUser) {
      entryCriteria.push(`Run As: ${start.flowRunAsUser}`);
    }

    // If no specific criteria found, add a default message
    if (entryCriteria.length === 0) {
      entryCriteria.push("No specific entry criteria defined");
    }

    return this.toUmlString({
      id: "FLOW_START",
      label: "Flow Start",
      type: "Flow Start",
      color: SkinColor.NONE,
      icon: Icon.NONE,
      diffStatus: start.diffStatus,
      innerNodes: [
        {
          id: "FlowStart__EntryCriteria",
          type: "Flow Details",
          label: "",
          content: entryCriteria,
        },
      ],
    });
  }

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
      innerNodes: this.getFlowAssignmentInnerNodes(node),
    });
  }

  private getFlowAssignmentInnerNodes(
    node: flowTypes.FlowAssignment,
  ): InnerNode[] {
    const result: InnerNode[] = [];
    if (!node.assignmentItems) {
      return result;
    }

    const assignments: string[] = [];
    for (const item of node.assignmentItems) {
      const operator = item.operator === flowTypes.FlowAssignmentOperator.ASSIGN
        ? "="
        : item.operator;
      assignments.push(
        `${item.assignToReference} ${operator} ${toString(item.value)}`,
      );
    }

    result.push({
      id: `${node.name}__Assignments`,
      type: "",
      label: "",
      content: assignments,
    });

    return result;
  }

  private getFlowCollectionProcessor(
    node: flowTypes.FlowCollectionProcessor,
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
          `${conditionCounter++}. ${condition.leftValueReference} ${condition.operator} ${
            toString(condition.rightValue)
          }`,
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
    node: flowTypes.FlowOrchestratedStage,
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
    node: flowTypes.FlowOrchestratedStage,
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
      innerNodes: this.getFlowRecordLookupInnerNodes(node),
    });
  }

  private getFlowRecordLookupInnerNodes(
    node: flowTypes.FlowRecordLookup,
  ): InnerNode[] {
    const innerNodeContent: string[] = [];
    innerNodeContent.push(...this.getFieldsQueried(node));
    innerNodeContent.push(...this.getFilterCriteria(node));
    const limit = this.getLimit(node);
    if (limit) {
      innerNodeContent.push(limit);
    }

    let innerNode = {
      id: `${node.name}__LookupDetails`,
      type: `sObject: ${node.object}`,
      label: "",
      content: innerNodeContent,
    };
    return [innerNode];
  }

  private getFieldsQueried(node: flowTypes.FlowRecordLookup): string[] {
    const result: string[] = [];
    if (node.queriedFields && node.queriedFields.length > 0) {
      result.push("Fields Queried:");
      result.push(node.queriedFields.join(", "));
    } else {
      result.push("Fields Queried: all");
    }
    return result;
  }

  private getFilterCriteria(node: flowTypes.FlowRecordLookup): string[] {
    const result: string[] = [
      `Filter Logic: ${node.filterLogic ? node.filterLogic : "None"}`,
    ];
    const filters = node.filters?.map((filter, index) => {
      return `${index + 1}. ${filter.field} ${filter.operator} ${
        toString(
          filter.value,
        )
      }`;
    });
    if (filters) {
      result.push(...filters);
    }
    return result;
  }

  private getLimit(node: flowTypes.FlowRecordLookup): string {
    if (node.getFirstRecordOnly) {
      return "Limit: First Record Only";
    }
    if (node.limit) {
      return `Limit: ${node.limit}`;
    }
    return "Limit: All Records";
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
      innerNodes: this.getFlowRecordUpdateInnerNodes(node),
    });
  }

  private getFlowRecordUpdateInnerNodes(
    node: flowTypes.FlowRecordUpdate,
  ): InnerNode[] {
    const innerNodeContent: string[] = [];

    if (node.filters && node.filters.length > 0) {
      innerNodeContent.push("Filter Criteria:");
      node.filters.forEach((filter, index) => {
        innerNodeContent.push(
          `${index + 1}. ${filter.field} ${filter.operator} ${
            toString(
              filter.value,
            )
          }`,
        );
      });
    }

    if (node.inputAssignments && node.inputAssignments.length > 0) {
      innerNodeContent.push("Field Updates:");
      node.inputAssignments.forEach((assignment) => {
        innerNodeContent.push(
          `${assignment.field} = ${toString(assignment.value)}`,
        );
      });
    }

    const type = node.inputReference ? "Reference Update" : "Direct Update";
    const label = node.inputReference
      ? node.inputReference
      : `sObject: ${node.object}`;

    return [
      {
        id: `${node.name}__UpdateDetails`,
        type: type,
        label: label,
        content: innerNodeContent,
      },
    ];
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

  private getFlowCustomError(node: flowTypes.FlowCustomError): string {
    return this.toUmlString({
      id: node.name,
      label: node.label,
      diffStatus: node.diffStatus,
      type: "Custom Error",
      color: SkinColor.NAVY,
      icon: Icon.ERROR,
      innerNodes: this.getFlowCustomErrorInnerNodes(node),
    });
  }

  private getFlowCustomErrorInnerNodes(
    node: flowTypes.FlowCustomError,
  ): InnerNode[] {
    const innerNodeContent: string[] = [];

    if (node.customErrorMessages && node.customErrorMessages.length > 0) {
      node.customErrorMessages.forEach((message, index) => {
        const fieldInfo = message.fieldSelection
          ? ` (Field: ${message.fieldSelection})`
          : "";
        innerNodeContent.push(
          `${index + 1}. ${message.errorMessage}${fieldInfo}`,
        );
      });
    }

    return [
      {
        id: `${node.name}__ErrorDetails`,
        type: node.description || "Custom Error Details",
        label: "Error Messages:",
        content: innerNodeContent,
      },
    ];
  }

  private processFlowElements<T extends flowTypes.FlowNode>(
    elements: T[] | undefined,
    elementProcessor: (element: T) => string,
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

function toString(element: flowTypes.FlowElementReferenceOrValue | undefined) {
  if (!element) {
    return "";
  }
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
    return element.numberValue;
  }
  if (element.booleanValue !== undefined) {
    return element.booleanValue;
  }
  return "";
}
