import { it, expect, describe, beforeEach, spyOn } from "jasmine";

import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  Configuration,
  DiagramTool,
  GenerationType,
  RuntimeConfig,
} from "./argument_processor.ts";
import { Runner } from "./main.ts";

const { TEST_UNDECLARED_OUTPUTS_DIR: TEST_UNDECLARED_OUTPUTS_DIR } =
  process.env as { [index: string]: string };

const EXPECTED_FILE_PATH = path.join(TEST_UNDECLARED_OUTPUTS_DIR, "test.json");
const ENCODING = "utf8";
const BIN_PATH = "corp/peopleops/connect/salesforce/flow_to_uml/main_bin";

const SAMPLE_FLOW_FILE_PATH = `${process.env["RUNFILES"]}/google3/corp/peopleops/connect/salesforce/flow_to_uml/goldens/sample.flow-meta.xml`;

const validConfiguration: RuntimeConfig = {
  diagramTool: DiagramTool.PLANTUML,
  filePath: [SAMPLE_FLOW_FILE_PATH],
  generationType: GenerationType.UML_DIAGRAM,
  outputDirectory: TEST_UNDECLARED_OUTPUTS_DIR,
  outputFileName: "test",
};

describe("Main Runner", () => {
  it("should not encounter any errors when executing", async () => {
    spyOn(Configuration, "getInstance").and.returnValue(validConfiguration);

    const runner = new Runner();
    await runner.execute();

    expect(runner.flowFilePaths).toEqual([SAMPLE_FLOW_FILE_PATH]);
    expect(runner.filePathToFlowDifference.size).toBe(1);
    expect(
      runner.filePathToFlowDifference.has(SAMPLE_FLOW_FILE_PATH)
    ).toBeTrue();
    expect(
      runner.filePathToFlowDifference.get(SAMPLE_FLOW_FILE_PATH)
    ).toBeDefined();
  });

  it("should execute successfully when called from the command line with the proper arguments", () => {
    let caught: Error | undefined;
    try {
      execFileSync(BIN_PATH, [
        '--diagramTool="plantuml"',
        '--generationType="uml-diagram"',
        `--filePath="${SAMPLE_FLOW_FILE_PATH}"`,
        `--outputDirectory="${TEST_UNDECLARED_OUTPUTS_DIR}"`,
        '--outputFileName="test"',
      ]);
    } catch (error: unknown) {
      caught = error as Error;
    }
    expect(caught).toBeUndefined();
    expect(fs.existsSync(EXPECTED_FILE_PATH)).toBeTrue();

    const fileContent = fs
      .readFileSync(EXPECTED_FILE_PATH, ENCODING)
      .toString();
    expect(fileContent).toContain(`"path": "${SAMPLE_FLOW_FILE_PATH}"`);
  });
});
