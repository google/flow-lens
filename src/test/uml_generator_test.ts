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

import { assertEquals } from "@std/assert";
import { ParsedFlow, Transition } from "../main/flow_parser.ts";
import * as flowTypes from "../main/flow_types.ts";
import { UmlGenerator, DiagramNode } from "../main/uml_generator.ts";

const EOL = Deno.build.os === "windows" ? "\r\n" : "\n";
const TRANSITION_ARROW = "-->";

const NODE_NAMES = {
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

const UML_REPRESENTATIONS = {
  apexPluginCall: (name: string) => `state Apex Plugin Call ${name}`,
  assignment: (name: string) => `state Assignment ${name}`,
  collectionProcessor: (name: string) => `state Collection Processor ${name}`,
  decision: (name: string) => `state Decision ${name}`,
  loop: (name: string) => `state Loop ${name}`,
  orchestratedStage: (name: string) => `state Orchestrated Stage ${name}`,
  recordCreate: (name: string) => `state Record Create ${name}`,
  recordDelete: (name: string) => `state Record Delete ${name}`,
  recordLookup: (name: string) => `state Record Lookup ${name}`,
  recordRollback: (name: string) => `state Record Rollback ${name}`,
  recordUpdate: (name: string) => `state Record Update ${name}`,
  screen: (name: string) => `state Screen ${name}`,
  step: (name: string) => `state Step ${name}`,
  subflow: (name: string) => `state Subflow ${name}`,
  transform: (name: string) => `state Transform ${name}`,
  wait: (name: string) => `state Wait ${name}`,
  actionCall: (name: string) => `state ActionCall ${name}`,
  transition: (from: string, to: string) => `${from} ${TRANSITION_ARROW} ${to}`,
};

function generateMockFlow() {
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

function getFlowNodes(name: string): flowTypes.FlowNode[] {
  return [{ name: name }] as flowTypes.FlowNode[];
}

Deno.test("UmlGenerator", async (t) => {
  let systemUnderTest: UmlGenerator;
  let mockParsedFlow: ParsedFlow;

  await t.step("setup", () => {
    mockParsedFlow = generateMockFlow();

    class ConcreteUmlGenerator extends UmlGenerator {
      getHeader(label: string): string {
        return label;
      }
      toUmlString(node: DiagramNode): string {
        return `state ${node.type} ${node.id}`;
      }
      getTransition(transition: Transition): string {
        return UML_REPRESENTATIONS.transition(transition.from, transition.to);
      }
      getFooter(): string {
        return "";
      }
    }

    systemUnderTest = new ConcreteUmlGenerator(mockParsedFlow);
  });

  await t.step("should generate UML with all flow elements", () => {
    const uml = systemUnderTest.generateUml();

    const expectedUml = [
      NODE_NAMES.label,
      UML_REPRESENTATIONS.apexPluginCall(NODE_NAMES.apexPluginCall),
      UML_REPRESENTATIONS.assignment(NODE_NAMES.assignment),
      UML_REPRESENTATIONS.collectionProcessor(NODE_NAMES.collectionProcessor),
      UML_REPRESENTATIONS.decision(NODE_NAMES.decision),
      UML_REPRESENTATIONS.loop(NODE_NAMES.loop),
      UML_REPRESENTATIONS.orchestratedStage(NODE_NAMES.orchestratedStage),
      UML_REPRESENTATIONS.recordCreate(NODE_NAMES.recordCreate),
      UML_REPRESENTATIONS.recordDelete(NODE_NAMES.recordDelete),
      UML_REPRESENTATIONS.recordLookup(NODE_NAMES.recordLookup),
      UML_REPRESENTATIONS.recordRollback(NODE_NAMES.recordRollback),
      UML_REPRESENTATIONS.recordUpdate(NODE_NAMES.recordUpdate),
      UML_REPRESENTATIONS.screen(NODE_NAMES.screen),
      UML_REPRESENTATIONS.step(NODE_NAMES.step),
      UML_REPRESENTATIONS.subflow(NODE_NAMES.subflow),
      UML_REPRESENTATIONS.transform(NODE_NAMES.transform),
      UML_REPRESENTATIONS.wait(NODE_NAMES.wait),
      UML_REPRESENTATIONS.actionCall(NODE_NAMES.actionCall),
      UML_REPRESENTATIONS.transition(
        NODE_NAMES.start,
        NODE_NAMES.apexPluginCall
      ),
      UML_REPRESENTATIONS.transition(
        NODE_NAMES.apexPluginCall,
        NODE_NAMES.assignment
      ),
      UML_REPRESENTATIONS.transition(
        NODE_NAMES.assignment,
        NODE_NAMES.collectionProcessor
      ),
    ].join(EOL);

    assertEquals(uml, expectedUml);
  });

  await t.step("should handle empty flow elements", () => {
    mockParsedFlow.screens = [];

    const uml = systemUnderTest.generateUml();

    assertEquals(
      uml.includes(UML_REPRESENTATIONS.screen(NODE_NAMES.screen)),
      false
    );
  });

  await t.step("should handle undefined flow elements", () => {
    mockParsedFlow.screens = undefined;

    const uml = systemUnderTest.generateUml();

    assertEquals(
      uml.includes(UML_REPRESENTATIONS.screen(NODE_NAMES.screen)),
      false
    );
  });

  await t.step("should handle empty transitions", () => {
    mockParsedFlow.transitions = [];
    const uml = systemUnderTest.generateUml();

    assertEquals(uml.includes(TRANSITION_ARROW), false);
  });

  await t.step("should handle undefined transitions", () => {
    mockParsedFlow.transitions = undefined;
    const uml = systemUnderTest.generateUml();

    assertEquals(uml.includes(TRANSITION_ARROW), false);
  });
});
