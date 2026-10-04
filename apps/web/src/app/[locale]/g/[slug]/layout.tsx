import { db, galleries } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { guestSessionCookieName, verifyGuestToken } from "@/lib/auth";
import GuestLoginForm from "./GuestLoginForm"; // We will create this

export default async function GuestGalleryLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ slug: string; locale: string }>;
}) {
	const { slug } = await params;

	const galleryResult = await db
		.select()
		.from(galleries)
		.where(eq(galleries.slug, slug))
		.limit(1);

	const gallery = galleryResult[0];

	if (!gallery) {
		notFound();
	}

	// Jeśli galeria wymaga hasła
	if (gallery.guestPassword) {
		const cookieStore = await cookies();
		const token = cookieStore.get(guestSessionCookieName(slug))?.value;

		const isAuthorized = verifyGuestToken(token, slug);

		if (!isAuthorized) {
			// Pobierz branding, którego brakuje w `galleries`
			const { galleryBranding } = await import("@wedding-drop/db");
			const brandingResult = await db
				.select()
				.from(galleryBranding)
				.where(eq(galleryBranding.galleryId, gallery.id))
				.limit(1);
			const branding = brandingResult[0];

			return (
				<GuestLoginForm
					slug={slug}
					galleryName={gallery.coupleNames}
					backgroundUrl={
						branding?.backgroundPath
							? `/branding-file/${slug}/${branding.backgroundPath.split("/").pop()}`
							: undefined
					}
					logoUrl={
						branding?.logoPath
							? `/branding-file/${slug}/${branding.logoPath.split("/").pop()}`
							: undefined
					}
				/>
			);
		}
	}

	return <>{children}</>;
}
