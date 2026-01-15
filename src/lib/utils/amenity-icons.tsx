"use client"

import {
  Wifi,
  Wind,
  Tv,
  Car,
  UtensilsCrossed,
  Coffee,
  Waves,
  Flame,
  Dumbbell,
  ShowerHead,
  Refrigerator,
  WashingMachine,
  Heater,
  Fan,
  Lock,
  Dog,
  Mountain,
  Sparkles,
  Shirt,
  Baby,
  Accessibility,
  Cigarette,
  TreePine,
  Umbrella,
  type LucideIcon,
} from "lucide-react"

// Mapping of common amenity keywords to icons
const amenityIconMap: Record<string, LucideIcon> = {
  // WiFi / Internet
  wifi: Wifi,
  internet: Wifi,
  "wi-fi": Wifi,

  // Air conditioning
  "ar condicionado": Wind,
  "ar-condicionado": Wind,
  ac: Wind,
  "air conditioning": Wind,
  climatizacao: Wind,

  // TV
  tv: Tv,
  televisao: Tv,
  "smart tv": Tv,
  netflix: Tv,
  "cabo": Tv,

  // Parking
  estacionamento: Car,
  garagem: Car,
  parking: Car,
  vaga: Car,

  // Kitchen
  cozinha: UtensilsCrossed,
  kitchen: UtensilsCrossed,
  fogao: UtensilsCrossed,

  // Coffee
  cafe: Coffee,
  cafeteira: Coffee,
  coffee: Coffee,
  "maquina de cafe": Coffee,

  // Pool
  piscina: Waves,
  pool: Waves,

  // BBQ / Grill
  churrasqueira: Flame,
  churrasco: Flame,
  bbq: Flame,
  grill: Flame,

  // Gym
  academia: Dumbbell,
  gym: Dumbbell,
  fitness: Dumbbell,

  // Shower / Hot water
  "agua quente": ShowerHead,
  chuveiro: ShowerHead,
  "hot water": ShowerHead,

  // Refrigerator
  geladeira: Refrigerator,
  frigobar: Refrigerator,
  refrigerator: Refrigerator,
  minibar: Refrigerator,

  // Washing machine
  "maquina de lavar": WashingMachine,
  lavanderia: WashingMachine,
  "washing machine": WashingMachine,
  lava: WashingMachine,

  // Heating
  aquecedor: Heater,
  aquecimento: Heater,
  calefacao: Heater,
  heating: Heater,

  // Fan
  ventilador: Fan,
  fan: Fan,

  // Security
  cofre: Lock,
  seguranca: Lock,
  safe: Lock,
  alarme: Lock,

  // Pets
  "pet friendly": Dog,
  "aceita pets": Dog,
  "aceita animais": Dog,
  pets: Dog,

  // View
  vista: Mountain,
  view: Mountain,
  "vista mar": Mountain,
  varanda: Mountain,
  sacada: Mountain,

  // Cleaning
  limpeza: Sparkles,
  cleaning: Sparkles,

  // Iron
  ferro: Shirt,
  "ferro de passar": Shirt,
  iron: Shirt,

  // Baby
  berco: Baby,
  "cadeira bebe": Baby,
  baby: Baby,
  crianca: Baby,

  // Accessibility
  acessibilidade: Accessibility,
  acessivel: Accessibility,
  accessibility: Accessibility,

  // Smoking
  fumante: Cigarette,
  "area fumante": Cigarette,
  smoking: Cigarette,

  // Garden
  jardim: TreePine,
  garden: TreePine,
  quintal: TreePine,

  // Beach
  praia: Umbrella,
  beach: Umbrella,
  "guarda-sol": Umbrella,
}

/**
 * Get the appropriate icon for an amenity based on its name
 * Returns Sparkles as default if no match is found
 */
export function getAmenityIcon(amenity: string): LucideIcon {
  const normalizedAmenity = amenity.toLowerCase().trim()

  // First try exact match
  if (amenityIconMap[normalizedAmenity]) {
    return amenityIconMap[normalizedAmenity]
  }

  // Then try partial match
  for (const [keyword, icon] of Object.entries(amenityIconMap)) {
    if (normalizedAmenity.includes(keyword) || keyword.includes(normalizedAmenity)) {
      return icon
    }
  }

  // Default icon
  return Sparkles
}
