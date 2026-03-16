import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { getClientAuth } from "./client";

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(getClientAuth(), email, password);
}

export async function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(getClientAuth(), email, password);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(getClientAuth(), provider);
}

export async function signInWithApple() {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  return signInWithPopup(getClientAuth(), provider);
}

export async function signOutUser() {
  document.cookie = "__session=; path=/; max-age=0";
  return signOut(getClientAuth());
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(getClientAuth(), email);
}

export async function updateUserPassword(
  currentPassword: string,
  newPassword: string
) {
  const user = getClientAuth().currentUser;
  if (!user || !user.email) throw new Error("No authenticated user");

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  return updatePassword(user, newPassword);
}
