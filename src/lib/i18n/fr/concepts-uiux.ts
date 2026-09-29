/** French (fr-CA) strings for concepts C04, C10 and the gallery — owned by the UI/UX engineer. */
export const FR_UIUX: Record<string, string> = {
	// ---- shared by C04 + C10 --------------------------------------------------
	'Create a contract': 'Créer un contrat',
	'1 step · about {m} min': '1 étape · environ {m} min',
	'{n} steps · about {m} min': '{n} étapes · environ {m} min',
	completed: 'terminée',
	'not started': 'non commencée',
	'locked until earlier steps are done': 'verrouillée jusqu’à ce que les étapes précédentes soient terminées',

	// ---- C04 Product-first launcher --------------------------------------------
	'current step': 'étape en cours',
	'has errors': 'contient des erreurs',
	'Steps for {product}': 'Étapes pour {product}',
	'Choose the protection product first. We shape the steps around it, so you only answer what that contract needs.':
		'Choisissez d’abord le produit de protection. Nous adaptons les étapes en conséquence : vous ne répondez qu’à ce dont ce contrat a besoin.',
	'Path:': 'Parcours :',
	'Your path': 'Votre parcours',
	', change product': ', changer de produit',
	Step: 'Étape',
	'{n} of {total}': '{n} de {total}',
	', show all steps': ', afficher toutes les étapes',

	// ---- C10 Timeline -----------------------------------------------------------
	'in progress': 'en cours',
	'needs attention': 'à corriger',
	'Needs attention': 'À corriger',
	Covers: 'Couvre',
	Price: 'Prix',
	'Finished steps fold into summaries as you go, so this page is your review. Use Change to fix anything.':
		'Les étapes terminées se replient en résumés au fil de la saisie : cette page devient votre vérification. Utilisez Modifier pour corriger quoi que ce soit.',
	'Everything above goes on the contract. Check it once more, then create it.':
		'Tout ce qui figure ci-dessus sera inscrit au contrat. Vérifiez une dernière fois, puis créez-le.',

	// ---- gallery settings drawer ----------------------------------------------
	'Wizard concepts · Insclix Dealer': 'Concepts d’assistant · Insclix Concessionnaire',
	'Wizard concepts': 'Concepts d’assistant',
	'Insclix Dealer · Core systems prototype': 'Insclix Concessionnaire · Prototype des systèmes de base',
	'Concept {n}: {name}': 'Concept {n} : {name}',
	'Prototype settings': 'Paramètres du prototype',
	'Prototype settings (,)': 'Paramètres du prototype (,)',
	Concept: 'Concept',
	'Previous concept': 'Concept précédent',
	'Next concept': 'Concept suivant',
	'Why it fits:': 'Pourquoi ça convient :',
	Desktop: 'Ordinateur',
	Tablet: 'Tablette',
	Mobile: 'Mobile',
	'UI/UX engineer': 'Ingénieur UI/UX',
	'Desktop designer': 'Designer ordinateur',
	'Mobile designer': 'Designer mobile',
	Preview: 'Aperçu',
	'1 step': '1 étape',
	'{n} steps': '{n} étapes',
	Viewport: 'Affichage',
	'Desktop · fluid': 'Ordinateur · fluide',
	'Laptop · 1280': 'Portable · 1280',
	'Tablet · 820': 'Tablette · 820',
	'Phone · 390': 'Téléphone · 390',
	Tokens: 'Jetons',
	'Design tokens': 'Jetons de design',
	'Clean blue': 'Bleu épuré',
	'Insclix navy': 'Marine Insclix',
	Theme: 'Thème',
	Light: 'Clair',
	Dark: 'Sombre',
	Density: 'Densité',
	Comfortable: 'Confortable',
	Compact: 'Compacte',
	Actions: 'Actions',
	'Open concept full screen': 'Ouvrir le concept en plein écran',
	'UX rules every concept follows': 'Règles UX suivies par chaque concept',
	'Shortcuts:': 'Raccourcis :',
	'switch concept': 'changer de concept',
	'open settings': 'ouvrir les paramètres',

	// ---- concept names ------------------------------------------------------------
	'Sticky horizontal stepper': 'Barre d’étapes horizontale fixe',
	'Vertical step rail': 'Rail d’étapes vertical',
	'Three-pane workbench': 'Poste de travail à trois volets',
	'Product-first launcher': 'Lanceur « produit d’abord »',
	'One thing per page': 'Une chose par page',
	'Mobile native app': 'Application mobile native',
	'Task list hub': 'Centre de tâches',
	'Drawer over contracts': 'Tiroir par-dessus les contrats',
	'Keyboard-first power mode': 'Mode expert au clavier',
	'Timeline, review as you go': 'Chronologie, vérification en continu',

	// ---- concept summaries --------------------------------------------------------
	'The current wizard, modernised: labelled steps pinned to the top, labels above fields, grouped sections, sticky footer with Close, Save draft, Back and a Next button that names the next step.':
		'L’assistant actuel, modernisé : étapes nommées épinglées en haut, libellés au-dessus des champs, sections regroupées, pied de page fixe avec Fermer, Enregistrer le brouillon, Retour et un bouton Suivant qui nomme l’étape suivante.',
	'A left rail lists every step with its status (done, current, error, locked). The form sits on the right. Steps can grow down the page when a product adds more.':
		'Un rail à gauche liste chaque étape avec son statut (terminée, en cours, erreur, verrouillée). Le formulaire est à droite. La liste s’allonge vers le bas quand un produit ajoute des étapes.',
	'Step rail | form capped at ~640px | sticky live contract summary with price. Fills wide monitors with what F&I staff actually check while typing.':
		'Rail d’étapes | formulaire limité à ~640 px | résumé du contrat fixe et en direct, avec le prix. Remplit les grands écrans avec ce que le personnel F&A vérifie réellement pendant la saisie.',
	'Starts on a full-page product gallery. Picking a product redraws a tailored flow; a path strip shows exactly which steps that product needs and how long it takes.':
		'Commence par une galerie de produits pleine page. Le choix d’un produit redessine un parcours sur mesure; une bande de parcours montre exactement les étapes requises et leur durée.',
	'Conversational flow: one question or one tight group per screen, big type, a back link and Continue, ending on a Check your answers page.':
		'Parcours conversationnel : une question ou un petit groupe par écran, gros caractères, un lien de retour et Continuer, pour finir sur une page « Vérifiez vos réponses ».',
	'Phone-first: compact "Step 2 of 5" header with a segmented bar, tappable step-map sheet, VIN camera scan, bottom-sheet pickers and a sticky thumb-zone footer.':
		'Pensé pour le téléphone : en-tête compact « Étape 2 de 5 » avec barre segmentée, carte des étapes touchable, numérisation du NIV par caméra, sélecteurs en feuille inférieure et pied de page fixe à portée du pouce.',
	'The contract home lists tasks — Customer, Vehicle, Coverage — each with a status tag. Each opens a short sub-flow and returns to the hub. Submit unlocks when all are done.':
		'L’accueil du contrat liste les tâches — Client, Véhicule, Couverture — chacune avec une étiquette de statut. Chacune ouvre un court sous-parcours puis revient au centre. L’envoi se déverrouille quand tout est terminé.',
	'The dealer stays on the contract lookup table. "New contract" slides a wide drawer in from the right with a compact stepper; closing it keeps a draft row in the table.':
		'Le concessionnaire reste sur le tableau de recherche des contrats. « Nouveau contrat » fait glisser un large tiroir depuis la droite avec une barre d’étapes compacte; le fermer conserve un brouillon dans le tableau.',
	'Dense, compact layout for high-volume F&I desks: Ctrl+K command menu, Alt+1…6 to jump steps, Ctrl+Enter for Next, visible shortcut legend and a single tab order.':
		'Mise en page dense et compacte pour les bureaux F&A à fort volume : menu de commandes Ctrl+K, Alt+1…6 pour sauter d’étape, Ctrl+Entrée pour Suivant, légende des raccourcis visible et un seul ordre de tabulation.',
	'A single scrolling page. Finished steps collapse into summary cards with Change links; the active step stays open below them. The page itself becomes the review.':
		'Une seule page défilante. Les étapes terminées se replient en fiches résumées avec des liens Modifier; l’étape active reste ouverte en dessous. La page elle-même devient la vérification.',

	// ---- concept "why it fits" ----------------------------------------------------
	'Closest to what dealers already know, so it is the lowest-risk upgrade. Collapses to "Step 2 of 5" on phones.':
		'Le plus proche de ce que les concessionnaires connaissent déjà : c’est la mise à niveau la moins risquée. Se réduit à « Étape 2 de 5 » sur téléphone.',
	'Wear Pass has 5 steps and a service contract has 6 — a vertical list absorbs that without cramping a top bar.':
		'Wear Pass compte 5 étapes et un contrat de service 6 — une liste verticale absorbe l’écart sans surcharger une barre en haut.',
	'Uses the empty width of the legacy layout. The price and VIN stay visible the whole time, like a checkout order summary.':
		'Exploite la largeur vide de l’ancienne mise en page. Le prix et le NIV restent visibles en tout temps, comme le résumé d’une commande au paiement.',
	'Steps branch by product, so settle the product first and show the dealer the shape of the flow before they commit.':
		'Les étapes varient selon le produit : on règle donc le produit d’abord et on montre au concessionnaire la forme du parcours avant qu’il s’engage.',
	'Calm and hard to get wrong — suits occasional users and customers filling details on a showroom tablet.':
		'Calme et difficile à rater — convient aux utilisateurs occasionnels et aux clients qui remplissent leurs renseignements sur une tablette en salle d’exposition.',
	'Staff walk the lot with a phone. Everything reachable with one thumb, no horizontal stepper overflow.':
		'Le personnel parcourt le terrain avec un téléphone. Tout est accessible d’un seul pouce, sans barre d’étapes horizontale qui déborde.',
	'Contracts get started, parked (waiting on a VIN or signature) and finished later. The hub makes resuming obvious.':
		'Les contrats sont commencés, mis en attente (d’un NIV ou d’une signature) et terminés plus tard. Le centre rend la reprise évidente.',
	'Lookup and creation are the two core jobs — the dealer never loses their place in the list.':
		'La recherche et la création sont les deux tâches principales — le concessionnaire ne perd jamais sa place dans la liste.',
	'Power users enter many contracts a day; NN/g warns wizards get tedious for repeat tasks. Shortcuts remove the friction.':
		'Les utilisateurs experts saisissent de nombreux contrats par jour; NN/g prévient que les assistants deviennent fastidieux pour les tâches répétitives. Les raccourcis éliminent la friction.',
	'No surprise review screen at the end — mistakes surface next to the answer that caused them.':
		'Aucun écran de vérification surprise à la fin — les erreurs apparaissent à côté de la réponse qui les a causées.',

	// ---- UX rules -------------------------------------------------------------------
	'Name every step with a verb + noun ("Add vehicle") and show where you are.':
		'Nommez chaque étape avec un verbe + un nom (« Ajouter le véhicule ») et indiquez où l’on se trouve.',
	'Pick the product first; recompute the step list and "Step X of N" when it changes.':
		'Choisissez le produit d’abord; recalculez la liste des étapes et « Étape X de N » quand il change.',
	'Validate on blur, clear the error the moment the value becomes valid.':
		'Validez à la sortie du champ; effacez l’erreur dès que la valeur devient valide.',
	'On a failed Next, show an error summary at the top, focus it, link each error to its field.':
		'Si Suivant échoue, affichez un résumé des erreurs en haut, donnez-lui le focus et liez chaque erreur à son champ.',
	'Labels above fields; single column with related fields grouped on one row.':
		'Libellés au-dessus des champs; une seule colonne, les champs liés regroupés sur une même ligne.',
	'Address lookup by default with manual fallback; postal code fills province.':
		'Recherche d’adresse par défaut avec saisie manuelle en secours; le code postal remplit la province.',
	'Decode the VIN to fill year / make / model; allow a camera scan on mobile.':
		'Décodez le NIV pour remplir l’année, la marque et le modèle; permettez la numérisation par caméra sur mobile.',
	'Autosave drafts; Close never throws work away.':
		'Enregistrez les brouillons automatiquement; Fermer ne fait jamais perdre le travail.',
	'End with a review page grouped by step, with Change links. Final button says "Create contract".':
		'Terminez par une page de vérification groupée par étape, avec des liens Modifier. Le dernier bouton indique « Créer le contrat ».',
	'Only jump forward to steps whose earlier steps are valid; always allow going back.':
		'Ne permettez d’avancer qu’aux étapes dont les étapes précédentes sont valides; permettez toujours de revenir en arrière.',
	'Mobile: 44px+ targets, sticky primary action in the thumb zone, right keyboard per field.':
		'Mobile : cibles de 44 px et plus, action principale fixe à portée du pouce, bon clavier pour chaque champ.',
	'No horizontal stepper on phones — use "Step X of N" + a bar + a step-map sheet.':
		'Pas de barre d’étapes horizontale sur téléphone — utilisez « Étape X de N » + une barre + une feuille de carte des étapes.'
};
