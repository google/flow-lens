import { it, expect, describe, beforeEach } from "jasmine";
import { ParsedFlow } from "./flow_parser.ts";
import * as flowTypes from "./flow_types.ts";
import { PlantUmlGenerator } from "./plantuml_generator.ts";

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

describe("PlantUml", () => {
  let systemUnderTest: PlantUmlGenerator;
  let mockedFlow: ParsedFlow;
  let result: string;

  beforeEach(() => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new PlantUmlGenerator(mockedFlow);
  });

  it("should generate header", () => {
    const label = "foo";
    result = systemUnderTest.getHeader(label);

    expect(result).toContain("skinparam State");
    expect(result).toContain("BackgroundColor<<Pink>> #F9548A");
    expect(result).toContain("FontColor<<Pink>> white");
    expect(result).toContain("BackgroundColor<<Orange>> #DD7A00");
    expect(result).toContain("FontColor<<Orange>> white");
    expect(result).toContain("BackgroundColor<<Navy>> #344568");
    expect(result).toContain("FontColor<<Navy>> white");
    expect(result).toContain(label);
  });

  it("should generate flow apex plugin call", () => {
    result = systemUnderTest.getFlowApexPluginCall(
      mockedFlow.apexPluginCalls![0]
    );

    expect(result).toEqual(
      'state "**Apex Plugin Call** <&code> \\n myApexPluginCall" as myApexPluginCall'
    );
  });

  it("should generate flow assignment", () => {
    result = systemUnderTest.getFlowAssignment(mockedFlow.assignments![0]);

    expect(result).toEqual(
      'state "**Assignment** <&menu> \\n myAssignment" as myAssignment <<Orange>>'
    );
  });

  it("should generate flow collection processor", () => {
    result = systemUnderTest.getFlowCollectionProcessor(
      mockedFlow.collectionProcessors![0]
    );

    expect(result).toEqual(
      'state "**Collection Processor** \\n myCollectionProcessor" as myCollectionProcessor'
    );
  });

  it("should generate flow decision", () => {
    result = systemUnderTest.getFlowDecision(mockedFlow.decisions![0]);

    expect(result).toEqual(
      'state "**Decision** <&fork> \\n myDecision" as myDecision <<Orange>>'
    );
  });

  it("should generate flow loop", () => {
    result = systemUnderTest.getFlowLoop(mockedFlow.loops![0]);

    expect(result).toEqual(
      'state "**Loop** <&loop> \\n myLoop" as myLoop <<Orange>>'
    );
  });

  it("should generate flow orchestrated stage", () => {
    result = systemUnderTest.getFlowOrchestratedStage(
      mockedFlow.orchestratedStages![0]
    );

    expect(result).toEqual(
      `state "**Orchestrated Stage** <&chevron-right> \\n myOrchestratedStage" as myOrchestratedStage {
state "**Stage Step** <&justify-center> \\n step1" as myOrchestratedStage_step1Action <<Navy>>
state "**Stage Step** <&justify-center> \\n step2" as myOrchestratedStage_step2Action <<Navy>>
state "**Stage Step** <&justify-center> \\n step3" as myOrchestratedStage_step3Action <<Navy>>
}`
    );
  });

  it("should generate flow record create", () => {
    result = systemUnderTest.getFlowRecordCreate(mockedFlow.recordCreates![0]);

    expect(result).toEqual(
      'state "**Record Create** <&medical-cross> \\n myRecordCreate" as myRecordCreate <<Pink>>'
    );
  });

  it("should generate flow record delete", () => {
    result = systemUnderTest.getFlowRecordDelete(mockedFlow.recordDeletes![0]);

    expect(result).toEqual(
      'state "**Record Delete** \\n myRecordDelete" as myRecordDelete <<Pink>>'
    );
  });

  it("should generate flow record lookup", () => {
    result = systemUnderTest.getFlowRecordLookup(mockedFlow.recordLookups![0]);

    expect(result).toEqual(
      'state "**Record Lookup** <&magnifying-glass> \\n myRecordLookup" as myRecordLookup <<Pink>>'
    );
  });

  it("should generate flow record rollback", () => {
    result = systemUnderTest.getFlowRecordRollback(
      mockedFlow.recordRollbacks![0]
    );

    expect(result).toEqual(
      'state "**Record Rollback** \\n myRecordRollback" as myRecordRollback <<Pink>>'
    );
  });

  it("should generate flow record update", () => {
    result = systemUnderTest.getFlowRecordUpdate(mockedFlow.recordUpdates![0]);

    expect(result).toEqual(
      'state "**Record Update** \\n myRecordUpdate" as myRecordUpdate <<Pink>>'
    );
  });

  it("should generate flow screen", () => {
    result = systemUnderTest.getFlowScreen(mockedFlow.screens![0]);

    expect(result).toEqual(
      'state "**Screen** <&browser> \\n myScreen" as myScreen <<Blue>>'
    );
  });

  it("should generate flow step", () => {
    result = systemUnderTest.getFlowStep(mockedFlow.steps![0]);

    expect(result).toEqual('state "**Step** \\n myStep" as myStep');
  });

  it("should generate flow subflow", () => {
    result = systemUnderTest.getFlowSubflow(mockedFlow.subflows![0]);

    expect(result).toEqual(
      'state "**Subflow** \\n mySubflow" as mySubflow <<Navy>>'
    );
  });

  it("should generate flow transform", () => {
    result = systemUnderTest.getFlowTransform(mockedFlow.transforms![0]);

    expect(result).toEqual(
      'state "**Transform** \\n myTransform" as myTransform'
    );
  });

  it("should generate flow wait", () => {
    result = systemUnderTest.getFlowWait(mockedFlow.waits![0]);

    expect(result).toEqual('state "**Wait** \\n myWait" as myWait');
  });

  it("should generate flow action call", () => {
    result = systemUnderTest.getFlowActionCall(mockedFlow.actionCalls![0]);

    expect(result).toEqual(
      'state "**Action Call** <&code> \\n myActionCall" as myActionCall <<Navy>>'
    );
  });

  it("should generate transition", () => {
    result = systemUnderTest.getTransition(mockedFlow.transitions![0]);

    expect(result).toEqual("[*] --> myApexPluginCall");
  });
});
