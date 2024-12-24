import {
  ArgumentProcessor,
  DiagramTool,
  ERROR_MESSAGES,
  GenerationType,
  RuntimeConfig,
} from "./argument_processor.ts";
import { assertEquals, assertThrows } from "@std/assert";

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

function setupTest(
  configModifications: (config: RuntimeConfig) => void = () => {}
) {
  let testConfiguration = getTestConfig();
  configModifications(testConfiguration);
  return {
    argumentProcessor: new ArgumentProcessor(testConfiguration),
    config: testConfiguration,
  };
}

Deno.test(
  "ArgumentProcessor should validate when it has the proper configuration",
  () => {
    const { argumentProcessor, config } = setupTest();
    const result = argumentProcessor.getConfig();
    assertEquals(result, config);
  }
);

Deno.test(
  "ArgumentProcessor should throw an exception when the diagram tool is not supported",
  () => {
    assertThrows(
      () => {
        const { argumentProcessor } = setupTest(
          (config) => (config.diagramTool = INVALID_DIAGRAM_TOOL as DiagramTool)
        );
        argumentProcessor.getConfig();
      },
      Error,
      ERROR_MESSAGES.unsupportedDiagramTool(INVALID_DIAGRAM_TOOL)
    );
  }
);

Deno.test(
  "ArgumentProcessor should throw an exception when the file path is not valid",
  () => {
    assertThrows(
      () => {
        const { argumentProcessor } = setupTest((config) => {
          config.filePath = [INVALID_FILE_PATH];
          config.gitDiffFromHash = undefined;
          config.gitDiffToHash = undefined;
        });
        argumentProcessor.getConfig();
      },
      Error,
      ERROR_MESSAGES.filePathDoesNotExist(INVALID_FILE_PATH)
    );
  }
);

Deno.test(
  "ArgumentProcessor should throw an exception when the generation type is not supported",
  () => {
    assertThrows(
      () => {
        const { argumentProcessor } = setupTest(
          (config) =>
            (config.generationType = INVALID_GENERATION_TYPE as GenerationType)
        );
        argumentProcessor.getConfig();
      },
      Error,
      ERROR_MESSAGES.unsupportedGenerationType(INVALID_GENERATION_TYPE)
    );
  }
);

Deno.test(
  "ArgumentProcessor should throw an exception when the output file name is not populated",
  () => {
    assertThrows(
      () => {
        const { argumentProcessor } = setupTest(
          (config) => (config.outputFileName = "")
        );
        argumentProcessor.getConfig();
      },
      Error,
      ERROR_MESSAGES.outputFileNameRequired
    );
  }
);

Deno.test(
  "ArgumentProcessor should throw an exception when the output file name is not supported",
  () => {
    assertThrows(
      () => {
        const { argumentProcessor } = setupTest(
          (config) => (config.outputFileName = INVALID_OUTPUT_FILE_NAME)
        );
        argumentProcessor.getConfig();
      },
      Error,
      ERROR_MESSAGES.invalidOutputFileName(INVALID_OUTPUT_FILE_NAME)
    );
  }
);

Deno.test(
  "ArgumentProcessor should throw an exception when the output directory is not valid",
  () => {
    assertThrows(
      () => {
        const { argumentProcessor } = setupTest(
          (config) => (config.outputDirectory = INVALID_OUTPUT_DIRECTORY)
        );
        argumentProcessor.getConfig();
      },
      Error,
      ERROR_MESSAGES.invalidOutputDirectory(INVALID_OUTPUT_DIRECTORY)
    );
  }
);

Deno.test(
  "ArgumentProcessor should throw an exception when the output directory is not specified",
  () => {
    assertThrows(
      () => {
        const { argumentProcessor } = setupTest(
          (config) => (config.outputDirectory = "")
        );
        argumentProcessor.getConfig();
      },
      Error,
      ERROR_MESSAGES.outputDirectoryRequired
    );
  }
);

Deno.test(
  "ArgumentProcessor should throw an exception when either the filePath or (gitDiffFromHash and gitDiffToHash) are not specified",
  () => {
    assertThrows(
      () => {
        const { argumentProcessor } = setupTest((config) => {
          config.gitDiffToHash = undefined;
          config.gitDiffFromHash = undefined;
        });
        argumentProcessor.getConfig();
      },
      Error,
      ERROR_MESSAGES.filePathOrGitDiffFromAndToHashRequired
    );
  }
);

Deno.test(
  "ArgumentProcessor should throw an exception when either the filePath and gitDiffFromHash and gitDiffToHash are specified",
  () => {
    assertThrows(
      () => {
        const { argumentProcessor } = setupTest(
          (config) => (config.filePath = [INVALID_FILE_PATH])
        );
        argumentProcessor.getConfig();
      },
      Error,
      ERROR_MESSAGES.filePathAndGitDiffFromAndToHashMutuallyExclusive
    );
  }
);

Deno.test(
  "ArgumentProcessor should throw an exception when the `gitDiffFromHash` is specified but `gitDiffToHash` is not",
  () => {
    assertThrows(
      () => {
        const { argumentProcessor } = setupTest(
          (config) => (config.gitDiffToHash = undefined)
        );
        argumentProcessor.getConfig();
      },
      Error,
      ERROR_MESSAGES.gitDiffFromAndToHashMustBeSpecifiedTogether
    );
  }
);

Deno.test(
  "ArgumentProcessor should throw an exception when the `gitDiffToHash` is specified but `gitDiffFromHash` is not",
  () => {
    assertThrows(
      () => {
        const { argumentProcessor } = setupTest(
          (config) => (config.gitDiffFromHash = undefined)
        );
        argumentProcessor.getConfig();
      },
      Error,
      ERROR_MESSAGES.gitDiffFromAndToHashMustBeSpecifiedTogether
    );
  }
);

Deno.test(
  "ArgumentProcessor should throw an exception when the `placerPath` is not specified and the diagram tool is graphviz",
  () => {
    assertThrows(
      () => {
        const { argumentProcessor } = setupTest((config) => {
          config.placerPath = undefined;
          config.diagramTool = DiagramTool.GRAPH_VIZ;
        });
        argumentProcessor.getConfig();
      },
      Error,
      ERROR_MESSAGES.placerPathRequiredForGraphViz
    );
  }
);

Deno.test(
  "ArgumentProcessor should throw an exception when the `dotExecutablePath` is not specified and the diagram tool is graphviz",
  () => {
    assertThrows(
      () => {
        const { argumentProcessor } = setupTest((config) => {
          config.dotExecutablePath = undefined;
          config.diagramTool = DiagramTool.GRAPH_VIZ;
        });
        argumentProcessor.getConfig();
      },
      Error,
      ERROR_MESSAGES.dotExecutablePathRequiredForGraphViz
    );
  }
);
