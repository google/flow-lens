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

const XML_FILE_EXTENSION = ".xml";

/**
 * Error messages for the XmlReader class.
 */
export const ERROR_MESSAGES = {
  invalidFilePath: (filePath: string) => `filePath does not exist: ${filePath}`,
  invalidFileExtension: (filePath: string) =>
    `filePath must have extension ${XML_FILE_EXTENSION}: ${filePath}`,
};

/**
 * Validates and reads an XML file.
 */
export class XmlReader {
  constructor(private readonly filePath: string) {}

  getXmlFileBody(): string {
    this.validateFilePath();
    this.validateFileExtension();
    return Deno.readTextFileSync(this.filePath);
  }

  private validateFilePath() {
    try {
      Deno.statSync(this.filePath);
    } catch {
      throw new Error(ERROR_MESSAGES.invalidFilePath(this.filePath));
    }
  }

  private validateFileExtension() {
    if (!this.filePath.toLowerCase().endsWith(XML_FILE_EXTENSION)) {
      throw new Error(ERROR_MESSAGES.invalidFileExtension(this.filePath));
    }
  }
}
