import worldCountries from "world-countries";
import { db } from "../client";
import { agencies, countries, sectors, counties, ports } from "../schema";
import {
  AGENCIES,
  SECTORS,
  KENYAN_COUNTIES,
  PORTS,
  EAC_MEMBERS,
  COMESA_MEMBERS,
} from "./reference-data";

export async function seedCore() {
  console.log("Seeding agencies...");
  const agencyRows = await db
    .insert(agencies)
    .values(AGENCIES.map((a) => ({ code: a.code, name: a.name, description: a.description })))
    .returning();
  const agencyIdByCode = new Map(agencyRows.map((r) => [r.code, r.id]));

  console.log("Seeding sectors...");
  const sectorRows = await db
    .insert(sectors)
    .values(SECTORS.map((name) => ({ name })))
    .returning();
  const sectorIdByName = new Map(sectorRows.map((r) => [r.name, r.id]));

  console.log("Seeding countries...");
  const countryRows = await db
    .insert(countries)
    .values(
      worldCountries
        .filter((c) => c.cca2 && c.cca3 && c.name?.common)
        .map((c) => ({
          iso2: c.cca2,
          iso3: c.cca3,
          name: c.name.common,
          region: c.subregion || c.region || "Unknown",
          isEacMember: EAC_MEMBERS.has(c.cca3),
          isComesaMember: COMESA_MEMBERS.has(c.cca3),
        })),
    )
    .returning();
  const countryIdByIso3 = new Map(countryRows.map((r) => [r.iso3, r.id]));
  const countryNameById = new Map(countryRows.map((r) => [r.id, r.name]));

  console.log("Seeding counties...");
  const countyRows = await db.insert(counties).values(KENYAN_COUNTIES).returning();
  const countyIdByName = new Map(countyRows.map((r) => [r.name, r.id]));

  console.log("Seeding ports...");
  const portRows = await db
    .insert(ports)
    .values(
      PORTS.map((p) => ({
        name: p.name,
        type: p.type,
        countyId: countyIdByName.get(p.county)!,
      })),
    )
    .returning();

  console.log(
    `Core reference data seeded: ${agencyRows.length} agencies, ${sectorRows.length} sectors, ${countryRows.length} countries, ${countyRows.length} counties, ${portRows.length} ports.`,
  );

  return { agencyIdByCode, sectorIdByName, countryIdByIso3, countryNameById, countyIdByName, portRows };
}
