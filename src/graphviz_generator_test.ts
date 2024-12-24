import { it, expect, describe, beforeEach } from "jasmine";
import * as os from "node:os";
import { ParsedFlow } from "./flow_parser";
import * as flowTypes from "./flow_types";
import {
  FontColor,
  GraphVizGenerator,
  Icon,
  SkinColor,
} from "./graphviz_generator";

const EOL = Deno.build.os === "windows" ? "\r\n" : "\n";
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

const DIFF_INDICATOR = {
  ADDED: 'FONT COLOR="green"><B>+</B>',
  DELETED: 'FONT COLOR="red"><B>-</B>',
  MODIFIED: 'FONT COLOR="#DD7A00"><B>Δ</B>',
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
    decisions: [
      generateDecision(NODE_NAMES.decision),
    ] as flowTypes.FlowDecision[],
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

function generateDecision(name: string): flowTypes.FlowDecision {
  return {
    name: `${name}`,
    label: `${name}`,
    elementSubtype: "Decision",
    locationX: 0,
    locationY: 0,
    description: `${name}`,
    rules: [
      {
        name: `${name}Rule`,
        label: `${name}Rule`,
        description: `${name}Rule`,
        conditionLogic: "and",
        conditions: [
          {
            leftValueReference: "foo",
            operator: flowTypes.FlowComparisonOperator.EQUAL_TO,
            rightValue: {
              booleanValue: true,
            },
          },
        ],
      },
    ],
  } as flowTypes.FlowDecision;
}

function generateTable(
  nodeName: string,
  type: string,
  icon: Icon | string,
  skinColor: SkinColor,
  fontColor: string,
  innerNodeBody?: string
) {
  const formattedInnerNodeBody = innerNodeBody
    ? `${EOL}${innerNodeBody}${EOL}`
    : "";
  return `${nodeName} [
  label=<
<TABLE CELLSPACING="0" CELLPADDING="0">
  <TR>
    <TD>
      <B>${type}${icon}</B>
    </TD>
  </TR>
  <TR>
    <TD><U>${nodeName}</U></TD>
  </TR>${formattedInnerNodeBody}
</TABLE>
>
  color="${skinColor}"
  fontcolor="${fontColor}"
];`;
}

function generateInnerNodeCell(
  color: FontColor,
  expectedLabel: string,
  content: string[]
) {
  return `  <TR>
    <TD BORDER="1" COLOR="${color}" ALIGN="LEFT" CELLPADDING="6">
      <B>${expectedLabel}</B>
      ${content.map((content) => `<BR ALIGN="LEFT"/>${content}`).join("")}
    </TD>
  </TR>`;
}

function generateInnerNodeCells(cells: string[]) {
  return cells.join(EOL);
}

describe("GraphViz", () => {
  let systemUnderTest: GraphVizGenerator;
  let mockedFlow: ParsedFlow;
  let result: string;

  beforeEach(() => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
  });

  it("should generate header", () => {
    const label = "foo";
    result = systemUnderTest.getHeader(label);

    expect(result).toContain("digraph {");
    expect(result).toContain("label=<<B>foo</B>>");
    expect(result).toContain('title = "foo"');
    expect(result).toContain('labelloc = "t"');
    expect(result).toContain("node [shape=box, style=filled]");
  });

  it("should generate flow apex plugin call", () => {
    result = systemUnderTest.getFlowApexPluginCall(
      mockedFlow.apexPluginCalls![0]
    );

    expect(result).toEqual(
      generateTable(
        "myApexPluginCall",
        "Apex Plugin Call",
        Icon.CODE,
        SkinColor.NONE,
        FontColor.BLACK
      )
    );
  });

  it("should generate flow assignment", () => {
    result = systemUnderTest.getFlowAssignment(mockedFlow.assignments![0]);

    expect(result).toEqual(
      generateTable(
        "myAssignment",
        "Assignment",
        Icon.ASSIGNMENT,
        SkinColor.ORANGE,
        FontColor.WHITE
      )
    );
  });

  it("should generate flow collection processor", () => {
    result = systemUnderTest.getFlowCollectionProcessor(
      mockedFlow.collectionProcessors![0]
    );

    expect(result).toEqual(
      generateTable(
        "myCollectionProcessor",
        "Collection Processor",
        Icon.NONE,
        SkinColor.NONE,
        FontColor.BLACK
      )
    );
  });

  it("should generate flow decision", () => {
    result = systemUnderTest.getFlowDecision(mockedFlow.decisions![0]);

    expect(result).toEqual(
      generateTable(
        "myDecision",
        "Decision",
        Icon.DECISION,
        SkinColor.ORANGE,
        FontColor.WHITE,
        generateInnerNodeCell(FontColor.WHITE, "myDecisionRule", [
          "1. foo EqualTo true",
        ])
      )
    );
  });

  it("should generate flow loop", () => {
    result = systemUnderTest.getFlowLoop(mockedFlow.loops![0]);

    expect(result).toEqual(
      generateTable(
        "myLoop",
        "Loop",
        Icon.LOOP,
        SkinColor.ORANGE,
        FontColor.WHITE
      )
    );
  });

  it("should generate flow orchestrated stage", () => {
    result = systemUnderTest.getFlowOrchestratedStage(
      mockedFlow.orchestratedStages![0]
    );

    expect(result).toEqual(
      generateTable(
        "myOrchestratedStage",
        "Orchestrated Stage",
        Icon.RIGHT,
        SkinColor.NAVY,
        FontColor.WHITE,
        generateInnerNodeCells([
          generateInnerNodeCell(FontColor.WHITE, "1. step1", []),
          generateInnerNodeCell(FontColor.WHITE, "2. step2", []),
          generateInnerNodeCell(FontColor.WHITE, "3. step3", []),
        ])
      )
    );
  });

  it("should generate flow record create", () => {
    result = systemUnderTest.getFlowRecordCreate(mockedFlow.recordCreates![0]);

    expect(result).toEqual(
      generateTable(
        "myRecordCreate",
        "Record Create",
        Icon.CREATE_RECORD,
        SkinColor.PINK,
        FontColor.WHITE
      )
    );
  });

  it("should generate flow record delete", () => {
    result = systemUnderTest.getFlowRecordDelete(mockedFlow.recordDeletes![0]);

    expect(result).toEqual(
      generateTable(
        "myRecordDelete",
        "Record Delete",
        Icon.DELETE,
        SkinColor.PINK,
        FontColor.WHITE
      )
    );
  });

  it("should generate flow record lookup", () => {
    result = systemUnderTest.getFlowRecordLookup(mockedFlow.recordLookups![0]);

    expect(result).toEqual(
      generateTable(
        "myRecordLookup",
        "Record Lookup",
        Icon.LOOKUP,
        SkinColor.PINK,
        FontColor.WHITE
      )
    );
  });

  it("should generate flow record rollback", () => {
    result = systemUnderTest.getFlowRecordRollback(
      mockedFlow.recordRollbacks![0]
    );

    expect(result).toEqual(
      generateTable(
        "myRecordRollback",
        "Record Rollback",
        Icon.NONE,
        SkinColor.PINK,
        FontColor.WHITE
      )
    );
  });

  it("should generate flow record update", () => {
    result = systemUnderTest.getFlowRecordUpdate(mockedFlow.recordUpdates![0]);

    expect(result).toEqual(
      generateTable(
        "myRecordUpdate",
        "Record Update",
        Icon.UPDATE,
        SkinColor.PINK,
        FontColor.WHITE
      )
    );
  });

  it("should generate flow screen", () => {
    result = systemUnderTest.getFlowScreen(mockedFlow.screens![0]);

    expect(result).toEqual(
      generateTable(
        "myScreen",
        "Screen",
        Icon.SCREEN,
        SkinColor.BLUE,
        FontColor.WHITE
      )
    );
  });

  it("should generate flow step", () => {
    result = systemUnderTest.getFlowStep(mockedFlow.steps![0]);

    expect(result).toEqual(
      generateTable(
        "myStep",
        "Step",
        Icon.NONE,
        SkinColor.NONE,
        FontColor.BLACK
      )
    );
  });

  it("should generate flow subflow", () => {
    result = systemUnderTest.getFlowSubflow(mockedFlow.subflows![0]);

    expect(result).toEqual(
      generateTable(
        "mySubflow",
        "Subflow",
        Icon.NONE,
        SkinColor.NAVY,
        FontColor.WHITE
      )
    );
  });

  it("should generate flow transform", () => {
    result = systemUnderTest.getFlowTransform(mockedFlow.transforms![0]);

    expect(result).toEqual(
      generateTable(
        "myTransform",
        "Transform",
        Icon.NONE,
        SkinColor.NONE,
        FontColor.BLACK
      )
    );
  });

  it("should generate flow wait", () => {
    result = systemUnderTest.getFlowWait(mockedFlow.waits![0]);

    expect(result).toEqual(
      generateTable(
        "myWait",
        "Wait",
        Icon.WAIT,
        SkinColor.NONE,
        FontColor.BLACK
      )
    );
  });

  it("should generate flow action call", () => {
    result = systemUnderTest.getFlowActionCall(mockedFlow.actionCalls![0]);

    expect(result).toEqual(
      generateTable(
        "myActionCall",
        "Action Call",
        Icon.CODE,
        SkinColor.NAVY,
        FontColor.WHITE
      )
    );
  });

  it("should generate transition", () => {
    result = systemUnderTest.getTransition(mockedFlow.transitions![0]);

    expect(result).toEqual(
      'FLOW_START -> myApexPluginCall [label="" color="black" style=""]'
    );
  });

  it("should include added diff indicator", () => {
    const flow = generateMockFlow();
    flow.apexPluginCalls![0].diffStatus = flowTypes.DiffStatus.ADDED;
    systemUnderTest = new GraphVizGenerator(flow);
    result = systemUnderTest.getFlowApexPluginCall(flow.apexPluginCalls![0]);
    expect(result).toContain(DIFF_INDICATOR.ADDED);
  });

  it("should include deleted diff indicator", () => {
    const flow = generateMockFlow();
    flow.apexPluginCalls![0].diffStatus = flowTypes.DiffStatus.DELETED;
    systemUnderTest = new GraphVizGenerator(flow);
    result = systemUnderTest.getFlowApexPluginCall(flow.apexPluginCalls![0]);
    expect(result).toContain(DIFF_INDICATOR.DELETED);
  });

  it("should include modified diff indicator", () => {
    const flow = generateMockFlow();
    flow.apexPluginCalls![0].diffStatus = flowTypes.DiffStatus.MODIFIED;
    systemUnderTest = new GraphVizGenerator(flow);
    result = systemUnderTest.getFlowApexPluginCall(flow.apexPluginCalls![0]);
    expect(result).toContain(DIFF_INDICATOR.MODIFIED);
  });
});
