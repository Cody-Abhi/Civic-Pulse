import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testFirebase() {
  console.log("==================================================");
  console.log("🔍 TESTING FIREBASE BACKEND CONNECTION");
  console.log("==================================================");

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;

  console.log(`• Firebase Project ID:     ${projectId}`);
  console.log(`• Firestore Emulator Host: ${emulatorHost || "None (Connecting to Cloud)"}`);
  console.log(`• Auth Emulator Host:      ${authEmulatorHost || "None (Connecting to Cloud)"}`);
  console.log("--------------------------------------------------");

  const app = getApps().length === 0 ? initializeApp({ projectId }) : getApps()[0];
  const db = getFirestore(app);
  const auth = getAuth(app);

  let allPassed = true;

  // 1. Test Firebase Auth
  try {
    console.log("1️⃣ Testing Firebase Auth (Admin SDK)...");
    const usersList = await auth.listUsers(5);
    console.log(`   ✅ Auth is working! Found ${usersList.users.length} seeded users in Auth.`);
    for (const u of usersList.users) {
      console.log(`      - User: ${u.email} (UID: ${u.uid})`);
    }
  } catch (err: any) {
    console.error(`   ❌ Firebase Auth failed:`, err.message);
    allPassed = false;
  }

  console.log("--------------------------------------------------");

  // 2. Test Firestore Read Operations
  try {
    console.log("2️⃣ Testing Firestore Read Operations...");
    const deptSnap = await db.collection("departments").get();
    console.log(`   ✅ Successfully read 'departments' collection: ${deptSnap.size} departments found.`);
    deptSnap.docs.forEach((doc) => {
      const d = doc.data();
      console.log(`      - Department: [${doc.id}] ${d.name || d.label}`);
    });

    const complaintSnap = await db.collection("complaints").limit(3).get();
    console.log(`   ✅ Successfully read 'complaints' collection: Sample ${complaintSnap.size} retrieved.`);
    complaintSnap.docs.forEach((doc) => {
      const c = doc.data();
      console.log(`      - Complaint: ${c.referenceNumber || doc.id} | Category: ${c.category} | Status: ${c.status}`);
    });
  } catch (err: any) {
    console.error(`   ❌ Firestore Read failed:`, err.message);
    allPassed = false;
  }

  console.log("--------------------------------------------------");

  // 3. Test Firestore Composite Query & Index
  try {
    console.log("3️⃣ Testing Firestore Composite Index Query...");
    const querySnap = await db
      .collection("complaints")
      .where("departmentId", "==", "roads")
      .orderBy("createdAt", "desc")
      .limit(2)
      .get();
    console.log(`   ✅ Composite index query executed successfully! Found ${querySnap.size} records.`);
  } catch (err: any) {
    console.error(`   ❌ Composite index query failed:`, err.message);
    allPassed = false;
  }

  console.log("--------------------------------------------------");

  // 4. Test Firestore Write and Delete Cycle
  try {
    console.log("4️⃣ Testing Firestore Write & Delete Operations...");
    const testDocRef = db.collection("systemSettings").doc("connectionTestProbe");
    const testPayload = {
      testedAt: new Date().toISOString(),
      status: "verified",
      message: "Firebase connection probe",
    };

    await testDocRef.set(testPayload);
    console.log("   ✅ Document write successful: 'systemSettings/connectionTestProbe'");

    const readBack = await testDocRef.get();
    if (readBack.exists && readBack.data()?.status === "verified") {
      console.log("   ✅ Document read-back verification successful!");
    } else {
      throw new Error("Read-back data mismatch");
    }

    await testDocRef.delete();
    console.log("   ✅ Document cleanup (delete) successful!");
  } catch (err: any) {
    console.error(`   ❌ Firestore Write/Delete cycle failed:`, err.message);
    allPassed = false;
  }

  console.log("==================================================");
  if (allPassed) {
    console.log("🎉 ALL FIREBASE SERVICES ARE FULLY OPERATIONAL!");
  } else {
    console.log("⚠️ Some Firebase services encountered issues.");
  }
  console.log("==================================================");
}

testFirebase().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
