import type { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

import type { GameMaterials, HouseRefs } from "./types";
import { enableMeshCollision } from "./setupPhysics";

const HOUSE_W = 14;
const HOUSE_D = 12;
const FLOOR_H = 3;
const WALL_T = 0.2;
const PATIO_EXT = 10;

function createWall(
	scene: Scene,
	parent: TransformNode,
	name: string,
	width: number,
	height: number,
	depth: number,
	position: Vector3,
	material: GameMaterials["concrete"],
): void {
	const wall = MeshBuilder.CreateBox(name, { width, height, depth }, scene);
	wall.parent = parent;
	wall.position = position;
	wall.material = material;
	enableMeshCollision(wall);
}

function createFloorSlab(
	scene: Scene,
	parent: TransformNode,
	name: string,
	width: number,
	depth: number,
	y: number,
	material: GameMaterials["woodFloor"],
	x = 0,
	z = 0,
): void {
	const slab = MeshBuilder.CreateBox(name, { width, height: 0.15, depth }, scene);
	slab.parent = parent;
	slab.position = new Vector3(x, y, z);
	slab.material = material;
	enableMeshCollision(slab);
}

/** Plano horizontal (primitivo Plane/Ground) con colisión sólida. */
function createPlaneFloor(
	scene: Scene,
	parent: TransformNode,
	name: string,
	width: number,
	depth: number,
	y: number,
	position: Vector3,
	material: GameMaterials["grass"] | GameMaterials["water"] | GameMaterials["deck"],
): void {
	const plane = MeshBuilder.CreateGround(name, { width, height: depth, subdivisions: 2 }, scene);
	plane.parent = parent;
	plane.position = new Vector3(position.x, y, position.z);
	plane.material = material;
	enableMeshCollision(plane);
}

/** Pilar estructural (primitivo Cylinder). */
function createPillar(
	scene: Scene,
	parent: TransformNode,
	name: string,
	height: number,
	position: Vector3,
	material: GameMaterials["concrete"],
): void {
	const pillar = MeshBuilder.CreateCylinder(name, { height, diameter: 0.45, tessellation: 12 }, scene);
	pillar.parent = parent;
	pillar.position = position;
	pillar.material = material;
	enableMeshCollision(pillar);
}

/** Domo de luz (primitivo Sphere) para iluminación estética interior. */
function createLightDome(
	scene: Scene,
	parent: TransformNode,
	name: string,
	position: Vector3,
	material: GameMaterials["lightDome"],
): void {
	const dome = MeshBuilder.CreateSphere(name, { diameter: 0.55, segments: 12 }, scene);
	dome.parent = parent;
	dome.position = position;
	dome.material = material;
}

/**
 * Residencia de 2 plantas — exclusivamente primitivos Babylon.js:
 * Boxes (paredes/pisos), Planes (patio/piscina), Cylinders (pilares), Spheres (domos/fuego).
 */
export function createHouse(scene: Scene, materials: GameMaterials): HouseRefs {
	const root = new TransformNode("house_root", scene);

	const houseCenterZ = -PATIO_EXT / 2;
	const livingCenter = new Vector3(-3, FLOOR_H * 0.5 + 0.5, houseCenterZ + 1);
	const kitchenCenter = new Vector3(3.5, FLOOR_H * 0.5 + 0.5, houseCenterZ + 1);
	const bedroomCenter = new Vector3(-3, FLOOR_H * 1.5 + FLOOR_H * 0.5, houseCenterZ + 1);
	const fireplaceCenter = new Vector3(-5.5, 0.8, houseCenterZ - 2.5);
	const facadeTarget = new Vector3(0, FLOOR_H, houseCenterZ + HOUSE_D / 2 + 2);

	// Patio exterior — Plano (Ground) con textura de césped
	createPlaneFloor(
		scene, root, "house_yard_ground", 24, 24, 0,
		new Vector3(0, 0, houseCenterZ), materials.grass,
	);

	// Borde perimetral del patio (evita caer al vacío)
	const yardBounds = [
		{ w: 24, d: 0.3, x: 0, z: houseCenterZ - 12 },
		{ w: 24, d: 0.3, x: 0, z: houseCenterZ + 12 },
		{ w: 0.3, d: 24, x: -12, z: houseCenterZ },
		{ w: 0.3, d: 24, x: 12, z: houseCenterZ },
	];
	yardBounds.forEach((b, i) => {
		createWall(scene, root, `house_yard_boundary_${i}`, b.w, 0.5, b.d,
			new Vector3(b.x, 0.25, b.z), materials.concrete);
	});

	// Camino de entrada — Box
	const path = MeshBuilder.CreateBox("house_entry_path", { width: 2.5, height: 0.05, depth: PATIO_EXT + 2 }, scene);
	path.parent = root;
	path.position = new Vector3(0, 0.03, houseCenterZ + HOUSE_D / 2 + PATIO_EXT / 2);
	path.material = materials.deck;
	enableMeshCollision(path);

	// Piscina — Plano de agua + borde Box
	const poolDeck = MeshBuilder.CreateBox("house_pool_deck", { width: 6, height: 0.12, depth: 5 }, scene);
	poolDeck.parent = root;
	poolDeck.position = new Vector3(6, 0.04, houseCenterZ + 5);
	poolDeck.material = materials.deck;
	enableMeshCollision(poolDeck);

	createPlaneFloor(
		scene, root, "house_pool_water", 4.2, 3.2, 0.01,
		new Vector3(6, 0, houseCenterZ + 5), materials.water,
	);

	// --- PLANTA BAJA (nivel 1) ---
	createFloorSlab(scene, root, "house_floor1_ground", HOUSE_W, HOUSE_D, 0, materials.woodFloor, 0, houseCenterZ);

	// Pilares estructurales en esquinas (Cylinders)
	const pillarPositions = [
		new Vector3(-HOUSE_W / 2 + 0.5, FLOOR_H, houseCenterZ - HOUSE_D / 2 + 0.5),
		new Vector3(HOUSE_W / 2 - 0.5, FLOOR_H, houseCenterZ - HOUSE_D / 2 + 0.5),
		new Vector3(-HOUSE_W / 2 + 0.5, FLOOR_H, houseCenterZ + HOUSE_D / 2 - 0.5),
		new Vector3(HOUSE_W / 2 - 0.5, FLOOR_H, houseCenterZ + HOUSE_D / 2 - 0.5),
	];
	pillarPositions.forEach((pos, i) => {
		createPillar(scene, root, `house_pillar_f1_${i}`, FLOOR_H * 2, pos, materials.concrete);
	});

	// Paredes perimetrales (Boxes — concreto)
	createWall(scene, root, "house_floor1_wall_n", HOUSE_W, FLOOR_H, WALL_T, new Vector3(0, FLOOR_H / 2, houseCenterZ - HOUSE_D / 2), materials.concrete);
	createWall(scene, root, "house_floor1_wall_w", WALL_T, FLOOR_H, HOUSE_D, new Vector3(-HOUSE_W / 2, FLOOR_H / 2, houseCenterZ), materials.concrete);
	createWall(scene, root, "house_floor1_wall_e", WALL_T, FLOOR_H, HOUSE_D, new Vector3(HOUSE_W / 2, FLOOR_H / 2, houseCenterZ), materials.concrete);
	createWall(scene, root, "house_floor1_divider", WALL_T, FLOOR_H, 7, new Vector3(0.5, FLOOR_H / 2, houseCenterZ + 1.5), materials.concrete);

	const doorGap = 2.5;
	createWall(scene, root, "house_floor1_wall_s_l", (HOUSE_W - doorGap) / 2, FLOOR_H, WALL_T, new Vector3(-(HOUSE_W + doorGap) / 4, FLOOR_H / 2, houseCenterZ + HOUSE_D / 2), materials.concrete);
	createWall(scene, root, "house_floor1_wall_s_r", (HOUSE_W - doorGap) / 2, FLOOR_H, WALL_T, new Vector3((HOUSE_W + doorGap) / 4, FLOOR_H / 2, houseCenterZ + HOUSE_D / 2), materials.concrete);

	// Domos de luz planta baja (Spheres)
	createLightDome(scene, root, "house_light_dome_living_f1", new Vector3(livingCenter.x, FLOOR_H - 0.3, livingCenter.z), materials.lightDome);
	createLightDome(scene, root, "house_light_dome_kitchen_f1", new Vector3(kitchenCenter.x, FLOOR_H - 0.3, kitchenCenter.z), materials.lightDome);

	// Chimenea: leños (Cylinders) + fuego (Sphere)
	const chimneyBase = MeshBuilder.CreateBox("house_fireplace_base", { width: 1.6, height: 1.2, depth: 0.8 }, scene);
	chimneyBase.parent = root;
	chimneyBase.position = new Vector3(-5.5, 0.6, houseCenterZ - 2.5);
	chimneyBase.material = materials.concrete;
	enableMeshCollision(chimneyBase);

	[
		new Vector3(-5.7, 0.2, houseCenterZ - 2.7),
		new Vector3(-5.3, 0.2, houseCenterZ - 2.3),
	].forEach((pos, i) => {
		const log = MeshBuilder.CreateCylinder(`house_fireplace_log_${i}`, { height: 0.5, diameter: 0.12 }, scene);
		log.parent = root;
		log.rotation.z = Math.PI / 2;
		log.position = pos;
		log.material = materials.deck;
		enableMeshCollision(log);
	});

	const fireCore = MeshBuilder.CreateSphere("house_fireplace_fire", { diameter: 0.4, segments: 8 }, scene);
	fireCore.parent = root;
	fireCore.position = fireplaceCenter.clone();
	fireCore.material = materials.fire;
	enableMeshCollision(fireCore);

	// --- PLANTA ALTA (nivel 2) — entrepiso con hueco de escaleras ---
	const stairX = 5;
	const stairZ = houseCenterZ - 1.5;
	const stairHoleW = 2;
	const stairHoleD = 4;

	createFloorSlab(scene, root, "house_floor2_slab_w", HOUSE_W / 2 - stairHoleW / 2, HOUSE_D, FLOOR_H, materials.woodFloor, -HOUSE_W / 4 - stairHoleW / 4, houseCenterZ);
	createFloorSlab(scene, root, "house_floor2_slab_e", HOUSE_W / 2 - stairHoleW / 2, HOUSE_D, FLOOR_H, materials.woodFloor, HOUSE_W / 4 + stairHoleW / 4, houseCenterZ);
	createFloorSlab(scene, root, "house_floor2_slab_n", stairHoleW, HOUSE_D / 2 - stairHoleD / 2, FLOOR_H, materials.woodFloor, stairX, houseCenterZ - HOUSE_D / 4 - stairHoleD / 4);
	createFloorSlab(scene, root, "house_floor2_slab_s", stairHoleW, HOUSE_D / 2 - stairHoleD / 2, FLOOR_H, materials.woodFloor, stairX, houseCenterZ + HOUSE_D / 4 + stairHoleD / 4);

	const y2 = FLOOR_H + FLOOR_H / 2;
	createWall(scene, root, "house_floor2_wall_n", HOUSE_W, FLOOR_H, WALL_T, new Vector3(0, y2, houseCenterZ - HOUSE_D / 2), materials.concrete);
	createWall(scene, root, "house_floor2_wall_s", HOUSE_W, FLOOR_H, WALL_T, new Vector3(0, y2, houseCenterZ + HOUSE_D / 2), materials.concrete);
	createWall(scene, root, "house_floor2_wall_w", WALL_T, FLOOR_H, HOUSE_D, new Vector3(-HOUSE_W / 2, y2, houseCenterZ), materials.concrete);
	createWall(scene, root, "house_floor2_wall_e", WALL_T, FLOOR_H, HOUSE_D, new Vector3(HOUSE_W / 2, y2, houseCenterZ), materials.concrete);
	createWall(scene, root, "house_floor2_divider", WALL_T, FLOOR_H, 7, new Vector3(0.5, y2, houseCenterZ + 1.5), materials.concrete);

	// Domo de luz dormitorio (Sphere)
	createLightDome(scene, root, "house_light_dome_bedroom_f2", new Vector3(bedroomCenter.x, FLOOR_H * 2 - 0.3, bedroomCenter.z), materials.lightDome);

	// Techo (Box) + chimenea (Box)
	const roof = MeshBuilder.CreateBox("house_roof", { width: HOUSE_W + 0.6, height: 0.25, depth: HOUSE_D + 0.6 }, scene);
	roof.parent = root;
	roof.position = new Vector3(0, FLOOR_H * 2 + 0.12, houseCenterZ);
	roof.material = materials.concrete;
	enableMeshCollision(roof);

	const chimneyStack = MeshBuilder.CreateBox("house_chimney_stack", { width: 0.8, height: 2.5, depth: 0.8 }, scene);
	chimneyStack.parent = root;
	chimneyStack.position = new Vector3(-5.5, FLOOR_H * 2 + 1.4, houseCenterZ - 2.5);
	chimneyStack.material = materials.concrete;
	enableMeshCollision(chimneyStack);

	// Escaleras (Boxes escalonados) + barandilla (Cylinders)
	const stepCount = 12;
	const stepW = 1.4;
	const stepD = 0.28;
	const stepH = FLOOR_H / stepCount;
	for (let i = 0; i < stepCount; i++) {
		const step = MeshBuilder.CreateBox(
			`house_stairs_step_${String(i + 1).padStart(2, "0")}`,
			{ width: stepW, height: stepH, depth: stepD },
			scene,
		);
		step.parent = root;
		step.position = new Vector3(stairX, stepH * (i + 0.5), stairZ + i * stepD);
		step.material = materials.woodFloor;
		enableMeshCollision(step);

		const railL = MeshBuilder.CreateCylinder(`house_stairs_rail_l_${i}`, { height: 0.7, diameter: 0.06 }, scene);
		railL.parent = root;
		railL.position = new Vector3(stairX - stepW / 2 - 0.05, stepH * (i + 1) + 0.35, stairZ + i * stepD);
		railL.material = materials.deck;
		enableMeshCollision(railL);

		const railR = MeshBuilder.CreateCylinder(`house_stairs_rail_r_${i}`, { height: 0.7, diameter: 0.06 }, scene);
		railR.parent = root;
		railR.position = new Vector3(stairX + stepW / 2 + 0.05, stepH * (i + 1) + 0.35, stairZ + i * stepD);
		railR.material = materials.deck;
		enableMeshCollision(railR);
	}

	return {
		root,
		livingCenter,
		kitchenCenter,
		bedroomCenter,
		fireplaceCenter,
		facadeTarget,
	};
}
