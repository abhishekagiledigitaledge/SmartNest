import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { authenticate } from "../shopify.server";

/* ===========================
   ✅ LOADER (SERVER SIDE)
   =========================== */
export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = session?.shop;

  const backendUrl = process.env.BACKEND_URL || "https://subcollection.allgovjobs.com/backend";
  return json({ shop: shop || null, backendUrl });
}

export default function Index() {
  const loaderData = useLoaderData();
  const loaderShop = loaderData?.shop;
  const { backendUrl } = loaderData;
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);


  useEffect(() => {
    const run = async () => {
      const urlShop = new URLSearchParams(window.location.search).get("shop");
      const shop = urlShop || loaderShop;

      if (!shop) {
        setIsCheckingAuth(false);
        return;
      }

      fetch(`${backendUrl}/api/check-auth?shop=${shop}`)
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          if (!data.authorized) {
            const installUrl = `${backendUrl}/shopify?shop=${shop}`;
            if (window.top !== window.self) {
              window.top.location.href = installUrl;
            } else {
              window.location.href = installUrl;
            }
          } else {
            setIsAuthorized(true);
          }
        })
        .catch((err) => console.error("Auth check failed:", err))
        .finally(() => setIsCheckingAuth(false));
    }
    run();

  }, []);

  // Full page navigation preserves `host` and other embedded-app query params.
  // Client-side navigate() triggers loader fetches that can return 401 right after install.
  useEffect(() => {
    if (!isAuthorized || !loaderShop) return;
    const next = new URL(window.location.href);
    next.pathname = "/app/onboarding";
    next.searchParams.set("shop", loaderShop);
    window.location.replace(next.toString());
  }, [isAuthorized, loaderShop]);

  if (isCheckingAuth) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: 32,
          display: "flex",
          alignItems: "center",      // vertical center
          justifyContent: "center",  // horizontal center ✅
          textAlign: "center",       // optional (text center)
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>
            Sub Collection App
          </h1>
          <p style={{ color: "#666" }}>
            Preparing your dashboard…
          </p>
        </div>
      </div>
    );
  }

  if (!isCheckingAuth) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: 32,
          display: "flex",
          alignItems: "center",      // vertical center
          justifyContent: "center",  // horizontal center ✅
          textAlign: "center",       // optional (text center)
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>
            Please wait...
          </h1>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: 32,
          display: "flex",
          alignItems: "center",      // vertical center
          justifyContent: "center",  // horizontal center ✅
          textAlign: "center",       // optional (text center)
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>
            Please wait...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <></>
  );
}
