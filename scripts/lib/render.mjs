import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { RAIZ_DA_SKILL } from "./projeto.mjs";

export const gerarTrilha = (caminhos) => {
  if (!existsSync(caminhos.timeline)) throw new Error("Sem timeline.json: rode a etapa audio antes.");
  execFileSync("python3", [path.join(RAIZ_DA_SKILL, "scripts", "trilha.py"), caminhos.raiz], { stdio: ["ignore", "ignore", "inherit"] });
  console.log("trilha: trilha.wav");
};

const remotion = (argumentos) => execFileSync("npx", ["remotion", ...argumentos], { cwd: RAIZ_DA_SKILL, stdio: "inherit" });

export const renderizar = (caminhos) => {
  if (!existsSync(caminhos.timeline)) throw new Error("Sem timeline.json: rode a etapa audio antes.");
  if (!existsSync(path.join(RAIZ_DA_SKILL, "node_modules"))) execFileSync("npm", ["install", "--silent"], { cwd: RAIZ_DA_SKILL, stdio: "inherit" });
  mkdirSync(path.dirname(caminhos.video), { recursive: true });
  const propriedades = [`--props=${caminhos.timeline}`, `--public-dir=${caminhos.raiz}`, "--log=error"];
  remotion(["render", "remotion/index.ts", "Reel", caminhos.video, ...propriedades, "--codec=h264", "--crf=18", "--audio-bitrate=192k"]);
  remotion(["still", "remotion/index.ts", "Capa", caminhos.capa, ...propriedades, "--image-format=jpeg", "--jpeg-quality=92"]);
  console.log(`render: ${caminhos.video}\ncapa: ${caminhos.capa}`);
};
