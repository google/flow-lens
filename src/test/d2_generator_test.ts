/**
 * Copyright 2026 Google LLC
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
import type { Transition } from "../main/flow_parser.ts";
import * as flowTypes from "../main/flow_types.ts";
import { D2Generator } from "../main/d2_generator.ts";
import {
  type DiagramNode,
  Icon as UmlIcon,
  SkinColor as UmlSkinColor,
} from "../main/uml_generator.ts";
import { generateMockFlow } from "./utilities/mock_flow.ts";

Deno.test("D2Generator", async (t) => {
  const mockedFlow = generateMockFlow();
  const systemUnderTest = new D2Generator(mockedFlow);
  let result: string;

  await t.step("should generate header with D2 syntax", () => {
    const label = "Test Flow";
    result = systemUnderTest.getHeader(label);

    assertStringIncludes(result, "# Test Flow");
    assertStringIncludes(result, "direction: down");
    assertStringIncludes(result, "classes: {");
    assertStringIncludes(result, "sf-node: {");
    assertStringIncludes(result, "border-radius: 4");
    assertStringIncludes(result, "stroke-width: 2");
    assertStringIncludes(result, "font-size: 14");
  });

  await t.step("should generate diff status classes in header", () => {
    const label = "Test Flow";
    result = systemUnderTest.getHeader(label);

    assertStringIncludes(result, "added: {");
    assertStringIncludes(result, 'stroke: "#3BA755"');
    assertStringIncludes(result, "deleted: {");
    assertStringIncludes(result, 'stroke: "#EA001E"');
    assertStringIncludes(result, "modified: {");
    assertStringIncludes(result, 'stroke: "#FF9A3C"');
  });

  await t.step(
    "should generate Assignment node with Salesforce Indigo color",
    () => {
      const node: DiagramNode = {
        id: "myAssignment",
        label: "Set Variables",
        type: "Assignment",
        icon: UmlIcon.ASSIGNMENT,
        color: UmlSkinColor.ORANGE,
      };
      result = systemUnderTest.toUmlString(node);

      assertStringIncludes(result, "myAssignment: {");
      assertStringIncludes(result, '"= Assignment"');
      assertStringIncludes(result, 'fill: "#5867E8"'); // Salesforce Indigo
      assertStringIncludes(result, "class: sf-node");
      assertStringIncludes(result, '"Set Variables"');
    },
  );

  await t.step(
    "should generate Decision node with Salesforce Indigo color",
    () => {
      const node: DiagramNode = {
        id: "myDecision",
        label: "Check Conditions",
        type: "Decision",
        icon: UmlIcon.DECISION,
        color: UmlSkinColor.ORANGE,
        innerNodes: [
          {
            id: "rule1",
            label: "Rule 1",
            type: "Rule",
            content: ["foo EqualTo true"],
          },
        ],
      };
      result = systemUnderTest.toUmlString(node);

      assertStringIncludes(result, "myDecision: {");
      assertStringIncludes(result, '"◇ Decision"');
      assertStringIncludes(result, 'fill: "#5867E8"');
      assertStringIncludes(result, "detail_0: {");
      assertStringIncludes(result, "shape: text");
    },
  );

  await t.step(
    "should generate Record Create node with Salesforce Magenta color",
    () => {
      const node: DiagramNode = {
        id: "createRecord",
        label: "Create Account",
        type: "Record Create",
        icon: UmlIcon.CREATE_RECORD,
        color: UmlSkinColor.PINK,
      };
      result = systemUnderTest.toUmlString(node);

      assertStringIncludes(result, "createRecord: {");
      assertStringIncludes(result, '"+ Record Create"');
      assertStringIncludes(result, 'fill: "#E3066A"'); // Salesforce Magenta
    },
  );

  await t.step(
    "should generate Record Update node with Salesforce Magenta color",
    () => {
      const node: DiagramNode = {
        id: "updateRecord",
        label: "Update Contact",
        type: "Record Update",
        icon: UmlIcon.UPDATE,
        color: UmlSkinColor.PINK,
      };
      result = systemUnderTest.toUmlString(node);

      assertStringIncludes(result, 'fill: "#E3066A"');
      assertStringIncludes(result, '"✎ Record Update"');
    },
  );

  await t.step(
    "should generate Record Delete node with Salesforce Magenta color",
    () => {
      const node: DiagramNode = {
        id: "deleteRecord",
        label: "Delete Case",
        type: "Record Delete",
        icon: UmlIcon.DELETE,
        color: UmlSkinColor.PINK,
      };
      result = systemUnderTest.toUmlString(node);

      assertStringIncludes(result, 'fill: "#E3066A"');
      assertStringIncludes(result, '"× Record Delete"');
    },
  );

  await t.step(
    "should generate Record Lookup node with Salesforce Magenta color",
    () => {
      const node: DiagramNode = {
        id: "lookupRecord",
        label: "Get Accounts",
        type: "Record Lookup",
        icon: UmlIcon.LOOKUP,
        color: UmlSkinColor.PINK,
      };
      result = systemUnderTest.toUmlString(node);

      assertStringIncludes(result, 'fill: "#E3066A"');
      assertStringIncludes(result, '"🔍 Record Lookup"');
    },
  );

  await t.step(
    "should generate Screen node with Salesforce Blue color",
    () => {
      const node: DiagramNode = {
        id: "screenNode",
        label: "User Input Form",
        type: "Screen",
        icon: UmlIcon.SCREEN,
        color: UmlSkinColor.BLUE,
      };
      result = systemUnderTest.toUmlString(node);

      assertStringIncludes(result, 'fill: "#1B96FF"'); // Salesforce Blue
      assertStringIncludes(result, '"☰ Screen"');
    },
  );

  await t.step(
    "should generate Action Call node with Salesforce Cyan color",
    () => {
      const node: DiagramNode = {
        id: "actionNode",
        label: "Send Email",
        type: "Action Call",
        icon: UmlIcon.CODE,
        color: UmlSkinColor.NAVY,
      };
      result = systemUnderTest.toUmlString(node);

      assertStringIncludes(result, 'fill: "#06AED5"'); // Salesforce Cyan
      assertStringIncludes(result, '"⚡ Action Call"');
    },
  );

  await t.step(
    "should generate Subflow node with Salesforce Cyan color",
    () => {
      const node: DiagramNode = {
        id: "subflowNode",
        label: "Call Another Flow",
        type: "Subflow",
        icon: UmlIcon.RIGHT,
        color: UmlSkinColor.NAVY,
      };
      result = systemUnderTest.toUmlString(node);

      assertStringIncludes(result, 'fill: "#06AED5"');
      assertStringIncludes(result, '"→ Subflow"');
    },
  );

  await t.step(
    "should generate Wait node with Salesforce Orange color",
    () => {
      const node: DiagramNode = {
        id: "waitNode",
        label: "Wait for Event",
        type: "Wait",
        icon: UmlIcon.WAIT,
        color: UmlSkinColor.NONE,
      };
      result = systemUnderTest.toUmlString(node);

      assertStringIncludes(result, 'fill: "#FF9A3C"'); // Salesforce Orange
      assertStringIncludes(result, '"⏱ Wait"');
    },
  );

  await t.step(
    "should generate Loop node with Salesforce Indigo color",
    () => {
      const node: DiagramNode = {
        id: "loopNode",
        label: "Loop Through Records",
        type: "Loop",
        icon: UmlIcon.LOOP,
        color: UmlSkinColor.ORANGE,
      };
      result = systemUnderTest.toUmlString(node);

      assertStringIncludes(result, 'fill: "#5867E8"');
      assertStringIncludes(result, '"↻ Loop"');
    },
  );

  await t.step(
    "should generate Transform node with Salesforce Green color",
    () => {
      const node: DiagramNode = {
        id: "transformNode",
        label: "Transform Data",
        type: "Transform",
        icon: UmlIcon.CODE,
        color: UmlSkinColor.NONE,
      };
      result = systemUnderTest.toUmlString(node);

      assertStringIncludes(result, 'fill: "#3BA755"'); // Salesforce Green
      assertStringIncludes(result, '"⚙ Transform"');
    },
  );

  await t.step(
    "should generate Custom Error node with Salesforce Red color",
    () => {
      const node: DiagramNode = {
        id: "errorNode",
        label: "Validation Error",
        type: "Custom Error",
        icon: UmlIcon.ERROR,
        color: UmlSkinColor.NAVY,
      };
      result = systemUnderTest.toUmlString(node);

      assertStringIncludes(result, 'fill: "#EA001E"'); // Salesforce Red
      assertStringIncludes(result, '"⚠ Custom Error"');
    },
  );

  await t.step(
    "should generate Flow Start node with Salesforce Gray color",
    () => {
      const node: DiagramNode = {
        id: "FLOW_START",
        label: "Flow Start",
        type: "Flow Start",
        icon: UmlIcon.NONE,
        color: UmlSkinColor.NONE,
      };
      result = systemUnderTest.toUmlString(node);

      assertStringIncludes(result, 'fill: "#706E6B"'); // Salesforce Gray
      assertStringIncludes(result, '"▶ Flow Start"');
    },
  );

  await t.step(
    "should generate Orchestrated Stage node with Salesforce Dark Blue",
    () => {
      const node: DiagramNode = {
        id: "stageNode",
        label: "Approval Stage",
        type: "Orchestrated Stage",
        icon: UmlIcon.STAGE_STEP,
        color: UmlSkinColor.NAVY,
      };
      result = systemUnderTest.toUmlString(node);

      assertStringIncludes(result, 'fill: "#0B5CAB"'); // Salesforce Dark Blue
      assertStringIncludes(result, '"▶ Orchestrated Stage"');
    },
  );

  await t.step("should generate node with ADDED diff status", () => {
    const node: DiagramNode = {
      id: "addedNode",
      label: "New Assignment",
      type: "Assignment",
      icon: UmlIcon.ASSIGNMENT,
      color: UmlSkinColor.ORANGE,
      diffStatus: flowTypes.DiffStatus.ADDED,
    };
    result = systemUnderTest.toUmlString(node);

    assertStringIncludes(result, '"[+] = Assignment"');
    assertStringIncludes(result, "addedNode.class: added");
  });

  await t.step("should generate node with DELETED diff status", () => {
    const node: DiagramNode = {
      id: "deletedNode",
      label: "Removed Screen",
      type: "Screen",
      icon: UmlIcon.SCREEN,
      color: UmlSkinColor.BLUE,
      diffStatus: flowTypes.DiffStatus.DELETED,
    };
    result = systemUnderTest.toUmlString(node);

    assertStringIncludes(result, '"[-] ☰ Screen"');
    assertStringIncludes(result, "deletedNode.class: deleted");
  });

  await t.step("should generate node with MODIFIED diff status", () => {
    const node: DiagramNode = {
      id: "modifiedNode",
      label: "Updated Decision",
      type: "Decision",
      icon: UmlIcon.DECISION,
      color: UmlSkinColor.ORANGE,
      diffStatus: flowTypes.DiffStatus.MODIFIED,
    };
    result = systemUnderTest.toUmlString(node);

    assertStringIncludes(result, '"[Δ] ◇ Decision"');
    assertStringIncludes(result, "modifiedNode.class: modified");
  });

  await t.step("should generate normal transition with gray stroke", () => {
    const transition: Transition = {
      from: "nodeA",
      to: "nodeB",
      fault: false,
      label: "Normal Path",
    };
    result = systemUnderTest.getTransition(transition);

    assertStringIncludes(result, "nodeA -> nodeB:");
    assertStringIncludes(result, '"Normal Path"');
    assertStringIncludes(result, 'stroke: "#706E6B"'); // Salesforce Gray
    assertStringIncludes(result, "stroke-width: 2");
  });

  await t.step(
    "should generate fault transition with red dashed stroke",
    () => {
      const transition: Transition = {
        from: "nodeA",
        to: "nodeB",
        fault: true,
        label: "Error Path",
      };
      result = systemUnderTest.getTransition(transition);

      assertStringIncludes(result, "nodeA -> nodeB:");
      assertStringIncludes(result, '"Error Path"');
      assertStringIncludes(result, 'stroke: "#EA001E"'); // Salesforce Red
      assertStringIncludes(result, "stroke-dash: 5");
    },
  );

  await t.step("should generate transition without label", () => {
    const transition: Transition = {
      from: "nodeA",
      to: "nodeB",
      fault: false,
    };
    result = systemUnderTest.getTransition(transition);

    assertStringIncludes(result, "nodeA -> nodeB: {");
    assertStringIncludes(result, 'stroke: "#706E6B"');
  });

  await t.step("should handle inner nodes correctly", () => {
    const node: DiagramNode = {
      id: "decisionWithRules",
      label: "Complex Decision",
      type: "Decision",
      icon: UmlIcon.DECISION,
      color: UmlSkinColor.ORANGE,
      innerNodes: [
        {
          id: "rule1",
          label: "First Rule",
          type: "Rule",
          content: ["condition1 == true", "condition2 != false"],
        },
        {
          id: "rule2",
          label: "Second Rule",
          type: "Rule",
          content: ["another check"],
        },
      ],
    };
    result = systemUnderTest.toUmlString(node);

    assertStringIncludes(result, "detail_0: {");
    assertStringIncludes(result, "detail_1: {");
    assertStringIncludes(result, "shape: text");
    assertStringIncludes(result, "font-size: 11");
  });

  await t.step("should sanitize node IDs with special characters", () => {
    const node: DiagramNode = {
      id: "node-with-special.chars!",
      label: "Test Node",
      type: "Assignment",
      icon: UmlIcon.ASSIGNMENT,
      color: UmlSkinColor.ORANGE,
    };
    result = systemUnderTest.toUmlString(node);

    assertStringIncludes(result, "node_with_special_chars_: {");
  });

  await t.step("should sanitize node IDs starting with numbers", () => {
    const node: DiagramNode = {
      id: "123_start_with_number",
      label: "Test Node",
      type: "Assignment",
      icon: UmlIcon.ASSIGNMENT,
      color: UmlSkinColor.ORANGE,
    };
    result = systemUnderTest.toUmlString(node);

    assertStringIncludes(result, "_123_start_with_number: {");
  });

  await t.step("should escape special characters in labels", () => {
    const node: DiagramNode = {
      id: "testNode",
      label: 'Node with "quotes" and \\ backslash',
      type: "Screen",
      icon: UmlIcon.SCREEN,
      color: UmlSkinColor.BLUE,
    };
    result = systemUnderTest.toUmlString(node);

    assertStringIncludes(result, '\\"quotes\\"');
    assertStringIncludes(result, "\\\\");
  });

  await t.step("should return empty footer", () => {
    result = systemUnderTest.getFooter();
    assertEquals(result, "");
  });

  await t.step("should generate complete UML diagram", () => {
    result = systemUnderTest.generateUml();

    // Header elements
    assertStringIncludes(result, "# test");
    assertStringIncludes(result, "direction: down");
    assertStringIncludes(result, "classes: {");

    // Nodes should be present
    assertStringIncludes(result, "FLOW_START: {");
    assertStringIncludes(result, "myApexPluginCall: {");
    assertStringIncludes(result, "myAssignment: {");
    assertStringIncludes(result, "myDecision: {");

    // Transitions should be present
    assertStringIncludes(result, "FLOW_START -> myApexPluginCall");
    assertStringIncludes(result, "myApexPluginCall -> myAssignment");
    assertStringIncludes(result, "myAssignment -> myDecision");

    // Colors should be Salesforce-authentic
    assertStringIncludes(result, 'fill: "#5867E8"'); // Indigo for logic
    assertStringIncludes(result, 'fill: "#E3066A"'); // Magenta for data
    assertStringIncludes(result, 'fill: "#06AED5"'); // Cyan for actions
  });

  await t.step(
    "should use Apex Plugin Call node with Salesforce Cyan color",
    () => {
      const node: DiagramNode = {
        id: "apexPlugin",
        label: "Run Apex",
        type: "Apex Plugin Call",
        icon: UmlIcon.CODE,
        color: UmlSkinColor.NONE,
      };
      result = systemUnderTest.toUmlString(node);

      assertStringIncludes(result, 'fill: "#06AED5"');
      assertStringIncludes(result, '"{ } Apex Plugin Call"');
    },
  );

  await t.step(
    "should use Record Rollback node with Salesforce Magenta color",
    () => {
      const node: DiagramNode = {
        id: "rollbackNode",
        label: "Rollback Changes",
        type: "Record Rollback",
        icon: UmlIcon.NONE,
        color: UmlSkinColor.PINK,
      };
      result = systemUnderTest.toUmlString(node);

      assertStringIncludes(result, 'fill: "#E3066A"');
      assertStringIncludes(result, '"↶ Record Rollback"');
    },
  );

  await t.step(
    "should use Collection Processor node with Salesforce Indigo color",
    () => {
      const node: DiagramNode = {
        id: "collectionNode",
        label: "Process Collection",
        type: "Collection Processor",
        icon: UmlIcon.LOOP,
        color: UmlSkinColor.NONE,
      };
      result = systemUnderTest.toUmlString(node);

      assertStringIncludes(result, 'fill: "#5867E8"');
      assertStringIncludes(result, '"⚙ Collection Processor"');
    },
  );

  await t.step("should use Step node with Salesforce Dark Blue color", () => {
    const node: DiagramNode = {
      id: "stepNode",
      label: "Execute Step",
      type: "Step",
      icon: UmlIcon.STAGE_STEP,
      color: UmlSkinColor.NONE,
    };
    result = systemUnderTest.toUmlString(node);

    assertStringIncludes(result, 'fill: "#0B5CAB"');
    assertStringIncludes(result, '"▶ Step"');
  });

  await t.step("should handle unknown node type with default gray color", () => {
    const node: DiagramNode = {
      id: "unknownNode",
      label: "Unknown Type",
      type: "Unknown Type",
      icon: UmlIcon.NONE,
      color: UmlSkinColor.NONE,
    };
    result = systemUnderTest.toUmlString(node);

    assertStringIncludes(result, 'fill: "#706E6B"'); // Default gray
  });
});
