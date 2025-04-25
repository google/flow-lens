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

import { assertEquals, assertStringIncludes } from "@std/assert";
import type { ParsedFlow } from "../main/flow_parser.ts";
import * as flowTypes from "../main/flow_types.ts";
import { PlantUmlGenerator } from "../main/plantuml_generator.ts";
import {
  type DiagramNode,
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
    decisions: getFlowNodes(NODE_NAMES.decision) as flowTypes.FlowDecision[],
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
      },
      {
        from: NODE_NAMES.assignment,
        to: NODE_NAMES.collectionProcessor,
        fault: false,
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

Deno.test("PlantUmlGenerator", async (t) => {
  let systemUnderTest: PlantUmlGenerator;
  let mockedFlow: ParsedFlow;
  let result: string;

  await t.step("Setup", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new PlantUmlGenerator(mockedFlow);
  });

  await t.step("should generate header", () => {
    const label = "foo";
    result = systemUnderTest.getHeader(label);

    assertStringIncludes(result, "skinparam State");
    assertStringIncludes(result, "BackgroundColor<<Pink>> #F9548A");
    assertStringIncludes(result, "FontColor<<Pink>> white");
    assertStringIncludes(result, "BackgroundColor<<Orange>> #DD7A00");
    assertStringIncludes(result, "FontColor<<Orange>> white");
    assertStringIncludes(result, "BackgroundColor<<Navy>> #344568");
    assertStringIncludes(result, "FontColor<<Navy>> white");
    assertStringIncludes(result, label);
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
    assertEquals(
      result,
      'state "**Apex Plugin Call** <&code> \\n myApexPluginCall" as myApexPluginCall',
    );
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
    assertEquals(
      result,
      'state "**Assignment** <&menu> \\n myAssignment" as myAssignment <<Orange>>',
    );
  });

  await t.step("should generate decision node", () => {
    const node: DiagramNode = {
      id: "myDecision",
      label: "myDecision",
      type: "Decision",
      icon: UmlIcon.DECISION,
      color: UmlSkinColor.ORANGE,
    };
    result = systemUnderTest.toUmlString(node);
    assertEquals(
      result,
      'state "**Decision** <&fork> \\n myDecision" as myDecision <<Orange>>',
    );
  });

  await t.step("should generate orchestrated stage with inner nodes", () => {
    const node: DiagramNode = {
      id: "myOrchestratedStage",
      label: "myOrchestratedStage",
      type: "Orchestrated Stage",
      icon: UmlIcon.RIGHT,
      color: UmlSkinColor.NONE,
      innerNodes: [
        {
          id: "myOrchestratedStage_step1Action",
          label: "step1",
          type: "Stage Step",
          content: [],
        },
        {
          id: "myOrchestratedStage_step2Action",
          label: "step2",
          type: "Stage Step",
          content: [],
        },
      ],
    };
    result = systemUnderTest.toUmlString(node);
    assertEquals(
      result,
      'state "**Orchestrated Stage** <&chevron-right> \\n myOrchestratedStage" as myOrchestratedStage\n' +
        "myOrchestratedStage: **Stage Step**\n" +
        "myOrchestratedStage: __step1__\n" +
        "myOrchestratedStage: ---\n" +
        "myOrchestratedStage: **Stage Step**\n" +
        "myOrchestratedStage: __step2__",
    );
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
    assertEquals(
      result,
      'state "**<&plus{scale=2}>** **Record Create** <&medical-cross> \\n myNode" as myNode <<Pink>> <<Added>>',
    );
  });

  await t.step("should generate transition", () => {
    result = systemUnderTest.getTransition(mockedFlow.transitions![0]);
    assertEquals(result, "[*] --> myApexPluginCall");
  });
});
