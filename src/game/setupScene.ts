import type { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { SkyMaterial } from "@babylonjs/materials/sky";

export interface SceneSetupResult {
	sky: Mesh;
}

/**
 * Configura atmósfera nocturna: fondo oscuro y cielo estrellado tenue.
 */
export function setupScene(scene: Scene): SceneSetupResult {
	scene.clearColor = new Color4(0.004, 0.031, 0.094, 1); // #010818
	scene.ambientColor = Color3.Black();

	const skyMaterial = new SkyMaterial("sky_night", scene);
	skyMaterial.backFaceCulling = false;
	skyMaterial.useSunPosition = false;
	skyMaterial.inclination = 0.25;
	skyMaterial.azimuth = 0.25;
	skyMaterial.luminance = 0.05;
	skyMaterial.turbidity = 10;
	skyMaterial.rayleigh = 2;
	skyMaterial.mieCoefficient = 0.005;
	skyMaterial.mieDirectionalG = 0.8;

	const sky = MeshBuilder.CreateBox("sky_night_box", { size: 1000, sideOrientation: Mesh.BACKSIDE }, scene);
	sky.material = skyMaterial;
	sky.infiniteDistance = true;
	sky.isPickable = false;
	sky.checkCollisions = false;

	return { sky };
}
