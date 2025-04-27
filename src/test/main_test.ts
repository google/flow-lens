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

import { assert, assertEquals, assertExists } from "@std/assert";
import { join } from "@std/path";
import {
  Configuration,
  DiagramTool,
  Mode,
  RuntimeConfig,
} from "../main/argument_processor.ts";
import { Runner } from "../main/main.ts";

const TEST_UNDECLARED_OUTPUTS_DIR = "./";
const SAMPLE_FLOW_FILE_PATH = "./src/test/goldens/sample.flow-meta.xml";

const validConfiguration: RuntimeConfig = {
  diagramTool: DiagramTool.PLANTUML,
  filePath: [SAMPLE_FLOW_FILE_PATH],
  outputDirectory: TEST_UNDECLARED_OUTPUTS_DIR,
  outputFileName: "test",
  mode: Mode.JSON,
};

Deno.test(
  "Main Runner should not encounter any errors when executing",
  async () => {
    const originalGetInstance = Configuration.getInstance;
    let getInstanceCallCount = 0;

    Configuration.getInstance = () => {
      getInstanceCallCount++;
      return validConfiguration;
    };

    const runner = new Runner();
    await runner.execute();

    Configuration.getInstance = originalGetInstance;

    assertEquals(runner.flowFilePaths, [SAMPLE_FLOW_FILE_PATH]);
    assertEquals(runner.filePathToFlowDifference.size, 1);
    assert(runner.filePathToFlowDifference.has(SAMPLE_FLOW_FILE_PATH));
    assertExists(runner.filePathToFlowDifference.get(SAMPLE_FLOW_FILE_PATH));

    await Deno.remove(join(TEST_UNDECLARED_OUTPUTS_DIR, "test.json"));
  },
);
