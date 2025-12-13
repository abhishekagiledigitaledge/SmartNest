import { Link, useNavigate } from "@remix-run/react";
import { Spinner, Text } from "@shopify/polaris";
import { useEffect, useState } from "react";

export default function Index() {
  const navigate = useNavigate();
  const [isNew, setIsNew] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const handleUploadSuccess = () => {
    setIsNew(!isNew);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get("shop");

    if (!shop) {
      setIsCheckingAuth(false);
      return;
    }

    fetch(`https://subcollection.allgovjobs.com/backend/api/check-auth?shop=${shop}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.authorized) {
          const installUrl = `https://subcollection.allgovjobs.com/backend/shopify?shop=${shop}`;
          if (window.top !== window.self) {
            window.top.location.href = installUrl;
          } else {
            window.location.href = installUrl;
          }
        } else {
          setIsAuthorized(true); // <-- update state first
        }
      })
      .catch((err) => console.error("Auth check failed:", err))
      .finally(() => setIsCheckingAuth(false));
  }, []);

  // Separate effect: redirect ONLY when fully authorized
  useEffect(() => {
    // if (isAuthorized) {
      navigate("/admin");
    // }
  }, [isAuthorized, navigate]);

  if (isCheckingAuth) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spinner accessibilityLabel="Loading" size="large" />
        <Text variant="bodyLg" as="p" tone="subdued" style={{ marginLeft: "8px" }}>
          Verifying authentication...
        </Text>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // prevent flashing if not authorized
  }

  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue'",
        padding: 28,
        maxWidth: 980,
        margin: "24px auto",
        color: "#111",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>sub-collection-app (Dev)</h1>
          <p style={{ margin: "6px 0 0", color: "#555" }}>
            Simple development launcher for your Remix + Nest Shopify app
          </p>
        </div>
      </header>

      <main
        style={{ background: "#fafafa", padding: 18, borderRadius: 8, border: "1px solid #eee" }}
      >
        <p style={{ marginTop: 0 }}>
          Use these quick actions while developing. Replace or extend this UI later with your real app screens.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <Link
            to="/auth/login"
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #ddd",
              background: "#fff",
              color: "#333",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Auth Login
          </Link>
        </div>
      </main>
    </div>
  );
}
