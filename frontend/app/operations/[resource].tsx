export { OperationsResource as default } from "@/components/operations";

export function generateStaticParams() {
  return [
    "parks",
    "areas",
    "rides",
    "restaurants",
    "stores",
    "products",
    "employees",
    "tickets",
    "guests",
    "reservations",
    "visitors",
  ].map((resource) => ({ resource }));
}
