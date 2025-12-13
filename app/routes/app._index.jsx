import { Link, useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge/utilities";

export default function Index() {
  const navigate = useNavigate();
  const app = useAppBridge();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const fetchWithSessionToken = async (url, options = {}) => {
    const token = await getSessionToken(app);

    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  };

  useEffect(() => {
    const run = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const shop = urlParams.get("shop");

      if (!shop) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const res = await fetchWithSessionToken(
          `https://subcollection.allgovjobs.com/backend/api/check-auth?shop=${shop}`
        );

        const data = await res.json();
        console.log("Auth API response data:", data);

        if (!data.authorized) {
          const installUrl = `https://subcollection.allgovjobs.com/backend/shopify?shop=${shop}`;

          if (window.top !== window.self) {
            window.top.location.href = installUrl;
          } else {
            window.location.href = installUrl;
          }
        } else {
          setIsAuthorized(true);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    requestIdleCallback(run);
  }, [app]);

  // Separate effect: redirect ONLY when fully authorized
  useEffect(() => {
    if (isAuthorized) {
      navigate("/admin");
    }
  }, [isAuthorized, navigate]);

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

  if (!isAuthorized) {
    return (
      <div style={{ padding: 32 }}>
        <p>Redirecting…</p>
      </div>
    );
  }

  return (
    <></>
  );
}
