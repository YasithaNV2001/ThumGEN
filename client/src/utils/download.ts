// Downloads a Cloudinary image with a readable filename, using the fl_attachment flag
export const downloadImage = (imageUrl: string, title = "thumbnail") => {
  const filename = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "thumbnail";
  const secureUrl = imageUrl.replace(/^http:\/\//i, "https://");
  const downloadUrl = secureUrl.replace("/upload/", `/upload/fl_attachment:${filename}/`);

  const link = document.createElement("a");
  link.href = downloadUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
};
