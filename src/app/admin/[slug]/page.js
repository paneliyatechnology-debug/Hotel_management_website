import HotelWebApp from "../../app/page";
import { getRoleSlugs } from "@/shared/utils/roleRoutes";

// Only real Hotel Admin pages exist under /admin/<slug>; anything else is a 404
export const dynamicParams = false;

export function generateStaticParams() {
  return getRoleSlugs("HOTEL_ADMIN").map((slug) => ({ slug }));
}

export default function AdminSlugRoutePage() {
  return <HotelWebApp />;
}