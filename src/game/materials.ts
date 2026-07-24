import type { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";

import type { GameMaterials } from "./types";

/** Textura procedural de vetas de madera para suelos y escaleras. */
function createWoodTexture(scene: Scene): DynamicTexture {
	const tex = new DynamicTexture("tex_wood", { width: 512, height: 512 }, scene);
	const ctx = tex.getContext();
	const w = 512;
	const h = 512;
	ctx.fillStyle = "#6B4423";
	ctx.fillRect(0, 0, w, h);
	for (let y = 0; y < h; y += 6) {
		const shade = 90 + Math.floor(Math.random() * 40);
		ctx.fillStyle = `rgb(${shade + 30}, ${shade}, ${shade - 20})`;
		ctx.fillRect(0, y, w, 3);
	}
	for (let x = 0; x < w; x += 80) {
		ctx.strokeStyle = "rgba(40, 25, 10, 0.35)";
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x + 20, h);
		ctx.stroke();
	}
	tex.update();
	return tex;
}

/** Textura procedural de concreto para paredes y pilares. */
function createConcreteTexture(scene: Scene): DynamicTexture {
	const tex = new DynamicTexture("tex_concrete", { width: 512, height: 512 }, scene);
	const ctx = tex.getContext();
	ctx.fillStyle = "#A8A098";
	ctx.fillRect(0, 0, 512, 512);
	for (let i = 0; i < 3000; i++) {
		const x = Math.random() * 512;
		const y = Math.random() * 512;
		const g = 140 + Math.floor(Math.random() * 50);
		ctx.fillStyle = `rgba(${g}, ${g - 5}, ${g - 10}, 0.4)`;
		ctx.fillRect(x, y, 2, 2);
	}
	tex.update();
	return tex;
}

/** Textura de césped para el plano del patio. */
function createGrassTexture(scene: Scene): DynamicTexture {
	const tex = new DynamicTexture("tex_grass", { width: 256, height: 256 }, scene);
	const ctx = tex.getContext();
	ctx.fillStyle = "#1a4d2e";
	ctx.fillRect(0, 0, 256, 256);
	for (let i = 0; i < 2000; i++) {
		const x = Math.random() * 256;
		const y = Math.random() * 256;
		ctx.fillStyle = Math.random() > 0.5 ? "#226633" : "#154422";
		ctx.fillRect(x, y, 1, 3);
	}
	tex.update();
	return tex;
}

export function createGameMaterials(scene: Scene): GameMaterials {
	const woodTex = createWoodTexture(scene);
	const concreteTex = createConcreteTexture(scene);
	const grassTex = createGrassTexture(scene);

	// Madera: roughness baja simula piso pulido con textura de vetas.
	const woodFloor = new PBRMaterial("mat_wood_floor", scene);
	woodFloor.albedoTexture = woodTex;
	woodFloor.metallic = 0;
	woodFloor.roughness = 0.2;

	// Concreto: textura granulada para muros estructurales.
	const concrete = new PBRMaterial("mat_concrete", scene);
	concrete.albedoTexture = concreteTex;
	concrete.metallic = 0;
	concrete.roughness = 0.85;

	const grass = new PBRMaterial("mat_grass", scene);
	grass.albedoTexture = grassTex;
	grass.metallic = 0;
	grass.roughness = 1.0;

	// Agua de piscina: translúcida y reflectante.
	const water = new PBRMaterial("mat_pool_water", scene);
	water.albedoColor = Color3.FromHexString("#1a6b7a");
	water.metallic = 0.1;
	water.roughness = 0.05;
	water.alpha = 0.6;
	water.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;

	// Fuego emisivo (complemento visual a las partículas).
	const fire = new PBRMaterial("mat_fireplace_fire", scene);
	fire.albedoColor = Color3.FromHexString("#FF6600");
	fire.emissiveColor = Color3.FromHexString("#FFAA00");
	fire.metallic = 0;
	fire.roughness = 0.4;

	// Domos de luz: esferas emisivas cálidas en habitaciones.
	const lightDome = new PBRMaterial("mat_light_dome", scene);
	lightDome.albedoColor = Color3.FromHexString("#FFF0CC");
	lightDome.emissiveColor = Color3.FromHexString("#FFD080");
	lightDome.alpha = 0.75;
	lightDome.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
	lightDome.metallic = 0;
	lightDome.roughness = 0.2;

	const deck = new PBRMaterial("mat_pool_deck", scene);
	deck.albedoTexture = woodTex;
	deck.metallic = 0;
	deck.roughness = 0.75;

	return { grass, woodFloor, concrete, water, fire, lightDome, deck };
}
