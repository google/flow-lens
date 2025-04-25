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

import {
  assert,
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "@std/assert";
import * as fs from "node:fs";
import { Configuration, DiagramTool } from "../main/argument_processor.ts";
import { getTestConfig } from "./test_utils.ts";
import { FlowFileChangeDetector } from "../main/flow_file_change_detector.ts";
import {
  ERROR_MESSAGES,
  FlowDifference,
  FlowToUmlTransformer,
} from "../main/flow_to_uml_transformer.ts";
import { UmlGeneratorContext } from "../main/uml_generator_context.ts";
import { ERROR_MESSAGES as XML_READER_ERROR_MESSAGES } from "../main/xml_reader.ts";

const SAMPLE_FLOW_FILE_PATH = `./src/test/goldens/sample.flow-meta.xml`;
const PLANT_UML_SIGNATURE = "skinparam State";
const GENERATOR_CONTEXT = new UmlGeneratorContext(DiagramTool.PLANTUML);
const CHANGE_DETECTOR = new FlowFileChangeDetector();

Deno.test("FlowToUmlTransformer", async (t) => {
  let transformer: FlowToUmlTransformer;
  let result: Map<string, FlowDifference>;

  await t.step("setup", () => {
    // Mock the private methods which execute git commands using spyOn
    const executeGetFileContentCommand = () => {
      return fs.readFileSync(SAMPLE_FLOW_FILE_PATH, "utf8");
    };
    // Replace the private method with our mock implementation, using type assertion to access it.
    (CHANGE_DETECTOR as any).executeGetFileContentCommand =
      executeGetFileContentCommand;
  });

  await t.step("should transform a flow file to a UML diagram", async () => {
    const mockConfig = getTestConfig();
    const originalGetInstance = Configuration.getInstance;
    Configuration.getInstance = () => mockConfig;
    transformer = new FlowToUmlTransformer(
      [SAMPLE_FLOW_FILE_PATH],
      GENERATOR_CONTEXT,
      CHANGE_DETECTOR,
    );

    result = await transformer.transformToUmlDiagrams();

    assert(
      result.has(SAMPLE_FLOW_FILE_PATH),
      "result should have the sample file path as a key",
    );

    const flowDifference = result.get(SAMPLE_FLOW_FILE_PATH);
    assertExists(flowDifference, "flowDifference should exist");
    const newUml = flowDifference?.new;
    assertExists(newUml, "newUml should exist");
    assertStringIncludes(
      newUml,
      PLANT_UML_SIGNATURE,
      "newUml should contain PLANT_UML_SIGNATURE",
    );

    Configuration.getInstance = originalGetInstance; // Restore the original getInstance function
  });

  await t.step(
    "should log to std error if an error occurs in the pipeline",
    async () => {
      const config = getTestConfig();
      config.gitDiffFromHash = undefined;
      config.gitDiffToHash = undefined;
      const originalGetInstance = Configuration.getInstance;
      Configuration.getInstance = () => config;

      const fakeFilePath = "fake-file-path";
      let consoleErrorCall: string | undefined;
      const originalConsoleError = console.error;
      console.error = (message: string) => {
        consoleErrorCall = message;
      };

      transformer = new FlowToUmlTransformer(
        [fakeFilePath],
        GENERATOR_CONTEXT,
        CHANGE_DETECTOR,
      );

      result = await transformer.transformToUmlDiagrams();

      assertEquals(result.size, 0, "result size should be 0");
      assertExists(consoleErrorCall, "console.error should have been called");

      const expectedErrorMessage = ERROR_MESSAGES.unableToProcessFile(
        fakeFilePath,
        new Error(XML_READER_ERROR_MESSAGES.invalidFilePath(fakeFilePath)),
      );
      assertEquals(
        consoleErrorCall,
        expectedErrorMessage,
        "console.error call should have the expected message",
      );

      Configuration.getInstance = originalGetInstance; // Restore the original getInstance function
      console.error = originalConsoleError; // Restore the original console.error
    },
  );
});
