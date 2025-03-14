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

import {
  ArgumentProcessor,
  DiagramTool,
  ERROR_MESSAGES,
  Mode,
  RuntimeConfig,
} from "../main/argument_processor.ts";
import { assertEquals, assertThrows } from "@std/assert";

/**
 * The test configuration object that is used by the ArgumentProcessor tests.
 */
export function getTestConfig(): RuntimeConfig {
  return {
    diagramTool: DiagramTool.PLANTUML,
    filePath: [],
    gitDiffFromHash: "HEAD~",
    gitDiffToHash: "HEAD",
    outputDirectory: "/",
    outputFileName: "test",
    mode: Mode.JSON,
  };
}

const INVALID_DIAGRAM_TOOL = "unsupported";
const INVALID_FILE_PATH = "invalid/file/path/which/does/not/exist";
const INVALID_OUTPUT_FILE_NAME = "unsupported.file.name";
const INVALID_OUTPUT_DIRECTORY = "invalid/directory/path";
const INVALID_MODE = "unsupported";

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
  "ArgumentProcessor should throw an exception when the mode is not supported",
  () => {
    assertThrows(
      () => {
        const { argumentProcessor } = setupTest(
          (config) => (config.mode = INVALID_MODE as Mode)
        );
        argumentProcessor.getConfig();
      },
      Error,
      ERROR_MESSAGES.unsupportedMode(INVALID_MODE)
    );
  }
);

Deno.test(
  "ArgumentProcessor should validate when mode is GITHUB_ACTION and outputDirectory/outputFileName are not provided",
  () => {
    const { argumentProcessor, config } = setupTest((config) => {
      config.mode = Mode.GITHUB_ACTION;
      config.outputDirectory = undefined;
      config.outputFileName = undefined;
    });
    const result = argumentProcessor.getConfig();
    assertEquals(result, config);
  }
);

Deno.test(
  "ArgumentProcessor should throw an exception when outputDirectory is not provided in JSON mode",
  () => {
    assertThrows(
      () => {
        const { argumentProcessor } = setupTest((config) => {
          config.mode = Mode.JSON;
          config.outputDirectory = undefined;
        });
        argumentProcessor.getConfig();
      },
      Error,
      ERROR_MESSAGES.outputDirectoryRequired
    );
  }
);

Deno.test(
  "ArgumentProcessor should throw an exception when outputFileName is not provided in JSON mode",
  () => {
    assertThrows(
      () => {
        const { argumentProcessor } = setupTest((config) => {
          config.mode = Mode.JSON;
          config.outputFileName = undefined;
        });
        argumentProcessor.getConfig();
      },
      Error,
      ERROR_MESSAGES.outputFileNameRequired
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
  "ArgumentProcessor should throw an exception when the output file name is not populated in JSON mode",
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
  "ArgumentProcessor should throw an exception when the output file name is not supported in JSON mode",
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
  "ArgumentProcessor should throw an exception when the output directory is not valid in JSON mode",
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
  "ArgumentProcessor should throw an exception when the output directory is not specified in JSON mode",
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
