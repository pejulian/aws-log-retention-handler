import esbuild from "esbuild";
import { copy } from "esbuild-plugin-copy";
import { clean } from "esbuild-plugin-clean";

const { name } = (await import("./package.json", { assert: { type: "json" } }))
  .default;

esbuild.build({
  platform: "node",
  bundle: true,
  minify: true,
  keepNames: false,
  sourcemap: "external",
  tsconfig: "./tsconfig.json",
  target: "es2022",
  format: "esm",
  banner: {
    js: [
      `/* ${name} - ${new Date().toLocaleDateString()} */`,
      `import { createRequire } from 'module';`,
      `const require = createRequire(import.meta.url);`,
    ].join("\n"),
  },
  plugins: [
    clean({
      patterns: ["./build/*", "./cdk.out/**/*"],
    }),
    copy({
      resolveFrom: "cwd",
      assets: {
        from: "./package.json",
        to: ["build/lambda/package.json"],
      },
    }),
  ],
  define: {
    "process.env.PACKAGE_NAME": JSON.stringify(name),
  },
  entryPoints: {
    lambda: "./src/index.ts",
  },
  entryNames: `[name]/index`,
  outdir: "./build",
  outbase: "src",
  external: ["@aws-sdk"],
});
