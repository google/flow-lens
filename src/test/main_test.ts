import { assert, assertEquals, assertExists } from "@std/assert";
import * as path from "node:path";
import {
  Configuration,
  DiagramTool,
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

    Deno.remove(path.join(TEST_UNDECLARED_OUTPUTS_DIR, "test.json"));
  }
);
