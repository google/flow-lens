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

import { assertEquals, assertExists, assertStringIncludes } from "@std/assert";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  Configuration,
  DiagramTool,
  Mode,
  RuntimeConfig,
} from "../main/argument_processor.ts";
import { FlowDifference } from "../main/flow_to_uml_transformer.ts";
import { UmlWriter } from "../main/uml_writer.ts";

const TEST_UNDECLARED_OUTPUTS_DIR = "./";

const FILE_1 = "file1.flow";
const FILE_2 = "file2.flow";
const FILE_PATH_1 = `path/to/${FILE_1}`;
const FILE_PATH_2 = `path/to/${FILE_2}`;
const UML_1 = "uml1";
const UML_2 = "uml2";
const FLOW_DIFFERENCE_1: FlowDifference = {
  old: undefined,
  new: UML_1,
};
const FLOW_DIFFERENCE_2: FlowDifference = {
  old: UML_1,
  new: UML_2,
};
const ENCODING = "utf8";
const OUTPUT_FILE_NAME = "output_file_name";
const SAMPLE_PLACER_PATH = "sample/placer/path";

const FILE_PATH_TO_FLOW_DIFFERENCE = new Map<string, FlowDifference>([
  [FILE_PATH_1, FLOW_DIFFERENCE_1],
  [FILE_PATH_2, FLOW_DIFFERENCE_2],
]);

const EXPECTED_DEFAULT_FORMAT = [
  {
    path: FILE_PATH_1,
    difference: FLOW_DIFFERENCE_1,
  },
  {
    path: FILE_PATH_2,
    difference: FLOW_DIFFERENCE_2,
  },
];

const expectedFilePath = path.join(
  TEST_UNDECLARED_OUTPUTS_DIR,
  `${OUTPUT_FILE_NAME}.json`
);

function getRuntimeConfig(
  diagramTool: DiagramTool = DiagramTool.PLANTUML
): RuntimeConfig {
  return {
    diagramTool,
    outputDirectory: TEST_UNDECLARED_OUTPUTS_DIR,
    outputFileName: OUTPUT_FILE_NAME,
    mode: Mode.JSON,
  };
}

Deno.test("UmlWriter", async (t) => {
  let writer: UmlWriter;
  let fileContent: string;

  await t.step("should write UML diagrams to a file", () => {
    Configuration.getInstance = () => getRuntimeConfig();
    writer = new UmlWriter(FILE_PATH_TO_FLOW_DIFFERENCE);

    writer.writeUmlDiagrams();

    assertExists(fs.existsSync(expectedFilePath));
    fileContent = fs.readFileSync(expectedFilePath, ENCODING).toString();
    assertEquals(fileContent, JSON.stringify(EXPECTED_DEFAULT_FORMAT, null, 2));

    Deno.remove(expectedFilePath);
  });
});
