import { json } from "@remix-run/node";
import { useNavigate, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";

/* ===========================
   ✅ LOADER (SERVER SIDE)
   =========================== */
export async function loader({ request }) {
  const url = new URL(request.url);

  let shop = url.searchParams.get("shop");

  return json({ shop: shop || null });
}

/* ===========================
   ✅ COMPONENT (CLIENT SIDE)
   =========================== */

export default function Index() {
  const navigate = useNavigate();
  const loaderData = useLoaderData();
  const loaderShop = loaderData?.shop;
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const backendUrl = process.env.BACKEND_URL || "https://subcollection.allgovjobs.com/backend";


  useEffect(() => {
    const run = async () => {
      // 🔥 FINAL SHOP RESOLUTION
      const urlShop = new URLSearchParams(window.location.search).get("shop");
      const shop = urlShop || loaderShop;

      if (!shop) {
        console.error("❌ Shop not found");
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

  }, [loaderShop]);

  useEffect(() => {
    if (isAuthorized) {
      navigate(`/app/onboarding?shop=${loaderShop}`, { replace: true });
    }
  }, [isAuthorized]);

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

  return null;
}
