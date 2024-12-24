/**
 * @fileoverview This class is responsible for generating a UML diagram
 * representation of a Salesforce flow.
 * This implements the strategy pattern to allow for different diagram tools
 * to be used.
 */

import { DiagramTool } from "./argument_processor.ts";
import { ParsedFlow } from "./flow_parser.ts";
import { GraphVizGenerator } from "./graphviz_generator.ts";
import { PlantUmlGenerator } from "./plantuml_generator.ts";
import { UmlGenerator } from "./uml_generator.ts";

/**
 * This class is responsible for generating a UML diagram representation of a
 * Salesforce flow.
 */
export class UmlGeneratorContext {
  constructor(private readonly diagrammingTool: DiagramTool) {}

  /**
   * Generates a UML diagram for the given parsed flow.
   *
   * @param parsedFlow The parsed flow to generate a diagram for.
   * @return The UML diagram as a string.
   */
  generateDiagram(parsedFlow: ParsedFlow): string {
    return this.getGenerator(parsedFlow).generateUml();
  }

  /**
   * Returns the appropriate generator for the given diagram tool.
   *
   * This implements the Strategy pattern based on the selected diagram tool.
   * Right now, only PlantUML is supported, but this will be extended to support
   * other tools in the near future - hence the seemingly unnecessary
   * switch statement.
   *
   * @param parsedFlow The parsed flow to generate a diagram for.
   * @return The UML generator to use for the given diagram tool.
   */
  private getGenerator(parsedFlow: ParsedFlow): UmlGenerator {
    switch (this.diagrammingTool) {
      case DiagramTool.GRAPH_VIZ:
        return new GraphVizGenerator(parsedFlow);
      case DiagramTool.PLANTUML:
      default:
        return new PlantUmlGenerator(parsedFlow);
    }
  }
}
