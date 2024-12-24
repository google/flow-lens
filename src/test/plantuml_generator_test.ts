import { assertEquals, assertStringIncludes } from "@std/assert";
import { ParsedFlow } from "../main/flow_parser.ts";
import * as flowTypes from "../main/flow_types.ts";
import { PlantUmlGenerator } from "../main/plantuml_generator.ts";

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
    orchestratedStages: [
      generateStage(NODE_NAMES.orchestratedStage, NODE_NAMES.stageSteps),
    ],
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
  return [{ name: `${name}`, label: `${name}` }] as flowTypes.FlowNode[];
}

function generateStage(
  name: string,
  stepNames: string[]
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

Deno.test("PlantUml", async (t) => {
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

  await t.step("should generate flow apex plugin call", () => {
    result = systemUnderTest.getFlowApexPluginCall(
      mockedFlow.apexPluginCalls![0]
    );

    assertEquals(
      result,
      'state "**Apex Plugin Call** <&code> \\n myApexPluginCall" as myApexPluginCall'
    );
  });

  await t.step("should generate flow assignment", () => {
    result = systemUnderTest.getFlowAssignment(mockedFlow.assignments![0]);

    assertEquals(
      result,
      'state "**Assignment** <&menu> \\n myAssignment" as myAssignment <<Orange>>'
    );
  });

  await t.step("should generate flow collection processor", () => {
    result = systemUnderTest.getFlowCollectionProcessor(
      mockedFlow.collectionProcessors![0]
    );

    assertEquals(
      result,
      'state "**Collection Processor** \\n myCollectionProcessor" as myCollectionProcessor'
    );
  });

  await t.step("should generate flow decision", () => {
    result = systemUnderTest.getFlowDecision(mockedFlow.decisions![0]);

    assertEquals(
      result,
      'state "**Decision** <&fork> \\n myDecision" as myDecision <<Orange>>'
    );
  });

  await t.step("should generate flow loop", () => {
    result = systemUnderTest.getFlowLoop(mockedFlow.loops![0]);

    assertEquals(
      result,
      'state "**Loop** <&loop> \\n myLoop" as myLoop <<Orange>>'
    );
  });

  await t.step("should generate flow orchestrated stage", () => {
    result = systemUnderTest.getFlowOrchestratedStage(
      mockedFlow.orchestratedStages![0]
    );

    assertEquals(
      result,
      `state "**Orchestrated Stage** <&chevron-right> \\n myOrchestratedStage" as myOrchestratedStage {
state "**Stage Step** <&justify-center> \\n step1" as myOrchestratedStage_step1Action <<Navy>>
state "**Stage Step** <&justify-center> \\n step2" as myOrchestratedStage_step2Action <<Navy>>
state "**Stage Step** <&justify-center> \\n step3" as myOrchestratedStage_step3Action <<Navy>>
}`
    );
  });

  await t.step("should generate flow record create", () => {
    result = systemUnderTest.getFlowRecordCreate(mockedFlow.recordCreates![0]);

    assertEquals(
      result,
      'state "**Record Create** <&medical-cross> \\n myRecordCreate" as myRecordCreate <<Pink>>'
    );
  });

  await t.step("should generate flow record delete", () => {
    result = systemUnderTest.getFlowRecordDelete(mockedFlow.recordDeletes![0]);

    assertEquals(
      result,
      'state "**Record Delete** \\n myRecordDelete" as myRecordDelete <<Pink>>'
    );
  });

  await t.step("should generate flow record lookup", () => {
    result = systemUnderTest.getFlowRecordLookup(mockedFlow.recordLookups![0]);

    assertEquals(
      result,
      'state "**Record Lookup** <&magnifying-glass> \\n myRecordLookup" as myRecordLookup <<Pink>>'
    );
  });

  await t.step("should generate flow record rollback", () => {
    result = systemUnderTest.getFlowRecordRollback(
      mockedFlow.recordRollbacks![0]
    );

    assertEquals(
      result,
      'state "**Record Rollback** \\n myRecordRollback" as myRecordRollback <<Pink>>'
    );
  });

  await t.step("should generate flow record update", () => {
    result = systemUnderTest.getFlowRecordUpdate(mockedFlow.recordUpdates![0]);

    assertEquals(
      result,
      'state "**Record Update** \\n myRecordUpdate" as myRecordUpdate <<Pink>>'
    );
  });

  await t.step("should generate flow screen", () => {
    result = systemUnderTest.getFlowScreen(mockedFlow.screens![0]);

    assertEquals(
      result,
      'state "**Screen** <&browser> \\n myScreen" as myScreen <<Blue>>'
    );
  });

  await t.step("should generate flow step", () => {
    result = systemUnderTest.getFlowStep(mockedFlow.steps![0]);

    assertEquals(result, 'state "**Step** \\n myStep" as myStep');
  });

  await t.step("should generate flow subflow", () => {
    result = systemUnderTest.getFlowSubflow(mockedFlow.subflows![0]);

    assertEquals(
      result,
      'state "**Subflow** \\n mySubflow" as mySubflow <<Navy>>'
    );
  });

  await t.step("should generate flow transform", () => {
    result = systemUnderTest.getFlowTransform(mockedFlow.transforms![0]);

    assertEquals(
      result,
      'state "**Transform** \\n myTransform" as myTransform'
    );
  });

  await t.step("should generate flow wait", () => {
    result = systemUnderTest.getFlowWait(mockedFlow.waits![0]);

    assertEquals(result, 'state "**Wait** \\n myWait" as myWait');
  });

  await t.step("should generate flow action call", () => {
    result = systemUnderTest.getFlowActionCall(mockedFlow.actionCalls![0]);

    assertEquals(
      result,
      'state "**Action Call** <&code> \\n myActionCall" as myActionCall <<Navy>>'
    );
  });

  await t.step("should generate transition", () => {
    result = systemUnderTest.getTransition(mockedFlow.transitions![0]);

    assertEquals(result, "[*] --> myApexPluginCall");
  });
});
