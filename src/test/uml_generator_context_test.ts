import { assertStringIncludes } from "@std/assert";
import { DiagramTool } from "../main/argument_processor.ts";
import { ParsedFlow } from "../main/flow_parser.ts";
import { UmlGeneratorContext } from "../main/uml_generator_context.ts";

const PLANT_UML_SIGNATURE = "skinparam State";
const parsedFlow: ParsedFlow = { label: "test" };

Deno.test("UmlGeneratorContext", async (t) => {
  await t.step("should generate diagram using PlantUML", () => {
    let generatorContext = new UmlGeneratorContext(DiagramTool.PLANTUML);
    const diagram = generatorContext.generateDiagram(parsedFlow);
    assertStringIncludes(diagram, PLANT_UML_SIGNATURE);
  });

  await t.step(
    "should default to using PlantUML when an unknown tool is specified",
    () => {
      let generatorContext = new UmlGeneratorContext("fooBar" as DiagramTool);
      const diagram = generatorContext.generateDiagram(parsedFlow);
      assertStringIncludes(diagram, PLANT_UML_SIGNATURE);
    }
  );
});
