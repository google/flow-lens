import { it, expect, describe, beforeEach } from "jasmine";

import {
  ArgumentProcessor,
  DiagramTool,
  ERROR_MESSAGES,
  GenerationType,
  RuntimeConfig,
} from "./argument_processor.ts";

/**
 * The test configuration object that is used by the ArgumentProcessor tests.
 */
export function getTestConfig(): RuntimeConfig {
  return {
    diagramTool: DiagramTool.PLANTUML,
    filePath: [],
    generationType: GenerationType.UML_DIAGRAM,
    gitDiffFromHash: "HEAD~",
    gitDiffToHash: "HEAD",
    outputDirectory: "/",
    outputFileName: "test",
    placerPath: "/",
    dotExecutablePath: "echo",
  };
}

const INVALID_DIAGRAM_TOOL = "unsupported";
const INVALID_FILE_PATH = "invalid/file/path/which/does/not/exist";
const INVALID_GENERATION_TYPE = "unsupported";
const INVALID_OUTPUT_FILE_NAME = "unsupported.file.name";
const INVALID_OUTPUT_DIRECTORY = "invalid/directory/path";

describe("ArgumentProcessor", () => {
  let argumentProcessor: ArgumentProcessor;
  let result: RuntimeConfig;
  let caught: Error | undefined;
  let testConfiguration: RuntimeConfig;

  beforeEach(() => {
    testConfiguration = getTestConfig();
  });

  it("should validate when it has the proper configuration", () => {
    argumentProcessor = new ArgumentProcessor(testConfiguration);

    result = argumentProcessor.getConfig();

    expect(result).toEqual(testConfiguration);
  });

  it("should throw an exception when the diagram tool is not supported", () => {
    testConfiguration.diagramTool = INVALID_DIAGRAM_TOOL as DiagramTool;
    argumentProcessor = new ArgumentProcessor(testConfiguration);

    try {
      result = argumentProcessor.getConfig();
    } catch (error: unknown) {
      caught = error as Error;
    }

    expect(caught).toBeDefined();
    expect(caught?.message).toContain(
      ERROR_MESSAGES.unsupportedDiagramTool(INVALID_DIAGRAM_TOOL)
    );
  });

  it("should throw an exception when the file path is not valid", () => {
    testConfiguration.filePath = [INVALID_FILE_PATH];
    testConfiguration.gitDiffFromHash = undefined;
    testConfiguration.gitDiffToHash = undefined;
    argumentProcessor = new ArgumentProcessor(testConfiguration);

    try {
      result = argumentProcessor.getConfig();
    } catch (error: unknown) {
      caught = error as Error;
    }

    expect(caught).toBeDefined();
    expect(caught?.message).toContain(
      ERROR_MESSAGES.filePathDoesNotExist(INVALID_FILE_PATH)
    );
  });

  it("should throw an exception when the generation type is not supported", () => {
    testConfiguration.generationType =
      INVALID_GENERATION_TYPE as GenerationType;
    argumentProcessor = new ArgumentProcessor(testConfiguration);

    try {
      result = argumentProcessor.getConfig();
    } catch (error: unknown) {
      caught = error as Error;
    }

    expect(caught).toBeDefined();
    expect(caught?.message).toContain(
      ERROR_MESSAGES.unsupportedGenerationType(INVALID_GENERATION_TYPE)
    );
  });

  it("should throw an exception when the output file name is not populated", () => {
    testConfiguration.outputFileName = "";
    argumentProcessor = new ArgumentProcessor(testConfiguration);

    try {
      result = argumentProcessor.getConfig();
    } catch (error: unknown) {
      caught = error as Error;
    }

    expect(caught).toBeDefined();
    expect(caught?.message).toContain(ERROR_MESSAGES.outputFileNameRequired);
  });

  it("should throw an exception when the output file name is not supported", () => {
    testConfiguration.outputFileName = INVALID_OUTPUT_FILE_NAME;
    argumentProcessor = new ArgumentProcessor(testConfiguration);

    try {
      result = argumentProcessor.getConfig();
    } catch (error: unknown) {
      caught = error as Error;
    }

    expect(caught).toBeDefined();
    expect(caught?.message).toContain(
      ERROR_MESSAGES.invalidOutputFileName(INVALID_OUTPUT_FILE_NAME)
    );
  });

  it("should throw an exception when the output directory is not valid", () => {
    testConfiguration.outputDirectory = INVALID_OUTPUT_DIRECTORY;
    argumentProcessor = new ArgumentProcessor(testConfiguration);

    try {
      result = argumentProcessor.getConfig();
    } catch (error: unknown) {
      caught = error as Error;
    }

    expect(caught).toBeDefined();
    expect(caught?.message).toContain(
      ERROR_MESSAGES.invalidOutputDirectory(INVALID_OUTPUT_DIRECTORY)
    );
  });

  it("should throw an exception when the output directory is not specified", () => {
    testConfiguration.outputDirectory = "";
    argumentProcessor = new ArgumentProcessor(testConfiguration);

    try {
      result = argumentProcessor.getConfig();
    } catch (error: unknown) {
      caught = error as Error;
    }

    expect(caught).toBeDefined();
    expect(caught?.message).toContain(ERROR_MESSAGES.outputDirectoryRequired);
  });

  it("should throw an exception when either the filePath or (gitDiffFromHash and gitDiffToHash) are not specified", () => {
    testConfiguration.gitDiffToHash = undefined;
    testConfiguration.gitDiffFromHash = undefined;
    argumentProcessor = new ArgumentProcessor(testConfiguration);

    try {
      result = argumentProcessor.getConfig();
    } catch (error: unknown) {
      caught = error as Error;
    }

    expect(caught).toBeDefined();
    expect(caught?.message).toContain(
      ERROR_MESSAGES.filePathOrGitDiffFromAndToHashRequired
    );
  });

  it("should throw an exception when either the filePath and gitDiffFromHash and gitDiffToHash are specified", () => {
    testConfiguration.filePath = [INVALID_FILE_PATH];
    argumentProcessor = new ArgumentProcessor(testConfiguration);

    try {
      result = argumentProcessor.getConfig();
    } catch (error: unknown) {
      caught = error as Error;
    }

    expect(caught).toBeDefined();
    expect(caught?.message).toContain(
      ERROR_MESSAGES.filePathAndGitDiffFromAndToHashMutuallyExclusive
    );
  });

  it("should throw an exception when the `gitDiffFromHash` is specified but `gitDiffToHash` is not", () => {
    testConfiguration.gitDiffToHash = undefined;
    argumentProcessor = new ArgumentProcessor(testConfiguration);

    try {
      result = argumentProcessor.getConfig();
    } catch (error: unknown) {
      caught = error as Error;
    }

    expect(caught).toBeDefined();
    expect(caught?.message).toContain(
      ERROR_MESSAGES.gitDiffFromAndToHashMustBeSpecifiedTogether
    );
  });

  it("should throw an exception when the `gitDiffToHash` is specified but `gitDiffFromHash` is not", () => {
    testConfiguration.gitDiffFromHash = undefined;
    argumentProcessor = new ArgumentProcessor(testConfiguration);

    try {
      result = argumentProcessor.getConfig();
    } catch (error: unknown) {
      caught = error as Error;
    }

    expect(caught).toBeDefined();
    expect(caught?.message).toContain(
      ERROR_MESSAGES.gitDiffFromAndToHashMustBeSpecifiedTogether
    );
  });

  it("should throw an exception when the `placerPath` is not specified and the diagram tool is graphviz", () => {
    testConfiguration.placerPath = undefined;
    testConfiguration.diagramTool = DiagramTool.GRAPH_VIZ;
    argumentProcessor = new ArgumentProcessor(testConfiguration);

    try {
      result = argumentProcessor.getConfig();
    } catch (error: unknown) {
      caught = error as Error;
    }

    expect(caught).toBeDefined();
    expect(caught?.message).toContain(
      ERROR_MESSAGES.placerPathRequiredForGraphViz
    );
  });

  it("should throw an exception when the `dotExecutablePath` is not specified and the diagram tool is graphviz", () => {
    testConfiguration.dotExecutablePath = undefined;
    testConfiguration.diagramTool = DiagramTool.GRAPH_VIZ;
    argumentProcessor = new ArgumentProcessor(testConfiguration);

    try {
      result = argumentProcessor.getConfig();
    } catch (error: unknown) {
      caught = error as Error;
    }

    expect(caught).toBeDefined();
    expect(caught?.message).toContain(
      ERROR_MESSAGES.dotExecutablePathRequiredForGraphViz
    );
  });
});
