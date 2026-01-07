import { Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";

/* ===========================
   POLARIS STYLES
=========================== */
export const links = () => [
  { rel: "stylesheet", href: polarisStyles },
];

/* ===========================
   LOADER (AUTH + SHOP)
=========================== */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shop: session.shop, // ✅ shop mil gaya
  };
};

/* ===========================
   ROOT APP
=========================== */
export default function App() {
  const { apiKey, shop } = useLoaderData();

  console.log("Current Shop:", shop);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      {/* ✅ Shopify App Bridge Navigation */}
      <NavMenu
        navigationLinks={[
          {
            label: "Home",
            destination: "/app/admin",
          },
          {
            label: "Onboarding",
            destination: "/app/onboarding",
          },
        ]}
      />

      {/* Child routes */}
      <Outlet context={{ shop }} />
    </AppProvider>
  );
}

/* ===========================
   ERROR + HEADERS (REQUIRED)
=========================== */
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
