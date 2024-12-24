/**
 * @fileoverview This file contains the pipeline that transforms a Salesforce
 * flow file into a UML diagram.
 */

import * as path from "node:path";
import { Configuration } from "./argument_processor.ts";
import { compareFlows } from "./flow_comparator.ts";
import { FlowFileChangeDetector } from "./flow_file_change_detector.ts";
import { FlowParser, ParsedFlow } from "./flow_parser.ts";
import { UmlGeneratorContext } from "./uml_generator_context.ts";
import { XmlReader } from "./xml_reader.ts";

/**
 * This object contains the error messages that are used in the
 * FlowToUmlTransformer class.
 */
export const ERROR_MESSAGES = {
  unableToProcessFile: (filePath: string, error: unknown) =>
    `unable to process file: ${filePath} | ${error}`,
  previousFlowNotFound: (filePath: string) =>
    `previous version of flow not found: ${filePath}, so it will be treated as a new flow`,
};

/**
 * This s contains the difference between the old and new Flows.
 */
export interface FlowDifference {
  old: string | undefined;
  new: string;
}

interface ParsedFlowDifference {
  old: ParsedFlow | undefined;
  new: ParsedFlow;
}

/**
 * This class is the entry point for the pipeline that transforms a Salesforce
 * flow file into a UML diagram.
 */
export class FlowToUmlTransformer {
  constructor(
    private readonly filePaths: string[],
    private readonly generatorContext: UmlGeneratorContext,
    private readonly changeDetector: FlowFileChangeDetector
  ) {}

  async transformToUmlDiagrams(): Promise<Map<string, FlowDifference>> {
    const result = new Map<string, FlowDifference>();
    for (const filePath of this.filePaths) {
      try {
        result.set(filePath, await this.transformToUmlDiagram(filePath));
      } catch (error: unknown) {
        console.error(ERROR_MESSAGES.unableToProcessFile(filePath, error));
      }
    }
    return result;
  }

  private async transformToUmlDiagram(
    filePath: string
  ): Promise<FlowDifference> {
    return new Promise<FlowDifference>(async (resolve, reject) => {
      try {
        let result: unknown = filePath;
        for (const stage of this.generatePipeline()) {
          result = await stage.process(result);
        }
        resolve(result as FlowDifference);
      } catch (error) {
        reject(error);
      }
    });
  }

  private generatePipeline(): Array<Filter<unknown>> {
    return [
      new Reader(this.changeDetector),
      new Parser(),
      new DiagramGenerator(this.generatorContext),
    ];
  }
}

function getFullFilePath(filePath: string): string {
  const gitRepo = Configuration.getInstance().gitRepo;
  return gitRepo ? path.join(gitRepo, filePath) : filePath;
}

interface Filter<T> {
  process(input: unknown): T | Promise<T>;
}

class Reader implements Filter<FlowDifference> {
  constructor(private readonly changeDetector: FlowFileChangeDetector) {}

  process(input: string): FlowDifference {
    if (Configuration.getInstance().gitDiffFromHash) {
      let old: string | undefined = undefined;
      try {
        old = this.changeDetector.getFileContent(input, "old");
      } catch (error: unknown) {
        console.log(ERROR_MESSAGES.previousFlowNotFound(input));
      }
      return {
        old,
        new: this.changeDetector.getFileContent(input, "new"),
      };
    }
    return {
      old: undefined,
      new: new XmlReader(getFullFilePath(input)).getXmlFileBody(),
    };
  }
}

class Parser implements Filter<ParsedFlowDifference> {
  async process(input: FlowDifference): Promise<ParsedFlowDifference> {
    const newFlow = await new FlowParser(input.new).generateFlowDefinition();
    let oldFlow: ParsedFlow | undefined = undefined;
    if (input.old) {
      oldFlow = await new FlowParser(input.old).generateFlowDefinition();
      compareFlows(oldFlow, newFlow);
    }
    return {
      old: oldFlow,
      new: newFlow,
    };
  }
}

class DiagramGenerator implements Filter<FlowDifference> {
  constructor(private readonly generatorContext: UmlGeneratorContext) {}

  process(input: ParsedFlowDifference): FlowDifference {
    return {
      old: input.old
        ? this.generatorContext.generateDiagram(input.old)
        : undefined,
      new: this.generatorContext.generateDiagram(input.new),
    };
  }
}
