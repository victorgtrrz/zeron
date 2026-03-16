/**
 * Zeron — Set admin custom claim
 *
 * Usage:  npx tsx scripts/set-admin.ts admin@example.com
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

import { initializeApp, cert, getApps, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// ── Initialize Admin SDK ──

function initAdmin() {
  if (getApps().length) return;

  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };

  initializeApp({ credential: cert(serviceAccount) });
}

initAdmin();

const auth = getAuth();
const db = getFirestore();

async function setAdmin(email: string) {
  console.log(`Setting admin privileges for: ${email}\n`);

  // 1. Find user by email
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code === "auth/user-not-found") {
      console.error(`Error: No user found with email "${email}".`);
      console.error("Make sure the user has signed up first.");
      process.exit(1);
    }
    throw err;
  }

  console.log(`Found user: ${userRecord.uid} (${userRecord.displayName ?? "no display name"})`);

  // 2. Set custom claim
  await auth.setCustomUserClaims(userRecord.uid, { admin: true });
  console.log("Custom claim { admin: true } set.");

  // 3. Update Firestore user doc
  const userDocRef = db.collection("users").doc(userRecord.uid);
  const userDoc = await userDocRef.get();

  if (userDoc.exists) {
    await userDocRef.update({
      role: "admin",
      updatedAt: Timestamp.now(),
    });
    console.log("Firestore user doc updated: role = admin.");
  } else {
    await userDocRef.set({
      uid: userRecord.uid,
      email: userRecord.email ?? email,
      displayName: userRecord.displayName ?? "",
      photoURL: userRecord.photoURL ?? "",
      role: "admin",
      addresses: [],
      preferredLocale: "es",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log("Firestore user doc created with role = admin.");
  }

  console.log(`\nDone! ${email} is now an admin.`);
  console.log("Note: The user must sign out and sign back in for the claim to take effect.");
}

// ── CLI ──

const email = process.argv[2];

if (!email) {
  console.error("Usage: npx tsx scripts/set-admin.ts <email>");
  console.error("Example: npx tsx scripts/set-admin.ts admin@example.com");
  process.exit(1);
}

setAdmin(email).catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
