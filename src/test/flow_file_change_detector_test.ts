import { assertEquals, assertThrows } from "@std/assert";
import { Buffer } from "node:buffer";
import { Configuration } from "../main/argument_processor.ts";
import { getTestConfig } from "./argument_processor_test.ts";
import {
  ERROR_MESSAGES,
  FLOW_FILE_EXTENSION,
  FlowFileChangeDetector,
} from "../main/flow_file_change_detector.ts";

const EOL = Deno.build.os === "windows" ? "\r\n" : "\n";
const FLOW_FILE_PATH = "file2" + FLOW_FILE_EXTENSION;

Deno.test("FlowFileChangeDetector", async (t) => {
  let detector: FlowFileChangeDetector;

  // Function to set up the mock implementations
  const setupMocks = () => {
    // tslint:disable:no-any
    (detector as any).executeVersionCommand = () => undefined;
    (detector as any).executeRevParseCommand = () => undefined;
    (detector as any).executeDiffCommand = () =>
      Buffer.from(["file1.txt", FLOW_FILE_PATH, "file3.js"].join(EOL));
    (detector as any).executeGetFileContentCommand = () =>
      Buffer.from("file content");
    // tslint:enable:no-any
  };

  await t.step("beforeEach setup", async () => {
    Configuration.getInstance = () => getTestConfig();
    detector = new FlowFileChangeDetector();
    setupMocks(); // Initial setup
  });

  await t.step(
    "should get flow files when git is installed and in a repo",
    () => {
      const flowFiles = detector.getFlowFiles();

      assertEquals(flowFiles, [FLOW_FILE_PATH]);
    }
  );

  await t.step("should throw error if git is not installed", () => {
    setupMocks(); // Reset mocks before this test
    // tslint:disable-next-line:no-any
    (detector as any).executeVersionCommand = () => {
      throw new Error(ERROR_MESSAGES.gitIsNotInstalledError);
    };

    assertThrows(
      () => detector.getFlowFiles(),
      Error,
      ERROR_MESSAGES.gitIsNotInstalledError
    );
  });

  await t.step("should throw error if not in a git repo", () => {
    setupMocks(); // Reset mocks before this test
    // tslint:disable-next-line:no-any
    (detector as any).executeRevParseCommand = () => {
      throw new Error(ERROR_MESSAGES.notInGitRepoError);
    };

    assertThrows(
      () => detector.getFlowFiles(),
      Error,
      ERROR_MESSAGES.notInGitRepoError
    );
  });

  await t.step("should throw error if git diff fails", () => {
    setupMocks(); // Reset mocks before this test
    // tslint:disable-next-line:no-any
    (detector as any).executeDiffCommand = () => {
      throw new Error("Diff error");
    };

    assertThrows(
      () => detector.getFlowFiles(),
      Error,
      ERROR_MESSAGES.diffError(new Error("Diff error"))
    );
  });

  await t.step("should get file content from old version", () => {
    setupMocks(); // Reset mocks before this test
    const fileContent = detector.getFileContent(FLOW_FILE_PATH, "old");

    assertEquals(fileContent, "file content");
  });

  await t.step("should get file content from new version", () => {
    setupMocks(); // Reset mocks before this test
    const fileContent = detector.getFileContent(FLOW_FILE_PATH, "new");

    assertEquals(fileContent, "file content");
  });

  await t.step("should throw error if unable to get file content", () => {
    setupMocks(); // Reset mocks before this test
    // tslint:disable-next-line:no-any
    (detector as any).executeGetFileContentCommand = () => {
      throw new Error("Get file content error");
    };

    assertThrows(
      () => detector.getFileContent(FLOW_FILE_PATH, "old"),
      Error,
      ERROR_MESSAGES.unableToGetFileContent(
        FLOW_FILE_PATH,
        new Error("Get file content error")
      )
    );
  });
});
