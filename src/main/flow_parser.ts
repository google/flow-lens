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
 * @fileoverview A parser for flow definitions. Transforms the XML string into
 * a structured object.
 */

import { Parser } from "xml2js";
import * as flowTypes from "./flow_types.ts";

const FAULT = "Fault";
const END = "End";
const START = "FLOW_START";

const END_NODE: flowTypes.FlowNode = {
  name: "END",
  label: END,
  locationX: 0,
  locationY: 0,
  elementSubtype: END,
  description: END,
};

/**
 * Error messages used while parsing flows
 */
export const ERROR_MESSAGES = {
  couldNotFindConnectedNode: (node: string) =>
    `Could not find connected node for ${node}`,
  flowStartNotDefined: "Flow start is not defined",
};

/**
 * A transition between two nodes.
 *
 * This is used to generate the UML diagram.
 */
export interface Transition {
  from: string;
  to: string;
  fault: boolean;
  label?: string;
}

/**
 * A parsed flow definition.
 *
 * This will be used to generate the UML diagram.
 * This is not a complete representation of the flow definition; it only
 * includes the nodes that are needed to generate the UML diagram.
 * There may be additional types that need to be added here to support
 * the full UML generation.
 */
export interface ParsedFlow {
  label?: string;
  processType?: flowTypes.FlowProcessType;
  start?: flowTypes.FlowStart;
  apexPluginCalls?: flowTypes.FlowApexPluginCall[];
  assignments?: flowTypes.FlowAssignment[];
  collectionProcessors?: flowTypes.FlowCollectionProcessor[];
  customErrors?: flowTypes.FlowCustomError[];
  decisions?: flowTypes.FlowDecision[];
  loops?: flowTypes.FlowLoop[];
  orchestratedStages?: flowTypes.FlowOrchestratedStage[];
  recordCreates?: flowTypes.FlowRecordCreate[];
  recordDeletes?: flowTypes.FlowRecordDelete[];
  recordLookups?: flowTypes.FlowRecordLookup[];
  recordRollbacks?: flowTypes.FlowRecordRollback[];
  recordUpdates?: flowTypes.FlowRecordUpdate[];
  screens?: flowTypes.FlowScreen[];
  steps?: flowTypes.FlowStep[];
  subflows?: flowTypes.FlowSubflow[];
  transforms?: flowTypes.FlowTransform[];
  waits?: flowTypes.FlowWait[];
  actionCalls?: flowTypes.FlowActionCall[];
  transitions?: Transition[];
  nameToNode?: Map<string, flowTypes.FlowNode>;
}

/**
 * Parses a flow definition from an XML string.
 */
export class FlowParser {
  private readonly beingParsed: ParsedFlow;

  constructor(private readonly flowXml: string) {
    this.beingParsed = {
      nameToNode: new Map<string, flowTypes.FlowNode>(),
    };
  }

  async generateFlowDefinition(): Promise<ParsedFlow> {
    const flowFromXml = await this.parseXmlFile();
    return this.generateParsedFlow(flowFromXml.Flow);
  }

  private async parseXmlFile(): Promise<flowTypes.FlowDefinition> {
    return new Promise<flowTypes.FlowDefinition>((resolve, reject) => {
      new Parser({ explicitArray: false }).parseString(
        this.flowXml,
        (err: unknown, result: flowTypes.FlowDefinition) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        },
      );
    });
  }

  private generateParsedFlow(flow: flowTypes.Flow): ParsedFlow {
    this.populateFlowNodes(flow);
    this.beingParsed.nameToNode = this.generateNameToNodeMap();
    this.beingParsed.transitions = this.populateTransitions();
    return this.beingParsed;
  }

  private populateFlowNodes(flow: flowTypes.Flow) {
    this.beingParsed.label = flow.label;
    this.beingParsed.processType = flow.processType;
    this.beingParsed.start = flow.start;
    this.validateFlowStart();
    setFlowStart(this.beingParsed.start);

    this.beingParsed.apexPluginCalls = ensureArray(flow.apexPluginCalls);
    this.beingParsed.assignments = ensureArray(flow.assignments);
    setAssignments(this.beingParsed.assignments);
    this.beingParsed.collectionProcessors = ensureArray(
      flow.collectionProcessors,
    );
    this.beingParsed.customErrors = ensureArray(flow.customErrors);
    setCustomErrorMessages(this.beingParsed.customErrors);
    this.beingParsed.decisions = ensureArray(flow.decisions);
    setDecisionRules(this.beingParsed.decisions);
    this.beingParsed.loops = ensureArray(flow.loops);
    this.beingParsed.orchestratedStages = ensureArray(flow.orchestratedStages);
    setOrchestratedStageSteps(this.beingParsed.orchestratedStages);
    this.beingParsed.recordCreates = ensureArray(flow.recordCreates);
    this.beingParsed.recordDeletes = ensureArray(flow.recordDeletes);
    this.beingParsed.recordLookups = ensureArray(flow.recordLookups);
    setRecordLookups(this.beingParsed.recordLookups);
    this.beingParsed.recordRollbacks = ensureArray(flow.recordRollbacks);
    this.beingParsed.recordUpdates = ensureArray(flow.recordUpdates);
    setRecordUpdates(this.beingParsed.recordUpdates);
    this.beingParsed.screens = ensureArray(flow.screens);
    this.beingParsed.steps = ensureArray(flow.steps);
    this.beingParsed.subflows = ensureArray(flow.subflows);
    this.beingParsed.transforms = ensureArray(flow.transforms);
    this.beingParsed.waits = ensureArray(flow.waits);
    this.beingParsed.actionCalls = ensureArray(flow.actionCalls);
  }

  /**
   * Generates a map of node names to node objects.
   *
   * Node name contains the API name of a flow node and is unique across
   * all elements within the flow.
   * Here we make a special case for the END node, which is not defined in the
   * XML.
   */
  private generateNameToNodeMap(): Map<string, flowTypes.FlowNode> {
    const nameToNode = new Map<string, flowTypes.FlowNode>();
    nameToNode.set(END_NODE.name, END_NODE);
    nameToNode.set(START, this.beingParsed.start as flowTypes.FlowNode);
    const toProcess = [
      this.beingParsed.apexPluginCalls,
      this.beingParsed.assignments,
      this.beingParsed.collectionProcessors,
      this.beingParsed.customErrors,
      this.beingParsed.decisions,
      this.beingParsed.loops,
      this.beingParsed.orchestratedStages,
      this.beingParsed.recordCreates,
      this.beingParsed.recordDeletes,
      this.beingParsed.recordLookups,
      this.beingParsed.recordRollbacks,
      this.beingParsed.recordUpdates,
      this.beingParsed.screens,
      this.beingParsed.steps,
      this.beingParsed.subflows,
      this.beingParsed.transforms,
      this.beingParsed.waits,
      this.beingParsed.actionCalls,
    ];
    for (const nodeArray of toProcess) {
      if (!nodeArray) {
        continue;
      }
      for (const node of nodeArray) {
        nameToNode.set(node.name, node);
      }
    }
    return nameToNode;
  }

  private validateFlowStart() {
    if (!this.beingParsed.start) {
      throw new Error(ERROR_MESSAGES.flowStartNotDefined);
    }
    this.beingParsed.start.name = START;
  }

  /**
   * Populate Transitions
   *
   * This populates the transitions represented in the Flow by performing a
   * breadth first search from the start node.
   * Cycles are detected and skipped by referencing the visited node names.
   */
  private populateTransitions(): Transition[] {
    const result: Transition[] = [];
    const start = this.beingParsed.start;
    if (!start) {
      return result;
    }
    const queue: flowTypes.FlowNode[] = [start];
    const visitedNodes = new Set<string>();
    while (queue.length > 0) {
      const node = queue.shift();
      if (!node || visitedNodes.has(node.name)) {
        continue;
      }
      visitedNodes.add(node.name);
      const transitions = this.getTransitionsForNode(node);
      for (const transition of transitions) {
        const toNode = this.beingParsed.nameToNode?.get(transition.to);
        if (toNode) {
          queue.push(toNode);
        }
      }
      result.push(...transitions);
    }
    return result;
  }

  /**
   * Get the collection of transitions for a given node
   *
   * Unfortunately, there are multiple different properties which reference a
   * `flowTypes.FlowConnector` and it is not possible to determine which
   * property is being referenced without inspecting the XML.
   *
   * This method inspects all possible properties based on the type of the node
   * and returns the transitions for the node.
   */
  private getTransitionsForNode(node: flowTypes.FlowNode): Transition[] {
    const transitions: Transition[] = [];
    if (isFlowStart(node)) {
      transitions.push(...this.getTransitionsFromFlowStart(node));
    } else if (
      isRecordCreate(node) ||
      isRecordDelete(node) ||
      isRecordLookup(node) ||
      isRecordUpdate(node) ||
      isApexPluginCall(node) ||
      isFlowActionCall(node)
    ) {
      transitions.push(...this.getTransitionsFromConnectorOrFault(node));
    } else if (isStep(node)) {
      transitions.push(...this.getTransitionsFromStep(node));
    } else if (isDecision(node)) {
      transitions.push(...this.getTransitionsFromDecision(node));
    } else if (isWait(node)) {
      transitions.push(...this.getTransitionsFromWait(node));
    } else if (isLoop(node)) {
      transitions.push(...this.getTransitionsFromLoop(node));
    } else if (
      isAssignment(node) ||
      isCollectionProcessor(node) ||
      isScreen(node) ||
      isSubflow(node) ||
      isTransform(node) ||
      isRecordRollback(node) ||
      isCustomError(node)
    ) {
      transitions.push(...this.getTransitionsFromConnector(node));
    }
    return transitions;
  }

  private createTransition(
    from: flowTypes.FlowNode,
    connection: flowTypes.FlowConnector,
    isFault: boolean,
    transitionLabel?: string,
  ): Transition {
    const connectedNode = this.beingParsed.nameToNode?.get(
      connection.targetReference,
    );
    if (!connectedNode) {
      throw new Error(
        ERROR_MESSAGES.couldNotFindConnectedNode(connection.targetReference),
      );
    }
    return {
      from: from.name,
      to: connectedNode.name,
      fault: isFault,
      label: transitionLabel,
    };
  }

  private getTransitionsFromDecision(
    node: flowTypes.FlowDecision,
  ): Transition[] {
    const result: Transition[] = [];
    if (node.defaultConnector) {
      result.push(
        this.createTransition(
          node,
          node.defaultConnector,
          false,
          node.defaultConnectorLabel,
        ),
      );
    }
    if (node.rules) {
      for (const rule of node.rules) {
        if (rule && rule.connector) {
          result.push(
            this.createTransition(node, rule.connector, false, rule.label),
          );
        }
      }
    }
    return result;
  }

  private getTransitionsFromStep(node: flowTypes.FlowStep): Transition[] {
    const result: Transition[] = [];
    if (node.connectors) {
      for (const connector of node.connectors) {
        result.push(this.createTransition(node, connector, false, undefined));
      }
    }
    return result;
  }

  private getTransitionsFromConnectorOrFault(
    node:
      | flowTypes.FlowRecordCreate
      | flowTypes.FlowRecordDelete
      | flowTypes.FlowRecordLookup
      | flowTypes.FlowRecordUpdate
      | flowTypes.FlowApexPluginCall
      | flowTypes.FlowActionCall,
  ): Transition[] {
    const result: Transition[] = [];
    if (node.connector) {
      result.push(
        this.createTransition(node, node.connector, false, undefined),
      );
    }
    if (node.faultConnector) {
      result.push(
        this.createTransition(node, node.faultConnector, true, FAULT),
      );
    }
    return result;
  }

  private getTransitionsFromLoop(node: flowTypes.FlowLoop): Transition[] {
    const result: Transition[] = [];
    if (node.nextValueConnector) {
      result.push(
        this.createTransition(node, node.nextValueConnector, false, "for each"),
      );
    }
    if (node.noMoreValuesConnector) {
      result.push(
        this.createTransition(
          node,
          node.noMoreValuesConnector,
          false,
          "after all",
        ),
      );
    }
    return result;
  }

  private getTransitionsFromConnector(
    node:
      | flowTypes.FlowAssignment
      | flowTypes.FlowCollectionProcessor
      | flowTypes.FlowScreen
      | flowTypes.FlowSubflow
      | flowTypes.FlowRecordRollback
      | flowTypes.FlowTransform
      | flowTypes.FlowCustomError,
  ): Transition[] {
    const result: Transition[] = [];
    if (node.connector) {
      for (
        const connector of Array.isArray(node.connector)
          ? node.connector
          : [node.connector]
      ) {
        result.push(this.createTransition(node, connector, false, undefined));
      }
    }
    return result;
  }

  private getTransitionsFromWait(node: flowTypes.FlowWait): Transition[] {
    const result: Transition[] = [];
    if (node.defaultConnector) {
      result.push(
        this.createTransition(
          node,
          node.defaultConnector,
          false,
          node.defaultConnectorLabel,
        ),
      );
    }
    if (node.faultConnector) {
      result.push(
        this.createTransition(node, node.faultConnector, true, FAULT),
      );
    }
    return result;
  }

  private getTransitionsFromFlowStart(node: flowTypes.FlowStart): Transition[] {
    const result: Transition[] = [];

    // Add main flow transition
    if (node.connector) {
      result.push(
        this.createTransition(node, node.connector, false, undefined),
      );
    }

    // Add scheduled path transitions
    if (node.scheduledPaths && node.scheduledPaths.length > 0) {
      for (const scheduledPath of node.scheduledPaths) {
        if (scheduledPath.connector) {
          const label = scheduledPath.pathType;
          result.push(
            this.createTransition(node, scheduledPath.connector, false, label),
          );
        }
      }
    }

    return result;
  }
}

/**
 * Ensures that all of the node arrays are populated.
 *
 * The XML parser will will not be able to determine if each node is an array
 * or not. If there is only one node, it will be returned as a single object.
 * This method ensures that the node arrays are populated as an array.
 */
function ensureArray<T>(input: T[] | undefined): T[] | undefined {
  return input ? (Array.isArray(input) ? input : [input]) : input;
}

/**
 * Set Assignments
 *
 * Assignment items are nested properties which also need to be converted to an
 * array.
 */
function setAssignments(assignments: flowTypes.FlowAssignment[] | undefined) {
  assignments?.forEach((assignment) => {
    assignment.assignmentItems = ensureArray(
      assignment.assignmentItems,
    ) as flowTypes.FlowAssignmentItem[];
  });
}

/**
 * Set Orchestrated Stage Steps
 *
 * Stage Steps are nested properties which also need to be converted to an
 * array.
 */
function setOrchestratedStageSteps(
  orchestratedStages: flowTypes.FlowOrchestratedStage[] | undefined,
) {
  orchestratedStages?.forEach((stage) => {
    if (!stage.stageSteps) {
      return;
    }
    stage.stageSteps = ensureArray(
      stage.stageSteps,
    ) as flowTypes.FlowStageStep[];
  });
}

/**
 * Set Decicison
 *
 * Decision rules are nested properties which also need to be converted to an
 * array.
 */
function setDecisionRules(decisions: flowTypes.FlowDecision[] | undefined) {
  decisions?.forEach((decision) => {
    if (!decision.rules) {
      return;
    }
    decision.rules = ensureArray(decision.rules) as flowTypes.FlowRule[];
    setRuleConditions(decision.rules);
  });
}

/**
 * Set Rule Conditions
 *
 * Rule conditions are nested properties which also need to be converted to
 * an array.
 */
function setRuleConditions(rules: flowTypes.FlowRule[] | undefined) {
  rules?.forEach((rule) => {
    if (!rule.conditions) {
      return;
    }
    rule.conditions = ensureArray(rule.conditions) as flowTypes.FlowCondition[];
  });
}

/**
 * Set Record Lookups
 *
 * Record Lookup filters and queried fields are nested properties which also
 * need to be converted to an array.
 */
function setRecordLookups(
  recordLookups: flowTypes.FlowRecordLookup[] | undefined,
) {
  recordLookups?.forEach((recordLookup) => {
    if (recordLookup.filters) {
      recordLookup.filters = ensureArray(
        recordLookup.filters,
      ) as flowTypes.FlowRecordFilter[];
    }
    if (recordLookup.queriedFields) {
      recordLookup.queriedFields = ensureArray(
        recordLookup.queriedFields,
      ) as string[];
    }
  });
}

/**
 * Ensures that filters and inputAssignments are arrays in record update nodes
 */
function setRecordUpdates(
  recordUpdates: flowTypes.FlowRecordUpdate[] | undefined,
) {
  if (!recordUpdates) {
    return;
  }
  for (const recordUpdate of recordUpdates) {
    recordUpdate.filters = ensureArray(
      recordUpdate.filters ?? [],
    ) as flowTypes.FlowRecordFilter[];

    recordUpdate.inputAssignments = ensureArray(
      recordUpdate.inputAssignments ?? [],
    ) as flowTypes.FlowInputFieldAssignment[];
  }
}

/**
 * Set Custom Error Messages
 *
 * Custom Error Messages are nested properties which also need to be converted to
 * an array.
 */
function setCustomErrorMessages(
  customErrors: flowTypes.FlowCustomError[] | undefined,
) {
  if (!customErrors) {
    return;
  }
  for (const customError of customErrors) {
    customError.customErrorMessages = ensureArray(
      customError.customErrorMessages,
    ) as flowTypes.FlowCustomErrorMessage[];
  }
}

/**
 * Set Flow Start
 *
 * Flow Start filters and scheduled paths are nested properties which also
 * need to be converted to arrays.
 */
function setFlowStart(start: flowTypes.FlowStart | undefined) {
  if (!start) {
    return;
  }
  if (start.filters) {
    start.filters = ensureArray(
      start.filters,
    ) as flowTypes.FlowRecordFilter[];
  }
  if (start.scheduledPaths) {
    start.scheduledPaths = ensureArray(
      start.scheduledPaths,
    ) as flowTypes.FlowScheduledPath[];
  }
  if (start.capabilityTypes) {
    start.capabilityTypes = ensureArray(
      start.capabilityTypes,
    ) as flowTypes.FlowCapability[];
  }
}

/**
 * The following functions are used to determine if a node is a specific type
 * of node.
 */
function isAssignment(
  node: flowTypes.FlowNode,
): node is flowTypes.FlowAssignment {
  return (node as flowTypes.FlowAssignment).assignmentItems !== undefined;
}

function isCollectionProcessor(
  node: flowTypes.FlowNode,
): node is flowTypes.FlowCollectionProcessor {
  return (
    (node as flowTypes.FlowCollectionProcessor).collectionProcessorType !==
      undefined
  );
}

function isScreen(node: flowTypes.FlowNode): node is flowTypes.FlowScreen {
  return (node as flowTypes.FlowScreen).fields !== undefined;
}

function isSubflow(node: flowTypes.FlowNode): node is flowTypes.FlowSubflow {
  return (node as flowTypes.FlowSubflow).flowName !== undefined;
}

function isTransform(
  node: flowTypes.FlowNode,
): node is flowTypes.FlowTransform {
  return (node as flowTypes.FlowTransform).dataType !== undefined;
}

function isStep(node: flowTypes.FlowNode): node is flowTypes.FlowStep {
  return (node as flowTypes.FlowStep).connectors !== undefined;
}

function isDecision(node: flowTypes.FlowNode): node is flowTypes.FlowDecision {
  return (node as flowTypes.FlowDecision).rules !== undefined;
}

function isWait(node: flowTypes.FlowNode): node is flowTypes.FlowWait {
  return (node as flowTypes.FlowWait).waitEvents !== undefined;
}

function isLoop(node: flowTypes.FlowNode): node is flowTypes.FlowLoop {
  return (node as flowTypes.FlowLoop).nextValueConnector !== undefined;
}

function isRecordCreate(
  node: flowTypes.FlowNode,
): node is flowTypes.FlowRecordCreate {
  return (node as flowTypes.FlowRecordCreate).inputReference !== undefined;
}

function isRecordDelete(
  node: flowTypes.FlowNode,
): node is flowTypes.FlowRecordDelete {
  return (node as flowTypes.FlowRecordDelete).inputReference !== undefined;
}

function isRecordLookup(
  node: flowTypes.FlowNode,
): node is flowTypes.FlowRecordLookup {
  return (node as flowTypes.FlowRecordLookup).filters !== undefined;
}

function isRecordUpdate(
  node: flowTypes.FlowNode,
): node is flowTypes.FlowRecordUpdate {
  return (node as flowTypes.FlowRecordUpdate).inputReference !== undefined;
}

function isRecordRollback(
  node: flowTypes.FlowNode,
): node is flowTypes.FlowRecordRollback {
  return (node as flowTypes.FlowRecordRollback).connector !== undefined;
}

function isApexPluginCall(
  node: flowTypes.FlowNode,
): node is flowTypes.FlowApexPluginCall {
  return (node as flowTypes.FlowApexPluginCall).apexClass !== undefined;
}

function isFlowActionCall(
  node: flowTypes.FlowNode,
): node is flowTypes.FlowActionCall {
  return (node as flowTypes.FlowActionCall).actionName !== undefined;
}

function isCustomError(
  node: flowTypes.FlowNode,
): node is flowTypes.FlowCustomError {
  return (node as flowTypes.FlowCustomError).customErrorMessages !== undefined;
}

function isFlowStart(
  node: flowTypes.FlowNode,
): node is flowTypes.FlowStart {
  return (node as flowTypes.FlowStart).connector !== undefined;
}
