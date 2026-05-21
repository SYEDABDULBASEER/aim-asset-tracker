import { getDownloadURL, getMetadata, listAll, ref, uploadBytes, type StorageReference } from "firebase/storage";
import { getFirebaseStorage } from "./init";

export type AssetDocument = {
  name: string;
  path: string;
  url: string;
  size: number;
  contentType: string | null;
};

function assetDocumentsRoot(assetId: string): StorageReference {
  return ref(getFirebaseStorage(), `assets/${assetId}/documents`);
}

export async function listAssetDocuments(assetId: string): Promise<AssetDocument[]> {
  const listing = await listAll(assetDocumentsRoot(assetId));
  const documents = await Promise.all(
    listing.items.map(async (itemRef) => {
      const [url, metadata] = await Promise.all([getDownloadURL(itemRef), getMetadata(itemRef)]);
      return {
        name: itemRef.name,
        path: itemRef.fullPath,
        url,
        size: metadata.size,
        contentType: metadata.contentType ?? null,
      };
    }),
  );
  return documents.sort((a, b) => a.name.localeCompare(b.name));
}

export async function uploadAssetDocument(assetId: string, file: File): Promise<AssetDocument> {
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const objectRef = ref(assetDocumentsRoot(assetId), `${Date.now()}-${safeName}`);
  await uploadBytes(objectRef, file, { contentType: file.type || undefined });
  const url = await getDownloadURL(objectRef);
  return {
    name: objectRef.name,
    path: objectRef.fullPath,
    url,
    size: file.size,
    contentType: file.type || null,
  };
}
