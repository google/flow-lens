import { it, expect, describe, beforeEach } from "jasmine";

import { compareFlows } from "./flow_comparator.ts";
import { ParsedFlow } from "./flow_parser.ts";
import * as flowTypes from "./flow_types.ts";

const NODE = {
  name: "node",
  type: "type",
  label: "label",
  elementSubtype: "elementSubtype",
  locationX: 0,
  locationY: 0,
  description: "description",
};
const NODE_MODIFIED = {
  name: "node",
  type: "type",
  label: "label",
  elementSubtype: "elementSubtype",
  locationX: 1,
  locationY: 1,
  description: "description_modified",
};

function createParsedFlow(nodes: flowTypes.FlowNode[]): ParsedFlow {
  return {
    nameToNode: new Map<string, flowTypes.FlowNode>(
      nodes.map((node) => [node.name, node])
    ),
  };
}

describe("compareFlows", () => {
  it("should set the diff status of a deleted node", () => {
    const oldFlow: ParsedFlow = createParsedFlow([NODE]);
    const newFlow: ParsedFlow = createParsedFlow([]);

    compareFlows(oldFlow, newFlow);

    const oldNode = oldFlow.nameToNode?.get(NODE.name);
    expect(oldNode).toBeDefined();
    expect(oldNode!.diffStatus).toBe(flowTypes.DiffStatus.DELETED);
  });

  it("should set the diff status of a modified node", () => {
    const oldFlow: ParsedFlow = createParsedFlow([NODE]);
    const newFlow: ParsedFlow = createParsedFlow([NODE_MODIFIED]);

    compareFlows(oldFlow, newFlow);

    const oldNode = oldFlow.nameToNode?.get(NODE.name);
    const newNode = newFlow.nameToNode?.get(NODE_MODIFIED.name);

    expect(oldNode).toBeDefined();
    expect(newNode).toBeDefined();
    expect(oldNode?.diffStatus).toBe(flowTypes.DiffStatus.MODIFIED);
    expect(newNode?.diffStatus).toBe(flowTypes.DiffStatus.MODIFIED);
  });

  it("should set the diff status of an added node", () => {
    const oldFlow: ParsedFlow = createParsedFlow([]);
    const newFlow: ParsedFlow = createParsedFlow([NODE]);

    compareFlows(oldFlow, newFlow);

    const newNode = newFlow.nameToNode?.get(NODE.name);
    expect(newNode).toBeDefined();
    expect(newNode?.diffStatus).toBe(flowTypes.DiffStatus.ADDED);
  });
});
