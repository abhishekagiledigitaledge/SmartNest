import { json, redirect } from "@remix-run/node";
import { useNavigate, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";

/* ===========================
   ✅ LOADER (SERVER SIDE)
   =========================== */
export async function loader({ request }) {
  const url = new URL(request.url);

  // 🔧 Fix double /apps issue (Managed Pricing safe fix)
  if (url.pathname.includes("/apps/smartnest-1/apps/smartnest-1")) {
    const fixedPath = url.pathname.replace(
      "/apps/smartnest-1/apps/smartnest-1/app/admin",
      "/apps/smartnest-1/app/admin"
    );

    return redirect(`${fixedPath}${url.search}`);
  }

  let shop = url.searchParams.get("shop");

  const backendUrl = process.env.BACKEND_URL || "https://subcollection.allgovjobs.com/backend";
  return json({ shop: shop || null, backendUrl });
}

export default function Index() {
  const navigate = useNavigate();
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

  // Separate effect: redirect ONLY when fully authorized
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

  return (
    <></>
  );
}
