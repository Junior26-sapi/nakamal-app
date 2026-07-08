import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 'en' | 'fr' | 'bi';

export interface LanguageContextType {
  locale: LanguageCode;
  setLocale: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Nav & General
    "dashboard": "Dashboard",
    "messages": "Messages Hub",
    "discover": "Discover",
    "login": "Login",
    "logout": "Log Out",
    "save": "Save Changes",
    "cancel": "Cancel",
    "delete": "Delete",
    "search": "Search...",
    "status": "Status",
    "open": "Open",
    "closed": "Closed",
    "language": "Language",
    "theme": "Theme",
    "vessel_node": "Vessel Node",
    "ecosystem_monitor": "Ecosystem Monitor",
    "billing": "Financial Ledger",
    "administrative": "Administrative",
    "manager": "Venue Manager",
    "supplier": "Kava Supplier",
    "exporter": "Licensed Exporter",
    "admin": "System Admin",
    
    // Board Titles & Nav tabs
    "authority_control": "Authority Control",
    "manage_access_subtitle": "Manage platform access, approvals and financial integrity",
    "platform_control": "Platform Control",
    "physical_network": "Physical Network",
    "financial_oversight": "Financial Oversight",
    "cloud_config": "Cloud Config",
    "queue_status": "Queue Status",
    "waiting_approvals": "Waiting Approvals",
    "bar_managers": "Bar Managers",
    "industry_suppliers": "Industry Suppliers",
    "licensed_exporters": "Licensed Exporters",
    "explorers": "Explorers",
    "community_posts": "Community Posts & Bulletins",
    
    "nakamal_dashboard": "Nakamal Dashboard",
    "current_stock": "Current Stock",
    "active_deals": "Active Deals & Specials",
    "ledger": "Ledger",
    
    "supplier_portal": "Supplier Portal",
    "wholesale_lots": "Wholesale Lots",
    "active_contract_deals": "Active Contract Deals",
    "wholesale_ledger": "Wholesale Ledger",
    
    "exporter_portal": "Exporter Portal",
    "export_certificates": "Export Certificates",
    "active_shipments": "Active Shipments",
    "trade_logs": "Trade Logs",
    "trade_desk": "Trade Desk",
    "market_insights": "Market Insights",
    "exporter_buy_rates": "Exporter Buy Rates",
    "contact_supplier": "Contact Supplier",
    "save_exporter_rates": "Save Exporter Rates",
    
    "green_kava_roots": "Green Kava Roots",
    "green_kava_chips": "Green Kava Chips",
    "sun_dried_kava_roots": "Sun Dried Kava Roots",
    "sun_dried_kava_chips": "Sun Dried Kava Chips",
    "rates_saved": "Exporter Rates Saved Successfully",
    
    "profile": "Profile",
    "profile_setup": "Vessel Node Profile Setup",
    
    // Tabs in Manager/Supplier Board
    "venue": "Venue",
    "inventory": "Inventory",
    "engagement": "Engagement",
    "logistics": "Logistics",
    "tasks": "Tasks",
    
    "venue_settings": "Nakamal Settings",
    "inventory_menu": "Inventory & Menu",
    "customer_engagement": "Customer Engagement",
    "logistics_messages": "Logistics & Messages",
    "task_manager": "Task Manager",
    "review_venue": "Review Venue Info",
    "active_promotions": "Active Promotions",
    "task_list": "Task List",
    "new_task": "New Task",
    
    "pending": "Pending",
    "completed": "Completed",
    "high": "High",
    "medium": "Medium",
    "low": "Low",
    
    "add_product": "Add Product",
    "update_product": "Update Product",
    "delete_product": "Delete Product",
    "stock_lbl": "Stock",
    "price_lbl": "Price",
    
    // Welcome Messages
    "welcome_back": "Welcome back",
    "vessel_subheading": "Verified secure node connection",
    "loading": "Loading data stream...",
    "no_messages": "No messages in this hub.",
    
    // Actions & Fields
    "export_pdf": "Download PDF Receipt",
    "export_ledger": "Export Personal Ledger PDF",
    "export_csv": "Export CSV Ledger",
    "total_volume": "Total Volume",
    "bar_name": "Venue Name",
    "date": "Date",
    "amount": "Amount",
    "description": "Description",
    "last_snapshot": "Last Snapshot",
    "force_sync": "Force Sync",
    "cloud_pipeline": "Cloud Pipeline",
    "network_hub": "Network Hub",
    "safe_storage": "Safe Storage",
    "reconciled_ledger": "Reconciled offline ledger & verified subscriptions",
    "bill_to": "BILL TO (ENTITY DETAILS)",
    "transaction_summary": "TRANSACTION SUMMARY",
    "total_charged": "TOTAL AMOUNT CHARGED:",
    "terms_conditions": "All licensing and stateful access verifications are managed securely.",
    
    // Interactive Elements
    "view_ledgers": "View Transacted Ledgers",
    "make_payment": "Verify Subscription Link",
    "active_signal": "Active Signal (Pulse)",
    "standby": "Standby / Searching",
    "replicate": "Storage replicate:",
    
    // Suspended state
    "access_suspended": "ACCESS SUSPENDED",
    "access_suspended_desc": "Your account has been automatically closed because your trial or subscription period reached its expiration date and time.",
    "requirement": "Requirement",
    "requirement_desc": "Please renew your subscription. After payment review, an administrator will re-open your account and restore visibility.",
    "secure_renewal": "Secure Renewal Now",
    "data_preserved": "All your data is safely preserved and will be instantly available after renewal.",
    "translate": "Translate",
    "translating": "Translating...",
    "show_original": "Show Original",
    "real_time_translate": "Real-Time Translation",
    "translated_by_gemini": "Translated via Gemini API"
  },
  fr: {
    // Nav & General
    "dashboard": "Tableau de Bord",
    "messages": "Centre de Messages",
    "discover": "Découvrir",
    "login": "Connexion",
    "logout": "Déconnexion",
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "search": "Rechercher...",
    "status": "Statut",
    "open": "Ouvert",
    "closed": "Fermé",
    "language": "Langue",
    "theme": "Thème",
    "vessel_node": "Nœud Vessel",
    "ecosystem_monitor": "Moniteur d'Écosystème",
    "billing": "Grand Livre Financier",
    "administrative": "Administratif",
    "manager": "Directeur de Salle",
    "supplier": "Fournisseur de Kava",
    "exporter": "Exportateur Agréé",
    "admin": "Administrateur Système",
    
    // Board Titles & Nav tabs
    "authority_control": "Contrôle d'Autorité",
    "manage_access_subtitle": "Gérer l'accès à la plateforme, les approbations et l'intégrité financière",
    "platform_control": "Contrôle Plateforme",
    "physical_network": "Réseau Physique",
    "financial_oversight": "Surveillance Financière",
    "cloud_config": "Configuration Cloud",
    "queue_status": "Statut File d'Attente",
    "waiting_approvals": "Approbations en Attente",
    "bar_managers": "Gestionnaires de Salles",
    "industry_suppliers": "Fournisseurs de la Filière",
    "licensed_exporters": "Exportateurs Agréés",
    "explorers": "Explorateurs",
    "community_posts": "Messages Communautaires & Bulletins",
    
    "nakamal_dashboard": "Tableau de Bord Nakamal",
    "current_stock": "Stock Actuel",
    "active_deals": "Offres Spéciales Actives",
    "ledger": "Grand Livre",
    
    "supplier_portal": "Portail Fournisseur",
    "wholesale_lots": "Lots de Gros",
    "active_contract_deals": "Contrats Actifs",
    "wholesale_ledger": "Grand Livre de Gros",
    
    "exporter_portal": "Portail Exportateur",
    "export_certificates": "Certificats d'Exportation",
    "active_shipments": "Expéditions Actives",
    "trade_logs": "Registres Commerce",
    "trade_desk": "Bureau de Négoce",
    "market_insights": "Analyses de Marché",
    "exporter_buy_rates": "Tarifs d'Achat d'Exportateur",
    "contact_supplier": "Contacter le Fournisseur",
    "save_exporter_rates": "Enregistrer les Tarifs",
    
    "green_kava_roots": "Racines de Kava Vert",
    "green_kava_chips": "Copeaux de Kava Vert",
    "sun_dried_kava_roots": "Racines de Kava Séché",
    "sun_dried_kava_chips": "Copeaux de Kava Séché",
    "rates_saved": "Tarifs de l'Exportateur Enregistrés",
    
    "profile": "Profil",
    "profile_setup": "Configuration du Profil Vessel",
    
    // Tabs in Manager/Supplier Board
    "venue": "Salle",
    "inventory": "Inventaire",
    "engagement": "Communication",
    "logistics": "Logistique",
    "tasks": "Tâches",
    
    "venue_settings": "Paramètres Nakamal",
    "inventory_menu": "Inventaire & Carte",
    "customer_engagement": "Relation Client",
    "logistics_messages": "Logistique & Messages",
    "task_manager": "Gestion de Tâches",
    "review_venue": "Réviser les Infos",
    "active_promotions": "Promotions Actives",
    "task_list": "Liste des Tâches",
    "new_task": "Nouvelle Tâche",
    
    "pending": "En Attente",
    "completed": "Complété",
    "high": "Haute",
    "medium": "Moyenne",
    "low": "Basse",
    
    "add_product": "Ajouter un Produit",
    "update_product": "Modifier le Produit",
    "delete_product": "Supprimer le Produit",
    "stock_lbl": "Stock",
    "price_lbl": "Prix",

    // Welcome Messages
    "welcome_back": "Bon retour",
    "vessel_subheading": "Connexion sécurisée vérifiée au nœud",
    "loading": "Chargement des flux de données...",
    "no_messages": "Aucun message dans ce centre.",

    // Actions & Fields
    "export_pdf": "Télécharger le reçu PDF",
    "export_ledger": "Exporter le grand livre au format PDF",
    "export_csv": "Exporter le grand livre au format CSV",
    "total_volume": "Volume Total",
    "bar_name": "Nom de l'Établissement",
    "date": "Date",
    "amount": "Montant",
    "description": "Description",
    "last_snapshot": "Dernier Instantané",
    "force_sync": "Forcer la synchro",
    "cloud_pipeline": "Pipeline Cloud",
    "network_hub": "Plaque Réseau",
    "safe_storage": "Stockage Sécurisé",
    "reconciled_ledger": "Grand livre hors ligne réconcilié et abonnements vérifiés",
    "bill_to": "FACTURER À (DÉTAILS DE L'ENTITÉ)",
    "transaction_summary": "RÉSUMÉ DE LA TRANSACTION",
    "total_charged": "MONTANT TOTAL FACTURÉ :",
    "terms_conditions": "Toutes les vérifications de licences et d'accès sont gérées de manière sécurisée.",

    // Interactive Elements
    "view_ledgers": "Consulter les grands livres",
    "make_payment": "Vérifier le lien d'abonnement",
    "active_signal": "Signal actif (Pulsation)",
    "standby": "En veille / Recherche",
    "replicate": "Réplication stockage :",
    
    // Suspended state
    "access_suspended": "ACCÈS SUSPENDU",
    "access_suspended_desc": "Votre compte a été automatiquement suspendu car votre période d'essai ou d'abonnement a expiré.",
    "requirement": "Condition requise",
    "requirement_desc": "Veuillez renouveler votre abonnement. Après examen du paiement, un administrateur réactivera votre compte.",
    "secure_renewal": "Payer le renouvellement",
    "data_preserved": "Toutes vos données sont précieusement conservées et seront instantanément disponibles après renouvellement.",
    "translate": "Traduire",
    "translating": "Traduction...",
    "show_original": "Voir l'original",
    "real_time_translate": "Traduction en direct",
    "translated_by_gemini": "Traduit via Gemini API"
  },
  bi: {
    // Nav & General
    "dashboard": "Dasbod",
    "messages": "Ol Mesej Bod",
    "discover": "Faenem Nakamal",
    "login": "Go Insayd",
    "logout": "Go Aot",
    "save": "Sevem Jens",
    "cancel": "No Bodi",
    "delete": "Deletem",
    "search": "Lukaotem...",
    "status": "Statis",
    "open": "Open",
    "closed": "Klos",
    "language": "Lanwis",
    "theme": "Saen blong skin",
    "vessel_node": "Vessel Nod",
    "ecosystem_monitor": "Monita blong Olgeta",
    "billing": "Buk blong Mane",
    "administrative": "Oveaol Gavman",
    "manager": "Meneja blong Nakamal",
    "supplier": "Splaea blong Kava",
    "exporter": "Man blong Selen Kava laesens",
    "admin": "Namba Wan Kontrola",
    
    // Board Titles & Nav tabs
    "authority_control": "Kontrol blong Gavman",
    "manage_access_subtitle": "Kontrolem go-insayd, aprovol wetem mani long spesiel bodi",
    "platform_control": "Kontrol blong Platform",
    "physical_network": "Ol Nakamal long Map",
    "financial_oversight": "Ovasaet blong Ol Faenens",
    "cloud_config": "Konfig blong Cloud",
    "queue_status": "Spesiel Queue Statis",
    "waiting_approvals": "Olgeta we i wetem Aprovol",
    "bar_managers": "Ol Meneja blong Nakamal",
    "industry_suppliers": "Ol Splaea blong Kava",
    "licensed_exporters": "Ol Exporter we i gat Laesens",
    "explorers": "Ol Mere/Man we i Lukaoutem",
    "community_posts": "Ol Toktok wetem Nius",
    
    "nakamal_dashboard": "Dasbod blong Nakamal",
    "current_stock": "Olgera Kava i stap Naoia",
    "active_deals": "Ol Spesiel Dil blong Naoia",
    "ledger": "Grand Buk blong Mane",
    
    "supplier_portal": "Potal blong Ol Splaea",
    "wholesale_lots": "Ol Bigfala Kava Kilo",
    "active_contract_deals": "Ol Laef Agrimen blong Kava",
    "wholesale_ledger": "Buk blong Bigfala Mane",
    
    "exporter_portal": "Potal blong Ol Exporter",
    "export_certificates": "Ol Pepa blong Laesens",
    "active_shipments": "Ol Sipmen blong Naoia",
    "trade_logs": "Ol Buk blong Bisnis",
    "trade_desk": "Ofis blong Bisnis",
    "market_insights": "Ol Stat blong Maket",
    "exporter_buy_rates": "Ol Praes we Exporter i pem",
    "contact_supplier": "Kolektem Toktok wetem Splaea",
    "save_exporter_rates": "Sevem Ol Praes ya",
    
    "green_kava_roots": "Raw Kava Rut",
    "green_kava_chips": "Raw Kava Jips",
    "sun_dried_kava_roots": "Drae Kava Rut",
    "sun_dried_kava_chips": "Drae Kava Jips",
    "rates_saved": "Mane Praes i sef finis",
    
    "profile": "Profil",
    "profile_setup": "Setup blong Vessel Nod Profil",
    
    // Tabs in Manager/Supplier Board
    "venue": "Nakamal blong Yu",
    "inventory": "Ol Kava i stap",
    "engagement": "Kastoma Toktok",
    "logistics": "Transpot wetem Kava",
    "tasks": "Ol Wok blong Yu",
    
    "venue_settings": "Ol Seting blong Nakamal",
    "inventory_menu": "Inventaire & Carte",
    "customer_engagement": "Lukaotem Ol Kastoma",
    "logistics_messages": "Logistics & Messages",
    "task_manager": "Meneja blong Ol Wok",
    "review_venue": "Lukluk long Nakamal Info",
    "active_promotions": "Ol Spesiel Promosen",
    "task_list": "Ol Wok we i stap",
    "new_task": "Niu Wok",
    
    "pending": "I wet",
    "completed": "I finis",
    "high": "Namba wan",
    "medium": "Medel",
    "low": "Smol",
    
    "add_product": "Adem Kava Product",
    "update_product": "Jensem Kava Product",
    "delete_product": "Deletem Kava Product",
    "stock_lbl": "Ol Kava",
    "price_lbl": "Praes blong hem",

    // Welcome Messages
    "welcome_back": "Welkam bak",
    "vessel_subheading": "Tokaen blong nod i sekur i stap",
    "loading": "Stat blong pulum ol data...",
    "no_messages": "I no gat eni toktok long ples ia.",

    // Actions & Fields
    "export_pdf": "Dawnlodem Risit PDF",
    "export_ledger": "Karem Buk blong Mane ya long PDF",
    "export_csv": "Sevem CSV Reconsiliasen Pepa",
    "total_volume": "Namba blong Kava",
    "bar_name": "Nem blong Nakamal",
    "date": "Deit",
    "amount": "Mane",
    "description": "Toktok deskripsen",
    "last_snapshot": "Las Kopi blong Data",
    "force_sync": "Pusum Synchro naoa",
    "cloud_pipeline": "Line blong Cloud",
    "network_hub": "Siga blong Signal",
    "safe_storage": "Sef Storage blong Yu",
    "reconciled_ledger": "Ol buk we yumi reconsiliem finis",
    "bill_to": "PAYEM GO LONG (OL DETS)",
    "transaction_summary": "RÉSUMÉ BLONG TRANSAKSEN",
    "total_charged": "MANE WE YU PEI FINIS:",
    "terms_conditions": "Laesens wetem raet blong go insayd i lok permanent wetem sekuriti ya.",

    // Interactive Elements
    "view_ledgers": "Lukuluku long ol faenens",
    "make_payment": "Sekem link blong laesens",
    "active_signal": "Sinyal i Laef (Puls)",
    "standby": "I wet / Lukaotem signal",
    "replicate": "Olgeta modul we i sef:",
    
    // Suspended state
    "access_suspended": "GATES I LOK",
    "access_suspended_desc": "Gat i lok from trial blong yu i pinis finis naoia.",
    "requirement": "Samting we yu mas mekem",
    "requirement_desc": "Payem mane fastaem blong openem platform ya.",
    "secure_renewal": "Payem Mane blong Kontrakt ya",
    "data_preserved": "Olgeta data blong yu i stap sef gogo yu openem bak.",
    "translate": "Transletem",
    "translating": "Transletem i stap...",
    "show_original": "Lukum original",
    "real_time_translate": "Translesen naoia",
    "translated_by_gemini": "Transletem wetem Gemini API"
  }
};

const normalizeTextKey = (str: string): string => {
  return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
};

const customMappings: Record<string, Record<LanguageCode, string>> = {
  "authority control": {
    en: "Authority Control",
    fr: "Contrôle d'Autorité",
    bi: "Kontrol blong Gavman"
  },
  "manage platform access, approvals and financial integrity": {
    en: "Manage platform access, approvals and financial integrity",
    fr: "Gérer l'accès à la plateforme, les approbations et l'intégrité financière",
    bi: "Kontrolem go-insayd, aprovol wetem mani long spesiel bodi"
  },
  "platform control": {
    en: "Platform Control",
    fr: "Contrôle de la Plateforme",
    bi: "Kontrol Blong Platform"
  },
  "physical network": {
    en: "Physical Network",
    fr: "Réseau Physique",
    bi: "Ol Nakamal long Map"
  },
  "financial oversight": {
    en: "Financial Oversight",
    fr: "Surveillance Financière",
    bi: "Ovasaet blong Ol Faenens"
  },
  "cloud config": {
    en: "Cloud Config",
    fr: "Configuration Cloud",
    bi: "Konfig blong Cloud"
  },
  "queue status": {
    en: "Queue Status",
    fr: "Statut de la file d'attente",
    bi: "Statis blong Waiting Lista"
  },
  "waiting approvals": {
    en: "Waiting Approvals",
    fr: "Approbations en attente",
    bi: "Olgeta we i wetem aprovol"
  },
  "showing: pending only": {
    en: "Showing: Pending Only",
    fr: "Affichage : En Attente Uniquement",
    bi: "Lukum Ol we i wet yet"
  },
  "filter: show pending only": {
    en: "Filter: Show Pending Only",
    fr: "Filtrer : Uniquement en attente",
    bi: "Filterem blong lukum ol we i wet"
  },
  "entry / menu starting from": {
    en: "Entry / Menu starting from",
    fr: "Carte / Menu à partir de",
    bi: "Kava i stat long"
  },
  "bar managers": {
    en: "Bar Managers",
    fr: "Gestionnaires de Salles",
    bi: "Ol Meneja blong Nakamal"
  },
  "industry suppliers": {
    en: "Industry Suppliers",
    fr: "Fournisseurs de la FILIÈRE",
    bi: "Ol Splaea blong Kava"
  },
  "licensed exporters": {
    en: "Licensed Exporters",
    fr: "Exportateurs Agréés",
    bi: "Ol Exporter we i gat laesens"
  },
  "explorers": {
    en: "Explorers",
    fr: "Explorateurs",
    bi: "Ol Mere/Man we i lukaoutem"
  },
  "community posts & bulletins": {
    en: "Community Posts & Bulletins",
    fr: "Messages Communautaires & Bulletins",
    bi: "Ol toktok wetem nius"
  },
  "vessel node setup": {
    en: "Vessel Node Setup",
    fr: "Configuration du Profil Vessel",
    bi: "Setup blong Vessel Nod"
  },
  "nakamal settings": {
    en: "Nakamal Settings",
    fr: "Paramètres Nakamal",
    bi: "Ol Seting blong Nakamal"
  },
  "inventory & menu": {
    en: "Inventory & Menu",
    fr: "Inventaire & Carte de Kava",
    bi: "Ol Kava Product blong Salem"
  },
  "customer engagement": {
    en: "Customer Engagement",
    fr: "Relation Clientèle",
    bi: "Lukaotem Ol Kastoma"
  },
  "logistics & messages": {
    en: "Logistics & Messages",
    fr: "Logistique & Messages",
    bi: "Transpot wetem Mesej"
  },
  "task manager": {
    en: "Task Manager",
    fr: "Gestion de Tâches",
    bi: "Meneja blong Ol Wok"
  },
  "supplier dashboard": {
    en: "Supplier Dashboard",
    fr: "Tableau de Bord du Fournisseur",
    bi: "Dasbod blong Splaea"
  },
  "my products": {
    en: "My Products",
    fr: "Mes Produits de Kava",
    bi: "Olgeta Kava blong Mi"
  },
  "orders & chats": {
    en: "Orders & Chats",
    fr: "Commandes & Messagerie",
    bi: "Ol Oda wetem Toktok"
  },
  "wholesale market updates": {
    en: "Wholesale Market Updates",
    fr: "Mises à jour du Marché de Gros",
    bi: "Ol Nius blong Bigfala Maket"
  },
  "trade desk": {
    en: "Trade Desk",
    fr: "Bureau de Négoce",
    bi: "Ofis blong Bisnis"
  },
  "market insights": {
    en: "Market Insights",
    fr: "Analyses de Marché",
    bi: "Ol Stat blong Maket"
  },
  "exporter buy rates": {
    en: "Exporter Buy Rates",
    fr: "Tarifs d’Achat d’Exportateur",
    bi: "Ol Praes we Exporter i pem"
  },
  "active shipments": {
    en: "Active Shipments",
    fr: "Expéditions Actives",
    bi: "Ol Sipmen blong Naoia"
  },
  "export certificates": {
    en: "Export Certificates",
    fr: "Certificats d’Exportation",
    bi: "Ol Pepa blong Laesens"
  },
  "trade logs": {
    en: "Trade Logs",
    fr: "Registres de Commerce",
    bi: "Ol Buk blong Bisnis"
  },
  "Vercel v.0 app AI Financial System": {
    en: "Vercel v.0 app AI Financial System",
    fr: "Système Financier IA Vercel v.0",
    bi: "IA Faenens Sistem blong Vercel v.0"
  },
  "Prompt actions safely to auto-reconcile cash registers, invoices & ledgers": {
    en: "Prompt actions safely to auto-reconcile cash registers, invoices & ledgers",
    fr: "Déclenchez des actions pour réconcilier caisses, factures et grands livres",
    bi: "Toktok long bodi blong sevem go-insayd ol buk blong mane wetem ol risit"
  },
  "AI AGENT ONLINE": {
    en: "AI AGENT ONLINE",
    fr: "AGENT IA EN LIGNE",
    bi: "IA BISNIS AGENT I LAEF"
  },
  "Prompt System": {
    en: "Prompt System",
    fr: "Lancer dans le Système",
    bi: "Toktok wetem Sistem"
  },
  "Add Expense": {
    en: "Add Expense",
    fr: "Ajouter une Dépense",
    bi: "Adem Smol Payout blong Mane"
  },
  "Deduct core cash reserves": {
    en: "Deduct core cash reserves",
    fr: "Déduire des réserves de trésorerie principales",
    bi: "Minusum mane long sef box"
  },
  "Send Invoice": {
    en: "Send Invoice",
    fr: "Envoyer une Facture",
    bi: "Sendem pepa blong bill"
  },
  "Generate B2B receivables bill": {
    en: "Generate B2B receivables bill",
    fr: "Générer une facture client B2B",
    bi: "Mekem pepa blong karem B2B mane"
  },
  "Upload Receipt": {
    en: "Upload Receipt",
    fr: "Télécharger un Reçu",
    bi: "Uploadem Smol Risit"
  },
  "Drag simulated OCR parsing": {
    en: "Drag simulated OCR parsing",
    fr: "Glisser pour une analyse OCR simulée",
    bi: "Pulum i kam blong scanem risit"
  },
  "Dynamic Form Area:": {
    en: "Dynamic Form Area:",
    fr: "Zone de Formulaire Dynamique :",
    bi: "Spesiel Bod blong Ol Pepa:"
  },
  "Add Expense Payout": {
    en: "Add Expense Payout",
    fr: "Ajouter un Paiement de Dépense",
    bi: "Ritem Payout blong Kava raw wood"
  },
  "Generate B2B Client Invoice": {
    en: "Generate B2B Client Invoice",
    fr: "Générer une Facture Client B2B",
    bi: "Sevem Niu B2B Client Pepa"
  },
  "Mock Receipt OCR Scanner": {
    en: "Mock Receipt OCR Scanner",
    fr: "Simulateur de Scanner de Reçu OCR",
    bi: "Simuleisen blong Scan Risit"
  },
  "Close Panel": {
    en: "Close Panel",
    fr: "Fermer le Panneau",
    bi: "Klosum Bod ya"
  },
  "Select Category": {
    en: "Select Category",
    fr: "Sélectionner la Catégorie",
    bi: "Jusem Bodi blong Wok"
  },
  "Amount": {
    en: "Amount",
    fr: "Montant",
    bi: "Namba blong Mane"
  },
  "Description": {
    en: "Description",
    fr: "Description",
    bi: "Smol toktok toktok"
  },
  "Deduct": {
    en: "Deduct",
    fr: "Déduire",
    bi: "Deductem"
  },
  "Client Name": {
    en: "Client Name",
    fr: "Nom du Client",
    bi: "Nem blong Custom"
  },
  "Invoiced Amount": {
    en: "Invoiced Amount",
    fr: "Montant Facturé",
    bi: "Mane Praes long Bill"
  },
  "Due Date": {
    en: "Due Date",
    fr: "Date d'Échéance",
    bi: "Deit blong Pay"
  },
  "Dispatch": {
    en: "Dispatch",
    fr: "Expédier",
    bi: "Sendem Go"
  },
  "Drag Receipt File Here": {
    en: "Drag Receipt File Here",
    fr: "Glissez le fichier du reçu ici",
    bi: "Dropem risit pepa long ples ia"
  },
  "Or click to select photo standard PNG, JPG, PDF": {
    en: "Or click to select photo standard PNG, JPG, PDF",
    fr: "Ou cliquez pour sélectionner une photo (PNG, JPG, PDF standard)",
    bi: "O clickem blong jusem pija PNG, JPG, PDF"
  },
  "Choose File": {
    en: "Choose File",
    fr: "Choisir un fichier",
    bi: "Jusem file"
  },
  "No Document Scanned": {
    en: "No Document Scanned",
    fr: "Aucun document numérisé",
    bi: "I no gat eni pepa we i scan finis"
  },
  "Upload any mock receipt file on the left to activate instant AI-OCR parser simulation.": {
    en: "Upload any mock receipt file on the left to activate instant AI-OCR parser simulation.",
    fr: "Téléchargez n'importe quel reçu fictif sur la gauche pour activer la simulation de l'analyseur IA-OCR.",
    bi: "Uploadem eni risit long left saed blong lukum scan long computer sistem."
  },
  "Approve OCR & Record Expense": {
    en: "Approve OCR & Record Expense",
    fr: "Approuver l'OCR et enregistrer la dépense",
    bi: "Aprovem scan ya blong sevem long buk"
  },
  "Cash Flow Overview": {
    en: "Cash Flow Overview",
    fr: "Aperçu des Flux de Trésorerie",
    bi: "Lukluk long Olgeta Mane"
  },
  "Real-time Liquidity & Balance accounts": {
    en: "Real-time Liquidity & Balance accounts",
    fr: "Comptes de liquidité et de solde en temps réel",
    bi: "Laef namba blong mane long sef box"
  },
  "Available Liquid Funds": {
    en: "Available Liquid Funds",
    fr: "Fonds Liquides Disponibles",
    bi: "Mene long Sef Box we i stap Naoia"
  },
  "Money-In (Month)": {
    en: "Money-In (Month)",
    fr: "Entrées (Mois)",
    bi: "Mane i kam insayd (Man)"
  },
  "Money-Out (Month)": {
    en: "Money-Out (Month)",
    fr: "Sorties (Mois)",
    bi: "Mane i go aot (Man)"
  },
  "Profit Tracker": {
    en: "Profit Tracker",
    fr: "Suivi des Bénéfices",
    bi: "Lukluk long Olgeta Profit"
  },
  "Surplus margins audit (Revenue - Expenses)": {
    en: "Surplus margins audit (Revenue - Expenses)",
    fr: "Audit des marges de surplus (Revenus - Dépenses)",
    bi: "Sekem olgeta selen (Praes - Payout)"
  },
  "Current Month Profit": {
    en: "Current Month Profit",
    fr: "Bénéfice du Mois en Cours",
    bi: "Net Profit blong Mun ya"
  },
  "Invoiced vs Spend Outflow": {
    en: "Invoiced vs Spend Outflow",
    fr: "Facturé vs Sorties de fonds",
    bi: "Mane long Bill vs Olgeta Payout"
  },
  "YTD Total Net Profit": {
    en: "YTD Total Net Profit",
    fr: "Bénéfice Net Total Cumulé (YTD)",
    bi: "Net Profit blong Hapa Yia ya (YTD)"
  },
  "Revenue - Spend YTD": {
    en: "Revenue - Spend YTD",
    fr: "Revenus - Dépenses cumulées",
    bi: "Praes blong Salem - Payout"
  },
  "Expense Categories": {
    en: "Expense Categories",
    fr: "Catégories de Dépenses",
    bi: "Ol Klas blong Payout"
  },
  "Simple breakdown of top spending areas": {
    en: "Simple breakdown of top spending areas",
    fr: "Répartition simple des principaux domaines de dépenses",
    bi: "Lukluk we i stap smol long olgeta payout"
  },
  "Receivables (Invoices)": {
    en: "Receivables (Invoices)",
    fr: "Créances (Factures)",
    bi: "Ol Oda we yu mas Karem Mane"
  },
  "What clients owe the business": {
    en: "What clients owe the business",
    fr: "Ce que les clients doivent à l'entreprise",
    bi: "Mani we ol kastoma i pija go long bodi"
  },
  "Payables (Bills)": {
    en: "Payables (Bills)",
    fr: "Dettes (Factures à Payer)",
    bi: "Ol Toktok/Bill blong Payem"
  },
  "What we owe noble growers & exporters": {
    en: "What we owe noble growers & exporters",
    fr: "Ce que nous devons aux producteurs de Kava noble & exportateurs",
    bi: "Mane we yumi mas payem go long ol splaea"
  },
  "Settle": {
    en: "Settle",
    fr: "Régler",
    bi: "Settle-em"
  },
  "Paid": {
    en: "Paid",
    fr: "Payé",
    bi: "I Paym Finis"
  },
  "Pending": {
    en: "Pending",
    fr: "En Attente",
    bi: "I Wet Yet"
  },
  "Overdue": {
    en: "Overdue",
    fr: "En Retard",
    bi: "Overdue"
  },
  "Owed": {
    en: "Owed",
    fr: "Dû",
    bi: "I Wet Selen"
  },
  "We Owe": {
    en: "We Owe",
    fr: "Nous Devons",
    bi: "Yumi Owe"
  },
  "Staff Wages": {
    en: "Staff Wages",
    fr: "Salaires du Personnel",
    bi: "Wajes blong Staff"
  },
  "Transport Fees": {
    en: "Transport Fees",
    fr: "Frais de Transport",
    bi: "Pepa/Cost blong Transpot"
  },
  "Utilities": {
    en: "Utilities",
    fr: "Électricité & Eau",
    bi: "Bil blong Paoa/Wota"
  },
  "Venue Rent": {
    en: "Venue Rent",
    fr: "Loyer des Locaux",
    bi: "Bil blong Rentem Ples"
  },
  "Harvest Labor": {
    en: "Harvest Labor",
    fr: "Main d'œuvre Récolte",
    bi: "Wok blong Havest"
  },
  "Weeding Labor": {
    en: "Weeding Labor",
    fr: "Main d'œuvre Désherbage",
    bi: "Wok blong Klinim Giraon"
  },
  "Marine Freight": {
    en: "Marine Freight",
    fr: "Fret Maritime",
    bi: "Kargo Ref blong Sip"
  },
  "Transport Logistics": {
    en: "Transport Logistics",
    fr: "Logistique de Transport",
    bi: "Transpot blong Ol Kava"
  },
  "Prospectus Runs": {
    en: "Prospectus Runs",
    fr: "Distributions du Prospectus",
    bi: "Buk blong Ol Custom"
  },
  "Cash Flow Statement": {
    en: "Cash Flow Statement",
    fr: "Tableau des Flux de Trésorerie",
    bi: "Kash Flo Statement blong Bank"
  },
  "Operating Activities": {
    en: "Operating Activities",
    fr: "Activités d'Exploitation",
    bi: "Ol Wok blong Bisnis"
  },
  "Investing Activities": {
    en: "Investing Activities",
    fr: "Activités d'Investissement",
    bi: "Ol Wok blong Buyum Ekwipmen"
  },
  "Financing Activities": {
    en: "Financing Activities",
    fr: "Activités de Financement",
    bi: "Ol Wok blong Kash Safe"
  },
  "Cash Receipts from Customers": {
    en: "Cash Receipts from Customers",
    fr: "Entrées de Trésorerie des Clients",
    bi: "Draonem Kash blong Customa"
  },
  "Cash Paid to Suppliers / Vendors": {
    en: "Cash Paid to Suppliers / Vendors",
    fr: "Paiements aux Fournisseurs",
    bi: "Kash we i Go long Ol Growers/Suppliers"
  },
  "Cash Paid for Wages": {
    en: "Cash Paid for Wages",
    fr: "Salaires payés",
    bi: "Kash we i Go long Wajes"
  },
  "Net Cash from Operating Activities": {
    en: "Net Cash from Operating Activities",
    fr: "Flux de Trésorerie des Activités d'Exploitation",
    bi: "Net Kash blong Wok blong Bisnis"
  },
  "Net Cash from Investing Activities": {
    en: "Net Cash from Investing Activities",
    fr: "Flux de Trésorerie des Activités d’Investissement",
    bi: "Net Kash blong Buyum Ekwipmen"
  },
  "Net Cash from Financing Activities": {
    en: "Net Cash from Financing Activities",
    fr: "Flux de Trésorerie des Activités de Financement",
    bi: "Net Kash blong Kash Safe"
  },
  "Beginning Bank Balance": {
    en: "Beginning Bank Balance",
    fr: "Solde Bancaire Initial",
    bi: "Stat Kash blong Period"
  },
  "Ending Bank Balance": {
    en: "Ending Bank Balance",
    fr: "Solde Bancaire de Clôture",
    bi: "Klosing Kash blong Period"
  },
  "Interactive Cash Flow Trends": {
    en: "Interactive Cash Flow Trends",
    fr: "Tendances Interactives des Flux de Trésorerie",
    bi: "Trening blong Kash i Go i Kam"
  },
  "Analyze liquid cash inflows vs outflows over time": {
    en: "Analyze liquid cash inflows vs outflows over time",
    fr: "Analysez les entrées et sorties de trésorerie au fil du temps",
    bi: "Lukluk kash we i kam insaed wetem kash we i go aot"
  },
  "Monthly": {
    en: "Monthly",
    fr: "Mensuel",
    bi: "Mani"
  },
  "Quarterly": {
    en: "Quarterly",
    fr: "Trimestriel",
    bi: "Evri Tri Manis"
  },
  "Inflow": {
    en: "Inflow",
    fr: "Entrées",
    bi: "Kash we i Kam Insaed"
  },
  "Outflow": {
    en: "Outflow",
    fr: "Sorties",
    bi: "Kash we i Go Aot"
  },
  "Net Surplus": {
    en: "Net Surplus",
    fr: "Surplus Net",
    bi: "Net Win Profit"
  },
  "Report Interval Period": {
    en: "Report Interval Period",
    fr: "Période du Rapport",
    bi: "Period blong Repot"
  },
  "Net Cash Increase (Month/Period)": {
    en: "Net Cash Increase (Month/Period)",
    fr: "Augmentation Nette de Trésorerie (Mois/Période)",
    bi: "Net Win Kash"
  },
  "Certified Bank Report": {
    en: "Certified Bank Report",
    fr: "Rapport Bancaire Certifié",
    bi: "Repot we i Kat Stetment Stamp"
  },
  "Authorized signature": {
    en: "Authorized signature",
    fr: "Signature Autorisée",
    bi: "Sinisia blong Menesa/Supplier"
  },
  "Date verified": {
    en: "Date verified",
    fr: "Date Vérifiée",
    bi: "Deit we i Verifae"
  },
  "Print Statement": {
    en: "Print Statement",
    fr: "Imprimer le Tableau",
    bi: "Printim Statement"
  },
  "Export CSV": {
    en: "Export CSV",
    fr: "Exporter en CSV",
    bi: "Tekem aot Ledger long CSV"
  },
  "Adjust Financial Parameters": {
    en: "Adjust Financial Parameters",
    fr: "Ajuster les Paramètres Financiers",
    bi: "Jenisim Samting blong Statement"
  },
  "Bank-grade Certified": {
    en: "Bank-grade Certified",
    fr: "Certifié par la Banque",
    bi: "Kava Bank Satispaed"
  },
  "Export Ledger": {
    en: "Export Ledger",
    fr: "Exporter le Grand Livre",
    bi: "Tekem Aot Ful Ledger"
  },
  "Search transactions...": {
    en: "Search transactions...",
    fr: "Rechercher des transactions...",
    bi: "Sajem ol buk..."
  },
  "Transaction Type": {
    en: "Transaction Type",
    fr: "Type de Transaction",
    bi: "Kaen Transakson"
  },
  "All Types": {
    en: "All Types",
    fr: "Tous les Types",
    bi: "Evri Kaen"
  },
  "Record Class": {
    en: "Record Class",
    fr: "Classe d'Enregistrement",
    bi: "Grup blong Transakson"
  },
  "Interactive Master Ledger Registry": {
    en: "Interactive Master Ledger Registry",
    fr: "Registre Interactif du Grand Livre",
    bi: "Grup blong Lukluk Transakson"
  },
  "Equipment / Asset Purchase": {
    en: "Equipment / Asset Purchase",
    fr: "Achat d'Équipement / Actif",
    bi: "Spand blong Buyum Ekwipmen"
  },
  "Microfinance Loan Drawdown": {
    en: "Microfinance Loan Drawdown",
    fr: "Déblocage de Microcrédit",
    bi: "Selen we Yumi Karem long Bank"
  },
  "Owner / Partner Cash Injection": {
    en: "Owner / Partner Cash Injection",
    fr: "Apport en Capital",
    bi: "Selen we Ona i Spandem In"
  },
  "Loan Repayment": {
    en: "Loan Repayment",
    fr: "Remboursement d'Emprunt",
    bi: "Kash we Yumi Payem Bakek long Bank"
  },
  "Nakamal Retail Operating Group": {
    en: "Nakamal Retail Operating Group",
    fr: "Groupe d'Exploitation Nakamal",
    bi: "Nakamal Retail Wok Grup"
  },
  "Epic Agricultural Kava Wholesale": {
    en: "Epic Agricultural Kava Wholesale",
    fr: "Vente en Gros Agricole Kava Épique",
    bi: "Nambawan Agrikol Kava Wholesale"
  },
  "Bank Underwriter Pack": {
    en: "Bank Underwriter Pack",
    fr: "Dossier d'Analyse Crédit",
    bi: "Ol Pepa blong Sendem long Bank"
  },
  "This financial statement is prepared in accordance with Vanuatu National Financial Quality standards for direct submission to banking institutions and microcredit lenders.": {
    en: "This financial statement is prepared in accordance with Vanuatu National Financial Quality standards for direct submission to banking institutions and microcredit lenders.",
    fr: "Ce tableau de flux de trésorerie est conforme aux normes financières nationales du Vanuatu pour soumission directe aux institutions de crédit.",
    bi: "Gudfala pepa ia i foldaon folem standards blong Vanuatu blong yu savve tekem i go long bank blong karem selen or loan."
  }
};

const customMappingsNormalized: Record<string, Record<LanguageCode, string>> = {};
Object.entries(customMappings).forEach(([k, v]) => {
  customMappingsNormalized[normalizeTextKey(k)] = v;
});

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('kava_app_language');
    if (saved === 'en' || saved === 'fr' || saved === 'bi') {
      return saved;
    }
    return 'en';
  });

  const [aiCache, setAiCache] = useState<Record<string, Record<string, string>>>(() => {
    try {
      const saved = localStorage.getItem('kava_app_ai_translations');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const pendingRef = React.useRef<Set<string>>(new Set());

  const queueTranslation = (text: string, lang: LanguageCode) => {
    if (!text || text.length < 2) return;
    const cacheKey = `${lang}:${text}`;
    if (pendingRef.current.has(cacheKey)) return;
    pendingRef.current.add(cacheKey);

    setTimeout(async () => {
      try {
        const response = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, targetLang: lang })
        });
        const data = await response.json();
        if (data.translatedText) {
          setAiCache(prev => {
            const next = {
              ...prev,
              [lang]: {
                ...(prev[lang] || {}),
                [text]: data.translatedText
              }
            };
            localStorage.setItem('kava_app_ai_translations', JSON.stringify(next));
            return next;
          });
        }
      } catch (err) {
        console.error('[LanguageContext AI Translate Error]', err);
      } finally {
        pendingRef.current.delete(cacheKey);
      }
    }, 50);
  };

  useEffect(() => {
    localStorage.setItem('kava_app_language', locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (lang: LanguageCode) => {
    setLocaleState(lang);
  };

  const t = (key: string): string => {
    if (!key) return '';

    // 1. Direct dictionary matches in active locale
    if (translations[locale] && translations[locale][key]) {
      return translations[locale][key];
    }

    const cleanKey = key.toLowerCase().trim().replace(/ /g, '_');
    if (translations[locale] && translations[locale][cleanKey]) {
      return translations[locale][cleanKey];
    }

    // 2. Case and symbol insensitive match in selected locale dictionary
    const normalizedTarget = normalizeTextKey(key);
    if (translations[locale]) {
      for (const [dictKey, value] of Object.entries(translations[locale]) as [string, string][]) {
        if (normalizeTextKey(dictKey) === normalizedTarget) {
          return value;
        }
      }
    }

    // 3. High-quality custom translations mapping match MUST precede English fallbacks & AI
    const matchedCustom = customMappingsNormalized[normalizedTarget];
    if (matchedCustom && matchedCustom[locale]) {
      return matchedCustom[locale];
    }

    // 4. Background dynamic AI translation for non-English locales (fully enabled for all accounts/roles)
    if (locale !== 'en') {
      const cached = aiCache[locale]?.[key];
      if (cached) {
        return cached;
      }
      queueTranslation(key, locale);
    }

    // 5. English safety fallbacks
    if (translations['en'][key]) {
      return translations['en'][key];
    }
    if (translations['en'][cleanKey]) {
      return translations['en'][cleanKey];
    }
    for (const [dictKey, value] of Object.entries(translations['en']) as [string, string][]) {
      if (normalizeTextKey(dictKey) === normalizedTarget) {
        return value;
      }
    }

    // 6. Prettify fallback: title casing and underscore spacing removal
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
