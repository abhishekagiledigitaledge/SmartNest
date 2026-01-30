import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { json, redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  // 🔧 Fix double /apps issue (Managed Pricing safe fix)
  if (url.pathname.includes("/apps/smartnest-1/apps/smartnest-1")) {
    console.log(url?.search, 'url?.search')
    console.log(url, 'url')
    const fixedPath = url.pathname.replace(
      "/apps/smartnest-1/apps/smartnest-1",
      "/apps/smartnest-1/app/admin"
    );

    return redirect(`${fixedPath}${url.search}`);
  }

  return null;
};

export default function App() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
