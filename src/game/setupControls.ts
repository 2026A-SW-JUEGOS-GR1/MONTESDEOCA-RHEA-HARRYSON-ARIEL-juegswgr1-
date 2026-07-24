import type { Scene } from "@babylonjs/core/scene";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { FollowCamera } from "@babylonjs/core/Cameras/followCamera";
import { Ray } from "@babylonjs/core/Culling/ray";

import type { AnimationName, CharacterController } from "./types";
import { INTERIOR_FLOOR_Y } from "./setupPhysics";

const WALK_SPEED = 3;
const RUN_SPEED = 6;
const JUMP_FORCE = 6;
const TURN_SPEED = 10;

export interface ControlsSetupResult {
	camera: FollowCamera;
	dispose: () => void;
}

function normalizeAngle(angle: number): number {
	while (angle > Math.PI) {
		angle -= Math.PI * 2;
	}
	while (angle < -Math.PI) {
		angle += Math.PI * 2;
	}
	return angle;
}

/**
 * Follow Camera orbital acoplada al avatar + movimiento WASD/flechas con colisiones.
 */
export function setupControls(
	scene: Scene,
	character: CharacterController,
): ControlsSetupResult {
	const { root, playAnimation, animations, facingOffset } = character;

	const camera = new FollowCamera("followCam", new Vector3(0, 5, -8), scene);
	camera.lockedTarget = root;
	camera.radius = 5;
	camera.heightOffset = 2;
	camera.rotationOffset = 180;
	camera.cameraAcceleration = 0.05;
	camera.maxCameraSpeed = 20;
	camera.inertia = 0.7;
	camera.lowerRadiusLimit = 2.5;
	camera.upperRadiusLimit = 12;
	scene.activeCamera = camera;
	camera.attachControl(true);
	camera.inputs.removeByType("FollowCameraKeyboardMoveInput");

	const keysDown = new Set<string>();
	const onKeyDown = (e: KeyboardEvent) => keysDown.add(e.code);
	const onKeyUp = (e: KeyboardEvent) => keysDown.delete(e.code);
	window.addEventListener("keydown", onKeyDown);
	window.addEventListener("keyup", onKeyUp);

	let verticalVelocity = 0;
	let isJumping = false;
	let currentAnim: AnimationName | "none" = "none";

	const observer = scene.onBeforeRenderObservable.add(() => {
		const dt = scene.getEngine().getDeltaTime() / 1000;
		if (dt <= 0) {
			return;
		}

		const camForward = camera.getForwardRay().direction;
		camForward.y = 0;
		if (camForward.lengthSquared() < 0.001) {
			return;
		}
		camForward.normalize();
		const camRight = Vector3.Cross(Vector3.Up(), camForward).normalize();

		let dirX = 0;
		let dirZ = 0;
		if (keysDown.has("KeyW") || keysDown.has("ArrowUp")) {
			dirX += camForward.x;
			dirZ += camForward.z;
		}
		if (keysDown.has("KeyS") || keysDown.has("ArrowDown")) {
			dirX -= camForward.x;
			dirZ -= camForward.z;
		}
		if (keysDown.has("KeyD") || keysDown.has("ArrowRight")) {
			dirX += camRight.x;
			dirZ += camRight.z;
		}
		if (keysDown.has("KeyA") || keysDown.has("ArrowLeft")) {
			dirX -= camRight.x;
			dirZ -= camRight.z;
		}

		const onGround = isCharacterOnGround(root, scene);

		// Evitar hundimiento: mantener la base del elipsoide sobre la superficie del piso.
		if (onGround && !isJumping) {
			const ellipsoidBase = root.position.y + (root.ellipsoidOffset?.y ?? 0) - (root.ellipsoid?.y ?? 1);
			if (ellipsoidBase < INTERIOR_FLOOR_Y) {
				root.position.y += INTERIOR_FLOOR_Y - ellipsoidBase;
			}
		}

		if (onGround && !isJumping) {
			verticalVelocity = 0;
		} else {
			// Gravedad activa del eje Y definida en scene.gravity (setupPhysics).
			verticalVelocity += scene.gravity.y * dt;
		}

		if ((keysDown.has("Space") || keysDown.has("KeyJ")) && onGround && !isJumping) {
			verticalVelocity = JUMP_FORCE;
			isJumping = true;
			if (animations.jump) {
				playAnimation("jump", false);
				currentAnim = "jump";
			}
		}

		if (onGround && isJumping && verticalVelocity <= 0) {
			isJumping = false;
		}

		const isMoving = Math.abs(dirX) > 0.001 || Math.abs(dirZ) > 0.001;
		const running = keysDown.has("ShiftLeft") || keysDown.has("ShiftRight");
		const speed = running ? RUN_SPEED : WALK_SPEED;

		if (isMoving) {
			const len = Math.sqrt(dirX * dirX + dirZ * dirZ);
			const moveX = (dirX / len) * speed * dt;
			const moveZ = (dirZ / len) * speed * dt;

			// Girar suavemente hacia la dirección de movimiento (relativa a cámara).
			const targetY = Math.atan2(dirX, dirZ) + facingOffset;
			const currentY = root.rotation.y;
			const deltaY = normalizeAngle(targetY - currentY);
			root.rotation.y = currentY + deltaY * Math.min(1, TURN_SPEED * dt);

			root.moveWithCollisions(new Vector3(moveX, verticalVelocity * dt, moveZ));

			if (!isJumping) {
				const animName: AnimationName = running && animations.run ? "run" : "walk";
				if (currentAnim !== animName) {
					if (animations[animName] || animations.walk) {
						playAnimation(animations[animName] ? animName : "walk");
						currentAnim = animations[animName] ? animName : "walk";
					}
				}
			}
		} else {
			root.moveWithCollisions(new Vector3(0, verticalVelocity * dt, 0));
			if (!isJumping && currentAnim !== "idle" && animations.idle) {
				playAnimation("idle");
				currentAnim = "idle";
			}
		}

		if (isJumping && onGround && currentAnim === "jump") {
			currentAnim = "none";
		}
	});

	return {
		camera,
		dispose: () => {
			scene.onBeforeRenderObservable.remove(observer);
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
			camera.detachControl();
		},
	};
}

function isCharacterOnGround(root: AbstractMesh, scene: Scene): boolean {
	const offsetY = root.ellipsoidOffset?.y ?? 0;
	const halfH = root.ellipsoid?.y ?? 1;
	const ellipsoidBase = root.position.y + offsetY - halfH;
	const rayOrigin = new Vector3(root.position.x, ellipsoidBase + 0.05, root.position.z);
	const ray = new Ray(rayOrigin, Vector3.Down(), halfH + 0.3);
	const hit = scene.pickWithRay(ray, (mesh) => mesh.checkCollisions && mesh !== root);
	return hit?.hit === true;
}
