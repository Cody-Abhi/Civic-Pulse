import fs from "fs";
import path from "path";
import ts from "typescript";

interface ModuleNode {
  filePath: string;
  relativePath: string;
  imports: { targetPath: string; isTypeOnly: boolean; statement: string }[];
}

const rootDir = process.cwd();
const srcDir = path.resolve(rootDir, "src");

function getAllTsFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllTsFiles(fullPath));
    } else if (
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      !entry.name.endsWith(".d.ts") &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".test.tsx")
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

function resolveImport(sourceFilePath: string, specifier: string): string | null {
  let candidateBase: string | null = null;
  if (specifier.startsWith("@/")) {
    candidateBase = path.join(srcDir, specifier.slice(2));
  } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
    candidateBase = path.resolve(path.dirname(sourceFilePath), specifier);
  } else {
    // External package
    return null;
  }

  const extensions = [".ts", ".tsx", "/index.ts", "/index.tsx"];
  // Check exact file first (if specifier had extension)
  if (fs.existsSync(candidateBase) && fs.statSync(candidateBase).isFile()) {
    return candidateBase;
  }

  for (const ext of extensions) {
    const candidate = candidateBase + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function parseFile(filePath: string): ModuleNode {
  const content = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const relativePath = path.relative(srcDir, filePath).replace(/\\/g, "/");
  const imports: ModuleNode["imports"] = [];

  function visit(node: ts.Node) {
    // import ... from "..."
    if (ts.isImportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const specifier = node.moduleSpecifier.text;
        const resolved = resolveImport(filePath, specifier);
        if (resolved) {
          const isTypeOnly =
            node.importClause?.isTypeOnly === true ||
            (node.importClause?.namedBindings &&
              ts.isNamedImports(node.importClause.namedBindings) &&
              node.importClause.namedBindings.elements.length > 0 &&
              node.importClause.namedBindings.elements.every((el) => el.isTypeOnly));
          imports.push({
            targetPath: resolved,
            isTypeOnly: Boolean(isTypeOnly),
            statement: node.getText(sourceFile),
          });
        }
      }
    }

    // export ... from "..."
    if (ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const specifier = node.moduleSpecifier.text;
        const resolved = resolveImport(filePath, specifier);
        if (resolved) {
          const isTypeOnly = node.isTypeOnly === true;
          imports.push({
            targetPath: resolved,
            isTypeOnly: Boolean(isTypeOnly),
            statement: node.getText(sourceFile),
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return { filePath, relativePath, imports };
}

function findCycles(files: string[], filterTypeOnly: boolean) {
  const nodes = new Map<string, ModuleNode>();
  for (const file of files) {
    nodes.set(file, parseFile(file));
  }

  // Tarjan's Strongly Connected Components
  let index = 0;
  const indices = new Map<string, number>();
  const lowlinks = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const sccs: string[][] = [];

  function strongConnect(v: string) {
    indices.set(v, index);
    lowlinks.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    const node = nodes.get(v);
    if (node) {
      for (const imp of node.imports) {
        if (filterTypeOnly && imp.isTypeOnly) {
          continue; // skip type-only imports for runtime TDZ cycle detection
        }
        const w = imp.targetPath;
        if (!nodes.has(w)) continue;

        if (!indices.has(w)) {
          strongConnect(w);
          lowlinks.set(v, Math.min(lowlinks.get(v)!, lowlinks.get(w)!));
        } else if (onStack.has(w)) {
          lowlinks.set(v, Math.min(lowlinks.get(v)!, indices.get(w)!));
        }
      }
    }

    if (lowlinks.get(v) === indices.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);

      if (scc.length > 1) {
        sccs.push(scc);
      } else {
        // Check for self-loop
        const singleNode = nodes.get(v);
        const selfEdge = singleNode?.imports.some(
          (i) => (!filterTypeOnly || !i.isTypeOnly) && i.targetPath === v
        );
        if (selfEdge) {
          sccs.push(scc);
        }
      }
    }
  }

  for (const file of files) {
    if (!indices.has(file)) {
      strongConnect(file);
    }
  }

  return { nodes, sccs };
}

// Execute analysis
console.log(`Scanning src/ directory for module dependency cycles...`);
const allFiles = getAllTsFiles(srcDir);
console.log(`Total production TypeScript/TSX files scanned: ${allFiles.length}`);

// 1. Runtime cycles (ignoring type-only imports, which are erased by compiler)
const runtimeResult = findCycles(allFiles, true);
console.log(`\n--- RUNTIME DEPENDENCY GRAPH ANALYSIS ---`);
console.log(`Runtime SCC Cycles found: ${runtimeResult.sccs.length}`);
if (runtimeResult.sccs.length > 0) {
  console.error(`🚨 DETECTED ${runtimeResult.sccs.length} RUNTIME CIRCULAR DEPENDENCIES:`);
  runtimeResult.sccs.forEach((scc, idx) => {
    console.error(`Cycle ${idx + 1} (${scc.length} modules):`);
    scc.forEach((f) => console.error(`  - ${path.relative(srcDir, f).replace(/\\/g, "/")}`));
  });
} else {
  console.log(`✅ ZERO runtime circular dependencies detected across all ${allFiles.length} modules.`);
}

// 2. All cycles (including type-only imports)
const allResult = findCycles(allFiles, false);
console.log(`\n--- TOTAL (RUNTIME + TYPE) DEPENDENCY GRAPH ANALYSIS ---`);
console.log(`Total SCC Cycles found: ${allResult.sccs.length}`);
if (allResult.sccs.length > 0) {
  console.warn(`Type-level cycles found (${allResult.sccs.length}):`);
  allResult.sccs.forEach((scc, idx) => {
    console.warn(`Type Cycle ${idx + 1} (${scc.length} modules):`);
    scc.forEach((f) => console.warn(`  - ${path.relative(srcDir, f).replace(/\\/g, "/")}`));
  });
} else {
  console.log(`✅ ZERO total (runtime + type) circular dependencies detected.`);
}

// 3. Layer boundary check: Repositories must NEVER import from services
console.log(`\n--- ARCHITECTURAL LAYER BOUNDARY CHECK ---`);
const repoFiles = allFiles.filter((f) => f.includes(path.join("src", "server", "repositories")));
let boundaryViolations = 0;
for (const repoFile of repoFiles) {
  const node = parseFile(repoFile);
  for (const imp of node.imports) {
    const relTarget = path.relative(srcDir, imp.targetPath).replace(/\\/g, "/");
    if (relTarget.startsWith("server/services/")) {
      console.error(
        `🚨 LAYER VIOLATION: Repository '${node.relativePath}' imports from service '${relTarget}'`
      );
      boundaryViolations++;
    }
  }
}
if (boundaryViolations === 0) {
  console.log(`✅ Clean architectural layering: 0 repository -> service imports across ${repoFiles.length} repository modules.`);
}

if (runtimeResult.sccs.length > 0 || boundaryViolations > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
