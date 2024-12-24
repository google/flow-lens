import { it, expect, describe, beforeEach, spyOn } from "jasmine";
import { Buffer } from "node:buffer";
import { Configuration } from "./argument_processor.ts";
import { getTestConfig } from "./argument_processor_test.ts";
import {
  ERROR_MESSAGES,
  FLOW_FILE_EXTENSION,
  FlowFileChangeDetector,
} from "./flow_file_change_detector.ts";

const EOL = Deno.build.os === "windows" ? "\r\n" : "\n";
const FLOW_FILE_PATH = "file2" + FLOW_FILE_EXTENSION;

describe("FlowFileChangeDetector", () => {
  let detector: FlowFileChangeDetector;

  beforeEach(() => {
    spyOn(Configuration, "getInstance").and.returnValue(getTestConfig());
    detector = new FlowFileChangeDetector();
    // Mock the private methods which execute git commands using spyOn
    // tslint:disable:no-any
    spyOn(detector as any, "executeVersionCommand").and.returnValue(undefined);
    spyOn(detector as any, "executeRevParseCommand").and.returnValue(undefined);
    spyOn(detector as any, "executeDiffCommand").and.returnValue(
      Buffer.from(["file1.txt", FLOW_FILE_PATH, "file3.js"].join(EOL))
    );
    spyOn(detector as any, "executeGetFileContentCommand").and.returnValue(
      Buffer.from("file content")
    );
    // tslint:enable:no-any
  });

  it("should get flow files when git is installed and in a repo", () => {
    const flowFiles = detector.getFlowFiles();

    expect(flowFiles).toEqual([FLOW_FILE_PATH]);
  });

  it("should throw error if git is not installed", () => {
    // tslint:disable-next-line:no-any
    (detector as any).executeVersionCommand.and.callThrough();

    expect(() => detector.getFlowFiles()).toThrowError(
      ERROR_MESSAGES.gitIsNotInstalledError
    );
  });

  it("should throw error if not in a git repo", () => {
    // tslint:disable-next-line:no-any
    (detector as any).executeRevParseCommand.and.callThrough();

    expect(() => detector.getFlowFiles()).toThrowError(
      ERROR_MESSAGES.notInGitRepoError
    );
  });

  it("should throw error if git diff fails", () => {
    // tslint:disable-next-line:no-any
    (detector as any).executeDiffCommand.and.throwError("Diff error");

    expect(() => detector.getFlowFiles()).toThrowError(
      ERROR_MESSAGES.diffError(new Error("Diff error"))
    );
  });

  it("should get file content from old version", () => {
    const fileContent = detector.getFileContent(FLOW_FILE_PATH, "old");

    expect(fileContent).toEqual("file content");
  });

  it("should get file content from new version", () => {
    const fileContent = detector.getFileContent(FLOW_FILE_PATH, "new");

    expect(fileContent).toEqual("file content");
  });

  it("should throw error if unable to get file content", () => {
    // tslint:disable-next-line:no-any
    (detector as any).executeGetFileContentCommand.and.throwError(
      "Get file content error"
    );

    expect(() => detector.getFileContent(FLOW_FILE_PATH, "old")).toThrowError(
      ERROR_MESSAGES.unableToGetFileContent(
        FLOW_FILE_PATH,
        new Error("Get file content error")
      )
    );
  });
});
