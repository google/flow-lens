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

import { Octokit } from "@octokit/core";
import { context as githubContext } from "@actions/github";

export const ERROR_MESSAGES = {
  NOT_PR_CONTEXT: "Not running in a pull request context",
  MISSING_PR_NUMBER: "Cannot write comment: Pull request number is missing",
  MISSING_PR_SHA: "Cannot write comment: Pull request head SHA is missing",
  FETCH_COMMENTS_FAILED: (error: string) =>
    `Failed to fetch pull request review comments: ${error}`,
};

export type GithubComment = {
  commit_id: string;
  path: string;
  subject_type: "file";
  body: string;
};

/**
 * Represents a review comment on a pull request.
 * @see https://docs.github.com/en/rest/pulls/comments
 */
export interface PullRequestReviewComment {
  url: string;
  pull_request_review_id: number;
  id: number;
  node_id: string;
  diff_hunk: string;
  path: string;
  position: number;
  original_position: number;
  commit_id: string;
  original_commit_id: string;
  in_reply_to_id?: number;
  user: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    type: string;
    site_admin: boolean;
  };
  body: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  pull_request_url: string;
  author_association: string;
  _links: {
    self: { href: string };
    html: { href: string };
    pull_request: { href: string };
  };
  start_line?: number;
  original_start_line?: number;
  start_side?: string;
  line?: number;
  original_line?: number;
  side?: string;
}

export class GithubClient {
  private readonly octokit: Octokit;
  private readonly context: typeof githubContext;

  constructor(githubToken: string, context = githubContext) {
    this.octokit = new Octokit({ auth: githubToken });
    this.context = context;
  }

  async writeComment(comment: GithubComment) {
    if (!this.context.payload.pull_request) {
      throw new Error(ERROR_MESSAGES.NOT_PR_CONTEXT);
    }

    const pullRequestNumber = this.context.payload.pull_request.number;
    if (!pullRequestNumber) {
      throw new Error(ERROR_MESSAGES.MISSING_PR_NUMBER);
    }

    const endpoint = `POST /repos/${this.context.repo.owner}/${this.context.repo.repo}/pulls/${pullRequestNumber}/comments`;
    await this.octokit.request(endpoint, comment);
  }

  translateToComment(body: string, filePath: string): GithubComment {
    if (!this.context.payload.pull_request) {
      throw new Error(ERROR_MESSAGES.NOT_PR_CONTEXT);
    }
    const sha = this.context.payload.pull_request.head.sha;
    if (!sha) {
      throw new Error(ERROR_MESSAGES.MISSING_PR_SHA);
    }
    return {
      commit_id: sha,
      path: filePath,
      subject_type: "file",
      body: body,
    };
  }

  /**
   * Retrieves all review comments for the current pull request.
   * These are comments made on specific lines of code in the pull request.
   *
   * @throws Error if not running in a pull request context
   * @returns Array of pull request review comments
   */
  async getAllCommentsForPullRequest(): Promise<
    Array<PullRequestReviewComment>
  > {
    const prNumber = this.context.payload.pull_request?.number;
    if (!prNumber) {
      throw new Error(ERROR_MESSAGES.NOT_PR_CONTEXT);
    }

    const owner = this.context.repo.owner;
    const repo = this.context.repo.repo;

    try {
      const response = await this.octokit.request(
        `GET /repos/${owner}/${repo}/pulls/${prNumber}/comments`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        ERROR_MESSAGES.FETCH_COMMENTS_FAILED(
          error instanceof Error ? error.message : "Unknown error"
        )
      );
    }
  }
}
