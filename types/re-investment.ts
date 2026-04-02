/** Category of real-estate investment property. */
export type RealEstateInvestmentType = "residential" | "commercial" | "land" | "other" | (string & {})

/** Human-readable labels for {@link RealEstateInvestmentType}. */
export const RE_INVESTMENT_TYPE_LABELS: Record<RealEstateInvestmentType, string> = {
  residential: "Residential",
  commercial: "Commercial",
  land: "Land",
  other: "Other",
}

/**
 * A real-estate investment owned by the user.
 * Financial fields (`purchasePrice`, `currentValue`, `monthlyRent`) are
 * encrypted at rest in Firestore.
 */
export type RealEstateInvestment = {
  id: string
  userId: string
  /** Display name / property identifier. */
  name: string
  /** City, area, or full address of the property. */
  location: string
  type: RealEstateInvestmentType
  /** Original purchase price in the user's local currency. */
  purchasePrice: number
  /** Estimated current market value. */
  currentValue: number
  /** Monthly rental income, if the property is rented out. */
  monthlyRent?: number
  /** ISO-8601 date the property was purchased (e.g. "2023-06-15"). */
  purchaseDate: string
  notes?: string
  createdAt: string
  updatedAt: string
}
