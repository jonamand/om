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

## Migrer vers ton propre projet Supabase

Pour contrôler la base de données de A à Z sur ton compte Supabase :

1. Créer un nouveau projet sur https://supabase.com (choisir un nom, une région proche de l’Afrique de l’Ouest si possible, un mot de passe pour la base).
2. Une fois le projet prêt, ouvrir le **SQL Editor** dans le tableau de bord Supabase.
3. Copier tout le contenu du fichier `supabase/schema.sql` fourni dans le projet.
4. Le coller dans le SQL Editor et cliquer sur **Run**. Cela crée toutes les tables, les politiques de sécurité, les fonctions, les buckets de stockage et le compte super admin automatique pour `jokad312@gmail.com`.
5. Aller dans **Project Settings → API** du nouveau projet.
6. Copier :
   - **Project URL**
   - **anon public key** (clé publique, jamais la `service_role`)
7. Ouvrir le fichier `.env` du projet et remplacer les valeurs existantes :
   - `VITE_SUPABASE_URL` = l’URL du nouveau projet
   - `VITE_SUPABASE_ANON_KEY` = la clé anon du nouveau projet
8. Créer un compte sur le site avec l’adresse `jokad312@gmail.com`. Ce compte devient automatiquement super admin grâce au trigger `handle_new_user`.
9. Déployer les fonctions serveur (kpay-init, kpay-status, kpay-webhook) et configurer les secrets KPay (`KPAY_API_KEY`, `KPAY_SECRET_KEY`, `KPAY_WEBHOOK_SECRET`) dans **Edge Functions → Secrets** du tableau de bord Supabase.

Le fichier `supabase/schema.sql` est idempotent : on peut le relancer sans risque. Toutes les opérations utilisent `IF NOT EXISTS` ou `DROP POLICY IF EXISTS` avant `CREATE POLICY`.

## Vérification avant livraison

La commande `npm run build` vérifie que le projet est correctement compilé pour une mise en ligne.
