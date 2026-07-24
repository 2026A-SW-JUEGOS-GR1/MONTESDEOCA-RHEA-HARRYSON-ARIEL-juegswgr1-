"use client";

import dynamic from "next/dynamic";

const BabylonGame = dynamic(() => import("@/game/BabylonGame"), {
	ssr: false,
	loading: () => (
		<div className="flex h-screen w-screen items-center justify-center bg-black text-white">
			Cargando escena 3D…
		</div>
	),
});

export default function Home() {
	return (
		<main className="flex h-screen w-screen flex-col items-center justify-between">
			<BabylonGame />
		</main>
	);
}
