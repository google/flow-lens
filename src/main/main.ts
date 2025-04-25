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
 * @fileoverview An injection point for the flow to UML tool.
 */

import { Configuration } from "./argument_processor.ts";
import { FlowFileChangeDetector } from "./flow_file_change_detector.ts";
import {
  FlowDifference,
  FlowToUmlTransformer,
} from "./flow_to_uml_transformer.ts";
import { UmlGeneratorContext } from "./uml_generator_context.ts";
import { UmlWriter } from "./uml_writer.ts";

/**
 * The main class for the flow to UML tool.
 */
export class Runner {
  changeDetector: FlowFileChangeDetector = new FlowFileChangeDetector();
  flowFilePaths: string[] = [];
  filePathToFlowDifference: Map<string, FlowDifference> = new Map<
    string,
    FlowDifference
  >();

  async execute() {
    console.log(`Flow to UML is now running...`);
    this.flowFilePaths = this.getFlowFilePaths();
    await this.generateUml();
    this.writeDiagrams();
  }
  private async generateUml() {
    const generatorContext = new UmlGeneratorContext(
      Configuration.getInstance().diagramTool,
    );
    const transformer = new FlowToUmlTransformer(
      this.flowFilePaths,
      generatorContext,
      this.changeDetector,
    );
    this.filePathToFlowDifference = await transformer.transformToUmlDiagrams();
  }

  private writeDiagrams() {
    new UmlWriter(this.filePathToFlowDifference).writeUmlDiagrams();
  }

  private getFlowFilePaths(): string[] {
    const configuredFilePath = Configuration.getInstance().filePath;
    if (configuredFilePath) {
      return configuredFilePath;
    }
    return this.changeDetector.getFlowFiles();
  }
}

if (import.meta.main) {
  new Runner().execute();
}
