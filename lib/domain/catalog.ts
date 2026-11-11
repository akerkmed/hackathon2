import type {
  Benefit,
  LifeEventDef,
  LifeEventId,
  ServiceDef,
} from "@/lib/domain/types";
import {
  NEW_BABY_BENEFITS,
  NEW_BABY_LIFE_EVENT,
  NEW_BABY_SERVICES,
} from "@/lib/domain/catalog/new-baby";
import {
  BUSINESS_SERVICES,
  JOB_LOSS_SERVICES,
  MOVING_SERVICES,
  OTHER_BENEFITS,
  OTHER_LIFE_EVENTS,
  RETIREMENT_SERVICES,
  STUDIES_SERVICES,
} from "@/lib/domain/catalog/other-events";

export const LIFE_EVENTS: LifeEventDef[] = [NEW_BABY_LIFE_EVENT, ...OTHER_LIFE_EVENTS];

export const SERVICES: ServiceDef[] = [
  ...NEW_BABY_SERVICES,
  ...MOVING_SERVICES,
  ...JOB_LOSS_SERVICES,
  ...RETIREMENT_SERVICES,
  ...BUSINESS_SERVICES,
  ...STUDIES_SERVICES,
];

export const BENEFITS: Benefit[] = [...NEW_BABY_BENEFITS, ...OTHER_BENEFITS];

export const lifeEventById = (id: LifeEventId): LifeEventDef | undefined =>
  LIFE_EVENTS.find((event) => event.id === id);

export const serviceById = (id: string): ServiceDef | undefined =>
  SERVICES.find((service) => service.id === id);

export const servicesForEvent = (id: LifeEventId): ServiceDef[] => {
  const event = lifeEventById(id);
  if (!event) return [];
  return event.serviceIds
    .map((serviceId) => serviceById(serviceId))
    .filter((service): service is ServiceDef => Boolean(service));
};

export const benefitsForEvent = (id: LifeEventId): Benefit[] =>
  BENEFITS.filter((benefit) => {
    if (id === "new_baby") return benefit.id.startsWith("mat_") || benefit.id.startsWith("family_") || benefit.id.startsWith("amo_") || benefit.id.startsWith("free_") || benefit.id.startsWith("asd_");
    if (id === "job_loss") return benefit.id === "unemployment_ipe";
    if (id === "retirement") return benefit.id === "retirement_pension";
    if (id === "studies") return benefit.id === "scholarship_award";
    return false;
  });

export const servicesByCategory = (category: ServiceDef["category"]): ServiceDef[] =>
  SERVICES.filter((service) => service.category === category);

export { NEW_BABY_SERVICES, NEW_BABY_BENEFITS, NEW_BABY_LIFE_EVENT };
