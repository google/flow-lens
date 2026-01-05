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

import { assertStringIncludes } from "@std/assert";
import { DiagramTool } from "../main/argument_processor.ts";
import type { ParsedFlow } from "../main/flow_parser.ts";
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
    },
  );
});
