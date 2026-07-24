"use client";

import { useEffect, useRef } from "react";

import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";

import "@babylonjs/core/Collisions/collisionCoordinator";
import "@babylonjs/core/Particles/particleSystem";
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Cameras/followCamera";
import "@babylonjs/core/Meshes/groundMesh";
import "@babylonjs/core/Lights/directionalLight";
import "@babylonjs/core/Lights/pointLight";
import "@babylonjs/core/Lights/spotLight";
import "@babylonjs/core/Materials/PBR/pbrMaterial";
import "@babylonjs/materials/sky";
import "@babylonjs/loaders/glTF";

import { runGame } from "@/game/runGame";

export default function BabylonGame() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		const engine = new Engine(canvas, true, {
			stencil: true,
			antialias: true,
			audioEngine: true,
			adaptToDeviceRatio: true,
			disableWebGL2Support: false,
			useHighPrecisionFloats: true,
			powerPreference: "high-performance",
			failIfMajorPerformanceCaveat: false,
		});

		const scene = new Scene(engine);
		let disposeGame: (() => void) | undefined;
		let cancelled = false;

		runGame(engine, scene).then((game) => {
			if (cancelled) {
				game.dispose();
				return;
			}
			disposeGame = game.dispose;
		});

		const onResize = () => engine.resize();
		window.addEventListener("resize", onResize);

		return () => {
			cancelled = true;
			disposeGame?.();
			scene.dispose();
			engine.dispose();
			window.removeEventListener("resize", onResize);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="w-full h-full outline-none select-none"
			tabIndex={0}
			onMouseDown={(e) => e.currentTarget.focus()}
		/>
	);
}
