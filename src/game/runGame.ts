import type { Engine } from "@babylonjs/core/Engines/engine";
import type { Scene } from "@babylonjs/core/scene";

import { setupScene } from "./setupScene";
import { setupPhysics } from "./setupPhysics";
import { createGameMaterials } from "./materials";
import { createHouse } from "./createHouse";
import { setupLighting } from "./setupLighting";
import { loadCharacter } from "./loadCharacter";
import { createFireParticles } from "./createFireParticles";
import { setupControls } from "./setupControls";

export interface RunGameResult {
	dispose: () => void;
}

/**
 * Orquestador principal: inicializa escena, física, casa, luces, avatar y controles.
 */
export async function runGame(
	engine: Engine,
	scene: Scene,
): Promise<RunGameResult> {
	setupScene(scene);
	setupPhysics(scene);

	const materials = createGameMaterials(scene);
	const house = createHouse(scene, materials);
	setupLighting(scene, house);
	const fireParticles = createFireParticles(scene, house.fireplaceCenter);

	const character = await loadCharacter(scene);
	const controls = setupControls(scene, character);

	engine.runRenderLoop(() => {
		scene.render();
	});

	return {
		dispose: () => {
			controls.dispose();
			fireParticles.stop();
			engine.stopRenderLoop();
		},
	};
}
