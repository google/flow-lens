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

import { assertEquals, assertThrows } from "@std/assert";
import { Configuration } from "../main/argument_processor.ts";
import { getTestConfig } from "./utilities/mock_config.ts";
import {
  ERROR_MESSAGES,
  FLOW_FILE_EXTENSION,
  FlowFileChangeDetector,
} from "../main/flow_file_change_detector.ts";

const EOL = Deno.build.os === "windows" ? "\r\n" : "\n";
const FLOW_FILE_PATH = "file2" + FLOW_FILE_EXTENSION;

/**
 * Test helper type that exposes private methods for mocking purposes.
 * Uses Omit to remove private methods and re-adds them as public.
 */
type TestableFlowFileChangeDetector = Omit<
  FlowFileChangeDetector,
  | "executeVersionCommand"
  | "executeRevParseCommand"
  | "executeDiffCommand"
  | "executeGetFileContentCommand"
> & {
  executeVersionCommand: () => void;
  executeRevParseCommand: () => void;
  executeDiffCommand: () => Uint8Array;
  executeGetFileContentCommand: (
    filePath: string,
    commitHash: string
  ) => Uint8Array;
};

function createDetector(): TestableFlowFileChangeDetector {
  const detector =
    new FlowFileChangeDetector() as unknown as TestableFlowFileChangeDetector;
  detector.executeVersionCommand = () => undefined;
  detector.executeRevParseCommand = () => undefined;
  detector.executeDiffCommand = () =>
    new TextEncoder().encode(
      ["file1.txt", FLOW_FILE_PATH, "file3.js"].join(EOL)
    );
  detector.executeGetFileContentCommand = () =>
    new TextEncoder().encode("file content");
  return detector;
}

Configuration.getInstance = () => getTestConfig();

Deno.test("FlowFileChangeDetector", async (t) => {
  await t.step(
    "should get flow files when git is installed and in a repo",
    () => {
      const detector = createDetector();
      const flowFiles = detector.getFlowFiles();

      assertEquals(flowFiles, [FLOW_FILE_PATH]);
    }
  );

  await t.step("should throw error if git is not installed", () => {
    const detector = createDetector();
    detector.executeVersionCommand = () => {
      throw new Error(ERROR_MESSAGES.gitIsNotInstalledError);
    };

    assertThrows(
      () => detector.getFlowFiles(),
      Error,
      ERROR_MESSAGES.gitIsNotInstalledError
    );
  });

  await t.step("should throw error if not in a git repo", () => {
    const detector = createDetector();
    detector.executeRevParseCommand = () => {
      throw new Error(ERROR_MESSAGES.notInGitRepoError);
    };

    assertThrows(
      () => detector.getFlowFiles(),
      Error,
      ERROR_MESSAGES.notInGitRepoError
    );
  });

  await t.step("should throw error if git diff fails", () => {
    const detector = createDetector();
    detector.executeDiffCommand = () => {
      throw new Error("Diff error");
    };

    assertThrows(
      () => detector.getFlowFiles(),
      Error,
      ERROR_MESSAGES.diffError(new Error("Diff error"))
    );
  });

  await t.step("should get file content from old version", () => {
    const detector = createDetector();
    const fileContent = detector.getFileContent(FLOW_FILE_PATH, "old");

    assertEquals(fileContent, "file content");
  });

  await t.step("should get file content from new version", () => {
    const detector = createDetector();
    const fileContent = detector.getFileContent(FLOW_FILE_PATH, "new");

    assertEquals(fileContent, "file content");
  });

  await t.step("should throw error if unable to get file content", () => {
    const detector = createDetector();
    detector.executeGetFileContentCommand = () => {
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
