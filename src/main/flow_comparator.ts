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

/**
 * @fileoverview Utility functions to compare two flows.
 */

import { ParsedFlow } from "./flow_parser.ts";
import * as flowTypes from "./flow_types.ts";

const OBJECT = "object";

/**
 * Compares two flows and sets the diff status of each node.
 */
export function compareFlows(oldFlow: ParsedFlow, newFlow: ParsedFlow) {
  const oldNodes = oldFlow.nameToNode
    ? oldFlow.nameToNode
    : new Map<string, flowTypes.FlowNode>();
  const newNodes = newFlow.nameToNode
    ? newFlow.nameToNode
    : new Map<string, flowTypes.FlowNode>();
  for (const oldNodeId of oldNodes.keys()) {
    const oldNode = oldNodes.get(oldNodeId);
    if (!oldNode) {
      continue;
    }
    const newNode = newNodes.get(oldNodeId);
    if (!newNode) {
      oldNode.diffStatus = flowTypes.DiffStatus.DELETED;
    }
    if (newNode && !areEqual(oldNode, newNode)) {
      oldNode.diffStatus = flowTypes.DiffStatus.MODIFIED;
      newNode.diffStatus = flowTypes.DiffStatus.MODIFIED;
    }
  }
  for (const newNodeId of newNodes.keys()) {
    const newNode = newNodes.get(newNodeId);
    if (!newNode) {
      continue;
    }
    if (!oldNodes.has(newNodeId)) {
      newNode.diffStatus = flowTypes.DiffStatus.ADDED;
    }
  }
}

/**
 * Compares two objects recursively.
 */
// Implementation of deep equality check requires a lot of boilerplate code.
// This is a simple implementation that works for our use case, but it requires
// us to cast the types to any.
// tslint:disable-next-line:no-any
function areEqual(node1: any, node2: any): boolean {
  if (node1 === node2) {
    return true;
  }

  const keys1 = Object.keys(node1);
  const keys2 = Object.keys(node2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    const val1 = node1[key];
    const val2 = node2[key];

    if (typeof val1 === OBJECT && typeof val2 === OBJECT) {
      if (!areEqual(val1, val2)) {
        return false;
      }
    } else if (val1 !== val2) {
      return false;
    }
  }
  return true;
}
