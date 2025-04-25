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

import { execSync } from "node:child_process";
import { Configuration } from "./argument_processor.ts";
import { Buffer } from "node:buffer";

const ADDED = "A";
const MODIFIED = "M";
const RENAMED = "R";
const COPIED = "C";
const SUPPORTED_DIFF_TYPES = [ADDED, MODIFIED, RENAMED, COPIED].join("");
const EOL = Deno.build.os === "windows" ? "\r\n" : "\n";

/** Git commands used by the FlowFileChangeDetector. */
const GIT_COMMANDS = {
  diff: (fromHash: string, toHash: string, repo: string | undefined) =>
    `git ${
      repo ? `-C ${repo}` : ""
    } diff --diff-filter=${SUPPORTED_DIFF_TYPES} --name-only ${fromHash} ${toHash}`,
  revParse: (repo: string | undefined) =>
    `git ${repo ? `-C ${repo}` : ""} rev-parse --is-inside-work-tree`,
  version: (repo: string | undefined) =>
    `git ${repo ? `-C ${repo}` : ""} --version`,
  getFileContent: (
    filePath: string,
    commitHash: string,
    repo: string | undefined,
  ) => `git ${repo ? `-C ${repo}` : ""} show ${commitHash}:${filePath}`,
};

/** The extension of flow files. */
export const FLOW_FILE_EXTENSION = ".flow-meta.xml";

/** Error messages used by the FlowFileChangeDetector. */
export const ERROR_MESSAGES = {
  diffError: (error: Error) => `Git diff command failed: ${error.message}`,
  gitIsNotInstalledError: "Git is not installed on this machine.",
  notInGitRepoError: "Not in a git repo.",
  unableToGetFileContent: (filePath: string, error: Error) =>
    `Unable to get file content for ${filePath}: ${error.message}`,
};

/**
 * Utility class to get the list of flow files that have been changed in a git
 * repo.
 */
// Retaining these private methods makes it easier to mock the git commands
// in the unit tests.
// tslint:disable:no-private-class-methods-without-this-ref
export class FlowFileChangeDetector {
  getFlowFiles(): string[] {
    this.validateGitIsInstalled();
    this.validateInCurrentGitRepo();
    const diff = this.getDiff();
    return this.getFlowFilesFromDiff(diff);
  }

  getFileContent(filePath: string, fromOrTo: "old" | "new"): string {
    let fileContent: Buffer;
    try {
      fileContent = this.executeGetFileContentCommand(
        filePath,
        fromOrTo === "old"
          ? (Configuration.getInstance().gitDiffFromHash as string)
          : (Configuration.getInstance().gitDiffToHash as string),
        Configuration.getInstance().gitRepo,
      );
    } catch (error: unknown) {
      throw new Error(
        ERROR_MESSAGES.unableToGetFileContent(filePath, error as Error),
      );
    }
    return fileContent.toString();
  }

  private validateGitIsInstalled() {
    try {
      this.executeVersionCommand();
    } catch (error: unknown) {
      throw new Error(ERROR_MESSAGES.gitIsNotInstalledError);
    }
  }

  private executeVersionCommand() {
    execSync(GIT_COMMANDS.version(Configuration.getInstance().gitRepo));
  }

  private validateInCurrentGitRepo() {
    try {
      this.executeRevParseCommand();
    } catch (error: unknown) {
      throw new Error(ERROR_MESSAGES.notInGitRepoError);
    }
  }

  private executeRevParseCommand() {
    execSync(GIT_COMMANDS.revParse(Configuration.getInstance().gitRepo));
  }

  private getDiff(): string {
    let diff: Buffer;
    try {
      diff = this.executeDiffCommand();
    } catch (error: unknown) {
      throw new Error(ERROR_MESSAGES.diffError(error as Error));
    }
    return diff.toString();
  }

  private executeDiffCommand() {
    return execSync(
      GIT_COMMANDS.diff(
        Configuration.getInstance().gitDiffFromHash!,
        Configuration.getInstance().gitDiffToHash!,
        Configuration.getInstance().gitRepo,
      ),
    );
  }

  private executeGetFileContentCommand(
    filePath: string,
    commitHash: string,
    repo: string | undefined,
  ) {
    return execSync(GIT_COMMANDS.getFileContent(filePath, commitHash, repo));
  }

  private getFlowFilesFromDiff(diff: string): string[] {
    return diff
      .split(EOL)
      .filter(
        (filePath) =>
          filePath && filePath.toLowerCase().endsWith(FLOW_FILE_EXTENSION),
      );
  }
}
