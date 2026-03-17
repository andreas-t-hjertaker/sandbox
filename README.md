# Sandbox — Firebase Notes

Minimalistisk webapp med Firebase Hosting + Firestore.  
Sanntids notatapp — alt synker live mellom alle klienter.

## Oppsett

### 1. Klon repoet

```bash
git clone https://github.com/andreas-t-hjertaker/sandbox.git
cd sandbox
```

### 2. Installer Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 3. Koble til ditt Firebase-prosjekt

Oppdater `.firebaserc` med din prosjekt-ID:

```json
{
  "projects": {
    "default": "ditt-firebase-prosjekt-id"
  }
}
```

Oppdater `public/app.js` med din Firebase-config (fra Firebase Console → Project Settings).

### 4. Aktiver Firestore

I Firebase Console: Build → Firestore Database → Create database → Start in test mode.

### 5. Deploy

```bash
firebase deploy
```

Ferdig. Appen er live på `https://ditt-prosjekt-id.web.app`.

## Struktur

```
├── public/
│   ├── index.html    # Enkel HTML-shell
│   ├── style.css     # Mørkt minimalt design
│   └── app.js        # Firebase init + Firestore CRUD
├── firebase.json     # Hosting + Firestore config
├── firestore.rules   # Sikkerhetsregler (åpne for demo)
└── .firebaserc       # Prosjekt-mapping
```
