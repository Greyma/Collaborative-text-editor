# Collaborative Text Editor

Un éditeur de texte collaboratif en temps réel construit avec Next.js, Socket.IO, et TypeScript. Cette application permet à plusieurs utilisateurs de modifier simultanément un document dans des salles (rooms) séparées.

## 📋 Table des Matières

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Technologies Utilisées](#technologies-utilisées)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Structure du Projet](#structure-du-projet)
- [Fonctionnalités Techniques](#fonctionnalités-techniques)
- [API REST](#api-rest)
- [WebSocket Events](#websocket-events)

## ✨ Fonctionnalités

### 🚀 Fonctionnalités Principales

- **Édition Collaborative en Temps Réel** : Plusieurs utilisateurs peuvent éditer le même document simultanément
- **Système de Rooms** : Les utilisateurs peuvent créer ou rejoindre des salles spécifiques pour séparer les groupes
- **Synchronisation Automatique** : Les modifications sont synchronisées instantanément entre tous les utilisateurs d'une même salle
- **Indicateurs de Présence** : Visualisation des utilisateurs connectés avec leurs couleurs distinctives
- **Curseurs Distants** : Voir en temps réel la position des curseurs des autres utilisateurs
- **Indicateur de Frappe** : Indicateur visuel quand d'autres utilisateurs sont en train d'écrire
- **Résolution de Conflits** : Système de transformation opérationnelle (OT) pour gérer les modifications concurrentes

### 🎯 Fonctionnalités de Rooms

- **Création de Rooms** : Génération automatique d'un ID de salle unique
- **Rejoindre une Room** : Possibilité de rejoindre une salle existante avec son ID
- **Rooms Publiques** : Salles pré-configurées pour un accès rapide
- **Isolation des Documents** : Chaque salle a son propre document et ses propres utilisateurs
- **Nettoyage Automatique** : Les salles vides sont supprimées après 5 minutes d'inactivité

## 🏗️ Architecture

L'application suit une architecture client-serveur avec communication WebSocket :

```
┌─────────────────┐         WebSocket          ┌──────────────────┐
│                 │ ◄───────────────────────► │                  │
│  Client Next.js │                            │  Server Socket.IO │
│                 │                            │                  │
└─────────────────┘                            └──────────────────┘
        │                                               │
        │                                               │
   ┌────▼────┐                                     ┌───▼────┐
   │ React   │                                     │  Room  │
   │ UI      │                                     │ Manager│
   └─────────┘                                     └────────┘
```

### Composants Principaux

1. **Frontend (Next.js)**
   - Interface utilisateur réactive
   - Gestion de l'état local
   - Communication WebSocket
   - Transformation opérationnelle côté client

2. **Backend (Socket.IO Server)**
   - Gestion des connexions WebSocket
   - Gestion des salles
   - Synchronisation des documents
   - Résolution de conflits
   - API REST pour les métadonnées

## 🛠️ Technologies Utilisées

### Frontend
- **Next.js 16** - Framework React avec rendu côté serveur
- **React 19** - Bibliothèque UI
- **TypeScript** - Langage typé
- **Socket.IO Client** - Communication temps réel
- **Tailwind CSS** - Framework CSS utilitaire
- **Radix UI** - Composants UI accessibles
- **Shadcn/ui** - Collection de composants réutilisables

### Backend
- **Node.js** - Environnement d'exécution JavaScript
- **Express** - Framework web
- **Socket.IO** - Bibliothèque WebSocket
- **TypeScript** - Langage typé
- **CORS** - Gestion des requêtes cross-origin

### Algorithmes
- **Operational Transformation (OT)** - Synchronisation des modifications concurrentes
- **Conflict Resolution** - Détection et résolution des conflits

## 📦 Installation

### Prérequis

- Node.js (version 18 ou supérieure)
- npm ou pnpm

### Étapes d'Installation

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd TP-SIR
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   # ou
   pnpm install
   ```

3. **Configurer les variables d'environnement**
   
   Créez un fichier `.env` à la racine du projet :
   ```env
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   ```

   Pour un déploiement en production, remplacez par l'URL de votre serveur Socket.IO.

## ⚙️ Configuration

### Configuration du Serveur Socket.IO

Le serveur est configuré dans `server.ts`. Vous pouvez modifier :

- **Port** : Modifier `PORT` dans les variables d'environnement ou utiliser le port par défaut 3001
- **CORS** : Configurer les origines autorisées dans la configuration Socket.IO
- **Timeout de Nettoyage** : Modifier le délai de suppression des salles vides (par défaut 5 minutes)

```typescript
// Dans server.ts
const PORT = process.env.PORT || 3001
```

### Configuration du Client

Le client est configuré dans `lib/socket-manager.ts` :

```typescript
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://localhost:3001";
```

## 🚀 Utilisation

### Démarrage en Mode Développement

Vous devez démarrer **deux serveurs** :

1. **Serveur Backend (Socket.IO)**
   ```bash
   npm run dev:server
   ```
   Le serveur Socket.IO démarrera sur `http://localhost:3001`

2. **Serveur Frontend (Next.js)** - Dans un nouveau terminal
   ```bash
   npm run dev
   ```
   L'application Next.js démarrera sur `http://localhost:3000`

### Démarrage en Mode Production

1. **Build l'application**
   ```bash
   npm run build
   ```

2. **Démarrer les serveurs**
   ```bash
   # Terminal 1 : Serveur Backend
   npm run dev:server
   
   # Terminal 2 : Serveur Frontend
   npm start
   ```

### Utilisation de l'Application

1. **Accéder à l'application**
   - Ouvrez votre navigateur et accédez à `http://localhost:3000/editor`

2. **Rejoindre ou Créer une Room**
   - Entrez votre nom
   - **Option 1** : Cliquez sur "Create New Room" pour créer une nouvelle salle
   - **Option 2** : Cliquez sur "Join Existing Room" et entrez un ID de salle
   - **Option 3** : Utilisez une des salles publiques pré-configurées

3. **Partager la Room**
   - Partagez l'ID de salle avec d'autres utilisateurs
   - Ils peuvent rejoindre la même salle pour collaborer

4. **Éditer le Document**
   - Tapez dans l'éditeur
   - Les modifications sont synchronisées automatiquement
   - Voyez les curseurs et les modifications des autres utilisateurs en temps réel

5. **Quitter la Room**
   - Cliquez sur "Leave Room" pour retourner à l'écran de sélection

## 📁 Structure du Projet

```
TP-SIR/
├── app/                          # Application Next.js
│   ├── editor/                   # Page de l'éditeur
│   │   └── page.tsx             # Composant principal de l'éditeur
│   ├── layout.tsx               # Layout principal
│   └── page.tsx                 # Page d'accueil
│
├── components/                   # Composants React
│   ├── room-selector.tsx        # Sélection de salle
│   ├── editor-content.tsx       # Zone d'édition
│   ├── users-list.tsx           # Liste des utilisateurs
│   ├── typing-indicator.tsx     # Indicateur de frappe
│   ├── remote-cursor.tsx        # Curseur distant
│   └── ui/                      # Composants UI de base
│
├── lib/                         # Bibliothèques et utilitaires
│   ├── socket-manager.ts        # Gestion Socket.IO client
│   ├── operational-transform.ts # Transformation opérationnelle
│   ├── conflict-resolver.ts     # Résolution de conflits
│   ├── document-manager.ts      # Gestion des documents
│   ├── sync-manager.ts          # Gestion de la synchronisation
│   └── utils.ts                 # Utilitaires divers
│
├── server.ts                    # Serveur Socket.IO backend
├── package.json                 # Dépendances et scripts
├── tsconfig.json               # Configuration TypeScript
└── .env                        # Variables d'environnement
```

### Fichiers Clés

- **`server.ts`** : Serveur backend Socket.IO qui gère les connexions, les salles et la synchronisation
- **`lib/socket-manager.ts`** : Gestionnaire de connexion Socket.IO côté client
- **`lib/operational-transform.ts`** : Implémentation de la transformation opérationnelle
- **`components/room-selector.tsx`** : Interface de sélection/création de salles
- **`app/editor/page.tsx`** : Page principale de l'éditeur collaboratif

## 🔧 Fonctionnalités Techniques

### Transformation Opérationnelle (OT)

L'application utilise un système de transformation opérationnelle pour gérer les modifications concurrentes :

```typescript
// Types d'opérations
type Operation = {
  id: string;
  type: "insert" | "delete";
  position: number;
  content?: string;
  length?: number;
  timestamp: number;
  userId: string;
};
```

**Fonctionnement** :
1. Chaque modification génère une opération
2. L'opération est envoyée au serveur
3. Le serveur diffuse l'opération aux autres clients
4. Les clients appliquent la transformation pour maintenir la cohérence

### Gestion des Rooms

Chaque room maintient :
- **Document** : Contenu textuel partagé
- **Utilisateurs** : Liste des utilisateurs connectés
- **Opérations** : Historique des modifications
- **Métadonnées** : Date de création, dernière activité, nombre d'utilisateurs

```typescript
interface RoomData {
  content: string;
  users: User[];
  operations: Operation[];
  activities: Activity[];
}
```

### Résolution de Conflits

Le système détecte et résout automatiquement les conflits :
- Détection basée sur le chevauchement des opérations
- Résolution par timestamp (l'opération la plus récente gagne)
- Journalisation des conflits pour le débogage

## 🌐 API REST

Le serveur expose des endpoints REST pour les métadonnées des salles :

### GET `/api/rooms`
Liste toutes les salles actives

**Réponse** :
```json
{
  "rooms": [
    {
      "roomId": "ABC123",
      "userCount": 3,
      "createdAt": "2025-01-01T12:00:00.000Z",
      "lastActivity": "2025-01-01T12:30:00.000Z"
    }
  ]
}
```

### GET `/api/rooms/:roomId`
Obtenir les informations d'une salle spécifique

**Réponse** :
```json
{
  "roomId": "ABC123",
  "userCount": 3,
  "users": [
    {
      "id": "user1",
      "name": "Alice",
      "color": "#FF5733"
    }
  ],
  "metadata": {
    "createdAt": "2025-01-01T12:00:00.000Z",
    "lastActivity": "2025-01-01T12:30:00.000Z",
    "userCount": 3
  }
}
```

## 🔌 WebSocket Events

| Fonctionnalité  | Code côté serveur            | Code côté client               |
|-----------------|------------------------------|--------------------------------|
| Connexion       | `io.on('connection', ...)`   | `io('url')`                    |
| Envoi global    | `io.emit()`                  | `socket.emit()`                |
| Réception       | `socket.on()`                | `socket.on()`                  |
| Broadcast       | `socket.broadcast.emit()`    | -                              |
| Rooms           | `socket.join()`, `io.to(room)`| `socket.emit('join-room', ...)`|
| Déconnexion     | `socket.on('disconnect')`    | `socket.on('disconnect')`      |


### Events Client → Serveur

| Event | Description | Données |
|-------|-------------|---------|
| `join` | Rejoindre une salle | `{ documentId, userId, userName, userColor }` |
| `edit` | Envoyer une modification | `{ operation }` |
| `cursor` | Mettre à jour la position du curseur | `{ position }` |
| `typing` | Indiquer qu'on est en train d'écrire | `{ isTyping }` |
| `chat` | Envoyer un message (optionnel) | `{ message, timestamp }` |

### Events Serveur → Client

| Event | Description | Données |
|-------|-------------|---------|
| `document-sync` | Synchroniser le document initial | `{ content, roomId }` |
| `users-updated` | Mise à jour de la liste des utilisateurs | `{ users }` |
| `edit-received` | Opération reçue d'un autre utilisateur | `{ userId, userName, operation }` |
| `cursor-update` | Mise à jour du curseur d'un utilisateur | `{ userId, userName, userColor, position }` |
| `typing-update` | Mise à jour du statut de frappe | `{ userId, userName, isTyping }` |
| `activity-update` | Notification d'activité | `{ userId, userName, action }` |

## 🐛 Débogage

### Logs

Le serveur et le client affichent des logs détaillés :

- **Serveur** : `[Socket]` pour les événements Socket.IO
- **Client** : `[Editor]` pour les événements de l'éditeur

### Problèmes Courants

1. **Connexion échouée**
   - Vérifiez que le serveur Socket.IO est démarré
   - Vérifiez la variable `NEXT_PUBLIC_SOCKET_URL`
   - Vérifiez la configuration CORS

2. **Synchronisation lente**
   - Vérifiez la latence réseau
   - Consultez les logs de conflits

3. **Room non trouvée**
   - Vérifiez que l'ID de salle est correct
   - La salle peut avoir été nettoyée (inactivité)

## 📝 Scripts Disponibles

```json
{
  "dev": "next dev",              // Démarrer Next.js en dev
  "dev:server": "ts-node server.ts", // Démarrer le serveur Socket.IO
  "build": "next build",          // Build pour production
  "start": "next start",          // Démarrer Next.js en production
  "lint": "eslint ."             // Linter le code
}
```

## 🔐 Sécurité

Considérations de sécurité à implémenter en production :

- [ ] Authentification des utilisateurs
- [ ] Validation des opérations côté serveur
- [ ] Rate limiting
- [ ] Sanitization des entrées
- [ ] HTTPS/WSS pour les connexions sécurisées
- [ ] Gestion des permissions par salle

## 🚀 Améliorations Futures

- [ ] Persistance des documents (base de données)
- [ ] Chat intégré dans chaque salle
- [ ] Historique des versions avec undo/redo
- [ ] Export du document (PDF, Markdown, etc.)
- [ ] Permissions et rôles (propriétaire, éditeur, lecteur)
- [ ] Chiffrement end-to-end
- [ ] Mode hors ligne avec synchronisation

## 👥 Contribution

Pour contribuer au projet :

1. Fork le repository
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.

## 🙏 Remerciements

- [Socket.IO](https://socket.io/) - Communication temps réel
- [Next.js](https://nextjs.org/) - Framework React
- [Shadcn/ui](https://ui.shadcn.com/) - Composants UI
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS

---

Développé avec ❤️ pour le projet TP SIR
