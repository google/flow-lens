/**
 * @fileoverview Validates and reads an XML file.
 */

import * as fs from "node:fs";

const XML_FILE_EXTENSION = ".xml";
const ENCODING = "utf8";

/**
 * Error messages for the XmlReader class.
 */
export const ERROR_MESSAGES = {
  invalidFilePath: (filePath: string) =>
    `File path ${filePath} does not exist.`,
  invalidFileExtension: (filePath: string) =>
    `File path ${filePath} is not an XML file.`,
};

/**
 * Reads the XML file and returns the file body.
 */
export class XmlReader {
  constructor(private readonly filePath: string) {}

  getXmlFileBody(): string {
    this.validateFilePath();
    this.validateFileExtension();
    return fs.readFileSync(this.filePath, ENCODING);
  }

  private validateFilePath() {
    if (!fs.existsSync(this.filePath)) {
      throw new Error(ERROR_MESSAGES.invalidFilePath(this.filePath));
    }
  }

  private validateFileExtension() {
    if (!this.filePath.toLowerCase().endsWith(XML_FILE_EXTENSION)) {
      throw new Error(ERROR_MESSAGES.invalidFileExtension(this.filePath));
    }
  }
}
