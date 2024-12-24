/**
 * @fileoverview This file contains the UmlWriter class which is used to write
 * the generated UML diagrams to a file.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { Configuration } from "./argument_processor.ts";
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
    fs.writeFileSync(
      path.join(
        Configuration.getInstance().outputDirectory,
        `${Configuration.getInstance().outputFileName}${FILE_EXTENSION}`
      ),
      JSON.stringify(fileBody, null, 2)
    );
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
