import { it, expect, describe, beforeEach, afterEach } from "jasmine";
import * as fs from "node:fs";
import * as path from "node:path";
import { ERROR_MESSAGES, XmlReader } from "./xml_reader.ts";

const { TEST_UNDECLARED_OUTPUTS_DIR: TEST_UNDECLARED_OUTPUTS_DIR } =
  process.env as { [index: string]: string };

const VALID_FILE_PATH = path.join(TEST_UNDECLARED_OUTPUTS_DIR, "test.xml");
const INVALID_FILE_PATH = "nonexistent.xml";
const INVALID_FILE_EXTENSION_PATH = path.join(
  TEST_UNDECLARED_OUTPUTS_DIR,
  "test.txt"
);
const XML_CONTENT = "<root></root>";

describe("XmlReader", () => {
  let caught: Error | undefined;
  let xmlReader: XmlReader;

  beforeEach(() => {
    fs.writeFileSync(VALID_FILE_PATH, XML_CONTENT);
  });

  afterEach(() => {
    fs.unlinkSync(VALID_FILE_PATH);
  });

  describe("getXmlFileBody", () => {
    it("should read the XML file content when the file path is valid", () => {
      xmlReader = new XmlReader(VALID_FILE_PATH);

      const xmlContent = xmlReader.getXmlFileBody();

      expect(xmlContent).toBe(xmlContent);
    });

    it("should read the XML regardless of the case of the file extension", () => {
      const xmlFilePath = path.join(TEST_UNDECLARED_OUTPUTS_DIR, "test.XmL");
      fs.writeFileSync(xmlFilePath, XML_CONTENT);
      xmlReader = new XmlReader(xmlFilePath);

      const xmlContent = xmlReader.getXmlFileBody();

      expect(xmlContent).toBe(xmlContent);

      fs.unlinkSync(xmlFilePath);
    });

    it("should throw an error when the file path does not exist", () => {
      xmlReader = new XmlReader(INVALID_FILE_PATH);

      try {
        xmlReader.getXmlFileBody();
      } catch (error: unknown) {
        caught = error as Error;
      }

      expect(caught).toBeDefined();
      expect(caught?.message).toEqual(
        ERROR_MESSAGES.invalidFilePath(INVALID_FILE_PATH)
      );
    });

    it("should throw an error when the file extension is not XML", () => {
      fs.writeFileSync(INVALID_FILE_EXTENSION_PATH, XML_CONTENT);
      xmlReader = new XmlReader(INVALID_FILE_EXTENSION_PATH);

      try {
        xmlReader.getXmlFileBody();
      } catch (error: unknown) {
        caught = error as Error;
      }

      expect(caught).toBeDefined();
      expect(caught?.message).toEqual(
        ERROR_MESSAGES.invalidFileExtension(INVALID_FILE_EXTENSION_PATH)
      );

      fs.unlinkSync(INVALID_FILE_EXTENSION_PATH);
    });
  });
});
