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

/**
 * @fileoverview This file contains the pipeline that transforms a Salesforce
 * flow file into a UML diagram.
 */

import { join } from "@std/path";
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
    private readonly changeDetector: FlowFileChangeDetector,
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

  private transformToUmlDiagram(filePath: string): Promise<FlowDifference> {
    return new Promise<FlowDifference>((resolve, reject) => {
      try {
        this.processPipeline(filePath, resolve, reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async processPipeline(
    initialValue: unknown,
    resolve: (value: FlowDifference) => void,
    reject: (reason?: unknown) => void,
  ): Promise<void> {
    const pipeline = this.generatePipeline();
    let result = initialValue;

    for (const stage of pipeline) {
      try {
        result = await stage.process(result);
      } catch (error) {
        reject(error);
        return;
      }
    }

    resolve(result as FlowDifference);
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
  return gitRepo ? join(gitRepo, filePath) : filePath;
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
