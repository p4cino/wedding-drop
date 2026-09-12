// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MediaGrid from "@/components/MediaGrid";
import { MediaItemData } from "@/components/LightboxModal";

describe("MediaGrid Component", () => {
  it("powinien wyświetlać komunikat o pustej galerii, gdy brak elementów", () => {
    render(<MediaGrid items={[]} onItemClick={vi.fn()} />);
    expect(screen.getByText(/Galeria czeka na pierwsze zdjęcia!/i)).toBeInTheDocument();
  });

  it("powinien renderować listę miniatur zdjęć i filmów oraz obsługiwać kliknięcie", () => {
    const mockItems: MediaItemData[] = [
      {
        id: "1",
        uploaderName: "Wujek Staszek",
        fileType: "image",
        mimeType: "image/jpeg",
        originalFileName: "taniec.jpg",
        thumbUrl: "/thumb1.webp",
        rawUrl: "/raw1.jpg",
        createdAt: "2026-09-12",
      },
      {
        id: "2",
        uploaderName: "", // Test domyślnego podpisu "Gość"
        fileType: "video",
        mimeType: "video/mp4",
        originalFileName: "toast.mp4",
        thumbUrl: "/thumb2.webp",
        rawUrl: "/raw2.mp4",
        createdAt: "2026-09-12",
      },
    ];

    const onItemClick = vi.fn();
    render(<MediaGrid items={mockItems} onItemClick={onItemClick} />);

    expect(screen.getByText("Wujek Staszek")).toBeInTheDocument();
    expect(screen.getByText("Gość")).toBeInTheDocument();

    // Kliknięcie w pierwsze zdjęcie
    const images = screen.getAllByRole("img");
    expect(images.length).toBe(2);
    fireEvent.click(images[0]);
    expect(onItemClick).toHaveBeenCalledWith(0);

    // Kliknięcie w drugie zdjęcie
    fireEvent.click(images[1]);
    expect(onItemClick).toHaveBeenCalledWith(1);
  });
});
