import { it, expect, describe, beforeEach, spyOn } from "jasmine";
import { DiagramTool } from "./argument_processor.ts";
import { ParsedFlow } from "./flow_parser.ts";
import { UmlGeneratorContext } from "./uml_generator_context.ts";

const PLANT_UML_SIGNATURE = "skinparam State";
const parsedFlow: ParsedFlow = { label: "test" };

describe("UmlGeneratorContext", () => {
  let generatorContext: UmlGeneratorContext;

  it("should generate diagram using PlantUML", () => {
    generatorContext = new UmlGeneratorContext(DiagramTool.PLANTUML);
    const diagram = generatorContext.generateDiagram(parsedFlow);

    expect(diagram).toContain(PLANT_UML_SIGNATURE);
  });

  it("should default to using PlantUML when an unknown tool is specified", () => {
    generatorContext = new UmlGeneratorContext("fooBar" as DiagramTool);
    const diagram = generatorContext.generateDiagram(parsedFlow);

    expect(diagram).toContain(PLANT_UML_SIGNATURE);
  });
});
