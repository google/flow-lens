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
 * @fileoverview This file contains the UmlWriter class which is used to write
 * the generated UML diagrams to a file.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { Configuration, Mode } from "./argument_processor.ts";
import { FlowDifference } from "./flow_to_uml_transformer.ts";

const FILE_EXTENSION = ".json";

/**
 * This class is used to write the generated UML diagrams to a file.
 */
export class UmlWriter {
  constructor(
    private readonly filePathToFlowDifference: Map<string, FlowDifference>
  ) {}

  /**
   * Writes the UML diagrams to a file.
   */
  writeUmlDiagrams() {
    const fileBody = getFormatter().format(this.filePathToFlowDifference);
    const config = Configuration.getInstance();

    // Only write to file if in JSON mode
    if (config.mode === Mode.JSON) {
      if (!config.outputDirectory || !config.outputFileName) {
        throw new Error(
          "outputDirectory and outputFileName are required for JSON mode"
        );
      }

      fs.writeFileSync(
        path.join(
          config.outputDirectory,
          `${config.outputFileName}${FILE_EXTENSION}`
        ),
        JSON.stringify(fileBody, null, 2)
      );
    } else if (config.mode === Mode.GITHUB_ACTION) {
      // For GITHUB_ACTION mode, output to console
      console.log(JSON.stringify(fileBody, null, 2));
    }
  }
}

interface DefaultFormat {
  path: string;
  difference: FlowDifference;
}

interface Formatter {
  format(
    filePathToFlowDifference: Map<string, FlowDifference>
  ): DefaultFormat[];
}

class DefaultFormatter implements Formatter {
  /**
   * Formats the UML diagrams into a default format.
   * @param filePathToFlowDifference A map of file paths to UML diagrams.
   */
  format(
    filePathToFlowDifference: Map<string, FlowDifference>
  ): DefaultFormat[] {
    const result: DefaultFormat[] = [];
    for (const [filePath, flowDifference] of filePathToFlowDifference) {
      result.push({
        path: filePath,
        difference: flowDifference,
      });
    }
    return result;
  }
}

function getFormatter(): Formatter {
  return new DefaultFormatter();
}
