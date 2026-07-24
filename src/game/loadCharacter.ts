import type { Scene } from "@babylonjs/core/scene";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";

import type { AnimationName, CharacterController } from "./types";
import { configureCharacterCollision, INTERIOR_FLOOR_Y } from "./setupPhysics";

const AVATAR_PATH = "/assets/models/";
const AVATAR_FILE = "avatar.glb";
const SPAWN_POSITION = new Vector3(-2, INTERIOR_FLOOR_Y, -3);

const MIXAMO_FACING_OFFSET = 0;

const ANIMATION_ALIASES: Record<AnimationName, string[]> = {
	idle: ["idle", "standing", "stand"],
	walk: ["walk", "walking"],
	run: ["run", "running", "sprint"],
	jump: ["jump", "jumping"],
};

function findAnimationGroup(
	groups: import("@babylonjs/core/Animations/animationGroup").AnimationGroup[],
	name: AnimationName,
): import("@babylonjs/core/Animations/animationGroup").AnimationGroup | undefined {
	const aliases = ANIMATION_ALIASES[name];
	return groups.find((group) =>
		aliases.some((alias) => group.name.toLowerCase().includes(alias)),
	);
}

function normalizeCharacterScale(node: TransformNode | AbstractMesh): void {
	const bounds = node.getHierarchyBoundingVectors(true);
	const height = bounds.max.y - bounds.min.y;
	if (height > 0 && Math.abs(height - 1.8) > 0.3) {
		const scale = 1.8 / height;
		node.scaling.scaleInPlace(scale);
	}
}

/** Alinea los pies del modelo visual con la superficie del piso. */
function alignModelFeetToFloor(modelRoot: TransformNode | AbstractMesh, floorY: number): void {
	modelRoot.computeWorldMatrix(true);
	const bounds = modelRoot.getHierarchyBoundingVectors(true);
	const correction = floorY - bounds.min.y;
	if (Math.abs(correction) > 0.001) {
		modelRoot.position.y += correction;
	}
}

function createCollisionCollider(scene: Scene): AbstractMesh {
	const collider = MeshBuilder.CreateCapsule(
		"character_collider",
		{ height: 1.8, radius: 0.35, tessellation: 12 },
		scene,
	);
	collider.isVisible = false;
	configureCharacterCollision(collider);
	return collider;
}

function createPlaceholderCharacter(scene: Scene): CharacterController {
	console.warn(
		`No se encontró ${AVATAR_PATH}${AVATAR_FILE}. Usando cápsula placeholder.`,
	);

	const body = MeshBuilder.CreateCapsule("character_root", { height: 1.8, radius: 0.35 }, scene);
	const mat = new PBRMaterial("character_placeholder_mat", scene);
	mat.albedoColor = Color3.FromHexString("#4488CC");
	mat.metallic = 0;
	mat.roughness = 0.6;
	body.material = mat;
	configureCharacterCollision(body);
	body.position = SPAWN_POSITION.clone();

	return buildController(body, {}, () => {}, 0);
}

function buildController(
	root: AbstractMesh,
	animations: CharacterController["animations"],
	playAnimationImpl: CharacterController["playAnimation"],
	facingOffset: number,
): CharacterController {
	return { root, animations, playAnimation: playAnimationImpl, facingOffset };
}

function attachModelToCollider(
	collider: AbstractMesh,
	result: Awaited<ReturnType<typeof SceneLoader.ImportMeshAsync>>,
	floorY: number,
): TransformNode | AbstractMesh {
	const modelRoot =
		result.transformNodes.find((n) => n.name === "Armature") ??
		result.transformNodes.find((n) => n.name !== "__root__") ??
		result.transformNodes[0] ??
		result.meshes.find((m) => m.name === "__root__") ??
		result.meshes[0];

	modelRoot.parent = collider;
	modelRoot.position = Vector3.Zero();
	modelRoot.rotation.y = 0;

	normalizeCharacterScale(modelRoot as TransformNode);
	alignModelFeetToFloor(modelRoot, floorY);

	return modelRoot;
}

export async function loadCharacter(scene: Scene): Promise<CharacterController> {
	const animations: CharacterController["animations"] = {};
	let currentGroup: import("@babylonjs/core/Animations/animationGroup").AnimationGroup | undefined;
	let currentAnim: AnimationName | null = null;

	const playAnimation = (name: AnimationName, loop = true): void => {
		const next = animations[name];
		if (!next) {
			return;
		}
		if (currentAnim === name && next.isPlaying) {
			return;
		}
		if (currentGroup && currentGroup !== next) {
			currentGroup.stop();
		}
		currentAnim = name;
		currentGroup = next;
		next.start(loop, 1, next.from, next.to, false);
	};

	try {
		const result = await SceneLoader.ImportMeshAsync("", AVATAR_PATH, AVATAR_FILE, scene);
		const collider = createCollisionCollider(scene);
		collider.name = "character_root";
		// Elipsoide con offset Y=1 → la base del collider coincide con position.y = superficie del piso
		collider.position = SPAWN_POSITION.clone();

		attachModelToCollider(collider, result, INTERIOR_FLOOR_Y);

		for (const name of Object.keys(ANIMATION_ALIASES) as AnimationName[]) {
			const group = findAnimationGroup(result.animationGroups, name);
			if (group) {
				animations[name] = group;
			}
		}

		if (animations.idle) {
			playAnimation("idle");
		}

		return buildController(collider, animations, playAnimation, MIXAMO_FACING_OFFSET);
	} catch (error) {
		console.error("Error al cargar avatar.glb:", error);
		return createPlaceholderCharacter(scene);
	}
}
