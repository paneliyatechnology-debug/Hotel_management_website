import HotelWebApp from "../page";
import { getAllRoleSlugs } from "@/shared/utils/roleRoutes";

// Legacy shared prefix: /app/<page> is rewritten to the signed-in role's own URL
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllRoleSlugs().map((slug) => ({ slug }));
}

export default function AppRoutePage() {
  return <HotelWebApp />;
}