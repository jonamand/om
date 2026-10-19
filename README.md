# Otaku Mania

Application web de communauté, boutique et événements autour de la culture otaku.

## Préparer une copie téléchargée

1. Installer Node.js 18 ou une version plus récente.
2. Ouvrir un terminal dans le dossier du projet.
3. Installer les dépendances avec `npm install`.
4. Créer un fichier `.env` à partir de `.env.example`.
5. Renseigner l’URL du projet Supabase et sa clé publique `anon` dans `.env`.

Les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont nécessaires au chargement de l’application et à la connexion Supabase. Le fichier `.env` local est ignoré par le contrôle de version afin de ne pas publier de configuration privée.

Les clés de paiement KPay ne doivent jamais être ajoutées à `.env` côté navigateur. Elles restent configurées uniquement dans les fonctions serveur Supabase.

## Vérification avant livraison

La commande `npm run build` vérifie que le projet est correctement compilé pour une mise en ligne.
