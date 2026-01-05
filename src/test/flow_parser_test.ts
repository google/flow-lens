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

import { join } from "@std/path";
import { ERROR_MESSAGES, FlowParser, type ParsedFlow } from "../main/flow_parser.ts";
import type * as flowTypes from "../main/flow_types.ts";
import { assert, assertEquals, assertRejects } from "@std/assert";

const GOLDENS_PATH = "./src/test/goldens";
const LOOP_NODE_NAME = "myLoop";
const NON_EXISTING_ELEMENT = "Non_Existing_Element";
const START_NODE_NAME = "FLOW_START";

const TEST_FILES = {
  multipleElements: join(GOLDENS_PATH, "multiple_elements.flow-meta.xml"),
  singleElements: join(GOLDENS_PATH, "single_elements.flow-meta.xml"),
  sample: join(GOLDENS_PATH, "sample.flow-meta.xml"),
  noStartNode: join(GOLDENS_PATH, "no_start_node.flow-meta.xml"),
  missingTransitionNode: join(
    GOLDENS_PATH,
    "missing_transition_node.flow-meta.xml",
  ),
  circularTransition: join(GOLDENS_PATH, "circular_transition.flow-meta.xml"),
  rollback: join(GOLDENS_PATH, "rollback.flow-meta.xml"),
  singleFilter: join(GOLDENS_PATH, "single_filter.flow-meta.xml"),
  singleScheduledPath: join(
    GOLDENS_PATH,
    "single_scheduled_path.flow-meta.xml",
  ),
  singleCapability: join(GOLDENS_PATH, "single_capability.flow-meta.xml"),
  multipleStartElements: join(
    GOLDENS_PATH,
    "multiple_start_elements.flow-meta.xml",
  ),
  noStartElements: join(GOLDENS_PATH, "no_start_elements.flow-meta.xml"),
  asyncPathTest: join(GOLDENS_PATH, "async_path_test.flow-meta.xml"),
  multipleAsyncPaths: join(GOLDENS_PATH, "multiple_async_paths.flow-meta.xml"),
  nonAsyncScheduledPath: join(
    GOLDENS_PATH,
    "non_async_scheduled_path.flow-meta.xml",
  ),
};

const NODE_NAMES = {
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

Deno.test("FlowParser", async (t) => {
  let systemUnderTest: FlowParser;
  let caught: Error | undefined;
  let parsedFlow: ParsedFlow;

  await t.step("should parse valid XML into a flow object", async () => {
    systemUnderTest = new FlowParser(Deno.readTextFileSync(TEST_FILES.sample));

    parsedFlow = await systemUnderTest.generateFlowDefinition();

    assert(parsedFlow);
    assert(parsedFlow.transitions);
    assertEquals(parsedFlow.transitions, [
      {
        from: START_NODE_NAME,
        to: "Get_Aurora_Tag_Definition",
        fault: false,
        label: undefined,
      },
      {
        from: "Get_Aurora_Tag_Definition",
        to: "Was_Tag_Definition_c_found",
        fault: false,
        label: undefined,
      },
      {
        from: "Was_Tag_Definition_c_found",
        to: "Populate_Tag",
        fault: false,
        label: "Yes",
      },
      {
        from: "Was_Tag_Definition_c_found",
        to: "Add_No_Tag_Definition_Found_Error",
        fault: false,
        label: "No",
      },
      {
        from: "Populate_Tag",
        to: "Insert_Tag",
        fault: false,
        label: undefined,
      },
      {
        from: "Insert_Tag",
        to: "Add_Issue_Inserting_Tag_Record_Error",
        fault: true,
        label: "Fault",
      },
    ]);
  });

  await t.step("should handle circular transitions", async () => {
    systemUnderTest = new FlowParser(
      Deno.readTextFileSync(TEST_FILES.circularTransition),
    );

    parsedFlow = await systemUnderTest.generateFlowDefinition();

    assert(parsedFlow);
    assert(parsedFlow.transitions);
    assertEquals(parsedFlow.transitions, [
      {
        from: START_NODE_NAME,
        to: LOOP_NODE_NAME,
        fault: false,
        label: undefined,
      },
      {
        from: LOOP_NODE_NAME,
        to: LOOP_NODE_NAME,
        fault: false,
        label: "for each",
      },
    ]);
  });

  await t.step(
    "should ensure multiple node definitions are represented as arrays",
    async () => {
      systemUnderTest = new FlowParser(
        Deno.readTextFileSync(TEST_FILES.multipleElements),
      );

      parsedFlow = await systemUnderTest.generateFlowDefinition();

      assert(parsedFlow);

      // Compare actual parsedFlow nodes to expected based on the file
      assertEquals(
        parsedFlow.apexPluginCalls?.map((n) => n.name),
        [NODE_NAMES.apexPluginCall, `${NODE_NAMES.apexPluginCall}2`],
      );
      assertEquals(
        parsedFlow.assignments?.map((n) => n.name),
        [NODE_NAMES.assignment, `${NODE_NAMES.assignment}2`],
      );
      assertEquals(
        parsedFlow.collectionProcessors?.map((n) => n.name),
        [NODE_NAMES.collectionProcessor, `${NODE_NAMES.collectionProcessor}2`],
      );
      assertEquals(
        parsedFlow.decisions?.map((n) => n.name),
        [NODE_NAMES.decision, `${NODE_NAMES.decision}2`],
      );
      assertEquals(
        parsedFlow.loops?.map((n) => n.name),
        [NODE_NAMES.loop, `${NODE_NAMES.loop}2`],
      );
      assertEquals(
        parsedFlow.orchestratedStages?.map((n) => n.name),
        [NODE_NAMES.orchestratedStage, `${NODE_NAMES.orchestratedStage}2`],
      );
      assertEquals(
        parsedFlow.recordCreates?.map((n) => n.name),
        [NODE_NAMES.recordCreate, `${NODE_NAMES.recordCreate}2`],
      );
      assertEquals(
        parsedFlow.recordDeletes?.map((n) => n.name),
        [NODE_NAMES.recordDelete, `${NODE_NAMES.recordDelete}2`],
      );
      assertEquals(
        parsedFlow.recordLookups?.map((n) => n.name),
        [NODE_NAMES.recordLookup, `${NODE_NAMES.recordLookup}2`],
      );
      assertEquals(
        parsedFlow.recordRollbacks?.map((n) => n.name),
        [NODE_NAMES.recordRollback, `${NODE_NAMES.recordRollback}2`],
      );
      assertEquals(
        parsedFlow.recordUpdates?.map((n) => n.name),
        [NODE_NAMES.recordUpdate, `${NODE_NAMES.recordUpdate}2`],
      );
      assertEquals(
        parsedFlow.screens?.map((n) => n.name),
        [NODE_NAMES.screen, `${NODE_NAMES.screen}2`],
      );
      assertEquals(
        parsedFlow.steps?.map((n) => n.name),
        [NODE_NAMES.step, `${NODE_NAMES.step}2`],
      );
      assertEquals(
        parsedFlow.subflows?.map((n) => n.name),
        [NODE_NAMES.subflow, `${NODE_NAMES.subflow}2`],
      );
      assertEquals(
        parsedFlow.transforms?.map((n) => n.name),
        [NODE_NAMES.transform, `${NODE_NAMES.transform}2`],
      );
      assertEquals(
        parsedFlow.waits?.map((n) => n.name),
        [NODE_NAMES.wait, `${NODE_NAMES.wait}2`],
      );
      assertEquals(
        parsedFlow.actionCalls?.map((n) => n.name),
        [NODE_NAMES.actionCall, `${NODE_NAMES.actionCall}2`],
      );
    },
  );

  await t.step(
    "should ensure single node definitions are represented as arrays",
    async () => {
      systemUnderTest = new FlowParser(
        Deno.readTextFileSync(TEST_FILES.singleElements),
      );

      parsedFlow = await systemUnderTest.generateFlowDefinition();

      assert(parsedFlow);
      // Compare actual parsedFlow nodes to expected based on the file
      assertEquals(
        parsedFlow.apexPluginCalls?.map((n) => n.name),
        [NODE_NAMES.apexPluginCall],
      );
      assertEquals(
        parsedFlow.assignments?.map((n) => n.name),
        [NODE_NAMES.assignment],
      );
      assertEquals(
        parsedFlow.collectionProcessors?.map((n) => n.name),
        [NODE_NAMES.collectionProcessor],
      );
      assertEquals(
        parsedFlow.decisions?.map((n) => n.name),
        [NODE_NAMES.decision],
      );
      assertEquals(
        parsedFlow.loops?.map((n) => n.name),
        [NODE_NAMES.loop],
      );
      assertEquals(
        parsedFlow.orchestratedStages?.map((n) => n.name),
        [NODE_NAMES.orchestratedStage],
      );
      assertEquals(
        parsedFlow.recordCreates?.map((n) => n.name),
        [NODE_NAMES.recordCreate],
      );
      assertEquals(
        parsedFlow.recordDeletes?.map((n) => n.name),
        [NODE_NAMES.recordDelete],
      );
      assertEquals(
        parsedFlow.recordLookups?.map((n) => n.name),
        [NODE_NAMES.recordLookup],
      );
      assertEquals(
        parsedFlow.recordRollbacks?.map((n) => n.name),
        [NODE_NAMES.recordRollback],
      );
      assertEquals(
        parsedFlow.recordUpdates?.map((n) => n.name),
        [NODE_NAMES.recordUpdate],
      );
      assertEquals(
        parsedFlow.screens?.map((n) => n.name),
        [NODE_NAMES.screen],
      );
      assertEquals(
        parsedFlow.steps?.map((n) => n.name),
        [NODE_NAMES.step],
      );
      assertEquals(
        parsedFlow.subflows?.map((n) => n.name),
        [NODE_NAMES.subflow],
      );
      assertEquals(
        parsedFlow.transforms?.map((n) => n.name),
        [NODE_NAMES.transform],
      );
      assertEquals(
        parsedFlow.waits?.map((n) => n.name),
        [NODE_NAMES.wait],
      );
      assertEquals(
        parsedFlow.actionCalls?.map((n) => n.name),
        [NODE_NAMES.actionCall],
      );
    },
  );

  await t.step("should properly identify rollbacks", async () => {
    systemUnderTest = new FlowParser(
      Deno.readTextFileSync(TEST_FILES.rollback),
    );

    parsedFlow = await systemUnderTest.generateFlowDefinition();

    assert(parsedFlow);
    assertEquals(parsedFlow.recordLookups, [
      {
        ...parsedFlow.recordLookups?.[0], // Keep all the properties that the parser extracts
        connector: { targetReference: NODE_NAMES.recordRollback },
      } as flowTypes.FlowRecordLookup,
    ]);
    assertEquals(parsedFlow.recordRollbacks, [
      {
        ...parsedFlow.recordRollbacks?.[0],
        connector: { targetReference: NODE_NAMES.screen },
      } as flowTypes.FlowRecordRollback,
    ]);

    assertEquals(
      parsedFlow.screens?.map((n) => n.name),
      [NODE_NAMES.screen],
    );

    assertEquals(parsedFlow.transitions, [
      {
        from: START_NODE_NAME,
        to: NODE_NAMES.recordLookup,
        fault: false,
        label: undefined,
      },
      {
        from: NODE_NAMES.recordLookup,
        to: NODE_NAMES.recordRollback,
        fault: false,
        label: undefined,
      },
      {
        from: NODE_NAMES.recordRollback,
        to: NODE_NAMES.screen,
        fault: false,
        label: undefined,
      },
    ]);
  });

  await t.step("should throw an error when the XML is invalid", async () => {
    systemUnderTest = new FlowParser("invalid XML");

    try {
      parsedFlow = await systemUnderTest.generateFlowDefinition();
    } catch (error: unknown) {
      caught = error as Error;
    }

    assert(caught);
    assert(caught?.message?.includes("Non-whitespace before first tag"));
  });

  await t.step(
    "should throw an error when the XML is missing a start node",
    async () => {
      systemUnderTest = new FlowParser(
        Deno.readTextFileSync(TEST_FILES.noStartNode),
      );

      await assertRejects(
        async () => await systemUnderTest.generateFlowDefinition(),
        Error,
        ERROR_MESSAGES.flowStartNotDefined,
      );
    },
  );

  await t.step(
    "should throw an error when the XML contains an invalid transition",
    async () => {
      systemUnderTest = new FlowParser(
        Deno.readTextFileSync(TEST_FILES.missingTransitionNode),
      );

      await assertRejects(
        async () => await systemUnderTest.generateFlowDefinition(),
        Error,
        ERROR_MESSAGES.couldNotFindConnectedNode(NON_EXISTING_ELEMENT),
      );
    },
  );

  await t.step(
    "should ensure flow start filters are always treated as arrays",
    async () => {
      systemUnderTest = new FlowParser(
        Deno.readTextFileSync(TEST_FILES.singleFilter),
      );

      parsedFlow = await systemUnderTest.generateFlowDefinition();

      assert(parsedFlow.start);
      assert(parsedFlow.start.filters);
      assert(Array.isArray(parsedFlow.start.filters));
      assertEquals(parsedFlow.start.filters.length, 1);
      assertEquals(parsedFlow.start.filters[0].field, "Name");
      assertEquals(parsedFlow.start.filters[0].operator, "IsNull");
      assertEquals(parsedFlow.start.filters[0].value.booleanValue, "true");
    },
  );

  await t.step(
    "should ensure flow start scheduled paths are always treated as arrays",
    async () => {
      systemUnderTest = new FlowParser(
        Deno.readTextFileSync(TEST_FILES.singleScheduledPath),
      );

      parsedFlow = await systemUnderTest.generateFlowDefinition();

      assert(parsedFlow.start);
      assert(parsedFlow.start.scheduledPaths);
      assert(Array.isArray(parsedFlow.start.scheduledPaths));
      assertEquals(parsedFlow.start.scheduledPaths.length, 1);
      assertEquals(parsedFlow.start.scheduledPaths[0].label, "Daily");
      assertEquals(parsedFlow.start.scheduledPaths[0].offsetNumber, "1");
      assertEquals(parsedFlow.start.scheduledPaths[0].offsetUnit, "Days");
    },
  );

  await t.step(
    "should ensure flow start capability types are always treated as arrays",
    async () => {
      systemUnderTest = new FlowParser(
        Deno.readTextFileSync(TEST_FILES.singleCapability),
      );

      parsedFlow = await systemUnderTest.generateFlowDefinition();

      assert(parsedFlow.start);
      assert(parsedFlow.start.capabilityTypes);
      assert(Array.isArray(parsedFlow.start.capabilityTypes));
      assertEquals(parsedFlow.start.capabilityTypes.length, 1);
      assertEquals(
        parsedFlow.start.capabilityTypes[0].capabilityName,
        "Chatter",
      );
    },
  );

  await t.step(
    "should ensure flow start with multiple filters, scheduled paths, and capabilities are handled correctly",
    async () => {
      systemUnderTest = new FlowParser(
        Deno.readTextFileSync(TEST_FILES.multipleStartElements),
      );

      parsedFlow = await systemUnderTest.generateFlowDefinition();

      assert(parsedFlow.start);

      // Check filters
      assert(parsedFlow.start.filters);
      assert(Array.isArray(parsedFlow.start.filters));
      assertEquals(parsedFlow.start.filters.length, 2);
      assertEquals(parsedFlow.start.filters[0].field, "Name");
      assertEquals(parsedFlow.start.filters[0].operator, "IsNull");
      assertEquals(parsedFlow.start.filters[0].value.booleanValue, "true");
      assertEquals(parsedFlow.start.filters[1].field, "Type");
      assertEquals(parsedFlow.start.filters[1].operator, "EqualTo");
      assertEquals(parsedFlow.start.filters[1].value.stringValue, "Prospect");

      // Check scheduled paths
      assert(parsedFlow.start.scheduledPaths);
      assert(Array.isArray(parsedFlow.start.scheduledPaths));
      assertEquals(parsedFlow.start.scheduledPaths.length, 2);
      assertEquals(parsedFlow.start.scheduledPaths[0].label, "Daily");
      assertEquals(parsedFlow.start.scheduledPaths[0].offsetNumber, "1");
      assertEquals(parsedFlow.start.scheduledPaths[0].offsetUnit, "Days");
      assertEquals(parsedFlow.start.scheduledPaths[1].label, "Weekly");
      assertEquals(parsedFlow.start.scheduledPaths[1].offsetNumber, "7");
      assertEquals(parsedFlow.start.scheduledPaths[1].offsetUnit, "Days");

      // Check capability types
      assert(parsedFlow.start.capabilityTypes);
      assert(Array.isArray(parsedFlow.start.capabilityTypes));
      assertEquals(parsedFlow.start.capabilityTypes.length, 2);
      assertEquals(
        parsedFlow.start.capabilityTypes[0].capabilityName,
        "Chatter",
      );
      assertEquals(
        parsedFlow.start.capabilityTypes[1].capabilityName,
        "Lightning",
      );
    },
  );

  await t.step(
    "should handle flow start with no filters, scheduled paths, or capabilities gracefully",
    async () => {
      systemUnderTest = new FlowParser(
        Deno.readTextFileSync(TEST_FILES.noStartElements),
      );

      parsedFlow = await systemUnderTest.generateFlowDefinition();

      assert(parsedFlow.start);
      // These should be undefined when not present in XML
      assertEquals(parsedFlow.start.filters, undefined);
      assertEquals(parsedFlow.start.scheduledPaths, undefined);
      assertEquals(parsedFlow.start.capabilityTypes, undefined);
    },
  );

  await t.step(
    "should handle single async path correctly",
    async () => {
      systemUnderTest = new FlowParser(
        Deno.readTextFileSync(TEST_FILES.asyncPathTest),
      );

      parsedFlow = await systemUnderTest.generateFlowDefinition();

      assert(parsedFlow.transitions);
      assertEquals(parsedFlow.transitions.length, 2);

      // Main flow transition (no label)
      assertEquals(parsedFlow.transitions[0], {
        from: START_NODE_NAME,
        to: "main_update",
        fault: false,
        label: undefined,
      });

      // Async path transition (with path type as label)
      assertEquals(parsedFlow.transitions[1], {
        from: START_NODE_NAME,
        to: "async_update",
        fault: false,
        label: "AsyncAfterCommit",
      });
    },
  );

  await t.step(
    "should handle multiple async paths correctly",
    async () => {
      systemUnderTest = new FlowParser(
        Deno.readTextFileSync(TEST_FILES.multipleAsyncPaths),
      );

      parsedFlow = await systemUnderTest.generateFlowDefinition();

      assert(parsedFlow.transitions);
      assertEquals(parsedFlow.transitions.length, 3);

      // Main flow transition (no label)
      assertEquals(parsedFlow.transitions[0], {
        from: START_NODE_NAME,
        to: "main_update",
        fault: false,
        label: undefined,
      });

      // First async path transition
      assertEquals(parsedFlow.transitions[1], {
        from: START_NODE_NAME,
        to: "async_update_1",
        fault: false,
        label: "AsyncAfterCommit",
      });

      // Second async path transition
      assertEquals(parsedFlow.transitions[2], {
        from: START_NODE_NAME,
        to: "async_update_2",
        fault: false,
        label: "AsyncAfterCommit",
      });
    },
  );

  await t.step(
    "should not label non-async scheduled paths as asynchronous",
    async () => {
      systemUnderTest = new FlowParser(
        Deno.readTextFileSync(TEST_FILES.nonAsyncScheduledPath),
      );

      parsedFlow = await systemUnderTest.generateFlowDefinition();

      assert(parsedFlow.transitions);
      assertEquals(parsedFlow.transitions.length, 2);

      // Main flow transition (no label)
      assertEquals(parsedFlow.transitions[0], {
        from: START_NODE_NAME,
        to: "main_update",
        fault: false,
        label: undefined,
      });

      // Non-async scheduled path transition (with path type as label)
      assertEquals(parsedFlow.transitions[1], {
        from: START_NODE_NAME,
        to: "scheduled_update",
        fault: false,
        label: "RecordField",
      });
    },
  );
});
