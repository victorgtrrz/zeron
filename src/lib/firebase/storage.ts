import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getClientStorage } from "./client";

export async function uploadImage(
  file: File,
  path: string
): Promise<string> {
  const storageRef = ref(getClientStorage(), path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

export async function deleteImage(url: string): Promise<void> {
  const storageRef = ref(getClientStorage(), url);
  return deleteObject(storageRef);
}
