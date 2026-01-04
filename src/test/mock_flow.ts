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

import * as flowTypes from "../main/flow_types.ts";
import { ParsedFlow } from "../main/flow_parser.ts";

export const NODE_NAMES = {
  label: "test",
  start: "start",
  apexPluginCall: "myApexPluginCall",
  assignment: "myAssignment",
  collectionProcessor: "myCollectionProcessor",
  decision: "myDecision",
  loop: "myLoop",
  orchestratedStage: "myOrchestratedStage",
  recordCreate: "myRecordCreate",
  recordDelete: "myRecordDelete",
  recordLookup: "myRecordLookup",
  recordRollback: "myRecordRollback",
  recordUpdate: "myRecordUpdate",
  screen: "myScreen",
  step: "myStep",
  subflow: "mySubflow",
  transform: "myTransform",
  wait: "myWait",
  actionCall: "myActionCall",
};

export function generateMockFlow(): ParsedFlow {
  return {
    label: NODE_NAMES.label,
    start: {
      name: NODE_NAMES.start,
    } as flowTypes.FlowStart,
    apexPluginCalls: getFlowNodes(
      NODE_NAMES.apexPluginCall
    ) as flowTypes.FlowApexPluginCall[],
    assignments: getFlowNodes(
      NODE_NAMES.assignment
    ) as flowTypes.FlowAssignment[],
    collectionProcessors: getFlowNodes(
      NODE_NAMES.collectionProcessor
    ) as flowTypes.FlowCollectionProcessor[],
    decisions: getFlowNodes(NODE_NAMES.decision) as flowTypes.FlowDecision[],
    loops: getFlowNodes(NODE_NAMES.loop) as flowTypes.FlowLoop[],
    orchestratedStages: getFlowNodes(
      NODE_NAMES.orchestratedStage
    ) as flowTypes.FlowOrchestratedStage[],
    recordCreates: getFlowNodes(
      NODE_NAMES.recordCreate
    ) as flowTypes.FlowRecordCreate[],
    recordDeletes: getFlowNodes(
      NODE_NAMES.recordDelete
    ) as flowTypes.FlowRecordDelete[],
    recordLookups: getFlowNodes(
      NODE_NAMES.recordLookup
    ) as flowTypes.FlowRecordLookup[],
    recordRollbacks: getFlowNodes(
      NODE_NAMES.recordRollback
    ) as flowTypes.FlowRecordRollback[],
    recordUpdates: getFlowNodes(
      NODE_NAMES.recordUpdate
    ) as flowTypes.FlowRecordUpdate[],
    screens: getFlowNodes(NODE_NAMES.screen) as flowTypes.FlowScreen[],
    steps: getFlowNodes(NODE_NAMES.step) as flowTypes.FlowStep[],
    subflows: getFlowNodes(NODE_NAMES.subflow) as flowTypes.FlowSubflow[],
    transforms: getFlowNodes(NODE_NAMES.transform) as flowTypes.FlowTransform[],
    waits: getFlowNodes(NODE_NAMES.wait) as flowTypes.FlowWait[],
    actionCalls: getFlowNodes(
      NODE_NAMES.actionCall
    ) as flowTypes.FlowActionCall[],
    transitions: [
      {
        from: NODE_NAMES.start,
        to: NODE_NAMES.apexPluginCall,
        fault: false,
      },
      {
        from: NODE_NAMES.apexPluginCall,
        to: NODE_NAMES.assignment,
        fault: false,
      },
      {
        from: NODE_NAMES.assignment,
        to: NODE_NAMES.collectionProcessor,
        fault: false,
      },
    ],
  };
}

type NodeFactory = (name: string) => flowTypes.FlowNode[];

const NODE_FACTORIES: Record<string, NodeFactory> = {
  [NODE_NAMES.recordUpdate]: createRecordUpdateNode,
  [NODE_NAMES.recordLookup]: createRecordLookupNode,
  [NODE_NAMES.recordCreate]: createRecordCreateNode,
  [NODE_NAMES.recordDelete]: createRecordDeleteNode,
  [NODE_NAMES.assignment]: createAssignmentNode,
};

function getFlowNodes(name: string): flowTypes.FlowNode[] {
  const factory = NODE_FACTORIES[name];
  return factory ? factory(name) : createBasicNode(name);
}

function createBaseNode(name: string) {
  return {
    name,
    label: name,
    locationX: 0,
    locationY: 0,
    description: "",
  };
}

function createRecordUpdateNode(name: string): flowTypes.FlowRecordUpdate[] {
  return [
    {
      ...createBaseNode(name),
      object: "Account",
      inputAssignments: [],
      inputReference: "",
      elementSubtype: "RecordUpdate",
      filters: [],
    },
  ];
}

function createRecordLookupNode(name: string): flowTypes.FlowRecordLookup[] {
  return [
    {
      ...createBaseNode(name),
      object: "Account",
      elementSubtype: "RecordLookup",
      filters: [],
      queriedFields: [],
    },
  ];
}

function createRecordCreateNode(name: string): flowTypes.FlowRecordCreate[] {
  return [
    {
      ...createBaseNode(name),
      object: "Account",
      elementSubtype: "RecordCreate",
      inputAssignments: [],
      inputReference: "",
    },
  ];
}

function createRecordDeleteNode(name: string): flowTypes.FlowRecordDelete[] {
  return [
    {
      ...createBaseNode(name),
      object: "Account",
      elementSubtype: "RecordDelete",
      inputReference: "",
    },
  ];
}

function createAssignmentNode(name: string): flowTypes.FlowAssignment[] {
  return [
    {
      ...createBaseNode(name),
      elementSubtype: "Assignment",
      assignmentItems: [
        {
          assignToReference: "var1",
          operator: flowTypes.FlowAssignmentOperator.ASSIGN,
          value: {
            stringValue: "Hello World",
          },
          processMetadataValues: [],
        },
        {
          assignToReference: "var2",
          operator: flowTypes.FlowAssignmentOperator.ADD_ITEM,
          value: {
            stringValue: "Test Value",
          },
          processMetadataValues: [],
        },
      ],
    },
  ];
}

function createBasicNode(name: string): flowTypes.FlowNode[] {
  return [
    {
      ...createBaseNode(name),
      elementSubtype: "Unknown",
    },
  ];
}
