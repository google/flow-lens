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

import { assertEquals, assertExists } from "@std/assert";
import { assertSpyCalls, spy } from "@std/testing/mock";
import { join } from "@std/path";
import { existsSync } from "@std/fs";
import {
  Configuration,
  DiagramTool,
  Mode,
  type RuntimeConfig,
} from "../main/argument_processor.ts";
import type { FlowDifference } from "../main/flow_to_uml_transformer.ts";
import { UmlWriter } from "../main/uml_writer.ts";
import type { GithubClient, GithubComment } from "../main/github_client.ts";
import { EOL } from "../main/constants.ts";

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

const expectedFilePath = join(
  TEST_UNDECLARED_OUTPUTS_DIR,
  `${OUTPUT_FILE_NAME}.json`,
);

function getRuntimeConfig(
  diagramTool: DiagramTool = DiagramTool.PLANTUML,
  mode: Mode = Mode.JSON,
): RuntimeConfig {
  return {
    diagramTool,
    outputDirectory: TEST_UNDECLARED_OUTPUTS_DIR,
    outputFileName: OUTPUT_FILE_NAME,
    mode,
  };
}

Deno.test("UmlWriter", async (t) => {
  let writer: UmlWriter;
  let fileContent: string;

  await t.step("should write UML diagrams to a file", async () => {
    Configuration.getInstance = () => getRuntimeConfig();
    writer = new UmlWriter(FILE_PATH_TO_FLOW_DIFFERENCE);

    writer.writeUmlDiagrams();

    assertExists(existsSync(expectedFilePath));
    fileContent = Deno.readTextFileSync(expectedFilePath);
    assertEquals(fileContent, JSON.stringify(EXPECTED_DEFAULT_FORMAT, null, 2));

    await Deno.remove(expectedFilePath);
  });

  await t.step("should write UML diagrams as GitHub comments", async () => {
    Configuration.getInstance = () =>
      getRuntimeConfig(DiagramTool.PLANTUML, Mode.GITHUB_ACTION);

    // Create a mock GithubClient with spy methods
    const mockGithubClient = {
      writeComment: spy(async (_comment: GithubComment) => Promise.resolve()),
      translateToComment: spy(
        (_body: string, filePath: string): GithubComment => ({
          commit_id: "mock_sha",
          path: filePath,
          subject_type: "file",
          body: _body,
        }),
      ),
      // Add the new methods
      getAllCommentsForPullRequest: spy(async () => {
        return [
          {
            id: 1,
            body: "<!--flow-lens-hidden-comment--> Old comment",
          },
          {
            id: 2,
            body: "Regular comment",
          },
        ];
      }),
      deleteReviewComment: spy(async (_commentId: number) => Promise.resolve()),
    };

    // Set up environment variable for GITHUB_TOKEN
    const originalEnvGet = Deno.env.get;
    try {
      // @ts-ignore: Mocking Deno.env.get for testing
      Deno.env.get = (key: string): string | undefined =>
        key === "GITHUB_TOKEN" ? "mock-token" : undefined;

      writer = new UmlWriter(
        FILE_PATH_TO_FLOW_DIFFERENCE,
        mockGithubClient as unknown as GithubClient,
      );
      await writer.writeUmlDiagrams(); // Make this await the async operation

      // Verify that getAllCommentsForPullRequest was called
      assertSpyCalls(mockGithubClient.getAllCommentsForPullRequest, 1);

      // Verify that deleteReviewComment was called for the Flow Lens comment
      assertSpyCalls(mockGithubClient.deleteReviewComment, 1);
      assertEquals(mockGithubClient.deleteReviewComment.calls[0].args[0], 1);

      // Verify that the methods were called the expected number of times
      assertSpyCalls(
        mockGithubClient.translateToComment,
        FILE_PATH_TO_FLOW_DIFFERENCE.size,
      );
      assertSpyCalls(
        mockGithubClient.writeComment,
        FILE_PATH_TO_FLOW_DIFFERENCE.size,
      );

      // Verify the content of the calls
      for (let i = 0; i < FILE_PATH_TO_FLOW_DIFFERENCE.size; i++) {
        // Check that translateToComment was called with the right file path
        const translateCall = mockGithubClient.translateToComment.calls[i];
        const filePath = translateCall.args[1];

        // Check that writeComment was called with a comment that has the right path
        const writeCall = mockGithubClient.writeComment.calls[i];
        const comment = writeCall.args[0];

        assertEquals(comment.path, filePath);
      }
    } finally {
      // Restore original env.get
      Deno.env.get = originalEnvGet;
    }
  });

  await t.step("should write UML diagrams as markdown files", async () => {
    // Mock the Configuration.getInstance to return our test config
    const originalGetInstance = Configuration.getInstance;
    const testConfig = getRuntimeConfig(DiagramTool.MERMAID, Mode.MARKDOWN);

    Configuration.getInstance = () => testConfig;

    try {
      writer = new UmlWriter(FILE_PATH_TO_FLOW_DIFFERENCE);

      writer.writeUmlDiagrams();

      // Check that markdown files were created
      const expectedFile1Path = join(TEST_UNDECLARED_OUTPUTS_DIR, "file1.md");
      const expectedFile2Path = join(TEST_UNDECLARED_OUTPUTS_DIR, "file2.md");

      assertExists(existsSync(expectedFile1Path));
      assertExists(existsSync(expectedFile2Path));

      // Check the content of the first file (no old version)
      fileContent = Deno.readTextFileSync(expectedFile1Path);
      assertEquals(fileContent, `\`\`\`mermaid${EOL}uml1${EOL}\`\`\`${EOL}`);

      // Check the content of the second file (with old version)
      fileContent = Deno.readTextFileSync(expectedFile2Path);
      assertEquals(
        fileContent,
        `## Old Version${EOL}${EOL}\`\`\`mermaid${EOL}uml1${EOL}\`\`\`${EOL}${EOL}## New Version${EOL}${EOL}\`\`\`mermaid${EOL}uml2${EOL}\`\`\`${EOL}`,
      );

      // Clean up
      await Deno.remove(expectedFile1Path);
      await Deno.remove(expectedFile2Path);
    } finally {
      // Restore original Configuration.getInstance
      Configuration.getInstance = originalGetInstance;
    }
  });
});
