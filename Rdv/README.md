# Application Mobile De Gestion De Rendez-Vous

Ce dossier contient le frontend mobile React Native de l'application de gestion de rendez-vous.

Le frontend fonctionne avec le backend Node.js/Express présent dans le dossier `Backend`.

## Architecture

- `Backend/` : API, authentification, rôles, rendez-vous, disponibilités, notifications, synchronisation avec MySQL
- `Rdv/` : application mobile React Native Android/iOS

## Prérequis

- Node.js installé
- npm installé
- MySQL démarré
- Android Studio installé
- un émulateur Android ou un appareil Android disponible
- SDK Android configuré pour React Native

## Configuration

### Backend

Depuis le dossier `Backend`, copiez le fichier d'exemple :

```bash
cd Backend
cp .env.example .env
```

Variables importantes dans `Backend/.env` :

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `MAIL_ENABLED`

Important :

- le canal email est maintenant facultatif
- le système repose d'abord sur les notifications internes
- laissez `MAIL_ENABLED=false` si vous ne souhaitez pas configurer Mailtrap

### Frontend

Depuis le dossier `Rdv`, copiez le fichier d'exemple :

```bash
cd Rdv
cp .env.example .env
```

Variables importantes dans `Rdv/.env` :

- `API_BASE_URL`
- `API_ORIGIN`
- `FRONTEND_ONLY_MODE=false`

Exemple Android émulateur :

```env
API_BASE_URL=http://10.0.2.2:3000/api/v1
API_ORIGIN=http://10.0.2.2:3000
FRONTEND_ONLY_MODE=false
```

Exemple machine locale :

```env
API_BASE_URL=http://localhost:3000/api/v1
API_ORIGIN=http://localhost:3000
FRONTEND_ONLY_MODE=false
```

## Installation

### 1. Installer Le Backend

```bash
cd Backend
npm install
```

### 2. Synchroniser La Base

```bash
npm run db:sync
```

### 3. Charger Les Données De Référence

Le seed installe uniquement les données structurelles du projet :

- rôles
- permissions
- clinique
- services
- un premier compte administrateur

```bash
npm run db:seed
```

Premier administrateur créé automatiquement :

- login : `admin`
- mot de passe : `Admin1234!`

Ces valeurs peuvent être personnalisées dans `Backend/.env` avec :

- `ADMIN_SEED_LOGIN`
- `ADMIN_SEED_PASSWORD`
- `ADMIN_SEED_NOM`
- `ADMIN_SEED_PRENOM`
- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_NIVEAU_ACCES`

### 4. Lancer Le Backend

```bash
npm run dev
```

## Installation Du Frontend

```bash
cd Rdv
npm install
```

## Lancement Du Frontend

### Démarrer Metro

```bash
npx react-native start
```

Ou avec nettoyage du cache :

```bash
npx react-native start --reset-cache
```

### Lancer L'application Android

```bash
npx react-native run-android
```

## Nettoyage Android En Cas De Problème

Si Gradle ou Android restent bloqués :

### Arrêter Gradle

```bash
cd android
.\gradlew.bat --stop
```

### Nettoyer Puis Relancer

```bash
cd android
.\gradlew clean
cd ..
npx react-native run-android
```

## Ordre Recommandé De Lancement

### Terminal 1 : backend

```bash
cd Backend
npm install
npm run db:sync
npm run db:seed
npm run dev
```

### Terminal 2 : Metro

```bash
cd Rdv
npm install
npx react-native start --reset-cache
```

### Terminal 3 : Android

```bash
cd Rdv
npx react-native run-android
```

## Vérifications Utiles

- vérifier que le backend répond sur `http://localhost:3000/api/v1/health`
- vérifier que `API_BASE_URL` du frontend pointe vers le bon backend
- vérifier que MySQL est démarré avant `npm run db:sync`
- vérifier que `FRONTEND_ONLY_MODE=false`

## Notifications Et Email

Le projet est centré sur les notifications internes.

Comportement actuel :

- les notifications internes restent le canal principal
- l'email est optionnel
- si `MAIL_ENABLED=false`, l'application continue à fonctionner normalement
- les rappels et événements créent toujours des notifications en base
- l'absence de configuration mail ne bloque pas les flux métier

## Commandes Résumées

### Backend

```bash
cd Backend
npm install
npm run db:sync
npm run db:seed
npm run dev
```

### Frontend

```bash
cd Rdv
npm install
npx react-native start
```

ou

```bash
cd Rdv
npx react-native start --reset-cache
```

Puis :

```bash
cd Rdv
npx react-native run-android
```

## Publication GitHub

Avant publication :

- ne pas committer `Backend/.env`
- ne pas committer `Rdv/.env`
- ne pas versionner les builds Android/iOS
- vérifier que la base locale ne contient pas de données sensibles
