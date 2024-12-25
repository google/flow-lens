# Flow Lens

This project provides a command-line tool to convert Salesforce Flow definition
XML files into UML diagrams which help to visualize the flow's structure and changes
to assist with documentation or code review.
It supports both PlantUML and Graphviz as diagram generation engines.

## Features

- **Supports multiple diagram tools:** Generates diagrams using PlantUML and
  Graphviz.
- **Handles Git diffs:** Can process changes between two Git commits,
  highlighting added, modified, and deleted elements in the resulting diagram.

## Usage

The tool is driven by command-line arguments. The following options are
available:

| Option              | Description                                                                                            | Type     | Default    | Required                            |
| ------------------- | ------------------------------------------------------------------------------------------------------ | -------- | ---------- | ----------------------------------- |
| `--diagramTool`     | The diagram tool to use ('plantuml' or 'graphviz').                                                    | string   | `plantuml` | No                                  |
| `--filePath`        | Path(s) to the Salesforce Flow XML file(s). Specify multiple files using space separated values.       | string[] |            | No (Git diff or file path required) |
| `--gitRepo`         | Path to the Git repository (required when using Git diff and the script isn't run from the repo root). | string   |            | No                                  |
| `--gitDiffFromHash` | The starting commit hash for the Git diff.                                                             | string   |            | No (Only with Git diff)             |
| `--gitDiffToHash`   | The ending commit hash for the Git diff.                                                               | string   |            | No (Only with Git diff)             |
| `--outputDirectory` | The directory to save the output file.                                                                 | string   |            | Yes                                 |
| `--outputFileName`  | The name of the output file (without extension).                                                       | string   |            | Yes                                 |

**Example using file path:**

```shell
deno run main.ts -- \
  --diagramTool="graphviz" \
  --filePath="/some/path/force-app/main/default/flows/ArticleSubmissionStatus.flow-meta.xml" \
  --filePath="/some/path/force-app/main/default/flows/Mass_Email_Eval_Flow.flow-meta.xml" \
  --filePath="/some/path/force-app/main/default/flows/FOW_Orchestration.flow-meta.xml" \
  --outputDirectory="/some/path/" \
  --outputFileName="test"
```

**Example using Git diff:**

```shell
deno run main.ts -- \
  --diagramTool="graphviz" \
  --gitDiffFromHash="HEAD~1" \
  --gitDiffToHash="HEAD" \
  --gitRepo="/some/path/" \
  --outputDirectory="/some/path/" \
  --outputFileName="test"
```

## Output

The output is a JSON file containing the generated UML diagram(s). The
structure will contain the file paths and their associated old (if
applicable) and new UML strings.
