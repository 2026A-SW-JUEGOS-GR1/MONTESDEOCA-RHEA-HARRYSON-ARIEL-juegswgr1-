import type { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";

/**
 * Sistema de partículas de fuego en la chimenea (efecto requerido del taller).
 * Textura generada en local para no depender del CDN.
 */
export function createFireParticles(scene: Scene, emitterPosition: Vector3): ParticleSystem {
	const flareTex = new DynamicTexture("tex_fire_flare", { width: 64, height: 64 }, scene, false);
	const ctx = flareTex.getContext();
	const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
	gradient.addColorStop(0, "rgba(255,255,255,1)");
	gradient.addColorStop(0.4, "rgba(255,200,80,0.8)");
	gradient.addColorStop(1, "rgba(255,80,0,0)");
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 64, 64);
	flareTex.update();
	flareTex.hasAlpha = true;
	flareTex.wrapU = Texture.CLAMP_ADDRESSMODE;
	flareTex.wrapV = Texture.CLAMP_ADDRESSMODE;

	const fire = new ParticleSystem("fire_particles", 400, scene);
	fire.particleTexture = flareTex;
	fire.emitter = emitterPosition.clone();
	fire.minEmitBox = new Vector3(-0.15, 0, -0.15);
	fire.maxEmitBox = new Vector3(0.15, 0.1, 0.15);

	fire.color1 = new Color4(1, 0.5, 0.1, 1);
	fire.color2 = new Color4(1, 0.2, 0.05, 0.8);
	fire.colorDead = new Color4(0.2, 0.05, 0.01, 0);

	fire.minSize = 0.08;
	fire.maxSize = 0.25;
	fire.minLifeTime = 0.2;
	fire.maxLifeTime = 0.6;
	fire.emitRate = 100;

	fire.blendMode = ParticleSystem.BLENDMODE_ONEONE;
	fire.gravity = new Vector3(0, 1.5, 0);
	fire.direction1 = new Vector3(-0.3, 1, -0.3);
	fire.direction2 = new Vector3(0.3, 2, 0.3);
	fire.minAngularSpeed = -Math.PI;
	fire.maxAngularSpeed = Math.PI;
	fire.minEmitPower = 0.5;
	fire.maxEmitPower = 1.2;
	fire.updateSpeed = 0.01;

	fire.start();
	return fire;
}
