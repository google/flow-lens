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
  changeDetector = new FlowFileChangeDetector();
  flowFilePaths: string[] = [];
  filePathToFlowDifference = new Map<string, FlowDifference>();

  async execute() {
    console.log(`Flow to UML is now running...`);
    this.flowFilePaths = this.getFlowFilePaths();
    await this.generateUml();
    this.writeDiagrams();
  }
  private async generateUml() {
    const generatorContext = new UmlGeneratorContext(
      Configuration.getInstance().diagramTool
    );
    const transformer = new FlowToUmlTransformer(
      this.flowFilePaths,
      generatorContext,
      this.changeDetector
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
