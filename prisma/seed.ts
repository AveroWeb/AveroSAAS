import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const daysAgo = (days: number) => daysFromNow(-days);

async function main() {
  const orgName = process.env.SEED_ORG_NAME ?? "Mon Agence";
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.com").toLowerCase().trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "change-me";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Admin";

  console.log(`Seeding organization "${orgName}"...`);

  const org = await prisma.organization.upsert({
    where: { slug: "mon-agence" },
    update: {},
    create: { name: orgName, slug: "mon-agence" },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      organizationId: org.id,
      email: adminEmail,
      passwordHash,
      name: adminName,
      role: "ADMIN",
    },
  });

  // --- Plans ------------------------------------------------------------
  const [essentiel, business, premium] = await Promise.all([
    prisma.plan.create({
      data: { organizationId: org.id, name: "Essentiel", monthlyPrice: 49, description: "Site vitrine, hébergement, maintenance de base." },
    }),
    prisma.plan.create({
      data: { organizationId: org.id, name: "Business", monthlyPrice: 99, description: "Site + maintenance mensuelle + support prioritaire." },
    }),
    prisma.plan.create({
      data: { organizationId: org.id, name: "Premium", monthlyPrice: 199, description: "Site avancé, e-commerce, maintenance hebdomadaire, SEO." },
    }),
  ]);

  // --- Clients ------------------------------------------------------------
  const dupont = await prisma.client.create({
    data: {
      organizationId: org.id,
      companyName: "Dupont Immobilier",
      contactName: "Jean Dupont",
      email: "jean.dupont@dupont-immobilier.fr",
      phone: "+33 6 12 34 56 78",
      address: "12 rue de la République, 69002 Lyon",
      status: "ACTIVE",
      notes: "Client historique, très réactif. Préfère être contacté par téléphone.",
      createdAt: daysAgo(210),
    },
  });

  const boulangerie = await prisma.client.create({
    data: {
      organizationId: org.id,
      companyName: "Boulangerie Martin",
      contactName: "Sophie Martin",
      email: "sophie@boulangerie-martin.fr",
      phone: "+33 6 98 76 54 32",
      address: "5 place du Marché, 33000 Bordeaux",
      status: "ACTIVE",
      notes: "Vend en ligne pendant les fêtes, pic de trafic à surveiller en décembre.",
      createdAt: daysAgo(140),
    },
  });

  const atelier = await prisma.client.create({
    data: {
      organizationId: org.id,
      companyName: "Atelier Créatif",
      contactName: "Lucas Bernard",
      email: "lucas@atelier-creatif.fr",
      phone: "+33 6 11 22 33 44",
      status: "PROSPECT",
      notes: "Devis envoyé pour un site portfolio, relance prévue.",
      createdAt: daysAgo(10),
    },
  });

  // --- Sites ------------------------------------------------------------
  const siteDupont = await prisma.site.create({
    data: {
      organizationId: org.id,
      clientId: dupont.id,
      name: "Dupont Immobilier — Vitrine",
      url: "https://dupont-immobilier.fr",
      type: "WORDPRESS",
      environment: "PRODUCTION",
      status: "ACTIVE",
      repositoryUrl: "https://github.com/mon-agence/dupont-immobilier",
      launchedAt: daysAgo(200),
      lastBackupAt: daysAgo(1),
    },
  });

  const siteBoulangerieVitrine = await prisma.site.create({
    data: {
      organizationId: org.id,
      clientId: boulangerie.id,
      name: "Boulangerie Martin — Vitrine",
      url: "https://boulangerie-martin.fr",
      type: "WORDPRESS",
      environment: "PRODUCTION",
      status: "ACTIVE",
      launchedAt: daysAgo(130),
      lastBackupAt: daysAgo(2),
    },
  });

  const siteBoulangerieBoutique = await prisma.site.create({
    data: {
      organizationId: org.id,
      clientId: boulangerie.id,
      name: "Boulangerie Martin — Boutique en ligne",
      url: "https://boutique.boulangerie-martin.fr",
      type: "SHOPIFY",
      environment: "PRODUCTION",
      status: "MAINTENANCE",
      launchedAt: daysAgo(60),
      lastBackupAt: daysAgo(3),
      notes: "Formulaire de commande instable, en cours de correction.",
    },
  });

  const siteAtelier = await prisma.site.create({
    data: {
      organizationId: org.id,
      clientId: atelier.id,
      name: "Atelier Créatif — Portfolio",
      url: "https://staging.atelier-creatif.fr",
      type: "NEXTJS",
      environment: "STAGING",
      status: "ACTIVE",
      repositoryUrl: "https://github.com/mon-agence/atelier-creatif",
      stagingUrl: "https://staging.atelier-creatif.fr",
    },
  });

  // --- Domains ------------------------------------------------------------
  await prisma.domain.createMany({
    data: [
      {
        organizationId: org.id,
        clientId: dupont.id,
        siteId: siteDupont.id,
        name: "dupont-immobilier.fr",
        isPrimary: true,
        registrar: "OVH",
        registrarUrl: "https://www.ovh.com/manager/",
        expiresAt: daysFromNow(20),
        autoRenew: true,
        annualCost: 12,
        status: "EXPIRING",
      },
      {
        organizationId: org.id,
        clientId: boulangerie.id,
        siteId: siteBoulangerieVitrine.id,
        name: "boulangerie-martin.fr",
        isPrimary: true,
        registrar: "OVH",
        registrarUrl: "https://www.ovh.com/manager/",
        expiresAt: daysFromNow(200),
        autoRenew: true,
        annualCost: 12,
        status: "ACTIVE",
      },
      {
        organizationId: org.id,
        clientId: atelier.id,
        siteId: siteAtelier.id,
        name: "atelier-creatif.fr",
        isPrimary: true,
        registrar: "Gandi",
        registrarUrl: "https://admin.gandi.net/",
        expiresAt: daysFromNow(5),
        autoRenew: false,
        annualCost: 15,
        status: "EXPIRING",
      },
    ],
  });

  // --- Hosting ------------------------------------------------------------
  await prisma.hosting.createMany({
    data: [
      {
        organizationId: org.id,
        clientId: dupont.id,
        siteId: siteDupont.id,
        provider: "Hostinger",
        dashboardUrl: "https://hpanel.hostinger.com/",
        serverType: "Mutualisé",
        accountRef: "hostinger-dupont",
        monthlyCost: 8,
        annualCost: 90,
        renewsAt: daysFromNow(15),
      },
      {
        organizationId: org.id,
        clientId: boulangerie.id,
        siteId: siteBoulangerieVitrine.id,
        provider: "o2switch",
        dashboardUrl: "https://cpanel.o2switch.net/",
        serverType: "Mutualisé",
        accountRef: "o2switch-boulangerie",
        monthlyCost: 9,
        annualCost: 100,
        renewsAt: daysFromNow(260),
      },
      {
        organizationId: org.id,
        clientId: atelier.id,
        siteId: siteAtelier.id,
        provider: "Vercel",
        dashboardUrl: "https://vercel.com/dashboard",
        serverType: "Serverless",
        accountRef: "vercel-atelier",
        monthlyCost: 0,
      },
    ],
  });

  // --- Tools ------------------------------------------------------------
  await prisma.tool.createMany({
    data: [
      { organizationId: org.id, clientId: dupont.id, siteId: siteDupont.id, name: "GitHub", category: "Repository", url: "https://github.com/mon-agence/dupont-immobilier", identifier: "mon-agence" },
      { organizationId: org.id, clientId: dupont.id, siteId: siteDupont.id, name: "Google Analytics", category: "Analytics", url: "https://analytics.google.com/", identifier: "dupont-immobilier.fr" },
      { organizationId: org.id, clientId: dupont.id, siteId: siteDupont.id, name: "Google Search Console", category: "SEO", url: "https://search.google.com/search-console" },
      { organizationId: org.id, clientId: dupont.id, name: "Cloudflare", category: "DNS / CDN", url: "https://dash.cloudflare.com/" },
      { organizationId: org.id, clientId: boulangerie.id, siteId: siteBoulangerieVitrine.id, name: "GitHub", category: "Repository", url: "https://github.com/mon-agence/boulangerie-martin" },
      { organizationId: org.id, clientId: boulangerie.id, siteId: siteBoulangerieBoutique.id, name: "Shopify Admin", category: "E-commerce", url: "https://admin.shopify.com/" },
      { organizationId: org.id, clientId: boulangerie.id, name: "Google Analytics", category: "Analytics", url: "https://analytics.google.com/" },
      { organizationId: org.id, clientId: atelier.id, siteId: siteAtelier.id, name: "GitHub", category: "Repository", url: "https://github.com/mon-agence/atelier-creatif" },
      { organizationId: org.id, clientId: atelier.id, name: "Figma", category: "Design", url: "https://figma.com/" },
      { organizationId: org.id, clientId: atelier.id, siteId: siteAtelier.id, name: "Vercel", category: "Hosting", url: "https://vercel.com/dashboard" },
    ],
  });

  // --- Subscriptions ------------------------------------------------------
  await prisma.subscription.createMany({
    data: [
      {
        organizationId: org.id,
        clientId: dupont.id,
        planId: essentiel.id,
        monthlyPrice: 49,
        startDate: daysAgo(210),
        renewalDate: daysAgo(30),
        status: "CANCELLED",
        description: "Ancien forfait, remplacé par Business.",
      },
      {
        organizationId: org.id,
        clientId: dupont.id,
        planId: business.id,
        monthlyPrice: 99,
        startDate: daysAgo(30),
        renewalDate: daysFromNow(15),
        status: "ACTIVE",
      },
      {
        organizationId: org.id,
        clientId: boulangerie.id,
        planId: premium.id,
        monthlyPrice: 199,
        startDate: daysAgo(140),
        renewalDate: daysFromNow(25),
        status: "ACTIVE",
      },
    ],
  });

  // --- Maintenance tasks ---------------------------------------------------
  await prisma.maintenanceTask.createMany({
    data: [
      { organizationId: org.id, clientId: dupont.id, siteId: siteDupont.id, title: "Vérifier les sauvegardes", frequency: "WEEKLY", status: "PENDING", nextRunAt: daysAgo(2), lastRunAt: daysAgo(9) },
      { organizationId: org.id, clientId: dupont.id, siteId: siteDupont.id, title: "Mettre à jour WordPress et plugins", frequency: "MONTHLY", status: "PENDING", nextRunAt: daysFromNow(5), lastRunAt: daysAgo(25) },
      { organizationId: org.id, clientId: dupont.id, siteId: siteDupont.id, title: "Vérifier le certificat SSL", frequency: "QUARTERLY", status: "PENDING", nextRunAt: daysFromNow(40) },
      { organizationId: org.id, clientId: boulangerie.id, siteId: siteBoulangerieVitrine.id, title: "Vérifier le formulaire de contact", frequency: "MONTHLY", status: "PENDING", nextRunAt: daysFromNow(3) },
      { organizationId: org.id, clientId: boulangerie.id, siteId: siteBoulangerieBoutique.id, title: "Vérifier la disponibilité (uptime)", frequency: "DAILY", status: "PENDING", nextRunAt: daysAgo(1) },
      { organizationId: org.id, clientId: boulangerie.id, siteId: siteBoulangerieVitrine.id, title: "Vérifier les DNS", frequency: "QUARTERLY", status: "DONE", nextRunAt: daysFromNow(70), lastRunAt: daysAgo(20) },
    ],
  });

  // --- Incidents ------------------------------------------------------------
  const incidentDupont = await prisma.incident.create({
    data: {
      organizationId: org.id,
      clientId: dupont.id,
      siteId: siteDupont.id,
      title: "Site inaccessible",
      description: "Le site renvoyait une erreur 502 pendant environ 20 minutes.",
      cause: "Dépassement de la limite de ressources chez l'hébergeur.",
      solution: "Redémarrage du service PHP et augmentation du plan d'hébergement.",
      status: "RESOLVED",
      priority: "CRITICAL",
      startedAt: daysAgo(15),
      resolvedAt: daysAgo(15),
      events: {
        create: [
          { message: "Incident détecté par surveillance manuelle.", createdAt: daysAgo(15) },
          { message: "Vérification de l'hébergement en cours.", createdAt: daysAgo(15) },
          { message: "Contact avec le client pour l'informer.", createdAt: daysAgo(15) },
          { message: "Problème résolu, site de nouveau en ligne.", createdAt: daysAgo(15) },
        ],
      },
    },
  });

  const incidentBoulangerie = await prisma.incident.create({
    data: {
      organizationId: org.id,
      clientId: boulangerie.id,
      siteId: siteBoulangerieBoutique.id,
      title: "Formulaire de commande en erreur",
      description: "Les clients ne peuvent pas valider leur panier sur la boutique en ligne.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      startedAt: daysAgo(1),
      events: {
        create: [
          { message: "Signalement du client par téléphone.", createdAt: daysAgo(1) },
          { message: "Reproduction du bug confirmée sur la boutique.", createdAt: daysAgo(1) },
        ],
      },
    },
  });

  // --- Tasks ------------------------------------------------------------
  await prisma.task.createMany({
    data: [
      { organizationId: org.id, clientId: boulangerie.id, siteId: siteBoulangerieBoutique.id, title: "Corriger le bug du formulaire de commande", priority: "URGENT", status: "IN_PROGRESS", dueDate: daysFromNow(0) },
      { organizationId: org.id, clientId: dupont.id, siteId: siteDupont.id, title: "Renouveler le nom de domaine", priority: "HIGH", status: "TODO", dueDate: daysFromNow(7) },
      { organizationId: org.id, clientId: atelier.id, title: "Envoyer la proposition commerciale", priority: "NORMAL", status: "TODO", dueDate: daysFromNow(2) },
      { organizationId: org.id, clientId: boulangerie.id, title: "Préparer le rapport mensuel", priority: "NORMAL", status: "WAITING", dueDate: daysFromNow(4) },
      { organizationId: org.id, clientId: dupont.id, title: "Appeler le client pour le suivi trimestriel", priority: "LOW", status: "TODO", dueDate: daysAgo(2) },
      { organizationId: org.id, clientId: atelier.id, siteId: siteAtelier.id, title: "Finaliser la maquette Figma", priority: "NORMAL", status: "DONE", dueDate: daysAgo(5) },
    ],
  });

  // --- Activity log (client history) --------------------------------------
  await prisma.activityLog.createMany({
    data: [
      { organizationId: org.id, clientId: dupont.id, type: "CLIENT_CREATED", message: "Client créé.", createdAt: daysAgo(210) },
      { organizationId: org.id, clientId: dupont.id, type: "SITE_CREATED", message: "Site dupont-immobilier.fr mis en ligne.", createdAt: daysAgo(200) },
      { organizationId: org.id, clientId: dupont.id, type: "INCIDENT_RESOLVED", message: "Incident \"Site inaccessible\" résolu.", createdAt: daysAgo(15) },
      { organizationId: org.id, clientId: dupont.id, type: "SUBSCRIPTION_STARTED", message: "Passage au forfait Business (99€/mois).", createdAt: daysAgo(30) },
      { organizationId: org.id, clientId: boulangerie.id, type: "CLIENT_CREATED", message: "Client créé.", createdAt: daysAgo(140) },
      { organizationId: org.id, clientId: boulangerie.id, type: "SITE_CREATED", message: "Boutique en ligne mise en service.", createdAt: daysAgo(60) },
      { organizationId: org.id, clientId: boulangerie.id, type: "INCIDENT_OPENED", message: "Incident \"Formulaire de commande en erreur\" ouvert.", createdAt: daysAgo(1) },
      { organizationId: org.id, clientId: atelier.id, type: "CLIENT_CREATED", message: "Client (prospect) créé.", createdAt: daysAgo(10) },
    ],
  });

  console.log("Seed terminé.");
  console.log(`Connexion admin : ${adminEmail} / ${adminPassword}`);
  console.log({ incidentDupont: incidentDupont.id, incidentBoulangerie: incidentBoulangerie.id });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
