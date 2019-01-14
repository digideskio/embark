import * as path from "path";
import request from "request";
import { ContractEnhanced } from "./contractEnhanced";
import { coverageContractsPath } from "./path";

const utils = require("../../utils/utils");

const fs = require("../../core/fs");

interface Import {
  oldCode: string;
  newCode: string;
  sourceFile: string;
  source: string;
}

export class ImportResolver {

  constructor(private contract: ContractEnhanced) {
  }

  public async process() {
    const imports = await this.revursivelyFindImports(this.contract.coverageFilepath);
    this.rewriteImports(imports);
  }

  private rewriteImports(imports: Import[]) {
    imports.forEach((i) => {
      const newSource = i.source.replace(i.oldCode, i.newCode);
      fs.writeFileSync(i.sourceFile, newSource);
    });
  }

  private async revursivelyFindImports(input: string) {
    let sourceFile: string;
    console.log(input);
    if (this.isHttp(input)) {
      sourceFile = path.join(coverageContractsPath(), "contracts", path.basename(input));
      fs.ensureFileSync(sourceFile);
      const realInput = utils.getExternalContractUrl(input).url;
      try {
        await this.downloadFile(realInput, sourceFile);
      } catch (error) {
        return [];
      }
    } else if (this.isNodeModule(input)) {
      sourceFile = path.join("./node_modules/", input);
    } else {
      sourceFile = input;
    }
    const source: string = fs.readFileSync(sourceFile, "utf-8");
    if (!source) {
      return [];
    }

    const findImportsRegex = /^import[\s]*(['"])(.*)\1;/gm;

    const importStatements = source.match(findImportsRegex) || [];
    let imports: Import[] = [];
    for (const importStatement of importStatements) {
      const findFileRegex = /import[\s]*(['"])(.*)\1;/;
      const fileStatement = findFileRegex.exec(importStatement) || [];

      if (fileStatement.length < 3) {
        break;
      }

      let fileToImport = fileStatement[2];

      if (!this.isHttp(input) && this.isLocal(fileToImport)) {
        break;
      }

      if (!this.isLocal(input) && this.isLocal(fileToImport)) {
        fileToImport = [path.dirname(input), fileToImport].join("/");
      }

      imports.push({
        newCode: `import "./${path.basename(fileToImport)}";`,
        oldCode: importStatement,
        source,
        sourceFile,
      });

      imports = imports.concat(await this.revursivelyFindImports(fileToImport));
    }

    return imports;
  }

  private isLocal(input: string) {
    return !this.isHttp(input) && !this.isNodeModule(input);
  }

  private isNodeModule(input: string) {
    return fs.existsSync(path.join("./node_modules/", input));
  }

  private isHttp(input: string) {
    return input.startsWith("https://") || input.startsWith("http://");
  }

  private downloadFile(source: string, destination: string) {
    return new Promise<void>((resolve, reject) => {
      request(source)
        .on("response", (response) => {
          if (response.statusCode !== 200) {
            reject();
          }
        })
        .on("error", reject)
        .pipe(fs.createWriteStream(destination))
        .on("finish", resolve);
    });
  }
}
