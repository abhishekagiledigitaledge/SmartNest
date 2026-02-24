import { useNavigate, useLoaderData } from "@remix-run/react";
import {
  Page,
  Card,
  Button,
  Text,
  Banner,
  InlineStack,
  BlockStack,
  Spinner,
  Modal,
} from "@shopify/polaris";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "@remix-run/react";
import { InlineGrid } from "@shopify/polaris";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";


/* ===========================
   LOADER (REQUIRED)
=========================== */
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  const backendUrl = process.env.BACKEND_URL || "https://subcollection.allgovjobs.com/backend";
  return json({ backendUrl });
};

/* ===========================
   ONBOARDING PAGE
=========================== */
export default function OnboardingPage() {
  const [widgetEnabled, setWidgetEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const SHOP = searchParams.get("shop");
  const navigate = useNavigate();
  const { backendUrl } = useLoaderData();

  const checkWidget = useCallback(() => {
    if (!SHOP) return;
    fetch(`${backendUrl}/api/check-widget?shop=${SHOP}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.installed) {
          setWidgetEnabled(true);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [SHOP, backendUrl]);

  // Initial check + poll every 5 seconds until widget is detected
  useEffect(() => {
    checkWidget();
    const interval = setInterval(() => {
      checkWidget();
    }, 5000);
    return () => clearInterval(interval);
  }, [checkWidget]);

  // Stop polling once widget is enabled
  useEffect(() => {
    if (widgetEnabled) return;
  }, [widgetEnabled]);


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
        loading={loading}
        onOpenEditor={openCollectionEditor}
        onFinish={finishOnboarding}
      />
    </Page>
  );
}

/* ===========================
   STEP 2 – WIDGET INSTALL
=========================== */
function WidgetInstallStep({ enabled, loading, onOpenEditor, onFinish, onBack }) {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const toggleModal = useCallback(() => setIsVideoModalOpen((active) => !active), []);

  return (
    <Card padding="600">
      <InlineGrid columns={{ xs: "1fr", md: "1fr 1fr" }} gap="800" alignItems="center" style={{ minHeight: 360 }} >
        {/* ================= LEFT SIDE (VIDEO) ================= */}
        <BlockStack gap="400">
          <div
            style={{
              position: "relative",
              paddingBottom: "56.25%",
              height: 0,
              overflow: "hidden",
              borderRadius: 12,
              background: "#000",
            }}
          >
            <video
              src="https://agiledigitaledge.dev/smartnestvideos/video.mp4"
              title="Smart Nest Installation"
              autoPlay
              loop
              muted
              playsInline
              controls
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: 0,
              }}
            />
          </div>
          <InlineStack align="center">
            <Button onClick={toggleModal} variant="plain">
              Watch enlarged video
            </Button>
          </InlineStack>

          <Modal
            size="large"
            open={isVideoModalOpen}
            onClose={toggleModal}
            title="Smart Nest Installation Guide"
          >
            <Modal.Section>
              <video
                src="https://agiledigitaledge.dev/smartnestvideos/video.mp4"
                title="Smart Nest Installation"
                autoPlay
                controls
                style={{ width: "100%", borderRadius: 8, display: "block" }}
              />
            </Modal.Section>
          </Modal>
        </BlockStack>

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
              Follow the steps below to add the Smart Nest widget to your
              collection page. This lets your customers browse child
              (sub) collections directly on any collection page.
            </Text>

            <BlockStack gap="300">
              <Text>
                <strong>Step 1:</strong> Click the{" "}
                <strong>"Open Collection Editor"</strong> button below. This
                will open your Shopify Theme Editor in a new tab, pre‑set to
                the <strong>Collection template</strong>.
              </Text>
              <Text>
                <strong>Step 2:</strong> In the Theme Editor left sidebar, click{" "}
                <strong>"+ Add block"</strong> (or <strong>"Add section"</strong>
                ) to see the list of available blocks.
              </Text>
              <Text>
                <strong>Step 3:</strong> Search for or scroll to the{" "}
                <strong>"Sub Collection Support"</strong> app block and click it to add it
                to the template.
              </Text>
              <Text>
                <strong>Step 4:</strong> Drag the Sub Collection Support block to your
                preferred position on the collection page (we recommend placing
                it just below the collection title/banner).
              </Text>
              <Text>
                <strong>Step 5:</strong> Click the <strong>"Save"</strong>{" "}
                button in the top‑right corner of the Theme Editor.
              </Text>
              <Text>
                <strong>Step 6:</strong> Return to this page — it will
                automatically detect the widget and show{" "}
                <strong>"Widget Installed"</strong>. If it doesn't appear
                within a few seconds, refresh the page. Then click{" "}
                <strong>"Finish"</strong> to complete the setup.
              </Text>
            </BlockStack>

            {loading ? (
              <InlineStack align="start" gap="300" style={{ marginTop: "auto" }}>
                <Spinner size="small" />
                <Text tone="subdued">Checking widget status…</Text>
              </InlineStack>
            ) : enabled ? (
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