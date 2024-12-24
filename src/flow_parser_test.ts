import { it, expect, describe, expectAsync } from "jasmine";

import * as fs from "node:fs";
import * as path from "node:path";
import { ERROR_MESSAGES, FlowParser, ParsedFlow } from "./flow_parser.ts";
import * as flowTypes from "./flow_types.ts";

const ENCODING = "utf8";
const GOLDENS_PATH = `${process.env["RUNFILES"]}/google3/corp/peopleops/connect/salesforce/flow_to_uml/goldens`;
const LOOP_NODE_NAME = "myLoop";
const NON_EXISTING_ELEMENT = "Non_Existing_Element";
const START_NODE_NAME = "FLOW_START";

const TEST_FILES = {
  multipleElements: path.join(GOLDENS_PATH, "multiple_elements.flow-meta.xml"),
  singleElements: path.join(GOLDENS_PATH, "single_elements.flow-meta.xml"),
  sample: path.join(GOLDENS_PATH, "sample.flow-meta.xml"),
  noStartNode: path.join(GOLDENS_PATH, "no_start_node.flow-meta.xml"),
  missingTransitionNode: path.join(
    GOLDENS_PATH,
    "missing_transition_node.flow-meta.xml"
  ),
  circularTransition: path.join(
    GOLDENS_PATH,
    "circular_transition.flow-meta.xml"
  ),
  rollback: path.join(GOLDENS_PATH, "rollback.flow-meta.xml"),
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

const FLOW_NODES = {
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
};

function getFlowNodes(name: string): flowTypes.FlowNode[] {
  return [{ name: `${name}` }, { name: `${name}2` }] as flowTypes.FlowNode[];
}

describe("FlowParser", () => {
  let systemUnderTest: FlowParser;
  let caught: Error;
  let parsedFlow: ParsedFlow;

  it("should parse valid XML into a flow object", async () => {
    systemUnderTest = new FlowParser(
      fs.readFileSync(TEST_FILES.sample, ENCODING)
    );

    parsedFlow = await systemUnderTest.generateFlowDefinition();

    expect(parsedFlow).toBeDefined();
    expect(parsedFlow.transitions).toBeDefined();
    expect(parsedFlow.transitions).toEqual([
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

  it("should handle circular transitions", async () => {
    systemUnderTest = new FlowParser(
      fs.readFileSync(TEST_FILES.circularTransition, ENCODING)
    );

    parsedFlow = await systemUnderTest.generateFlowDefinition();

    expect(parsedFlow).toBeDefined();
    expect(parsedFlow.transitions).toBeDefined();
    expect(parsedFlow.transitions).toEqual([
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

  it("should ensure multiple node definitions are represented as arrays", async () => {
    systemUnderTest = new FlowParser(
      fs.readFileSync(TEST_FILES.multipleElements, ENCODING)
    );

    parsedFlow = await systemUnderTest.generateFlowDefinition();

    expect(parsedFlow).toBeDefined();
    expect(parsedFlow.apexPluginCalls).toEqual(FLOW_NODES.apexPluginCalls);
    expect(parsedFlow.assignments).toEqual(FLOW_NODES.assignments);
    expect(parsedFlow.collectionProcessors).toEqual(
      FLOW_NODES.collectionProcessors
    );
    expect(parsedFlow.decisions).toEqual(FLOW_NODES.decisions);
    expect(parsedFlow.loops).toEqual(FLOW_NODES.loops);
    expect(parsedFlow.orchestratedStages).toEqual(
      FLOW_NODES.orchestratedStages
    );
    expect(parsedFlow.recordCreates).toEqual(FLOW_NODES.recordCreates);
    expect(parsedFlow.recordDeletes).toEqual(FLOW_NODES.recordDeletes);
    expect(parsedFlow.recordLookups).toEqual(FLOW_NODES.recordLookups);
    expect(parsedFlow.recordRollbacks).toEqual(FLOW_NODES.recordRollbacks);
    expect(parsedFlow.recordUpdates).toEqual(FLOW_NODES.recordUpdates);
    expect(parsedFlow.screens).toEqual(FLOW_NODES.screens);
    expect(parsedFlow.steps).toEqual(FLOW_NODES.steps);
    expect(parsedFlow.subflows).toEqual(FLOW_NODES.subflows);
    expect(parsedFlow.transforms).toEqual(FLOW_NODES.transforms);
    expect(parsedFlow.waits).toEqual(FLOW_NODES.waits);
    expect(parsedFlow.actionCalls).toEqual(FLOW_NODES.actionCalls);
  });

  it("should ensure single node definitions are represented as arrays", async () => {
    systemUnderTest = new FlowParser(
      fs.readFileSync(TEST_FILES.singleElements, ENCODING)
    );

    parsedFlow = await systemUnderTest.generateFlowDefinition();

    expect(parsedFlow).toBeDefined();
    expect(parsedFlow.apexPluginCalls).toEqual([FLOW_NODES.apexPluginCalls[0]]);
    expect(parsedFlow.assignments).toEqual([FLOW_NODES.assignments[0]]);
    expect(parsedFlow.collectionProcessors).toEqual([
      FLOW_NODES.collectionProcessors[0],
    ]);
    expect(parsedFlow.decisions).toEqual([FLOW_NODES.decisions[0]]);
    expect(parsedFlow.loops).toEqual([FLOW_NODES.loops[0]]);
    expect(parsedFlow.orchestratedStages).toEqual([
      FLOW_NODES.orchestratedStages[0],
    ]);
    expect(parsedFlow.recordCreates).toEqual([FLOW_NODES.recordCreates[0]]);
    expect(parsedFlow.recordDeletes).toEqual([FLOW_NODES.recordDeletes[0]]);
    expect(parsedFlow.recordLookups).toEqual([FLOW_NODES.recordLookups[0]]);
    expect(parsedFlow.recordRollbacks).toEqual([FLOW_NODES.recordRollbacks[0]]);
    expect(parsedFlow.recordUpdates).toEqual([FLOW_NODES.recordUpdates[0]]);
    expect(parsedFlow.screens).toEqual([FLOW_NODES.screens[0]]);
    expect(parsedFlow.steps).toEqual([FLOW_NODES.steps[0]]);
    expect(parsedFlow.subflows).toEqual([FLOW_NODES.subflows[0]]);
    expect(parsedFlow.transforms).toEqual([FLOW_NODES.transforms[0]]);
    expect(parsedFlow.waits).toEqual([FLOW_NODES.waits[0]]);
    expect(parsedFlow.actionCalls).toEqual([FLOW_NODES.actionCalls[0]]);
  });

  it("should properly identify rollbacks", async () => {
    systemUnderTest = new FlowParser(
      fs.readFileSync(TEST_FILES.rollback, ENCODING)
    );

    parsedFlow = await systemUnderTest.generateFlowDefinition();

    expect(parsedFlow).toBeDefined();
    expect(parsedFlow.recordLookups).toEqual([
      {
        ...FLOW_NODES.recordLookups[0],
        connector: { targetReference: NODE_NAMES.recordRollback },
      } as flowTypes.FlowRecordLookup,
    ]);
    expect(parsedFlow.recordRollbacks).toEqual([
      {
        ...FLOW_NODES.recordRollbacks[0],
        connector: { targetReference: NODE_NAMES.screen },
      } as flowTypes.FlowRecordRollback,
    ]);
    expect(parsedFlow.screens).toEqual([FLOW_NODES.screens[0]]);

    expect(parsedFlow.transitions).toEqual([
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

  it("should throw an error when the XML is invalid", async () => {
    systemUnderTest = new FlowParser("invalid XML");

    try {
      parsedFlow = await systemUnderTest.generateFlowDefinition();
    } catch (error: unknown) {
      caught = error as Error;
    }

    expect(caught).toBeDefined();
    expect(caught?.message).toContain("Non-whitespace before first tag");
  });

  it("should throw an error when the XML is missing a start node", async () => {
    systemUnderTest = new FlowParser(
      fs.readFileSync(TEST_FILES.noStartNode, ENCODING)
    );

    await expectAsync(
      systemUnderTest.generateFlowDefinition()
    ).toBeRejectedWithError(ERROR_MESSAGES.flowStartNotDefined);
  });

  it("should throw an error when the XML contains an invalid transition", async () => {
    systemUnderTest = new FlowParser(
      fs.readFileSync(TEST_FILES.missingTransitionNode, ENCODING)
    );

    await expectAsync(
      systemUnderTest.generateFlowDefinition()
    ).toBeRejectedWithError(
      ERROR_MESSAGES.couldNotFindConnectedNode(NON_EXISTING_ELEMENT)
    );
  });
});
