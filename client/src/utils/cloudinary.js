/**
 * Cloudinary Media Transformation & Thumbnail Helpers for AURA 2K26
 */

/**
 * Generates an image thumbnail for an Abstract PDF using Cloudinary's page-1 rasterizer
 */
export const getPdfPreviewUrl = (pdfUrl) => {
  if (!pdfUrl) return "";
  if (typeof pdfUrl !== "string") return "";

  if (pdfUrl.includes("res.cloudinary.com")) {
    // Cloudinary natively transforms the first page of any PDF to PNG/JPG
    return pdfUrl.replace(/\.pdf$/i, ".png");
  }

  return pdfUrl;
};

/**
 * Generates a high-performance, compressed thumbnail for ID cards and media previews
 */
export const getThumbnailUrl = (imageUrl, width = 140, height = 100) => {
  if (!imageUrl) return "";
  if (typeof imageUrl !== "string") return "";

  if (imageUrl.includes("res.cloudinary.com") && imageUrl.includes("/upload/")) {
    return imageUrl.replace(
      "/upload/",
      `/upload/c_fill,w_${width},h_${height},g_auto,q_auto,f_auto/`
    );
  }

  return imageUrl;
};

/**
 * Extracts all submitted ID cards from a registration record
 */
export const extractIdCards = (reg) => {
  if (!reg) return [];
  const cards = [];

  if (reg.teamLeaderIdCard) {
    cards.push({
      role: "Team Leader",
      name: reg.teamLeaderName || "Leader",
      url: reg.teamLeaderIdCard,
      thumb: getThumbnailUrl(reg.teamLeaderIdCard, 160, 110),
    });
  }

  if (reg.member1IdCard) {
    cards.push({
      role: "Member 1",
      name: "Team Member 1",
      url: reg.member1IdCard,
      thumb: getThumbnailUrl(reg.member1IdCard, 160, 110),
    });
  }

  if (reg.member2IdCard) {
    cards.push({
      role: "Member 2",
      name: "Team Member 2",
      url: reg.member2IdCard,
      thumb: getThumbnailUrl(reg.member2IdCard, 160, 110),
    });
  }

  if (reg.member3IdCard) {
    cards.push({
      role: "Member 3",
      name: "Team Member 3",
      url: reg.member3IdCard,
      thumb: getThumbnailUrl(reg.member3IdCard, 160, 110),
    });
  }

  return cards;
};
