import { it, expect, describe, beforeEach, spyOn } from "jasmine";

import * as fs from "node:fs";
import { Configuration, DiagramTool } from "./argument_processor.ts";
import { getTestConfig } from "./argument_processor_test.ts";
import { FlowFileChangeDetector } from "./flow_file_change_detector.ts";
import {
  ERROR_MESSAGES,
  FlowDifference,
  FlowToUmlTransformer,
} from "./flow_to_uml_transformer.ts";
import { UmlGeneratorContext } from "./uml_generator_context.ts";
import { ERROR_MESSAGES as XML_READER_ERROR_MESSAGES } from "./xml_reader.ts";

const SAMPLE_FLOW_FILE_PATH = `${process.env["RUNFILES"]}/google3/corp/peopleops/connect/salesforce/flow_to_uml/goldens/sample.flow-meta.xml`;
const PLANT_UML_SIGNATURE = "skinparam State";
const GENERATOR_CONTEXT = new UmlGeneratorContext(DiagramTool.PLANTUML);
const CHANGE_DETECTOR = new FlowFileChangeDetector();

describe("FlowToUmlTransformer", () => {
  let transformer: FlowToUmlTransformer;
  let result: Map<string, FlowDifference>;

  beforeEach(() => {
    // Mock the private methods which execute git commands using spyOn
    // tslint:disable:no-any
    spyOn(
      CHANGE_DETECTOR as any,
      "executeGetFileContentCommand"
    ).and.returnValue(fs.readFileSync(SAMPLE_FLOW_FILE_PATH, "utf8"));
    // tslint:enable:no-any
  });

  it("should transform a flow file to a UML diagram", async () => {
    spyOn(Configuration, "getInstance").and.returnValue(getTestConfig());
    transformer = new FlowToUmlTransformer(
      [SAMPLE_FLOW_FILE_PATH],
      GENERATOR_CONTEXT,
      CHANGE_DETECTOR
    );

    result = await transformer.transformToUmlDiagrams();

    expect(result.has(SAMPLE_FLOW_FILE_PATH)).toBeTrue();

    const flowDifference = result.get(SAMPLE_FLOW_FILE_PATH);
    expect(flowDifference).toBeDefined();
    const newUml = flowDifference?.new;
    expect(newUml).toBeDefined();
    expect(newUml).toContain(PLANT_UML_SIGNATURE);
  });

  it("should log to std error if an error occurs in the pipeline", async () => {
    const config = getTestConfig();
    config.gitDiffFromHash = undefined;
    config.gitDiffToHash = undefined;
    spyOn(Configuration, "getInstance").and.returnValue(config);
    const fakeFilePath = "fake-file-path";
    spyOn(console, "error");
    transformer = new FlowToUmlTransformer(
      [fakeFilePath],
      GENERATOR_CONTEXT,
      CHANGE_DETECTOR
    );

    result = await transformer.transformToUmlDiagrams();

    expect(result.size).toBe(0);
    expect(console.error).toHaveBeenCalledWith(
      ERROR_MESSAGES.unableToProcessFile(
        fakeFilePath,
        new Error(XML_READER_ERROR_MESSAGES.invalidFilePath(fakeFilePath))
      )
    );
  });
});
