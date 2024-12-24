import { assertEquals, assertExists, assertStringIncludes } from "@std/assert";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  Configuration,
  DiagramTool,
  GenerationType,
  RuntimeConfig,
} from "../main/argument_processor.ts";
import { FlowDifference } from "../main/flow_to_uml_transformer.ts";
import {
  GRAPH_VIZ_CLI_COMMAND_FAILED,
  GraphVizGerritCommentGenerator,
  UmlWriter,
} from "../main/uml_writer.ts";

const TEST_UNDECLARED_OUTPUTS_DIR = "./";

const FILE_1 = "file1.flow";
const FILE_2 = "file2.flow";
const FILE_PATH_1 = `path/to/${FILE_1}`;
const FILE_PATH_2 = `path/to/${FILE_2}`;
const UML_1 = "uml1";
const UML_2 = "uml2";
const FLOW_DIFFERENCE_1: FlowDifference = {
  old: undefined,
  new: UML_1,
};
const FLOW_DIFFERENCE_2: FlowDifference = {
  old: UML_1,
  new: UML_2,
};
const ENCODING = "utf8";
const OUTPUT_FILE_NAME = "output_file_name";
const SAMPLE_PLACER_PATH = "sample/placer/path";

const GENERATE_MESSAGE = {
  forPlantUml(uml: string, oldUml?: string): string {
    if (oldUml) {
      return `Click [before](https://plantuml.corp.google.com/?syntax=${oldUml}) or [after](https://plantuml.corp.google.com/?syntax=${uml}) to see a preview of the flow differences.`;
    }
    return `Click [here](https://plantuml.corp.google.com/?syntax=${uml}) to see a preview of this flow.`;
  },
  forGraphViz(
    flowApiName: string,
    placerPath: string,
    oldUml?: boolean
  ): string {
    if (oldUml) {
      return `Click [before](https://cnsviewer-static.corp.google.com/placer/prod/home/kokoro-dedicated/build_artifacts/${placerPath}/Preview_for_old_${flowApiName}.svg) or [after](https://cnsviewer-static.corp.google.com/placer/prod/home/kokoro-dedicated/build_artifacts/${placerPath}/Preview_for_${flowApiName}.svg) to see a preview of the flow versions.`;
    }
    return `Click [here](https://cnsviewer-static.corp.google.com/placer/prod/home/kokoro-dedicated/build_artifacts/${placerPath}/Preview_for_${flowApiName}.svg) to see a preview of this flow.`;
  },
};

const FILE_PATH_TO_FLOW_DIFFERENCE = new Map<string, FlowDifference>([
  [FILE_PATH_1, FLOW_DIFFERENCE_1],
  [FILE_PATH_2, FLOW_DIFFERENCE_2],
]);

const EXPECTED_DEFAULT_FORMAT = [
  {
    path: FILE_PATH_1,
    difference: FLOW_DIFFERENCE_1,
  },
  {
    path: FILE_PATH_2,
    difference: FLOW_DIFFERENCE_2,
  },
];

const EXPECTED_GERRIT_COMMENT_FORMAT_PLANT_UML = [
  {
    path: FILE_PATH_1,
    message: GENERATE_MESSAGE.forPlantUml(UML_1),
  },
  {
    path: FILE_PATH_2,
    message: GENERATE_MESSAGE.forPlantUml(UML_2, UML_1),
  },
];

const EXPECTED_GERRIT_COMMENT_FORMAT_GRAPHVIZ = [
  {
    path: FILE_PATH_1,
    message: GENERATE_MESSAGE.forGraphViz(FILE_1, SAMPLE_PLACER_PATH),
  },
  {
    path: FILE_PATH_2,
    message: GENERATE_MESSAGE.forGraphViz(FILE_2, SAMPLE_PLACER_PATH, true),
  },
];

const EXPECTED_GERRIT_COMMENT_FORMAT_GRAPHVIZ_FAILED = [
  {
    path: FILE_PATH_1,
    message: GRAPH_VIZ_CLI_COMMAND_FAILED,
  },
  {
    path: FILE_PATH_2,
    message: GRAPH_VIZ_CLI_COMMAND_FAILED,
  },
];

const expectedFilePath = path.join(
  TEST_UNDECLARED_OUTPUTS_DIR,
  `${OUTPUT_FILE_NAME}.json`
);

function getRuntimeConfig(
  generationType: GenerationType,
  diagramTool: DiagramTool = DiagramTool.PLANTUML
): RuntimeConfig {
  return {
    generationType,
    diagramTool,
    outputDirectory: TEST_UNDECLARED_OUTPUTS_DIR,
    outputFileName: OUTPUT_FILE_NAME,
    placerPath: "sample/placer/path",
    dotExecutablePath: "echo",
  };
}

function mockSuccessfulGraphVizCommand() {
  GraphVizGerritCommentGenerator.prototype.generateSvg = function (
    this: GraphVizGerritCommentGenerator,
    umlString: string,
    fileName: string
  ): void {
    fs.writeFileSync(
      path.join(TEST_UNDECLARED_OUTPUTS_DIR, fileName),
      umlString
    );
  };
}

function mockFailedGraphVizCommand() {
  GraphVizGerritCommentGenerator.prototype.generateSvg = function (
    this: GraphVizGerritCommentGenerator,
    _umlString: string,
    _fileName: string
  ): void {
    throw new Error("GraphViz CLI command failed");
  };
}

Deno.test("UmlWriter", async (t) => {
  let writer: UmlWriter;
  let fileContent: string;

  await t.step("should write UML diagrams to a file", () => {
    mockSuccessfulGraphVizCommand();
    Configuration.getInstance = () =>
      getRuntimeConfig(GenerationType.UML_DIAGRAM);
    writer = new UmlWriter(FILE_PATH_TO_FLOW_DIFFERENCE);

    writer.writeUmlDiagrams();

    assertExists(fs.existsSync(expectedFilePath));
    fileContent = fs.readFileSync(expectedFilePath, ENCODING).toString();
    assertEquals(fileContent, JSON.stringify(EXPECTED_DEFAULT_FORMAT, null, 2));

    Deno.remove(expectedFilePath);
  });

  await t.step("should write Gerrit comments to a file", () => {
    mockSuccessfulGraphVizCommand();
    Configuration.getInstance = () =>
      getRuntimeConfig(GenerationType.GERRIT_COMMENT);
    writer = new UmlWriter(FILE_PATH_TO_FLOW_DIFFERENCE);

    writer.writeUmlDiagrams();

    assertExists(fs.existsSync(expectedFilePath));
    fileContent = fs.readFileSync(expectedFilePath, ENCODING).toString();
    assertEquals(
      fileContent,
      JSON.stringify(EXPECTED_GERRIT_COMMENT_FORMAT_PLANT_UML, null, 2)
    );
    Deno.remove(expectedFilePath);
  });

  await t.step(
    "should write artifacts to Placer when GraphViz is selected",
    () => {
      mockSuccessfulGraphVizCommand();
      Configuration.getInstance = () =>
        getRuntimeConfig(GenerationType.GERRIT_COMMENT, DiagramTool.GRAPH_VIZ);
      writer = new UmlWriter(FILE_PATH_TO_FLOW_DIFFERENCE);

      writer.writeUmlDiagrams();

      assertExists(fs.existsSync(expectedFilePath));

      fileContent = fs.readFileSync(expectedFilePath, ENCODING).toString();
      assertEquals(
        fileContent,
        JSON.stringify(EXPECTED_GERRIT_COMMENT_FORMAT_GRAPHVIZ, null, 2)
      );

      const previewPathForFile1 = path.join(
        TEST_UNDECLARED_OUTPUTS_DIR,
        `Preview_for_${FILE_1}.svg`
      );
      assertExists(fs.existsSync(previewPathForFile1));
      assertStringIncludes(
        fs.readFileSync(previewPathForFile1, ENCODING).toString(),
        UML_1
      );

      const previewPathForFile2 = path.join(
        TEST_UNDECLARED_OUTPUTS_DIR,
        `Preview_for_${FILE_2}.svg`
      );
      assertExists(fs.existsSync(previewPathForFile2));
      assertStringIncludes(
        fs.readFileSync(previewPathForFile2, ENCODING).toString(),
        UML_2
      );

      Deno.remove(expectedFilePath);
      Deno.remove(previewPathForFile1);
      Deno.remove(previewPathForFile2);
      Deno.remove(`Preview_for_old_${FILE_2}.svg`);
    }
  );

  await t.step(
    "should generate a comment when the GraphViz CLI command fails",
    () => {
      mockFailedGraphVizCommand();
      Configuration.getInstance = () =>
        getRuntimeConfig(GenerationType.GERRIT_COMMENT, DiagramTool.GRAPH_VIZ);
      writer = new UmlWriter(FILE_PATH_TO_FLOW_DIFFERENCE);

      writer.writeUmlDiagrams();

      assertExists(fs.existsSync(expectedFilePath));
      fileContent = fs.readFileSync(expectedFilePath, ENCODING).toString();
      assertEquals(
        fileContent,
        JSON.stringify(EXPECTED_GERRIT_COMMENT_FORMAT_GRAPHVIZ_FAILED, null, 2)
      );

      Deno.remove(expectedFilePath);
    }
  );
});
