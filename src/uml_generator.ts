/**
 * @fileoverview This file contains the UmlGenerator class which is used to
 * generate a UML string representation of a Salesforce flow.
 */

import * as os from "node:os";
import { ParsedFlow, Transition } from "./flow_parser.ts";
import * as flowTypes from "./flow_types.ts";

/**
 * The UmlGenerator class is used to generate a UML string representation of a
 * Salesforce flow.
 *
 * This class is abstract and must be extended to provide the specific
 * implementations for each of the flow element types.
 * There will be one instance of the UmlGenerator for each diagramming tool.
 */
export abstract class UmlGenerator {
  constructor(private readonly parsedFlow: ParsedFlow) {}

  generateUml(): string {
    const result = [
      this.getHeader(this.parsedFlow.label!),
      this.processFlowElements<flowTypes.FlowApexPluginCall>(
        this.parsedFlow.apexPluginCalls,
        (node) => this.getFlowApexPluginCall(node)
      ),
      this.processFlowElements<flowTypes.FlowAssignment>(
        this.parsedFlow.assignments,
        (node) => this.getFlowAssignment(node)
      ),
      this.processFlowElements<flowTypes.FlowCollectionProcessor>(
        this.parsedFlow.collectionProcessors,
        (node) => this.getFlowCollectionProcessor(node)
      ),
      this.processFlowElements<flowTypes.FlowDecision>(
        this.parsedFlow.decisions,
        (node) => this.getFlowDecision(node)
      ),
      this.processFlowElements<flowTypes.FlowLoop>(
        this.parsedFlow.loops,
        (node) => this.getFlowLoop(node)
      ),
      this.processFlowElements<flowTypes.FlowOrchestratedStage>(
        this.parsedFlow.orchestratedStages,
        (node) => this.getFlowOrchestratedStage(node)
      ),
      this.processFlowElements<flowTypes.FlowRecordCreate>(
        this.parsedFlow.recordCreates,
        (node) => this.getFlowRecordCreate(node)
      ),
      this.processFlowElements<flowTypes.FlowRecordDelete>(
        this.parsedFlow.recordDeletes,
        (node) => this.getFlowRecordDelete(node)
      ),
      this.processFlowElements<flowTypes.FlowRecordLookup>(
        this.parsedFlow.recordLookups,
        (node) => this.getFlowRecordLookup(node)
      ),
      this.processFlowElements<flowTypes.FlowRecordRollback>(
        this.parsedFlow.recordRollbacks,
        (node) => this.getFlowRecordRollback(node)
      ),
      this.processFlowElements<flowTypes.FlowRecordUpdate>(
        this.parsedFlow.recordUpdates,
        (node) => this.getFlowRecordUpdate(node)
      ),
      this.processFlowElements<flowTypes.FlowScreen>(
        this.parsedFlow.screens,
        (node) => this.getFlowScreen(node)
      ),
      this.processFlowElements<flowTypes.FlowStep>(
        this.parsedFlow.steps,
        (node) => this.getFlowStep(node)
      ),
      this.processFlowElements<flowTypes.FlowSubflow>(
        this.parsedFlow.subflows,
        (node) => this.getFlowSubflow(node)
      ),
      this.processFlowElements<flowTypes.FlowTransform>(
        this.parsedFlow.transforms,
        (node) => this.getFlowTransform(node)
      ),
      this.processFlowElements<flowTypes.FlowWait>(
        this.parsedFlow.waits,
        (node) => this.getFlowWait(node)
      ),
      this.processFlowElements<flowTypes.FlowActionCall>(
        this.parsedFlow.actionCalls,
        (node) => this.getFlowActionCall(node)
      ),
      this.processTransitions(this.parsedFlow.transitions),
      this.getFooter(),
    ].filter((element) => element !== "");
    return result.join(os.EOL);
  }

  abstract getHeader(label: string): string;
  abstract getFlowApexPluginCall(node: flowTypes.FlowApexPluginCall): string;
  abstract getFlowAssignment(node: flowTypes.FlowAssignment): string;
  abstract getFlowCollectionProcessor(
    node: flowTypes.FlowCollectionProcessor
  ): string;
  abstract getFlowDecision(node: flowTypes.FlowDecision): string;
  abstract getFlowLoop(node: flowTypes.FlowLoop): string;
  abstract getFlowOrchestratedStage(
    node: flowTypes.FlowOrchestratedStage
  ): string;
  abstract getFlowRecordCreate(node: flowTypes.FlowRecordCreate): string;
  abstract getFlowRecordDelete(node: flowTypes.FlowRecordDelete): string;
  abstract getFlowRecordLookup(node: flowTypes.FlowRecordLookup): string;
  abstract getFlowRecordRollback(node: flowTypes.FlowRecordRollback): string;
  abstract getFlowRecordUpdate(node: flowTypes.FlowRecordUpdate): string;
  abstract getFlowScreen(node: flowTypes.FlowScreen): string;
  abstract getFlowStep(node: flowTypes.FlowStep): string;
  abstract getFlowSubflow(node: flowTypes.FlowSubflow): string;
  abstract getFlowTransform(node: flowTypes.FlowTransform): string;
  abstract getFlowWait(node: flowTypes.FlowWait): string;
  abstract getFlowActionCall(node: flowTypes.FlowActionCall): string;
  abstract getTransition(transition: Transition): string;
  abstract getFooter(): string;

  private processFlowElements<T extends flowTypes.FlowNode>(
    elements: T[] | undefined,
    elementProcessor: (element: T) => string
  ): string {
    return elements?.map(elementProcessor).join(os.EOL) ?? "";
  }

  private processTransitions(transitions: Transition[] | undefined): string {
    return (
      transitions
        ?.map((transition) => this.getTransition(transition))
        .join(os.EOL) ?? ""
    );
  }
}
