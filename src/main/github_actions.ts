import { Octokit } from "npm:@octokit/core";
import { context } from "npm:@actions/github";
import { FlowDifference } from "./flow_to_uml_transformer";

const HIDDEN_COMMENT_PREFIX = "<!--flow-lens-hidden-comment-->";
const MERMAID_OPEN_TAG = "```mermaid";
const MERMAID_CLOSE_TAG = "```";

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
    const endpoint = `GET /repos/${context.repo.owner}/${context.repo.repo}/pulls/${context.payload.pull_request.number}/comments`;
    console.log({ endpoint });
    const comments = await this.octokit.request(endpoint);
    return comments.data;
  }

  async writeComment(comment: GithubComment) {
    const endpoint = `POST /repos/${context.repo.owner}/${context.repo.repo}/pulls/${context.payload.pull_request.number}/comments`;
    await this.octokit.request(endpoint, comment);
  }

  translateToComment(
    flowDifference: FlowDifference,
    filePath: string
  ): GithubComment {
    return {
      commit_id: context.payload.pull_request.head.sha,
      path: filePath,
      start_line: 1,
      start_side: "RIGHT",
      side: "RIGHT",
      line: 1,
      body: this.getBody(flowDifference),
    };
  }

  private getBody(flowDifference: FlowDifference) {
    const oldDiagram = flowDifference.old
      ? `Previous:
    ${MERMAID_OPEN_TAG}
    ${flowDifference.old}
    ${MERMAID_CLOSE_TAG}
    `
      : "";
    const newDiagram = `Current:
    ${MERMAID_OPEN_TAG}
    ${flowDifference.new}
    ${MERMAID_CLOSE_TAG}
    `;
    return `${oldDiagram}${newDiagram}`;
  }
}
