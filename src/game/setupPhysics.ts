import type { Scene } from "@babylonjs/core/scene";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import "@babylonjs/core/Collisions/collisionCoordinator";

/** Constantes de gravedad terrestre exigidas en el eje Y (m/s², escala métrica). */
export const GRAVITY_X = 0;
export const GRAVITY_Y = -9.81;
export const GRAVITY_Z = 0;

export const SCENE_GRAVITY = new Vector3(GRAVITY_X, GRAVITY_Y, GRAVITY_Z);

/**
 * Activa colisiones nativas y gravedad activa en el eje Y.
 * El personaje usa scene.gravity para caer y asentarse sobre superficies sólidas.
 */
export function setupPhysics(scene: Scene): void {
	scene.collisionsEnabled = true;
	scene.gravity = SCENE_GRAVITY.clone();
}

/**
 * Colisión sólida obligatoria: paredes, pisos, escaleras y límites del mundo.
 */
export function enableMeshCollision(mesh: AbstractMesh, name?: string): AbstractMesh {
	if (name) {
		mesh.name = name;
	}
	mesh.checkCollisions = true;
	return mesh;
}

/** Superficie superior del piso interior (losa centrada en y=0, altura 0.15). */
export const INTERIOR_FLOOR_Y = 0.08;

/** Elipsoide humanoide del avatar según especificación del taller. */
export const CHARACTER_ELLIPSOID = new Vector3(0.5, 1.0, 0.5);
/** Offset: centro del elipsoide a 1 m sobre el origen → base del elipsoide = position.y */
export const CHARACTER_ELLIPSOID_OFFSET = new Vector3(0, 1.0, 0);

export function configureCharacterCollision(mesh: AbstractMesh): void {
	mesh.ellipsoid = CHARACTER_ELLIPSOID.clone();
	mesh.ellipsoidOffset = CHARACTER_ELLIPSOID_OFFSET.clone();
	mesh.checkCollisions = true;
}
