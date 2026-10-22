import HotelWebApp from "../../app/page";
import { getRoleSlugs } from "@/shared/utils/roleRoutes";

// Only real Receptionist pages exist under /receptionist/<slug>; anything else is a 404
export const dynamicParams = false;

export function generateStaticParams() {
  return getRoleSlugs("RECEPTIONIST").map((slug) => ({ slug }));
}

export default function ReceptionistSlugRoutePage() {
  return <HotelWebApp />;
}