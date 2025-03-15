/**
 * Copyright 2025 Google LLC
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
 * @fileoverview This file contains the GithubClient class which is used to
 * write comments to a pull request.
 */

import { Octokit } from "npm:@octokit/core";
import { context as githubContext } from "npm:@actions/github";

export type GithubComment = {
  commit_id: string;
  path: string;
  subject_type: "file";
  body: string;
};

export class GithubClient {
  private readonly octokit: Octokit;
  private readonly context: typeof githubContext;

  constructor(githubToken: string, context = githubContext) {
    this.octokit = new Octokit({ auth: githubToken });
    this.context = context;
  }

  async writeComment(comment: GithubComment) {
    if (!this.context.payload.pull_request) {
      throw new Error("Cannot write comment: Not in a pull request context");
    }

    const pullRequestNumber = this.context.payload.pull_request.number;
    if (!pullRequestNumber) {
      throw new Error("Cannot write comment: Pull request number is missing");
    }

    const endpoint = `POST /repos/${this.context.repo.owner}/${this.context.repo.repo}/pulls/${pullRequestNumber}/comments`;
    await this.octokit.request(endpoint, comment);
  }

  translateToComment(body: string, filePath: string): GithubComment {
    if (!this.context.payload.pull_request) {
      throw new Error("Cannot write comment: Not in a pull request context");
    }
    const sha = this.context.payload.pull_request.head.sha;
    if (!sha) {
      throw new Error("Cannot write comment: Pull request head SHA is missing");
    }
    return {
      commit_id: sha,
      path: filePath,
      subject_type: "file",
      body: body,
    };
  }
}
