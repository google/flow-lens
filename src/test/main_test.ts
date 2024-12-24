import {
  assert,
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "@std/assert";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  Configuration,
  DiagramTool,
  GenerationType,
  RuntimeConfig,
} from "../main/argument_processor.ts";
import { Runner } from "../main/main.ts";

const TEST_UNDECLARED_OUTPUTS_DIR = "./";
const SAMPLE_FLOW_FILE_PATH = "./src/test/goldens/sample.flow-meta.xml";

const validConfiguration: RuntimeConfig = {
  diagramTool: DiagramTool.PLANTUML,
  filePath: [SAMPLE_FLOW_FILE_PATH],
  generationType: GenerationType.UML_DIAGRAM,
  outputDirectory: TEST_UNDECLARED_OUTPUTS_DIR,
  outputFileName: "test",
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
  }
);
