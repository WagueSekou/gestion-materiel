const Chatbot = require('../models/Chatbot');
const EquipmentRequest = require('../models/EquipmentRequest');
const FaultReport = require('../models/FaultReport');
const Materiel = require('../models/Materiel');

// Get or create chatbot session
exports.getSession = async (req, res) => {
  try {
    let session = await Chatbot.findOne({ 
      user: req.user.id, 
      isActive: true 
    });

    if (!session) {
      session = await Chatbot.create({
        user: req.user.id,
        sessionId: `session_${req.user.id}_${Date.now()}`,
        context: {
          userRole: req.user.role,
          currentTask: null,
          lastAction: null
        }
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        messages: session.messages,
        context: session.context
      }
    });
  } catch (error) {
    console.error('Get chatbot session error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting chatbot session' 
    });
  }
};

// Send message to chatbot
exports.sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    let session = await Chatbot.findOne({ 
      user: req.user.id, 
      sessionId: sessionId 
    });

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    // Add user message
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Generate bot response based on user role and message content
    const botResponse = await generateBotResponse(message, req.user.role, session.context);
    
    // Add bot response
    session.messages.push({
      role: 'assistant',
      content: botResponse.content,
      timestamp: new Date(),
      context: botResponse.context
    });

    // Update context
    if (botResponse.context) {
      session.context = { ...session.context, ...botResponse.context };
    }
    
    session.lastActivity = new Date();
    await session.save();

    res.json({
      success: true,
      data: {
        response: botResponse.content,
        context: session.context
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing message' 
    });
  }
};

// Generate bot response based on message and user role
async function generateBotResponse(message, userRole, context) {
  console.log('Chatbot: Processing message:', message, 'for role:', userRole);
  const lowerMessage = message.toLowerCase();
  
  // Enhanced keyword detection with more comprehensive patterns
  const keywords = {
    equipment: ['demande', 'équipement', 'request', 'besoin', 'matériel', 'ordinateur', 'caméra', 'microphone', 'écran', 'clavier', 'souris', 'câble', 'obtenir', 'avoir', 'utiliser', 'prêter', 'emprunter', 'allouer'],
    fault: ['panne', 'problème', 'fault', 'erreur', 'bug', 'dysfonctionnement', 'ne marche pas', 'cassé', 'défaillant', 'signalement', 'rapport', 'défaillance', 'incident', 'dysfonctionne'],
    maintenance: ['maintenance', 'réparation', 'réparer', 'intervention', 'technicien', 'corriger', 'fix', 'réparer', 'réviser', 'vérifier', 'contrôler', 'entretien'],
    statistics: ['statistique', 'rapport', 'gestion', 'données', 'analyse', 'graphique', 'chiffre', 'nombre', 'total', 'pourcentage', 'métrique', 'performance', 'indicateur'],
    user: ['utilisateur', 'user', 'compte', 'profil', 'connexion', 'mot de passe', 'authentification', 'login', 'se connecter'],
    schedule: ['planning', 'calendrier', 'horaire', 'rendez-vous', 'intervention', 'planifier', 'programmer', 'agenda', 'planification'],
    help: ['aide', 'help', 'comment', 'guide', 'tutoriel', 'assistance', 'support', 'que puis-je', 'que peux-je', 'comment faire', 'guide moi'],
    status: ['statut', 'état', 'situation', 'où en est', 'avancement', 'progression', 'suivi', 'suivre', 'vérifier'],
    create: ['créer', 'ajouter', 'nouveau', 'nouvelle', 'ajout', 'insérer', 'enregistrer', 'générer', 'faire'],
    view: ['voir', 'afficher', 'consulter', 'lister', 'montrer', 'regarder', 'visualiser', 'découvrir', 'trouver'],
    update: ['modifier', 'changer', 'mettre à jour', 'éditer', 'corriger', 'actualiser', 'réviser', 'améliorer'],
    delete: ['supprimer', 'effacer', 'enlever', 'retirer', 'détruire', 'annuler', 'retirer'],
    search: ['chercher', 'rechercher', 'trouver', 'localiser', 'identifier', 'découvrir'],
    export: ['exporter', 'télécharger', 'sauvegarder', 'imprimer', 'pdf', 'excel', 'fichier'],
    import: ['importer', 'charger', 'uploader', 'téléverser', 'ajouter en masse']
  };

  // Context-aware responses based on previous conversation
  if (context && context.currentTask) {
    const contextualResponse = handleContextualResponse(message, userRole, context, lowerMessage);
    if (contextualResponse) {
      return contextualResponse;
    }
    // If no contextual response, continue with normal flow
  }

  // Check for equipment-related requests
  if (keywords.equipment.some(keyword => lowerMessage.includes(keyword))) {
    return handleEquipmentRequest(message, userRole, context);
  }

  // Check for fault reporting
  if (keywords.fault.some(keyword => lowerMessage.includes(keyword))) {
    return handleFaultReport(message, userRole, context);
  }

  // Check for maintenance requests
  if (keywords.maintenance.some(keyword => lowerMessage.includes(keyword))) {
    return handleMaintenanceRequest(message, userRole, context);
  }

  // Check for statistics/management requests
  if (keywords.statistics.some(keyword => lowerMessage.includes(keyword))) {
    return handleStatisticsRequest(message, userRole, context);
  }

  // Check for user management requests
  if (keywords.user.some(keyword => lowerMessage.includes(keyword))) {
    return handleUserManagementRequest(message, userRole, context);
  }

  // Check for scheduling requests
  if (keywords.schedule.some(keyword => lowerMessage.includes(keyword))) {
    return handleSchedulingRequest(message, userRole, context);
  }

  // Check for help requests
  if (keywords.help.some(keyword => lowerMessage.includes(keyword))) {
    return handleHelpRequest(message, userRole, context);
  }

  // Check for status inquiries
  if (keywords.status.some(keyword => lowerMessage.includes(keyword))) {
    return handleStatusRequest(message, userRole, context);
  }

  // Check for creation requests
  if (keywords.create.some(keyword => lowerMessage.includes(keyword))) {
    return handleCreationRequest(message, userRole, context);
  }

  // Check for viewing requests
  if (keywords.view.some(keyword => lowerMessage.includes(keyword))) {
    return handleViewRequest(message, userRole, context);
  }

  // Check for update requests
  if (keywords.update.some(keyword => lowerMessage.includes(keyword))) {
    return handleUpdateRequest(message, userRole, context);
  }

  // Check for deletion requests
  if (keywords.delete.some(keyword => lowerMessage.includes(keyword))) {
    return handleDeleteRequest(message, userRole, context);
  }

  // Check for search requests
  if (keywords.search.some(keyword => lowerMessage.includes(keyword))) {
    return handleSearchRequest(message, userRole, context);
  }

  // Check for export requests
  if (keywords.export.some(keyword => lowerMessage.includes(keyword))) {
    return handleExportRequest(message, userRole, context);
  }

  // Check for import requests
  if (keywords.import.some(keyword => lowerMessage.includes(keyword))) {
    return handleImportRequest(message, userRole, context);
  }

  // Greeting detection
  if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut') || lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('bonsoir') || lowerMessage.includes('bonne journée') || lowerMessage.includes('bonsoir') || lowerMessage.includes('coucou') || lowerMessage.includes('hey')) {
    return handleGreeting(message, userRole, context);
  }

  // Thank you detection
  if (lowerMessage.includes('merci') || lowerMessage.includes('thanks') || lowerMessage.includes('thank you') || lowerMessage.includes('parfait') || lowerMessage.includes('super') || lowerMessage.includes('génial')) {
    return {
      content: "De rien ! Je suis là pour vous aider. N'hésitez pas si vous avez d'autres questions ou si vous avez besoin d'assistance pour autre chose. 😊",
      context: { currentTask: 'thanks' }
    };
  }

  // Goodbye detection
  if (lowerMessage.includes('au revoir') || lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('à bientôt') || lowerMessage.includes('à plus') || lowerMessage.includes('ciao')) {
    return {
      content: "Au revoir ! N'hésitez pas à revenir si vous avez besoin d'aide. Bonne journée ! 👋",
      context: { currentTask: 'goodbye' }
    };
  }

  // Question detection
  if (lowerMessage.includes('?') || lowerMessage.includes('quoi') || lowerMessage.includes('comment') || lowerMessage.includes('pourquoi') || lowerMessage.includes('quand') || lowerMessage.includes('où') || lowerMessage.includes('qui') || lowerMessage.includes('combien')) {
    return handleQuestion(message, userRole, context);
  }

  // Default intelligent response
  return generateIntelligentResponse(message, userRole, context);
}

// Handle contextual responses based on previous conversation
function handleContextualResponse(message, userRole, context, lowerMessage) {
  const currentTask = context.currentTask;
  
  switch (currentTask) {
    case 'equipment_request':
      if (lowerMessage.includes('oui') || lowerMessage.includes('ok') || lowerMessage.includes('d\'accord') || lowerMessage.includes('commencer')) {
        return {
          content: "Parfait ! Commençons par créer votre demande d'équipement :\n\n1. **Allez dans le menu** → 'Mes Demandes' (ou 'Équipements')\n2. **Cliquez sur** 'Nouvelle Demande' ou 'Ajouter'\n3. **Remplissez le formulaire** :\n   - Type d'équipement (ordinateur, caméra, etc.)\n   - Description de votre besoin\n   - Date nécessaire\n   - Priorité\n\n**Types d'équipement disponibles :**\n- Ordinateurs, Caméras, Microphones, Écrans, Claviers, Souris, Câbles\n\nAvez-vous des questions sur le processus ?",
          context: { currentTask: 'equipment_request_guidance' }
        };
      }
      break;
      
    case 'fault_report':
      if (lowerMessage.includes('oui') || lowerMessage.includes('ok') || lowerMessage.includes('d\'accord') || lowerMessage.includes('commencer')) {
        return {
          content: "Excellent ! Créons votre rapport de panne :\n\n1. **Allez dans le menu** → 'Rapports de Panne'\n2. **Cliquez sur** 'Nouveau Rapport'\n3. **Remplissez le formulaire** :\n   - Sélectionnez l'équipement concerné\n   - Type de panne (matériel, logiciel, réseau, etc.)\n   - Description détaillée du problème\n   - Gravité (Faible, Moyenne, Élevée, Critique)\n   - Impact sur votre travail\n\n**Conseils pour une description efficace :**\n- Quand le problème a commencé\n- Étapes pour reproduire le problème\n- Messages d'erreur si applicable\n- Solution de contournement si disponible\n\nDécrivez-moi le problème que vous rencontrez !",
          context: { currentTask: 'fault_report_guidance' }
        };
      }
      break;
      
    case 'maintenance':
      if (lowerMessage.includes('intervention') || lowerMessage.includes('planifiée') || lowerMessage.includes('tâche')) {
        return {
          content: "Pour voir vos interventions planifiées :\n\n1. **Allez dans** 'Maintenance en cours' ou 'Planning'\n2. **Consultez la liste** de vos tâches assignées\n3. **Pour chaque intervention** :\n   - Vérifiez les détails (équipement, priorité, échéance)\n   - Cliquez sur 'Confirmer réception' si c'est une nouvelle tâche\n   - Mettez à jour le statut au fur et à mesure\n\n**Statuts possibles :**\n- En attente → Confirmer réception\n- En cours → Traitement en cours\n- Terminée → Rapport à remplir\n\nAvez-vous des questions sur une intervention spécifique ?",
          context: { currentTask: 'maintenance_guidance' }
        };
      }
      break;
  }
  
  // If no specific contextual response, continue with normal flow
  return null;
}

// Handle search requests
function handleSearchRequest(message, userRole, context) {
  return {
    content: "Je peux vous aider à rechercher des informations dans le système :\n\n🔍 **Éléments recherchables :**\n- **Équipements** - Par nom, type, numéro de série, localisation\n- **Utilisateurs** - Par nom, email, rôle (admin seulement)\n- **Demandes** - Par statut, type d'équipement, demandeur\n- **Rapports de panne** - Par équipement, gravité, statut\n- **Maintenances** - Par technicien, équipement, statut\n\n**Comment rechercher :**\n1. Allez dans la section correspondante\n2. Utilisez la barre de recherche en haut\n3. Appliquez des filtres pour affiner\n4. Triez les résultats selon vos besoins\n\nQue souhaitez-vous rechercher exactement ?",
    context: { currentTask: 'search' }
  };
}

// Handle export requests
function handleExportRequest(message, userRole, context) {
  const responses = {
    admin: {
      content: "En tant qu'administrateur, vous pouvez exporter :\n\n📊 **Rapports et statistiques :**\n- Allez dans 'Statistiques' → Bouton 'Exporter PDF'\n- Choisissez le format (PDF ou Excel)\n- Sélectionnez les données à inclure\n\n📋 **Listes détaillées :**\n- Liste des utilisateurs\n- Inventaire des équipements\n- Historique des maintenances\n- Rapports d'allocations\n\n💾 **Formats disponibles :**\n- PDF pour les rapports formels\n- Excel pour l'analyse de données\n- CSV pour l'import dans d'autres systèmes\n\nQue souhaitez-vous exporter ?",
      context: { currentTask: 'export' }
    },
    technical_manager: {
      content: "En tant que responsable technique, vous pouvez exporter :\n\n📊 **Statistiques d'équipement :**\n- Performance des équipements\n- Coûts de maintenance\n- Taux d'utilisation\n\n📋 **Rapports de maintenance :**\n- Interventions par technicien\n- Temps d'intervention\n- Pièces utilisées\n\n📈 **Planification :**\n- Calendrier des interventions\n- Charge de travail des techniciens\n- Équipements nécessitant une attention\n\nAllez dans 'Statistiques' pour accéder aux options d'export.",
      context: { currentTask: 'export' }
    },
    default: {
      content: "Vous pouvez exporter :\n\n1. **Vos demandes** - Historique de vos demandes d'équipement\n2. **Vos rapports** - Historique de vos rapports de panne\n3. **Vos allocations** - Liste de vos équipements assignés\n\n**Comment faire :**\n- Allez dans la section correspondante\n- Cherchez le bouton 'Exporter' ou 'Télécharger'\n- Choisissez le format (PDF, Excel, CSV)\n\nQue souhaitez-vous exporter ?"
    }
  };

  return responses[userRole] || responses.default;
}

// Handle import requests
function handleImportRequest(message, userRole, context) {
  const responses = {
    admin: {
      content: "En tant qu'administrateur, vous pouvez importer :\n\n👥 **Utilisateurs en masse :**\n- Fichier CSV avec nom, email, rôle\n- Import automatique avec mots de passe temporaires\n\n🔧 **Équipements en masse :**\n- Fichier Excel avec détails des équipements\n- Import avec validation automatique\n\n📊 **Données historiques :**\n- Import de données depuis d'autres systèmes\n- Migration de données existantes\n\n⚠️ **Précautions :**\n- Vérifiez le format du fichier\n- Sauvegardez avant l'import\n- Testez avec un petit échantillon d'abord\n\nContactez le support technique pour l'assistance à l'import.",
      context: { currentTask: 'import' }
    },
    default: {
      content: "L'import de données en masse est généralement réservé aux administrateurs pour des raisons de sécurité.\n\n**Si vous avez besoin d'importer des données :**\n1. Contactez votre administrateur système\n2. Préparez vos données dans un format CSV ou Excel\n3. Vérifiez que les données sont correctement formatées\n\n**Pour des ajouts individuels :**\n- Utilisez les formulaires de création dans l'interface\n- C'est plus sûr et permet la validation en temps réel\n\nAvez-vous des questions sur le format des données ?"
    }
  };

  return responses[userRole] || responses.default;
}

// Handle equipment requests
function handleEquipmentRequest(message, userRole, context) {
  const responses = {
    default: {
      content: "Je peux vous aider avec les demandes d'équipement. Voici ce que vous pouvez faire :\n\n1. **Faire une nouvelle demande** - Spécifiez le type d'équipement dont vous avez besoin\n2. **Vérifier le statut** de vos demandes existantes\n3. **Consulter la liste** des équipements disponibles\n\nDécrivez-moi plus précisément ce dont vous avez besoin !"
    }
  };

  return responses[userRole] || responses.default;
}

// Handle fault reports
function handleFaultReport(message, userRole, context) {
  return {
    content: "Je vois que vous rencontrez un problème technique. Je peux vous aider à le signaler efficacement :\n\n🚨 **Pour signaler une panne :**\n1. Allez dans 'Rapports de Panne' dans le menu\n2. Cliquez sur 'Nouveau Rapport'\n3. Sélectionnez l'équipement concerné\n4. Décrivez le problème en détail\n5. Indiquez la gravité (Faible, Moyenne, Élevée, Critique)\n\n📝 **Informations utiles à inclure :**\n- Description précise du problème\n- Quand le problème a commencé\n- Étapes pour reproduire le problème\n- Solution de contournement si disponible\n\nDécrivez-moi le problème que vous rencontrez !",
    context: { currentTask: 'fault_report' }
  };
}

// Handle maintenance requests
function handleMaintenanceRequest(message, userRole, context) {
  const responses = {
    technicien: {
      content: "En tant que technicien, je peux vous aider avec la maintenance :\n\n🔧 **Interventions en cours :**\n- Consultez 'Maintenance en cours' pour voir vos tâches\n- Cliquez sur 'Confirmer réception' pour les nouvelles interventions\n\n📋 **Ajouter un rapport :**\n- Allez dans 'Réparations' pour documenter vos interventions\n- Incluez les pièces utilisées, le temps passé, et la solution appliquée\n\n📊 **Suivi des interventions :**\n- Consultez l'historique dans 'Rapports'\n- Vérifiez les statistiques de performance\n\nQue souhaitez-vous faire ?",
      context: { currentTask: 'maintenance' }
    },
    technical_manager: {
      content: "En tant que responsable technique, je peux vous aider avec la gestion de la maintenance :\n\n📅 **Planifier des interventions :**\n- Allez dans 'Planification Services'\n- Assignez des techniciens aux interventions\n- Définissez les priorités et échéances\n\n📊 **Suivi des performances :**\n- Consultez les statistiques de maintenance\n- Analysez les temps d'intervention\n- Identifiez les équipements nécessitant plus d'attention\n\n🔧 **Gestion des équipements :**\n- Mettez à jour le statut des équipements\n- Planifiez la maintenance préventive\n\nComment puis-je vous aider ?",
      context: { currentTask: 'maintenance_management' }
    },
    default: {
      content: "Je peux vous aider avec les questions de maintenance. Voici ce que vous pouvez faire :\n\n1. **Signaler un problème** nécessitant une intervention\n2. **Vérifier le statut** d'une intervention en cours\n3. **Consulter l'historique** des maintenances\n\nDécrivez-moi votre besoin spécifique !"
    }
  };

  return responses[userRole] || responses.default;
}

// Handle statistics requests
function handleStatisticsRequest(message, userRole, context) {
  const responses = {
    admin: {
      content: "En tant qu'administrateur, vous avez accès à toutes les statistiques :\n\n📊 **Tableau de bord principal :**\n- Vue d'ensemble des utilisateurs, équipements et maintenances\n- Graphiques en temps réel\n- Alertes et notifications\n\n📈 **Rapports détaillés :**\n- Statistiques des utilisateurs\n- Performance des équipements\n- Analyse des coûts de maintenance\n- Export PDF/Excel disponible\n\n👥 **Gestion des utilisateurs :**\n- Statistiques d'utilisation par rôle\n- Activité des utilisateurs\n- Gestion des permissions\n\nQue souhaitez-vous analyser ?",
      context: { currentTask: 'statistics' }
    },
    technical_manager: {
      content: "En tant que responsable technique, voici les statistiques disponibles :\n\n📊 **Statistiques d'équipement :**\n- Répartition par type et statut\n- Taux d'utilisation\n- Coûts de maintenance\n\n📈 **Performance de maintenance :**\n- Temps moyen d'intervention\n- Taux de résolution\n- Équipements les plus problématiques\n\n👥 **Allocations et utilisation :**\n- Suivi des allocations par utilisateur\n- Taux d'occupation des équipements\n- Historique des demandes\n\n🔧 **Planification :**\n- Interventions planifiées vs réalisées\n- Charge de travail des techniciens\n\nQuelle statistique vous intéresse ?",
      context: { currentTask: 'statistics' }
    },
    default: {
      content: "Je peux vous aider à consulter les statistiques disponibles selon votre rôle :\n\n📊 **Statistiques générales :**\n- Équipements disponibles\n- Vos demandes et allocations\n- Historique des maintenances\n\n📈 **Rapports personnalisés :**\n- Vos statistiques d'utilisation\n- Performance de vos équipements\n\nQue souhaitez-vous consulter ?"
    }
  };

  return responses[userRole] || responses.default;
}

// Handle user management requests
function handleUserManagementRequest(message, userRole, context) {
  const responses = {
    admin: {
      content: "En tant qu'administrateur, je peux vous aider avec la gestion des utilisateurs :\n\n👥 **Gestion des comptes :**\n- Créer de nouveaux utilisateurs\n- Modifier les informations utilisateur\n- Supprimer des comptes\n- Gérer les rôles et permissions\n\n🔐 **Sécurité :**\n- Réinitialiser les mots de passe\n- Gérer les sessions actives\n- Surveiller l'activité des utilisateurs\n\n📊 **Statistiques utilisateurs :**\n- Nombre d'utilisateurs par rôle\n- Activité et connexions\n- Utilisation des fonctionnalités\n\nQue souhaitez-vous faire ?",
      context: { currentTask: 'user_management' }
    },
    default: {
      content: "Pour la gestion des utilisateurs, vous pouvez :\n\n1. **Modifier votre profil** - Mettre à jour vos informations personnelles\n2. **Changer votre mot de passe** - Sécuriser votre compte\n3. **Consulter vos statistiques** - Voir votre activité\n\nContactez un administrateur pour d'autres modifications."
    }
  };

  return responses[userRole] || responses.default;
}

// Handle scheduling requests
function handleSchedulingRequest(message, userRole, context) {
  const responses = {
    technical_manager: {
      content: "En tant que responsable technique, je peux vous aider avec la planification :\n\n📅 **Planification des services :**\n- Allez dans 'Planification Services'\n- Sélectionnez l'équipement et le technicien\n- Définissez la date et la priorité\n- Ajoutez une description détaillée\n\n👥 **Gestion des techniciens :**\n- Consultez la disponibilité des techniciens\n- Répartissez la charge de travail\n- Suivez les performances\n\n⏰ **Optimisation :**\n- Planifiez la maintenance préventive\n- Évitez les conflits d'horaires\n- Priorisez les interventions urgentes\n\nQue souhaitez-vous planifier ?",
      context: { currentTask: 'scheduling' }
    },
    technicien: {
      content: "En tant que technicien, voici votre planning :\n\n📅 **Vos interventions :**\n- Consultez 'Planning' pour voir vos tâches\n- Vérifiez les priorités et échéances\n- Mettez à jour le statut des interventions\n\n⏰ **Gestion du temps :**\n- Estimez la durée des interventions\n- Signalez les retards éventuels\n- Documentez le temps réel passé\n\n📋 **Rapports :**\n- Remplissez les rapports d'intervention\n- Incluez les pièces utilisées\n- Notez les observations importantes\n\nComment puis-je vous aider ?",
      context: { currentTask: 'technician_schedule' }
    },
    default: {
      content: "Pour la planification, vous pouvez :\n\n1. **Consulter votre planning** - Voir vos rendez-vous et tâches\n2. **Demander une intervention** - Planifier une maintenance\n3. **Vérifier les disponibilités** - Trouver un créneau libre\n\nQue souhaitez-vous planifier ?"
    }
  };

  return responses[userRole] || responses.default;
}

// Handle help requests
function handleHelpRequest(message, userRole, context) {
  const roleHelp = getRoleSpecificHelp(userRole);
  return {
    content: `🤖 **Assistant IA - Aide personnalisée**\n\n${roleHelp}\n\n**Fonctionnalités disponibles :**\n\n🔧 **Équipements :**\n- Faire des demandes d'équipement\n- Consulter la liste des équipements\n- Vérifier le statut des allocations\n\n🚨 **Maintenance :**\n- Signaler des pannes\n- Suivre les interventions\n- Consulter l'historique\n\n📊 **Statistiques :**\n- Voir les rapports et analyses\n- Exporter les données\n- Consulter les métriques\n\n💡 **Conseils :**\n- Posez-moi des questions spécifiques\n- Décrivez votre problème en détail\n- Je peux vous guider étape par étape\n\n**Comment puis-je vous aider aujourd'hui ?**`,
    context: { currentTask: 'help' }
  };
}

// Handle status requests
function handleStatusRequest(message, userRole, context) {
  return {
    content: "Je peux vous aider à vérifier le statut de différents éléments :\n\n📋 **Statuts disponibles :**\n- **Demandes d'équipement** : En attente, Approuvée, Rejetée, Remplie\n- **Rapports de panne** : Signalé, Reconnu, En cours, Résolu\n- **Maintenances** : En attente, En cours, Terminée, Annulée\n- **Équipements** : Disponible, Affecté, Maintenance, Hors service\n\n🔍 **Pour vérifier un statut :**\n1. Allez dans la section correspondante\n2. Consultez la liste ou le tableau de bord\n3. Utilisez les filtres pour affiner la recherche\n\nQue souhaitez-vous vérifier exactement ?",
    context: { currentTask: 'status_check' }
  };
}

// Handle creation requests
function handleCreationRequest(message, userRole, context) {
  const responses = {
    admin: {
      content: "En tant qu'administrateur, vous pouvez créer :\n\n👥 **Utilisateurs :**\n- Allez dans 'Utilisateurs' → 'Ajouter un utilisateur'\n- Remplissez les informations (nom, email, rôle)\n- Définissez un mot de passe temporaire\n\n🔧 **Équipements :**\n- Allez dans 'Matériels' → 'Ajouter un matériel'\n- Spécifiez le type, nom, numéro de série\n- Définissez la localisation et l'état\n\n📋 **Rapports :**\n- Générez des rapports personnalisés\n- Exportez les données en PDF/Excel\n\nQue souhaitez-vous créer ?",
      context: { currentTask: 'creation' }
    },
    default: {
      content: "Vous pouvez créer :\n\n1. **Demandes d'équipement** - Si vous avez besoin de matériel\n2. **Rapports de panne** - Pour signaler des problèmes\n3. **Rapports de maintenance** - Si vous êtes technicien\n\nQue souhaitez-vous créer ?"
    }
  };

  return responses[userRole] || responses.default;
}

// Handle view requests
function handleViewRequest(message, userRole, context) {
  return {
    content: "Je peux vous aider à consulter différentes informations :\n\n👀 **Éléments consultables :**\n- **Liste des équipements** - Voir tous les matériels disponibles\n- **Vos demandes** - Consulter l'historique de vos demandes\n- **Rapports de panne** - Voir les problèmes signalés\n- **Maintenances** - Consulter les interventions\n- **Statistiques** - Analyser les données et rapports\n\n🔍 **Navigation :**\n- Utilisez le menu de gauche pour naviguer\n- Chaque section affiche les informations pertinentes\n- Utilisez les filtres et la recherche pour affiner\n\nQue souhaitez-vous consulter ?",
    context: { currentTask: 'viewing' }
  };
}

// Handle update requests
function handleUpdateRequest(message, userRole, context) {
  const responses = {
    admin: {
      content: "En tant qu'administrateur, vous pouvez modifier :\n\n👥 **Utilisateurs :**\n- Allez dans 'Utilisateurs' → Cliquez sur l'utilisateur\n- Modifiez les informations ou le rôle\n- Sauvegardez les changements\n\n🔧 **Équipements :**\n- Allez dans 'Matériels' → Cliquez sur l'équipement\n- Modifiez les informations (statut, localisation, etc.)\n- Mettez à jour les détails de maintenance\n\n📊 **Système :**\n- Mettez à jour les paramètres système\n- Modifiez les configurations\n\nQue souhaitez-vous modifier ?",
      context: { currentTask: 'updating' }
    },
    default: {
      content: "Vous pouvez modifier :\n\n1. **Votre profil** - Informations personnelles et mot de passe\n2. **Vos demandes** - Si elles sont encore en attente\n3. **Vos rapports** - Si vous êtes l'auteur\n\nQue souhaitez-vous modifier ?"
    }
  };

  return responses[userRole] || responses.default;
}

// Handle delete requests
function handleDeleteRequest(message, userRole, context) {
  const responses = {
    admin: {
      content: "⚠️ **Attention : Suppression d'éléments**\n\nEn tant qu'administrateur, vous pouvez supprimer :\n\n👥 **Utilisateurs :**\n- Allez dans 'Utilisateurs' → Cliquez sur l'utilisateur\n- Cliquez sur 'Supprimer' (action irréversible)\n\n🔧 **Équipements :**\n- Allez dans 'Matériels' → Cliquez sur l'équipement\n- Cliquez sur 'Supprimer' (vérifiez d'abord les allocations)\n\n⚠️ **Précautions :**\n- Vérifiez qu'il n'y a pas d'allocations actives\n- Assurez-vous que la suppression est nécessaire\n- Cette action est irréversible\n\nÊtes-vous sûr de vouloir supprimer quelque chose ?",
      context: { currentTask: 'deletion' }
    },
    default: {
      content: "Pour supprimer des éléments :\n\n1. **Vos demandes** - Si elles sont encore en attente\n2. **Vos rapports** - Si vous êtes l'auteur et qu'ils ne sont pas traités\n\n⚠️ **Note :** Contactez un administrateur pour d'autres suppressions.\n\nQue souhaitez-vous supprimer ?"
    }
  };

  return responses[userRole] || responses.default;
}

// Handle greetings
function handleGreeting(message, userRole, context) {
  const greetings = {
    admin: "Bonjour ! Je suis votre assistant IA pour l'administration. Je peux vous aider avec la gestion des utilisateurs, des équipements, les statistiques et bien plus encore. Comment puis-je vous assister aujourd'hui ?",
    technicien: "Salut ! Je suis votre assistant pour la maintenance. Je peux vous aider avec vos interventions, rapports de maintenance, planning et gestion des équipements. Que puis-je faire pour vous ?",
    technical_manager: "Bonjour ! Je suis votre assistant pour la gestion technique. Je peux vous aider avec la planification des services, les statistiques, la gestion des équipements et le suivi des allocations. Comment puis-je vous aider ?",
    default: "Bonjour ! Je suis votre assistant IA. Je peux vous aider avec vos demandes d'équipement, rapports de panne, maintenance et bien plus encore. Comment puis-je vous assister ?"
  };

  return {
    content: greetings[userRole] || greetings.default,
    context: { currentTask: 'greeting' }
  };
}

// Handle questions
function handleQuestion(message, userRole, context) {
  return {
    content: "Excellente question ! Je peux vous aider à trouver la réponse. Pour vous donner une réponse précise, pourriez-vous me donner plus de détails ?\n\n💡 **Conseils pour une meilleure aide :**\n- Décrivez votre situation spécifique\n- Mentionnez le type d'équipement ou de problème\n- Indiquez ce que vous avez déjà essayé\n\n**Exemples de questions précises :**\n- 'Comment faire une demande de caméra pour un projet vidéo ?'\n- 'Où puis-je voir le statut de ma demande d'équipement ?'\n- 'Comment signaler une panne d'ordinateur ?'\n\nPouvez-vous reformuler votre question avec plus de détails ?",
    context: { currentTask: 'question' }
  };
}

// Generate intelligent response for unrecognized messages
function generateIntelligentResponse(message, userRole, context) {
  const suggestions = {
    admin: [
      "Gérer les utilisateurs et leurs permissions",
      "Consulter les statistiques du système",
      "Créer ou modifier des équipements",
      "Exporter des rapports détaillés"
    ],
    technicien: [
      "Voir mes interventions planifiées",
      "Ajouter un rapport de maintenance",
      "Consulter l'inventaire technique",
      "Gérer mon planning d'interventions"
    ],
    technical_manager: [
      "Planifier des services de maintenance",
      "Consulter les statistiques d'équipement",
      "Gérer les allocations d'équipement",
      "Suivre les performances des techniciens"
    ],
    default: [
      "Faire une demande d'équipement",
      "Signaler un problème technique",
      "Consulter mes allocations",
      "Voir l'historique de mes demandes"
    ]
  };

  const roleSuggestions = suggestions[userRole] || suggestions.default;
  
  return {
    content: `Je ne suis pas sûr de comprendre exactement ce que vous cherchez, mais je peux vous aider avec plusieurs tâches selon votre rôle :\n\n**Suggestions pour vous :**\n${roleSuggestions.map(suggestion => `• ${suggestion}`).join('\n')}\n\n**Pour une aide plus précise :**\n- Décrivez votre besoin en détail\n- Mentionnez le type d'équipement ou de problème\n- Indiquez ce que vous souhaitez accomplir\n\n**Exemples :**\n- "Je veux demander une caméra pour un projet"\n- "Mon ordinateur ne fonctionne plus"\n- "Comment voir mes demandes en attente ?"\n\nQue souhaitez-vous faire exactement ?`,
    context: { currentTask: 'general_assistance' }
  };
}

// Get role-specific help
function getRoleSpecificHelp(userRole) {
  switch (userRole) {
    case 'technicien':
      return "En tant que technicien, vous pouvez gérer les interventions, ajouter des rapports de maintenance, et traiter les demandes.";
    case 'technical_manager':
      return "En tant que responsable technique, vous pouvez gérer les équipements, consulter les statistiques, et planifier les interventions.";
    case 'admin':
      return "En tant qu'administrateur, vous avez accès à toutes les fonctionnalités du système.";
    default:
      return "Vous pouvez utiliser le système pour vos besoins d'équipement.";
  }
}

// Get chatbot statistics
exports.getChatbotStats = async (req, res) => {
  try {
    const totalSessions = await Chatbot.countDocuments();
    const activeSessions = await Chatbot.countDocuments({ isActive: true });
    
    const roleStats = await Chatbot.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $group: {
          _id: '$userInfo.role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalSessions,
        activeSessions,
        roleStats
      }
    });
  } catch (error) {
    console.error('Get chatbot stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching chatbot statistics' 
    });
  }
};
