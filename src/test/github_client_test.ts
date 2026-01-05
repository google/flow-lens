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

import { GithubClient, type GithubComment } from "../main/github_client.ts";
import { assertEquals, assertRejects } from "@std/assert";
import { ERROR_MESSAGES } from "../main/github_client.ts";

// Mock Octokit
class MockOctokit {
  async request(endpoint: string, data?: unknown) {
    // Mock response for review comments endpoint
    if (endpoint.includes("/pulls/") && endpoint.includes("/comments")) {
      return {
        data: [
          {
            url:
              "https://api.github.com/repos/mock-owner/mock-repo/pulls/comments/1",
            pull_request_review_id: 42,
            id: 1,
            node_id: "mock-node-id",
            diff_hunk: "@@ -16,33 +16,40 @@ public class Test",
            path: "test/file.ts",
            position: 1,
            original_position: 1,
            commit_id: "mock-commit-id",
            original_commit_id: "mock-original-commit-id",
            user: {
              login: "mock-user",
              id: 1,
              node_id: "mock-user-node-id",
              avatar_url: "https://mock-avatar.com",
              gravatar_id: "",
              url: "https://api.github.com/users/mock-user",
              html_url: "https://github.com/mock-user",
              type: "User",
              site_admin: false,
            },
            body: "Test review comment",
            created_at: "2024-03-18T00:00:00Z",
            updated_at: "2024-03-18T00:00:00Z",
            html_url:
              "https://github.com/mock-owner/mock-repo/pull/42#discussion-1",
            pull_request_url:
              "https://api.github.com/repos/mock-owner/mock-repo/pulls/42",
            author_association: "CONTRIBUTOR",
            _links: {
              self: {
                href:
                  "https://api.github.com/repos/mock-owner/mock-repo/pulls/comments/1",
              },
              html: {
                href:
                  "https://github.com/mock-owner/mock-repo/pull/42#discussion-1",
              },
              pull_request: {
                href:
                  "https://api.github.com/repos/mock-owner/mock-repo/pulls/42",
              },
            },
          },
        ],
      };
    }
    // For other endpoints, return the original mock response
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
  runAttempt: 1,
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
  runAttempt: 1,
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

Deno.test("GithubClient", async (t) => {
  // Write Comment Tests
  await t.step("writeComment", async (t) => {
    await t.step("should call Octokit with correct parameters", async () => {
      const mockOctokit = new MockOctokit();
      const githubClient = new GithubClient("fake-token", mockContext) as any;
      githubClient.octokit = mockOctokit;

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
    });

    await t.step("should throw an error if not in a PR context", async () => {
      const mockOctokit = new MockOctokit();
      const githubClient = new GithubClient(
        "fake-token",
        invalidContext,
      ) as any;
      githubClient.octokit = mockOctokit;

      const comment: GithubComment = {
        commit_id: "mock-commit",
        path: "src/index.ts",
        subject_type: "file",
        body: "This is a test comment",
      };

      await assertRejects(
        () => githubClient.writeComment(comment),
        Error,
        ERROR_MESSAGES.NOT_PR_CONTEXT,
      );
    });
  });

  // Translate Comment Tests
  await t.step("translateToComment", async (t) => {
    await t.step("should create a properly formatted comment", () => {
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
    });
  });

  // Get All Comments Tests
  await t.step("getAllCommentsForPullRequest", async (t) => {
    await t.step(
      "should return review comments when in PR context",
      async () => {
        const mockOctokit = new MockOctokit();
        const githubClient = new GithubClient("fake-token", mockContext) as any;
        githubClient.octokit = mockOctokit;

        const comments = await githubClient.getAllCommentsForPullRequest();

        assertEquals(comments.length, 1);
        assertEquals(comments[0].id, 1);
        assertEquals(comments[0].body, "Test review comment");
        assertEquals(comments[0].path, "test/file.ts");
        assertEquals(comments[0].pull_request_review_id, 42);
      },
    );

    await t.step("should throw error when not in PR context", async () => {
      const mockOctokit = new MockOctokit();
      const githubClient = new GithubClient(
        "fake-token",
        invalidContext,
      ) as any;
      githubClient.octokit = mockOctokit;

      await assertRejects(
        () => githubClient.getAllCommentsForPullRequest(),
        Error,
        ERROR_MESSAGES.NOT_PR_CONTEXT,
      );
    });

    await t.step("should handle API errors", async () => {
      const mockOctokit = new MockOctokit();
      const githubClient = new GithubClient("fake-token", mockContext) as any;

      mockOctokit.request = async () => {
        throw new Error("API error");
      };

      githubClient.octokit = mockOctokit;

      await assertRejects(
        () => githubClient.getAllCommentsForPullRequest(),
        Error,
        ERROR_MESSAGES.FETCH_COMMENTS_FAILED("API error"),
      );
    });
  });

  // Delete Review Comment Tests
  await t.step("deleteReviewComment", async (t) => {
    await t.step("should successfully delete a review comment", async () => {
      const mockOctokit = new MockOctokit();
      const githubClient = new GithubClient("fake-token", mockContext) as any;
      githubClient.octokit = mockOctokit;

      let errorCaught = false;
      try {
        await githubClient.deleteReviewComment(123);
      } catch (error) {
        console.error("Unexpected error:", error);
        errorCaught = true;
      }

      assertEquals(errorCaught, false);
    });

    await t.step("should throw error when not in PR context", async () => {
      const mockOctokit = new MockOctokit();
      const githubClient = new GithubClient(
        "fake-token",
        invalidContext,
      ) as any;
      githubClient.octokit = mockOctokit;

      await assertRejects(
        () => githubClient.deleteReviewComment(123),
        Error,
        ERROR_MESSAGES.NOT_PR_CONTEXT,
      );
    });

    await t.step("should handle API errors", async () => {
      const mockOctokit = new MockOctokit();
      const githubClient = new GithubClient("fake-token", mockContext) as any;

      mockOctokit.request = async () => {
        throw new Error("API error");
      };

      githubClient.octokit = mockOctokit;

      await assertRejects(
        () => githubClient.deleteReviewComment(123),
        Error,
        ERROR_MESSAGES.DELETE_COMMENT_FAILED(123, "API error"),
      );
    });
  });
});
