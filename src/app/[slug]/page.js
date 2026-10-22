import HotelWebApp from "../app/page";
import { getAllRoleSlugs } from "@/shared/utils/roleRoutes";

// Short legacy URLs such as /rooms or /guests are rewritten to the signed-in role's own URL.
// Unknown slugs are a real 404 instead of silently rendering the dashboard / login.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllRoleSlugs().map((slug) => ({ slug }));
}

export default function RoutePage() {
  return <HotelWebApp />;
}