import { assertEquals, assertThrows } from "@std/assert";
import * as path from "@std/path";
import { ERROR_MESSAGES, XmlReader } from "./xml_reader.ts";

const TEST_UNDECLARED_OUTPUTS_DIR = "./";

const VALID_FILE_PATH = path.join(TEST_UNDECLARED_OUTPUTS_DIR, "test.xml");
const INVALID_FILE_PATH = "nonexistent.xml";
const INVALID_FILE_EXTENSION_PATH = path.join(
  TEST_UNDECLARED_OUTPUTS_DIR,
  "test.txt"
);
const XML_CONTENT = "<root></root>";

Deno.test("XmlReader", async (t) => {
  await t.step("getXmlFileBody", async (t) => {
    await t.step(
      "should read the XML file content when the file path is valid",
      async () => {
        await Deno.writeFile(
          VALID_FILE_PATH,
          new TextEncoder().encode(XML_CONTENT)
        );
        const xmlReader = new XmlReader(VALID_FILE_PATH);
        const xmlContent = xmlReader.getXmlFileBody();
        assertEquals(xmlContent, XML_CONTENT);
        await Deno.remove(VALID_FILE_PATH);
      }
    );

    await t.step(
      "should read the XML regardless of the case of the file extension",
      async () => {
        const xmlFilePath = path.join(TEST_UNDECLARED_OUTPUTS_DIR, "test.XmL");
        await Deno.writeFile(
          xmlFilePath,
          new TextEncoder().encode(XML_CONTENT)
        );
        const xmlReader = new XmlReader(xmlFilePath);
        const xmlContent = xmlReader.getXmlFileBody();
        assertEquals(xmlContent, XML_CONTENT);
        await Deno.remove(xmlFilePath);
      }
    );

    await t.step(
      "should throw an error when the file path does not exist",
      async () => {
        const xmlReader = new XmlReader(INVALID_FILE_PATH);
        assertThrows(
          () => xmlReader.getXmlFileBody(),
          Error,
          ERROR_MESSAGES.invalidFilePath(INVALID_FILE_PATH)
        );
      }
    );

    await t.step(
      "should throw an error when the file extension is not XML",
      async () => {
        await Deno.writeFile(
          INVALID_FILE_EXTENSION_PATH,
          new TextEncoder().encode(XML_CONTENT)
        );
        const xmlReader = new XmlReader(INVALID_FILE_EXTENSION_PATH);
        assertThrows(
          () => xmlReader.getXmlFileBody(),
          Error,
          ERROR_MESSAGES.invalidFileExtension(INVALID_FILE_EXTENSION_PATH)
        );
        await Deno.remove(INVALID_FILE_EXTENSION_PATH);
      }
    );
  });
});
