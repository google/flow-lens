/**
 * @fileoverview This file contains the UmlWriter class which is used to write
 * the generated UML diagrams to a file.
 */
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  Configuration,
  DiagramTool,
  GenerationType,
} from "./argument_processor.ts";
import { FlowDifference } from "./flow_to_uml_transformer.ts";

/**
 * The error message to display when the GraphViz CLI command fails.
 */
export const GRAPH_VIZ_CLI_COMMAND_FAILED =
  "The system failed to generate a preview for this flow. Please see the sponge log for more details.";

const FILE_EXTENSION = ".json";

const RED_TERMINAL_COLOR = "\x1b[31m%s\x1b[0m";

const GRAPH_VIZ_CLI_COMMANDS = {
  dot(dotExecutablePath: string, digraph: string, filePathAndName: string) {
    return `${dotExecutablePath} -Tsvg <<'END_OF_DIGRAPH' > ${filePathAndName}
${digraph}
END_OF_DIGRAPH`;
  },
};

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

interface GerritCommentFormat {
  path: string;
  message: string;
}

interface GerritCommentGenerator {
  generate(uml: string, flowApiName: string, oldUml?: string): string;
}

interface Formatter {
  format(
    filePathToFlowDifference: Map<string, FlowDifference>
  ): DefaultFormat[] | GerritCommentFormat[];
}

class PlantUmlGerritCommentGenerator implements GerritCommentGenerator {
  static readonly PLANTUML_URL = "https://plantuml.corp.google.com/?syntax=";

  /**
   * Generates a gerrit comment for a UML diagram.
   * @param uml The UML diagram to generate a comment for.
   */
  generate(uml: string, fileName: string, oldUml?: string): string {
    const urlEncodedUml = encodeURIComponent(uml);
    if (oldUml) {
      const urlEncodedOldUml = encodeURIComponent(oldUml);
      return `Click [before](${PlantUmlGerritCommentGenerator.PLANTUML_URL}${urlEncodedOldUml}) or [after](${PlantUmlGerritCommentGenerator.PLANTUML_URL}${urlEncodedUml}) to see a preview of the flow differences.`;
    }
    return `Click [here](${PlantUmlGerritCommentGenerator.PLANTUML_URL}${urlEncodedUml}) to see a preview of this flow.`;
  }
}

/**
 * This class is used to generate gerrit comments for UML diagrams generated
 * using GraphViz.
 */
export class GraphVizGerritCommentGenerator implements GerritCommentGenerator {
  static readonly PLACER_URL =
    "https://cnsviewer-static.corp.google.com/placer/prod/home/kokoro-dedicated/build_artifacts/";
  static readonly PREVIEW_FILE_PREFIX = "Preview_for_";
  static readonly PREVIEW_FILE_OLD_PREFIX = "Preview_for_old_";

  /**
   * Generates a gerrit comment for a UML diagram.
   * @param uml The UML diagram to generate a comment for.
   */
  generate(uml: string, flowApiName: string, oldUml?: string): string {
    const fileName = this.generateFileName(
      flowApiName,
      GraphVizGerritCommentGenerator.PREVIEW_FILE_PREFIX
    );
    const oldFileName = this.generateFileName(
      flowApiName,
      GraphVizGerritCommentGenerator.PREVIEW_FILE_OLD_PREFIX
    );
    try {
      this.generateSvg(uml, fileName);
      if (oldUml) {
        this.generateSvg(oldUml, oldFileName);
      }
    } catch (e) {
      console.error(
        RED_TERMINAL_COLOR,
        this.generateErrorMessage(e as Error, fileName)
      );
      return GRAPH_VIZ_CLI_COMMAND_FAILED;
    }
    const placerUrl = this.generatePlacerUrl(
      Configuration.getInstance().placerPath!,
      fileName
    );
    if (oldUml) {
      const oldPlacerUrl = this.generatePlacerUrl(
        Configuration.getInstance().placerPath!,
        oldFileName
      );
      return `Click [before](${oldPlacerUrl}) or [after](${placerUrl}) to see a preview of the flow versions.`;
    }
    return `Click [here](${placerUrl}) to see a preview of this flow.`;
  }

  generateFileName(flowApiName: string, prefix: string): string {
    return `${prefix}${flowApiName}.svg`;
  }

  generatePlacerUrl(placerPath: string, fileName: string): string {
    return `${GraphVizGerritCommentGenerator.PLACER_URL}${placerPath}/${fileName}`;
  }

  private generateSvg(umlString: string, fileName: string) {
    execSync(
      GRAPH_VIZ_CLI_COMMANDS.dot(
        Configuration.getInstance().dotExecutablePath!,
        umlString,
        path.join(Configuration.getInstance().outputDirectory!, fileName)
      )
    );
  }

  private generateErrorMessage(error: Error, fileName: string): string {
    return `GraphViz CLI command failed when processing ${fileName} with error: ${error.message}`;
  }
}

class GerritCommentFormatter implements Formatter {
  /**
   * Formats the UML diagrams into a format that can be used to generate gerrit
   * comments.
   * @param filePathToFlowDifference A map of file paths to UML diagrams.
   */
  format(
    filePathToFlowDifference: Map<string, FlowDifference>
  ): GerritCommentFormat[] {
    const commentGenerator = this.getCommentGenerator();

    const result: GerritCommentFormat[] = [];
    for (const [filePath, flowDifference] of filePathToFlowDifference) {
      const fileName = path.basename(filePath);
      result.push({
        path: filePath,
        message: commentGenerator.generate(
          flowDifference.new,
          fileName,
          flowDifference.old
        ),
      });
    }
    return result;
  }

  /**
   * Returns the gerrit comment generator to use.
   * By default, this will return a PlantUmlGerritCommentGenerator.
   * Currently, only PlantUML is supported, but eventually more diagram tools
   * will be supported and the comment generator will be chosen based on the
   * diagram tool specified in the runtime config; hence the use of a switch
   * statement here.
   */
  getCommentGenerator(): GerritCommentGenerator {
    switch (Configuration.getInstance().diagramTool) {
      case DiagramTool.GRAPH_VIZ:
        return new GraphVizGerritCommentGenerator();
      case DiagramTool.PLANTUML:
      default:
        return new PlantUmlGerritCommentGenerator();
    }
  }
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
  let formatter: Formatter;
  switch (Configuration.getInstance().generationType) {
    case GenerationType.GERRIT_COMMENT:
      formatter = new GerritCommentFormatter();
      break;
    default:
      formatter = new DefaultFormatter();
  }
  return formatter;
}
