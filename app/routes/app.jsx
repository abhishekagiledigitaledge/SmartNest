// app/routes/app.jsx
import { Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const url = new URL(request.url);
  const host = url.searchParams.get("host");

  if (!host) throw new Error("Missing host");

  return {
    apiKey: process.env.SHOPIFY_API_KEY,
    shop: session.shop,
    host,
  };
};

export default function App() {
  const { apiKey, host } = useLoaderData();

  return (
    <AppProvider apiKey={apiKey} host={host} isEmbeddedApp>
      <NavMenu
        navigationLinks={[
          { label: "Home", destination: "/app/admin" },
          { label: "Onboarding", destination: "/app/onboarding" },
        ]}
      />
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (args) => boundary.headers(args);
