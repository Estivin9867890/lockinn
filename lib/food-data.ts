import type { FoodItem } from "./types";
export type { FoodItem };

export const FOOD_LIBRARY: FoodItem[] = [
  // ─── Viandes & Volailles (pour 100g cuit) ───────────────────────────────
  { name: "Poulet (Blanc)", category: "Viandes & Volailles", protein_g: 31, carbs_g: 0, fat_g: 3.6 },
  { name: "Dinde (Filet)", category: "Viandes & Volailles", protein_g: 29, carbs_g: 0, fat_g: 2 },
  { name: "Bœuf (5% MG)", category: "Viandes & Volailles", protein_g: 26, carbs_g: 0, fat_g: 5 },
  { name: "Bœuf (15% MG)", category: "Viandes & Volailles", protein_g: 24, carbs_g: 0, fat_g: 15 },
  { name: "Steak Haché (5% MG)", category: "Viandes & Volailles", protein_g: 25, carbs_g: 0, fat_g: 5 },
  { name: "Porc (Filet mignon)", category: "Viandes & Volailles", protein_g: 27, carbs_g: 0, fat_g: 4 },
  { name: "Canard (Magret)", category: "Viandes & Volailles", protein_g: 25, carbs_g: 0, fat_g: 15 },
  { name: "Bacon (Grillé)", category: "Viandes & Volailles", protein_g: 35, carbs_g: 1, fat_g: 30 },
  { name: "Jambon de Porc (Cuit)", category: "Viandes & Volailles", protein_g: 21, carbs_g: 1, fat_g: 3 },
  { name: "Jambon de Dinde", category: "Viandes & Volailles", protein_g: 18, carbs_g: 1, fat_g: 2 },
  { name: "Agneau (Gigot)", category: "Viandes & Volailles", protein_g: 25, carbs_g: 0, fat_g: 18 },

  // ─── Poissons & Crustacés (pour 100g cuit) ──────────────────────────────
  { name: "Saumon (Atlantique)", category: "Poissons & Crustacés", protein_g: 22, carbs_g: 0, fat_g: 13 },
  { name: "Thon (Conserve naturel)", category: "Poissons & Crustacés", protein_g: 25, carbs_g: 0, fat_g: 1 },
  { name: "Thon (Frais)", category: "Poissons & Crustacés", protein_g: 24, carbs_g: 0, fat_g: 5 },
  { name: "Cabillaud / Morue", category: "Poissons & Crustacés", protein_g: 18, carbs_g: 0, fat_g: 0.7 },
  { name: "Crevettes", category: "Poissons & Crustacés", protein_g: 24, carbs_g: 1, fat_g: 1.5 },
  { name: "Colin d'Alaska", category: "Poissons & Crustacés", protein_g: 17, carbs_g: 0, fat_g: 0.8 },
  { name: "Maquereau", category: "Poissons & Crustacés", protein_g: 24, carbs_g: 0, fat_g: 18 },
  { name: "Sardines (à l'huile égouttées)", category: "Poissons & Crustacés", protein_g: 25, carbs_g: 0, fat_g: 12 },
  { name: "Noix de Saint-Jacques", category: "Poissons & Crustacés", protein_g: 17, carbs_g: 3, fat_g: 0.8 },
  { name: "Truite", category: "Poissons & Crustacés", protein_g: 21, carbs_g: 0, fat_g: 6 },

  // ─── Féculents & Céréales (pour 100g cuit) ──────────────────────────────
  { name: "Riz Blanc", category: "Féculents & Céréales", protein_g: 2.7, carbs_g: 28, fat_g: 0.3 },
  { name: "Riz Complet", category: "Féculents & Céréales", protein_g: 2.6, carbs_g: 23, fat_g: 0.9 },
  { name: "Pâtes Blanches", category: "Féculents & Céréales", protein_g: 5, carbs_g: 25, fat_g: 1 },
  { name: "Pâtes Complètes", category: "Féculents & Céréales", protein_g: 6, carbs_g: 23, fat_g: 1.5 },
  { name: "Pomme de Terre (Vapeur)", category: "Féculents & Céréales", protein_g: 2, carbs_g: 17, fat_g: 0.1 },
  { name: "Patate Douce", category: "Féculents & Céréales", protein_g: 1.6, carbs_g: 20, fat_g: 0.1 },
  { name: "Quinoa", category: "Féculents & Céréales", protein_g: 4.4, carbs_g: 21, fat_g: 1.9 },
  { name: "Pain Complet", category: "Féculents & Céréales", protein_g: 9, carbs_g: 45, fat_g: 4 },
  { name: "Baguette (Pain blanc)", category: "Féculents & Céréales", protein_g: 8, carbs_g: 55, fat_g: 1 },
  { name: "Flocons d'Avoine", category: "Féculents & Céréales", protein_g: 13, carbs_g: 60, fat_g: 7 },
  { name: "Couscous (Semoule)", category: "Féculents & Céréales", protein_g: 3.8, carbs_g: 23, fat_g: 0.2 },
  { name: "Boulghour", category: "Féculents & Céréales", protein_g: 3, carbs_g: 18, fat_g: 0.2 },
  { name: "Gnocchis", category: "Féculents & Céréales", protein_g: 3.5, carbs_g: 32, fat_g: 0.5 },
  { name: "Maïs", category: "Féculents & Céréales", protein_g: 3, carbs_g: 19, fat_g: 1.2 },

  // ─── Légumineuses & Protéines Végétales (pour 100g cuit) ────────────────
  { name: "Lentilles", category: "Légumineuses & Végétal", protein_g: 9, carbs_g: 20, fat_g: 0.4 },
  { name: "Pois Chiches", category: "Légumineuses & Végétal", protein_g: 9, carbs_g: 27, fat_g: 2.6 },
  { name: "Haricots Rouges", category: "Légumineuses & Végétal", protein_g: 9, carbs_g: 22, fat_g: 0.5 },
  { name: "Haricots Blancs", category: "Légumineuses & Végétal", protein_g: 7, carbs_g: 18, fat_g: 0.5 },
  { name: "Tofu (Ferme)", category: "Légumineuses & Végétal", protein_g: 12, carbs_g: 2, fat_g: 6 },
  { name: "Tempeh", category: "Légumineuses & Végétal", protein_g: 19, carbs_g: 9, fat_g: 11 },
  { name: "Seitan", category: "Légumineuses & Végétal", protein_g: 25, carbs_g: 5, fat_g: 2 },
  { name: "Graines de Chia", category: "Légumineuses & Végétal", protein_g: 17, carbs_g: 42, fat_g: 31 },

  // ─── Produits Laitiers & Œufs ────────────────────────────────────────────
  { name: "Œuf Entier", category: "Laitiers & Œufs", protein_g: 12, carbs_g: 1.2, fat_g: 10 },
  { name: "Blanc d'Œuf", category: "Laitiers & Œufs", protein_g: 11, carbs_g: 0.7, fat_g: 0.2 },
  { name: "Skyr", category: "Laitiers & Œufs", protein_g: 11, carbs_g: 4, fat_g: 0.2 },
  { name: "Fromage Blanc (0%)", category: "Laitiers & Œufs", protein_g: 8, carbs_g: 4, fat_g: 0.1 },
  { name: "Yaourt Grec", category: "Laitiers & Œufs", protein_g: 10, carbs_g: 4, fat_g: 5 },
  { name: "Lait Demi-Écrémé", category: "Laitiers & Œufs", protein_g: 3.3, carbs_g: 4.8, fat_g: 1.6 },
  { name: "Lait d'Amande (Sans sucre)", category: "Laitiers & Œufs", protein_g: 0.5, carbs_g: 0.1, fat_g: 1.1 },
  { name: "Lait d'Avoine", category: "Laitiers & Œufs", protein_g: 1, carbs_g: 7, fat_g: 1.5 },
  { name: "Emmental", category: "Laitiers & Œufs", protein_g: 28, carbs_g: 0, fat_g: 29 },
  { name: "Mozzarella", category: "Laitiers & Œufs", protein_g: 22, carbs_g: 2, fat_g: 18 },
  { name: "Parmesan", category: "Laitiers & Œufs", protein_g: 35, carbs_g: 4, fat_g: 25 },
  { name: "Feta", category: "Laitiers & Œufs", protein_g: 14, carbs_g: 4, fat_g: 21 },

  // ─── Matières Grasses & Oléagineux ───────────────────────────────────────
  { name: "Huile d'Olive", category: "Matières Grasses", protein_g: 0, carbs_g: 0, fat_g: 100 },
  { name: "Huile de Colza", category: "Matières Grasses", protein_g: 0, carbs_g: 0, fat_g: 100 },
  { name: "Beurre", category: "Matières Grasses", protein_g: 0.8, carbs_g: 0.1, fat_g: 82 },
  { name: "Avocat", category: "Matières Grasses", protein_g: 2, carbs_g: 8.5, fat_g: 15 },
  { name: "Beurre de Cacahuète", category: "Matières Grasses", protein_g: 25, carbs_g: 20, fat_g: 50 },
  { name: "Amandes", category: "Matières Grasses", protein_g: 21, carbs_g: 21, fat_g: 50 },
  { name: "Noix de Grenoble", category: "Matières Grasses", protein_g: 15, carbs_g: 14, fat_g: 65 },
  { name: "Noix de Cajou", category: "Matières Grasses", protein_g: 18, carbs_g: 30, fat_g: 44 },
  { name: "Lait de Coco", category: "Matières Grasses", protein_g: 2, carbs_g: 6, fat_g: 20 },

  // ─── Légumes ─────────────────────────────────────────────────────────────
  { name: "Brocoli", category: "Légumes", protein_g: 2.8, carbs_g: 7, fat_g: 0.4 },
  { name: "Épinards", category: "Légumes", protein_g: 3, carbs_g: 3.6, fat_g: 0.4 },
  { name: "Carottes", category: "Légumes", protein_g: 1, carbs_g: 10, fat_g: 0.2 },
  { name: "Courgettes", category: "Légumes", protein_g: 1.2, carbs_g: 3, fat_g: 0.3 },
  { name: "Haricots Verts", category: "Légumes", protein_g: 1.8, carbs_g: 7, fat_g: 0.2 },
  { name: "Poivrons", category: "Légumes", protein_g: 1, carbs_g: 6, fat_g: 0.3 },
  { name: "Champignons", category: "Légumes", protein_g: 3, carbs_g: 3, fat_g: 0.3 },
  { name: "Tomates", category: "Légumes", protein_g: 0.9, carbs_g: 3.9, fat_g: 0.2 },
  { name: "Oignons", category: "Légumes", protein_g: 1.1, carbs_g: 9, fat_g: 0.1 },
  { name: "Aubergine", category: "Légumes", protein_g: 1, carbs_g: 6, fat_g: 0.2 },
  { name: "Chou-Fleur", category: "Légumes", protein_g: 1.9, carbs_g: 5, fat_g: 0.3 },
  { name: "Asperges", category: "Légumes", protein_g: 2.2, carbs_g: 3.8, fat_g: 0.1 },
  { name: "Petits Pois", category: "Légumes", protein_g: 5.4, carbs_g: 14, fat_g: 0.4 },

  // ─── Fruits ──────────────────────────────────────────────────────────────
  { name: "Banane", category: "Fruits", protein_g: 1.1, carbs_g: 23, fat_g: 0.3 },
  { name: "Pomme", category: "Fruits", protein_g: 0.3, carbs_g: 14, fat_g: 0.2 },
  { name: "Fraises", category: "Fruits", protein_g: 0.7, carbs_g: 8, fat_g: 0.3 },
  { name: "Myrtilles", category: "Fruits", protein_g: 0.7, carbs_g: 14, fat_g: 0.3 },
  { name: "Mangue", category: "Fruits", protein_g: 0.8, carbs_g: 15, fat_g: 0.4 },
  { name: "Ananas", category: "Fruits", protein_g: 0.5, carbs_g: 13, fat_g: 0.1 },
  { name: "Kiwi", category: "Fruits", protein_g: 1.1, carbs_g: 15, fat_g: 0.5 },
  { name: "Framboises", category: "Fruits", protein_g: 1.2, carbs_g: 12, fat_g: 0.6 },
  { name: "Pêche", category: "Fruits", protein_g: 0.9, carbs_g: 10, fat_g: 0.3 },

  // ─── Divers / Condiments ─────────────────────────────────────────────────
  { name: "Chocolat Noir (85%)", category: "Divers", protein_g: 8, carbs_g: 20, fat_g: 45 },
  { name: "Miel", category: "Divers", protein_g: 0.3, carbs_g: 82, fat_g: 0 },
  { name: "Sirop d'Érable", category: "Divers", protein_g: 0, carbs_g: 67, fat_g: 0 },
  { name: "Mayonnaise", category: "Divers", protein_g: 1, carbs_g: 0.6, fat_g: 75 },
  { name: "Ketchup", category: "Divers", protein_g: 1, carbs_g: 26, fat_g: 0.1 },
  { name: "Moutarde", category: "Divers", protein_g: 4, carbs_g: 5, fat_g: 4 },
  { name: "Crème Fraîche (30%)", category: "Divers", protein_g: 2, carbs_g: 3, fat_g: 30 },
  { name: "Crème Liquide (15%)", category: "Divers", protein_g: 3, carbs_g: 4, fat_g: 15 },
  { name: "Sauce Soja", category: "Divers", protein_g: 10, carbs_g: 7, fat_g: 0 },
  { name: "Houmous", category: "Divers", protein_g: 8, carbs_g: 14, fat_g: 18 },
  { name: "Pesto", category: "Divers", protein_g: 5, carbs_g: 6, fat_g: 45 },
  { name: "Granola (Moyenne)", category: "Divers", protein_g: 10, carbs_g: 60, fat_g: 15 },
  { name: "Galette de Riz", category: "Divers", protein_g: 8, carbs_g: 80, fat_g: 2 },

  // ─── Suppléments & Performance ───────────────────────────────────────────
  { name: "Whey Isolate", category: "Suppléments", protein_g: 85, carbs_g: 3, fat_g: 2 },
  { name: "Whey Concentrée", category: "Suppléments", protein_g: 73, carbs_g: 8, fat_g: 7 },
  { name: "Caséine", category: "Suppléments", protein_g: 80, carbs_g: 3, fat_g: 2 },
  { name: "Barre Protéinée (Moy.)", category: "Suppléments", protein_g: 33, carbs_g: 30, fat_g: 12 },
  { name: "BCAA / EAA (Poudre)", category: "Suppléments", protein_g: 80, carbs_g: 0, fat_g: 0 },
  { name: "Gainer", category: "Suppléments", protein_g: 30, carbs_g: 60, fat_g: 5 },
  { name: "Beurre de Cacahuète en Poudre", category: "Suppléments", protein_g: 47, carbs_g: 27, fat_g: 10 },
];

export const FOOD_CATEGORIES = [...new Set(FOOD_LIBRARY.map((f) => f.category))];

export function searchFoods(query: string, limit = 10): FoodItem[] {
  if (!query || query.length < 1) return FOOD_LIBRARY.slice(0, limit);
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return FOOD_LIBRARY.filter((f) => {
    const name = f.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return name.includes(q);
  }).slice(0, limit);
}

export function calcMacros(food: FoodItem, weightG: number) {
  const factor = weightG / 100;
  const protein_g = Math.round(food.protein_g * factor * 10) / 10;
  const carbs_g = Math.round(food.carbs_g * factor * 10) / 10;
  const fat_g = Math.round(food.fat_g * factor * 10) / 10;
  const calories = Math.round(protein_g * 4 + carbs_g * 4 + fat_g * 9);
  return { protein_g, carbs_g, fat_g, calories };
}
