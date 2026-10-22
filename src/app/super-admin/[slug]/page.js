import HotelWebApp from "../../app/page";
import { getRoleSlugs } from "@/shared/utils/roleRoutes";

// Only real Super Admin pages exist under /super-admin/<slug>; anything else is a 404
export const dynamicParams = false;

export function generateStaticParams() {
  return getRoleSlugs("SUPER_ADMIN").map((slug) => ({ slug }));
}

export default function SuperAdminSlugRoutePage() {
  return <HotelWebApp />;
}