/**
 * @fileoverview This module processes command line arguments and returns an
 * object containing the arguments.
 */

import * as fs from 'fs';
import * as yargs from 'yargs'; // from //third_party/javascript/typings/yargs

const VALID_OUTPUT_FILE_NAME_REGEX = new RegExp('^[a-zA-Z0-9_]+$');

const argv = yargs.options({
  diagramTool: {
    description: 'Diagram tool',
    type: 'string',
    default: 'plantuml',
  },
  filePath: {
    description: 'File path',
    type: 'string',
    array: true,
  },
  generationType: {
    description: 'Generation type',
    type: 'string',
    default: 'uml-diagram',
  },
  gitRepo: {
    description:
      'Path to git repo. Used when executing git commands originating from a different directory.',
    type: 'string',
  },
  gitDiffFromHash: {
    description: 'Git diff from hash',
    type: 'string',
  },
  gitDiffToHash: {
    description: 'Git diff to hash',
    type: 'string',
  },
  outputDirectory: {
    description: 'Output directory',
    type: 'string',
  },
  outputFileName: {
    description: 'Output file name',
    type: 'string',
  },
  placerPath: {
    description:
      'Placer path - this should be the KOKORO_BUILD_ARTIFACTS_SUBDIR',
    type: 'string',
  },
  dotExecutablePath: {
    description: 'Dot executable path',
    type: 'string',
  },
}).argv;

/**
 * The diagram tool that is used to generate the UML diagram.
 */
export enum DiagramTool {
  PLANTUML = 'plantuml',
  GRAPH_VIZ = 'graphviz',
}

/**
 * The type of content that is generated by the flow to UML tool.
 */
export enum GenerationType {
  UML_DIAGRAM = 'uml-diagram',
  GERRIT_COMMENT = 'gerrit-comment',
}

/**
 * The error messages that are used in the ArgumentProcessor.
 */
export const ERROR_MESSAGES = {
  unsupportedDiagramTool: (diagramTool: string) =>
    `Unsupported diagram tool: ${diagramTool}. Valid options are: ${Object.values(DiagramTool).join(', ')}`,
  filePathDoesNotExist: (filePath: string) =>
    `File path does not exist: ${filePath}`,
  unsupportedGenerationType: (generationType: string) =>
    `Unsupported generation type: ${generationType}. Valid options are: ${Object.values(GenerationType).join(', ')}`,
  invalidOutputFileName: (outputFileName: string) =>
    `Output file name must be alphanumeric with underscores: ${outputFileName}`,
  invalidOutputDirectory: (outputDirectory: string) =>
    `Output directory does not exist: ${outputDirectory}`,
  filePathOrGitDiffFromAndToHashRequired:
    'Either filePath or (gitDiffFrom and gitDiffToHash) must be specified',
  filePathAndGitDiffFromAndToHashMutuallyExclusive:
    'filePath and (gitDiffFrom and gitDiffToHash) are mutually exclusive',
  gitDiffFromAndToHashMustBeSpecifiedTogether:
    'gitDiffFromHash and gitDiffToHash must be specified together',
  outputFileNameRequired: 'Output file name is required',
  outputDirectoryRequired: 'Output directory is required',
  header: 'The following errors were encountered:',
  placerPathRequiredForGraphViz: 'Placer path is required for graphviz',
  dotExecutablePathRequiredForGraphViz:
    'Dot executable path is required for graphviz',
};

/**
 * The configuration object that is returned by the ArgumentProcessor.getConfig
 * function.
 */
export interface RuntimeConfig {
  diagramTool: DiagramTool;
  filePath?: string[];
  generationType: GenerationType;
  gitRepo?: string;
  gitDiffFromHash?: string;
  gitDiffToHash?: string;
  outputDirectory: string;
  outputFileName: string;
  placerPath?: string;
  dotExecutablePath?: string;
}

/**
 * Returns a singleton instance of the RuntimeConfig.
 */
export class Configuration {
  private static instance: RuntimeConfig | undefined;
  private constructor() {}

  static getInstance(): RuntimeConfig {
    if (!Configuration.instance) {
      Configuration.instance = new ArgumentProcessor().getConfig();
    }
    return Configuration.instance;
  }
}

/**
 * Validates command line arguments and returns an RuntimeConfig object for
 * use throughout the flow to UML tool.
 * Throws an error if any of the arguments are invalid.
 */
export class ArgumentProcessor {
  readonly config: RuntimeConfig;
  readonly errorsEncountered: string[] = [];

  constructor(commandLineArguments?: yargs.Arguments | RuntimeConfig) {
    this.config = commandLineArguments
      ? (commandLineArguments as unknown as RuntimeConfig)
      : (argv as unknown as RuntimeConfig);
  }

  getConfig(): RuntimeConfig {
    this.validateArguments();
    this.checkForErrors();
    return this.config;
  }

  private validateArguments() {
    this.validateDiagramTool();
    this.validateFilePath();
    this.validateGenerationType();
    this.validateOutputDirectory();
    this.validateOutputFileName();

    this.validateRequiredArguments();
    this.validateMutuallyExclusiveArguments();
    this.validateConditionalArguments();
  }

  private validateDiagramTool() {
    const lowerCaseDiagramTool = this.config.diagramTool.toLowerCase();
    if (
      !Object.values(DiagramTool).includes(lowerCaseDiagramTool as DiagramTool)
    ) {
      this.errorsEncountered.push(
        ERROR_MESSAGES.unsupportedDiagramTool(this.config.diagramTool),
      );
    }
    if (this.config.diagramTool === DiagramTool.GRAPH_VIZ) {
      if (!this.config.placerPath) {
        this.errorsEncountered.push(
          ERROR_MESSAGES.placerPathRequiredForGraphViz,
        );
      }
      if (!this.config.dotExecutablePath) {
        this.errorsEncountered.push(
          ERROR_MESSAGES.dotExecutablePathRequiredForGraphViz,
        );
      }
    }
  }

  private validateFilePath() {
    if (!this.config.filePath) {
      return;
    }
    for (const filePath of this.config?.filePath) {
      if (!fs.existsSync(filePath)) {
        this.errorsEncountered.push(
          ERROR_MESSAGES.filePathDoesNotExist(filePath),
        );
      }
    }
  }

  private validateGenerationType() {
    const lowerCaseGenerationType = this.config.generationType.toLowerCase();
    if (
      !Object.values(GenerationType).includes(
        lowerCaseGenerationType as GenerationType,
      )
    ) {
      this.errorsEncountered.push(
        ERROR_MESSAGES.unsupportedGenerationType(this.config.generationType),
      );
    }
  }

  private validateOutputFileName() {
    if (!this.config.outputFileName) {
      this.errorsEncountered.push(ERROR_MESSAGES.outputFileNameRequired);
      return;
    }
    const regex = VALID_OUTPUT_FILE_NAME_REGEX;
    if (!regex.test(this.config.outputFileName)) {
      this.errorsEncountered.push(
        ERROR_MESSAGES.invalidOutputFileName(this.config.outputFileName),
      );
    }
  }

  private validateOutputDirectory() {
    if (!this.config.outputDirectory) {
      this.errorsEncountered.push(ERROR_MESSAGES.outputDirectoryRequired);
      return;
    }
    if (!fs.existsSync(this.config.outputDirectory)) {
      this.errorsEncountered.push(
        ERROR_MESSAGES.invalidOutputDirectory(this.config.outputDirectory),
      );
    }
  }

  private validateRequiredArguments() {
    if (
      (!this.config.filePath || this.config?.filePath?.length === 0) &&
      !(this.config.gitDiffFromHash && this.config.gitDiffToHash)
    ) {
      this.errorsEncountered.push(
        ERROR_MESSAGES.filePathOrGitDiffFromAndToHashRequired,
      );
    }
  }

  private validateMutuallyExclusiveArguments() {
    if (
      this.config?.filePath &&
      this.config?.filePath?.length > 0 &&
      (this.config.gitDiffFromHash || this.config.gitDiffToHash)
    ) {
      this.errorsEncountered.push(
        ERROR_MESSAGES.filePathAndGitDiffFromAndToHashMutuallyExclusive,
      );
    }
  }

  private validateConditionalArguments() {
    if (
      (this.config.gitDiffToHash && !this.config.gitDiffFromHash) ||
      (this.config.gitDiffFromHash && !this.config.gitDiffToHash)
    ) {
      this.errorsEncountered.push(
        ERROR_MESSAGES.gitDiffFromAndToHashMustBeSpecifiedTogether,
      );
    }
  }

  private checkForErrors() {
    if (this.errorsEncountered.length > 0) {
      const errors: string[] = this.errorsEncountered.map(
        (error) => `- ${error}`,
      );
      errors.unshift(ERROR_MESSAGES.header);
      throw new Error(errors.join('\n'));
    }
  }
}
