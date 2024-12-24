import { assertEquals, assertStringIncludes } from "@std/assert";
import { ParsedFlow } from "../main/flow_parser.ts";
import * as flowTypes from "../main/flow_types.ts";
import {
  FontColor,
  GraphVizGenerator,
  Icon,
  SkinColor,
} from "../main/graphviz_generator.ts";

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

Deno.test("GraphViz", async (t) => {
  let systemUnderTest: GraphVizGenerator;
  let mockedFlow: ParsedFlow;
  let result: string;

  await t.step("should generate header", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
    const label = "foo";
    result = systemUnderTest.getHeader(label);

    assertStringIncludes(result, "digraph {");
    assertStringIncludes(result, "label=<<B>foo</B>>");
    assertStringIncludes(result, 'title = "foo"');
    assertStringIncludes(result, 'labelloc = "t"');
    assertStringIncludes(result, "node [shape=box, style=filled]");
  });

  await t.step("should generate flow apex plugin call", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
    result = systemUnderTest.getFlowApexPluginCall(
      mockedFlow.apexPluginCalls![0]
    );

    assertEquals(
      result,
      generateTable(
        "myApexPluginCall",
        "Apex Plugin Call",
        Icon.CODE,
        SkinColor.NONE,
        FontColor.BLACK
      )
    );
  });

  await t.step("should generate flow assignment", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
    result = systemUnderTest.getFlowAssignment(mockedFlow.assignments![0]);

    assertEquals(
      result,
      generateTable(
        "myAssignment",
        "Assignment",
        Icon.ASSIGNMENT,
        SkinColor.ORANGE,
        FontColor.WHITE
      )
    );
  });

  await t.step("should generate flow collection processor", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
    result = systemUnderTest.getFlowCollectionProcessor(
      mockedFlow.collectionProcessors![0]
    );

    assertEquals(
      result,
      generateTable(
        "myCollectionProcessor",
        "Collection Processor",
        Icon.NONE,
        SkinColor.NONE,
        FontColor.BLACK
      )
    );
  });

  await t.step("should generate flow decision", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
    result = systemUnderTest.getFlowDecision(mockedFlow.decisions![0]);

    assertEquals(
      result,
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

  await t.step("should generate flow loop", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
    result = systemUnderTest.getFlowLoop(mockedFlow.loops![0]);

    assertEquals(
      result,
      generateTable(
        "myLoop",
        "Loop",
        Icon.LOOP,
        SkinColor.ORANGE,
        FontColor.WHITE
      )
    );
  });

  await t.step("should generate flow orchestrated stage", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
    result = systemUnderTest.getFlowOrchestratedStage(
      mockedFlow.orchestratedStages![0]
    );

    assertEquals(
      result,
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

  await t.step("should generate flow record create", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
    result = systemUnderTest.getFlowRecordCreate(mockedFlow.recordCreates![0]);

    assertEquals(
      result,
      generateTable(
        "myRecordCreate",
        "Record Create",
        Icon.CREATE_RECORD,
        SkinColor.PINK,
        FontColor.WHITE
      )
    );
  });

  await t.step("should generate flow record delete", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
    result = systemUnderTest.getFlowRecordDelete(mockedFlow.recordDeletes![0]);

    assertEquals(
      result,
      generateTable(
        "myRecordDelete",
        "Record Delete",
        Icon.DELETE,
        SkinColor.PINK,
        FontColor.WHITE
      )
    );
  });

  await t.step("should generate flow record lookup", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
    result = systemUnderTest.getFlowRecordLookup(mockedFlow.recordLookups![0]);

    assertEquals(
      result,
      generateTable(
        "myRecordLookup",
        "Record Lookup",
        Icon.LOOKUP,
        SkinColor.PINK,
        FontColor.WHITE
      )
    );
  });

  await t.step("should generate flow record rollback", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
    result = systemUnderTest.getFlowRecordRollback(
      mockedFlow.recordRollbacks![0]
    );

    assertEquals(
      result,
      generateTable(
        "myRecordRollback",
        "Record Rollback",
        Icon.NONE,
        SkinColor.PINK,
        FontColor.WHITE
      )
    );
  });

  await t.step("should generate flow record update", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
    result = systemUnderTest.getFlowRecordUpdate(mockedFlow.recordUpdates![0]);

    assertEquals(
      result,
      generateTable(
        "myRecordUpdate",
        "Record Update",
        Icon.UPDATE,
        SkinColor.PINK,
        FontColor.WHITE
      )
    );
  });

  await t.step("should generate flow screen", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
    result = systemUnderTest.getFlowScreen(mockedFlow.screens![0]);

    assertEquals(
      result,
      generateTable(
        "myScreen",
        "Screen",
        Icon.SCREEN,
        SkinColor.BLUE,
        FontColor.WHITE
      )
    );
  });

  await t.step("should generate flow step", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
    result = systemUnderTest.getFlowStep(mockedFlow.steps![0]);

    assertEquals(
      result,
      generateTable(
        "myStep",
        "Step",
        Icon.NONE,
        SkinColor.NONE,
        FontColor.BLACK
      )
    );
  });

  await t.step("should generate flow subflow", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
    result = systemUnderTest.getFlowSubflow(mockedFlow.subflows![0]);

    assertEquals(
      result,
      generateTable(
        "mySubflow",
        "Subflow",
        Icon.NONE,
        SkinColor.NAVY,
        FontColor.WHITE
      )
    );
  });

  await t.step("should generate flow transform", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
    result = systemUnderTest.getFlowTransform(mockedFlow.transforms![0]);

    assertEquals(
      result,
      generateTable(
        "myTransform",
        "Transform",
        Icon.NONE,
        SkinColor.NONE,
        FontColor.BLACK
      )
    );
  });

  await t.step("should generate flow wait", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
    result = systemUnderTest.getFlowWait(mockedFlow.waits![0]);

    assertEquals(
      result,
      generateTable(
        "myWait",
        "Wait",
        Icon.WAIT,
        SkinColor.NONE,
        FontColor.BLACK
      )
    );
  });

  await t.step("should generate flow action call", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
    result = systemUnderTest.getFlowActionCall(mockedFlow.actionCalls![0]);

    assertEquals(
      result,
      generateTable(
        "myActionCall",
        "Action Call",
        Icon.CODE,
        SkinColor.NAVY,
        FontColor.WHITE
      )
    );
  });

  await t.step("should generate transition", () => {
    mockedFlow = generateMockFlow();
    systemUnderTest = new GraphVizGenerator(mockedFlow);
    result = systemUnderTest.getTransition(mockedFlow.transitions![0]);

    assertEquals(
      result,
      'FLOW_START -> myApexPluginCall [label="" color="black" style=""]'
    );
  });

  await t.step("should include added diff indicator", () => {
    const flow = generateMockFlow();
    flow.apexPluginCalls![0].diffStatus = flowTypes.DiffStatus.ADDED;
    systemUnderTest = new GraphVizGenerator(flow);
    result = systemUnderTest.getFlowApexPluginCall(flow.apexPluginCalls![0]);
    assertStringIncludes(result, DIFF_INDICATOR.ADDED);
  });

  await t.step("should include deleted diff indicator", () => {
    const flow = generateMockFlow();
    flow.apexPluginCalls![0].diffStatus = flowTypes.DiffStatus.DELETED;
    systemUnderTest = new GraphVizGenerator(flow);
    result = systemUnderTest.getFlowApexPluginCall(flow.apexPluginCalls![0]);
    assertStringIncludes(result, DIFF_INDICATOR.DELETED);
  });

  await t.step("should include modified diff indicator", () => {
    const flow = generateMockFlow();
    flow.apexPluginCalls![0].diffStatus = flowTypes.DiffStatus.MODIFIED;
    systemUnderTest = new GraphVizGenerator(flow);
    result = systemUnderTest.getFlowApexPluginCall(flow.apexPluginCalls![0]);
    assertStringIncludes(result, DIFF_INDICATOR.MODIFIED);
  });
});
