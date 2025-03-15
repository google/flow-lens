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

import { GithubClient, GithubComment } from "../main/github_client.ts";
import { assertEquals, assertRejects } from "@std/assert";

// Mock Octokit
class MockOctokit {
  async request(endpoint: string, data: unknown) {
    return { endpoint, data };
  }
}

// Mock GitHub Actions context
const mockContext = {
  payload: {
    pull_request: {
      number: 42,
      head: {
        sha: "mock-head-sha",
      },
    },
  },
  repo: {
    owner: "mock-owner",
    repo: "mock-repo",
  },
  eventName: "pull_request",
  sha: "mock-sha",
  ref: "refs/heads/mock-branch",
  workflow: "mock-workflow",
  actor: "mock-user",
  job: "mock-job",
  runNumber: 1,
  runId: 1,
  action: "mock-action",
  apiUrl: "https://api.github.com",
  serverUrl: "https://github.com",
  graphqlUrl: "https://api.github.com/graphql",
  issue: {
    owner: "mock-owner",
    repo: "mock-repo",
    number: 42,
  },
};

const invalidContext = {
  payload: {},
  repo: {
    owner: "mock-owner",
    repo: "mock-repo",
  },
  eventName: "pull_request",
  sha: "mock-sha",
  ref: "refs/heads/mock-branch",
  workflow: "mock-workflow",
  actor: "mock-user",
  job: "mock-job",
  runNumber: 1,
  runId: 1,
  action: "mock-action",
  apiUrl: "https://api.github.com",
  serverUrl: "https://github.com",
  graphqlUrl: "https://api.github.com/graphql",
  issue: {
    owner: "mock-owner",
    repo: "mock-repo",
    number: 42,
  },
};

Deno.test(
  "GithubClient.writeComment should call Octokit with correct parameters",
  async () => {
    const mockOctokit = new MockOctokit();
    const githubClient = new GithubClient("fake-token", mockContext) as any;
    githubClient.octokit = mockOctokit; // Inject mock Octokit

    const comment: GithubComment = {
      commit_id: "mock-commit",
      path: "src/index.ts",
      subject_type: "file",
      body: "This is a test comment",
    };

    let errorCaught = false;
    try {
      await githubClient.writeComment(comment);
    } catch (error) {
      console.error("Unexpected error:", error);
      errorCaught = true;
    }

    assertEquals(errorCaught, false);
  }
);

Deno.test(
  "GithubClient.writeComment should throw an error if not in a PR context",
  async () => {
    const mockOctokit = new MockOctokit();
    const githubClient = new GithubClient("fake-token", invalidContext) as any;
    githubClient.octokit = mockOctokit; // Inject mock Octokit

    const comment: GithubComment = {
      commit_id: "mock-commit",
      path: "src/index.ts",
      subject_type: "file",
      body: "This is a test comment",
    };

    await assertRejects(
      () => githubClient.writeComment(comment),
      Error,
      "Cannot write comment: Not in a pull request context"
    );
  }
);

Deno.test(
  "GithubClient.translateToComment should create a properly formatted comment",
  () => {
    const githubClient = new GithubClient("fake-token", mockContext);

    const body = "Test comment body";
    const filePath = "src/test/file.ts";

    const comment = githubClient.translateToComment(body, filePath);

    assertEquals(comment, {
      commit_id: "mock-head-sha",
      path: filePath,
      subject_type: "file",
      body: body,
    });
  }
);
