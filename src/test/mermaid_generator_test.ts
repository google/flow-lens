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

import { assertEquals, assertStringIncludes } from "@std/assert";
import { ParsedFlow, Transition } from "../main/flow_parser.ts";
import * as flowTypes from "../main/flow_types.ts";
import { MermaidGenerator } from "../main/mermaid_generator.ts";
import {
  DiagramNode,
  Icon as UmlIcon,
  SkinColor as UmlSkinColor,
} from "../main/uml_generator.ts";

const NODE_NAMES = {
  start: "FLOW_START",
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
  stageSteps: ["step1", "step2", "step3"],
  step: "myStep",
  subflow: "mySubflow",
  transform: "myTransform",
  wait: "myWait",
  actionCall: "myActionCall",
};

function generateMockFlow(): ParsedFlow {
  return {
    label: "Test Flow",
    start: {
      name: NODE_NAMES.start,
    } as flowTypes.FlowStart,
    apexPluginCalls: getFlowNodes(
      NODE_NAMES.apexPluginCall,
    ) as flowTypes.FlowApexPluginCall[],
    assignments: getFlowNodes(
      NODE_NAMES.assignment,
    ) as flowTypes.FlowAssignment[],
    collectionProcessors: getFlowNodes(
      NODE_NAMES.collectionProcessor,
    ) as flowTypes.FlowCollectionProcessor[],
    decisions: [
      generateDecision(NODE_NAMES.decision),
    ] as flowTypes.FlowDecision[],
    loops: getFlowNodes(NODE_NAMES.loop) as flowTypes.FlowLoop[],
    orchestratedStages: [
      generateStage(NODE_NAMES.orchestratedStage, NODE_NAMES.stageSteps),
    ],
    recordCreates: getFlowNodes(
      NODE_NAMES.recordCreate,
    ) as flowTypes.FlowRecordCreate[],
    recordDeletes: getFlowNodes(
      NODE_NAMES.recordDelete,
    ) as flowTypes.FlowRecordDelete[],
    recordLookups: getFlowNodes(
      NODE_NAMES.recordLookup,
    ) as flowTypes.FlowRecordLookup[],
    recordRollbacks: getFlowNodes(
      NODE_NAMES.recordRollback,
    ) as flowTypes.FlowRecordRollback[],
    recordUpdates: getFlowNodes(
      NODE_NAMES.recordUpdate,
    ) as flowTypes.FlowRecordUpdate[],
    screens: getFlowNodes(NODE_NAMES.screen) as flowTypes.FlowScreen[],
    steps: getFlowNodes(NODE_NAMES.step) as flowTypes.FlowStep[],
    subflows: getFlowNodes(NODE_NAMES.subflow) as flowTypes.FlowSubflow[],
    transforms: getFlowNodes(NODE_NAMES.transform) as flowTypes.FlowTransform[],
    waits: getFlowNodes(NODE_NAMES.wait) as flowTypes.FlowWait[],
    actionCalls: getFlowNodes(
      NODE_NAMES.actionCall,
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
        label: "Normal Transition",
      },
      {
        from: NODE_NAMES.assignment,
        to: NODE_NAMES.decision,
        fault: true,
        label: "Error Path",
      },
    ],
  };
}

function getFlowNodes(name: string): flowTypes.FlowNode[] {
  return [{ name: `${name}`, label: `${name}` }] as flowTypes.FlowNode[];
}

function generateStage(
  name: string,
  stepNames: string[],
): flowTypes.FlowOrchestratedStage {
  return {
    name: `${name}`,
    label: `${name}`,
    elementSubtype: "OrchestratedStage",
    locationX: 0,
    locationY: 0,
    description: `${name}`,
    stageSteps: stepNames.map((stepName) => ({
      name: `${stepName}`,
      label: `${stepName}`,
      elementSubtype: "Step",
      locationX: 0,
      locationY: 0,
      description: `${stepName}`,
      actionName: `${stepName}Action`,
      actionType: flowTypes.FlowStageStepActionType.STEP_BACKGROUND,
    })),
  } as flowTypes.FlowOrchestratedStage;
}

function generateDecision(name: string): flowTypes.FlowDecision {
  return {
    name: name,
    label: name,
    elementSubtype: "Decision",
    locationX: 0,
    locationY: 0,
    description: name,
    rules: [
      {
        name: `${name}_rule1`,
        label: "Rule 1",
        description: "Rule 1 description",
        conditions: [
          {
            leftValueReference: "leftValue",
            operator: "EqualTo",
            rightValue: {
              stringValue: "rightValue",
            },
            processMetadataValues: [],
          },
        ],
      },
      {
        name: `${name}_rule2`,
        label: "Rule 2",
        description: "Rule 2 description",
        conditions: [
          {
            leftValueReference: "anotherLeftValue",
            operator: "NotEqualTo",
            rightValue: {
              stringValue: "anotherRightValue",
            },
            processMetadataValues: [],
          },
          {
            leftValueReference: "thirdLeftValue",
            operator: "GreaterThan",
            rightValue: {
              numberValue: "10",
            },
            processMetadataValues: [],
          },
        ],
        conditionLogic: "1 AND 2",
      },
    ],
  } as flowTypes.FlowDecision;
}

// @ts-ignore: Deno types
Deno.test("MermaidGenerator", async (t) => {
  let systemUnderTest: MermaidGenerator;
  let mockedFlow: ParsedFlow;
  let result: string;

  await t.step("Setup", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new MermaidGenerator(mockedFlow);
  });

  await t.step("should generate header", () => {
    const label = "Test Flow";
    result = systemUnderTest.getHeader(label);

    assertStringIncludes(result, "stateDiagram-v2");
    assertStringIncludes(result, "classDef pink fill:#F9548A, color:white");
    assertStringIncludes(result, "classDef orange fill:#DD7A00, color:white");
    assertStringIncludes(result, "classDef navy fill:#344568, color:white");
    assertStringIncludes(result, "classDef blue fill:#1B96FF, color:white");
    assertStringIncludes(result, `title: "${label}"`);
  });

  await t.step("should generate apex plugin call node", () => {
    const node: DiagramNode = {
      id: "myApexPluginCall",
      label: "myApexPluginCall",
      type: "Apex Plugin Call",
      icon: UmlIcon.CODE,
      color: UmlSkinColor.NONE,
    };
    result = systemUnderTest.toUmlString(node);
    assertStringIncludes(result, "<b>Apex Plugin Call</b> ⚡");
    assertStringIncludes(result, "as myApexPluginCall");
  });

  await t.step("should generate assignment node", () => {
    const node: DiagramNode = {
      id: "myAssignment",
      label: "myAssignment",
      type: "Assignment",
      icon: UmlIcon.ASSIGNMENT,
      color: UmlSkinColor.ORANGE,
    };
    result = systemUnderTest.toUmlString(node);
    assertStringIncludes(result, "<b>Assignment</b> 📝");
    assertStringIncludes(result, "as myAssignment");
    assertStringIncludes(result, "class myAssignment orange");
  });

  await t.step("should generate decision node", () => {
    const node: DiagramNode = {
      id: "myDecision",
      label: "myDecision",
      type: "Decision",
      icon: UmlIcon.DECISION,
      color: UmlSkinColor.ORANGE,
      innerNodes: [
        {
          id: "rule1",
          label: "Rule 1",
          type: "Rule",
          content: ["leftValue EqualTo rightValue"],
        },
        {
          id: "rule2",
          label: "Rule 2",
          type: "Rule",
          content: [
            "1. anotherLeftValue NotEqualTo anotherRightValue",
            "2. thirdLeftValue GreaterThan 10",
            "Logic: 1 AND 2",
          ],
        },
      ],
    };
    result = systemUnderTest.toUmlString(node);
    assertStringIncludes(result, "<b>Decision</b> 🔹");
    assertStringIncludes(result, "<b>Rule</b>");
    assertStringIncludes(result, "as myDecision");
    assertStringIncludes(result, "class myDecision orange");
  });

  await t.step("should generate node with diff status", () => {
    const node: DiagramNode = {
      id: "myNode",
      label: "myNode",
      type: "Record Create",
      icon: UmlIcon.CREATE_RECORD,
      color: UmlSkinColor.PINK,
      diffStatus: flowTypes.DiffStatus.ADDED,
    };
    result = systemUnderTest.toUmlString(node);
    assertStringIncludes(
      result,
      "<span style='padding:6px;margin:6px;background-color:#FFFFFF;'><font color=\"green\"><b>+</b></font></span>",
    );
    assertStringIncludes(result, "class myNode pink");
  });

  await t.step("should sanitize labels with double quotes", () => {
    const node: DiagramNode = {
      id: "myNode",
      label: 'Node with "quotes"',
      type: "Record Create",
      icon: UmlIcon.CREATE_RECORD,
      color: UmlSkinColor.PINK,
    };
    result = systemUnderTest.toUmlString(node);
    assertStringIncludes(result, "Node with 'quotes'");
  });

  await t.step("should generate normal transition", () => {
    const transition: Transition = {
      from: "nodeA",
      to: "nodeB",
      fault: false,
      label: "Normal Path",
    };
    result = systemUnderTest.getTransition(transition);
    assertEquals(result, "  nodeA --> nodeB :  Normal Path ");
  });

  await t.step("should generate fault transition", () => {
    const transition: Transition = {
      from: "nodeA",
      to: "nodeB",
      fault: true,
      label: "Error Path",
    };
    result = systemUnderTest.getTransition(transition);
    assertStringIncludes(result, "  nodeA --> nodeB : ❌ Error Path ❌");
  });

  await t.step("should generate fault transition without label", () => {
    const transition: Transition = {
      from: "nodeA",
      to: "nodeB",
      fault: true,
    };
    result = systemUnderTest.getTransition(transition);
    assertEquals(result, "  nodeA --> nodeB");
  });

  await t.step("should generate complete UML diagram", () => {
    result = systemUnderTest.generateUml();

    assertStringIncludes(result, "stateDiagram-v2");

    assertStringIncludes(result, "state");
    assertStringIncludes(result, "myApexPluginCall");
    assertStringIncludes(result, "myAssignment");
    assertStringIncludes(result, "myDecision");

    assertStringIncludes(result, "FLOW_START --> myApexPluginCall");
    assertStringIncludes(
      result,
      "myApexPluginCall --> myAssignment :  Normal Transition ",
    );
    assertStringIncludes(
      result,
      "myAssignment --> myDecision : ❌ Error Path ❌",
    );

    assertStringIncludes(result, "class");
  });
});
