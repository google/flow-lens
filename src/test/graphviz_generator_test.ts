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
import * as flowTypes from "../main/flow_types.ts";
import {
  FontColor,
  GraphVizGenerator,
  Icon,
  SkinColor,
} from "../main/graphviz_generator.ts";
import {
  type DiagramNode,
  Icon as UmlIcon,
  SkinColor as UmlSkinColor,
} from "../main/uml_generator.ts";
import { generateMockFlow } from "./utilities/mock_flow.ts";
import { EOL } from "../main/constants.ts";

function generateTable(
  nodeName: string,
  type: string,
  icon: Icon,
  skinColor: SkinColor,
  fontColor: string,
  innerNodeBody?: string,
) {
  const formattedInnerNodeBody = innerNodeBody
    ? `${EOL}${innerNodeBody}${EOL}`
    : "";
  return `${nodeName} [
  label=<
<TABLE CELLSPACING="0" CELLPADDING="0" BORDER="0" CELLBORDER="0">
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
  style="filled, rounded",
  fillcolor="${skinColor}",
  fontcolor="${fontColor}"
];`;
}

function generateInnerNodeCell(
  color: FontColor,
  expectedLabel: string,
  content: string[],
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

Deno.test("GraphVizGenerator", async (t) => {
  const mockedFlow = generateMockFlow();
  const systemUnderTest = new GraphVizGenerator(mockedFlow);
  let result: string;

  await t.step("should generate header", () => {
    const label = "foo";
    result = systemUnderTest.getHeader(label);

    assertStringIncludes(result, "digraph {");
    assertStringIncludes(result, "label=<<B>foo</B>>");
    assertStringIncludes(result, 'title = "foo"');
    assertStringIncludes(result, 'labelloc = "t"');
    assertStringIncludes(result, 'node [shape=box, style="filled, rounded"]');
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
      generateTable(
        "myApexPluginCall",
        "Apex Plugin Call",
        Icon.CODE,
        SkinColor.NONE,
        FontColor.BLACK,
      ),
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
      generateTable(
        "myAssignment",
        "Assignment",
        Icon.ASSIGNMENT,
        SkinColor.ORANGE,
        FontColor.WHITE,
      ),
    );
  });

  await t.step("should generate decision node with inner nodes", () => {
    const node: DiagramNode = {
      id: "myDecision",
      label: "myDecision",
      type: "Decision",
      icon: UmlIcon.DECISION,
      color: UmlSkinColor.ORANGE,
      innerNodes: [
        {
          id: "myDecisionRule",
          label: "myDecisionRule",
          type: "Rule",
          content: ["1. foo EqualTo true"],
        },
      ],
    };
    result = systemUnderTest.toUmlString(node);
    assertEquals(
      result,
      generateTable(
        "myDecision",
        "Decision",
        Icon.DECISION,
        SkinColor.ORANGE,
        FontColor.WHITE,
        generateInnerNodeCell(FontColor.WHITE, "Rule myDecisionRule", [
          "1. foo EqualTo true",
        ]),
      ),
    );
  });

  await t.step("should generate orchestrated stage with inner nodes", () => {
    const node: DiagramNode = {
      id: "myOrchestratedStage",
      label: "myOrchestratedStage",
      type: "Orchestrated Stage",
      icon: UmlIcon.RIGHT,
      color: UmlSkinColor.NAVY,
      innerNodes: [
        {
          id: "step1",
          label: "1. step1",
          type: "Stage Step",
          content: [],
        },
        {
          id: "step2",
          label: "2. step2",
          type: "Stage Step",
          content: [],
        },
      ],
    };
    result = systemUnderTest.toUmlString(node);
    assertEquals(
      result,
      generateTable(
        "myOrchestratedStage",
        "Orchestrated Stage",
        Icon.RIGHT,
        SkinColor.NAVY,
        FontColor.WHITE,
        generateInnerNodeCells([
          generateInnerNodeCell(FontColor.WHITE, "Stage Step 1. step1", []),
          generateInnerNodeCell(FontColor.WHITE, "Stage Step 2. step2", []),
        ]),
      ),
    );
  });

  await t.step("should generate node with added diff status", () => {
    const node: DiagramNode = {
      id: "myNode",
      label: "myNode",
      type: "Record Create",
      icon: UmlIcon.CREATE_RECORD,
      color: UmlSkinColor.PINK,
      diffStatus: flowTypes.DiffStatus.ADDED,
    };
    result = systemUnderTest.toUmlString(node);
    assertStringIncludes(result, 'FONT COLOR="green"><B>+</B>');
  });

  await t.step("should generate node with deleted diff status", () => {
    const node: DiagramNode = {
      id: "myNode",
      label: "myNode",
      type: "Record Create",
      icon: UmlIcon.CREATE_RECORD,
      color: UmlSkinColor.PINK,
      diffStatus: flowTypes.DiffStatus.DELETED,
    };
    result = systemUnderTest.toUmlString(node);
    assertStringIncludes(result, 'FONT COLOR="red"><B>-</B>');
  });

  await t.step("should generate node with modified diff status", () => {
    const node: DiagramNode = {
      id: "myNode",
      label: "myNode",
      type: "Record Create",
      icon: UmlIcon.CREATE_RECORD,
      color: UmlSkinColor.PINK,
      diffStatus: flowTypes.DiffStatus.MODIFIED,
    };
    result = systemUnderTest.toUmlString(node);
    assertStringIncludes(result, 'FONT COLOR="#DD7A00"><B>Δ</B>');
  });

  await t.step("should generate transition", () => {
    result = systemUnderTest.getTransition(mockedFlow.transitions![0]);
    assertEquals(
      result,
      'FLOW_START -> myApexPluginCall [label="" color="black" style=""]',
    );
  });
});
