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
