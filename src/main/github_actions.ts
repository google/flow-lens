import { Octokit } from "npm:@octokit/core";
import { context } from "npm:@actions/github";

const HIDDEN_COMMENT_PREFIX = "<!--flow-lens-hidden-comment-->";

export type GithubComment = {
  commit_id: string;
  path: string;
  start_line: number;
  start_side: "RIGHT";
  side: "RIGHT";
  line: number;
  body: string;
  url?: string;
};
export class GithubActions {
  private readonly octokit: Octokit;

  constructor(githubToken: string) {
    this.octokit = new Octokit({ auth: githubToken });
  }

  async getComments() {
    const endpoint = `GET /repos/${context.repo.owner}/${context.repo.repo}/pulls/${context.payload.pull_request.number}`;
    console.log({ endpoint });
    const comments = await this.octokit.request(endpoint);
    return comments.data;
  }
}
