import { useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  Text,
  Banner,
  InlineStack,
  BlockStack,
} from "@shopify/polaris";
import { useEffect, useState } from "react";
import { useSearchParams } from "@remix-run/react";
import { InlineGrid } from "@shopify/polaris";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";


/* ===========================
   LOADER (REQUIRED)
=========================== */
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return json({});
};

/* ===========================
   ONBOARDING PAGE
=========================== */
export default function OnboardingPage() {
  const [widgetEnabled, setWidgetEnabled] = useState(false);
  const [searchParams] = useSearchParams();
  const SHOP = searchParams.get("shop");
  const navigate = useNavigate();
  const backendUrl = process.env.BACKEND_URL || "https://subcollection.allgovjobs.com/backend";

  useEffect(() => {
    if (!SHOP) return;
    fetch(`${backendUrl}/api/check-widget?shop=${SHOP}`)
      .then((res) => res.json())
      .then((data) => {
        setWidgetEnabled(data.installed);
      })
      .catch(() => setWidgetEnabled(false));
  }, [SHOP]);


  /* ===========================
     THEME EDITOR LINKS
  =========================== */
  const openCollectionEditor = () => {
    const url =
      `https://${SHOP}/admin/themes/current/editor` +
      `?context=collections` +
      `&template=collection`;

    window.open(url, "_blank");
  };

  /* ===========================
     STEP HANDLERS
  =========================== */
  const finishOnboarding = () => {
    navigate("/app/admin?shop=" + SHOP);
  };

  return (
    <Page fullWidth fullHeight>
      <WidgetInstallStep
        enabled={widgetEnabled}
        onOpenEditor={openCollectionEditor}
        onFinish={finishOnboarding}
      />
    </Page>
  );
}

/* ===========================
   STEP 2 – WIDGET INSTALL
=========================== */
function WidgetInstallStep({ enabled, onOpenEditor, onFinish, onBack }) {
  return (
    <Card padding="600">
      <InlineGrid columns="2fr 3fr" gap="600" alignItems="center" style={{ minHeight: 360 }} >
        {/* ================= LEFT SIDE (VIDEO) ================= */}
        <div
          style={{
            position: "relative",
            minHeight: 360,
            paddingBottom: "56.25%",
            height: 0,
            overflow: "hidden",
            borderRadius: 12,
            background: "#000",
          }}
        >
          <iframe
            src="https://www.youtube.com/embed/a3ICNMQW7Ok"
            title="Smart Nest Installation"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: 0,
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* ================= RIGHT SIDE (CONTENT) ================= */}
        <BlockStack gap="400" style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 10
        }}>
          {/* TOP CONTENT */}
          <BlockStack gap="400">
            <Text variant="headingLg">Install Smart Nest Widget</Text>

            <Text tone="subdued">
              Add the Smart Nest widget to your collection page so customers can
              view child collections.
            </Text>

            <BlockStack gap="200">
              <Text>1. Click on the button below to open a new window.</Text>
              <Text>
                2. Check if the <strong>Widget</strong> block is present.
              </Text>
              <Text>
                3. Click <strong>Save</strong>, return here and click Continue.
              </Text>
            </BlockStack>

            {enabled ? (
              <InlineStack align="start" style={{ marginTop: "auto" }}>
                <Banner status="success">Widget Installed</Banner>
              </InlineStack>
            ) : (
              <InlineStack align="start" style={{ marginTop: "auto" }}>
                <Button primary onClick={onOpenEditor}>
                  Open Collection Editor
                </Button>
              </InlineStack>
            )}
          </BlockStack>

          {/* 👇 BOTTOM FIXED BUTTON */}
          <div style={{ marginTop: "auto" }}>
            <Button primary disabled={!enabled} onClick={onFinish}>
              Finish
            </Button>
          </div>
        </BlockStack>
      </InlineGrid>
    </Card>
  );
}