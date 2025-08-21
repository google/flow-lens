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

/**
 * @fileoverview This file contains the UmlWriter class which is used to write
 * the generated UML diagrams to a file.
 */
import { join } from "@std/path";
import { Configuration, Mode, RuntimeConfig } from "./argument_processor.ts";
import { FlowDifference } from "./flow_to_uml_transformer.ts";
import { GithubClient } from "./github_client.ts";

const EOL = Deno.build.os === "windows" ? "\r\n" : "\n";

const FILE_EXTENSION = ".json";
const HIDDEN_COMMENT_PREFIX = "<!--flow-lens-hidden-comment-->";
const MERMAID_OPEN_TAG = "```mermaid";
const MERMAID_CLOSE_TAG = "```";

const getGithubCommentSummary = (version: "old" | "new"): string => {
  return `<summary>Click here to view a preview of the ${version} version of this flow</summary>`;
};

/**
 * This class is used to write the generated UML diagrams to a file.
 */
export class UmlWriter {
  constructor(
    private readonly filePathToFlowDifference: Map<string, FlowDifference>,
    private readonly githubClient = new GithubClient(
      Deno.env.get("GITHUB_TOKEN") || "",
    ),
  ) {}

  /**
   * Writes the UML diagrams to a file.
   */
  async writeUmlDiagrams() {
    const config = Configuration.getInstance();

    if (config.mode === Mode.JSON) {
      this.writeJsonFile(config);
    } else if (config.mode === Mode.GITHUB_ACTION) {
      await this.writeGithubComment(config);
    } else if (config.mode === Mode.MARKDOWN) {
      this.writeMarkdownFiles(config);
    }
  }

  private writeJsonFile(config: RuntimeConfig) {
    const outputPath = join(
      config.outputDirectory!,
      `${config.outputFileName}${FILE_EXTENSION}`,
    );
    const formattedDifferences = getFormatter().format(
      this.filePathToFlowDifference,
    );
    Deno.writeTextFileSync(
      outputPath,
      JSON.stringify(formattedDifferences, null, 2),
    );
  }

  private async writeGithubComment(config: RuntimeConfig) {
    try {
      const existingComments = await this.githubClient
        .getAllCommentsForPullRequest();

      const flowLensComments = existingComments.filter((comment) =>
        comment.body.includes(HIDDEN_COMMENT_PREFIX)
      );

      for (const comment of flowLensComments) {
        await this.githubClient.deleteReviewComment(comment.id);
      }

      for (const [filePath, flowDifference] of this.filePathToFlowDifference) {
        const comment = this.githubClient.translateToComment(
          getBody(flowDifference),
          filePath,
        );
        await this.githubClient.writeComment(comment);
      }
    } catch (error) {
      console.error("Failed to update GitHub comments:", error);
      throw error;
    }
  }

  private writeMarkdownFiles(config: RuntimeConfig) {
    for (const [filePath, flowDifference] of this.filePathToFlowDifference) {
      const flowApiName = this.extractFlowApiName(filePath);

      const outputPath = join(
        config.outputDirectory!,
        `${flowApiName}.md`,
      );

      let markdownContent = "";
      const tripleBackticks = "```";

      if (flowDifference.old) {
        markdownContent +=
          `## Old Version${EOL}${EOL}${tripleBackticks}mermaid${EOL}${flowDifference.old}${EOL}${tripleBackticks}${EOL}${EOL}`;
        markdownContent +=
          `## New Version${EOL}${EOL}${tripleBackticks}mermaid${EOL}${flowDifference.new}${EOL}${tripleBackticks}${EOL}`;
      } else {
        markdownContent +=
          `${tripleBackticks}mermaid${EOL}${flowDifference.new}${EOL}${tripleBackticks}${EOL}`;
      }

      Deno.writeTextFileSync(outputPath, markdownContent);
    }
  }

  private extractFlowApiName(filePath: string): string {
    // Extract the flow API name from the file path
    // The file path should contain the flow API name
    const fileName = filePath.split("/").pop() || "";
    // Remove common flow file extensions
    const flowApiName = fileName
      .replace(/\.flow-meta\.xml$/, "")
      .replace(/\.flow$/, "")
      .replace(/\.xml$/, "");
    return flowApiName || "flow";
  }
}

interface DefaultFormat {
  path: string;
  difference: FlowDifference;
}

interface Formatter {
  format(
    filePathToFlowDifference: Map<string, FlowDifference>,
  ): DefaultFormat[];
}

class DefaultFormatter implements Formatter {
  /**
   * Formats the UML diagrams into a default format.
   * @param filePathToFlowDifference A map of file paths to UML diagrams.
   */
  format(
    filePathToFlowDifference: Map<string, FlowDifference>,
  ): DefaultFormat[] {
    const result: DefaultFormat[] = [];
    for (const [filePath, flowDifference] of filePathToFlowDifference) {
      result.push({
        path: filePath,
        difference: flowDifference,
      });
    }
    return result;
  }
}

function getFormatter(): Formatter {
  return new DefaultFormatter();
}

function getBody(flowDifference: FlowDifference) {
  const oldDiagram = flowDifference.old
    ? `<details>
${getGithubCommentSummary("old")}

${MERMAID_OPEN_TAG}
${flowDifference.old}
${MERMAID_CLOSE_TAG}
</details>

`
    : "";

  const newDiagram = `<details>
${getGithubCommentSummary("new")}

${MERMAID_OPEN_TAG}
${flowDifference.new}
${MERMAID_CLOSE_TAG}
</details>`;

  return `${HIDDEN_COMMENT_PREFIX}
${oldDiagram}${newDiagram}`;
}
