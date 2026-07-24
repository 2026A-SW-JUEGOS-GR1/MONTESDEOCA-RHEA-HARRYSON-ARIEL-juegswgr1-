import type { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { SpotLight } from "@babylonjs/core/Lights/spotLight";

import type { HouseRefs, LightingRefs } from "./types";

/**
 * Iluminación nocturna: luna tenue, focos interiores con range limitado,
 * spot de patio y chimenea con parpadeo cálido.
 */
export function setupLighting(scene: Scene, house: HouseRefs): LightingRefs {
	// Luz de luna: azul plateado, intensidad baja, diagonal hacia abajo.
	const moon = new DirectionalLight("light_moon", new Vector3(-1, -2, -1).normalize(), scene);
	moon.intensity = 0.3;
	moon.diffuse = Color3.FromHexString("#AABBDD");
	moon.specular = Color3.FromHexString("#8899BB");

	// Focos incandescentes interiores — range evita atravesar muros contiguos.
	const livingLight = new PointLight("light_living_f1", house.livingCenter.clone(), scene);
	livingLight.diffuse = Color3.FromHexString("#FFD080");
	livingLight.intensity = 1.2;
	livingLight.range = 6;

	const kitchenLight = new PointLight("light_kitchen_f1", house.kitchenCenter.clone(), scene);
	kitchenLight.diffuse = Color3.FromHexString("#FFD080");
	kitchenLight.intensity = 1.0;
	kitchenLight.range = 5;

	const bedroomLight = new PointLight("light_bedroom_f2", house.bedroomCenter.clone(), scene);
	bedroomLight.diffuse = Color3.FromHexString("#FFD080");
	bedroomLight.intensity = 1.0;
	bedroomLight.range = 5;

	// Spot focalizado hacia la fachada / jardín del patio.
	const patioSpot = new SpotLight(
		"light_patio_spot",
		new Vector3(0, 8, house.facadeTarget.z + 6),
		new Vector3(0, -0.5, -1).normalize(),
		Math.PI / 4,
		2,
		scene,
	);
	patioSpot.diffuse = Color3.FromHexString("#FFEECC");
	patioSpot.intensity = 1.5;
	patioSpot.range = 20;

	// Luz naranja de chimenea con rango corto (parpadeo en setupControls/runGame).
	const fireplaceLight = new PointLight("light_fireplace", house.fireplaceCenter.clone(), scene);
	fireplaceLight.diffuse = Color3.FromHexString("#FF8833");
	fireplaceLight.intensity = 0.8;
	fireplaceLight.range = 3;

	const baseIntensity = fireplaceLight.intensity;
	scene.onBeforeRenderObservable.add(() => {
		const t = performance.now() * 0.003;
		fireplaceLight.intensity = baseIntensity + Math.sin(t * 7) * 0.15 + Math.sin(t * 13) * 0.08;
	});

	return { fireplaceLight };
}
