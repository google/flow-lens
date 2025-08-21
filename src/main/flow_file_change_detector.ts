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
 * @fileoverview Utility class to get the list of flow files that have been
 * changed in a git repo.
 */

import { Configuration } from "./argument_processor.ts";

const ADDED = "A";
const MODIFIED = "M";
const RENAMED = "R";
const COPIED = "C";
const SUPPORTED_DIFF_TYPES = [ADDED, MODIFIED, RENAMED, COPIED].join("");
const EOL = Deno.build.os === "windows" ? "\r\n" : "\n";

/** The extension of flow files. */
export const FLOW_FILE_EXTENSION = ".flow-meta.xml";

/** Error messages used by the FlowFileChangeDetector. */
export const ERROR_MESSAGES = {
  diffError: (error: Error): string =>
    `Git diff command failed: ${error.message}`,
  gitIsNotInstalledError: "Git is not installed on this machine.",
  notInGitRepoError: "Not in a git repo.",
  unableToGetFileContent: (filePath: string, error: Error): string =>
    `Unable to get file content for ${filePath}: ${error.message}`,
};

/**
 * Utility class to get the list of flow files that have been changed in a git
 * repo.
 */
export class FlowFileChangeDetector {
  getFlowFiles(): string[] {
    this.validateGitIsInstalled();
    this.validateInCurrentGitRepo();
    const diff = this.getDiff();
    return this.getFlowFilesFromDiff(diff);
  }

  getFileContent(filePath: string, fromOrTo: "old" | "new"): string {
    let fileContent: Uint8Array;
    try {
      fileContent = this.executeGetFileContentCommand(
        filePath,
        fromOrTo === "old"
          ? (Configuration.getInstance().gitDiffFromHash as string)
          : (Configuration.getInstance().gitDiffToHash as string),
      );
    } catch (error: unknown) {
      throw new Error(
        ERROR_MESSAGES.unableToGetFileContent(filePath, error as Error),
      );
    }
    return new TextDecoder().decode(fileContent);
  }

  private executeGetFileContentCommand(
    filePath: string,
    commitHash: string,
  ): Uint8Array {
    return this.executeGitCommand(["show", `${commitHash}:${filePath}`]);
  }

  private validateGitIsInstalled(): void {
    try {
      this.executeVersionCommand();
    } catch (_error: unknown) {
      throw new Error(ERROR_MESSAGES.gitIsNotInstalledError);
    }
  }

  private executeVersionCommand(): void {
    this.executeGitCommand(["--version"]);
  }

  private validateInCurrentGitRepo(): void {
    try {
      this.executeRevParseCommand();
    } catch (_error: unknown) {
      throw new Error(ERROR_MESSAGES.notInGitRepoError);
    }
  }

  private executeRevParseCommand(): void {
    this.executeGitCommand(["rev-parse", "--is-inside-work-tree"]);
  }

  private getDiff(): string {
    let diff: Uint8Array;
    try {
      diff = this.executeDiffCommand();
    } catch (error: unknown) {
      throw new Error(ERROR_MESSAGES.diffError(error as Error));
    }
    return new TextDecoder().decode(diff);
  }

  private executeDiffCommand(): Uint8Array {
    return this.executeGitCommand([
      "diff",
      `--diff-filter=${SUPPORTED_DIFF_TYPES}`,
      "--name-only",
      Configuration.getInstance().gitDiffFromHash!,
      Configuration.getInstance().gitDiffToHash!,
    ]);
  }

  private getFlowFilesFromDiff(diff: string): string[] {
    return diff
      .split(EOL)
      .filter(
        (filePath) =>
          filePath && filePath.toLowerCase().endsWith(FLOW_FILE_EXTENSION),
      );
  }

  /**
   * Executes a git command and returns its output.
   * @param args - The arguments to pass to the git command
   * @returns The command output as Uint8Array
   */
  private executeGitCommand(args: string[]): Uint8Array {
    const repo = Configuration.getInstance().gitRepo;
    const commandArgs = repo ? ["-C", repo, ...args] : args;
    return new Deno.Command("git", { args: commandArgs }).outputSync().stdout;
  }
}
