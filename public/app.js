// ============================================================
// FIREBASE CONFIG — Erstatt med din egen fra Firebase Console
// ============================================================
const firebaseConfig = {
  apiKey:            "AIzaSyBlGlAmjFinbDhby5LmHeE4tRM2izF85uE",
  authDomain:        "ketlcloud.firebaseapp.com",
  projectId:         "ketlcloud",
  storageBucket:     "ketlcloud.firebasestorage.app",
  messagingSenderId: "238849700424",
  appId:             "1:238849700424:web:43143057604f8203b49e7d",
  measurementId:     "G-36LXN3WEM8"
};

// ============================================================
// Init
// ============================================================
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const notesRef = db.collection("notes");

const form     = document.getElementById("note-form");
const input    = document.getElementById("note-input");
const list     = document.getElementById("notes-list");
const status   = document.getElementById("status");

// ============================================================
// Sanntidslytter — Firestore → DOM
// ============================================================
notesRef.orderBy("createdAt", "desc").onSnapshot(
  (snapshot) => {
    status.textContent = "tilkoblet";
    status.className = "ok";
    list.innerHTML = "";

    snapshot.forEach((doc) => {
      const note = doc.data();
      const li = document.createElement("li");

      const span = document.createElement("span");
      span.textContent = note.text;

      const time = document.createElement("span");
      time.className = "time";
      time.textContent = note.createdAt
        ? new Date(note.createdAt.toDate()).toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" })
        : "";

      const del = document.createElement("span");
      del.className = "delete";
      del.textContent = "slett";
      del.onclick = () => notesRef.doc(doc.id).delete();

      const left = document.createElement("span");
      left.append(span, time);
      li.append(left, del);
      list.appendChild(li);
    });
  },
  (err) => {
    status.textContent = "feil — sjekk config";
    status.className = "error";
    console.error(err);
  }
);

// ============================================================
// Legg til notat
// ============================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  await notesRef.add({
    text,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  input.value = "";
});
