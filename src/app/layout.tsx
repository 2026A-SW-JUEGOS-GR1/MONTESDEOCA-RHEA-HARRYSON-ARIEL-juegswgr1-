import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Casa Babylon.js — Taller",
	description: "Entorno interactivo en tercera persona con Babylon.js",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="es">
			<body className="m-0 overflow-hidden bg-black antialiased">{children}</body>
		</html>
	);
}
