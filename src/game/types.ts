import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import type { PointLight } from "@babylonjs/core/Lights/pointLight";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";

export type AnimationName = "idle" | "walk" | "run" | "jump";

export interface CharacterController {
	root: AbstractMesh;
	animations: Partial<Record<AnimationName, AnimationGroup>>;
	playAnimation: (name: AnimationName, loop?: boolean) => void;
	facingOffset: number;
}

export interface HouseRefs {
	root: TransformNode;
	livingCenter: Vector3;
	kitchenCenter: Vector3;
	bedroomCenter: Vector3;
	fireplaceCenter: Vector3;
	facadeTarget: Vector3;
}

export interface LightingRefs {
	fireplaceLight: PointLight;
}

export interface GameMaterials {
	grass: import("@babylonjs/core/Materials/PBR/pbrMaterial").PBRMaterial;
	woodFloor: import("@babylonjs/core/Materials/PBR/pbrMaterial").PBRMaterial;
	concrete: import("@babylonjs/core/Materials/PBR/pbrMaterial").PBRMaterial;
	water: import("@babylonjs/core/Materials/PBR/pbrMaterial").PBRMaterial;
	fire: import("@babylonjs/core/Materials/PBR/pbrMaterial").PBRMaterial;
	lightDome: import("@babylonjs/core/Materials/PBR/pbrMaterial").PBRMaterial;
	deck: import("@babylonjs/core/Materials/PBR/pbrMaterial").PBRMaterial;
}
